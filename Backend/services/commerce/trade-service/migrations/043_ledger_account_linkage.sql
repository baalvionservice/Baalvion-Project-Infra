-- 043 — Ledger-account linkage for the escrow/ledger money-flow integration.
--
--   • trade.organizations.ledger_account_id — caches the UUID of the org's
--     account-service (financial-services-java, :3016/:13016) BUSINESS account,
--     lazily provisioned on first need (see lib/accountProvisioning.js). Nullable:
--     an org with no money-moving activity yet never gets an account.
--   • trade.escrows.escrow_ref / java_escrow_id — correlation keys for the
--     escrow.hold.* webhook projection (controller/internalController.js). The
--     Java escrow-service is the write system of record (routes/escrowRoutes.js
--     is a deliberate 410 — see that file's header comment); trade.escrows is a
--     read-only projection matched by escrow_ref (assigned by the caller,
--     unique per tenant on the Java side) and backfilled with java_escrow_id
--     once the created event is observed.

ALTER TABLE trade.organizations ADD COLUMN IF NOT EXISTS ledger_account_id uuid;

ALTER TABLE trade.escrows ADD COLUMN IF NOT EXISTS escrow_ref text;
ALTER TABLE trade.escrows ADD COLUMN IF NOT EXISTS java_escrow_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uk_escrows_escrow_ref ON trade.escrows (escrow_ref) WHERE escrow_ref IS NOT NULL;
