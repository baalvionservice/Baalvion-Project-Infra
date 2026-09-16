# canwemarry-service

Backend for **CanWeMarry** — community support, constructive discussion and
mediation-oriented help for people facing family or community opposition to their
relationship or marriage.

A bounded context in the Baalvion monorepo (`domain: ecosystem`, `division: community`).
It owns the `canwemarry` Postgres schema and nothing outside it.

## What it is not

Not a dating or matchmaking service, and not a tool for pressuring, exposing or
confronting anyone. Several of the design decisions below only make sense in that light.

## Running it

```bash
cp .env.example .env          # fill in JWT_PUBLIC_KEY and DB_PASSWORD
pnpm install --filter canwemarry-service...
pnpm --filter canwemarry-service run migrate
pnpm --filter canwemarry-service run seed:dev     # optional; creates no people and no cases
pnpm --filter canwemarry-service run dev          # :3070
pnpm --filter canwemarry-service test
```

Requires the platform Postgres (`pnpm run infra:up` from the repo root).

## Layout

| Path | Holds |
|---|---|
| `domain/` | The rules, as pure functions — roles, permissions, case visibility, consent. No database, no Express. |
| `service/` | Business operations. Every one takes an access context and re-checks the record. |
| `controller/` | HTTP shims. They resolve the access context, call a service, serialise. No rules. |
| `routes/v1.js` | The route table, ordered by trust boundary. |
| `validators/` | Zod schemas applied at the edge. |
| `middleware/` | Auth, permission gates, rate limiting, validation, error handling. |
| `models/` | Sequelize definitions. The DDL lives in `migrations/`, never here. |
| `migrations/` | Versioned SQL, applied by `migrate.js`, recorded in `schema_migrations`. |

## Authorization, in two halves

Both are required. Either alone is a bug.

1. **Capability** — `domain/permissions.js` answers "may an actor of this kind do this at
   all". Routes state it with `requirePermission(...)`.
2. **Record** — `domain/visibility.js` answers "may this actor touch *this* case". Services
   apply it before every read and write.

`domain/visibility.js` expresses the visibility rule twice: `scopeWhere()` builds the SQL
predicate for list queries so an unreachable case is never selected, counted or paginated
over; `viewLevel()` answers for one loaded row. `__tests__/visibility.test.js` asserts the
two agree across every combination of visibility, status and moderation state — which is
how the duplication stays honest. It has already caught two real divergences.

## What this service deliberately does not store

- **No credentials, email addresses or phone numbers.** `users.id` is the RS256 subject
  claim minted by `auth-service`; identity stays there. A breach of this schema yields
  nothing that signs in anywhere.
- **No name, contact detail or photograph for a case participant.** `case_participants`
  has a user id and a relation label and no other columns. A person who has not consented
  cannot be identified through this table, because the columns that would identify them do
  not exist.
- **No raw IP addresses.** `audit_logs` stores keyed HMACs, and drops them entirely when
  `AUDIT_HASH_SECRET` is unset rather than writing an unsalted hash.

## Identity subjects are mapped, not adopted

`users.id` is a locally generated UUID; the identity provider's `sub` lives in
`platform_subject`. The service originally used `sub` AS the primary key, on the assumption
it was a UUID — auth-service issues a bigint (`"21"`), so provisioning failed the first time
it was tried against the real stack. Mapping instead of adopting means the subject format can
change without another migration, and a leaked CanWeMarry user id does not identify a
platform account. See `migrations/003_platform_subject.sql`.

Token verification must point at the live JWKS (`BAALVION_JWKS_URI`), not a static key — the
static key in the repo root is not the one auth-service signs with.

## Shareable invitations

`case_invitations` holds a **hash** of the code, never the code itself, and names a RELATION
rather than a person — the same rule as `case_participants`. The raw code is returned exactly
once, at creation. A lost code is withdrawn and replaced, not recovered.

The preview endpoint (`GET /v1/invitations/:token`) is public, because somebody holding a
code has to be able to see what they are being asked to join before signing in. It returns
the relation, the status and the dates — no case id, title, summary or owner, because the
code may have travelled further than its creator intended. An unknown code and a withdrawn
one answer identically.

Accepting requires a session: accepting IS the act of consenting, so it has to be an
identifiable person doing it. Codes are single-use and expire on their own.

## Endpoints added for the web application

- `GET /v1/me` — the caller's product roles and permissions, so the web app knows which
  navigation to render. Answers 200 for anonymous callers with `authenticated: false`.
  A convenience, never a boundary: every route re-checks its own permission.
- `q` + `sort` on `GET /v1/cases` — search is composed INTO the visibility predicate, never
  applied to its results, and LIKE metacharacters are escaped.
- `case_updates` — owner-authored progress notes (`migrations/002_case_updates.sql`).
  Readable by anyone who can read the case; writable only by its owner. Accepted supporters
  are notified.

## Email verification — a documented dependency, not a feature

The identity layer has the whole flow: `auth.users.email_verified_at`, a token minted at
registration, an emailed `/verify-email?token=…` link, and working GET/POST endpoints on
auth-service proxied through the gateway.

**What is missing is the answer reaching this service.** `email_verified` is not among the
13 JWT claims and `/auth/me` does not return it, so a downstream service holding only the
verified token cannot tell a confirmed address from an unconfirmed one. Reading auth's
tables directly would answer it and is not an option — system contract rule C2.

`domain/verification.js` therefore models three states, and UNKNOWN is a real answer rather
than an optimistic one. The policy (which actions should require verification) is written
down and `middleware/requireVerified.js` is ready, but it is applied to no route and
`REQUIRE_EMAIL_VERIFICATION` defaults to off: enforcing on UNKNOWN would either lock every
account out or wave every account through while appearing to check, and the second is worse
than not checking at all. **The UI shows no "Verified" badge**, because there is nothing
truthful to put in one.

Unblocking this needs one change in auth-service: add `email_verified` to the access-token
claims. Nothing here changes when it arrives except the flag.

## Post deletion leaves a tombstone

An author deleting their post overwrites the title and body and sets `deleted_at`, rather
than removing the row. The content is genuinely unrecoverable from the table; what survives
is an addressable id, so a report or moderation record filed about the post still resolves
to something instead of leaving a moderator holding a dangling UUID.

## Consent

An invitation can only be answered by the person invited — not the case owner, not a
moderator, not an administrator. There is no override path anywhere in the service, and
`__tests__/consent.test.js` asserts its absence. Until consent is granted the invitee is
returned to everyone else as a bare relation label with a null user id. Withdrawal is
always available, takes effect immediately and is terminal.

## Contract compliance

Registered at `Backend/catalog/services/canwemarry-service.yaml`; `pnpm run
architecture:check` must pass. Three rules shape the code directly:

- **C1** — one system of record. Postgres only; no cache or projection store.
- **C3 / C6** — `jsonwebtoken` appears nowhere here. Verification is
  `@baalvion/auth-node`'s `createAuthMiddleware`, RS256 only, and this service never signs.
- **C4** — `ingress: internal`. Browsers reach it through the auth-gateway BFF, which is
  registered at `Backend/services/identity/auth-gateway/routes/proxy.js` as `canwemarry`.

Prisma is not used: **C7** confines it to the platform kernel, so persistence here is
Sequelize plus versioned SQL, matching the other seventy services.
