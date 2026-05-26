import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals:     false,
        // Transform CJS modules so vitest (ESM runner) can import them
        server: {
            deps: {
                inline: [/.*/],
            },
        },
        // Each test file gets its own module registry (prevents singleton bleed)
        isolate:  true,
        // Silence pino output during tests
        env: {
            NODE_ENV:  'test',
            LOG_LEVEL: 'silent',
        },
    },
});
