const express = require('express');
const { 
  getSubscriptionPlans,
  purchaseSubscription,
  verifySubscriptionPayment,
  getSubscriptionStatus,
  cancelSubscription
} = require('../controllers/subscription.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authenticateToken);

// Get available subscription plans
router.get('/plans', getSubscriptionPlans);

// Purchase a subscription
router.post('/purchase', purchaseSubscription);

// Verify subscription payment
router.post('/verify-payment', verifySubscriptionPayment);

// Get user subscription status
router.get('/status', getSubscriptionStatus);

// Cancel subscription
router.post('/cancel', cancelSubscription);

module.exports = router;