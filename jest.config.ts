import type { Config } from 'jest';

/**
 * Root Jest workspace config — runs all packages/* test suites.
 */
const config: Config = {
  projects: [
    '<rootDir>/packages/security/jest.config.ts',
    '<rootDir>/packages/upload/jest.config.ts',
    '<rootDir>/packages/search/jest.config.ts',
  ],
};

export default config;
