const { select, update } = require('../utils/supabaseDb');
const Transaction = require('../models/transaction.model');
const razorpayService = require('../services/razorpay.service');

// Approve withdrawal request
const approveWithdrawal = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Get transaction
    const transactionRecords = await select('transactions', { id: transactionId }, { limit: 1 });
    
    if (transactionRecords.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transactionData = transactionRecords[0];
    const transaction = new Transaction({
      transactionId: transactionData.id,
      ...transactionData
    });
    
    // Check if it's a withdrawal transaction
    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ message: 'Transaction is not a withdrawal request' });
    }
    
    // Check if it's pending approval
    if (transaction.metadata.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Withdrawal request is not pending approval' });
    }
    
    // Process withdrawal through Razorpay
    const result = await razorpayService.processWithdrawal(
      transactionId,
      transaction.amount,
      transaction.metadata.bankDetails
    );
    
    // Update transaction metadata
    await update('transactions', { id: transactionId }, {
      metadata: {
        ...transaction.metadata,
        status: 'approved',
        approved_at: new Date(),
        approved_by: req.user.uid
      },
      updated_at: new Date()
    });
    
    res.status(200).json({
      message: 'Withdrawal request approved successfully',
      result
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ message: 'Internal server error while approving withdrawal request' });
  }
};

// Reject withdrawal request
const rejectWithdrawal = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    
    // Get transaction
    const transactionRecords = await select('transactions', { id: transactionId }, { limit: 1 });
    
    if (transactionRecords.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transactionData = transactionRecords[0];
    const transaction = new Transaction({
      transactionId: transactionData.id,
      ...transactionData
    });
    
    // Check if it's a withdrawal transaction
    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ message: 'Transaction is not a withdrawal request' });
    }
    
    // Check if it's pending approval
    if (transaction.metadata.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Withdrawal request is not pending approval' });
    }
    
    // Refund amount to user's wallet
    const walletRecords = await select('wallets', { user_id: transaction.userId }, { limit: 1 });
    
    if (walletRecords.length > 0) {
      const walletData = walletRecords[0];
      const newBalance = walletData.balance + transaction.amount;
      
      await update('wallets', { user_id: transaction.userId }, {
        balance: newBalance,
        updated_at: new Date()
      });
    }
    
    // Update transaction metadata
    await update('transactions', { id: transactionId }, {
      metadata: {
        ...transaction.metadata,
        status: 'rejected',
        rejected_at: new Date(),
        rejected_by: req.user.uid,
        rejection_reason: reason || 'No reason provided'
      },
      updated_at: new Date()
    });
    
    res.status(200).json({
      message: 'Withdrawal request rejected successfully',
      refundedAmount: transaction.amount
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ message: 'Internal server error while rejecting withdrawal request' });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;
    
    // Get original transaction
    const transactionRecords = await select('transactions', { id: transactionId }, { limit: 1 });
    
    if (transactionRecords.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transactionData = transactionRecords[0];
    const transaction = new Transaction({
      transactionId: transactionData.id,
      ...transactionData
    });
    
    // Create refund through Razorpay
    const refund = await razorpayService.refundPayment(
      transaction.metadata.razorpay_payment_id,
      amount,
      {
        user_id: transaction.userId,
        reason: reason || 'Admin initiated refund',
        original_transaction_id: transactionId
      }
    );
    
    res.status(200).json({
      message: 'Refund processed successfully',
      refundId: refund.id
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Internal server error while processing refund' });
  }
};

module.exports = {
  approveWithdrawal,
  rejectWithdrawal,
  processRefund
};