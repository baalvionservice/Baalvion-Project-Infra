-- Per-business access grants — the missing half of "one admin panel".
--
-- Site access already had a home (cms.cms_website_members): grant a writer Imperialpedia and
-- Law Elite in one action, and both are revoked in one action. Everything OUTSIDE the CMS had
-- no equivalent. Trade, jobs and IR each carried their own role list, so hiring one recruiter
-- meant granting access twice in two systems, with two audit trails and two places to forget
-- when they leave.
--
-- This is the shared store. A grant is issued centrally and travels in the ACCESS TOKEN, so
-- every app honours it through the RS256 verification it already performs — no app needs its
-- own membership table, and revoking here revokes everywhere on the next token.
--
--   business  -- which product the grant is for ('trade', 'jobs', 'ir', …). Free text rather
--               than an enum so adding a business is a row, not a migration + deploy.
--   role      -- the role WITHIN that business. Each app keeps its own vocabulary
--               ('recruiter', 'ops', …); this stores it without trying to unify them, because
--               forcing one vocabulary across three domains is how you get roles that fit none.
--   expires_at-- NULL = standing. Otherwise the grant lapses on its own, matching how CMS site
--               grants behave, so contractor access does not depend on anyone remembering.
--
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS auth.business_grants (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business    VARCHAR(40) NOT NULL,
    role        VARCHAR(60) NOT NULL,
    granted_by  BIGINT      REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One live grant per person per business. Revoked rows are kept for the audit trail, so the
-- constraint only covers the live ones.
CREATE UNIQUE INDEX IF NOT EXISTS business_grants_user_business_live
    ON auth.business_grants (user_id, business)
    WHERE revoked_at IS NULL;

-- The hot path: "what businesses can this user reach?" on every token mint.
CREATE INDEX IF NOT EXISTS business_grants_user_live
    ON auth.business_grants (user_id)
    WHERE revoked_at IS NULL;

-- "Who can reach trade?" for the console's per-business view.
CREATE INDEX IF NOT EXISTS business_grants_business_live
    ON auth.business_grants (business)
    WHERE revoked_at IS NULL;

-- Expiry sweeps, without an index entry for the many standing grants.
CREATE INDEX IF NOT EXISTS business_grants_expiring
    ON auth.business_grants (expires_at)
    WHERE expires_at IS NOT NULL AND revoked_at IS NULL;
