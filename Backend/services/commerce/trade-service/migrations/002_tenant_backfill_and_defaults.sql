-- 002 — backfill tenant_id on existing rows + DB-level default, so every typed
-- resource is tenant-stamped before isolation hooks go live (prevents NULL rows
-- vanishing under the tenant filter).
UPDATE trade.organizations    SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.organizations    ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.rfqs             SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.rfqs             ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.deals            SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.deals            ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.orders           SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.orders           ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.escrows          SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.escrows          ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.shipments        SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.shipments        ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.documents        SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.documents        ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.payments         SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.payments         ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.compliance_cases SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.compliance_cases ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.disputes         SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.disputes         ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.wallets          SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.wallets          ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
UPDATE trade.notifications    SET tenant_id = 'T-DEMO' WHERE tenant_id IS NULL;
ALTER TABLE trade.notifications    ALTER COLUMN tenant_id SET DEFAULT 'T-DEMO';
-- camelCase tenant columns (already model-defaulted; backfill any stragglers)
UPDATE trade.marketplace_listings SET "tenantId" = 'T-DEMO' WHERE "tenantId" IS NULL;
UPDATE trade.quotations           SET "tenantId" = 'T-DEMO' WHERE "tenantId" IS NULL;
UPDATE trade.chat_messages        SET "tenantId" = 'T-DEMO' WHERE "tenantId" IS NULL;
UPDATE trade.collections          SET "tenantId" = 'T-DEMO' WHERE "tenantId" IS NULL
