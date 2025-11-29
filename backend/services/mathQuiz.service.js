const mathQuestions = require('../data/mathQuestions.json');

class MathQuizService {
  /**
   * Get a random set of questions for a quiz
   * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
   * @param {number} count - Number of questions to select
   * @returns {Array} Array of randomly selected questions
   */
  getRandomQuestions(difficulty, count = 15) {
    // Validate difficulty
    if (!mathQuestions[difficulty]) {
      throw new Error(`Invalid difficulty level: ${difficulty}`);
    }

    const questions = mathQuestions[difficulty];
    const selectedQuestions = [];
    const usedIndices = new Set();

    // Select random questions without repetition
    while (selectedQuestions.length < count && selectedQuestions.length < questions.length) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      
      // Ensure we don't select the same question twice
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        // Create a copy of the question to avoid reference issues
        const questionCopy = { ...questions[randomIndex] };
        selectedQuestions.push(questionCopy);
      }
    }

    return selectedQuestions;
  }

  /**
   * Calculate score based on answers
   * @param {Array} questions - Array of questions with user answers
   * @param {Object} scoring - Scoring rules { correct: number, incorrect: number, unanswered: number }
   * @returns {Object} Score calculation results
   */
  calculateScore(questions, scoring = { correct: 4, incorrect: -1, unanswered: 0 }) {
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    questions.forEach(question => {
      if (question.userAnswer === undefined || question.userAnswer === null || question.userAnswer === '') {
        // Unanswered question
        score += scoring.unanswered;
        unansweredCount++;
      } else if (question.userAnswer === question.correctAnswer) {
        // Correct answer
        score += scoring.correct;
        correctCount++;
      } else {
        // Incorrect answer
        score += scoring.incorrect;
        incorrectCount++;
      }
    });

    return {
      totalScore: score,
      correctCount,
      incorrectCount,
      unansweredCount,
      maxPossibleScore: questions.length * scoring.correct
    };
  }

  /**
   * Validate user answers
   * @param {Array} questions - Array of questions with user answers
   * @returns {Array} Questions with validation results
   */
  validateAnswers(questions) {
    return questions.map(question => ({
      ...question,
      isCorrect: question.userAnswer === question.correctAnswer
    }));
  }

  /**
   * Get question statistics by category
   * @param {Array} questions - Array of questions
   * @returns {Object} Statistics by category
   */
  getCategoryStats(questions) {
    const stats = {};

    questions.forEach(question => {
      if (!stats[question.category]) {
        stats[question.category] = { total: 0, correct: 0 };
      }
      
      stats[question.category].total++;
      
      if (question.userAnswer === question.correctAnswer) {
        stats[question.category].correct++;
      }
    });

    // Calculate percentages
    Object.keys(stats).forEach(category => {
      stats[category].percentage = Math.round((stats[category].correct / stats[category].total) * 100);
    });

    return stats;
  }

  /**
   * Generate a new quiz
   * @param {string} difficulty - Difficulty level
   * @param {number} questionCount - Number of questions
   * @returns {Object} Quiz object
   */
  generateQuiz(difficulty, questionCount = 15) {
    const questions = this.getRandomQuestions(difficulty, questionCount);
    
    return {
      quizId: this.generateQuizId(),
      difficulty,
      questionCount,
      questions,
      createdAt: new Date()
    };
  }

  /**
   * Generate a unique quiz ID
   * @returns {string} Unique quiz ID
   */
  generateQuizId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `QUIZ-${timestamp}-${randomStr}`.toUpperCase();
  }
}

module.exports = new MathQuizService();