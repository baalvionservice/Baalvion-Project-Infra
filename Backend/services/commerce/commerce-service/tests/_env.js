'use strict';

// Test bootstrap — required FIRST by every unit test that transitively loads
// config/appConfig.js. That config fail-louds when JWT_PUBLIC_KEY is unset (a
// deliberate "refuse to boot insecure" guard). Locally dotenv reads the dev's
// .env so the key is present; CI has no .env, so the config throws on import
// and the whole node:test suite exits non-zero.
//
// These are pure unit tests (stubbed models, in-memory fake Redis) that never
// verify a real token, so a deterministic dummy public key is sufficient to let
// the config boot. dotenv.config() does not override an already-set process.env
// value, so a real local .env still wins when present.
process.env.JWT_PUBLIC_KEY =
    process.env.JWT_PUBLIC_KEY || 'test-only-public-key-not-used-for-verification';
