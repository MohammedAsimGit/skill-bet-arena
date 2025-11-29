class MathQuiz {
  constructor(data) {
    this.quizId = data.quizId || this.generateQuizId();
    this.title = data.title;
    this.description = data.description || '';
    this.category = data.category || 'arithmetic'; // arithmetic, algebra, geometry, calculus
    this.difficulty = data.difficulty || 'beginner'; // beginner, intermediate, expert
    this.timeLimit = data.timeLimit || 600; // in seconds (10 minutes default)
    this.numberOfQuestions = data.numberOfQuestions || 15;
    this.scoring = data.scoring || { correct: 4, incorrect: -1, unanswered: 0 };
    this.questions = data.questions || [];
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  // Generate a unique quiz ID
  generateQuizId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `MATH-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Add question
  addQuestion(question) {
    this.questions.push(question);
    this.updatedAt = new Date();
  }

  // Remove question
  removeQuestion(questionId) {
    this.questions = this.questions.filter(q => q.id !== questionId);
    this.updatedAt = new Date();
  }

  // Generate a random math question based on category and difficulty
  generateRandomQuestion() {
    // This is a simplified implementation
    // In a real system, you would have a more sophisticated question generation system
    
    const categories = {
      arithmetic: ['+', '-', '*', '/'],
      algebra: ['linear', 'quadratic', 'polynomial'],
      geometry: ['area', 'perimeter', 'volume'],
      calculus: ['derivative', 'integral']
    };
    
    const difficulties = {
      beginner: { range: [1, 20], operations: ['+', '-'] },
      intermediate: { range: [1, 50], operations: ['+', '-', '*'] },
      expert: { range: [1, 100], operations: ['+', '-', '*', '/', '^'] }
    };
    
    return {
      id: Math.random().toString(36).substring(2, 10),
      question: 'Sample math question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      category: this.category,
      difficulty: this.difficulty
    };
  }

  // Calculate score based on answers
  calculateScore(userAnswers) {
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    
    this.questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      
      if (userAnswer === undefined || userAnswer === null) {
        score += this.scoring.unanswered;
        unanswered++;
      } else if (userAnswer === question.correctAnswer) {
        score += this.scoring.correct;
        correct++;
      } else {
        score += this.scoring.incorrect;
        incorrect++;
      }
    });
    
    return {
      totalScore: score,
      correct,
      incorrect,
      unanswered,
      maxPossibleScore: this.questions.length * this.scoring.correct
    };
  }

  // Activate quiz
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Deactivate quiz
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      quizId: this.quizId,
      title: this.title,
      description: this.description,
      category: this.category,
      difficulty: this.difficulty,
      timeLimit: this.timeLimit,
      numberOfQuestions: this.numberOfQuestions,
      scoring: this.scoring,
      questions: this.questions,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }

  // Create quiz from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new MathQuiz({
      quizId: doc.id,
      ...data
    });
  }
}

module.exports = MathQuiz;