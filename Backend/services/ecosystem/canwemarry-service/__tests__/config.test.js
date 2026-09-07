'use strict';
/**
 * Database and identity configuration.
 *
 * Constructing a Sequelize instance does not open a connection, so these assertions run
 * without Postgres — they check that the service is WIRED correctly (own schema, no
 * credentials of its own, closed-by-default flags), which is the part that silently
 * breaks in a deployment.
 */
const path = require('node:path');

const SERVICE_ROOT = path.join(__dirname, '..');
const withEnv = (env, fn) => {
    const saved = { ...process.env };
    Object.assign(process.env, env);
    jest.resetModules();
    try { return fn(); } finally {
        process.env = saved;
        jest.resetModules();
    }
};

const BASE_ENV = { JWT_PUBLIC_KEY: 'test-public-key', NODE_ENV: 'test' };

describe('service configuration', () => {
    test('the service owns its own Postgres schema', () => {
        withEnv(BASE_ENV, () => {
            const config = require(path.join(SERVICE_ROOT, 'config/appConfig'));
            // One service, one schema (system contract rule C1). Reading another domain's
            // tables would be a cross-service DB access violation.
            expect(config.db.schema).toBe('canwemarry');
        });
    });

    test('a verification key is mandatory and the service holds no signing key', () => {
        withEnv({ ...BASE_ENV, JWT_PUBLIC_KEY: '' }, () => {
            // requireEnv fails closed: booting without a way to verify tokens would leave
            // every gate open rather than shut.
            expect(() => require(path.join(SERVICE_ROOT, 'config/appConfig'))).toThrow();
        });

        withEnv(BASE_ENV, () => {
            const config = require(path.join(SERVICE_ROOT, 'config/appConfig'));
            expect(config.jwt.publicKey).toBe('test-public-key');
            expect(config.jwt).not.toHaveProperty('privateKey');
            expect(config.jwt).not.toHaveProperty('accessSecret');
        });
    });

    test('escaped newlines in a PEM environment variable are restored', () => {
        withEnv({ ...BASE_ENV, JWT_PUBLIC_KEY: '-----BEGIN-----\\nAAAA\\n-----END-----' }, () => {
            const config = require(path.join(SERVICE_ROOT, 'config/appConfig'));
            expect(config.jwt.publicKey).toContain('\n');
            expect(config.jwt.publicKey).not.toContain('\\n');
        });
    });

    test('site-wide public cases are off unless a deployment opts in', () => {
        withEnv(BASE_ENV, () => {
            expect(require(path.join(SERVICE_ROOT, 'config/appConfig')).features.allowPublicCases).toBe(false);
        });
        withEnv({ ...BASE_ENV, ALLOW_PUBLIC_CASES: 'true' }, () => {
            expect(require(path.join(SERVICE_ROOT, 'config/appConfig')).features.allowPublicCases).toBe(true);
        });
    });

    test('CORS is an explicit origin list, never a wildcard', () => {
        withEnv({ ...BASE_ENV, CORS_ORIGINS: 'https://a.example,https://b.example' }, () => {
            const config = require(path.join(SERVICE_ROOT, 'config/appConfig'));
            expect(config.corsOrigins).toEqual(['https://a.example', 'https://b.example']);
            expect(config.corsOrigins).not.toContain('*');
        });
    });
});

describe('model definitions', () => {
    test('every model is bound to the canwemarry schema', () => {
        withEnv(BASE_ENV, () => {
            const db = require(path.join(SERVICE_ROOT, 'models'));
            expect(db.sequelize.getDialect()).toBe('postgres');
            for (const key of ['User', 'Case', 'CaseParticipant', 'Report', 'AuditLog']) {
                expect(db[key].options.schema).toBe('canwemarry');
            }
        });
    });

    test('the users table stores no credential or contact column', () => {
        withEnv(BASE_ENV, () => {
            const db = require(path.join(SERVICE_ROOT, 'models'));
            const columns = Object.keys(db.User.rawAttributes);
            // Identity stays with auth-service; a breach of this database yields nothing
            // that could be used to sign in anywhere.
            for (const forbidden of ['email', 'password', 'password_hash', 'phone', 'reset_token']) {
                expect(columns).not.toContain(forbidden);
            }
        });
    });

    test('a case participant has no column that could name a non-consenting person', () => {
        withEnv(BASE_ENV, () => {
            const db = require(path.join(SERVICE_ROOT, 'models'));
            const columns = Object.keys(db.CaseParticipant.rawAttributes);
            for (const forbidden of ['name', 'display_name', 'full_name', 'email', 'phone', 'address', 'notes']) {
                expect(columns).not.toContain(forbidden);
            }
            expect(columns).toContain('relation');
            expect(columns).toContain('consent_status');
        });
    });
});
