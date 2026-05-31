import { defineConfig } from 'tsup';

export default defineConfig({
  entry:     ['src/index.ts'],
  format:    ['cjs', 'esm'],
  dts:       true,
  clean:     true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target:    'node20',
  outDir:    'dist',
  // @opensearch-project/opensearch is a runtime dependency — keep it external.
  external:  ['@opensearch-project/opensearch'],
});
