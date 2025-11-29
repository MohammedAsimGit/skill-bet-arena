class TypingSpeedTest {
  constructor(data) {
    this.testId = data.testId || this.generateTestId();
    this.title = data.title;
    this.description = data.description || '';
    this.difficulty = data.difficulty || 'beginner'; // beginner, intermediate, expert
    this.timeLimit = data.timeLimit || 60; // in seconds (1 minute default)
    this.texts = data.texts || []; // Array of texts for different difficulty levels
    this.scoring = data.scoring || { 
      accuracyWeight: 0.7, 
      speedWeight: 0.3,
      minAccuracy: 50 // Minimum accuracy required to get points
    };
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  // Generate a unique test ID
  generateTestId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `TYPING-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Get text for test based on difficulty
  getText() {
    const difficultyTexts = {
      beginner: [
        "The quick brown fox jumps over the lazy dog. This is a simple typing test for beginners.",
        "Programming is fun and challenging. Practice makes perfect when it comes to typing skills.",
        "SkillBet Arena is a platform for skill-based competitions where users can test their abilities."
      ],
      intermediate: [
        "In the realm of competitive programming, efficiency and accuracy are paramount. Contestants must solve complex problems under time pressure.",
        "Mathematical precision requires both speed and accuracy. A single mistake can lead to an incorrect solution in competitive environments.",
        "Memory games challenge the cognitive abilities of players, requiring them to recall patterns and sequences with increasing complexity."
      ],
      expert: [
        "The implementation of sophisticated algorithms necessitates a comprehensive understanding of data structures and computational complexity theory.",
        "Advanced mathematical concepts require rigorous analytical thinking and the ability to manipulate abstract symbols with precision and clarity.",
        "Cognitive psychology research demonstrates that pattern recognition abilities can be significantly enhanced through deliberate practice and focused attention."
      ]
    };
    
    const texts = difficultyTexts[this.difficulty] || difficultyTexts.beginner;
    return texts[Math.floor(Math.random() * texts.length)];
  }

  // Calculate typing score
  calculateScore(userInput, originalText, timeTaken) {
    // Calculate accuracy
    let correctChars = 0;
    let totalChars = Math.max(userInput.length, originalText.length);
    
    for (let i = 0; i < Math.min(userInput.length, originalText.length); i++) {
      if (userInput[i] === originalText[i]) {
        correctChars++;
      }
    }
    
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
    
    // Calculate words per minute (WPM)
    // Assuming 5 characters per word
    const words = userInput.length / 5;
    const minutes = timeTaken / 60;
    const wpm = minutes > 0 ? Math.round(words / minutes) : 0;
    
    // Count errors
    let errors = 0;
    for (let i = 0; i < Math.min(userInput.length, originalText.length); i++) {
      if (userInput[i] !== originalText[i]) {
        errors++;
      }
    }
    
    // Add penalty for extra characters
    if (userInput.length > originalText.length) {
      errors += userInput.length - originalText.length;
    }
    
    // Calculate final score
    let score = 0;
    if (accuracy >= this.scoring.minAccuracy) {
      score = Math.round(
        (wpm * this.scoring.speedWeight) + 
        (accuracy * this.scoring.accuracyWeight)
      );
    }
    
    return {
      wpm,
      accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
      errors,
      score,
      timeTaken,
      meetsMinimumAccuracy: accuracy >= this.scoring.minAccuracy
    };
  }

  // Activate test
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Deactivate test
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      testId: this.testId,
      title: this.title,
      description: this.description,
      difficulty: this.difficulty,
      timeLimit: this.timeLimit,
      texts: this.texts,
      scoring: this.scoring,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }

  // Create test from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new TypingSpeedTest({
      testId: doc.id,
      ...data
    });
  }
}

module.exports = TypingSpeedTest;