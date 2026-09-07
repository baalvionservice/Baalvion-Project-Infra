-- Fail-closed Row-Level Security for the deal room and the remaining tenant-owned tables.
--
-- 002 applied the canonical single-column tenant_isolation policy to the 7 tables that carry
-- org_id. The other 21 — every confidential deal-room table among them — had no RLS at all, so
-- the application layer was the only thing separating tenants.
--
-- Those tables cannot use the canonical policy: `deals` is bilateral (org_id_company AND
-- org_id_investor, plus invited members), and its children are keyed only by deal_id. So the
-- predicate here is MEMBERSHIP, not a column match:
--
--   deals            → I am the company side, the investor side, or an invited deal member.
--   deal children    → the parent deal is visible to me (their policies chain through deals'
--                      own RLS, so the rule lives in exactly one place).
--   company/investor children → the parent row is visible to me (chains through 002).
--   cap table        → the issuing company's rows, plus my own holdings.
--
-- Bypass matches 002 (CR-8 hardened): denied to the runtime baalvion_app role, so flipping
-- app.tenant_bypass via injection cannot defeat isolation. Apply as the migration/owner role.

BEGIN;
SET search_path TO marketplace, public;

CREATE OR REPLACE FUNCTION marketplace.current_tenant() RETURNS text
    LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.current_tenant', true), '') $$;

CREATE OR REPLACE FUNCTION marketplace.tenant_bypass() RETURNS boolean
    LANGUAGE sql STABLE AS $$
        SELECT current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app'
    $$;

-- ── deals — the bilateral root ────────────────────────────────────────────────
ALTER TABLE marketplace.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.deals FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deal_party_isolation ON marketplace.deals;
CREATE POLICY deal_party_isolation ON marketplace.deals
    USING (
        marketplace.tenant_bypass()
        OR (marketplace.current_tenant() IS NOT NULL AND (
               org_id_company::text  = marketplace.current_tenant()
            OR org_id_investor::text = marketplace.current_tenant()
            OR EXISTS (SELECT 1 FROM marketplace.deal_members m
                        WHERE m.deal_id = deals.id
                          AND m.org_id::text = marketplace.current_tenant())
        ))
    )
    -- A deal may only be written by one of its two principals: no fabricating a room
    -- between two orgs you are not part of.
    WITH CHECK (
        marketplace.tenant_bypass()
        OR (marketplace.current_tenant() IS NOT NULL AND (
               org_id_company::text  = marketplace.current_tenant()
            OR org_id_investor::text = marketplace.current_tenant()
        ))
    );

-- ── deal children — visibility follows the parent deal ────────────────────────
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'deal_messages', 'nda_agreements', 'document_requests', 'data_room_documents',
        'document_access_grants', 'due_diligence_items', 'term_sheets', 'signatures',
        'escrow_transactions'
    ] LOOP
        EXECUTE format('ALTER TABLE marketplace.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE marketplace.%I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS deal_party_isolation ON marketplace.%I', t);
        EXECUTE format($f$
            CREATE POLICY deal_party_isolation ON marketplace.%1$I
                USING (marketplace.tenant_bypass()
                       OR EXISTS (SELECT 1 FROM marketplace.deals d WHERE d.id = %1$I.deal_id))
                WITH CHECK (marketplace.tenant_bypass()
                       OR EXISTS (SELECT 1 FROM marketplace.deals d WHERE d.id = %1$I.deal_id))
        $f$, t);
    END LOOP;
END $$;

-- term_sheet_versions hangs off term_sheets, which hangs off deals.
ALTER TABLE marketplace.term_sheet_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.term_sheet_versions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deal_party_isolation ON marketplace.term_sheet_versions;
CREATE POLICY deal_party_isolation ON marketplace.term_sheet_versions
    USING (marketplace.tenant_bypass()
           OR EXISTS (SELECT 1 FROM marketplace.term_sheets ts WHERE ts.id = term_sheet_versions.term_sheet_id))
    WITH CHECK (marketplace.tenant_bypass()
           OR EXISTS (SELECT 1 FROM marketplace.term_sheets ts WHERE ts.id = term_sheet_versions.term_sheet_id));

-- ── company-owned children — visibility follows companies (RLS'd in 002) ──────
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['company_profiles', 'founders', 'company_documents'] LOOP
        EXECUTE format('ALTER TABLE marketplace.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE marketplace.%I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON marketplace.%I', t);
        EXECUTE format($f$
            CREATE POLICY tenant_isolation ON marketplace.%1$I
                USING (marketplace.tenant_bypass()
                       OR EXISTS (SELECT 1 FROM marketplace.companies c WHERE c.id = %1$I.company_id))
                WITH CHECK (marketplace.tenant_bypass()
                       OR EXISTS (SELECT 1 FROM marketplace.companies c WHERE c.id = %1$I.company_id))
        $f$, t);
    END LOOP;
END $$;

-- ── investor-owned children — visibility follows investors (RLS'd in 002) ─────
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['investor_profiles', 'investment_preferences', 'matches', 'watchlist', 'saved_companies'] LOOP
        EXECUTE format('ALTER TABLE marketplace.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE marketplace.%I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON marketplace.%I', t);
        EXECUTE format($f$
            CREATE POLICY tenant_isolation ON marketplace.%1$I
                USING (marketplace.tenant_bypass()
                       OR EXISTS (SELECT 1 FROM marketplace.investors i WHERE i.id = %1$I.investor_id))
                WITH CHECK (marketplace.tenant_bypass()
                       OR EXISTS (SELECT 1 FROM marketplace.investors i WHERE i.id = %1$I.investor_id))
        $f$, t);
    END LOOP;
END $$;

-- ── cap table — the issuing company's rows, plus the holder's own position ─────
ALTER TABLE marketplace.cap_table_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.cap_table_entries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON marketplace.cap_table_entries;
CREATE POLICY tenant_isolation ON marketplace.cap_table_entries
    USING (marketplace.tenant_bypass()
           OR EXISTS (SELECT 1 FROM marketplace.companies c WHERE c.id = cap_table_entries.company_id)
           OR holder_id = marketplace.current_tenant())
    WITH CHECK (marketplace.tenant_bypass()
           OR EXISTS (SELECT 1 FROM marketplace.companies c WHERE c.id = cap_table_entries.company_id));

ALTER TABLE marketplace.cap_table_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.cap_table_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON marketplace.cap_table_events;
CREATE POLICY tenant_isolation ON marketplace.cap_table_events
    USING (marketplace.tenant_bypass()
           OR EXISTS (SELECT 1 FROM marketplace.companies c WHERE c.id = cap_table_events.company_id)
           OR EXISTS (SELECT 1 FROM marketplace.deals d WHERE d.id = cap_table_events.deal_id))
    WITH CHECK (marketplace.tenant_bypass()
           OR EXISTS (SELECT 1 FROM marketplace.companies c WHERE c.id = cap_table_events.company_id));

-- ── profile_views — an org reads only the views it performed ──────────────────
ALTER TABLE marketplace.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.profile_views FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON marketplace.profile_views;
CREATE POLICY tenant_isolation ON marketplace.profile_views
    USING (marketplace.tenant_bypass()
           OR viewer_org_id::text = marketplace.current_tenant())
    WITH CHECK (marketplace.tenant_bypass()
           OR viewer_org_id::text = marketplace.current_tenant());

COMMIT;
