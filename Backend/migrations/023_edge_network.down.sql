-- 023_edge_network.down.sql — rollback

BEGIN;

DROP TABLE IF EXISTS public.regional_health;
DROP TABLE IF EXISTS public.asn_intelligence;
DROP TABLE IF EXISTS public.ip_allocations;
DROP TABLE IF EXISTS public.dedicated_ips;
DROP TABLE IF EXISTS public.ip_pools;
DROP TABLE IF EXISTS public.edge_regions;

COMMIT;
