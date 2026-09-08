# CanWeMarry — architecture

A community platform helping people who face family or community opposition to their
relationship or marriage find support, constructive discussion, mediation-oriented help and
trusted resources.

It is **not** a dating or matchmaking service, and **not** a tool for pressuring, exposing
or confronting anyone. Most of what follows only makes sense in that light — the interesting
decisions here are refusals.

## Where it lives, and why

CanWeMarry is a bounded context inside the Baalvion monorepo rather than a standalone app.
Two components:

| Component | Path | Port |
|---|---|---|
| `canwemarry-service` | `Backend/services/ecosystem/canwemarry-service` | 3070 |
| `canwemarry-web` | `Frontend/CanWeMarry-main` | 3071 |

```
browser ──cookie──▶ auth-gateway (BFF) ──Bearer + signed identity──▶ canwemarry-service
                          │                                                │
                     auth-service                                   Postgres schema
                   (RS256, sole issuer)                               `canwemarry`
```

### Divergences from a greenfield stack, and the reasons

The monorepo's [system contract](../Backend/catalog/CONTRACT.md) is executed in CI, so two
defaults were overruled by rules that would otherwise fail the build:

- **Sequelize + versioned SQL, not Prisma.** Rule **C7** confines Prisma to the platform
  kernel. Every other backend service uses Sequelize models with hand-written SQL
  migrations, and this one matches. Enum-valued columns are `TEXT` with a `CHECK`
  constraint rather than a Postgres `ENUM`: these states will gain members, and widening a
  `CHECK` is a one-line migration where widening an `ENUM` is not.
- **`@baalvion/auth-node`, not an application-local auth system.** Rules **C3/C6** permit
  `jsonwebtoken` only inside a fixed allowlist. A second issuer would fail CI, and rightly —
  the platform has one identity authority.

Everything else in the requested stack was already the house standard: Next.js 15,
TypeScript, React 19, Tailwind, PostgreSQL, Zod, Jest, Playwright.

## Layers

```
routes/          trust boundaries, stated per route
  └ middleware/  authenticate → capability gate → validate → rate limit
      └ controller/   resolve access context, call a service, serialise
          └ service/  operations; re-check the record every time
              └ domain/   the rules, as pure functions
                  └ models/  Sequelize; DDL lives in migrations/
```

`domain/` is pure — no database, no Express, no request object. That is what makes the
rules exhaustively testable and reusable by any future client.

## Authentication

The service verifies RS256 tokens through `@baalvion/auth-node`'s `createAuthMiddleware`.
It never signs a token, never sees a password and stores no credential. On first sight of a
verified subject it provisions a local `users` row holding the subject id and nothing else.

Product roles are read from this service's own `user_roles` table, **never from the token**.
Being an administrator of another Baalvion product confers nothing here.

Two gates:

- `requireAuth` — 401 without a verified identity.
- `optionalAuth` — resolves an identity when present, anonymous otherwise, so public reads
  work for visitors. A token that *is* present must still be valid: falling through to
  anonymous would turn an expired session into a silent permission drop rather than a
  visible 401.

In the browser, `createGatewaySession` from `@baalvion/auth-sdk` terminates the session in
HttpOnly cookies. No token reaches JavaScript.

## Authorization

Two halves, both required.

**Capability** — `domain/permissions.js` is the single table of what each role may do.
Nothing outside it decides authorization by inspecting a role name. To know who can review
reports you read one file, not thirty route handlers.

| Role | Beyond the member baseline |
|---|---|
| `USER` | open, edit and delete own cases; post, comment, react, report |
| `SUPPORTER` | offer support on a case |
| `VOLUNTEER` | create communities; curate the resource directory |
| `MODERATOR` | review reports; moderate content; confer supporter/volunteer standing |
| `ADMIN` | everything, including user administration and the audit trail |

An empty role list resolves to the **anonymous** permission set, not `USER` — a token with
no roles claim must not silently gain member rights.

**Record** — `domain/visibility.js` decides whether a specific actor may touch a specific
case. The rule is expressed twice and the two must agree:

- `scopeWhere(ctx)` builds the SQL predicate for list queries. Filtering after the query is
  how counts, pagination and aggregates leak the existence of private cases even when the
  bodies are withheld.
- `viewLevel(ctx, row)` answers for one loaded row and returns how much of it the viewer is
  entitled to: `SUMMARY`, `PARTICIPANT` or `INTERNAL`.

`__tests__/visibility.test.js` interprets the SQL predicate in memory and asserts it agrees
with `viewLevel()` across every combination of visibility, status and moderation state.
That cross-check has already caught two genuine divergences — one where a report acted as a
mute button, one where an invited participant could list a case its owner had not yet
opened.

### Case visibility

| Level | Who can read it |
|---|---|
| `PRIVATE` | the owner, consenting participants, accepted supporters, staff |
| `COMMUNITY` | additionally, active members of the one named community |
| `PUBLIC` | anyone — the summary only, never the detail or who is involved |

A `DRAFT` belongs to nobody but its author. `PUBLIC` is off by default
(`ALLOW_PUBLIC_CASES=false`) on any deployment without moderation capacity to support it.

An unauthorized read returns **404, not 403**. A 403 would confirm that a particular private
case exists, which is exactly what someone hunting for a relative's case would be probing
for.

## Consent

A case is about a relationship, so it necessarily concerns people who never agreed to be
discussed on a website. Two structural consequences:

1. **A participant row holds a user id and a relation label and nothing else.** There is no
   name, contact or free-text column on `case_participants`. A non-consenting person cannot
   be identified through this table even by an operator with database access, because the
   columns that would identify them do not exist. Invitations therefore only address people
   who already have an account and can answer for themselves.
2. **An invitee is invisible until they accept.** Others see a bare relation label — "a
   family member was invited" — with a null user id.

Only the invitee may answer. Not the case owner, not a moderator, not an administrator;
there is no override anywhere in the service, and a test asserts its absence. Consent that
someone else can grant on your behalf is not consent, and an admin override here would be
the most dangerous capability on the platform.

`DECLINED` and `WITHDRAWN` are terminal. Re-inviting would let a determined case owner wear
someone down by repetition.

Offers of support work the same way: an offer is a request, and the owner decides. Nobody
joins a case by pressing a button.

## Safety and privacy

- Privacy defaults are closed: cases start private, profiles start undiscoverable, location
  is hidden.
- Reactions are supportive only — `SUPPORT`, `THANKS`, `HELPFUL`. There is no downvote in
  the schema, and adding one would need a migration and a review.
- Reporting does **not** hide anything. `UNDER_REVIEW` content stays visible; withholding is
  a moderator's decision. Otherwise a report is a mute button over any case someone dislikes.
- Every moderation action requires a written reason (`NOT NULL`) and lands in
  `moderation_actions`. A regime whose decisions cannot be reviewed afterwards is
  indistinguishable from an arbitrary one.
- `audit_logs` records administrative and moderation acts with keyed HMACs of IP and user
  agent — never the raw values, and nothing at all when `AUDIT_HASH_SECRET` is unset, since
  an unsalted IP hash is reversible by brute force over the address space.
- Rate limiting is tiered: reads generous, writes tighter, reporting tightest. A floodable
  report queue is a denial of service against the moderators the safety model depends on.
- Unexpected errors return a bare 500. Driver errors routinely contain table names, column
  names and fragments of the offending row.
- Zod strips unknown keys, so a create call cannot set `moderation_state` or `owner_id` by
  including them.

## Security boundaries

| Boundary | Enforced by |
|---|---|
| PUBLIC | `optionalAuth` + the anonymous permission set + `scopeWhere` |
| AUTHENTICATED | `requireAuth` + `requirePermission` + a record check in the service |
| MODERATOR | `requireStaff` + `requirePermission` |
| ADMIN | `requireAdmin` + `requirePermission` |

A moderator cannot reach user administration or the audit trail, and cannot promote anyone
to `MODERATOR` or `ADMIN` — the moderation tier cannot enlarge itself. All four boundaries
are asserted live in `__tests__/api.authorization.test.js` through the real router.

## Data model

`User`, `Profile`, `UserRole`, `Case`, `CaseParticipant`, `CaseSupporter`, `Community`,
`CommunityMember`, `Post`, `Comment`, `Reaction`, `Notification`, `Report`,
`ModerationAction`, `Resource`, `AuditLog`.

`Role` is modelled as a `CHECK`-constrained assignment in `user_roles` rather than a lookup
table: what each role *grants* lives in `domain/permissions.js`, so authorization cannot be
widened by an `UPDATE`.

Deletion cascades from a case to its participants, supporters and comments. Someone leaving
should not have a discussion of their marriage left behind.

## Future Expo application

`Frontend/CanWeMarry-main/src/lib/api/` is the whole data layer and imports nothing from
Next.js or the DOM. The transport is injected via `configureApi`, so React Native supplies
its own and reuses `client.ts`, `index.ts` and `types.ts` unchanged.

The rules stay on the server. The API returns a `viewLevel` and a projection already
narrowed to what the caller may see; a native client displays what it is given and cannot
widen it by asking differently. When the shared layer is extracted, it becomes a workspace
package that both applications import.

## The web application

Every backend endpoint now has a screen. The layers that carry authorization are unchanged —
the frontend renders what the server sends and never decides access itself.

| Surface | Screens |
|---|---|
| Public | home, about, how it works, case discovery (search / facets / sort / pagination), case detail, communities and community detail, community posts, resources by category, resource detail, member profiles |
| Account | sign in, register, password reset, open a case (5 steps), edit case, my cases, profile, settings, notifications |
| Moderator | report queue, report detail with review + action, action history |
| Administrator | overview with live counts, users with role management, cases, reports, moderation log, audit trail |

Three additions were needed on the backend, each because a required screen had no API:

- `GET /v1/me` — the caller's product roles and permissions, so the shell knows which
  navigation to render. It answers **200 for anonymous callers** with
  `authenticated: false`, because "nobody" is a valid answer to "who am I"; returning 401
  made every anonymous page view log a failed request and trigger a pointless token refresh.
- `q` search and `sort` on `GET /v1/cases` — the search term is composed **into** the
  visibility predicate rather than applied to its results, and LIKE metacharacters are
  escaped. A search that could reach outside the scope would let someone confirm a private
  case exists by probing for words they expect to be in it.
- `case_updates` — owner-authored progress notes, distinct from comments because they are a
  different kind of writing by a different person. Supporters are notified; nobody else is.

### The same-origin proxy, and why it is not a rewrite

The browser only ever talks to the web app's own origin. `/auth-bff/*` is forwarded to the
gateway by a **runtime route handler**, not a `rewrites()` entry, because Next resolves
rewrite destinations at build time and writes them into `routes-manifest.json` — an image
promoted between environments would keep calling the build machine's gateway, and changing
`GATEWAY_ORIGIN` on deploy would silently do nothing.

The route forwards to `GATEWAY_ORIGIN` only. Empty path segments are dropped and each
remaining one is re-encoded before joining, because `/auth-bff//evil.example/x` arrives as
`['', 'evil.example', 'x']` and joining that naively yields a protocol-relative URL, which
`new URL` resolves by **replacing the host** — a server-side request forgery from a route
that holds the visitor's session cookies. The resulting origin is asserted as a second
check, so a later edit to the joining logic cannot quietly reintroduce it.

## Integrating with the real identity stack

Verified end to end against a running `auth-service` (:3001) and `auth-gateway` (:3099),
not a shim. Two things broke on first contact and are worth recording, because both were
invisible to hand-minted test tokens:

**The subject is not a UUID.** `auth-service` issues `sub: "21"` — a bigint. This service's
`users.id` was a `UUID PRIMARY KEY` set from `sub`, so provisioning failed outright. The
local id is now a generated UUID and the provider's subject lives in `platform_subject`
(migration 003). Mapping rather than adopting means the subject format can change without
touching this schema again, and a leaked CanWeMarry id does not identify a platform account.

**The signing key is the service's own.** Verification must point at the live JWKS
(`BAALVION_JWKS_URI=http://localhost:3001/.well-known/jwks.json`); the static key in the
repo root is not the one auth-service signs with.

### Anonymous reads and the gateway allow-list

The gateway guarded all of `/api/*` with `requireSession()` — correct for a product whose
whole surface is private, wrong for one with a public front. The frontend worked around it
by picking an upstream per request: signed-in reads through the gateway, anonymous reads
straight to `canwemarry-service`. That worked, and it left two doors into one service.

The gateway now carries the allow-list instead
(`auth-gateway/middleware/anonymousAllowList.js`), and the frontend has one upstream again.
Three properties make the list safe to have:

- **Reads only.** GET and HEAD. Nothing that changes state is ever anonymous.
- **Exact paths, never prefixes.** `/canwemarry/*` would have published the moderation
  queue and the admin routes the day either was added.
- **A session, when present, is still verified in full.** Authentication becomes optional,
  not absent, so a signed-in reader gets their own view of the same URL.

It is an authentication-ROUTING decision, not an authorization one. Every listed path is
served upstream by a route that resolves its own viewer and applies `scopeWhere`; if that
backend gate were removed, the allow-list would save nothing. A test asserts the invariant
in both directions — no listed path may be mounted with `requireAuth` and its stricter kin,
and the guard names it checks for must still be the ones the route table uses.

### Email verification

`auth-service` signs `email_verified` on every access token and returns it from `/auth/me`;
`@baalvion/auth-node` surfaces it as `req.auth.emailVerified`. The answer therefore arrives
on the token this service already verifies — no extra call, and no reading of auth's tables,
which contract rule C2 forbids.

The line the policy draws is **whether anyone else is affected**. An unverified account may
write, edit and keep drafts indefinitely; it may not put anything in front of another person.
So publishing a case, commenting, supporting, joining a community, posting, accepting an
invitation and reporting are gated, and the rest is not.

Publishing is gated in the service layer rather than on a route, because `create` (with an
explicit status) and `update` (moving the status) are two doors into the same act — a
route-level gate would catch one and miss the other.

UNKNOWN is a real third state: a token issued before the claim existed carries no opinion.
Those are waved through by default rather than locked out, which is a deliberate rollout
choice (`config.security.requireEmailVerification` flips it).

## Shareable invitations

The original flow required the owner to type the invitee's account UUID: safe, unusable.
The replacement is a 16-character code (80 bits over a Crockford-style alphabet, no I/L/O/U)
that the owner shares through whatever channel they already trust.

What makes it safe to hand over:

- **Only a hash is stored.** Same reasoning as a password or an API key — a reader of the
  table cannot use what they find. The raw code is returned exactly once, at creation; a lost
  code is withdrawn and replaced, not recovered.
- **It names a relation, not a person.** `case_invitations` has no email, phone or name
  column, exactly like `case_participants`. The platform learns nothing about the recipient.
- **The preview reveals no case content.** A code-holder sees the relation, the status and
  the dates — never the case id, title, summary or owner, because the code may have travelled
  further than its creator intended. An unknown code answers identically to a withdrawn one,
  so the endpoint cannot be used to discover which codes were ever real.
- **Accepting requires a session.** Accepting IS the act of consenting, so an identifiable
  person has to do it. Codes are single-use, expire on their own, and can be withdrawn.

An accepted invitation cannot be withdrawn retroactively — consent already given is removed
by removing the participant, not by rewriting history.

## What is public, and what "public" means

The product distinguishes two things that are usually conflated:

- **Visible to people who come to the site.** A case its author made public is readable by
  visitors, and appears in the on-site list and search.
- **Findable from outside.** Nothing a member wrote is ever indexed, listed in the sitemap,
  or given Open Graph metadata.

The second is deliberately withheld even for content the first allows, because the threat
model here is a relative searching for someone's name — not a stranger browsing the site.
`robots.ts` allows five platform-authored paths; `sitemap.ts` lists those plus published
resource entries and nothing else; `lib/seo.ts` gives every other page
`noindex, nofollow, noarchive, nosnippet, nocache`, a generic title and no Open Graph tags.

Community member lists show standing and join date, never handles: belonging to a group
about family opposition is itself sensitive, and nobody joined expecting a roster.

There is no service worker. Almost nothing here works without the server, so an offline
shell would be a promise the product cannot keep — and a cache of somebody's case on a
shared device is exactly the disclosure this platform exists around. The manifest keeps
`display: 'browser'` for the same reason: an installed icon on a home screen is the wrong
outcome for a person whose family may pick up their phone.

## Notifications

Every notification's wording is fixed in one catalogue (`service/notificationService.js`),
not written at the call sites, because of where these are read: a notification list is often
the first thing visible when a phone is unlocked, and this platform's users frequently share
a device with the family a case is about.

Two rules follow. No notification names a person, a case, or quotes anything written — the
event functions take an id and nothing else, so there is no route by which a case title
could reach a body. And nothing is emitted merely to pull somebody back: there is no
notification for a reaction, and none for a change the recipient made themselves.

Six events were added in this round: a comment on your case, a reply to your comment, a
reply to your post, an approved join request, a report you filed being reviewed, and a
moderator acting on something you wrote. The last exists because a moderation action a
person is not told about is, from their side, indistinguishable from their writing quietly
vanishing.

The report notification says a moderator looked, and neither which moderator nor what they
decided — the first is somebody's identity, the second concerns another person's account.

## Testing

| Suite | Covers |
|---|---|
| `config.test.js` | schema binding, fail-closed key requirement, closed defaults, and that `users`/`case_participants` carry no credential or identifying columns |
| `permissions.test.js` | the full role/permission matrix, including that an empty role list is anonymous |
| `visibility.test.js` | case visibility, and the SQL-vs-rule cross-check |
| `consent.test.js` | transitions, terminality, who may answer, and exposure before consent |
| `validation.test.js` | mass-assignment stripping, name/contact fields refused on invitations, moderation reasons |
| `api.authorization.test.js` | all four trust boundaries through the real router |

| `search.test.js` | search composed into the visibility scope, LIKE escaping, sort allow-listing |
| `api.flows.test.js` | who-am-I for anonymous and staff, drafts staying drafts, consent with no override, owner-only updates, report escalation, moderator ≠ administrator |

| `invitations.test.js` | hash-only storage, no identifying columns, preview leakage, single use, expiry, revocation, and that the owner cannot redeem their own code |
| `api.prompt3.test.js` | post ownership, community-creation standing, suspension authorization and expiry, reporter-facing report projection, case-reference privacy |

| `verification.test.js` | three-state model, UNKNOWN handled honestly in both directions |
| `api.verification.enforcement.test.js` | the gate mounted on every action that reaches another person, both publish doors, three token states, and four bypass attempts |
| `posts.test.js` | edit/delete authorization, and that a deleted body is overwritten rather than flagged |
| `notifications.test.js` | wording carries no case or comment content; reading is scoped to the owner |

189 tests. Run with `pnpm --filter canwemarry-service test`.

The frontend is verified in a real headless browser rather than by inspection: 17 pages at
8 widths for layout, the same pages for heading order, control naming and focus visibility,
and every route for failing requests and console errors — signed in and signed out.
