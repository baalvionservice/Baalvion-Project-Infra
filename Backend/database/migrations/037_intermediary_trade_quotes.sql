-- Migration 037: a published fee for intermediaries, and a locked price on each trade (the scanner shows only after it is locked).
ALTER TABLE commerce.commerce_intermediaries
    ADD COLUMN IF NOT EXISTS fee_percent numeric(5,2);
ALTER TABLE commerce.commerce_intermediary_trades
    ADD COLUMN IF NOT EXISTS quote jsonb,
    ADD COLUMN IF NOT EXISTS quote_accepted_at timestamptz,
    ADD COLUMN IF NOT EXISTS quote_expires_at timestamptz,
    ADD COLUMN IF NOT EXISTS quote_required boolean NOT NULL DEFAULT false;
