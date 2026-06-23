'use strict';
require('dotenv').config();

module.exports = {
    port:    parseInt(process.env.PORT || '3031', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()),

    redis: {
        host:     process.env.REDIS_HOST     || 'localhost',
        port:     parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    jwt: {
        publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || undefined,
        publicKeyB64:  process.env.JWT_PUBLIC_KEY_B64  || undefined,
        publicKey:     process.env.JWT_PUBLIC_KEY       || undefined,
        issuer:        process.env.JWT_ISSUER           || 'baalvion-auth',
        audience:      process.env.JWT_AUDIENCE         || 'baalvion',
    },

    // Email providers (in priority order)
    email: {
        fromAddress: process.env.EMAIL_FROM         || 'noreply@baalvion.com',
        fromName:    process.env.EMAIL_FROM_NAME    || 'Baalvion',
        replyTo:     process.env.EMAIL_REPLY_TO     || 'support@baalvion.com',
        // Resend (primary)
        resendApiKey: process.env.RESEND_API_KEY    || '',
        // SMTP fallback
        smtp: {
            host: process.env.SMTP_HOST || '',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
            // Implicit TLS (default true only for 465). Override with SMTP_SECURE=true.
            secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
            // Force STARTTLS for non-465 ports by default; SMTP_REQUIRE_TLS=false allows plain SMTP.
            requireTLS: process.env.SMTP_REQUIRE_TLS ? process.env.SMTP_REQUIRE_TLS !== 'false' : Number(process.env.SMTP_PORT || 587) !== 465,
        },
    },

    // SMS channel. Twilio is the provider; with no creds the dev "log" provider is
    // used (prints instead of sending) — same pattern as email's SMTP fallback.
    sms: {
        provider:           process.env.SMS_PROVIDER || (process.env.TWILIO_ACCOUNT_SID ? 'twilio' : 'log'),
        from:               process.env.TWILIO_FROM || '',
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID || '',
            authToken:  process.env.TWILIO_AUTH_TOKEN  || '',
        },
    },

    // Push channel. Provider-agnostic: FCM (firebase-admin) and Web Push (VAPID) are
    // BOTH optional + lazy-loaded — neither is required. No creds → dev "log" provider.
    // FCM here is a push TRANSPORT only; it is NOT Firebase auth.
    push: {
        // 'fcm' | 'webpush' | 'log' | 'auto' (auto = whichever is configured)
        provider:   process.env.PUSH_PROVIDER || 'auto',
        fcm: {
            // service-account JSON (inline), base64, or a file path — any one enables FCM
            serviceAccount:     process.env.FCM_SERVICE_ACCOUNT || '',
            serviceAccountB64:  process.env.FCM_SERVICE_ACCOUNT_B64 || '',
            serviceAccountPath: process.env.FCM_SERVICE_ACCOUNT_PATH || '',
            projectId:          process.env.FCM_PROJECT_ID || '',
        },
        webpush: {
            publicKey:  process.env.VAPID_PUBLIC_KEY  || '',
            privateKey: process.env.VAPID_PRIVATE_KEY || '',
            subject:    process.env.VAPID_SUBJECT     || 'mailto:support@baalvion.com',
        },
    },

    // In-app / realtime channel. Notifications are published to Redis pub/sub for
    // realtime-service to fan out over WebSocket, and stored in a per-user inbox.
    inapp: {
        // realtime-service subscribes to `${channelPrefix}:<userId>`
        channelPrefix: process.env.REALTIME_CHANNEL_PREFIX || 'baalvion:realtime:user',
        inboxMax:      parseInt(process.env.INAPP_INBOX_MAX || '100', 10),
        inboxTtlSec:   parseInt(process.env.INAPP_INBOX_TTL || '2592000', 10), // 30d
    },

    // Redis key prefixes for device tokens + per-user channel preferences
    keys: {
        devices: 'notif:devices',  // hash per user: token -> {platform, ts}
        prefs:   'notif:prefs',     // hash per user: channel -> 'on'|'off'
        inbox:   'notif:inbox',     // list per user of in-app notifications
    },

    // BullMQ queues. NOTE: BullMQ v5 forbids ':' in queue names (it is the Redis
    // key separator), so these use '-'. The Redis *stream* names below keep ':'.
    queues: {
        email:        'baalvion-queue-email',
        webhook:      'baalvion-queue-webhook',
        sms:          'baalvion-queue-sms',
        push:         'baalvion-queue-push',
        notification: 'baalvion-queue-notification',
    },

    // Retry strategy
    retry: {
        email:   { attempts: 4, backoff: { type: 'exponential', delay: 5_000 } },
        webhook: { attempts: 5, backoff: { type: 'exponential', delay: 10_000 } },
        sms:     { attempts: 4, backoff: { type: 'exponential', delay: 5_000 } },
        push:    { attempts: 3, backoff: { type: 'exponential', delay: 4_000 } },
    },

    // Rate limits (per recipient per hour)
    rateLimits: {
        emailPerRecipientPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '10', 10),
        smsPerRecipientPerHour:   parseInt(process.env.SMS_RATE_LIMIT_PER_HOUR   || '10', 10),
        pushPerRecipientPerHour:  parseInt(process.env.PUSH_RATE_LIMIT_PER_HOUR  || '60', 10),
    },

    // Redis Streams event bus
    eventBus: {
        stream:        'baalvion:events',
        dlqStream:     'baalvion:events:dlq',
        consumerGroup: 'notification-service',
        consumerName:  `notification-${process.env.POD_NAME || 'local'}`,
        batchSize:     parseInt(process.env.EVENT_BATCH_SIZE || '10', 10),
        blockMs:       parseInt(process.env.EVENT_BLOCK_MS   || '2000', 10),
    },

    // Internal service auth
    internalSecret: require('@baalvion/auth-node').requireEnv('INTERNAL_SERVICE_SECRET'),

    // App URL for links in emails
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:3030',
};
