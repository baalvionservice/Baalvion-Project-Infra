-- 089 — The order journey, and the organisations that are party to it.
--
-- One journey per order. Every organisation that touches the order (buyer, seller, freight
-- forwarder, customs broker, bank, insurer, trade agent) is a row in order_parties with an explicit
-- role and an explicit list of permissions. Nothing is visible to an organisation that is not a party.
--
-- THE HARD RULES, enforced here in the database and not only in the application:
--   1. order_journeys has NO price, margin or payment column, by design. It is what a forwarder or
--      broker is allowed to see (reference, corridor, goods, parties). Commercial terms stay with
--      the order itself, visible to buyer and seller only.
--   2. A freight forwarder or customs broker can never hold 'commercial.view' or 'payment.view'
--      (a CHECK constraint, so a bug or a hand-edited row cannot grant it).
--   3. A party sees only journeys it is an active party to, and an invited organisation can only
--      accept or decline its invitation — it cannot change its own role or permissions.
--   4. Every change is written to an append-only audit table that no role can update or delete.
--
-- ENFORCEMENT TODAY. Row-level security only protects against roles that are not superusers, and the
-- platform currently connects as one (see docs/gti/TRADE-JOURNEY-PLAN.md, blocker 1). The policies
-- below are correct and tested, and take effect for any connection that runs as the restricted
-- role created by scripts/create-journey-db-role.sql. Until then the application layer enforces the
-- same rules and reports "application-only" on /v1/order_journeys/_status.
--
-- No foreign key to oms.orders: the order lives in another service's schema, and a cross-service
-- foreign key would couple their migrations. order_id is checked by the service.
--
-- migrate.js splits statements on ";" at end of line, so every function body below is on one line.

CREATE TABLE IF NOT EXISTS tradeops.order_journeys (
    id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            uuid         NOT NULL,
    reference_no        text         NOT NULL,
    owner_org_id        text         NOT NULL,
    origin_country      text,
    destination_country text,
    incoterm            text,
    commodity           text,
    hs_code             text,
    status              text         NOT NULL DEFAULT 'active',
    metadata            jsonb        NOT NULL DEFAULT '{}'::jsonb,
    version             integer      NOT NULL DEFAULT 1,
    created_at          timestamptz  NOT NULL DEFAULT now(),
    updated_at          timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_order_journeys_order UNIQUE (order_id),
    CONSTRAINT chk_order_journeys_status CHECK (status IN ('active','completed','cancelled')),
    CONSTRAINT chk_order_journeys_origin CHECK (origin_country IS NULL OR origin_country ~ '^[A-Z]{2}$'),
    CONSTRAINT chk_order_journeys_destination CHECK (destination_country IS NULL OR destination_country ~ '^[A-Z]{2}$')
);

CREATE TABLE IF NOT EXISTS tradeops.order_parties (
    id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id        uuid         NOT NULL REFERENCES tradeops.order_journeys(id) ON DELETE CASCADE,
    org_id            text,
    external_name     text,
    external_contact  text,
    party_role        text         NOT NULL,
    status            text         NOT NULL DEFAULT 'invited',
    permissions       text[]       NOT NULL DEFAULT '{}',
    document_scopes   text[]       NOT NULL DEFAULT '{}',
    added_by_org_id   text         NOT NULL,
    added_by_user_id  text,
    invited_at        timestamptz  NOT NULL DEFAULT now(),
    responded_at      timestamptz,
    removed_at        timestamptz,
    created_at        timestamptz  NOT NULL DEFAULT now(),
    updated_at        timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chk_order_parties_role CHECK (party_role IN ('buyer','seller','freight_forwarder','customs_broker','bank','insurer','trade_agent')),
    CONSTRAINT chk_order_parties_status CHECK (status IN ('invited','active','declined','removed')),
    CONSTRAINT chk_order_parties_identity CHECK (org_id IS NOT NULL OR external_name IS NOT NULL),
    CONSTRAINT chk_order_parties_permissions CHECK (permissions <@ ARRAY['journey.view','journey.manage','parties.manage','logistics.view','logistics.manage','customs.view','customs.manage','customs_value.view','documents.view','documents.manage','tracking.view','commercial.view','payment.view']::text[]),
    CONSTRAINT chk_order_parties_no_commercial_for_service_providers CHECK (party_role NOT IN ('freight_forwarder','customs_broker') OR NOT (permissions && ARRAY['commercial.view','payment.view']::text[]))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_order_parties_org_role ON tradeops.order_parties (journey_id, org_id, party_role) WHERE org_id IS NOT NULL AND status <> 'removed';
CREATE INDEX IF NOT EXISTS idx_order_parties_org_active ON tradeops.order_parties (org_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_order_parties_journey ON tradeops.order_parties (journey_id);

CREATE TABLE IF NOT EXISTS tradeops.order_party_events (
    id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id      uuid         NOT NULL REFERENCES tradeops.order_journeys(id) ON DELETE CASCADE,
    actor_org_id    text,
    actor_user_id   text,
    action          text         NOT NULL,
    party_org_id    text,
    party_role      text,
    detail          jsonb        NOT NULL DEFAULT '{}'::jsonb,
    -- clock_timestamp(), not now(): events written in one transaction must keep their real order.
    occurred_at     timestamptz  NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_order_party_events_journey ON tradeops.order_party_events (journey_id, occurred_at DESC);

-- ── Who is asking, and what may they do ───────────────────────────────────────

CREATE OR REPLACE FUNCTION tradeops.current_party_org() RETURNS text LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.party_org', true), '') $$;

CREATE OR REPLACE FUNCTION tradeops.party_can(p_journey uuid, p_org text, p_permission text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = tradeops, pg_temp AS $$ SELECT p_org IS NOT NULL AND EXISTS (SELECT 1 FROM tradeops.order_parties p WHERE p.journey_id = p_journey AND p.org_id = p_org AND p.status = 'active' AND p_permission = ANY (p.permissions)) $$;

-- ── Audit trail: nobody updates or deletes it ─────────────────────────────────

CREATE OR REPLACE FUNCTION tradeops.forbid_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'order_party_events is append-only'; END $$;

DROP TRIGGER IF EXISTS trg_order_party_events_immutable ON tradeops.order_party_events;

CREATE TRIGGER trg_order_party_events_immutable BEFORE UPDATE OR DELETE ON tradeops.order_party_events FOR EACH ROW EXECUTE FUNCTION tradeops.forbid_change();

-- ── An organisation cannot rewrite its own role or grants ─────────────────────

CREATE OR REPLACE FUNCTION tradeops.guard_party_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.journey_id <> OLD.journey_id OR NEW.org_id IS DISTINCT FROM OLD.org_id OR NEW.party_role <> OLD.party_role OR NEW.added_by_org_id <> OLD.added_by_org_id THEN RAISE EXCEPTION 'a party''s organisation, role and journey cannot be changed'; END IF; IF tradeops.current_party_org() IS NOT NULL AND NOT tradeops.party_can(OLD.journey_id, tradeops.current_party_org(), 'parties.manage') THEN IF OLD.status <> 'invited' OR NEW.status NOT IN ('active','declined') OR NEW.permissions <> OLD.permissions OR NEW.document_scopes <> OLD.document_scopes THEN RAISE EXCEPTION 'an invited organisation may only accept or decline'; END IF; END IF; NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_order_parties_guard ON tradeops.order_parties;

CREATE TRIGGER trg_order_parties_guard BEFORE UPDATE ON tradeops.order_parties FOR EACH ROW EXECUTE FUNCTION tradeops.guard_party_update();

-- ── Opening a journey: the journey and its first party, atomically ────────────

CREATE OR REPLACE FUNCTION tradeops.create_journey(p_order uuid, p_reference text, p_org text, p_role text, p_user text, p_origin text, p_destination text, p_incoterm text, p_commodity text, p_hs text, p_permissions text[]) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = tradeops, pg_temp AS $$ DECLARE j uuid; BEGIN IF p_org IS NULL OR p_org IS DISTINCT FROM tradeops.current_party_org() THEN RAISE EXCEPTION 'a journey is opened by the calling organisation'; END IF; IF p_role NOT IN ('buyer','seller') THEN RAISE EXCEPTION 'a journey is opened by its buyer or its seller'; END IF; INSERT INTO tradeops.order_journeys (order_id, reference_no, owner_org_id, origin_country, destination_country, incoterm, commodity, hs_code) VALUES (p_order, p_reference, p_org, p_origin, p_destination, p_incoterm, p_commodity, p_hs) RETURNING id INTO j; INSERT INTO tradeops.order_parties (journey_id, org_id, party_role, status, permissions, added_by_org_id, added_by_user_id, responded_at) VALUES (j, p_org, p_role, 'active', p_permissions, p_org, p_user, now()); INSERT INTO tradeops.order_party_events (journey_id, actor_org_id, actor_user_id, action, party_org_id, party_role, detail) VALUES (j, p_org, p_user, 'journey.opened', p_org, p_role, jsonb_build_object('order_id', p_order)); RETURN j; END $$;

-- ── What a party may see of the other parties: who and in what role, nothing else ──

CREATE OR REPLACE VIEW tradeops.order_party_directory AS SELECT p.journey_id, p.party_role, p.org_id, p.external_name, p.status FROM tradeops.order_parties p WHERE p.status IN ('active','invited') AND tradeops.party_can(p.journey_id, tradeops.current_party_org(), 'journey.view');

-- ── Row-level security ────────────────────────────────────────────────────────

ALTER TABLE tradeops.order_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.order_journeys FORCE ROW LEVEL SECURITY;
ALTER TABLE tradeops.order_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.order_parties FORCE ROW LEVEL SECURITY;
ALTER TABLE tradeops.order_party_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.order_party_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journey_party_read ON tradeops.order_journeys;
CREATE POLICY journey_party_read ON tradeops.order_journeys FOR SELECT USING (tradeops.party_can(id, tradeops.current_party_org(), 'journey.view'));
DROP POLICY IF EXISTS journey_party_update ON tradeops.order_journeys;
CREATE POLICY journey_party_update ON tradeops.order_journeys FOR UPDATE USING (tradeops.party_can(id, tradeops.current_party_org(), 'journey.manage')) WITH CHECK (tradeops.party_can(id, tradeops.current_party_org(), 'journey.manage'));

DROP POLICY IF EXISTS parties_read ON tradeops.order_parties;
CREATE POLICY parties_read ON tradeops.order_parties FOR SELECT USING (org_id = tradeops.current_party_org() OR tradeops.party_can(journey_id, tradeops.current_party_org(), 'parties.manage'));
DROP POLICY IF EXISTS parties_insert ON tradeops.order_parties;
CREATE POLICY parties_insert ON tradeops.order_parties FOR INSERT WITH CHECK (tradeops.party_can(journey_id, tradeops.current_party_org(), 'parties.manage') AND added_by_org_id = tradeops.current_party_org());
DROP POLICY IF EXISTS parties_update ON tradeops.order_parties;
CREATE POLICY parties_update ON tradeops.order_parties FOR UPDATE USING (org_id = tradeops.current_party_org() OR tradeops.party_can(journey_id, tradeops.current_party_org(), 'parties.manage')) WITH CHECK (org_id = tradeops.current_party_org() OR tradeops.party_can(journey_id, tradeops.current_party_org(), 'parties.manage'));

DROP POLICY IF EXISTS events_read ON tradeops.order_party_events;
CREATE POLICY events_read ON tradeops.order_party_events FOR SELECT USING (tradeops.party_can(journey_id, tradeops.current_party_org(), 'parties.manage'));
DROP POLICY IF EXISTS events_insert ON tradeops.order_party_events;
CREATE POLICY events_insert ON tradeops.order_party_events FOR INSERT WITH CHECK (actor_org_id = tradeops.current_party_org() AND (tradeops.party_can(journey_id, tradeops.current_party_org(), 'journey.view') OR tradeops.party_can(journey_id, tradeops.current_party_org(), 'parties.manage')));
