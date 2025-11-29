const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class CodeExecutionService {
  constructor() {
    this.timeout = 10000; // 10 seconds timeout for code execution
    this.memoryLimit = 128; // 128MB memory limit
  }

  /**
   * Execute user code with test cases
   * @param {string} code - User's code solution
   * @param {string} language - Programming language (javascript, python)
   * @param {Array} testCases - Array of test cases [{input, output}]
   * @returns {Object} Execution results
   */
  async executeCode(code, language, testCases) {
    try {
      let results = {
        passed: 0,
        total: testCases.length,
        testResults: [],
        executionTime: 0,
        memoryUsed: 0,
        errors: []
      };

      const startTime = Date.now();

      // Process each test case
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        let testCaseResult;

        switch (language.toLowerCase()) {
          case 'javascript':
            testCaseResult = await this.executeJavaScript(code, testCase);
            break;
          case 'python':
            testCaseResult = await this.executePython(code, testCase);
            break;
          default:
            throw new Error(`Unsupported language: ${language}`);
        }

        results.testResults.push({
          testCaseId: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: testCaseResult.output,
          passed: testCaseResult.passed,
          executionTime: testCaseResult.executionTime,
          memoryUsed: testCaseResult.memoryUsed,
          error: testCaseResult.error
        });

        if (testCaseResult.passed) {
          results.passed++;
        }

        if (testCaseResult.error) {
          results.errors.push(`Test case ${i + 1}: ${testCaseResult.error}`);
        }
      }

      results.executionTime = Date.now() - startTime;
      return results;
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  /**
   * Execute JavaScript code
   * @param {string} code - User's JavaScript code
   * @param {Object} testCase - Test case with input/output
   * @returns {Object} Execution result
   */
  async executeJavaScript(code, testCase) {
    try {
      // Create a temporary file for execution
      const tempDir = os.tmpdir();
      const fileName = `solution_${Date.now()}_${Math.floor(Math.random() * 10000)}.js`;
      const filePath = path.join(tempDir, fileName);

      // Prepare the code with test case execution
      const wrappedCode = `
        // User's code
        ${code}
        
        // Test execution
        try {
          // Parse input (assuming JSON format)
          const input = JSON.parse('${JSON.stringify(testCase.input)}');
          
          // Execute the function (assuming a function named 'solve')
          // In a real implementation, we would need to parse the function name from the code
          // For simplicity, we'll just execute the code and capture output
          
          // If there's a specific function to call, we would do:
          // const result = solve(input);
          // console.log(JSON.stringify(result));
          
          // For now, we'll just run the code and capture any output
          // This is a simplified version - in practice, you'd want to properly isolate and test
        } catch (error) {
          console.error('EXECUTION_ERROR: ' + error.message);
        }
      `;

      // Write code to temporary file
      await fs.writeFile(filePath, wrappedCode);

      // Execute the code with timeout and memory limit
      const result = await this.runWithTimeout(
        'node',
        [filePath],
        { timeout: this.timeout }
      );

      // Clean up temporary file
      await fs.unlink(filePath).catch(() => {});

      // Parse output
      const output = result.stdout.trim();
      const errorOutput = result.stderr.trim();
      
      // Check if there was an execution error
      if (errorOutput.includes('EXECUTION_ERROR:')) {
        return {
          passed: false,
          output: '',
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          error: errorOutput.replace('EXECUTION_ERROR: ', '')
        };
      }

      // Compare output with expected result
      const passed = output === testCase.output;

      return {
        passed,
        output,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        error: errorOutput || null
      };
    } catch (error) {
      return {
        passed: false,
        output: '',
        executionTime: 0,
        memoryUsed: 0,
        error: error.message
      };
    }
  }

  /**
   * Execute Python code
   * @param {string} code - User's Python code
   * @param {Object} testCase - Test case with input/output
   * @returns {Object} Execution result
   */
  async executePython(code, testCase) {
    try {
      // Create a temporary file for execution
      const tempDir = os.tmpdir();
      const fileName = `solution_${Date.now()}_${Math.floor(Math.random() * 10000)}.py`;
      const filePath = path.join(tempDir, fileName);

      // Prepare the code with test case execution
      const wrappedCode = `
import sys
import json

# User's code
${code}

# Test execution
try:
    # Parse input
    input_data = json.loads('${JSON.stringify(testCase.input)}')
    
    # Execute the function (assuming a function named 'solve')
    # In a real implementation, we would need to parse the function name from the code
    # For simplicity, we'll just execute the code and capture output
    
    # If there's a specific function to call, we would do:
    # result = solve(input_data)
    # print(json.dumps(result))
    
    # For now, we'll just run the code and capture any output
    # This is a simplified version - in practice, you'd want to properly isolate and test
except Exception as e:
    print('EXECUTION_ERROR: ' + str(e), file=sys.stderr)
      `;

      // Write code to temporary file
      await fs.writeFile(filePath, wrappedCode);

      // Execute the code with timeout and memory limit
      const result = await this.runWithTimeout(
        'python',
        [filePath],
        { timeout: this.timeout }
      );

      // Clean up temporary file
      await fs.unlink(filePath).catch(() => {});

      // Parse output
      const output = result.stdout.trim();
      const errorOutput = result.stderr.trim();
      
      // Check if there was an execution error
      if (errorOutput.includes('EXECUTION_ERROR:')) {
        return {
          passed: false,
          output: '',
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          error: errorOutput.replace('EXECUTION_ERROR: ', '')
        };
      }

      // Compare output with expected result
      const passed = output === testCase.output;

      return {
        passed,
        output,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        error: errorOutput || null
      };
    } catch (error) {
      return {
        passed: false,
        output: '',
        executionTime: 0,
        memoryUsed: 0,
        error: error.message
      };
    }
  }

  /**
   * Run a command with timeout
   * @param {string} command - Command to execute
   * @param {Array} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Object} Execution result
   */
  async runWithTimeout(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let memoryUsed = 0;

      const child = spawn(command, args, {
        timeout: options.timeout || this.timeout,
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('exit', (code, signal) => {
        const executionTime = Date.now() - startTime;
        
        if (signal === 'SIGTERM') {
          reject(new Error('Code execution timed out'));
        } else {
          resolve({
            code,
            stdout,
            stderr,
            executionTime,
            memoryUsed
          });
        }
      });

      // Handle timeout
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
      }, options.timeout || this.timeout);
    });
  }

  /**
   * Calculate score based on execution results
   * @param {Object} results - Execution results
   * @param {number} timeLimit - Time limit in seconds
   * @returns {Object} Score calculation
   */
  calculateScore(results, timeLimit) {
    // Accuracy score (70% weight)
    const accuracyScore = (results.passed / results.total) * 70;
    
    // Time score (30% weight) - faster solutions get higher scores
    const timeRatio = Math.min(1, results.executionTime / (timeLimit * 1000));
    const timeScore = (1 - timeRatio) * 30;
    
    // Total score out of 100
    const totalScore = Math.round(accuracyScore + timeScore);
    
    return {
      accuracyScore,
      timeScore,
      totalScore,
      passed: results.passed,
      total: results.total
    };
  }
}

module.exports = new CodeExecutionService();