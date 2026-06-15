import type { Config } from 'jest';

/**
 * Root Jest workspace config — runs all packages/* test suites.
 */
const config: Config = {
  projects: [
    '<rootDir>/Backend/packages/security/jest.config.ts',
    '<rootDir>/Backend/packages/upload/jest.config.ts',
    '<rootDir>/Backend/packages/search/jest.config.ts',
  ],
};

export default config;
