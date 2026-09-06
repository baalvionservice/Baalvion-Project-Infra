# Baalvion Insiders — pending work

State of the public directory as of 2026-09-07, and everything still open. Written so the next
person does not have to rediscover why a decision was made.

## What is live

| | |
|---|---|
| Investment firms | 22,608 |
| Their filings | 83,076 |
| Companies | 84,599 |
| Their filings | 100,654 |
| Named people | 276,053 |
| Countries / cities | 67 / 5,977 |
| Indexable URLs | ~134,600 across 11 sitemap files |

Sources: SEC Form D quarterly datasets (20 quarters), Norway's Enhetsregisteret, Finland's PRH.
Every figure on a profile traces to a filing linked from that profile.

---

## Blocked on a decision or a credential

### 1. Six company registers need a free API key
The UK adapter is written and wired (`scripts/ingest-registry.js --country=uk`); it exits with the
signup URL when `COMPANIES_HOUSE_KEY` is unset. Denmark, the Netherlands, France, Australia and
New Zealand are the same shape and not yet written.

Register at <https://developer.company-information.service.gov.uk/>, set the key, run the script.
UK is the highest-value addition by a wide margin.

**Note on UK SIC codes:** they are 5-digit and do *not* map onto the NACE divisions used for
Norway and Finland. The sector list in the adapter is stated explicitly for that reason — deriving
it from the NACE prefixes would silently pull the wrong industries.

### 2. Investor email and website do not exist in public filings
Form D carries a business address and telephone (present for all 22,608 firms) and nothing else.
There are two honest routes to an email address:

- **Profile claiming**, already built. A firm claims its record with a work email, a human reviews
  it, approval sets `claimed_at`/`claimed_by`. Zero claims so far because the site is not live.
- **A licensed contact dataset**, which is a consent and cost decision, not a technical one.

Do not scrape personal contact details. Do not add a "contact this investor" button to a record
the firm has not claimed — the platform cannot broker an introduction to a firm that never joined.

### 3. `Backend/packages/money` is not tracked in git
It lost its `package.json` during this session (only `dist/` and `node_modules/` remained), which
stopped **four** services booting: insiders, trade, law and imperialpedia. A manifest was
reconstructed from the built output locally, but nothing in the repository can restore it.

**Commit that package.** Right now one deleted file takes down four services with no way back.

### 4. Estonia is deliberately skipped
Its open register publishes no industry classification at all. The only sensible filter yields
~97,000 records carrying a name, an address and a registration date — no sector, no funding, no
people. That would nearly double the company count while adding nothing anyone can search on.

Revisit only if Estonia publishes an activity/EMTAK file, or if a sector can be inferred from
another source.

---

## Known limits worth stating publicly

### Coverage is US-filing-shaped
67 countries sounds global; it is not. 25,488 of the companies are US-domiciled, and the non-US
entries are mostly foreign-domiciled US filers plus Norway and Finland. Say so rather than
implying worldwide coverage.

### Register records carry no funding
A Norwegian or Finnish record shows legal form, staff, status and registration number, and no
funding — because the register does not record it, not because the company never raised. The UI
renders the two record shapes differently for this reason (`src/lib/company-source.ts`).

### Roles are as filed and go stale
Filings are not updated when someone leaves. A person listed on a 2022 filing may have moved on.
Every people surface says so.

---

## Engineering follow-ups

### Profile URLs are not rebuild-safe
`/investors/<name>-<8 hex of uuid>` embeds the row id. A `DELETE` + re-ingest mints new ids and
404s every profile URL — this happened once during development. The ingest upserts on `source_id`
(the normalised firm name) and keeps ids stable on its own; **never delete-and-rebuild a table
whose ids appear in public URLs.** If ids must change, add redirects first.

### The service-address pass must run after every ingest
Fund administrators file hundreds of unrelated entities from one suite; one Seattle address had
produced 13,688 "venture firms". `flagServiceAddresses()` runs at the end of both ingests and
`scripts/flag-service-addresses.js` does it standalone. The upsert rewrites `city` straight from
the filing, so skipping this restores the false geography silently.

### Finland's API ignores its own filter parameters
`mainBusinessLine` and `registrationDateStart` are accepted and not applied — a NACE-62 query
returns hairdressers and a 2023 cutoff returns 1998 registrations. Both are re-applied client-side,
which is why the Finnish yield per request is low. It is also slow (~11s per request), so a full
pull needs a long background run rather than a session.

### Bot rendering and the SPA must agree
`controller/renderController.js` serves crawlers a real document per URL because the SPA shell is
219 characters and returned one `<title>` for all pages. If a page's `noIndex` rule changes in the
React app, change it in the renderer too — otherwise crawlers get an indexable copy of a page the
app marks noindex.

### Prerendering for humans is still not done
Crawlers are covered by the renderer. Real SSR/prerendering for first paint is not, and would be
the next structural improvement if the site grows.

---

## Content rules that must not be relaxed

- **Never pad pages to a word count.** 82% of the people in this directory appear on exactly one
  filing — about fifteen words of fact. Reaching 1,200 words each would mean generating ~180
  million words of untrue text about real named individuals. Thin pages carry `noindex` instead.
- **Never seed demo fiction.** `seed.js` refuses to run against a database holding real records
  and needs `--force` on a throwaway database. It exists because five invented founders were once
  published on a public page beside 49,020 real companies.
- **Leave unknown fields empty.** Form D reports no thesis, sector, stage or cheque size. Those
  render as "not disclosed" and must not be backfilled with a guess.

---

## Review needed before deploy

`Backend/services/identity/auth-gateway/routes/publicReads.js` changes the identity context's
trust boundary: it proxies an allow-listed set of GET endpoints without a session. It is
deliberately narrow — exact prefix match, GET/HEAD only, no identity injected, cookies and
Authorization stripped — but per CODEOWNERS it needs the identity context's review, and the
gateway must be redeployed or the public directory returns 401 in production.

`vercel.json` also assumes `https://api.baalvion.com/api/v1/insiders/*` reaches this service.
That path was confirmed to route, but the allow-list has to be live for it to return anything.
