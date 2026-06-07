import { defineConfig } from 'tsup';

const shared = {
  format:    ['cjs', 'esm'] as const,
  dts:       true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target:    'es2020' as const,
  outDir:    'dist',
  external:  ['react', 'react-dom'],
};

// Two builds so the "use client" directive lives ONLY in the React client
// entry (dist/react/*) and never the framework-agnostic SDK core (dist/index.*).
// esbuild hoists its runtime helpers above any module-level directive while
// bundling, so it strips an inline/`banner` "use client" and warns. We instead
// re-apply the directive after bundling (onSuccess), keeping the build warning-
// free while preserving a correct client boundary for consumers.
export default defineConfig([
  {
    ...shared,
    entry: ['src/index.ts'],
    clean: true,
  },
  {
    ...shared,
    entry: { 'react/index': 'src/react/index.tsx' },
    clean: false,
    async onSuccess() {
      const { readFile, writeFile } = await import('node:fs/promises');
      const files = ['dist/react/index.js', 'dist/react/index.mjs'];
      for (const file of files) {
        const body = await readFile(file, 'utf8');
        if (!body.startsWith('"use client"')) {
          await writeFile(file, `"use client";\n${body}`);
        }
      }
    },
  },
]);
