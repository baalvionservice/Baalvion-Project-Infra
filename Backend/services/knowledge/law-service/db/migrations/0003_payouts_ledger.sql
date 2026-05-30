-- 0003_payouts_ledger.sql — lawyer earnings ledger + payouts.
-- Closes the marketplace money-loop: clients pay -> platform takes a fee ->
-- the lawyer's net is credited to a ledger -> lawyer requests a payout -> admin
-- (or, in production, Razorpay Payouts) settles it. Double-entry-ish: every
-- succeeded payment yields one CREDIT row; every settled payout one DEBIT row;
-- balance = sum(credit) - sum(debit).

CREATE TABLE IF NOT EXISTS legal.lawyer_ledger (
    id          SERIAL PRIMARY KEY,
    lawyer_id   INTEGER NOT NULL,
    payment_id  INTEGER,
    payout_id   INTEGER,
    entry_type  TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit')),
    amount      NUMERIC(12,2) NOT NULL,           -- net amount moved (always positive)
    fee_amount  NUMERIC(12,2) NOT NULL DEFAULT 0, -- platform fee withheld (credits only)
    currency    VARCHAR(3) NOT NULL DEFAULT 'USD',
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One credit per payment (idempotent settlement — re-running settle never double-credits).
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_payment_credit
    ON legal.lawyer_ledger (payment_id) WHERE entry_type = 'credit' AND payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_lawyer ON legal.lawyer_ledger (lawyer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS legal.payouts (
    id           SERIAL PRIMARY KEY,
    lawyer_id    INTEGER NOT NULL,
    amount       NUMERIC(12,2) NOT NULL,
    currency     VARCHAR(3) NOT NULL DEFAULT 'USD',
    status       TEXT NOT NULL DEFAULT 'requested'
                 CHECK (status IN ('requested', 'processing', 'paid', 'failed', 'cancelled')),
    method       TEXT NOT NULL DEFAULT 'bank_transfer',
    reference    TEXT,                 -- gateway/transfer reference
    notes        TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payouts_lawyer ON legal.payouts (lawyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON legal.payouts (status);
