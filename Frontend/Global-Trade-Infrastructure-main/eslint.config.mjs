import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * ESLint 9 flat config for the GTI app (Next.js 15.5).
 * Wired as part of the Phase-2 production audit. Reporting-only for now —
 * `eslint.ignoreDuringBuilds` stays true so a lint finding never blocks a
 * deploy until the existing violations are triaged.
 */
const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'prisma/migrations/**',
      'public/**',
      'next-env.d.ts',
      '**/*.config.{js,mjs,ts}',
      'tsconfig.tsbuildinfo',
    ],
  },
];

export default config;
