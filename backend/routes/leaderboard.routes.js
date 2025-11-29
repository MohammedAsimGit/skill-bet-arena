const express = require('express');
const { 
  getGlobalLeaderboard,
  getUserRank,
  getUserPerformance
} = require('../controllers/leaderboard.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getGlobalLeaderboard);

// Protected routes
router.get('/:leaderboardId/rank', authenticateToken, getUserRank);
router.get('/user/performance', authenticateToken, getUserPerformance);

module.exports = router;