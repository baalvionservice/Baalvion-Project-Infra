-- 069 — Depth layer for the World Shipping Directory.
--
-- 067 answered "which ships does this company have". This answers the questions a reader
-- actually arrives with: who founded it, who runs it, what it owns, what it earns, and
-- what the ship in front of them actually is. Same two tables, no parallel registry.
--
-- PROVENANCE RULES CARRIED FORWARD FROM 067 — they get stricter here, not looser:
--
--  * Every photograph on this site is someone else's work under a Creative Commons or
--    public-domain licence. `image_credit` / `logo_credit` carry the author, the licence
--    and the file's description page, because a CC BY-SA image shown without attribution
--    is a licence breach, not a styling detail. A photo with no credit row is not shown.
--  * `summary` is a verbatim lead-section extract from a named Wikipedia article, stored
--    with its URL and fetch date. It is quoted material, never generated prose, and the
--    page attributes it. If the extract is missing, the section is absent — nothing is
--    written to fill the space.
--  * Money columns are useless without their year and currency. `revenue`,
--    `net_profit`, `total_assets`, `operating_income` and `market_cap` all sit behind
--    `financials_currency` + `financials_as_of`; a figure whose year we could not
--    determine is not stored at all.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function bodies.

-- ─────────────────────────────────────────────────────────────────────────────
-- CARRIERS — the people, the corporate shape, the money, the prose
-- ─────────────────────────────────────────────────────────────────────────────

-- Who created the company, and who runs it now. Arrays of
-- {qid, name, role, image, imageCredit, birthYear, deathYear, description} so a founder
-- who is a person and a founder that is another company both fit without a second table.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS founders        jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS key_people      jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Corporate shape.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS subsidiaries    jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS owners          jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS products        jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS industry        text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS legal_form      text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS formed_in       text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS dissolved_year  integer;

-- Listing / registration identifiers. These are what make a company page an *entity*
-- page to a search engine rather than a name it has to disambiguate.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS stock_exchange  text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS ticker          text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS isin            text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS lei             text;

-- Money. Never rendered without financials_currency + financials_as_of.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS revenue             bigint;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS net_profit          bigint;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS operating_income    bigint;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS total_assets        bigint;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS total_equity        bigint;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS market_cap          bigint;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS financials_currency text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS financials_as_of    integer;

-- Where it is, precisely enough to place on a map.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS hq_lat numeric(9,6);
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS hq_lon numeric(9,6);

-- Photography. image_url is a real photograph (a ship, a building, a terminal); logo_url
-- already exists from 067. Both carry their credit or they do not render.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS image_url    text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS image_credit jsonb;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS logo_credit  jsonb;

-- Quoted encyclopaedic prose + its citation.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS wikipedia_title  text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS wikipedia_url    text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS summary          text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS summary_fetched_at timestamptz;

ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS social jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_carriers_has_summary ON tradeops.carriers ((summary IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_carriers_industry    ON tradeops.carriers (industry);

-- ─────────────────────────────────────────────────────────────────────────────
-- VESSELS — the particulars a ship page is expected to answer
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS net_tonnage       integer;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS displacement_t    bigint;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS yard_number       text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS designed_to_carry text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS launched_year     integer;

-- P793 "significant event" with its date — a delivery, a grounding, a sale, a scrapping.
-- [{event, qid, date, note}]. This is the ship's history, sourced, not narrated.
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS image_credit jsonb;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS images       jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS wikipedia_title text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS wikipedia_url   text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS summary         text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS summary_fetched_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_vessels_has_image   ON tradeops.vessels ((image_url IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_vessels_has_summary ON tradeops.vessels ((summary IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_vessels_dwt         ON tradeops.vessels (deadweight_tons DESC NULLS LAST);

-- ─────────────────────────────────────────────────────────────────────────────
-- Wikimedia file URLs arrive from WDQS as http:// Special:FilePath links to the
-- FULL-SIZE original. Both are defects at render time and both are fixed at the source
-- rather than patched in every template:
--   * http:// is blocked outright by this app's own Content-Security-Policy
--     (img-src ... https:), so every "real photo" on the site was silently not loading.
--   * the originals are frequently 5-20 MB scans; Special:FilePath honours ?width=,
--     which returns a served thumbnail instead.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE tradeops.vessels
   SET image_url = replace(image_url, 'http://commons.wikimedia.org', 'https://commons.wikimedia.org')
 WHERE image_url LIKE 'http://commons.wikimedia.org%';

UPDATE tradeops.carriers
   SET logo_url = replace(logo_url, 'http://commons.wikimedia.org', 'https://commons.wikimedia.org')
 WHERE logo_url LIKE 'http://commons.wikimedia.org%';
