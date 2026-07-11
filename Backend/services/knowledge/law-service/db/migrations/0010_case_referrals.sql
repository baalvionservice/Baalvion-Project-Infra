-- 0010_case_referrals.sql — professional case-routing referrals (spec area 6).
-- Deliberately a separate table/domain from legal.referrals (the growth
-- referral-code / rewards program) — case_referrals is lawyer-to-lawyer case
-- routing: Create Referral -> Select Country/Practice Area/City -> Choose
-- Lawyer -> Send -> Accept/Decline -> Case Shared -> Completed.

CREATE TABLE IF NOT EXISTS legal.case_referrals (
    id               SERIAL PRIMARY KEY,
    from_lawyer_id   INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    to_lawyer_id     INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    country_code     VARCHAR(2),
    state_id         INTEGER REFERENCES legal.states(id),
    city_id          INTEGER REFERENCES legal.cities(id),
    practice_area_id INTEGER REFERENCES legal.practice_areas(id),
    case_id          INTEGER REFERENCES legal.cases(id),
    title            VARCHAR(500) NOT NULL,
    description      TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'sent',
    -- Differentiator slot: standardized referral agreements / fee disclosure.
    -- Not populated by this phase's UI; reserved so a later phase doesn't need
    -- a schema change.
    fee_disclosure   JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_referrals_from ON legal.case_referrals (from_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_case_referrals_to ON legal.case_referrals (to_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_case_referrals_status ON legal.case_referrals (status);
