module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: [
    "**/*.js",
    "!**/*.d.ts",
    "!server.js",
    "!config/**",
    "!node_modules/**",
    "!coverage/**",
    "!tests/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 30000,
  verbose: true,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testEnvironmentOptions: {
    NODE_ENV: "test",
  },
};
