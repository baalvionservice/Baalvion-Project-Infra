-- Seed the "Baalvion Platform" org (superadmin@baalvion.com) with sample
-- dashboard data so the admin's own organization is no longer empty.
--
-- Why this exists:
--   dashboard-service scopes every query by org_id. The platform-admin user
--   (id 67) logs in under org 52c76e5c ("Baalvion Platform"), which had ZERO
--   rows, while all the seeded sample data belonged to org a97b5d4a
--   ("Demo User's Workspace"). Result: empty admin dashboards.
--
-- What it does:
--   Clones the demo org's rows into the platform org as FRESH rows. The demo
--   org is left untouched. Primary keys of parent tables (domains, employees)
--   are shifted by a fixed offset so foreign keys remap consistently
--   (business_id/domain_id -> domains.id, manager_id/employee_id/assignee_id
--   -> employees.id). Child tables let their own sequence assign new ids.
--
-- Safe to read; mutates only the platform org. Aborts if the platform org
-- already has domains (prevents double-seeding).
--
-- Run:
--   docker exec -i baalvion-postgres psql -U baalvion -d baalvion_db \
--     -v ON_ERROR_STOP=1 -f - < seedPlatformOrgFromDemo.sql

\set SRC  'a97b5d4a-3457-4d6d-a2ed-e74fcfb87d86'
\set DST  '52c76e5c-0668-4492-ba20-23e7ee16f49b'
\set ADMIN 67

BEGIN;

-- Guard: don't double-seed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM dashboard.domains
             WHERE org_id = '52c76e5c-0668-4492-ba20-23e7ee16f49b') THEN
    RAISE EXCEPTION 'Platform org already has dashboard data; aborting to avoid duplicates.';
  END IF;
END $$;

-- 1) domains (parent) — explicit id = old + 1,000,000
INSERT INTO dashboard.domains
  (id, org_id, name, type, description, country, country_code, currency, status, created_at, updated_at)
SELECT id + 1000000, :'DST', name, type, description, country, country_code, currency, status, created_at, updated_at
FROM dashboard.domains WHERE org_id = :'SRC';

-- 2) employees (parent + self-ref) — explicit id; remap business_id, manager_id
INSERT INTO dashboard.employees
  (id, org_id, name, email, role, department, business_id, country, status,
   employment_type, join_date, salary, manager_id, performance_score,
   tasks_completed, attendance_rate, created_at, updated_at)
SELECT id + 1000000, :'DST', name, email, role, department, business_id + 1000000,
       country, status, employment_type, join_date, salary, manager_id + 1000000,
       performance_score, tasks_completed, attendance_rate, created_at, updated_at
FROM dashboard.employees WHERE org_id = :'SRC';

-- 3) shareholders (no deps)
INSERT INTO dashboard.shareholders
  (org_id, name, role, equity_percentage, created_at, updated_at)
SELECT :'DST', name, role, equity_percentage, created_at, updated_at
FROM dashboard.shareholders WHERE org_id = :'SRC';

-- 4) attendance -> employees
INSERT INTO dashboard.attendance
  (org_id, employee_id, date, status, hours_worked, created_at, updated_at)
SELECT :'DST', employee_id + 1000000, date, status, hours_worked, created_at, updated_at
FROM dashboard.attendance WHERE org_id = :'SRC';

-- 5) financial_entries -> domains
INSERT INTO dashboard.financial_entries
  (org_id, domain_id, type, amount, date, description, category, created_at, updated_at)
SELECT :'DST', domain_id + 1000000, type, amount, date, description, category, created_at, updated_at
FROM dashboard.financial_entries WHERE org_id = :'SRC';

-- 6) kpis -> domains
INSERT INTO dashboard.kpis
  (org_id, business_id, revenue_target, revenue_actual, profit_margin, profit_trend,
   customers_total, customers_change, return_rate, nps, created_at, updated_at)
SELECT :'DST', business_id + 1000000, revenue_target, revenue_actual, profit_margin, profit_trend,
       customers_total, customers_change, return_rate, nps, created_at, updated_at
FROM dashboard.kpis WHERE org_id = :'SRC';

-- 7) operations_alerts -> domains
INSERT INTO dashboard.operations_alerts
  (org_id, title, message, severity, status, business_id, created_at, updated_at)
SELECT :'DST', title, message, severity, status, business_id + 1000000, created_at, updated_at
FROM dashboard.operations_alerts WHERE org_id = :'SRC';

-- 8) compliance_records -> domains
INSERT INTO dashboard.compliance_records
  (org_id, country_id, country, business_id, tax_status, tax_status_code, vat_gst,
   licenses, data_laws, employment_law, overall_score, action_items, created_at, updated_at)
SELECT :'DST', country_id, country, business_id + 1000000, tax_status, tax_status_code, vat_gst,
       licenses, data_laws, employment_law, overall_score, action_items, created_at, updated_at
FROM dashboard.compliance_records WHERE org_id = :'SRC';

-- 9) tasks -> domains + employees
INSERT INTO dashboard.tasks
  (org_id, title, description, status, assignee_id, business_id, priority, due_date, created_at, updated_at)
SELECT :'DST', title, description, status, assignee_id + 1000000, business_id + 1000000,
       priority, due_date, created_at, updated_at
FROM dashboard.tasks WHERE org_id = :'SRC';

-- 10) transactions -> domains
INSERT INTO dashboard.transactions
  (org_id, business_id, gateway, customer_name, customer_email, amount, fee, currency, status, created_at, updated_at)
SELECT :'DST', business_id + 1000000, gateway, customer_name, customer_email, amount, fee, currency, status, created_at, updated_at
FROM dashboard.transactions WHERE org_id = :'SRC';

-- 11) notifications -> point at the platform admin so the bell shows items
INSERT INTO dashboard.notifications
  (org_id, user_id, title, message, read, type, link, created_at)
SELECT :'DST', :ADMIN, title, message, read, type, link, created_at
FROM dashboard.notifications WHERE org_id = :'SRC';

-- 12) permissions -> platform admin (deduped on unique (org_id, user_id, module))
INSERT INTO dashboard.permissions
  (org_id, user_id, module, access, created_at, updated_at)
SELECT :'DST', :ADMIN, module, access, created_at, updated_at
FROM dashboard.permissions WHERE org_id = :'SRC'
ON CONFLICT (org_id, user_id, module) DO NOTHING;

-- 13) audit_logs (straight clone, org swapped)
INSERT INTO dashboard.audit_logs
  (org_id, action, entity_type, entity_id, user_id, user_name, role, resource,
   ip_address, location, status, severity, details, created_at)
SELECT :'DST', action, entity_type, entity_id, user_id, user_name, role, resource,
       ip_address, location, status, severity, details, created_at
FROM dashboard.audit_logs WHERE org_id = :'SRC';

COMMIT;
