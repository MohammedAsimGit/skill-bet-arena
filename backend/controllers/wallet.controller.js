const { getWallet, updateWallet, getTransactions, insert, update, select } = require('../utils/supabaseDb');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const razorpayService = require('../services/razorpay.service');

// Get user wallet
const getWallet = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get or create wallet
    let walletData = await getWallet(userId);
    
    if (!walletData) {
      // Create new wallet
      const wallet = new Wallet({ userId });
      const walletRecord = await insert('wallets', wallet.toObject());
      return res.status(200).json({ wallet: walletRecord });
    }
    
    res.status(200).json({ wallet: walletData });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Internal server error while fetching wallet' });
  }
};

// Add money to wallet
const addMoney = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { amount, paymentMethod } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    // Create Razorpay order using our service
    const order = await razorpayService.createOrder(amount, 'INR');
    
    // Create pending transaction
    const transaction = new Transaction({
      userId,
      type: 'deposit',
      amount,
      paymentMethod: paymentMethod || 'razorpay',
      description: `Deposit of ₹${amount}`,
      referenceId: order.id,
      metadata: {
        razorpayOrderId: order.id
      }
    });
    
    const transactionRecord = await insert('transactions', transaction.toObject());
    
    res.status(200).json({
      message: 'Order created successfully',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Add money error:', error);
    res.status(500).json({ message: 'Internal server error while processing payment' });
  }
};

// Verify payment and update wallet
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify payment signature using our service
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature
    );
    
    if (!isValidSignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }
    
    // Find transaction
    const transactions = await select('transactions', 
      { 'metadata->>razorpayOrderId': razorpay_order_id }, 
      { limit: 1 }
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transactionData = transactions[0];
    const transaction = Transaction.fromDocument({ id: transactionData.id, data: () => transactionData });
    
    // Update transaction
    transaction.complete({
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });
    
    await update('transactions', { id: transaction.transactionId }, transaction.toObject());
    
    // Update wallet
    const userId = transaction.userId;
    let walletData = await getWallet(userId);
    
    let wallet;
    if (!walletData) {
      wallet = new Wallet({ userId });
    } else {
      wallet = new Wallet(walletData);
    }
    
    wallet.addFunds(transaction.amount);
    await updateWallet(userId, wallet.toObject());
    
    res.status(200).json({
      message: 'Payment verified and wallet updated successfully',
      transactionId: transaction.transactionId,
      balance: wallet.balance
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Internal server error while verifying payment' });
  }
};

// Request withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { amount, withdrawalMethod, bankDetails } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    // Get wallet
    const walletData = await getWallet(userId);
    
    if (!walletData) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    const wallet = new Wallet(walletData);
    
    // Check balance
    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Create withdrawal transaction
    const transaction = new Transaction({
      userId,
      type: 'withdrawal',
      amount,
      paymentMethod: withdrawalMethod || 'bank_transfer',
      description: `Withdrawal request of ₹${amount}`,
      metadata: {
        bankDetails: bankDetails || {},
        status: 'pending_approval'
      }
    });
    
    const transactionRecord = await insert('transactions', transaction.toObject());
    
    // Deduct amount from wallet immediately
    const newBalance = wallet.balance - amount;
    await updateWallet(userId, {
      balance: newBalance,
      total_withdrawals: wallet.totalWithdrawals + amount,
      updated_at: new Date()
    });
    
    res.status(200).json({
      message: 'Withdrawal request submitted successfully',
      transactionId: transaction.transactionId
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ message: 'Internal server error while processing withdrawal request' });
  }
};

// Get transaction history
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get transactions
    const transactions = await getTransactions(userId, 50);
    
    const transactionObjects = transactions.map(tx => {
      const transaction = Transaction.fromDocument({ id: tx.id, data: () => tx });
      return transaction.toObject();
    });
    
    res.status(200).json({ transactions: transactionObjects });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ message: 'Internal server error while fetching transaction history' });
  }
};

module.exports = {
  getWallet,
  addMoney,
  verifyPayment,
  requestWithdrawal,
  getTransactionHistory
};