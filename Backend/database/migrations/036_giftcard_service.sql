-- Gift card store: catalog synced from real supplier APIs (Reloadly first — see
-- Backend/services/ecosystem/giftcard-service/service/suppliers/) + purchase/fulfillment
-- orders. gift_card_brands starts genuinely empty — populated only by a real catalog sync
-- against real supplier credentials (POST /v1/giftcards/admin/catalog/sync), never seeded
-- with placeholder/guessed product data.
CREATE SCHEMA IF NOT EXISTS giftcard;

CREATE TABLE IF NOT EXISTS giftcard.gift_card_brands (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier             VARCHAR(40) NOT NULL,
    supplier_product_id  VARCHAR(80) NOT NULL,
    name                 VARCHAR(160) NOT NULL,
    slug                 VARCHAR(160) NOT NULL UNIQUE,
    country_code         VARCHAR(2) NOT NULL,
    currency_code        VARCHAR(3) NOT NULL,
    denomination_type    VARCHAR(10) NOT NULL CHECK (denomination_type IN ('FIXED', 'RANGE')),
    fixed_denominations  JSONB NOT NULL DEFAULT '[]',
    min_denomination     NUMERIC(12,2),
    max_denomination     NUMERIC(12,2),
    logo_url             TEXT,
    description          TEXT,
    redeem_instruction   TEXT,
    is_active            BOOLEAN NOT NULL DEFAULT true,
    last_synced_at       TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (supplier, supplier_product_id)
);
CREATE INDEX IF NOT EXISTS idx_giftcard_brands_country ON giftcard.gift_card_brands (country_code);
CREATE INDEX IF NOT EXISTS idx_giftcard_brands_active ON giftcard.gift_card_brands (is_active);

CREATE TABLE IF NOT EXISTS giftcard.gift_card_orders (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL,
    brand_id                 UUID NOT NULL REFERENCES giftcard.gift_card_brands(id),
    supplier                 VARCHAR(40) NOT NULL,
    denomination_value       NUMERIC(12,2) NOT NULL,
    currency_code            VARCHAR(3) NOT NULL,
    price_usd_cents          INTEGER NOT NULL,
    status                   VARCHAR(20) NOT NULL DEFAULT 'pending_payment'
                                CHECK (status IN ('pending_payment','paid','fulfilling','fulfilled','failed','refunded')),
    payment_ref              VARCHAR(160),
    supplier_transaction_id  VARCHAR(160),
    redeem_code_encrypted    TEXT,
    redeem_pin_encrypted     TEXT,
    fulfillment_error        TEXT,
    fulfilled_at             TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_giftcard_orders_user ON giftcard.gift_card_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_giftcard_orders_status ON giftcard.gift_card_orders (status);

CREATE TABLE IF NOT EXISTS giftcard.gift_card_billing_webhook_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider     VARCHAR(40) NOT NULL,
    event_id     VARCHAR(160) NOT NULL,
    status       VARCHAR(10) NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed','applied')),
    payload      JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, event_id)
);
