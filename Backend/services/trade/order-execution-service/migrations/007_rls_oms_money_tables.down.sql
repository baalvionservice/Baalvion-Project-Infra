-- Revert 007: restore the LEGACY (un-hardened) tenant_isolation policy on the three
-- money tables — the exact form their original migrations created
-- (oms.orders=001_init.sql, oms.kyc_verifications=004, oms.order_payments=005).
--
-- IMPORTANT: 007 only HARDENED an already-enabled policy; it did NOT introduce RLS.
-- So this down must NOT disable RLS (that would leave the money tables LESS protected
-- than before 007). It re-applies the pre-007 legacy policy instead, returning the
-- tables to their exact prior on-disk state. RLS stays ENABLE + FORCE throughout.
-- schema=oms tables=orders,kyc_verifications,order_payments

DROP POLICY IF EXISTS "tenant_isolation" ON "oms"."orders";
CREATE POLICY "tenant_isolation" ON "oms"."orders"
    USING ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

DROP POLICY IF EXISTS "tenant_isolation" ON "oms"."kyc_verifications";
CREATE POLICY "tenant_isolation" ON "oms"."kyc_verifications"
    USING ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));

DROP POLICY IF EXISTS "tenant_isolation" ON "oms"."order_payments";
CREATE POLICY "tenant_isolation" ON "oms"."order_payments"
    USING ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND "tenant_id"::text = current_setting('app.current_tenant', true)));
