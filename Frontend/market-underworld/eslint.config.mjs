import next from '@baalvion/eslint-config/next';

export default [
  ...next,
  {
    rules: {
      // Style-only, and the pre-existing quote usage is not worth a big-bang rewrite.
      'react/no-unescaped-entities': 'warn',
    },
  },
];
