import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: false,
        include: ['test/**/*.test.js'],
        // Transform CJS modules so vitest (ESM runner) can import them.
        server: { deps: { inline: [/.*/] } },
        isolate: true,
        env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
    },
});
