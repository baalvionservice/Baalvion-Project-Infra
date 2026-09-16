import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The mailer's production guarantees.
 *
 * Two of these matter more than the rest. A verification or reset link is a BEARER
 * CREDENTIAL — whoever holds it can take the account — so it must never reach a log that
 * gets shipped somewhere. And a production deployment with no transport must say so at
 * BOOT, because otherwise the failure is invisible until a real person registers and never
 * receives anything.
 *
 * Each case runs in its own child process rather than through a module mock. The mailer and
 * its config are CommonJS, and `vi.resetModules()` does not clear Node's require cache for a
 * transitively-required CJS module — so an in-process attempt kept reading whichever
 * configuration loaded first and quietly asserted against the developer's own .env. A child
 * process gets a real environment, the real config loader and the real code path, which is
 * what these guarantees are about.
 */

const SERVICE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LINK = 'https://canwemarry.com/verify-email?token=SECRETTOKEN123456';

/** Run a snippet against the real mailer with a chosen environment; return everything printed. */
function run(script, env = {}) {
    // Both streams: the boot diagnostic writes to console.error / console.warn, and a helper
    // that returned stdout alone would report those cases as silent.
    const result = spawnSync(process.execPath, ['-e', script], {
        cwd: SERVICE_DIR,
        encoding: 'utf8',
        env: {
            ...process.env,
            SMTP_HOST: '', SMTP_PORT: '587', SMTP_USER: '', SMTP_PASS: '',
            MAIL_DEV_LOG_LINKS: '',
            // Keep the SES branch out of it: these cases are about the SMTP/none ladder.
            AWS_SES_REGION: '', SES_REGION: '', AWS_REGION: '',
            ...env,
        },
    });
    return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

/** The last printed line, so the env loader's own banner cannot be mistaken for output. */
const lastLine = (out) => out.trim().split('\n').filter(Boolean).pop();

const describeJson = (env) =>
    JSON.parse(lastLine(run("process.stdout.write('\\n' + JSON.stringify(require('./utils/mailer').describeMailer()))", env)));

describe('what the transport is, reported safely', () => {
    it('reports "none" when neither SES nor SMTP is configured', () => {
        const state = describeJson({});
        expect(state.transport).toBe('none');
        expect(state.configured).toBe(false);
    });

    it('reports SMTP with its host and port once configured', () => {
        const state = describeJson({ SMTP_HOST: 'smtp.example.net', SMTP_PORT: '587' });
        expect(state.transport).toBe('smtp');
        expect(state.configured).toBe(true);
        expect(state.detail).toBe('smtp.example.net:587');
    });

    it('says WHETHER there are credentials, never what they are', () => {
        const state = describeJson({
            SMTP_HOST: 'smtp.example.net', SMTP_USER: 'ses-user-AKIA', SMTP_PASS: 'super-secret-password',
        });
        expect(state.authenticated).toBe(true);
        const json = JSON.stringify(state);
        expect(json).not.toContain('super-secret-password');
        expect(json).not.toContain('ses-user-AKIA');
    });
});

describe('a log line cannot be forged through an address', () => {
    it('a newline in the recipient does not become a second log entry', () => {
        // The address is whatever somebody typed at registration. Interpolated raw it lets
        // them write their own lines into the log, which read exactly like real ones.
        const out = run(
            "require('./utils/mailer').sendMail({ to: 'a@b.com\\n[Mailer] FORGED — transport ok', subject: 'S', html: '<p>x</p>' })",
            { NODE_ENV: 'development' },
        );
        const forged = out.split('\n').filter((l) => l.includes('FORGED'));
        // It may still appear — flattened into the one legitimate line — but never as a
        // line of its own that begins with the log prefix.
        expect(forged.every((l) => !l.trimStart().startsWith('[Mailer] FORGED'))).toBe(true);
    });

    it('control characters in the subject are dropped', () => {
        const out = run(
            "require('./utils/mailer').sendMail({ to: 'a@b.com', subject: 'S\\u0007\\u0008BEL', html: '<p>x</p>' })",
            { NODE_ENV: 'development' },
        );
        expect(out).not.toMatch(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/);
    });
});

describe('a misconfigured production deployment is loud at boot', () => {
    it('logs an error naming what will not be delivered', () => {
        const out = run("require('./utils/mailer').reportMailerAtStartup()", { NODE_ENV: 'production' });
        expect(out).toMatch(/NO TRANSPORT CONFIGURED/);
        expect(out).toMatch(/password-reset/i);
    });

    it('does not stop the service from starting', () => {
        // auth-service also serves login, refresh and token verification for the whole
        // platform. Refusing to boot over email would turn a degraded-email incident into a
        // total outage. Reaching the final line proves it returned rather than exited.
        const out = run(
            "require('./utils/mailer').reportMailerAtStartup(); console.log('STILL-RUNNING')",
            { NODE_ENV: 'production' },
        );
        expect(out).toContain('STILL-RUNNING');
    });

    it('is a warning, not an error, in development', () => {
        const out = run("require('./utils/mailer').reportMailerAtStartup()", { NODE_ENV: 'development' });
        expect(out).toMatch(/No transport configured/);
        expect(out).not.toMatch(/NO TRANSPORT CONFIGURED/);
    });

    it('names the transport, and no credential, when one IS configured', () => {
        const out = run("require('./utils/mailer').reportMailerAtStartup()", {
            NODE_ENV: 'production', SMTP_HOST: 'smtp.example.net', SMTP_USER: 'u', SMTP_PASS: 'super-secret-password',
        });
        expect(out).toMatch(/SMTP configured \(smtp\.example\.net:587\)/);
        expect(out).not.toContain('super-secret-password');
    });
});

describe('a one-time link never reaches a production log', () => {
    const send = `require('./utils/mailer').sendMail({
        to: 'someone@example.com', subject: 'Verify your account',
        html: '<p><a href="${LINK}">Verify</a></p>',
    }).then(() => {});`;

    it('production logs the failure without the body or the link', () => {
        // MAIL_DEV_LOG_LINKS is deliberately set here: the production branch returns BEFORE
        // that opt-in is read, so switching it on in production cannot resurrect the leak.
        const out = run(send, { NODE_ENV: 'production', MAIL_DEV_LOG_LINKS: 'true' });
        expect(out).not.toContain('SECRETTOKEN123456');
        expect(out).not.toContain('<p>');
        expect(out).toMatch(/NO TRANSPORT CONFIGURED/);
    });

    it('development withholds the body too, unless the link opt-in is set', () => {
        const out = run(send, { NODE_ENV: 'development' });
        expect(out).not.toContain('SECRETTOKEN123456');
        expect(out).toContain('someone@example.com');   // the recipient is useful in dev
    });

    it('development CAN print the link when a developer asks for it', () => {
        const out = run(send, { NODE_ENV: 'development', MAIL_DEV_LOG_LINKS: 'true' });
        expect(out).toContain('SECRETTOKEN123456');
    });
});

describe('isMailerConfigured answers honestly', () => {
    const configured = (env) =>
        lastLine(run("process.stdout.write('\\n' + String(require('./utils/mailer').isMailerConfigured()))", env));

    it('false with no transport', () => {
        expect(configured({})).toBe('false');
    });

    it('true once SMTP has a host', () => {
        expect(configured({ SMTP_HOST: 'smtp.example.net' })).toBe('true');
    });
});
