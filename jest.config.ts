import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    "<rootDir>/src/app/app.config.ts",
    "<rootDir>/src/app/app.routes.ts",
    "<rootDir>/src/assets/"
  ],
  coverageThreshold: { global: { branches: 99,  functions: 98,  lines: 99,  statements: 99 } },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.ts', // Adjust this pattern to match your source files
    '!src/**/*.spec.ts', // Exclude test files
    '!src/main.ts',
    '!src/main.server.ts',
    '!src/app/app.config.ts',
    '!src/app/app.routes.ts',
    '!src/main.server.ts',
    '!src/app/app.routes.server.ts',
    '!src/app/app.config.server.ts',
    '!src/app/assets/',
    '!src/app/layout/sections/modal/modal-import/modal-import.component.ts',
    '!src/app/services/api/import/import.service.ts'
  ],
};
export default config;
