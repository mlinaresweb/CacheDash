//jest.config.TS
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./setupTests.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
  ],
  moduleNameMapper: {
    '^cache-dash$': '<rootDir>/src/index.ts',
  },
  reporters: ['default', 'jest-junit'],
   testPathIgnorePatterns: [
    '/tests/integration/', 
    '/tests/edge/'
  ]
};

export default config;
