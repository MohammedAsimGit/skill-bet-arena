const express = require('express');
const { 
  getUserStats,
  getUserProfile,
  updateUserPreferences
} = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authenticateToken);

// User stats
router.get('/stats', getUserStats);

// User profile
router.get('/profile', getUserProfile);

// User preferences
router.put('/preferences', updateUserPreferences);

module.exports = router;