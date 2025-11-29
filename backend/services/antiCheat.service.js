class AntiCheatService {
  /**
   * Generate device fingerprint based on browser and system properties
   * @param {Object} deviceInfo - Device information from client
   * @returns {string} Device fingerprint hash
   */
  generateDeviceFingerprint(deviceInfo) {
    // In a real implementation, you would use a more sophisticated fingerprinting method
    // This is a simplified version for demonstration
    const fingerprintData = [
      deviceInfo.userAgent || '',
      deviceInfo.language || '',
      deviceInfo.platform || '',
      deviceInfo.screenWidth || '',
      deviceInfo.screenHeight || '',
      deviceInfo.timezoneOffset || '',
      deviceInfo.canvasFingerprint || '',
      deviceInfo.webglFingerprint || ''
    ].join('|');
    
    // Simple hash function (in production, use a proper cryptographic hash)
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Check for duplicate accounts based on device fingerprint
   * @param {Function} select - Supabase select function
   * @param {string} fingerprint - Device fingerprint
   * @param {string} userId - Current user ID
   * @returns {Promise<boolean>} True if duplicate account detected
   */
  async checkForDuplicateAccounts(select, fingerprint, userId) {
    try {
      // Query the database for users with the same device fingerprint
      const users = await select('users', { device_fingerprint: fingerprint });
      
      // Check if any of the users are different from the current user
      const duplicateAccounts = users.filter(user => user.id !== userId);
      
      return duplicateAccounts.length > 0;
    } catch (error) {
      console.error('Error checking for duplicate accounts:', error);
      return false; // Return false in case of error to avoid blocking legitimate users
    }
  }

  /**
   * Validate game result for cheating
   * @param {Object} gameResult - Game result data
   * @param {Object} gameMetadata - Game metadata and timing info
   * @returns {Object} Validation result
   */
  validateGameResult(gameResult, gameMetadata) {
    const issues = [];
    
    // Check for suspicious timing
    if (gameMetadata.startTime && gameMetadata.endTime) {
      const timeTaken = gameMetadata.endTime - gameMetadata.startTime;
      const expectedTime = gameMetadata.expectedTime || 60000; // 1 minute default
      
      // If time is suspiciously fast (less than 10% of expected time)
      if (timeTaken < expectedTime * 0.1) {
        issues.push('Suspiciously fast completion time');
      }
      
      // If time is negative (impossible)
      if (timeTaken < 0) {
        issues.push('Invalid timing data');
      }
    }
    
    // Check for suspicious score
    if (gameResult.score !== undefined) {
      const maxPossibleScore = gameMetadata.maxScore || 100;
      
      // If score exceeds maximum possible
      if (gameResult.score > maxPossibleScore) {
        issues.push('Score exceeds maximum possible value');
      }
      
      // If score is negative (impossible)
      if (gameResult.score < 0) {
        issues.push('Invalid score value');
      }
    }
    
    // Check for pattern-based cheating (for games with patterns)
    if (gameResult.pattern && gameMetadata.pattern) {
      // Simple pattern comparison (in reality, this would be more complex)
      if (JSON.stringify(gameResult.pattern) === JSON.stringify(gameMetadata.pattern)) {
        // This is expected - user correctly repeated the pattern
      } else {
        // Check if the pattern is suspiciously similar or follows a simple rule
        issues.push('Pattern validation required');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      riskLevel: this.calculateRiskLevel(issues)
    };
  }

  /**
   * Calculate risk level based on issues
   * @param {Array} issues - Array of detected issues
   * @returns {string} Risk level (low, medium, high)
   */
  calculateRiskLevel(issues) {
    if (issues.length === 0) return 'low';
    if (issues.length <= 2) return 'medium';
    return 'high';
  }

  /**
   * Record tab switch event
   * @param {string} userId - User ID
   * @param {string} gameId - Game ID
   * @param {Object} eventData - Event data
   * @returns {Promise<void>}
   */
  async recordTabSwitch(userId, gameId, eventData) {
    // In a real implementation, you would save this to the database
    console.log(`Tab switch detected for user ${userId} in game ${gameId}`, eventData);
  }

  /**
   * Record copy/paste event
   * @param {string} userId - User ID
   * @param {string} gameId - Game ID
   * @param {Object} eventData - Event data
   * @returns {Promise<void>}
   */
  async recordCopyPaste(userId, gameId, eventData) {
    // In a real implementation, you would save this to the database
    console.log(`Copy/paste detected for user ${userId} in game ${gameId}`, eventData);
  }

  /**
   * Validate timing data from backend
   * @param {Object} clientTiming - Timing data from client
   * @param {Object} serverTiming - Timing data from server
   * @returns {Object} Validation result
   */
  validateTiming(clientTiming, serverTiming) {
    const discrepancies = [];
    
    // Compare start times
    if (clientTiming.startTime && serverTiming.startTime) {
      const diff = Math.abs(clientTiming.startTime - serverTiming.startTime);
      if (diff > 5000) { // 5 seconds tolerance
        discrepancies.push('Start time discrepancy detected');
      }
    }
    
    // Compare end times
    if (clientTiming.endTime && serverTiming.endTime) {
      const diff = Math.abs(clientTiming.endTime - serverTiming.endTime);
      if (diff > 5000) { // 5 seconds tolerance
        discrepancies.push('End time discrepancy detected');
      }
    }
    
    // Compare durations
    if (clientTiming.duration && serverTiming.duration) {
      const diff = Math.abs(clientTiming.duration - serverTiming.duration);
      if (diff > 5000) { // 5 seconds tolerance
        discrepancies.push('Duration discrepancy detected');
      }
    }
    
    return {
      isValid: discrepancies.length === 0,
      discrepancies
    };
  }

  /**
   * Generate backend timer for game session
   * @param {number} duration - Game duration in seconds
   * @returns {Object} Timer object
   */
  generateBackendTimer(duration) {
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    return {
      startTime,
      endTime,
      duration: duration * 1000,
      getRemainingTime: function() {
        return Math.max(0, this.endTime - Date.now());
      },
      isExpired: function() {
        return Date.now() > this.endTime;
      }
    };
  }

  /**
   * Validate user session for cheating
   * @param {Object} sessionData - User session data
   * @returns {Object} Validation result
   */
  validateUserSession(sessionData) {
    const issues = [];
    
    // Check for multiple rapid submissions
    if (sessionData.submissionHistory) {
      const recentSubmissions = sessionData.submissionHistory.filter(
        submission => (Date.now() - submission.timestamp) < 60000 // Last minute
      );
      
      if (recentSubmissions.length > 5) {
        issues.push('Too many rapid submissions');
      }
    }
    
    // Check for suspicious IP changes
    if (sessionData.ipHistory && sessionData.ipHistory.length > 1) {
      const recentIPs = sessionData.ipHistory.slice(-3); // Last 3 IPs
      if (new Set(recentIPs).size > 2) {
        issues.push('Multiple IP addresses detected');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      riskLevel: this.calculateRiskLevel(issues)
    };
  }
}

module.exports = new AntiCheatService();