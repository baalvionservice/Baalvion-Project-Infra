-- A completed payment may appear in at most one settlement batch (auto-feed idempotency).
ALTER TABLE settlement.settlement_items
  ADD CONSTRAINT uk_settlement_item_txn UNIQUE (tenant_id, transaction_id);
