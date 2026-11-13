module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
