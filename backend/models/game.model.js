class Game {
  constructor(data) {
    this.gameId = data.gameId || this.generateGameId();
    this.title = data.title;
    this.description = data.description || '';
    this.type = data.type; // coding, maths, memory, typing
    this.difficulty = data.difficulty || 'beginner'; // beginner, intermediate, expert
    this.timeLimit = data.timeLimit || 0; // in seconds
    this.maxScore = data.maxScore || 0;
    this.createdBy = data.createdBy || 'system';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.questions = data.questions || [];
  }

  // Generate a unique game ID
  generateGameId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `GAME-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Add question to game
  addQuestion(question) {
    this.questions.push(question);
    this.updatedAt = new Date();
  }

  // Remove question from game
  removeQuestion(questionId) {
    this.questions = this.questions.filter(q => q.id !== questionId);
    this.updatedAt = new Date();
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
      type: this.type,
      difficulty: this.difficulty,
      timeLimit: this.timeLimit,
      maxScore: this.maxScore,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
      questions: this.questions
    };
  }

  // Create game from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new Game({
      gameId: doc.id,
      ...data
    });
  }
}

module.exports = Game;