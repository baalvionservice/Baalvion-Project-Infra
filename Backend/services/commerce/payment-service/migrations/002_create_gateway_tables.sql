-- Gateway-checkout vertical: payments + idempotent ledger (Razorpay/Stripe/PayU).
-- Idempotent (IF NOT EXISTS) so it co-exists with dev sequelize.sync().

CREATE SCHEMA IF NOT EXISTS payments;

CREATE TABLE IF NOT EXISTS payments.gateway_payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_slug        VARCHAR(190) NOT NULL,
    provider            VARCHAR(40)  NOT NULL,
    provider_order_id   VARCHAR(190),
    provider_payment_id VARCHAR(190),
    idempotency_key     VARCHAR(120) NOT NULL,
    amount              NUMERIC(19,4) NOT NULL,
    currency            CHAR(3) NOT NULL DEFAULT 'INR',
    status              VARCHAR(20) NOT NULL DEFAULT 'created'
                            CHECK (status IN ('created','authorized','captured','failed','refunded')),
    receipt             VARCHAR(190),
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    trace_id            VARCHAR(120),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Make payment creation idempotent per tenant.
CREATE UNIQUE INDEX IF NOT EXISTS uq_gwpay_tenant_idem
    ON payments.gateway_payments (website_slug, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_gwpay_provider_order
    ON payments.gateway_payments (provider, provider_order_id);
CREATE INDEX IF NOT EXISTS idx_gwpay_provider_payment
    ON payments.gateway_payments (provider, provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_gwpay_tenant_status
    ON payments.gateway_payments (website_slug, status);

CREATE TABLE IF NOT EXISTS payments.payment_ledger_entries (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_slug       VARCHAR(190) NOT NULL,
    gateway_payment_id UUID,
    provider           VARCHAR(40) NOT NULL,
    provider_event_id  VARCHAR(190) NOT NULL,
    event_type         VARCHAR(60) NOT NULL,
    direction          VARCHAR(10) NOT NULL DEFAULT 'credit' CHECK (direction IN ('credit','debit')),
    amount             NUMERIC(19,4) NOT NULL,
    currency           CHAR(3) NOT NULL DEFAULT 'INR',
    status             VARCHAR(30) NOT NULL,
    trace_id           VARCHAR(120),
    payload            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- THE dedup guarantee: one ledger row per provider event, PER TENANT (website_slug
-- in the key prevents cross-tenant provider-event-id collisions silently dropping
-- a real payment).
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_tenant_provider_event
    ON payments.payment_ledger_entries (website_slug, provider, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_ledger_payment
    ON payments.payment_ledger_entries (gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant_date
    ON payments.payment_ledger_entries (website_slug, created_at);
