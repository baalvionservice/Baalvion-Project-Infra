import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  {
    rules: {
      // Downgraded to warnings: real correctness rules (react-hooks/*, etc.)
      // stay as build-breaking errors; these two are style-only and the
      // large amount of pre-existing `any`/quote usage isn't worth a
      // big-bang rewrite in this pass.
      'react/no-unescaped-entities': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

export default eslintConfig;
