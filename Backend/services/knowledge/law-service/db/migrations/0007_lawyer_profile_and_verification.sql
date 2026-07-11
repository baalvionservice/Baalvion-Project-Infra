-- 0007_lawyer_profile_and_verification.sql — additive columns for the
-- registration wizard's Location + Personal + Professional Details steps,
-- plus the Verification step's document queue.
--
-- state_id/city_id are nullable: existing lawyers keep displaying via their
-- free-text country/city columns (kept, not dropped) until backfilled.

ALTER TABLE legal.lawyers ADD COLUMN IF NOT EXISTS state_id       INTEGER REFERENCES legal.states(id);
ALTER TABLE legal.lawyers ADD COLUMN IF NOT EXISTS city_id        INTEGER REFERENCES legal.cities(id);
ALTER TABLE legal.lawyers ADD COLUMN IF NOT EXISTS dob            DATE;
ALTER TABLE legal.lawyers ADD COLUMN IF NOT EXISTS gender         VARCHAR(20);
ALTER TABLE legal.lawyers ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
ALTER TABLE legal.lawyers ADD COLUMN IF NOT EXISTS firm_name      VARCHAR(255);
ALTER TABLE legal.lawyers ADD COLUMN IF NOT EXISTS is_independent BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_lawyers_state ON legal.lawyers (state_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_city  ON legal.lawyers (city_id);

CREATE TABLE IF NOT EXISTS legal.verification_documents (
    id           SERIAL PRIMARY KEY,
    lawyer_id    INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    doc_type     VARCHAR(40) NOT NULL,
    storage_key  TEXT NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by  TEXT,
    review_notes TEXT,
    reviewed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verification_documents_lawyer ON legal.verification_documents (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_status ON legal.verification_documents (status);
