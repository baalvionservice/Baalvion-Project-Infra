DROP INDEX IF EXISTS trade.uk_escrows_escrow_ref;
ALTER TABLE trade.escrows DROP COLUMN IF EXISTS java_escrow_id;
ALTER TABLE trade.escrows DROP COLUMN IF EXISTS escrow_ref;
ALTER TABLE trade.organizations DROP COLUMN IF EXISTS ledger_account_id;
