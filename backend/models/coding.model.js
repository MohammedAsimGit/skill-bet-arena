const codeExecutionService = require('../services/codeExecution.service');

class CodingChallenge {
  constructor(data) {
    this.challengeId = data.challengeId || this.generateChallengeId();
    this.title = data.title;
    this.description = data.description || '';
    this.difficulty = data.difficulty || 'beginner'; // beginner, intermediate, expert
    this.timeLimit = data.timeLimit || 1800; // in seconds (30 minutes default)
    this.languages = data.languages || ['javascript', 'python']; // supported languages
    this.problemStatement = data.problemStatement || '';
    this.inputFormat = data.inputFormat || '';
    this.outputFormat = data.outputFormat || '';
    this.constraints = data.constraints || '';
    this.sampleInput = data.sampleInput || '';
    this.sampleOutput = data.sampleOutput || '';
    this.testCases = data.testCases || []; // array of {input, output, isPublic}
    this.solutionTemplate = data.solutionTemplate || {}; // {javascript: '', python: ''}
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  // Generate a unique challenge ID
  generateChallengeId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `CODING-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Add test case
  addTestCase(testCase) {
    this.testCases.push(testCase);
    this.updatedAt = new Date();
  }

  // Remove test case
  removeTestCase(testCaseId) {
    this.testCases = this.testCases.filter(tc => tc.id !== testCaseId);
    this.updatedAt = new Date();
  }

  // Add solution template for a language
  addSolutionTemplate(language, template) {
    this.solutionTemplate[language] = template;
    this.updatedAt = new Date();
  }

  // Activate challenge
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Deactivate challenge
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Validate solution by executing code against test cases
  async validateSolution(userSolution, language) {
    try {
      // Execute code with all test cases
      const results = await codeExecutionService.executeCode(userSolution, language, this.testCases);
      
      // Calculate score
      const scoreDetails = codeExecutionService.calculateScore(results, this.timeLimit);
      
      return {
        isValid: results.passed === results.total,
        score: scoreDetails.totalScore,
        timeTaken: results.executionTime / 1000, // Convert to seconds
        memoryUsed: results.memoryUsed,
        passedTestCases: results.passed,
        totalTestCases: results.total,
        details: results
      };
    } catch (error) {
      throw new Error(`Solution validation failed: ${error.message}`);
    }
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      challengeId: this.challengeId,
      title: this.title,
      description: this.description,
      difficulty: this.difficulty,
      timeLimit: this.timeLimit,
      languages: this.languages,
      problemStatement: this.problemStatement,
      inputFormat: this.inputFormat,
      outputFormat: this.outputFormat,
      constraints: this.constraints,
      sampleInput: this.sampleInput,
      sampleOutput: this.sampleOutput,
      testCases: this.testCases,
      solutionTemplate: this.solutionTemplate,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }

  // Create challenge from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new CodingChallenge({
      challengeId: doc.id,
      ...data
    });
  }
}

module.exports = CodingChallenge;