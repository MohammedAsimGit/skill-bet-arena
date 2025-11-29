class TypingSpeedService {
  /**
   * Calculate typing speed metrics
   * @param {string} originalText - Original text to type
   * @param {string} typedText - Text typed by user
   * @param {number} timeTaken - Time taken in seconds
   * @returns {Object} Typing metrics
   */
  calculateTypingMetrics(originalText, typedText, timeTaken) {
    // Calculate words per minute (WPM)
    // Standard: 5 characters = 1 word
    const words = typedText.length / 5;
    const wpm = Math.round((words / timeTaken) * 60);
    
    // Calculate accuracy
    const accuracy = this.calculateAccuracy(originalText, typedText);
    
    // Calculate errors
    const errors = this.calculateErrors(originalText, typedText);
    
    // Calculate score based on WPM and accuracy
    const score = this.calculateScore(wpm, accuracy);
    
    return {
      wpm,
      accuracy,
      errors,
      score,
      timeTaken,
      charactersTyped: typedText.length,
      charactersCorrect: typedText.length - errors.total,
      originalTextLength: originalText.length
    };
  }

  /**
   * Calculate accuracy percentage
   * @param {string} originalText - Original text
   * @param {string} typedText - Typed text
   * @returns {number} Accuracy percentage
   */
  calculateAccuracy(originalText, typedText) {
    if (typedText.length === 0) return 0;
    
    let correctChars = 0;
    const minLength = Math.min(originalText.length, typedText.length);
    
    // Count correct characters
    for (let i = 0; i < minLength; i++) {
      if (originalText[i] === typedText[i]) {
        correctChars++;
      }
    }
    
    // Calculate accuracy as percentage
    const accuracy = (correctChars / typedText.length) * 100;
    return Math.round(accuracy);
  }

  /**
   * Calculate detailed errors
   * @param {string} originalText - Original text
   * @param {string} typedText - Typed text
   * @returns {Object} Error details
   */
  calculateErrors(originalText, typedText) {
    let insertionErrors = 0;
    let deletionErrors = 0;
    let substitutionErrors = 0;
    
    const minLength = Math.min(originalText.length, typedText.length);
    const maxLength = Math.max(originalText.length, typedText.length);
    
    // Count substitution and matching characters
    for (let i = 0; i < minLength; i++) {
      if (originalText[i] !== typedText[i]) {
        substitutionErrors++;
      }
    }
    
    // Count insertion/deletion errors
    if (typedText.length > originalText.length) {
      insertionErrors = typedText.length - originalText.length;
    } else if (typedText.length < originalText.length) {
      deletionErrors = originalText.length - typedText.length;
    }
    
    return {
      total: insertionErrors + deletionErrors + substitutionErrors,
      insertions: insertionErrors,
      deletions: deletionErrors,
      substitutions: substitutionErrors
    };
  }

  /**
   * Calculate score based on WPM and accuracy
   * @param {number} wpm - Words per minute
   * @param {number} accuracy - Accuracy percentage
   * @param {Object} scoring - Scoring rules
   * @returns {number} Calculated score
   */
  calculateScore(wpm, accuracy, scoring = { accuracyWeight: 0.7, speedWeight: 0.3 }) {
    // Ensure minimum accuracy threshold is met
    if (accuracy < 50) return 0;
    
    // Weighted score: 70% accuracy, 30% speed
    const accuracyScore = accuracy * scoring.accuracyWeight;
    const speedScore = Math.min(wpm, 100) * scoring.speedWeight; // Cap speed score at 100 WPM
    
    const totalScore = Math.round(accuracyScore + speedScore);
    
    return totalScore;
  }

  /**
   * Get a random typing text based on difficulty
   * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
   * @returns {string} Selected text
   */
  getRandomText(difficulty) {
    const texts = {
      beginner: [
        "The quick brown fox jumps over the lazy dog. This is a simple typing test for beginners.",
        "Programming is fun and challenging. Practice makes perfect when it comes to typing skills.",
        "SkillBet Arena is a platform for skill-based competitions where users can test their abilities.",
        "Typing speed and accuracy are important skills in today's digital world.",
        "Practice regularly to improve your typing speed and reduce errors."
      ],
      intermediate: [
        "In the realm of competitive programming, efficiency and accuracy are paramount. Developers must balance speed with precision to excel in timed challenges.",
        "The architecture of modern web applications requires a deep understanding of both frontend and backend technologies, along with database design principles.",
        "Machine learning algorithms have revolutionized data analysis, enabling computers to identify patterns and make predictions with unprecedented accuracy.",
        "Cybersecurity has become increasingly important as digital threats evolve. Organizations must implement robust security measures to protect sensitive information.",
        "Cloud computing has transformed how businesses operate, providing scalable resources and services over the internet with pay-as-you-go pricing models."
      ],
      expert: [
        "Quantum computing represents a paradigm shift in computational theory, leveraging quantum mechanical phenomena to solve complex problems intractable for classical computers.",
        "The implementation of distributed systems requires careful consideration of consistency, availability, and partition tolerance trade-offs as described by the CAP theorem.",
        "Advanced cryptographic protocols utilize mathematical constructs such as elliptic curves and modular arithmetic to ensure secure communication over insecure channels.",
        "Neural network architectures employ backpropagation algorithms and gradient descent optimization techniques to minimize loss functions during training phases.",
        "Blockchain technology utilizes cryptographic hashing and consensus mechanisms to create immutable ledgers without requiring centralized authority structures."
      ]
    };

    // Validate difficulty
    if (!texts[difficulty]) {
      difficulty = 'beginner';
    }

    // Select random text
    const textArray = texts[difficulty];
    const randomIndex = Math.floor(Math.random() * textArray.length);
    
    return textArray[randomIndex];
  }

  /**
   * Validate typing test result
   * @param {string} originalText - Original text
   * @param {string} typedText - Typed text
   * @param {number} timeTaken - Time taken in seconds
   * @param {number} minAccuracy - Minimum required accuracy
   * @returns {Object} Validation result
   */
  validateTypingTest(originalText, typedText, timeTaken, minAccuracy = 50) {
    const metrics = this.calculateTypingMetrics(originalText, typedText, timeTaken);
    
    return {
      isValid: metrics.accuracy >= minAccuracy,
      metrics,
      passed: metrics.accuracy >= minAccuracy
    };
  }

  /**
   * Generate a typing test session
   * @param {string} difficulty - Difficulty level
   * @returns {Object} Test session data
   */
  generateTestSession(difficulty) {
    const text = this.getRandomText(difficulty);
    
    return {
      sessionId: this.generateSessionId(),
      difficulty,
      text,
      timeLimit: 60, // 1 minute
      minAccuracy: 50,
      createdAt: new Date()
    };
  }

  /**
   * Generate a unique session ID
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `TYPING-${timestamp}-${randomStr}`.toUpperCase();
  }
}

module.exports = new TypingSpeedService();