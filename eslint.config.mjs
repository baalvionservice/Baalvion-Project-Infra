// Flat ESLint config — backend services lint layer.
// Pragmatic baseline: catch real bugs (no-undef, no-unused-vars) and surface the
// fleet-wide smells the readiness audit found (console logging, swallowed catches)
// as warnings rather than hard errors, so the layer can be adopted incrementally.
//
// Run:  pnpm run lint:backend
import js from '@eslint/js';
import globals from 'globals';

const sharedRules = {
  'no-console': 'warn',
  'no-empty': ['warn', { allowEmptyCatch: false }], // surfaces swallowed catch blocks
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  'no-undef': 'error',
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/migrations/**',
      '**/*.test.js',
      '**/*.spec.js',
      '**/__tests__/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['Backend/services/**/*.{js,cjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: sharedRules,
  },
  {
    files: ['Backend/services/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: sharedRules,
  },
];
