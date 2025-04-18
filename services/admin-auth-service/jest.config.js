module.exports = {
  testMatch: [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js",
    "**/tests/**/*.js" // Bu satır, tests klasöründeki tüm .js dosyalarını test olarak kabul eder
  ],
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
}; 