-- Public discovery carve-out.
--
-- 002 put single-tenant RLS on `opportunities` and `companies`. But a marketplace is
-- cross-tenant by definition: an investor browses OTHER orgs' rounds, and the public /invest
-- page reads them over a connection with no tenant set at all. Under tenant_isolation alone
-- both return zero rows — discovery breaks, and with it the ability to open a deal.
--
-- So: a SELECT-only policy for material that is already published. Policies are OR'd, so this
-- widens reads only; INSERT/UPDATE/DELETE still go through tenant_isolation, and nothing
-- confidential is exposed — a live, public round is publication by definition.
-- Modelled on the trade-service vessels 'GLOBAL' carve-out.

BEGIN;
SET search_path TO marketplace, public;

DROP POLICY IF EXISTS public_live_rounds ON marketplace.opportunities;
CREATE POLICY public_live_rounds ON marketplace.opportunities
    FOR SELECT
    USING (status = 'live' AND visibility = 'public');

-- The discovery card shows the issuer's name, so the company behind a live public round is
-- readable too — and only for as long as that round is live.
DROP POLICY IF EXISTS public_listed_companies ON marketplace.companies;
CREATE POLICY public_listed_companies ON marketplace.companies
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM marketplace.opportunities o
         WHERE o.company_id = companies.id
           AND o.status = 'live'
           AND o.visibility = 'public'
    ));

COMMIT;
