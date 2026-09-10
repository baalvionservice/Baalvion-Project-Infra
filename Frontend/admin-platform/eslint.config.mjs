import next from '@baalvion/eslint-config/next';

export default [
  ...next,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
