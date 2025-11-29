const { select, insert, update, remove } = require('../utils/supabaseDb');
const { getUserById: getSupabaseUser, updateUser } = require('../utils/supabaseAuth');
const Contest = require('../models/contest.model');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');

// Admin middleware (simplified for this example)
const isAdmin = async (req, res, next) => {
  try {
    // In a real implementation, you would check against an admins collection
    // For now, we'll assume the first user is admin or check a special header
    const adminEmails = ['admin@skillbetarena.com']; // This should come from env or DB
    
    if (adminEmails.includes(req.user.email)) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during admin check' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const users = await select('users', {}, { 
      orderBy: 'created_at', 
      ascending: false, 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    const userObjects = users.map(userData => {
      const user = new User({
        uid: userData.id,
        ...userData
      });
      return user.toObject();
    });
    
    res.status(200).json({ users: userObjects });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error while fetching users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userRecords[0];
    const user = new User({
      uid: userData.id,
      ...userData
    });
    res.status(200).json({ user: user.toObject() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error while fetching user' });
  }
};

// Ban user
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Update user in database
    await update('users', { id: userId }, {
      is_banned: true,
      banned_at: new Date(),
      ban_reason: reason || 'Violated terms of service',
      updated_at: new Date()
    });
    
    // Disable user in Supabase Auth
    await updateUser(userId, {
      disabled: true
    });
    
    res.status(200).json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Internal server error while banning user' });
  }
};

// Unban user
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Update user in database
    await update('users', { id: userId }, {
      is_banned: false,
      unbanned_at: new Date(),
      ban_reason: '',
      updated_at: new Date()
    });
    
    // Enable user in Supabase Auth
    await updateUser(userId, {
      disabled: false
    });
    
    res.status(200).json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ message: 'Internal server error while unbanning user' });
  }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const transactions = await select('transactions', filters, { 
      orderBy: 'created_at', 
      ascending: false, 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    const transactionObjects = transactions.map(txData => {
      const transaction = new Transaction({
        transactionId: txData.id,
        ...txData
      });
      return transaction.toObject();
    });
    
    res.status(200).json({ transactions: transactionObjects });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Internal server error while fetching transactions' });
  }
};

// Approve withdrawal
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
    
    // Check if it's a withdrawal request
    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ message: 'Transaction is not a withdrawal request' });
    }
    
    // Update transaction status
    transaction.complete({ approvedBy: req.user.uid });
    await update('transactions', { id: transactionId }, transaction.toObject());
    
    res.status(200).json({
      message: 'Withdrawal approved successfully',
      transaction: transaction.toObject()
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ message: 'Internal server error while approving withdrawal' });
  }
};

// Reject withdrawal
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
    
    // Check if it's a withdrawal request
    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ message: 'Transaction is not a withdrawal request' });
    }
    
    // Update transaction status
    transaction.fail(reason || 'Withdrawal rejected by admin');
    await update('transactions', { id: transactionId }, transaction.toObject());
    
    // Refund amount to user's wallet
    const userId = transaction.userId;
    const walletRecords = await select('wallets', { user_id: userId }, { limit: 1 });
    
    let wallet;
    if (walletRecords.length === 0) {
      wallet = new Wallet({ userId });
    } else {
      const walletData = walletRecords[0];
      wallet = new Wallet(walletData);
    }
    
    wallet.addFunds(transaction.amount);
    await update('wallets', { user_id: userId }, wallet.toObject());
    
    res.status(200).json({
      message: 'Withdrawal rejected and amount refunded',
      transaction: transaction.toObject()
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ message: 'Internal server error while rejecting withdrawal' });
  }
};

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
    // Get total users
    const users = await select('users', {});
    const totalUsers = users.length;
    
    // Get total contests
    const contests = await select('contests', {});
    const totalContests = contests.length;
    
    // Get total transactions
    const transactions = await select('transactions', {});
    const totalTransactions = transactions.length;
    
    // Calculate total revenue (simplified)
    let totalRevenue = 0;
    transactions.forEach(txData => {
      const transaction = new Transaction({
        transactionId: txData.id,
        ...txData
      });
      if (transaction.type === 'contest_entry' && transaction.status === 'completed') {
        // This is a simplified calculation - in reality, you'd need to calculate commission
        totalRevenue += transaction.amount * 0.1; // 10% commission
      }
    });
    
    res.status(200).json({
      stats: {
        totalUsers,
        totalContests,
        totalTransactions,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ message: 'Internal server error while fetching platform stats' });
  }
};

// Create contest
const createContest = async (req, res) => {
  try {
    const { title, description, gameType, entryFee, prizePool, maxPlayers, startTime, duration } = req.body;
    
    // Validate required fields
    if (!title || !gameType || entryFee === undefined || prizePool === undefined || maxPlayers === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create contest
    const contest = new Contest({
      title,
      description,
      game_type: gameType,
      entry_fee: entryFee,
      prize_pool: prizePool,
      max_players: maxPlayers,
      start_time: startTime ? new Date(startTime) : new Date(),
      duration,
      created_by: req.user.uid,
      status: 'upcoming'
    });
    
    // Save to database
    const contestRecord = await insert('contests', contest.toObject());
    
    res.status(201).json({
      message: 'Contest created successfully',
      contestId: contestRecord.id,
      contest: { ...contest.toObject(), id: contestRecord.id }
    });
  } catch (error) {
    console.error('Create contest error:', error);
    res.status(500).json({ message: 'Internal server error while creating contest' });
  }
};

// Update contest
const updateContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;
    
    // Add updated timestamp
    updates.updated_at = new Date();
    
    // Update contest
    await update('contests', { id: contestId }, updates);
    
    res.status(200).json({ message: 'Contest updated successfully' });
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(500).json({ message: 'Internal server error while updating contest' });
  }
};

// Delete contest
const deleteContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    
    // Delete contest
    await remove('contests', { id: contestId });
    
    res.status(200).json({ message: 'Contest deleted successfully' });
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json({ message: 'Internal server error while deleting contest' });
  }
};

// Get all contests
const getAllContests = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    const contests = await select('contests', filters, { 
      orderBy: 'created_at', 
      ascending: false, 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    const contestObjects = contests.map(contestData => {
      const contest = new Contest({
        contestId: contestData.id,
        ...contestData
      });
      return contest.toObject();
    });
    
    res.status(200).json({ contests: contestObjects });
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ message: 'Internal server error while fetching contests' });
  }
};

// Get contest by ID
const getContestById = async (req, res) => {
  try {
    const { contestId } = req.params;
    
    const contestRecords = await select('contests', { id: contestId }, { limit: 1 });
    
    if (contestRecords.length === 0) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    const contestData = contestRecords[0];
    const contest = new Contest({
      contestId: contestData.id,
      ...contestData
    });
    res.status(200).json({ contest: contest.toObject() });
  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json({ message: 'Internal server error while fetching contest' });
  }
};

// Issue refund or bonus
const issueRefundOrBonus = async (req, res) => {
  try {
    const { userId, amount, type, reason, notes } = req.body;
    
    // Validate required fields
    if (!userId || !amount || !type) {
      return res.status(400).json({ message: 'Missing required fields: userId, amount, type' });
    }
    
    if (type !== 'refund' && type !== 'bonus') {
      return res.status(400).json({ message: 'Invalid type. Must be "refund" or "bonus"' });
    }
    
    // Get user's wallet
    const walletRecords = await select('wallets', { user_id: userId }, { limit: 1 });
    
    let wallet;
    if (walletRecords.length === 0) {
      wallet = new Wallet({ userId });
    } else {
      const walletData = walletRecords[0];
      wallet = new Wallet(walletData);
    }
    
    // Add funds for bonus or refund
    if (type === 'bonus' || type === 'refund') {
      wallet.addFunds(amount);
    }
    
    // Save updated wallet
    await update('wallets', { user_id: userId }, wallet.toObject());
    
    // Create transaction record
    const transaction = new Transaction({
      user_id: userId,
      type: type === 'refund' ? 'refund' : 'bonus',
      amount,
      currency: 'INR',
      status: 'completed',
      description: reason || `${type.charAt(0).toUpperCase() + type.slice(1)} issued by admin`,
      reference_id: `ADMIN-${type.toUpperCase()}-${Date.now()}`,
      metadata: {
        issued_by: req.user.uid,
        notes: notes || ''
      }
    });
    
    const transactionRecord = await insert('transactions', transaction.toObject());
    
    res.status(200).json({
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} issued successfully`,
      transaction: transactionRecord
    });
  } catch (error) {
    console.error('Issue refund/bonus error:', error);
    res.status(500).json({ message: 'Internal server error while issuing refund/bonus' });
  }
};

// Get admin dashboard data
const getAdminDashboard = async (req, res) => {
  try {
    // Get platform stats
    const users = await select('users', {});
    const totalUsers = users.length;
    
    const contests = await select('contests', {});
    const totalContests = contests.length;
    
    const transactions = await select('transactions', {});
    const totalTransactions = transactions.length;
    
    // Calculate recent activity (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentUsers = await select('users', { created_at: { gte: oneWeekAgo } });
    const recentContests = await select('contests', { created_at: { gte: oneWeekAgo } });
    
    // Get recent transactions
    const recentTransactions = await select('transactions', {}, { 
      orderBy: 'created_at', 
      ascending: false, 
      limit: 10 
    });
    
    const recentTransactionObjects = recentTransactions.map(txData => {
      const transaction = new Transaction({
        transactionId: txData.id,
        ...txData
      });
      return transaction.toObject();
    });
    
    res.status(200).json({
      dashboard: {
        stats: {
          totalUsers,
          totalContests,
          totalTransactions,
          newUsers: recentUsers.length,
          newContests: recentContests.length
        },
        recentTransactions: recentTransactionObjects
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Internal server error while fetching admin dashboard' });
  }
};

module.exports = {
  isAdmin,
  getAllUsers,
  getUserById,
  banUser,
  unbanUser,
  getAllTransactions,
  approveWithdrawal,
  rejectWithdrawal,
  getPlatformStats,
  createContest,
  updateContest,
  deleteContest,
  getAllContests,
  getContestById,
  issueRefundOrBonus,
  getAdminDashboard
};