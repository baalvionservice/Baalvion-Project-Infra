# Baalvion OS — Firebase → Self-Hosted Backend Migration

**Status:** Phase 0 (foundation) in progress
**Decision record:** Backend = **NestJS full replacement** · Auth = **Keycloak SSO** · Sequencing = **all four apps in parallel**
**Apps in scope:** `brand-connector`, `admin-platform`, `Baalvion-Jobs-Portal`, `Law-Elite-Network`

---

## 1. Why this exists

The four apps above use **Firebase** for three things:
- **Firestore** (document data) — 21 collections in brand-connector, 4 in jobs-portal.
- **Firebase Auth** — login/signup/session across all four (~40 call sites).
- **Firebase Storage** — file uploads in brand-connector (deliverables, portfolio, chat, invoices).

Per the directive: remove Firebase entirely, no split databases, no duplicate auth, one centralized backend.

## 2. Target architecture

```
                          ┌──────────────────────────────────────────┐
   brand-connector  ─┐    │            Keycloak (SSO IdP)              │
   admin-platform   ─┤    │   realm: baalvion · OIDC · RS256 JWKS      │
   jobs-portal      ─┼───▶│   clients: web apps + baalvion-os (API)    │
   law-elite        ─┘    └──────────────────────────────────────────┘
        │  Bearer access token (Keycloak-issued)        ▲
        ▼                                                │ token introspection / JWKS
   ┌──────────────────────────────────────────────────────────────────┐
   │                   Baalvion OS Backend (NestJS)                     │
   │  Modules: auth(keycloak) · users · rbac · jobs · content ·         │
   │           notifications · settings · cms · audit · brand-* …       │
   │  REST (/api/v1)  +  WebSocket gateway (/ws)                        │
   └──────────────────────────────────────────────────────────────────┘
        │ Prisma                 │ Redis pub/sub + adapter        │ S3 SDK
        ▼                        ▼                                ▼
   PostgreSQL (schema "os")   Redis (realtime fan-out)        S3 / MinIO (files)
```

- **Backend:** one NestJS app, modular (one Nest module per Firestore domain).
- **DB:** PostgreSQL, single source of truth. New model lives in its **own schema `os`** so it can run beside the legacy Express service schemas during cut-over, then become canonical.
- **ORM:** Prisma.
- **Auth:** Keycloak issues OIDC tokens; NestJS validates via JWKS (RS256) and maps realm roles → app RBAC. No passwords or sessions stored in app code.
- **Realtime:** `@nestjs/websockets` gateway + Redis adapter (pub/sub) for dashboard/notification/job-update fan-out.
- **Storage:** S3/MinIO via presigned URLs (same pattern already used by the proxy `uploadController`).

## 3. Firestore → PostgreSQL mapping

Documents become rows; sub-collections become child tables with FKs; denormalized arrays become join tables or `jsonb` where structure is fluid.

| Firestore collection | App | → Postgres table (schema `os`) |
|----------------------|-----|--------------------------------|
| `users` | all | `users` (mirrors Keycloak `sub` → `keycloak_id`) |
| (Keycloak realm roles) | all | `roles`, `permissions`, `role_permissions` |
| `jobs` | jobs | `jobs` |
| `candidates` | jobs | `candidates` |
| `applications` / job apps | jobs, brand | `job_applications`, `campaign_applications` |
| content / `articles` | brand/law | `articles` |
| `notifications`, `broadcasts` | all | `notifications`, `broadcasts` |
| settings | all | `settings` |
| CMS pages | admin | `cms_pages` |
| `audit_logs` / `auditLogs` | all | `system_logs` |
| `creators`, `campaigns`, `deliverables`, `conversations`, `messages`, `invites`, `disputes`, `transactions`, `reviews`, `support_tickets`, `system_plans`, `system_plan_history`, `creator_notes`, `dismissed_reminders`, `flagged_content`, `generated_reports`, `portfolioItems` | brand | `creators`, `campaigns`, `deliverables`, `conversations`, `messages`, `invites`, `disputes`, `transactions`, `reviews`, `support_tickets`, `subscription_plans`, `conversations`/`messages`, … (see `prisma/schema.prisma`) |
| Firebase Storage objects | brand | `file_objects` (metadata) + S3/MinIO bucket |

## 4. Frontend cut-over (per app)

Replace each Firebase touch-point with a typed REST/WS client:
- `useCollection(path)` → `useQuery(['<resource>'], () => api.list('<resource>'))` (TanStack Query) hitting `GET /api/v1/<resource>`.
- `useDoc(path)` → `GET /api/v1/<resource>/:id`.
- `addDoc/setDoc/updateDoc/deleteDoc` → `POST/PATCH/DELETE`.
- Firebase Auth (`signInWithEmailAndPassword`, `onAuthStateChanged`, …) → Keycloak via `keycloak-js` / `@react-keycloak`; token attached as `Authorization: Bearer`.
- Firebase Storage uploads → request presigned URL from `POST /api/v1/files/presign`, PUT to S3/MinIO.
- Firestore realtime listeners → WebSocket subscriptions to `/ws` rooms.

Delete: `src/firebase/**`, `firebase`/`firebase-admin` deps, `NEXT_PUBLIC_FIREBASE_*` env.

## 5. Phased execution

- **Phase 0 (now):** this doc · Prisma schema · NestJS scaffold · Keycloak auth guard · reference modules (`users`, `jobs`) · Keycloak+MinIO infra.
- **Phase 1:** stand up infra (Keycloak realm + MinIO bucket), `prisma migrate`, get `/api/v1/jobs` + auth working end-to-end against the DB.
- **Phase 2:** port jobs-portal + law-elite + admin-platform frontends (smaller Firebase surface).
- **Phase 3:** port brand-connector domain (21 collections) module-by-module + realtime + storage.
- **Phase 4:** data backfill (if any real Firestore data exists), remove all Firebase code/deps, decommission overlapping Express services.

## 6. Rules compliance

- **No Firebase in prod:** all `firebase*` deps and `src/firebase/**` removed in Phase 2–4.
- **No split DB:** everything in PostgreSQL schema `os`; legacy per-service schemas folded in as services are retired.
- **No duplicate auth:** Keycloak is the only IdP; the legacy auth-service/proxy JWT are retired once apps move to Keycloak.
- **Centralized backend:** every app talks to Baalvion OS (`/api/v1` + `/ws`).
