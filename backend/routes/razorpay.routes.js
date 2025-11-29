const express = require('express');
const razorpayService = require('../services/razorpay.service');
const crypto = require('crypto');

const router = express.Router();

// Razorpay webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!signature || !secret) {
      return res.status(400).json({ message: 'Missing signature or secret' });
    }
    
    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');
    
    // Compare signatures
    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }
    
    const event = JSON.parse(req.body);
    
    // Handle the webhook event using our service
    await razorpayService.handleWebhookEvent(event);
    
    res.status(200).json({ message: 'Webhook received and processed successfully' });
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    res.status(500).json({ message: 'Internal server error while processing webhook' });
  }
});

module.exports = router;