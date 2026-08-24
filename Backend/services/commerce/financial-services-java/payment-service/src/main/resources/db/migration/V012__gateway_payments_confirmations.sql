-- Surfaces two fields the crypto poller already computes every tick but previously discarded:
-- confirmations (transient, re-derived on each poll) and transaction_hash (previously only
-- inside raw_response JSON). Needed for the admin reconciliation view to query/filter/display
-- real values instead of parsing JSON client-side. NULL for every non-crypto provider row.
ALTER TABLE payments.gateway_payments
  ADD COLUMN IF NOT EXISTS confirmations INTEGER,
  ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_gwpay_transaction_hash ON payments.gateway_payments (transaction_hash);
