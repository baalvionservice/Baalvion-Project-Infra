'use strict';
// The service refuses to boot without a token verification key (requireEnv fails closed).
// Tests get a placeholder; config.test.js overrides it to assert the fail-closed behaviour.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'test-public-key';
process.env.NODE_ENV = 'test';
