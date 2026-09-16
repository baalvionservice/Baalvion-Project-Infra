SET search_path TO ir, public;
INSERT INTO ir.ir_commitments (id, org_id, investor_user_id, investor_name, vehicle, commitment_amount, currency, status, committed_on, created_at, updated_at)
VALUES ('aa000000-0000-4000-8000-000000000001','2f81f8bf-9919-4856-82f7-ddf30663e710','usr_investor','Institutional Investor','baalvion',50000000,'INR','signed','2026-04-01',now(),now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO ir.ir_capital_calls (id, org_id, vehicle, reference, call_pct, currency, purpose, status, call_date, due_date, issued_at, issued_by, created_at, updated_at)
VALUES
 ('bb000000-0000-4000-8000-000000000001','2f81f8bf-9919-4856-82f7-ddf30663e710','baalvion','CC-2026-001',20,'INR','Initial deployment — warehouse automation','issued','2026-05-02','2026-05-17',now(),'ir-ops',now(),now()),
 ('bb000000-0000-4000-8000-000000000002','2f81f8bf-9919-4856-82f7-ddf30663e710','baalvion','CC-2026-002',10,'INR','Working capital','issued','2026-08-01','2026-08-16',now(),'ir-ops',now(),now()),
 ('bb000000-0000-4000-8000-000000000003','2f81f8bf-9919-4856-82f7-ddf30663e710','baalvion','CC-2026-003',15,'INR','Not yet issued','draft','2026-10-01','2026-10-16',NULL,NULL,now(),now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO ir.ir_call_allocations (id, call_id, commitment_id, amount_due, amount_received, currency, status, settlement_ref, settled_at, created_at, updated_at)
VALUES
 ('cc000000-0000-4000-8000-000000000001','bb000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000001',10000000,10000000,'INR','paid','UTR-2026-0501-88213','2026-05-14',now(),now()),
 ('cc000000-0000-4000-8000-000000000002','bb000000-0000-4000-8000-000000000002','aa000000-0000-4000-8000-000000000001',5000000,0,'INR','outstanding',NULL,NULL,now(),now()),
 ('cc000000-0000-4000-8000-000000000003','bb000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000001',7500000,0,'INR','outstanding',NULL,NULL,now(),now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO ir.ir_nav_points (id, org_id, vehicle, as_of, nav_total, currency, basis, source, published_at, created_at, updated_at)
VALUES ('dd000000-0000-4000-8000-000000000001','2f81f8bf-9919-4856-82f7-ddf30663e710','baalvion','2026-06-30',12500000,'INR','fair_value','Board-approved valuation, 30 Jun 2026',now(),now(),now())
ON CONFLICT (id) DO NOTHING;
