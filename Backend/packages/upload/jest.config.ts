import type { Config } from 'jest';

const config: Config = {
  displayName: '@baalvion/upload',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: true } }],
  },
  // Coverage GATE: the build fails if coverage on the tested modules drops below threshold.
  // Roll this pattern out per package (add tests, then add the file here) to ratchet the
  // workspace toward the 80% target. storage.ts/image.ts are excluded until they have tests.
  collectCoverage: true,
  collectCoverageFrom: ['src/validate.ts', 'src/acl.ts'],
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 },
  },
};

export default config;
