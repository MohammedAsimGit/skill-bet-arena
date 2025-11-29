const { select, insert, update } = require('../utils/supabaseDb');
const User = require('../models/user.model');
const razorpayService = require('../services/razorpay.service');

// Subscription plans
const SUBSCRIPTION_PLANS = {
  GOLD: {
    id: 'gold_pass',
    name: 'Gold Pass',
    price: 49,
    duration: 30, // days
    features: [
      'No ads',
      'Bonus 100 coins',
      'Fast matchmaking'
    ]
  },
  ELITE: {
    id: 'elite_pass',
    name: 'Elite Pass',
    price: 149,
    duration: 30, // days
    features: [
      'Premium contests',
      'Extra rewards',
      'Special badge',
      'No ads',
      'Fast matchmaking'
    ]
  }
};

// Get subscription plans
const getSubscriptionPlans = async (req, res) => {
  try {
    res.status(200).json({
      plans: Object.values(SUBSCRIPTION_PLANS)
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ message: 'Internal server error while fetching subscription plans' });
  }
};

// Purchase subscription
const purchaseSubscription = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { planId } = req.body;
    
    // Validate plan
    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
    if (!plan) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }
    
    // Create Razorpay order
    const order = await razorpayService.createOrder(plan.price, 'INR');
    
    // Create transaction for subscription
    const transactionData = {
      user_id: userId,
      type: 'subscription',
      amount: plan.price,
      payment_method: 'razorpay',
      description: `${plan.name} subscription`,
      reference_id: order.id,
      metadata: {
        razorpay_order_id: order.id,
        plan_id: plan.id,
        plan_name: plan.name,
        duration: plan.duration
      },
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Save transaction
    const transactionRecord = await insert('transactions', transactionData);
    
    res.status(200).json({
      message: 'Subscription order created successfully',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      transactionId: transactionRecord.id,
      plan
    });
  } catch (error) {
    console.error('Purchase subscription error:', error);
    res.status(500).json({ message: 'Internal server error while processing subscription purchase' });
  }
};

// Verify subscription payment
const verifySubscriptionPayment = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;
    
    // Verify payment signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature
    );
    
    if (!isValidSignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }
    
    // Get transaction
    const transactionRecords = await select('transactions', { id: transactionId }, { limit: 1 });
    
    if (transactionRecords.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transactionData = transactionRecords[0];
    const transaction = {
      ...transactionData,
      metadata: transactionData.metadata || {}
    };
    
    // Verify this is a subscription transaction
    if (transaction.type !== 'subscription') {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }
    
    // Update transaction
    await update('transactions', { id: transactionId }, {
      status: 'completed',
      metadata: {
        ...transaction.metadata,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature
      },
      updated_at: new Date()
    });
    
    // Get user
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userRecords[0];
    const user = new User({
      uid: userData.id,
      ...userData
    });
    
    // Calculate new expiry date
    let newExpiryDate = new Date();
    
    // If user already has an active subscription, extend it
    if (user.hasActiveSubscription()) {
      newExpiryDate = new Date(user.subscriptionExpiry);
    }
    
    // Add subscription duration
    newExpiryDate.setDate(newExpiryDate.getDate() + transaction.metadata.duration);
    
    // Update user subscription
    await update('users', { id: userId }, {
      subscription_type: transaction.metadata.plan_id.replace('_pass', ''),
      subscription_expiry: newExpiryDate,
      updated_at: new Date()
    });
    
    // Add bonus coins for Gold/Elite Pass
    if (transaction.metadata.plan_id === 'gold_pass' || transaction.metadata.plan_id === 'elite_pass') {
      const walletRecords = await select('wallets', { user_id: userId }, { limit: 1 });
      
      if (walletRecords.length > 0) {
        const walletData = walletRecords[0];
        const bonusCoins = transaction.metadata.plan_id === 'gold_pass' ? 100 : 200;
        const newBalance = walletData.balance + bonusCoins;
        
        await update('wallets', { user_id: userId }, {
          balance: newBalance,
          updated_at: new Date()
        });
      }
    }
    
    res.status(200).json({
      message: 'Subscription activated successfully',
      subscription: {
        type: transaction.metadata.plan_id.replace('_pass', ''),
        expiryDate: newExpiryDate
      }
    });
  } catch (error) {
    console.error('Verify subscription payment error:', error);
    res.status(500).json({ message: 'Internal server error while verifying subscription payment' });
  }
};

// Get user subscription status
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userRecords[0];
    const user = new User({
      uid: userData.id,
      ...userData
    });
    
    res.status(200).json({
      subscription: {
        type: user.subscriptionType,
        expiryDate: user.subscriptionExpiry,
        isActive: user.hasActiveSubscription(),
        isGoldMember: user.isGoldMember(),
        isEliteMember: user.isEliteMember()
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Internal server error while fetching subscription status' });
  }
};

// Cancel subscription (future implementation)
const cancelSubscription = async (req, res) => {
  try {
    // In a real implementation, this would handle subscription cancellation
    // For now, we'll just return a success message
    res.status(200).json({ 
      message: 'Subscription cancellation functionality would be implemented here' 
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Internal server error while cancelling subscription' });
  }
};

module.exports = {
  getSubscriptionPlans,
  purchaseSubscription,
  verifySubscriptionPayment,
  getSubscriptionStatus,
  cancelSubscription
};