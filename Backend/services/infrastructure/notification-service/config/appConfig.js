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
        },
    },

    // BullMQ queues
    queues: {
        email:        'baalvion:queue:email',
        webhook:      'baalvion:queue:webhook',
        notification: 'baalvion:queue:notification',
    },

    // Retry strategy
    retry: {
        email:   { attempts: 4, backoff: { type: 'exponential', delay: 5_000 } },
        webhook: { attempts: 5, backoff: { type: 'exponential', delay: 10_000 } },
    },

    // Rate limits (per recipient per hour)
    rateLimits: {
        emailPerRecipientPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '10', 10),
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
