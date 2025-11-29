const express = require('express');
const { 
  isAdmin,
  getAllUsers,
  getUserById,
  banUser,
  unbanUser,
  getAllTransactions,
  getPlatformStats,
  createContest,
  updateContest,
  deleteContest,
  getAllContests,
  getContestById,
  issueRefundOrBonus,
  getAdminDashboard
} = require('../controllers/admin.controller');
const { 
  approveWithdrawal,
  rejectWithdrawal,
  processRefund
} = require('../controllers/admin.withdrawal.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply admin middleware to all routes in this router
router.use(authenticateToken, isAdmin);

// Admin dashboard
router.get('/dashboard', getAdminDashboard);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.post('/users/:userId/ban', banUser);
router.post('/users/:userId/unban', unbanUser);

// Transaction management
router.get('/transactions', getAllTransactions);
router.post('/transactions/:transactionId/approve', approveWithdrawal);
router.post('/transactions/:transactionId/reject', rejectWithdrawal);

// Contest management
router.post('/contests', createContest);
router.get('/contests', getAllContests);
router.get('/contests/:contestId', getContestById);
router.put('/contests/:contestId', updateContest);
router.delete('/contests/:contestId', deleteContest);

// Platform statistics
router.get('/stats', getPlatformStats);

// Admin actions
router.post('/issue-refund-bonus', issueRefundOrBonus);
router.post('/process-refund', processRefund);

module.exports = router;