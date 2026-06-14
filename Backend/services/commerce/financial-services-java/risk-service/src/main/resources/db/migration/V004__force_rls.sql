-- Enforce Row-Level Security against the TABLE OWNER as well.
--
-- `ENABLE ROW LEVEL SECURITY` does NOT apply to the role that OWNS the table
-- (and RLS is always ignored for SUPERUSERS). Without FORCE, a service that
-- connects as the table owner bypasses every tenant_isolation policy — a silent
-- cross-tenant data leak. FORCE makes the policy apply to the owner too.
--
-- PRECONDITION for this to actually isolate: the application MUST connect as a
-- NON-SUPERUSER role (e.g. baalvion_app) and set `app.current_tenant_id` per
-- transaction (see docs/TENANT_ISOLATION.md). FORCE is the SQL half;
-- the role + GUC are the runtime half. This migration is safe to apply now and
-- becomes effective the moment the connection role is switched.

ALTER TABLE risk.risk_assessments FORCE ROW LEVEL SECURITY;
ALTER TABLE risk.sanctions_screenings FORCE ROW LEVEL SECURITY;
