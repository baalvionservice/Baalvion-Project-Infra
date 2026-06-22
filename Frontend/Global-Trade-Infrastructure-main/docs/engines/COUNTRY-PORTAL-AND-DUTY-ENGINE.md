# Country Portal, Duty Calculator & Admin Form Engine

> **Status:** ✅ Implemented & tested (82 tests across 8 files — pure unit + real-PostgreSQL integration; `tsc` clean project-wide).
> **Principle:** *Configuration over code.* This is the public-facing **read layer + decision engines + admin form engine** built on top of the [Global Country Knowledge Base](./COUNTRY-KNOWLEDGE-BASE.md). It adds **zero** new tables — it projects the GCKB's `gckb_records` / `gckb_relationships` / `gckb_revisions` and the registry config into a public portal, a duty/FTA engine and a registry-driven admin.

This layer turns the GCKB substrate into product: a public **Country / Tariff / FTA / Ports / Authorities / Compare** portal, an **import-duty calculator** with FTA-preference override, and the **registry-driven admin form engine**. It is net-new and additive; it never modifies a LIVE surface and only ever *reads* the published global baseline.

See [COUNTRY-KNOWLEDGE-BASE.md](./COUNTRY-KNOWLEDGE-BASE.md) for the underlying substrate (3 tables, generic service, registry, import engine).

---

## 1. Architecture

```
Public portal (SSR + ISR)         Public API (unauth)            Engines (pure core + thin orchestrator)
─────────────────────────         ───────────────────            ──────────────────────────────────────
/countries            ─┐          /api/gckb/public/countries          public-read.ts   (published-only,
/countries/[code]      │          /api/gckb/public/countries/[code]     global-baseline-only projection)
/tariffs               ├───────►  /api/gckb/public/duty-calculator ─► duty-calculator.ts (computeEstimate)
/fta  · /fta/[code]    │          /api/gckb/public/fta · /fta/[code]   admin-form-model.ts (form schema +
/ports · /authorities  │          /api/gckb/public/ports               KbWriteInput round-trip)
/compare              ─┘          /api/gckb/public/authorities
                                   /api/gckb/public/compare
                                   /api/gckb/entities  (registry introspection → Admin forms)
```

| Layer | File | Responsibility |
|------|------|----------------|
| Read projection | `src/server/gckb/public-read.ts` | Published-only, global-baseline-only reads; country profile aggregation; FTA detail; comparison; port/authority directories. |
| Duty engine | `src/server/gckb/duty-calculator.ts` | Pure `computeEstimate` (HS prefix match, MFN vs FTA-preferential, additional duties, tax-on-value+duties) + `estimateDuty` orchestrator. |
| Admin form engine | `src/server/gckb/admin-form-model.ts` | Registry metadata → form schema; form values → validated `KbWriteInput`. |
| Policy forms | `src/server/gckb/policy-forms.ts` | Declarative Admin/presentation metadata + group for all 19 policy types. |
| Country-reference registry | `src/server/gckb/registries/country-reference.ts` | The 9 country-reference entities with `formFields` + typed `relationshipTypes`. |
| Seed | `src/server/gckb/seed-data.json` + `scripts/seed-countries.cjs` | 10-country real baseline; idempotent loader. |

### Two safety invariants (why the portal needs no auth)

Every public read passes `organizationId: null` and filters `status === 'PUBLISHED'`, enforced centrally in `public-read.ts`:

1. **Global baseline only** — no tenant's private overrides can ever surface publicly.
2. **Published only** — drafts, superseded and archived records are invisible.

Both invariants are proven by integration tests (`public-read.integration.test.ts`).

---

## 2. Self-describing registry

The GCKB registry is now fully **self-describing**: every entity carries declarative `formFields` (with `placement: 'top' | 'attributes'`, types, enum options) and typed `relationshipTypes`, and every one of the **19 policy types** has a presentation form + group (`policy-forms.ts`). `GET /api/gckb/entities` surfaces all of it, so the Admin UI and the public explorers render dynamically — adding an entity or policy type grows both surfaces with no UI code change.

A notable cross-module edge: `country_policy` declares `ENFORCED_BY_RULE → rule`, linking a policy to a [Rule Engine](./RULE-ENGINE.md) rule.

---

## 3. Public portal surfaces

| Route | Surface | Source |
|------|---------|--------|
| `/countries` | Country Explorer (search + region filter) | `listCountries()` |
| `/countries/[code]` | Country Profile — every policy grouped (tax / tariff / license / certificate / restriction / documents / integration / …) + authorities + ports + agreements | `getCountryProfile()` |
| `/tariffs` | Tariff Explorer + **Duty Calculator** | `listCountries()` + `estimateDuty()` |
| `/fta` | FTA Explorer (search + kind filter) | `listAgreements()` |
| `/fta/[code]` | Agreement detail — members + rules of origin + preferential tariff lines | `getAgreementDetail()` |
| `/ports` | Cross-country ports directory (country + kind filters) | `listPortsDirectory()` |
| `/authorities` | Cross-country authorities directory | `listAuthoritiesDirectory()` |
| `/compare` | Side-by-side country comparison (2–4) | `compareCountries()` |

All pages are Server Components (SSR + ISR `revalidate = 300`) for SEO, with client components only for interactive filtering/forms. Dynamic per-country/agreement SEO metadata + breadcrumb JSON-LD throughout.

---

## 4. Duty calculation engine

`computeEstimate(policies, agreements, query)` is a pure function (no I/O), so it is exhaustively unit-tested. The landed-cost build-up:

```
customs value
  + basic customs duty   ← best-matching `tariff` line (longest HS prefix wins;
                            FTA-preferential line replaces MFN when origin qualifies)
  + additional duties     ← `duty` policies (anti-dumping, countervailing, surcharges)
  + import taxes          ← `tax` policies (VAT/GST) on (value + duties)
  = landed cost           (+ effective duty rate)
```

**FTA preference override:** when the origin and destination are both in-force members of an agreement and a preferential tariff line exists for the HS code under it, the preferential rate replaces MFN and the **saving vs MFN** is reported. Worked example (seeded): India→Australia, HS 8703, value 1000 AUD → ECTA preferential 0% vs 5% MFN → save 50 AUD.

It is an **informational estimate** from configured reference data, not a binding customs assessment (every response carries that disclaimer).

---

## 5. Registry-driven Admin form engine

`admin-form-model.ts` is the verified core of the registry-driven admin:

- `buildFormSchema(entityType, policyType?)` → a normalized form schema (top vs attribute fields; for `country_policy`, attribute fields come from the chosen policy type).
- `formValuesToWriteInput(schema, values)` → a `KbWriteInput`, splitting promoted columns from `attributes` and coercing each value to its declared type.

The decisive test: the produced input **validates against the same registry definition that drove the form** — the admin can never construct an input the engine would reject.

### Admin write-path auth (scoped prerequisite)

The authenticated GCKB mutation routes (`/api/gckb/[entity]/*`) verify the **centralized gateway identity envelope** (`x-identity-envelope`). A browser cannot mint that envelope, and `apiClient` routes only through `/trade-bff`. So wiring the Admin UI's *writes* requires the centralized-auth seam — either a **Next Server Action** that resolves the session principal and calls `gckbService` in-process, or a `/trade-bff/gckb/*` gateway rewrite. This is a deliberate boundary decision (per the repo rule *"auth is centralized — do not hand-roll"*); this module is that path's typed, tested core, ready to plug in.

---

## 6. Seed — the country namespace

`src/server/gckb/seed-data.json` is the single source of truth (shared by the production seed **and** the seed integration test, so they cannot drift). It provisions a real, published global baseline for **10 countries** (India, USA, UAE, Singapore, Japan, Germany, France, UK, Canada, Australia): currencies, customs/commerce authorities, major ports, 6 trade agreements (incl. India–UAE CEPA, India–Australia ECTA, USMCA, EU Customs Union, CPTPP, RCEP) and ~35 policies exercising every engine (taxes, MFN + FTA-preferential tariffs, anti-dumping duty, licenses, certificates, restricted goods, documents, digital-API metadata).

```bash
node scripts/seed-countries.cjs   # or: pnpm seed:countries
```

Idempotent: re-running updates changed records in place (new version + append-only revision) and skips unchanged ones. It writes the same content checksum the GCKB service computes, and runs as the privileged DATABASE_URL role to write `organizationId NULL` baseline rows.

---

## 7. Testing (82 tests, all green)

| File | Kind | Covers |
|------|------|--------|
| `registry-metadata.test.ts` | pure | Every owned entity + all 19 policy types are self-describing; key derivation; Rule-Engine cross-edge. |
| `public-read.integration.test.ts` | PostgreSQL | Published-only + global-baseline-only invariants; profile aggregation. |
| `duty-calculator.test.ts` | pure | HS prefix match, MFN vs FTA-preferential, anti-dumping stacking, tax base, totals. |
| `duty-calculator.integration.test.ts` | PostgreSQL | FTA override + saving; MFN fallback; DRAFT exclusion; unknown country. |
| `fta-compare.integration.test.ts` | PostgreSQL | FTA list/detail (members + preferential lines); country comparison + missing handling. |
| `directories.integration.test.ts` | PostgreSQL | Country-tagged ports/authorities; supranational bodies; draft exclusion. |
| `seed-data.integration.test.ts` | PostgreSQL | The whole dataset imports registry-valid; full portal pipeline end-to-end. |
| `admin-form-model.test.ts` | pure | Schema build, coercion, and the round-trip-validates-against-the-registry guarantee. |

```bash
pnpm test   # vitest run — embedded PostgreSQL is started once for the suite
```

---

## 8. Roadmap

- **Admin UI write path** — wire `admin-form-model` to a Server Action (session principal → `gckbService`) and ship the registry-driven create/edit/publish/version-timeline UI.
- **Diff viewer** — render `gckbService.compareVersions` side-by-side in the admin and on the public version history.
- **Search** — promote keyword/faceted search to OpenSearch when the dataset grows past in-DB scaling (the read layer's filter shape is already search-ready).
- **More jurisdictions** — extend `seed-data.json` toward the GCKB's 250+ country target; the portal and engines scale with the data, not the code.
