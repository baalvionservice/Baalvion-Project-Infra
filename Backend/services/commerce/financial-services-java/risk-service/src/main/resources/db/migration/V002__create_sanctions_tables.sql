-- Sanctions screening (gap G3): consolidated watchlist + per-tenant screening results.
--
-- `sanctioned_entities` is GLOBAL reference data (OFAC SDN / UN / EU / UK / AU lists are the same
-- for every tenant) — it is NOT tenant-scoped and carries no RLS. `sanctions_screenings` records who
-- a given tenant screened and the outcome — it IS tenant-scoped (RLS), like risk_assessments.

CREATE TABLE risk.sanctioned_entities (
  id                  uuid PRIMARY KEY,
  list_source         varchar(32)  NOT NULL,          -- OFAC_SDN, UN_CONSOLIDATED, EU_CFSP, UK_HMT, AU_DFAT
  external_id         varchar(128) NOT NULL,          -- the source list's own UID/ref
  entity_type         varchar(32)  NOT NULL,          -- INDIVIDUAL, ORGANIZATION, VESSEL, AIRCRAFT, OTHER
  primary_name        varchar(512) NOT NULL,
  normalized_name     varchar(512) NOT NULL,          -- normalized primary name (matching key)
  aliases             jsonb        NOT NULL DEFAULT '[]',   -- [{name, normalized}]
  programs            jsonb        NOT NULL DEFAULT '[]',   -- e.g. ["UKRAINE-EO13662"]
  countries           jsonb        NOT NULL DEFAULT '[]',
  date_of_birth       varchar(64),                    -- free text: lists carry partial / range DOBs
  remarks             text,
  active              boolean      NOT NULL DEFAULT true,
  source_published_at timestamp,
  created_at          timestamp    NOT NULL,
  updated_at          timestamp    NOT NULL,
  CONSTRAINT uk_sanctioned_entity_src UNIQUE (list_source, external_id)
);

CREATE INDEX idx_sanctioned_norm_name ON risk.sanctioned_entities(normalized_name);
CREATE INDEX idx_sanctioned_active_type ON risk.sanctioned_entities(active, entity_type);
-- For very large lists (real OFAC ≈ 17k rows) add a pg_trgm GIN index on normalized_name and
-- candidate-prefilter with similarity(); the seed-backed list is small enough to score in full.

CREATE TABLE risk.sanctions_screenings (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL,
  subject_name       varchar(512) NOT NULL,
  normalized_subject varchar(512) NOT NULL,
  subject_type       varchar(32)  NOT NULL,          -- INDIVIDUAL, ORGANIZATION, VESSEL, AIRCRAFT, OTHER
  subject_country    varchar(64),
  reference_type     varchar(64),                    -- caller correlation (e.g. ACCOUNT, DEAL, COUNTERPARTY)
  reference_id       varchar(128),
  status             varchar(24)  NOT NULL,          -- CLEAR, POTENTIAL_MATCH, CONFIRMED_MATCH, FALSE_POSITIVE, BLOCKED
  top_score          numeric(5, 4) NOT NULL DEFAULT 0,
  hits               jsonb        NOT NULL DEFAULT '[]',
  hit_count          integer      NOT NULL DEFAULT 0,
  adjudicated_by     varchar(128),                   -- JWT subject (user ref) of the adjudicating officer
  adjudication_note  text,
  adjudicated_at     timestamp,
  created_at         timestamp    NOT NULL,
  updated_at         timestamp    NOT NULL
);

CREATE INDEX idx_screening_tenant_status ON risk.sanctions_screenings(tenant_id, status, created_at DESC);
CREATE INDEX idx_screening_tenant_ref ON risk.sanctions_screenings(tenant_id, reference_type, reference_id);

-- Row-Level Security on the tenant-scoped screenings table (mirrors risk_assessments).
--
-- IMPORTANT — current enforcement reality: RLS here is DEFENSE-IN-DEPTH, not the active control.
-- It only takes effect once the service runs under a NOSUPERUSER, non-owner role with
-- FORCE ROW LEVEL SECURITY and a per-transaction `SET LOCAL app.current_tenant_id = <tenant>` GUC —
-- that is the platform-wide tenancy rollout (gap A9, @baalvion/tenancy withTenantTransaction). The
-- table owner / superuser used in dev and tests bypasses ENABLE-only RLS, so today the ACTIVE tenant
-- isolation is the mandatory `WHERE tenant_id = ?` predicate on every repository query. The policy
-- uses the two-arg current_setting(..., true) form so it FAILS CLOSED (NULL GUC -> no rows) instead
-- of erroring once A9 turns it on. Do NOT add FORCE here without the A9 role+GUC wiring or it will
-- (correctly) block the owner-connected integration tests.
ALTER TABLE risk.sanctions_screenings ENABLE ROW LEVEL SECURITY;

CREATE POLICY sanctions_screenings_tenant_isolation ON risk.sanctions_screenings
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
