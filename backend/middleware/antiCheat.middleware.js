const antiCheatService = require('../services/antiCheat.service');
const { select, insert } = require('../utils/supabaseDb');

/**
 * Middleware to detect tab switching
 */
const detectTabSwitching = (req, res, next) => {
  // In a real implementation, this would be handled on the client side
  // and reported via API calls to special endpoints
  next();
};

/**
 * Middleware to prevent copy/paste in coding challenges
 */
const preventCopyPaste = (req, res, next) => {
  // In a real implementation, this would be handled on the client side
  // with event listeners that prevent copy/paste actions
  next();
};

/**
 * Middleware to validate game timing using backend timer
 */
const validateGameTiming = async (req, res, next) => {
  try {
    const { gameId, sessionId } = req.body;
    
    // Skip timing validation if not applicable
    if (!gameId || !sessionId) {
      return next();
    }
    
    // In a real implementation, you would fetch session data from database
    // and compare with the backend timer
    
    next();
  } catch (error) {
    console.error('Timing validation error:', error);
    next();
  }
};

/**
 * Middleware to validate device fingerprint
 */
const validateDeviceFingerprint = async (req, res, next) => {
  try {
    const { deviceInfo } = req.body;
    const userId = req.user?.uid;
    
    // Skip if no device info or user
    if (!deviceInfo || !userId) {
      return next();
    }
    
    // Generate fingerprint
    const fingerprint = antiCheatService.generateDeviceFingerprint(deviceInfo);
    
    // Check for duplicate accounts
    const isDuplicate = await antiCheatService.checkForDuplicateAccounts(select, fingerprint, userId);
    
    if (isDuplicate) {
      return res.status(403).json({ 
        message: 'Duplicate account detected. Access denied.' 
      });
    }
    
    // Add fingerprint to request for use in other middleware/controllers
    req.deviceFingerprint = fingerprint;
    
    next();
  } catch (error) {
    console.error('Device fingerprint validation error:', error);
    next();
  }
};

/**
 * Middleware to validate game results for cheating
 */
const validateGameResult = (req, res, next) => {
  try {
    const gameResult = req.body;
    
    // Skip validation if not a game result submission
    if (!gameResult.gameId) {
      return next();
    }
    
    // In a real implementation, you would have more detailed metadata
    const gameMetadata = {
      expectedTime: gameResult.expectedTime || 60000, // 1 minute default
      maxScore: gameResult.maxScore || 100
    };
    
    const validationResult = antiCheatService.validateGameResult(gameResult, gameMetadata);
    
    // For high risk, reject immediately
    if (validationResult.riskLevel === 'high') {
      return res.status(400).json({ 
        message: 'Suspicious activity detected. Result rejected.',
        issues: validationResult.issues
      });
    }
    
    // For medium risk, add warning but allow
    if (validationResult.riskLevel === 'medium') {
      req.cheatWarning = {
        level: 'medium',
        issues: validationResult.issues
      };
    }
    
    next();
  } catch (error) {
    console.error('Game result validation error:', error);
    next();
  }
};

/**
 * Middleware to log suspicious activity
 */
const logSuspiciousActivity = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    const activity = req.suspiciousActivity;
    
    // Skip if no suspicious activity to log
    if (!activity || !userId) {
      return next();
    }
    
    // Log to database
    await insert('suspicious_activities', {
      user_id: userId,
      activity,
      timestamp: new Date(),
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    next();
  } catch (error) {
    console.error('Suspicious activity logging error:', error);
    next();
  }
};

module.exports = {
  detectTabSwitching,
  preventCopyPaste,
  validateGameTiming,
  validateDeviceFingerprint,
  validateGameResult,
  logSuspiciousActivity
};