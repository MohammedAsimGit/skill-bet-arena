const express = require('express');
const { 
  getAllContests,
  getContestById,
  createContest,
  joinContest,
  submitResult,
  getLeaderboard
} = require('../controllers/contest.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getAllContests);
router.get('/:contestId', getContestById);

// Protected routes
router.post('/', authenticateToken, createContest);
router.post('/:contestId/join', authenticateToken, joinContest);
router.post('/:contestId/result', authenticateToken, submitResult);
router.get('/:contestId/leaderboard', getLeaderboard);

module.exports = router;