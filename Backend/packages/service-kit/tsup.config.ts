import { defineConfig } from 'tsup';

export default defineConfig({
  entry:       ['src/index.ts'],
  format:      ['cjs', 'esm'],
  dts:         true,
  clean:       true,
  sourcemap:   true,
  splitting:   false,
  treeshake:   true,
  target:      'node20',
  outDir:      'dist',
  // Composed platform packages + optional peers are resolved at the service, not bundled.
  external:    ['@baalvion/telemetry', '@baalvion/events', '@baalvion/graceful-shutdown', '@baalvion/rbac', '@baalvion/types', 'express', 'jose'],
});
