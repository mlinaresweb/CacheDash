// jest.edge.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/edge/**/*.spec.ts'],
  maxWorkers: 1,                 // evita saturar CPU/RAM en stress‑tests
  bail: false,
  detectOpenHandles: true,
    forceExit: true,  
  setupFilesAfterEnv: ['<rootDir>/tests/setupEdge.ts'],
  verbose: true,
  // Estos tests son pesados; ejecútalos solo cuando se pida:
  //   npx jest --config jest.edge.config.ts
};
export default config;
