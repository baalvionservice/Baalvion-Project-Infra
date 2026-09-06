-- admin-service :: cross-estate payment read model
--
-- The one table that lets a single admin panel show every payment taken anywhere in the
-- estate, attributed to a site and a tenant. It is a READ MODEL, not a source of truth:
-- every row is derived from a `payment.recorded` event emitted by the site that took the
-- money. Nothing writes here directly, and nothing reads another service's payment tables —
-- the bus is the only integration point, which is what keeps "one service = one DB" intact.
--
-- Self-provisioning DDL, matching this service's existing convention (see 002_analytics.sql):
-- the runtime equivalent is executed idempotently by ensureSchema() in
-- service/paymentRecordsService.js. No migration runner exists in this service.

CREATE SCHEMA IF NOT EXISTS admin;

CREATE TABLE IF NOT EXISTS admin.payment_records (
    payment_id          VARCHAR(190) NOT NULL,
    site_id             VARCHAR(64)  NOT NULL,
    tenant_id           VARCHAR(190),
    party_id            VARCHAR(190),
    state               VARCHAR(16)  NOT NULL,
    -- Position on the payment ladder, used to reject an out-of-order replay. Scaled by 10 so
    -- FAILED can sit between AUTHORIZED and CAPTURED: a failure is a PRE-capture terminal, so
    -- it must be able to supersede an authorization but never a capture or a settlement.
    --   INITIATED 0 · AUTHORIZED 10 · FAILED 15 · CAPTURED 20 · SETTLED 30
    state_rank          SMALLINT     NOT NULL,
    provider            VARCHAR(40)  NOT NULL,
    rail                VARCHAR(24)  NOT NULL,
    provider_payment_id VARCHAR(190),
    -- Money is stored the way it travels: an integer count of minor units plus the currency's
    -- own exponent. Never a float, and never assumed to be 2 decimals.
    amount_minor        BIGINT       NOT NULL,
    currency            CHAR(3)      NOT NULL,
    exponent            SMALLINT     NOT NULL,
    -- What the processor kept, and what actually landed. NULL means the provider has not
    -- reported the fee yet — deliberately not 0, because a fee recorded as zero overstates
    -- margin on every payment and the error is invisible.
    fee_minor           BIGINT,
    net_minor           BIGINT,
    order_ref           VARCHAR(190),
    failure_reason      TEXT,
    idempotency_key     VARCHAR(400) NOT NULL,
    occurred_at         TIMESTAMPTZ  NOT NULL,
    recorded_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- A payment is unique within its site. Keying on both means two sites can never collide
    -- on a provider id that happens to repeat.
    PRIMARY KEY (payment_id, site_id)
);

-- Column evolution for an existing table (CREATE TABLE IF NOT EXISTS is a no-op then).
ALTER TABLE admin.payment_records ADD COLUMN IF NOT EXISTS fee_minor BIGINT;
ALTER TABLE admin.payment_records ADD COLUMN IF NOT EXISTS net_minor BIGINT;

-- The panel's real queries: the estate-wide feed, one site's feed, and filtering by state.
CREATE INDEX IF NOT EXISTS idx_payment_records_occurred
    ON admin.payment_records (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_site_occurred
    ON admin.payment_records (site_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_site_state_occurred
    ON admin.payment_records (site_id, state, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_tenant_occurred
    ON admin.payment_records (tenant_id, occurred_at DESC)
    WHERE tenant_id IS NOT NULL;
-- Supports "what has this customer paid us across every property" once the party graph lands.
CREATE INDEX IF NOT EXISTS idx_payment_records_party
    ON admin.payment_records (party_id, occurred_at DESC)
    WHERE party_id IS NOT NULL;
-- Retention. `payment_records` is a read model, not the source of truth — every row can be
-- rebuilt from the events that produced it. Keeping every payment forever in the table the
-- panel queries makes the panel slower every month for data nobody is looking at.
--
-- Nothing is deleted automatically. This provides the index the sweep needs and a view of what
-- is old; the sweep itself is an explicit, operator-run job, because silently deleting financial
-- records is not something a service should decide on its own.
CREATE INDEX IF NOT EXISTS idx_payment_records_recorded
    ON admin.payment_records (recorded_at);

-- Consumer offsets, so a restart resumes rather than replaying the whole stream.
CREATE TABLE IF NOT EXISTS admin.payment_stream_offsets (
    consumer    VARCHAR(120) PRIMARY KEY,
    last_id     VARCHAR(64)  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
