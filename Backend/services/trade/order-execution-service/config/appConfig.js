'use strict';
const dotenv = require('dotenv');
dotenv.config();
const { parseHttpUrl } = require('../integrations/_shared/config');

const parseList = (v, f = []) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : f);

// Allowed ledger entry types (mirrors the Java ledger-service EntryType enum). When the
// GL-on-settlement post is enabled, an illegal entry type would be rejected by the ledger at
// runtime on every settlement — fail fast at boot instead.
const ALLOWED_LEDGER_ENTRY_TYPES = new Set(['PAYMENT', 'FEE', 'REVERSAL', 'SETTLEMENT', 'ESCROW', 'REFUND', 'ADJUSTMENT']);

const DEV_DEFAULTS = new Set(['changeme', 'secret', 'change_me', 'dev_finance_webhook_secret_change_me_min32', 'dev_internal_secret']);

// Schema name is interpolated as a raw SQL identifier (Sequelize :replacements only
// parameterize VALUES, not identifiers). Validate against a strict allowlist at boot
// so an attacker-controlled DB_SCHEMA can never inject SQL via raw `FROM ${schema}.…`.
const ALLOWED_SCHEMAS = new Set(['oms']); // add others only if legitimately used
const schema = process.env.DB_SCHEMA || 'oms';
if (!ALLOWED_SCHEMAS.has(schema)) {
    throw new Error(`Illegal DB_SCHEMA: ${schema}`);
}

// Only these envs may fall back to a baked-in dev default. Every other env
// (production, staging, preprod, …) MUST supply a real secret — a guessable dev
// default there is fail-fast, closing the prior gap where only NODE_ENV==='production'
// was guarded and `staging` silently ran on the dev secret.
const SECRET_RELAXED_ENVS = new Set(['development', 'test']);

function requireSecret(envVar, devDefault, label) {
    const value = process.env[envVar];
    const env = process.env.NODE_ENV || 'development';
    if (!SECRET_RELAXED_ENVS.has(env)) {
        if (!value || value.trim() === '' || DEV_DEFAULTS.has(value.trim())) {
            console.error(`[appConfig] FATAL: ${label} (${envVar}) missing or dev default in env '${env}'.`);
            process.exit(1);
        }
        return value.trim();
    }
    return value || devDefault;
}

// 7A: when the RazorpayX rail is live, an empty inbound-webhook secret means every
// settlement webhook silently 401s (real money never settles back). Fail-fast in a
// non-relaxed env (mirrors requireSecret); WARN in dev/test so it stays runnable.
function resolveRazorpayWebhookSecret() {
    const value = process.env.RAZORPAYX_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '';
    if ((process.env.PAYMENT_PROVIDER || 'internal') !== 'razorpayx') return value;
    if (value && value.trim() !== '') return value;
    const env = process.env.NODE_ENV || 'development';
    if (!SECRET_RELAXED_ENVS.has(env)) {
        console.error(`[appConfig] FATAL: RazorpayX webhook secret (RAZORPAYX_WEBHOOK_SECRET) missing while PAYMENT_PROVIDER=razorpayx in env '${env}'.`);
        process.exit(1);
    }
    console.error(`[appConfig] WARN: PAYMENT_PROVIDER=razorpayx but RAZORPAYX_WEBHOOK_SECRET is empty in env '${env}' — all settlement webhooks will 401.`);
    return value;
}

// LOW: validate the ledger entry type + service URL at boot when the GL-on-settlement post is
// armed. A bad entry type or non-http(s) URL would otherwise fail (or, for the URL, risk an
// SSRF) only at the first real settlement — surface it at boot instead.
function validateLedgerConfig() {
    if (process.env.LEDGER_POST_ON_SETTLEMENT !== 'true') return;
    const entryType = process.env.LEDGER_SETTLEMENT_ENTRY_TYPE || 'SETTLEMENT';
    if (!ALLOWED_LEDGER_ENTRY_TYPES.has(entryType)) {
        throw new Error(`Illegal LEDGER_SETTLEMENT_ENTRY_TYPE: ${entryType} (allowed: ${[...ALLOWED_LEDGER_ENTRY_TYPES].join(', ')})`);
    }
    const ledgerUrl = process.env.LEDGER_SERVICE_URL || 'http://127.0.0.1:3016';
    parseHttpUrl(ledgerUrl); // throws INVALID_URL on unparseable / non-http(s)
}
validateLedgerConfig();

// KYC gate boot guard. The gate is now TENANT-BOUND: it resolves a platform-owned registry
// binding (tenant_id, subject_ref) -> status (services/kycRegistry), filtering by the order's
// tenant (+ RLS), and the provider verification id is stored server-side — so the prior
// caller-supplied-kycId IDOR is closed. The only remaining boot concern is that start/refresh
// still need the Onfido token, so fail fast when it is missing in a non-relaxed env.
function guardKycGate() {
    if (process.env.KYC_GATE !== 'true') return;
    const env = process.env.NODE_ENV || 'development';
    if ((process.env.KYC_PROVIDER || 'onfido') !== 'onfido') return;
    if ((process.env.ONFIDO_API_TOKEN || '').trim()) return;
    if (SECRET_RELAXED_ENVS.has(env)) {
        console.error(`[appConfig] WARN: KYC_GATE=true with provider=onfido but ONFIDO_API_TOKEN is empty in env '${env}' — KYC start/refresh would fail (the registry gate still blocks un-verified subjects).`);
        return;
    }
    console.error(`[appConfig] FATAL: KYC_GATE=true and KYC_PROVIDER=onfido but ONFIDO_API_TOKEN is empty in env '${env}' — KYC verifications cannot be started/refreshed.`);
    process.exit(1);
}
guardKycGate();

module.exports = {
    service: process.env.SERVICE_NAME || 'order-execution-service',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3052),
    // F3: own schema (not `trade`) — avoids the table collision with
    // commerce/trade-service which owns the canonical integer-keyed trade.orders.
    schema,
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        // R1: services connect as the NON-SUPERUSER role so RLS is enforced.
        user: process.env.DB_USER || 'baalvion_app',
        password: process.env.DB_PASSWORD || '',
    },
    // F4: migrations run as the privileged OWNER role (not baalvion_app) so table
    // ownership + RLS DDL are correct and the app role stays subject to RLS.
    migration: {
        user: process.env.MIGRATION_DB_USER || process.env.DB_USER || 'baalvion_app',
        password: process.env.MIGRATION_DB_PASSWORD || process.env.DB_PASSWORD || '',
    },
    security: {
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120),
        gatewaySigningSecret: requireSecret('GATEWAY_SIGNING_SECRET', 'dev_gateway_signing_secret', 'Gateway signing secret'),
    },
    finance: {
        webhookSecret: requireSecret('FINANCE_WEBHOOK_SECRET', 'dev_finance_webhook_secret_change_me_min32', 'Finance webhook secret'),
    },
    eventBus: {
        transport: process.env.EVENT_TRANSPORT || 'redis',
        stream: process.env.EVENT_STREAM || 'baalvion:events',
        consumerGroup: process.env.EVENT_CONSUMER_GROUP || 'order-execution-service',
    },
    cmsBaseUrl: process.env.CMS_BASE_URL || 'http://localhost:3011',
    // S2S auth secret — production fail-fast (a guessable default is a service-impersonation
    // vector into payment-service / cms-service). Was previously an unguarded `|| 'dev_internal_secret'`.
    internalSecret: requireSecret('INTERNAL_SERVICE_SECRET', 'dev_internal_secret', 'Internal service secret'),
    logLevel: process.env.LOG_LEVEL || 'info',
    bootstrapMigrations: process.env.BOOTSTRAP_MIGRATIONS !== 'false',
    startOutboxPublisher: process.env.OUTBOX_PUBLISHER !== 'false',
    startEventConsumer: process.env.EVENT_CONSUMER !== 'false',
    // Periodic money-truth / saga / outbox drift sweep (detection-only).
    startReconciliation: process.env.RECONCILIATION !== 'false',
    // Outbox redrive worker (recovery): re-publishes stuck PENDING / retriable FAILED
    // outbox rows via the existing bus. Leader-guarded so only one replica sweeps.
    startOutboxRedrive: process.env.OUTBOX_REDRIVE !== 'false',
    // Payment-service initiation (E2E money loop): oes triggers a real payment on
    // confirm; payment-service posts the ledger double-entry via Kafka choreography.
    payment: {
        enabled: process.env.PAYMENT_INITIATE !== 'false',
        url: process.env.PAYMENT_SERVICE_URL || 'http://127.0.0.1:3015',
        timeoutMs: Number(process.env.PAYMENT_TIMEOUT_MS || 5000),
        // Rail selection. 'internal' = Java payment-service (Kafka -> ledger double-entry,
        // settled back via the signed /finance-events webhook). 'razorpayx' = REAL RazorpayX
        // payout rail, settled back via the /webhooks/razorpay HMAC webhook. Default keeps
        // the existing internal path so flipping to a real rail is an explicit env choice.
        provider: process.env.PAYMENT_PROVIDER || 'internal',
        // Verifies inbound RazorpayX/Razorpay settlement webhooks (X-Razorpay-Signature).
        // 7A: boot fail-fast (non-relaxed env) when provider=razorpayx and the secret is empty.
        razorpayWebhookSecret: resolveRazorpayWebhookSecret(),
    },
    // R8 sanctions screening (counterparty screening at order placement).
    sanctions: {
        enabled: process.env.SANCTIONS_SCREENING !== 'false',
        // Screening backend. 'risk-service' = the in-repo Jaro-Winkler watchlist. 'opensanctions'
        // = the REAL OpenSanctions/yente engine (consolidated OFAC+EU+UN+UK lists). Both return
        // the same {status,confidence,matches} verdict and both FAIL-CLOSED on unavailability.
        provider: process.env.SANCTIONS_PROVIDER || 'risk-service',
        url: process.env.RISK_SERVICE_URL || 'http://127.0.0.1:3035',
        timeoutMs: Number(process.env.SANCTIONS_TIMEOUT_MS || 4000),
        // Fail-CLOSED by default: if the screening engine is unreachable, block the order
        // rather than let a potentially-sanctioned counterparty through (strict-liability).
        failOpen: process.env.SANCTIONS_FAIL_OPEN === 'true',
        // A potential (non-confirmed) match blocks by default; set false to allow + flag for review.
        blockOnPotential: process.env.SANCTIONS_BLOCK_ON_POTENTIAL !== 'false',
    },
    // Ledger GL double-entry on settlement. The 'internal' rail already posts the ledger
    // via the Java Kafka choreography; this is for the 'razorpayx' rail, which otherwise
    // moves money WITHOUT a GL record. OFF by default: posting needs a real chart-of-accounts
    // mapping (debit/credit account UUIDs) that finance must configure — guessed accounts
    // must never hit a production ledger.
    ledger: {
        postOnSettlement: process.env.LEDGER_POST_ON_SETTLEMENT === 'true',
        url: process.env.LEDGER_SERVICE_URL || 'http://127.0.0.1:3016',
        timeoutMs: Number(process.env.LEDGER_TIMEOUT_MS || 5000),
        entryType: process.env.LEDGER_SETTLEMENT_ENTRY_TYPE || 'SETTLEMENT',
        // Explicit chart-of-accounts UUIDs; fall back to the order's buyer/seller org ids.
        debitAccountId: process.env.LEDGER_SETTLEMENT_DEBIT_ACCOUNT_ID || null,
        creditAccountId: process.env.LEDGER_SETTLEMENT_CREDIT_ACCOUNT_ID || null,
    },
    // KYC/IDV gate at order placement (fail-closed). OFF by default. When enabled, both named
    // counterparties must hold an APPROVED verification in the TENANT-BOUND registry
    // (services/kycRegistry) before any money-truth row is written — mirrors the sanctions gate.
    // The registry binds (tenant_id, subject_ref) -> Onfido verification id + status server-side,
    // so the gate is resolved by the order's tenant, never by a caller-supplied provider id.
    kyc: {
        enabled: process.env.KYC_GATE === 'true',
        provider: process.env.KYC_PROVIDER || 'onfido',
        // Fail-CLOSED: a missing/non-APPROVED KYC binding (or an unavailable registry) blocks.
        failOpen: process.env.KYC_FAIL_OPEN === 'true',
        // HMAC key for inbound Onfido webhook signatures (X-SHA2-Signature).
        webhookToken: process.env.ONFIDO_WEBHOOK_TOKEN || '',
        // When set, GET status auto-refreshes a non-terminal binding from the provider.
        autoRefresh: process.env.KYC_AUTO_REFRESH === 'true',
    },
    // DEV/trader-wedge only: simulate payment completion so orders advance placed→payment_confirmed
    // without the full Java payment rails. OFF by default; real payment-service emits the event in prod.
    startPaymentSimulator: process.env.PAYMENT_SIMULATOR === 'true',
};
