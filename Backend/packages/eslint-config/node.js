// Backend services and shared packages.

import globals from 'globals';
import { base } from './base.js';

export const nodeConfig = [
  ...base,
  {
    files: ['**/*.{js,cjs,mjs,ts}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
      sourceType: 'module',
    },
    rules: {
      // Services log deliberately; console is the transport for the log shipper.
      'no-console': 'off',
      // CommonJS is still the norm across the services.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.test.{js,mjs,ts}', '**/test/**', '**/__tests__/**'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
];

export default nodeConfig;
