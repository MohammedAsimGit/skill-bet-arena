class AntiCheat {
  constructor() {
    this.suspiciousActivities = [];
  }

  // Generate device fingerprint
  generateDeviceFingerprint(request) {
    const { headers, ip } = request;
    
    // Extract relevant information for fingerprinting
    const fingerprintData = {
      userAgent: headers['user-agent'] || '',
      accept: headers['accept'] || '',
      acceptLanguage: headers['accept-language'] || '',
      acceptEncoding: headers['accept-encoding'] || '',
      ip: ip || headers['x-forwarded-for'] || ''
    };
    
    // Simple hash function for fingerprint (in production, use a proper hashing library)
    const fingerprintString = JSON.stringify(fingerprintData);
    let hash = 0;
    
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Check for tab switching (this would be implemented with client-side detection)
  checkTabSwitching(userId, sessionData) {
    // In a real implementation, this would receive data from client-side monitoring
    // For now, we'll simulate with a simple check
    const suspicious = sessionData.tabSwitchCount > 3; // More than 3 switches is suspicious
    
    if (suspicious) {
      this.logSuspiciousActivity(userId, 'excessive_tab_switching', {
        count: sessionData.tabSwitchCount,
        timestamp: new Date()
      });
    }
    
    return suspicious;
  }

  // Check for copy/paste activity
  checkCopyPasteActivity(userId, sessionData) {
    // This would be implemented with client-side detection
    const suspicious = sessionData.copyPasteCount > 10; // Excessive copy/paste
    
    if (suspicious) {
      this.logSuspiciousActivity(userId, 'excessive_copy_paste', {
        count: sessionData.copyPasteCount,
        timestamp: new Date()
      });
    }
    
    return suspicious;
  }

  // Check for unusual timing patterns
  checkTimingPatterns(userId, gameData) {
    // Check for impossibly fast responses
    const avgResponseTime = gameData.responseTimes.reduce((a, b) => a + b, 0) / gameData.responseTimes.length;
    const suspicious = avgResponseTime < 0.1; // Less than 100ms average is suspicious
    
    if (suspicious) {
      this.logSuspiciousActivity(userId, 'impossible_timing', {
        avgResponseTime,
        timestamp: new Date()
      });
    }
    
    return suspicious;
  }

  // Check for duplicate accounts
  async checkDuplicateAccounts(select, userId, deviceFingerprint) {
    // Look for other accounts with the same device fingerprint
    const users = await select('users', { device_fingerprint: deviceFingerprint });
    
    const duplicateAccounts = [];
    users.forEach(user => {
      if (user.id !== userId) {
        duplicateAccounts.push(user.id);
      }
    });
    
    if (duplicateAccounts.length > 0) {
      this.logSuspiciousActivity(userId, 'potential_duplicate_account', {
        duplicateAccounts,
        deviceFingerprint,
        timestamp: new Date()
      });
    }
    
    return duplicateAccounts;
  }

  // Log suspicious activity
  logSuspiciousActivity(userId, activityType, details) {
    const activity = {
      userId,
      activityType,
      details,
      timestamp: new Date(),
      severity: this.calculateSeverity(activityType)
    };
    
    this.suspiciousActivities.push(activity);
    
    // In a real implementation, you would also store this in the database
    console.warn(`Suspicious activity detected: ${activityType} for user ${userId}`);
  }

  // Calculate severity of suspicious activity
  calculateSeverity(activityType) {
    const severityLevels = {
      excessive_tab_switching: 'medium',
      excessive_copy_paste: 'medium',
      impossible_timing: 'high',
      potential_duplicate_account: 'high',
      multiple_accounts_same_ip: 'medium'
    };
    
    return severityLevels[activityType] || 'low';
  }

  // Get suspicious activities for a user
  getUserActivities(userId) {
    return this.suspiciousActivities.filter(activity => activity.userId === userId);
  }

  // Check if user should be flagged for review
  shouldFlagUser(userId) {
    const userActivities = this.getUserActivities(userId);
    
    // Flag if user has any high severity activities or multiple medium severity activities
    const highSeverity = userActivities.some(activity => activity.severity === 'high');
    const mediumSeverityCount = userActivities.filter(activity => activity.severity === 'medium').length;
    
    return highSeverity || mediumSeverityCount >= 2;
  }
}

// Export singleton instance
module.exports = new AntiCheat();