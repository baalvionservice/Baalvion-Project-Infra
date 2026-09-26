# Imperialpedia Structured Entities

The encyclopedia's **structured / interactive** data (the non-editorial half of the hybrid
model — see [CMS_INTEGRATION.md](./CMS_INTEGRATION.md)) is owned by **imperialpedia-service**,
not the CMS.

## Backend — imperialpedia-service (`:3004`, schema `imperialpedia`)

A single generic `entities` table backs all knowledge-graph node types
(country / company / industry / technology, extensible to person / university / market):

```
imperialpedia.entities
  id (uuid) · type · name · slug · description · category · country · industry
  · image · tags (jsonb) · attributes (jsonb)   — unique(type, slug)
```

Type-specific fields live in `attributes` and are **flattened back to top level** by the
controller's serializer, so the API returns flat objects matching the frontend
`CompanyEntity` / `CountryEntity` / `IndustryEntity` / `TechnologyEntity` shapes.

**API** ([routes/entitiesRoutes.js](../../../Backend/services/knowledge/imperialpedia-service/routes/entitiesRoutes.js)):

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/entities?type=&search=&country=&industry=&category=&page=&limit=` | public | list |
| GET | `/api/v1/entities/:type/:slug` | public | detail |
| POST | `/api/v1/entities` | admin | upsert by (type, slug) |
| DELETE | `/api/v1/entities/:type/:slug` | admin | delete |

`entities` is created on boot via Sequelize `sync()`. Boot needs `JWT_PUBLIC_KEY` in `.env`
(canonical RS256). Seed a realistic dataset with
[scripts/_seedEntities.cjs](../../../Backend/services/knowledge/imperialpedia-service/scripts/_seedEntities.cjs)
(10 companies / 6 countries / 6 industries / 8 technologies, idempotent upsert).

## Frontend wiring (one injection point)

`src/lib/data/loaders.ts` is the **single** place the list/detail pages load entities.
It now fetches from imperialpedia-service (`load*` → `/entities?type=`, `get*BySlug` →
`/entities/:type/:slug`), server-side, with the bundled `@/data/*` JSON as fallback when the
service is empty/unreachable. No page components changed — they already used the loaders.

```
NEXT_PUBLIC_IMPERIALPEDIA_API_URL=http://localhost:3004/api/v1   # .env.local (has a localhost default)
```

Live & verified (200) from real data: `/companies` + `/companies/[slug]`, `/countries`,
`/industries`, `/technologies` (and their detail pages).

## Run

```
pm2 start <repo>/Backend/services/knowledge/imperialpedia-service/index.js --name imperialpedia-service \
    --cwd <repo>/Backend/services/knowledge/imperialpedia-service
DB_HOST=localhost DB_PORT=5432 DB_NAME=baalvion_db DB_USER=baalvion DB_PASSWORD=baalvion_dev_pass \
    JWT_PUBLIC_KEY=seed-dummy node <svc>/scripts/_seedEntities.cjs   # inline DB env: dotenv is cwd-relative
```

## Reference content as entities — Glossary + Reviews (live)

The generic `entities` table also backs reference content whose frontend types are richer than
the base columns, using the same "full object in `attributes`" trick:

- **Glossary** (`type='term'`): `attributes` = the full `Term` (rich content blocks). Extracted
  from the static `src/lib/data/terms.ts` via `scripts/extract-terms.ts` (tsx) → seeded with
  `scripts/_seedEntitiesFromJson.cjs`. The async pages read it via `src/lib/data/term-live.ts`
  (`fetchTermBySlug` / `fetchTermsByLetter`); the sync `utils.ts` helpers (getTermUrl /
  getRelatedTerms) stay on the identical static slug set. Live: `/terms/[letter]/[slug]` + the
  `terms-beginning-with-*` letter index.
- **Reviews** (`type='review'`): `attributes` = the full `ReviewArticle` (providers, picks,
  comparison rows, FAQs). Extracted via `scripts/extract-reviews.ts`. Resolved by
  `src/lib/data/review-live.ts` (`fetchReviewBySlug`, static registry fallback); the root
  `[slug]` page awaits it before rendering `ReviewLayout`. Live: `/best-online-brokers` etc.
  (NOTE: several source review files have a copy-paste `slug:"best-crypto-exchanges"` bug — the
  canonical slug is the registry KEY, which the extract stamps into the stored copy.)

## Community discussions (live)

`/community/discussions` reads the imperialpedia-service forum (`GET /community/posts`, seeded by
`scripts/_seedCommunity.cjs`) via `communityService.getDiscussions()` (post → `DiscussionNode`,
mock fallback). Bug fixed: the `/community` route was wired to `imperialpediaController` (queried
`status='published'`, which isn't in the `community_posts` enum) → re-pointed to the
model-matching `communityController`. The debate/sentiment/rankings/reputation sub-features stay
on mock (they need dedicated backend models).

## Creators (live)

Expert/creator profiles are served by imperialpedia-service `/creators`. Each row keeps the
lean queryable base columns **and** a `meta` JSONB holding the **full public `CreatorProfile`**
the UI renders — so there's no fidelity loss mapping a lean model onto a rich frontend type.
- Seed: [scripts/_seedCreators.cjs](../../../Backend/services/knowledge/imperialpedia-service/scripts/_seedCreators.cjs) (4 creators; `meta` = full profile).
- Frontend: `src/services/data/creators-service.ts` — `getCreators` / `getCreatorByUsername`
  read `row.meta`; `getTopCreators` + `getLeaderboardData` derive from the live set; mock fallback.
- Live & verified (200): `/creators`, `/creators/leaderboards`.

`creator_profiles` gained a `meta` column via `ALTER TABLE … ADD COLUMN meta jsonb` (the table
predated the field and the service boots with `sync({alter:false})`).

## Next domains (recipe)

**DONE:** companies/countries/industries/technologies · creators + creator-leaderboard ·
glossary (`type='term'`) · reviews (`type='review'`) · community discussions.

Remaining:
- **More entity types** (person / university / market): seed rows with a new `type` and add a
  `load*`/`get*BySlug` pair to `loaders.ts`. No schema change.
- **Admin management UI**: Imperialpedia entity/creator/review CRUD screens in admin-platform
  pointing at `POST/DELETE /entities` + `/creators` (super-admin token bypasses).
- **Community debate/sentiment/rankings/reputation**: need dedicated backend models (debates,
  sentiment votes, predictions, reputation) — a separate build; discussions are already live.
- **Source fix**: 6 `src/data/reviews/*.ts` files have a copy-paste `slug:"best-crypto-exchanges"`;
  harmless today (registry + backend use canonical slugs) but worth correcting at source.
