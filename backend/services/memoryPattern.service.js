class MemoryPatternService {
  /**
   * Generate a random pattern based on difficulty level
   * @param {number} level - Current level (affects pattern length and complexity)
   * @param {string} patternType - Type of pattern (sequence, grid, color)
   * @returns {Object} Pattern data
   */
  generatePattern(level, patternType = 'sequence') {
    const patternLength = Math.min(3 + Math.floor(level / 2), 15); // Max 15 elements
    let pattern = [];

    switch (patternType) {
      case 'sequence':
        pattern = this.generateNumberSequence(patternLength);
        break;
      case 'grid':
        pattern = this.generateGridPattern(patternLength);
        break;
      case 'color':
        pattern = this.generateColorPattern(patternLength);
        break;
      default:
        pattern = this.generateNumberSequence(patternLength);
    }

    return {
      patternId: this.generatePatternId(),
      patternType,
      level,
      pattern,
      patternLength,
      createdAt: new Date()
    };
  }

  /**
   * Generate a sequence of numbers
   * @param {number} length - Length of the sequence
   * @returns {Array} Array of numbers
   */
  generateNumberSequence(length) {
    const sequence = [];
    for (let i = 0; i < length; i++) {
      // Numbers between 1-9 for easier memorization
      sequence.push(Math.floor(Math.random() * 9) + 1);
    }
    return sequence;
  }

  /**
   * Generate a grid pattern (2D coordinates)
   * @param {number} length - Number of positions in the pattern
   * @returns {Array} Array of coordinate objects {x, y}
   */
  generateGridPattern(length) {
    const pattern = [];
    const gridSize = Math.ceil(Math.sqrt(length * 2)); // Ensure enough space
    
    // Create a set to track used positions
    const usedPositions = new Set();
    
    while (pattern.length < length) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      const positionKey = `${x},${y}`;
      
      // Ensure no duplicate positions
      if (!usedPositions.has(positionKey)) {
        usedPositions.add(positionKey);
        pattern.push({ x, y });
      }
    }
    
    return pattern;
  }

  /**
   * Generate a color pattern
   * @param {number} length - Length of the pattern
   * @returns {Array} Array of color names
   */
  generateColorPattern(length) {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown'];
    const pattern = [];
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * colors.length);
      pattern.push(colors[randomIndex]);
    }
    
    return pattern;
  }

  /**
   * Validate user's pattern input
   * @param {Array} originalPattern - Original pattern to match
   * @param {Array} userPattern - User's input pattern
   * @returns {Object} Validation result
   */
  validatePattern(originalPattern, userPattern) {
    // Check if lengths match
    if (originalPattern.length !== userPattern.length) {
      return {
        isValid: false,
        correctCount: 0,
        totalCount: originalPattern.length,
        accuracy: 0
      };
    }

    // Count correct matches
    let correctCount = 0;
    
    for (let i = 0; i < originalPattern.length; i++) {
      // For grid patterns, compare x and y coordinates
      if (typeof originalPattern[i] === 'object' && originalPattern[i].x !== undefined) {
        if (originalPattern[i].x === userPattern[i].x && originalPattern[i].y === userPattern[i].y) {
          correctCount++;
        }
      } else {
        // For simple values (numbers, colors)
        if (originalPattern[i] === userPattern[i]) {
          correctCount++;
        }
      }
    }

    const accuracy = Math.round((correctCount / originalPattern.length) * 100);
    
    return {
      isValid: correctCount === originalPattern.length,
      correctCount,
      totalCount: originalPattern.length,
      accuracy
    };
  }

  /**
   * Calculate score based on level and accuracy
   * @param {number} level - Current level
   * @param {number} accuracy - Accuracy percentage
   * @param {Object} scoring - Scoring rules
   * @returns {number} Calculated score
   */
  calculateScore(level, accuracy, scoring = { basePoints: 10, multiplier: 1.2 }) {
    // Base score increases with level
    const baseScore = scoring.basePoints * level;
    
    // Apply accuracy modifier
    const accuracyModifier = accuracy / 100;
    
    // Apply level multiplier (increases with level)
    const levelMultiplier = Math.pow(scoring.multiplier, level - 1);
    
    // Calculate final score
    const score = Math.round(baseScore * accuracyModifier * levelMultiplier);
    
    return Math.max(score, 0); // Ensure non-negative score
  }

  /**
   * Generate a unique pattern ID
   * @returns {string} Unique pattern ID
   */
  generatePatternId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `PATTERN-${timestamp}-${randomStr}`.toUpperCase();
  }

  /**
   * Generate a complete memory game session
   * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
   * @param {number} maxLevel - Maximum level to reach
   * @returns {Object} Game session data
   */
  generateGameSession(difficulty, maxLevel = 20) {
    let levelIncrement = 1;
    
    switch (difficulty) {
      case 'beginner':
        levelIncrement = 1;
        break;
      case 'intermediate':
        levelIncrement = 2;
        break;
      case 'expert':
        levelIncrement = 3;
        break;
      default:
        levelIncrement = 1;
    }

    return {
      sessionId: this.generateSessionId(),
      difficulty,
      currentLevel: 1,
      maxLevel,
      levelIncrement,
      patternTypes: ['sequence', 'grid', 'color'],
      scoring: { basePoints: 10, multiplier: 1.2 },
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
    return `SESSION-${timestamp}-${randomStr}`.toUpperCase();
  }

  /**
   * Advance to next level
   * @param {Object} currentSession - Current game session
   * @returns {Object} Updated session
   */
  advanceLevel(currentSession) {
    const newLevel = Math.min(
      currentSession.currentLevel + currentSession.levelIncrement,
      currentSession.maxLevel
    );
    
    return {
      ...currentSession,
      currentLevel: newLevel
    };
  }
}

module.exports = new MemoryPatternService();