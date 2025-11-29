const express = require('express');
const { 
  getAllGames,
  getGameById,
  getCodingChallenge,
  getMathQuiz,
  getMemoryPatternGame,
  getTypingSpeedTest,
  submitCodingSolution,
  submitMathQuizAnswers,
  submitMemoryPatternResult,
  submitTypingSpeedResult,
  submitGameResult
} = require('../controllers/game.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getAllGames);
router.get('/:gameId', getGameById);

// Game-specific routes
router.get('/coding/challenge', getCodingChallenge);
router.get('/maths/quiz', getMathQuiz);
router.get('/memory/game', getMemoryPatternGame);
router.get('/typing/test', getTypingSpeedTest);

// Protected routes
router.post('/coding/submit', authenticateToken, submitCodingSolution);
router.post('/maths/submit', authenticateToken, submitMathQuizAnswers);
router.post('/memory/submit', authenticateToken, submitMemoryPatternResult);
router.post('/typing/submit', authenticateToken, submitTypingSpeedResult);
router.post('/result', authenticateToken, submitGameResult);

module.exports = router;