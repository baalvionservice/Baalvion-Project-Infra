const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
};

module.exports = {
    env:         process.env.NODE_ENV   || 'development',
    port:        Number(process.env.PORT || 3001),
    apiVersion:  'v1',
    baseUrl:     process.env.API_BASE_URL  || 'http://localhost:3001',
    frontendUrl: process.env.FRONTEND_URL  || 'http://localhost:8080',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080']),

    refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'baalvion_refresh',
    // Cross-subdomain SSO: set to '.baalvion.com' in production so the refresh cookie is shared by
    // every *.baalvion.com site (the shared auth.baalvion.com surface signs the user in once).
    // Empty (default) = host-only cookie, preserving single-host/local behaviour.
    refreshCookieDomain: process.env.REFRESH_COOKIE_DOMAIN || '',

    jwt: {
        // RS256 is the ONLY signing path (config/vault.js + utils/jwtRsa.js). These HS256
        // secrets are deprecated and unused; read them OPTIONALLY so a missing value can never
        // block startup. Do NOT reintroduce requireEnv() here — that crash-on-boot was the
        // landmine that blocked clean redeploys (Phase 0). Locked by test/unit/publicContract.test.js.
        accessSecret:      process.env.JWT_ACCESS_SECRET  || null,
        refreshSecret:     process.env.JWT_REFRESH_SECRET || null,
        accessExpiresIn:   process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
        refreshExpiresIn:  process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer:            process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:          process.env.JWT_AUDIENCE || 'baalvion-platform',
    },

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT || 5432),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },

    redis: {
        host:     process.env.REDIS_HOST     || '',       // empty = disabled
        port:     Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || '',
        db:       Number(process.env.REDIS_DB   || 0),
    },

    security: {
        bcryptRounds:  Number(process.env.BCRYPT_ROUNDS       || 12),
        ipRateLimit:   Number(process.env.RATE_LIMIT_IP_MAX   || 20),
        emailRateLimit:Number(process.env.RATE_LIMIT_EMAIL_MAX || 10),
        // Phone-verification OTP policy.
        otp: {
            length:         Number(process.env.OTP_LENGTH           || 6),   // digits
            ttlSeconds:     Number(process.env.OTP_TTL_SECONDS       || 600), // 10 minutes
            maxAttempts:    Number(process.env.OTP_MAX_ATTEMPTS      || 5),   // verify tries per code
            resendCooldown: Number(process.env.OTP_RESEND_COOLDOWN_S || 60),  // min seconds between sends
        },
        // Passwordless email-OTP login policy. Kept SEPARATE from the phone `otp` block so the
        // public sign-in/sign-up experience enforces its own (stricter) rules without changing
        // the authenticated phone-verification flow.
        emailOtp: {
            length:              Number(process.env.OTP_LENGTH                  || 6),   // digits
            ttlSeconds:          Number(process.env.EMAIL_OTP_TTL_SECONDS       || 300), // 5 minutes (spec)
            maxAttempts:         Number(process.env.EMAIL_OTP_MAX_ATTEMPTS      || 5),   // verify tries per code
            resendCooldown:      Number(process.env.EMAIL_OTP_RESEND_COOLDOWN_S || 60),  // min seconds between sends
            maxResends:          Number(process.env.EMAIL_OTP_MAX_RESENDS       || 3),   // hard cap of code re-sends…
            resendWindowSeconds: Number(process.env.EMAIL_OTP_RESEND_WINDOW_S   || 900), // …counted over this window
        },
        // Bot/spam defence on the public OTP-request endpoint. Cloudflare Turnstile token is
        // verified server-side. ENFORCED whenever a secret is configured (always in prod); skipped
        // in local dev when unset so the flow stays runnable without a captcha.
        turnstile: {
            secretKey: process.env.TURNSTILE_SECRET_KEY || '',
            verifyUrl: process.env.TURNSTILE_VERIFY_URL || 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        },
        // Genuine-email gate: reject disposable/temp inboxes and require a deliverable domain
        // (MX, falling back to A/AAAA) before a code is ever sent.
        emailValidation: {
            rejectDisposable: (process.env.EMAIL_REJECT_DISPOSABLE || 'true') !== 'false',
            requireMx:        (process.env.EMAIL_REQUIRE_MX        || 'true') !== 'false',
            dnsTimeoutMs:     Number(process.env.EMAIL_DNS_TIMEOUT_MS || 4000),
        },
    },

    // ── Session enrichment (Phase 2 — absorbed from the retired session-service) ──
    // Computes geo / device / risk inline after a session is created. FAIL-SOFT:
    // enrichment errors are swallowed and NEVER block login. Toggle off via
    // SESSION_ENRICHMENT_ENABLED=false. Thresholds migrated from session-service.
    sessionEnrichment: {
        enabled:             (process.env.SESSION_ENRICHMENT_ENABLED || 'true') !== 'false',
        impossibleTravelKmh: Number(process.env.IMPOSSIBLE_TRAVEL_KMH || 900),
        highRiskScore:       Number(process.env.HIGH_RISK_SCORE       || 70),
    },

    email: {
        from: process.env.EMAIL_FROM  || 'noreply@baalvion.com',
        host: process.env.SMTP_HOST   || '',
        port: Number(process.env.SMTP_PORT || 587),
        user: process.env.SMTP_USER   || '',
        pass: process.env.SMTP_PASS   || '',
    },

    // ── SMS / phone OTP delivery (utils/sms.js) ──────────────────────────────────────
    // provider: 'twilio' | 'webhook' | '' (DEV console fallback — logs the code, never sends).
    sms: {
        provider:     process.env.SMS_PROVIDER     || '',
        webhookUrl:   process.env.SMS_WEBHOOK_URL  || '',
        webhookToken: process.env.SMS_WEBHOOK_TOKEN || '',
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID || '',
            authToken:  process.env.TWILIO_AUTH_TOKEN  || '',
            from:       process.env.TWILIO_FROM        || '',
        },
    },

    eventBus: {
        stream: process.env.EVENT_BUS_STREAM || 'baalvion:events',
    },

    // Consumer social login (Google / Facebook). Credentials are resolved per-site from
    // the CMS vault first (admin panel), then these env vars. See service/oauthLogin.js +
    // service/oauthProviders.js. Amarisé talks to auth-service directly (no gateway).
    oauth: {
        // Public origin the provider redirects the BROWSER back to. Must serve the SPA AND
        // /auth-bff/* (which the SPA rewrites to auth-service /v1/auth/*). e.g. https://amarisemaisonavenue.com
        publicBaseUrl: process.env.OAUTH_PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:8080',
        // Where the post-login redirect lands (the site). Usually == publicBaseUrl.
        appUrl: process.env.OAUTH_APP_URL || process.env.OAUTH_PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:8080',
        // CMS website slug this auth-service instance serves (per-site cred lookup).
        siteSlug: process.env.AUTH_SITE_SLUG || process.env.CMS_WEBSITE_SLUG || '',
        cmsBaseUrl: process.env.CMS_BASE_URL || process.env.CMS_INTERNAL_URL || 'http://localhost:3011/api/v1',
        stateTtlMs: Number(process.env.OAUTH_STATE_TTL_MS || 10 * 60 * 1000),
        google: {
            clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
        },
        facebook: {
            clientId: process.env.FACEBOOK_OAUTH_CLIENT_ID || '',
            clientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET || '',
        },
    },
};
