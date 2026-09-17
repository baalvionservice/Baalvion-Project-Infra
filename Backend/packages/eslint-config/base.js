// Rules every Baalvion package gets, whatever the stack.
//
// Kept deliberately small. This exists so an ESLint major, a new rule, or a new app
// is a single edit here instead of 22 — it is not a place to encode one app's taste.
// App-specific rules go in that app's own eslint.config.mjs, appended after this.
//
// ── Why ESLint 9 and not 10 ──────────────────────────────────────────────────
// ESLint 10 removed context.getFilename(). eslint-plugin-react still calls it, and
// 7.37.5 — the LATEST release — declares `eslint: ^3 || ... || ^9.7`, so it has no
// ESLint 10 support at all. Every eslint-config-next bundles that plugin, so on
// ESLint 10 the first React file crashes the run outright:
//
//   TypeError: Error while loading rule 'react/display-name':
//   contextOrFilename.getFilename is not a function
//
// Verified directly against eslint@10.10.0 + eslint-config-next@16.3.4. This is an
// upstream block, not a config problem. When eslint-plugin-react ships ESLint 10
// support, the bump is this one package's package.json — nothing else moves.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** Build output and vendored code — never worth linting. */
export const ignores = [
  '**/.next/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/*.min.js',
  '**/next-env.d.ts',
];

export const base = [
  { ignores },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
    rules: {
      // TypeScript already reports undefined identifiers, and the core rule does not
      // understand type-only or ambient declarations, so it fires false positives.
      'no-undef': 'off',

      // The typescript-eslint version understands types, overloads and `_` conventions.
      // Only one of the two should ever be enabled.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // Warn, not error: there is a large pre-existing `any` surface and a big-bang
      // rewrite is not worth blocking every build on. Individual apps can tighten it.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Correctness, not style — these stay errors everywhere.
      eqeqeq: ['error', 'smart'],
      'no-constant-binary-expression': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-promise-executor-return': 'error',
    },
  },
  {
    // Config and tooling files run in Node and may log.
    files: ['**/*.config.{js,mjs,cjs,ts}', '**/scripts/**'],
    rules: { 'no-console': 'off', '@typescript-eslint/no-require-imports': 'off' },
  },
];

export default base;
