import next from '@baalvion/eslint-config/next';

export default [
  ...next,
  {
    // De-mock migration guard: pages (src/app) must consume the real data layer
    // (@/services/data/*), never mock-api directly. 'warn' tracks the remaining mock
    // surface during migration — flip to 'error' once all pages are off mock.
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [{
          group: ['@/services/mock-api', '@/services/mock-api/*', '**/services/mock-api/*'],
          message: 'Pages must use the real data layer (@/services/data/*), not mock-api — convert this page to the live service.',
        }],
      }],
    },
  },
];
