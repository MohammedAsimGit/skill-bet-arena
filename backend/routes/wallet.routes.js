const express = require('express');
const { 
  getWallet, 
  addMoney, 
  verifyPayment, 
  requestWithdrawal, 
  getTransactionHistory 
} = require('../controllers/wallet.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Protected routes
router.get('/', authenticateToken, getWallet);
router.post('/add', authenticateToken, addMoney);
router.post('/verify', authenticateToken, verifyPayment);
router.post('/withdraw', authenticateToken, requestWithdrawal);
router.get('/transactions', authenticateToken, getTransactionHistory);

module.exports = router;