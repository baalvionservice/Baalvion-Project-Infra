-- 003 — performance indexes on tenant/FK/status/search/created_at columns.
-- Composite (tenant_id, status) where list queries filter both.
CREATE INDEX IF NOT EXISTS idx_rfqs_tenant_status      ON trade.rfqs (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created            ON trade.rfqs (created_at);
CREATE INDEX IF NOT EXISTS idx_deals_tenant            ON trade.deals (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_rfq               ON trade.deals (rfq_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status    ON trade.orders (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_deal             ON trade.orders (deal_id);
CREATE INDEX IF NOT EXISTS idx_escrows_tenant          ON trade.escrows (tenant_id);
CREATE INDEX IF NOT EXISTS idx_escrows_order           ON trade.escrows (order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tenant_status ON trade.shipments (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_order         ON trade.shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant        ON trade.documents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity        ON trade.documents (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_disputes_tenant         ON trade.disputes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order          ON trade.disputes (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant         ON trade.payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order          ON trade.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tenant       ON trade.compliance_cases (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wallets_tenant          ON trade.wallets (tenant_id);
CREATE INDEX IF NOT EXISTS idx_orgs_tenant             ON trade.organizations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_orgs_code               ON trade.organizations (code);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant    ON trade.notifications (tenant_id);
CREATE INDEX IF NOT EXISTS idx_listings_tenant_status  ON trade.marketplace_listings ("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_listings_company        ON trade.marketplace_listings ("companyId");
CREATE INDEX IF NOT EXISTS idx_quotations_tenant_rfq   ON trade.quotations ("tenantId", "rfqId");
CREATE INDEX IF NOT EXISTS idx_messages_tenant_deal    ON trade.chat_messages ("tenantId", "dealId");
CREATE INDEX IF NOT EXISTS idx_collections_tenant_coll ON trade.collections ("tenantId", collection);
CREATE INDEX IF NOT EXISTS idx_audit_seq               ON trade.audit_logs (seq)
