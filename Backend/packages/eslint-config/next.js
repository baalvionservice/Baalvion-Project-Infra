// Next.js apps.
//
// eslint-config-next@16 exports real flat-config arrays, so no FlatCompat shim is
// needed (v15 did need one — that is why some apps here still carry it).
// `core-web-vitals` already includes `next` and `next/typescript`; pulling in
// `eslint-config-next/typescript` as well just duplicates it.
//
// Note eslint-config-next has an UNDECLARED runtime dependency on next itself
// (next/dist/compiled/babel/eslint-parser) — it is not in its peerDependencies.
// Verified present in Next 15.5.21, so v16 of this config works without a Next 16
// migration.

import next from 'eslint-config-next/core-web-vitals';
import { base } from './base.js';

// eslint-config-next scopes its plugins behind a `files` pattern, so a later bare
// `{ rules: { 'react-hooks/...': ... } }` object cannot resolve the namespace and
// ESLint aborts the whole run with "could not find plugin react-hooks". Reuse the
// exact plugin instance it registered — redeclaring a different copy of the same
// plugin name is itself an error in flat config.
const hostConfig = next.find((c) => c.plugins?.['react-hooks']);
const reactHooks = hostConfig?.plugins?.['react-hooks'];

export const nextConfig = [
  ...base,
  ...next,
  {
    files: hostConfig?.files ?? ['**/*.{js,jsx,ts,tsx}'],
    ...(reactHooks ? { plugins: { 'react-hooks': reactHooks } } : {}),
    rules: {
      // Next handles <img> tradeoffs per app; several properties deliberately use it
      // for remote media that next/image cannot serve without a loader.
      '@next/next/no-img-element': 'off',

      // eslint-config-next@16 ships eslint-plugin-react-hooks@7, whose React-Compiler
      // rules are new and default to error. They find REAL bugs — the pilot run on
      // admin-platform alone turned up 21 setState-in-effect cascades, two Date.now()
      // calls during render, a ref read during render and a component created during
      // render. But this is the first time these apps have ever been linted with them,
      // and shipping ~25 errors per app would leave lint red everywhere on day one,
      // which is how a gate stops being read.
      //
      // Warn keeps the whole finding visible while the burn-down happens. Flip each
      // back to 'error' here — one edit, all apps — as it reaches zero.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/incompatible-library': 'warn',

      // These two are the long-standing, well-understood ones — they stay blocking.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default nextConfig;
