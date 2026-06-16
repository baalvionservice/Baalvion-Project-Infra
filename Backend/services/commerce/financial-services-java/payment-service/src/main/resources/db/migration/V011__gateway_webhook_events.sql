-- Persistent webhook-event dedup ledger for the gateway-checkout vertical
-- (Razorpay / Stripe / PayU). Every VERIFIED provider webhook is recorded here keyed by
-- (website_slug, provider, provider_event_id). The UNIQUE constraint is the durable,
-- restart-surviving guarantee that a charge's status transition is applied AT MOST ONCE,
-- regardless of provider redeliveries or replays beyond the adapter's signature-timestamp
-- window (Razorpay 600s / Stripe 300s). Before this table existed, dedup was only the
-- in-window signature check; a redelivery after the window re-applied the transition.
--
-- Tenant scope is the website_slug COLUMN and is enforced at the query layer, exactly like
-- payments.gateway_payments: webhooks carry no JWT / tenant GUC (authenticity comes from the
-- provider signature), so this table is intentionally NOT under session-GUC RLS — adding it
-- would make every webhook INSERT fail once the app connects as baalvion_app. baalvion_app
-- gets DML, mirroring V008/V009/V010.

CREATE TABLE payments.gateway_webhook_events (
  id                uuid PRIMARY KEY,
  website_slug      varchar(190) NOT NULL DEFAULT '__global__',
  provider          varchar(40)  NOT NULL,
  provider_event_id varchar(255) NOT NULL,      -- body-derived, never an attacker-settable header
  provider_ref      varchar(190),               -- charge id this event pertains to
  event_type        varchar(120),               -- native provider event type
  status            varchar(32),                -- normalized GatewayStatus this event applied
  amount            numeric(19, 4),             -- event amount in MINOR units (validated vs charge)
  currency          varchar(3),
  amount_validated  boolean NOT NULL DEFAULT false,
  applied           boolean NOT NULL DEFAULT false,
  received_at       timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uk_gateway_webhook_event UNIQUE (website_slug, provider, provider_event_id)
);

-- Operational lookup: replays/audit by (site, provider, charge ref).
CREATE INDEX idx_gwwebhook_site_provider_ref
  ON payments.gateway_webhook_events(website_slug, provider, provider_ref);

-- Grant the non-superuser runtime role baalvion_app DML on the new table. Postgres checks
-- table privileges BEFORE RLS, so without these grants every query fails on permission.
-- Idempotent and role-guarded so it is safe where baalvion_app is not yet provisioned
-- (027_app_role). Mirrors V008/V009/V010__grant_baalvion_app.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    RAISE NOTICE 'baalvion_app role absent — skipping grants for payments.gateway_webhook_events; provision the role (027_app_role) and re-run.';
    RETURN;
  END IF;
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON payments.gateway_webhook_events TO baalvion_app';
END$$;
