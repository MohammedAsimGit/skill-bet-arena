const { insert, select, update } = require('../utils/supabaseDb');
const CodingChallenge = require('../models/coding.model');
const MathQuiz = require('../models/math.model');
const MemoryPatternGame = require('../models/memory.model');
const TypingSpeedTest = require('../models/typing.model');
const codeExecutionService = require('../services/codeExecution.service');
const mathQuizService = require('../services/mathQuiz.service');
const memoryPatternService = require('../services/memoryPattern.service');
const typingSpeedService = require('../services/typingSpeed.service');
const antiCheatService = require('../services/antiCheat.service');

// Get all games
const getAllGames = async (req, res) => {
  try {
    // In a real implementation, you might want to fetch from a games collection
    // For now, we'll return a static list of game types
    const games = [
      {
        id: 'coding',
        name: 'Coding Challenge',
        description: 'Test your programming skills with real-world problems and algorithms',
        icon: 'fas fa-code',
        difficultyLevels: ['beginner', 'intermediate', 'expert']
      },
      {
        id: 'maths',
        name: 'Maths Quiz Battle',
        description: 'Compete in fast-paced mathematical challenges across various topics',
        icon: 'fas fa-calculator',
        difficultyLevels: ['beginner', 'intermediate', 'expert']
      },
      {
        id: 'memory',
        name: 'Memory Pattern',
        description: 'Train and test your memory with increasingly complex patterns',
        icon: 'fas fa-brain',
        difficultyLevels: ['beginner', 'intermediate', 'expert']
      },
      {
        id: 'typing',
        name: 'Typing Speed',
        description: 'Improve your typing speed and accuracy in competitive environments',
        icon: 'fas fa-keyboard',
        difficultyLevels: ['beginner', 'intermediate', 'expert']
      }
    ];

    res.status(200).json({ games });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Internal server error while fetching games' });
  }
};

// Get game by ID
const getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    let game;
    
    switch (gameId) {
      case 'coding':
        game = {
          id: 'coding',
          name: 'Coding Challenge',
          description: 'Test your programming skills with real-world problems and algorithms',
          icon: 'fas fa-code',
          difficultyLevels: ['beginner', 'intermediate', 'expert']
        };
        break;
      case 'maths':
        game = {
          id: 'maths',
          name: 'Maths Quiz Battle',
          description: 'Compete in fast-paced mathematical challenges across various topics',
          icon: 'fas fa-calculator',
          difficultyLevels: ['beginner', 'intermediate', 'expert']
        };
        break;
      case 'memory':
        game = {
          id: 'memory',
          name: 'Memory Pattern',
          description: 'Train and test your memory with increasingly complex patterns',
          icon: 'fas fa-brain',
          difficultyLevels: ['beginner', 'intermediate', 'expert']
        };
        break;
      case 'typing':
        game = {
          id: 'typing',
          name: 'Typing Speed',
          description: 'Improve your typing speed and accuracy in competitive environments',
          icon: 'fas fa-keyboard',
          difficultyLevels: ['beginner', 'intermediate', 'expert']
        };
        break;
      default:
        return res.status(404).json({ message: 'Game not found' });
    }
    
    res.status(200).json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Internal server error while fetching game' });
  }
};

// Get coding challenge
const getCodingChallenge = async (req, res) => {
  try {
    const { difficulty = 'beginner' } = req.query;
    
    // In a real implementation, you would fetch from a database
    // For now, we'll create a sample challenge
    const challenge = new CodingChallenge({
      title: 'Two Sum Problem',
      description: 'Find two numbers in an array that add up to a target value',
      difficulty,
      timeLimit: 1800, // 30 minutes
      languages: ['javascript', 'python'],
      problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      inputFormat: 'Array of integers and target value',
      outputFormat: 'Indices of the two numbers',
      constraints: '2 <= nums.length <= 10^4',
      sampleInput: '[2,7,11,15], 9',
      sampleOutput: '[0,1]',
      testCases: [
        {
          id: '1',
          input: '[2,7,11,15], 9',
          output: '[0,1]',
          isPublic: true
        },
        {
          id: '2',
          input: '[3,2,4], 6',
          output: '[1,2]',
          isPublic: true
        },
        {
          id: '3',
          input: '[3,3], 6',
          output: '[0,1]',
          isPublic: false // Private test case
        }
      ],
      solutionTemplate: {
        javascript: `function twoSum(nums, target) {
    // Write your solution here
    
}

// Test your solution
console.log(twoSum([2,7,11,15], 9)); // Should output [0,1]`,
        python: `def two_sum(nums, target):
    # Write your solution here
    pass

# Test your solution
print(two_sum([2,7,11,15], 9))  # Should output [0,1]`
      },
      tags: ['array', 'hash-table']
    });
    
    res.status(200).json({ challenge: challenge.toObject() });
  } catch (error) {
    console.error('Get coding challenge error:', error);
    res.status(500).json({ message: 'Internal server error while fetching coding challenge' });
  }
};

// Get math quiz
const getMathQuiz = async (req, res) => {
  try {
    const { difficulty = 'beginner' } = req.query;
    
    // Generate a new quiz using the math quiz service
    const quizData = mathQuizService.generateQuiz(difficulty);
    
    const quiz = new MathQuiz({
      quizId: quizData.quizId,
      title: 'Speed Maths Challenge',
      description: 'Test your mathematical skills under time pressure',
      category: 'mixed',
      difficulty,
      timeLimit: 600, // 10 minutes
      numberOfQuestions: quizData.questionCount,
      scoring: { correct: 4, incorrect: -1, unanswered: 0 },
      questions: quizData.questions,
      tags: ['arithmetic', 'algebra', 'geometry', 'speed-maths']
    });
    
    res.status(200).json({ quiz: quiz.toObject() });
  } catch (error) {
    console.error('Get math quiz error:', error);
    res.status(500).json({ message: 'Internal server error while fetching math quiz' });
  }
};

// Get memory pattern game
const getMemoryPatternGame = async (req, res) => {
  try {
    const { difficulty = 'beginner' } = req.query;
    
    // Generate a new game session using the memory pattern service
    const gameSession = memoryPatternService.generateGameSession(difficulty);
    
    const game = new MemoryPatternGame({
      sessionId: gameSession.sessionId,
      title: 'Pattern Memory Challenge',
      description: 'Memorize and repeat increasingly complex patterns',
      difficulty,
      timeLimit: 300, // 5 minutes
      maxLevel: gameSession.maxLevel,
      currentLevel: gameSession.currentLevel,
      patternTypes: gameSession.patternTypes,
      scoring: gameSession.scoring,
      tags: ['memory', 'pattern-recognition']
    });
    
    res.status(200).json({ game: game.toObject() });
  } catch (error) {
    console.error('Get memory pattern game error:', error);
    res.status(500).json({ message: 'Internal server error while fetching memory pattern game' });
  }
};

// Get typing speed test
const getTypingSpeedTest = async (req, res) => {
  try {
    const { difficulty = 'beginner' } = req.query;
    
    // Generate a new test session using the typing speed service
    const testSession = typingSpeedService.generateTestSession(difficulty);
    
    const test = new TypingSpeedTest({
      sessionId: testSession.sessionId,
      title: 'Typing Speed Challenge',
      description: 'Test your typing speed and accuracy',
      difficulty,
      timeLimit: testSession.timeLimit,
      texts: [testSession.text],
      scoring: { 
        accuracyWeight: 0.7, 
        speedWeight: 0.3,
        minAccuracy: testSession.minAccuracy
      },
      tags: ['typing', 'speed']
    });
    
    res.status(200).json({ test: test.toObject() });
  } catch (error) {
    console.error('Get typing speed test error:', error);
    res.status(500).json({ message: 'Internal server error while fetching typing speed test' });
  }
};

// Submit coding challenge solution
const submitCodingSolution = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { challengeId, code, language, timingData, deviceInfo } = req.body;
    
    // Validate required fields
    if (!challengeId || !code || !language) {
      return res.status(400).json({ message: 'Missing required fields: challengeId, code, language' });
    }
    
    // Anti-cheat: Validate device fingerprint
    if (deviceInfo) {
      const fingerprint = antiCheatService.generateDeviceFingerprint(deviceInfo);
      const isDuplicate = await antiCheatService.checkForDuplicateAccounts(fingerprint, userId);
      
      if (isDuplicate) {
        return res.status(403).json({ message: 'Duplicate account detected' });
      }
    }
    
    // Anti-cheat: Validate timing
    if (timingData) {
      const backendTimer = antiCheatService.generateBackendTimer(1800); // 30 minutes
      const clientTiming = {
        startTime: timingData.startTime,
        endTime: timingData.endTime,
        duration: timingData.duration
      };
      
      const timingValidation = antiCheatService.validateTiming(clientTiming, backendTimer);
      
      if (!timingValidation.isValid) {
        return res.status(400).json({ 
          message: 'Timing validation failed',
          issues: timingValidation.discrepancies
        });
      }
    }
    
    // Fetch challenge from database
    const challengeRecords = await select('challenges', { id: challengeId }, { limit: 1 });
    
    if (challengeRecords.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    const challengeData = challengeRecords[0];
    const challenge = new CodingChallenge({
      challengeId: challengeData.id,
      ...challengeData
    });
    
    // Validate solution
    const validationResult = await challenge.validateSolution(code, language);
    
    // Anti-cheat: Validate result
    const gameMetadata = {
      expectedTime: challenge.timeLimit * 1000,
      maxScore: 100
    };
    
    const cheatValidation = antiCheatService.validateGameResult(
      { score: validationResult.score },
      gameMetadata
    );
    
    if (cheatValidation.riskLevel === 'high') {
      // Ban user for high-risk cheating
      await update('users', { id: userId }, {
        is_banned: true,
        banned_at: new Date(),
        ban_reason: 'High-risk cheating detected in coding challenge'
      });
      
      return res.status(403).json({ 
        message: 'Cheating detected. Account banned.',
        issues: cheatValidation.issues
      });
    }
    
    // Create result document
    const result = {
      user_id: userId,
      game_id: 'coding',
      challenge_id: challengeId,
      code,
      language,
      score: validationResult.score,
      time_taken: validationResult.timeTaken,
      memory_used: validationResult.memoryUsed,
      passed_test_cases: validationResult.passedTestCases,
      total_test_cases: validationResult.totalTestCases,
      is_valid: validationResult.isValid,
      submitted_at: new Date(),
      validation_details: validationResult.details,
      device_fingerprint: req.deviceFingerprint,
      timing_data: timingData
    };
    
    // Save result to database
    const resultRecord = await insert('results', result);
    
    // Update user stats
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length > 0) {
      const userData = userRecords[0];
      const updatedStats = {
        games_played: (userData.games_played || 0) + 1,
        games_won: userData.games_won || 0, // This would be updated based on actual win logic
        total_earnings: userData.total_earnings || 0 // This would be updated based on winnings
      };
      
      // Update win rate
      updatedStats.win_rate = updatedStats.games_played > 0 
        ? Math.round((updatedStats.games_won / updatedStats.games_played) * 100) 
        : 0;
      
      await update('users', { id: userId }, updatedStats);
    }
    
    res.status(201).json({
      message: 'Coding solution submitted successfully',
      resultId: resultRecord.id,
      score: validationResult.score,
      isValid: validationResult.isValid,
      passedTestCases: validationResult.passedTestCases,
      totalTestCases: validationResult.totalTestCases
    });
  } catch (error) {
    console.error('Submit coding solution error:', error);
    res.status(500).json({ message: 'Internal server error while submitting coding solution', error: error.message });
  }
};

// Submit math quiz answers
const submitMathQuizAnswers = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { quizId, answers, timingData, deviceInfo } = req.body;
    
    // Validate required fields
    if (!quizId || !answers) {
      return res.status(400).json({ message: 'Missing required fields: quizId, answers' });
    }
    
    // Anti-cheat: Validate device fingerprint
    if (deviceInfo) {
      const fingerprint = antiCheatService.generateDeviceFingerprint(deviceInfo);
      const isDuplicate = await antiCheatService.checkForDuplicateAccounts(fingerprint, userId);
      
      if (isDuplicate) {
        return res.status(403).json({ message: 'Duplicate account detected' });
      }
    }
    
    // Anti-cheat: Validate timing
    if (timingData) {
      const backendTimer = antiCheatService.generateBackendTimer(600); // 10 minutes
      const clientTiming = {
        startTime: timingData.startTime,
        endTime: timingData.endTime,
        duration: timingData.duration
      };
      
      const timingValidation = antiCheatService.validateTiming(clientTiming, backendTimer);
      
      if (!timingValidation.isValid) {
        return res.status(400).json({ 
          message: 'Timing validation failed',
          issues: timingValidation.discrepancies
        });
      }
    }
    
    // In a real implementation, you would fetch the original quiz from database
    // For now, we'll simulate validation
    
    // Attach user answers to questions
    const questionsWithAnswers = answers.map(answer => ({
      ...answer,
      userAnswer: answer.selectedOption
    }));
    
    // Calculate score
    const scoreResult = mathQuizService.calculateScore(questionsWithAnswers);
    
    // Validate answers
    const validatedQuestions = mathQuizService.validateAnswers(questionsWithAnswers);
    
    // Get category statistics
    const categoryStats = mathQuizService.getCategoryStats(validatedQuestions);
    
    // Anti-cheat: Validate result
    const gameMetadata = {
      expectedTime: 600000, // 10 minutes
      maxScore: questionsWithAnswers.length * 4 // Max score possible
    };
    
    const cheatValidation = antiCheatService.validateGameResult(
      { score: scoreResult.totalScore },
      gameMetadata
    );
    
    if (cheatValidation.riskLevel === 'high') {
      // Ban user for high-risk cheating
      await update('users', { id: userId }, {
        is_banned: true,
        banned_at: new Date(),
        ban_reason: 'High-risk cheating detected in math quiz'
      });
      
      return res.status(403).json({ 
        message: 'Cheating detected. Account banned.',
        issues: cheatValidation.issues
      });
    }
    
    // Create result document
    const result = {
      user_id: userId,
      game_id: 'maths',
      quiz_id: quizId,
      score: scoreResult.totalScore,
      correct_count: scoreResult.correctCount,
      incorrect_count: scoreResult.incorrectCount,
      unanswered_count: scoreResult.unansweredCount,
      questions: validatedQuestions,
      category_stats: categoryStats,
      submitted_at: new Date(),
      device_fingerprint: req.deviceFingerprint,
      timing_data: timingData
    };
    
    // Save result to database
    const resultRecord = await insert('results', result);
    
    // Update user stats
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length > 0) {
      const userData = userRecords[0];
      const updatedStats = {
        games_played: (userData.games_played || 0) + 1,
        games_won: userData.games_won || 0, // This would be updated based on actual win logic
        total_earnings: userData.total_earnings || 0 // This would be updated based on winnings
      };
      
      // Update win rate
      updatedStats.win_rate = updatedStats.games_played > 0 
        ? Math.round((updatedStats.games_won / updatedStats.games_played) * 100) 
        : 0;
      
      await update('users', { id: userId }, updatedStats);
    }
    
    res.status(201).json({
      message: 'Math quiz submitted successfully',
      resultId: resultRecord.id,
      score: scoreResult.totalScore,
      correctCount: scoreResult.correctCount,
      incorrectCount: scoreResult.incorrectCount,
      unansweredCount: scoreResult.unansweredCount,
      categoryStats
    });
  } catch (error) {
    console.error('Submit math quiz error:', error);
    res.status(500).json({ message: 'Internal server error while submitting math quiz', error: error.message });
  }
};

// Submit memory pattern result
const submitMemoryPatternResult = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { sessionId, patternId, userPattern, level, timingData, deviceInfo } = req.body;
    
    // Validate required fields
    if (!sessionId || !patternId || !userPattern || level === undefined) {
      return res.status(400).json({ message: 'Missing required fields: sessionId, patternId, userPattern, level' });
    }
    
    // Anti-cheat: Validate device fingerprint
    if (deviceInfo) {
      const fingerprint = antiCheatService.generateDeviceFingerprint(deviceInfo);
      const isDuplicate = await antiCheatService.checkForDuplicateAccounts(fingerprint, userId);
      
      if (isDuplicate) {
        return res.status(403).json({ message: 'Duplicate account detected' });
      }
    }
    
    // Anti-cheat: Validate timing
    if (timingData) {
      const backendTimer = antiCheatService.generateBackendTimer(300); // 5 minutes
      const clientTiming = {
        startTime: timingData.startTime,
        endTime: timingData.endTime,
        duration: timingData.duration
      };
      
      const timingValidation = antiCheatService.validateTiming(clientTiming, backendTimer);
      
      if (!timingValidation.isValid) {
        return res.status(400).json({ 
          message: 'Timing validation failed',
          issues: timingValidation.discrepancies
        });
      }
    }
    
    // In a real implementation, you would fetch the original pattern from database
    // For now, we'll simulate validation
    
    // Simulate pattern validation (in a real app, you'd compare with the actual pattern)
    const validationResult = {
      isValid: Math.random() > 0.3, // 70% chance of being correct for demo
      correctCount: Math.floor(Math.random() * (userPattern.length + 1)),
      totalCount: userPattern.length,
      accuracy: Math.floor(Math.random() * 101)
    };
    
    // Calculate score
    const score = memoryPatternService.calculateScore(level, validationResult.accuracy);
    
    // Anti-cheat: Validate result
    const gameMetadata = {
      expectedTime: 300000, // 5 minutes
      maxScore: level * 100 // Max score based on level
    };
    
    const cheatValidation = antiCheatService.validateGameResult(
      { score, pattern: userPattern },
      gameMetadata
    );
    
    if (cheatValidation.riskLevel === 'high') {
      // Ban user for high-risk cheating
      await update('users', { id: userId }, {
        is_banned: true,
        banned_at: new Date(),
        ban_reason: 'High-risk cheating detected in memory pattern game'
      });
      
      return res.status(403).json({ 
        message: 'Cheating detected. Account banned.',
        issues: cheatValidation.issues
      });
    }
    
    // Create result document
    const result = {
      user_id: userId,
      game_id: 'memory',
      session_id: sessionId,
      pattern_id: patternId,
      level,
      score,
      user_pattern: userPattern,
      is_valid: validationResult.isValid,
      correct_count: validationResult.correctCount,
      total_count: validationResult.totalCount,
      accuracy: validationResult.accuracy,
      submitted_at: new Date(),
      device_fingerprint: req.deviceFingerprint,
      timing_data: timingData
    };
    
    // Save result to database
    const resultRecord = await insert('results', result);
    
    // Update user stats
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length > 0) {
      const userData = userRecords[0];
      const updatedStats = {
        games_played: (userData.games_played || 0) + 1,
        games_won: userData.games_won || 0, // This would be updated based on actual win logic
        total_earnings: userData.total_earnings || 0 // This would be updated based on winnings
      };
      
      // Update win rate
      updatedStats.win_rate = updatedStats.games_played > 0 
        ? Math.round((updatedStats.games_won / updatedStats.games_played) * 100) 
        : 0;
      
      await update('users', { id: userId }, updatedStats);
    }
    
    res.status(201).json({
      message: 'Memory pattern result submitted successfully',
      resultId: resultRecord.id,
      score,
      isValid: validationResult.isValid,
      levelCompleted: validationResult.isValid ? level : level - 1,
      nextLevel: validationResult.isValid ? level + 1 : level
    });
  } catch (error) {
    console.error('Submit memory pattern result error:', error);
    res.status(500).json({ message: 'Internal server error while submitting memory pattern result', error: error.message });
  }
};

// Submit typing speed test result
const submitTypingSpeedResult = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { sessionId, originalText, typedText, timeTaken, timingData, deviceInfo } = req.body;
    
    // Validate required fields
    if (!sessionId || !originalText || !typedText || timeTaken === undefined) {
      return res.status(400).json({ message: 'Missing required fields: sessionId, originalText, typedText, timeTaken' });
    }
    
    // Anti-cheat: Validate device fingerprint
    if (deviceInfo) {
      const fingerprint = antiCheatService.generateDeviceFingerprint(deviceInfo);
      const isDuplicate = await antiCheatService.checkForDuplicateAccounts(fingerprint, userId);
      
      if (isDuplicate) {
        return res.status(403).json({ message: 'Duplicate account detected' });
      }
    }
    
    // Anti-cheat: Validate timing
    if (timingData) {
      const backendTimer = antiCheatService.generateBackendTimer(60); // 1 minute
      const clientTiming = {
        startTime: timingData.startTime,
        endTime: timingData.endTime,
        duration: timingData.duration
      };
      
      const timingValidation = antiCheatService.validateTiming(clientTiming, backendTimer);
      
      if (!timingValidation.isValid) {
        return res.status(400).json({ 
          message: 'Timing validation failed',
          issues: timingValidation.discrepancies
        });
      }
    }
    
    // Validate typing test result
    const validationResult = typingSpeedService.validateTypingTest(originalText, typedText, timeTaken);
    
    // Get detailed metrics
    const metrics = typingSpeedService.calculateTypingMetrics(originalText, typedText, timeTaken);
    
    // Anti-cheat: Validate result
    const gameMetadata = {
      expectedTime: 60000, // 1 minute
      maxScore: 100
    };
    
    const cheatValidation = antiCheatService.validateGameResult(
      { score: metrics.score, wpm: metrics.wpm, accuracy: metrics.accuracy },
      gameMetadata
    );
    
    if (cheatValidation.riskLevel === 'high') {
      // Ban user for high-risk cheating
      await update('users', { id: userId }, {
        is_banned: true,
        banned_at: new Date(),
        ban_reason: 'High-risk cheating detected in typing speed test'
      });
      
      return res.status(403).json({ 
        message: 'Cheating detected. Account banned.',
        issues: cheatValidation.issues
      });
    }
    
    // Create result document
    const result = {
      user_id: userId,
      game_id: 'typing',
      session_id: sessionId,
      original_text: originalText,
      typed_text: typedText,
      time_taken: timeTaken,
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      errors: metrics.errors,
      score: metrics.score,
      is_valid: validationResult.isValid,
      submitted_at: new Date(),
      device_fingerprint: req.deviceFingerprint,
      timing_data: timingData
    };
    
    // Save result to database
    const resultRecord = await insert('results', result);
    
    // Update user stats
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length > 0) {
      const userData = userRecords[0];
      const updatedStats = {
        games_played: (userData.games_played || 0) + 1,
        games_won: userData.games_won || 0, // This would be updated based on actual win logic
        total_earnings: userData.total_earnings || 0 // This would be updated based on winnings
      };
      
      // Update win rate
      updatedStats.win_rate = updatedStats.games_played > 0 
        ? Math.round((updatedStats.games_won / updatedStats.games_played) * 100) 
        : 0;
      
      await update('users', { id: userId }, updatedStats);
    }
    
    res.status(201).json({
      message: 'Typing speed test result submitted successfully',
      resultId: resultRecord.id,
      score: metrics.score,
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      errors: metrics.errors,
      isValid: validationResult.isValid
    });
  } catch (error) {
    console.error('Submit typing speed test result error:', error);
    res.status(500).json({ message: 'Internal server error while submitting typing speed test result', error: error.message });
  }
};

// Submit game result
const submitGameResult = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { gameId, score, timeTaken, answers, metadata } = req.body;
    
    // Validate required fields
    if (!gameId || score === undefined || timeTaken === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create result document
    const result = {
      user_id: userId,
      game_id: gameId,
      score,
      time_taken: timeTaken,
      answers: answers || {},
      metadata: metadata || {},
      submitted_at: new Date()
    };
    
    // Save result to database
    const resultRecord = await insert('results', result);
    
    // Update user stats
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length > 0) {
      const userData = userRecords[0];
      const updatedStats = {
        games_played: (userData.games_played || 0) + 1,
        games_won: userData.games_won || 0, // This would be updated based on actual win logic
        total_earnings: userData.total_earnings || 0 // This would be updated based on winnings
      };
      
      // Update win rate
      updatedStats.win_rate = updatedStats.games_played > 0 
        ? Math.round((updatedStats.games_won / updatedStats.games_played) * 100) 
        : 0;
      
      await update('users', { id: userId }, updatedStats);
    }
    
    res.status(201).json({
      message: 'Game result submitted successfully',
      resultId: resultRecord.id,
      result
    });
  } catch (error) {
    console.error('Submit game result error:', error);
    res.status(500).json({ message: 'Internal server error while submitting game result' });
  }
};

module.exports = {
  getAllGames,
  getGameById,
  getCodingChallenge,
  getMathQuiz,
  getMemoryPatternGame,
  getTypingSpeedTest,
  submitCodingSolution,
  submitMathQuizAnswers,
  submitMemoryPatternResult,
  submitTypingSpeedResult,
  submitGameResult
};