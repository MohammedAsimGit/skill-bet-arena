const Razorpay = require('razorpay');
const crypto = require('crypto');
const { select, insert, update } = require('../utils/supabaseDb');

class RazorpayService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  // Create a new order
  async createOrder(amount, currency = 'INR', receipt = null) {
    try {
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt: receipt || `receipt_${Date.now()}_${Math.floor(Math.random() * 10000)}`
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  // Verify payment signature
  verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + '|' + paymentId)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      throw new Error(`Failed to verify payment signature: ${error.message}`);
    }
  }

  // Capture a payment
  async capturePayment(paymentId, amount, currency = 'INR') {
    try {
      const result = await this.razorpay.payments.capture(paymentId, amount * 100, currency);
      return result;
    } catch (error) {
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  // Refund a payment
  async refundPayment(paymentId, amount = null, notes = {}) {
    try {
      const options = {
        payment_id: paymentId
      };

      if (amount) {
        options.amount = amount * 100; // Razorpay expects amount in paise
      }

      if (notes) {
        options.notes = notes;
      }

      const refund = await this.razorpay.refunds.create(options);
      return refund;
    } catch (error) {
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  // Process withdrawal request
  async processWithdrawal(transactionId, amount, bankAccount) {
    try {
      // In a real implementation, you would use Razorpay's transfer or payout APIs
      // For now, we'll simulate the process
      
      // Update transaction status to processing
      await update('transactions', { id: transactionId }, {
        status: 'processing',
        metadata: {
          processing_started_at: new Date()
        }
      });
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update transaction status to completed
      await update('transactions', { id: transactionId }, {
        status: 'completed',
        metadata: {
          processed_at: new Date()
        }
      });
      
      return { success: true, message: 'Withdrawal processed successfully' };
    } catch (error) {
      // Update transaction status to failed
      await update('transactions', { id: transactionId }, {
        status: 'failed',
        metadata: {
          failure_reason: error.message,
          failed_at: new Date()
        }
      });
      
      throw new Error(`Failed to process withdrawal: ${error.message}`);
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  }

  // Handle webhook events
  async handleWebhookEvent(event) {
    try {
      switch (event.event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.payload.payment.entity);
          break;
        case 'refund.created':
          await this.handleRefundCreated(event.payload.refund.entity);
          break;
        default:
          console.log(`Unhandled Razorpay webhook event: ${event.event}`);
      }
    } catch (error) {
      console.error('Error handling Razorpay webhook:', error);
      throw error;
    }
  }

  // Handle successful payment
  async handlePaymentCaptured(payment) {
    try {
      // Update transaction in database
      const transactions = await select('transactions', { reference_id: payment.order_id }, { limit: 1 });
      
      if (transactions.length > 0) {
        const transactionData = transactions[0];
        
        await update('transactions', { id: transactionData.id }, {
          status: 'completed',
          metadata: {
            ...transactionData.metadata,
            razorpay_payment_id: payment.id,
            captured_at: new Date()
          }
        });
        
        // Update user wallet if this is a deposit
        if (transactionData.type === 'deposit') {
          const wallets = await select('wallets', { user_id: transactionData.user_id }, { limit: 1 });
          
          if (wallets.length > 0) {
            const walletData = wallets[0];
            const newBalance = walletData.balance + transactionData.amount;
            
            await update('wallets', { user_id: transactionData.user_id }, {
              balance: newBalance,
              total_deposits: walletData.total_deposits + transactionData.amount,
              updated_at: new Date()
            });
          } else {
            // Create new wallet if it doesn't exist
            await insert('wallets', {
              user_id: transactionData.user_id,
              balance: transactionData.amount,
              total_deposits: transactionData.amount,
              total_withdrawals: 0,
              total_earnings: 0,
              total_spent: 0,
              currency: 'INR',
              created_at: new Date(),
              updated_at: new Date()
            });
          }
        }
        
        console.log(`Payment captured for order ${payment.order_id}`);
      }
    } catch (error) {
      console.error('Error handling payment captured:', error);
      throw error;
    }
  }

  // Handle failed payment
  async handlePaymentFailed(payment) {
    try {
      // Update transaction in database
      const transactions = await select('transactions', { reference_id: payment.order_id }, { limit: 1 });
      
      if (transactions.length > 0) {
        const transactionData = transactions[0];
        await update('transactions', { id: transactionData.id }, {
          status: 'failed',
          metadata: {
            ...transactionData.metadata,
            failure_reason: payment.error_description,
            failed_at: new Date()
          }
        });
        
        console.log(`Payment failed for order ${payment.order_id}: ${payment.error_description}`);
      }
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }

  // Handle refund creation
  async handleRefundCreated(refund) {
    try {
      // Create refund transaction in database
      const refundData = {
        transactionId: `REFUND-${refund.id}`,
        userId: refund.notes.userId || 'system',
        type: 'refund',
        amount: refund.amount / 100, // Convert from paise to rupees
        currency: refund.currency,
        status: refund.status,
        paymentMethod: 'razorpay',
        description: `Refund for payment ${refund.payment_id}`,
        referenceId: refund.payment_id,
        createdAt: new Date(refund.created_at * 1000),
        metadata: {
          razorpayRefundId: refund.id,
          refundSpeed: refund.speed,
          ...refund.notes
        }
      };
      
      await insert('transactions', refundData);
      
      // Update user wallet if refund is successful
      if (refund.status === 'processed' && refund.notes.user_id) {
        const wallets = await select('wallets', { user_id: refund.notes.user_id }, { limit: 1 });
        
        if (wallets.length > 0) {
          const walletData = wallets[0];
          const newBalance = walletData.balance + (refund.amount / 100);
          
          await update('wallets', { user_id: refund.notes.user_id }, {
            balance: newBalance,
            updated_at: new Date()
          });
        }
      }
      
      console.log(`Refund created for payment ${refund.payment_id}`);
    } catch (error) {
      console.error('Error handling refund created:', error);
      throw error;
    }
  }
}

module.exports = new RazorpayService();