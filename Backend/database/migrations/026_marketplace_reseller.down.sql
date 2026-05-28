-- 026_marketplace_reseller.down.sql — rollback

BEGIN;

DROP TABLE IF EXISTS public.white_label_domains;
DROP TABLE IF EXISTS public.quotes;
DROP TABLE IF EXISTS public.regional_pricing;
DROP TABLE IF EXISTS public.promotions;
DROP TABLE IF EXISTS public.marketplace_products;
DROP TABLE IF EXISTS public.payouts;
DROP TABLE IF EXISTS public.commissions;
DROP TABLE IF EXISTS public.referrals;
DROP TABLE IF EXISTS public.affiliates;
DROP TABLE IF EXISTS public.partner_contracts;
DROP TABLE IF EXISTS public.reseller_pricing;
DROP TABLE IF EXISTS public.reseller_customers;
DROP TABLE IF EXISTS public.reseller_orgs;

COMMIT;
