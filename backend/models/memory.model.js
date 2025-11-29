class MemoryPatternGame {
  constructor(data) {
    this.gameId = data.gameId || this.generateGameId();
    this.title = data.title;
    this.description = data.description || '';
    this.difficulty = data.difficulty || 'beginner'; // beginner, intermediate, expert
    this.timeLimit = data.timeLimit || 300; // in seconds (5 minutes default)
    this.maxLevel = data.maxLevel || 20;
    this.patternTypes = data.patternTypes || ['sequence', 'grid', 'color'];
    this.scoring = data.scoring || { basePoints: 10, multiplier: 1.2 };
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  // Generate a unique game ID
  generateGameId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `MEMORY-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Generate a pattern based on level and difficulty
  generatePattern(level) {
    const difficultyFactors = {
      beginner: { minLength: 3, maxLength: 6, colors: 4 },
      intermediate: { minLength: 5, maxLength: 10, colors: 6 },
      expert: { minLength: 8, maxLength: 15, colors: 8 }
    };
    
    const factor = difficultyFactors[this.difficulty] || difficultyFactors.beginner;
    
    // Calculate pattern length based on level
    const minLength = factor.minLength;
    const maxLength = Math.min(factor.maxLength, minLength + Math.floor(level / 2));
    const length = Math.min(maxLength, minLength + Math.floor(Math.random() * (maxLength - minLength + 1)));
    
    // Generate pattern
    const pattern = [];
    for (let i = 0; i < length; i++) {
      pattern.push(Math.floor(Math.random() * factor.colors));
    }
    
    return {
      level,
      pattern,
      length,
      timeToShow: Math.max(1, 5 - Math.floor(level / 5)) // Decrease show time as level increases
    };
  }

  // Validate user's pattern response
  validatePattern(userPattern, correctPattern) {
    if (userPattern.length !== correctPattern.length) {
      return false;
    }
    
    for (let i = 0; i < userPattern.length; i++) {
      if (userPattern[i] !== correctPattern[i]) {
        return false;
      }
    }
    
    return true;
  }

  // Calculate score based on level and time
  calculateScore(level, timeTaken) {
    const basePoints = this.scoring.basePoints;
    const multiplier = this.scoring.multiplier;
    
    // Score increases exponentially with level
    const levelScore = basePoints * Math.pow(multiplier, level - 1);
    
    // Time bonus - faster completion gets more points
    const timeBonus = Math.max(0, 100 - timeTaken); // Max 100 point time bonus
    
    return Math.round(levelScore + timeBonus);
  }

  // Activate game
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Deactivate game
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      gameId: this.gameId,
      title: this.title,
      description: this.description,
      difficulty: this.difficulty,
      timeLimit: this.timeLimit,
      maxLevel: this.maxLevel,
      patternTypes: this.patternTypes,
      scoring: this.scoring,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }

  // Create game from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new MemoryPatternGame({
      gameId: doc.id,
      ...data
    });
  }
}

module.exports = MemoryPatternGame;