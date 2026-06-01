import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: 'node20',
  outDir: 'dist',
  // Workspace packages + express are resolved at the service, loaded lazily here.
  external: ['@baalvion/events', '@baalvion/logger', '@baalvion/telemetry', '@baalvion/service-kit', '@baalvion/cache', 'express'],
});
