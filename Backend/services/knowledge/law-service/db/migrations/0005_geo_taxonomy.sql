-- 0005_geo_taxonomy.sql — State/City taxonomy beneath the existing country layer.
-- Country stays ISO-code-by-value (matches lawyers.country_code / getCountries()) —
-- no countries table is introduced. States/cities are real relational tables so
-- registration, search, and profile can browse Country -> State -> City.
-- Self-contained (explicit CREATE TABLE, not relied on sync) so this migration
-- works whether or not sync has already run.
-- Seeded with a starter set (India, US, UK, Canada, Australia, UAE, Singapore);
-- every other country falls back to the existing free-text lawyers.city column.

CREATE TABLE IF NOT EXISTS legal.states (
    id           SERIAL PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL,
    name         VARCHAR(120) NOT NULL,
    code         VARCHAR(10),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_states_country ON legal.states (country_code);

CREATE TABLE IF NOT EXISTS legal.cities (
    id           SERIAL PRIMARY KEY,
    state_id     INTEGER NOT NULL REFERENCES legal.states(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL,
    name         VARCHAR(160) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cities_state ON legal.cities (state_id);
CREATE INDEX IF NOT EXISTS idx_cities_country ON legal.cities (country_code);

-- Unique indexes pulled OUT of the inline column constraints and made their own
-- IF-NOT-EXISTS statements. Root cause of a real production bug: legal.states/cities
-- get created by Sequelize model sync on boot (no composite-unique knowledge) BEFORE
-- this migration ever runs. CREATE TABLE IF NOT EXISTS then silently skips against
-- the pre-existing table -- the inline UNIQUE never actually gets applied -- and the
-- INSERT ... ON CONFLICT below fails every time with "no unique or exclusion
-- constraint matching". Since the whole file runs in one transaction that rolls back
-- on that failure, the migration is never marked applied and retries on every boot
-- (observed: 1700+ crash-loop restarts). CREATE UNIQUE INDEX IF NOT EXISTS satisfies
-- ON CONFLICT's requirement (any matching unique index, not specifically a named
-- constraint) regardless of who created the table first.
CREATE UNIQUE INDEX IF NOT EXISTS uq_states_country_name ON legal.states (country_code, name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cities_state_name ON legal.cities (state_id, name);

-- Same root cause, same fix, for the DEFAULT now() on created_at: the pre-existing table
-- (created before this migration ever ran, see above) also lacks this default, so the
-- INSERTs below -- which don't list created_at, relying on the table default -- failed
-- with "null value in column created_at ... violates not-null constraint" once the unique-
-- index fix got past the first error. ALTER COLUMN SET DEFAULT is safe to re-run.
ALTER TABLE legal.states ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE legal.cities ALTER COLUMN created_at SET DEFAULT now();

-- ── Starter states ──────────────────────────────────────────────────────────
INSERT INTO legal.states (country_code, name, code) VALUES
    ('IN','Maharashtra','MH'), ('IN','Delhi','DL'), ('IN','Karnataka','KA'),
    ('IN','Tamil Nadu','TN'), ('IN','Gujarat','GJ'), ('IN','West Bengal','WB'),
    ('IN','Telangana','TS'), ('IN','Uttar Pradesh','UP'), ('IN','Rajasthan','RJ'),
    ('IN','Kerala','KL'),
    ('US','California','CA'), ('US','New York','NY'), ('US','Texas','TX'),
    ('US','Florida','FL'), ('US','Illinois','IL'), ('US','Massachusetts','MA'),
    ('US','Washington','WA'), ('US','Georgia','GA'), ('US','Delaware','DE'),
    ('US','District of Columbia','DC'),
    ('GB','England','ENG'), ('GB','Scotland','SCT'), ('GB','Wales','WLS'),
    ('GB','Northern Ireland','NIR'),
    ('CA','Ontario','ON'), ('CA','Quebec','QC'), ('CA','British Columbia','BC'),
    ('CA','Alberta','AB'),
    ('AU','New South Wales','NSW'), ('AU','Victoria','VIC'), ('AU','Queensland','QLD'),
    ('AU','Western Australia','WA'),
    ('AE','Dubai','DU'), ('AE','Abu Dhabi','AZ'), ('AE','Sharjah','SH'),
    ('SG','Singapore','SG')
ON CONFLICT (country_code, name) DO NOTHING;

-- ── Starter cities ──────────────────────────────────────────────────────────
INSERT INTO legal.cities (state_id, country_code, name)
SELECT s.id, v.country_code, v.city
FROM (VALUES
    ('IN','Maharashtra','Mumbai'), ('IN','Maharashtra','Pune'), ('IN','Maharashtra','Nagpur'), ('IN','Maharashtra','Nashik'),
    ('IN','Delhi','New Delhi'),
    ('IN','Karnataka','Bengaluru'), ('IN','Karnataka','Mysuru'), ('IN','Karnataka','Mangaluru'),
    ('IN','Tamil Nadu','Chennai'), ('IN','Tamil Nadu','Coimbatore'), ('IN','Tamil Nadu','Madurai'),
    ('IN','Gujarat','Ahmedabad'), ('IN','Gujarat','Surat'), ('IN','Gujarat','Vadodara'),
    ('IN','West Bengal','Kolkata'), ('IN','West Bengal','Howrah'),
    ('IN','Telangana','Hyderabad'), ('IN','Telangana','Warangal'),
    ('IN','Uttar Pradesh','Lucknow'), ('IN','Uttar Pradesh','Noida'), ('IN','Uttar Pradesh','Kanpur'),
    ('IN','Rajasthan','Jaipur'), ('IN','Rajasthan','Udaipur'),
    ('IN','Kerala','Kochi'), ('IN','Kerala','Thiruvananthapuram'),
    ('US','California','Los Angeles'), ('US','California','San Francisco'), ('US','California','San Diego'),
    ('US','New York','New York City'), ('US','New York','Buffalo'),
    ('US','Texas','Houston'), ('US','Texas','Austin'), ('US','Texas','Dallas'),
    ('US','Florida','Miami'), ('US','Florida','Orlando'),
    ('US','Illinois','Chicago'),
    ('US','Massachusetts','Boston'),
    ('US','Washington','Seattle'),
    ('US','Georgia','Atlanta'),
    ('US','Delaware','Wilmington'),
    ('US','District of Columbia','Washington'),
    ('GB','England','London'), ('GB','England','Manchester'), ('GB','England','Birmingham'), ('GB','England','Leeds'),
    ('GB','Scotland','Edinburgh'), ('GB','Scotland','Glasgow'),
    ('GB','Wales','Cardiff'),
    ('GB','Northern Ireland','Belfast'),
    ('CA','Ontario','Toronto'), ('CA','Ontario','Ottawa'),
    ('CA','Quebec','Montreal'), ('CA','Quebec','Quebec City'),
    ('CA','British Columbia','Vancouver'),
    ('CA','Alberta','Calgary'), ('CA','Alberta','Edmonton'),
    ('AU','New South Wales','Sydney'), ('AU','New South Wales','Newcastle'),
    ('AU','Victoria','Melbourne'),
    ('AU','Queensland','Brisbane'),
    ('AU','Western Australia','Perth'),
    ('AE','Dubai','Dubai'),
    ('AE','Abu Dhabi','Abu Dhabi'),
    ('AE','Sharjah','Sharjah'),
    ('SG','Singapore','Singapore')
) AS v(country_code, state_name, city)
JOIN legal.states s ON s.country_code = v.country_code AND s.name = v.state_name
ON CONFLICT (state_id, name) DO NOTHING;
