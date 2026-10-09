# community-service — RBAC & Auth Contract

Canonical auth from day one: this service verifies **only** canonical RS256 tokens
issued by `auth-service`, via `@baalvion/auth-node`'s One True Verifier — the same
pattern as `jobs-service`/`about-service`/`ir-service`. No local JWT issuance, no
HS256, no legacy scalar `role`/`id`/`orgId` tokens.

## Token verification
- Algorithm: **RS256 only**.
- Issuer: `baalvion-auth` (`JWT_ISSUER`)
- Audience: `baalvion-platform` (`JWT_AUDIENCE`)
- Key: `JWT_PUBLIC_KEY` (PEM) as `staticPublicKey`; rotation via `BAALVION_JWKS_URI` / `JWKS_URI`.
- Entry point: `createAuthMiddleware` in `middleware/authMiddleware.js`.

## Claim mapping (canonical token → request)
| JWT claim | `req.auth`  |
|-----------|-------------|
| `sub`     | `userId`    |
| `org_id`  | `orgId`     |
| `sid`     | `sessionId` |
| `roles[]` | `roles`     |
| `permissions[]` | `permissions` |

## Community-scoped authorization (this service's own model)

Platform roles (`req.auth.roles`) gate nothing about forum content directly — they
only grant the platform-wide `super_admin`/`platform_admin` bypass used by the admin
console. All per-community access is decided from **this service's own**
`community_memberships` table, resolved fresh on every authenticated request (not
embedded in the JWT, since membership can change independently of token lifetime):

- `authMiddleware` verifies the token, then loads every `community_memberships` row
  for `req.auth.userId` into `req.communityRoles: { [communitySlug]: { role, status, tier } }`.
- `requireCommunityRole(minRole)` (route-level guard) checks `req.communityRoles[slug]`
  against the community's `role` hierarchy: `member < moderator < admin`.
- `requirePlatformAdmin` bypasses per-community checks entirely for `super_admin` /
  `platform_admin` roles carried in the RS256 token — mirrors the jobs-service
  `PLATFORM_ADMIN_ROLES` bypass pattern.

NodeBB access (read/post on the actual category) is a **separate, downstream**
authorization surface: this service's membership approval is what triggers a grant/
revoke call to NodeBB's Write API (`service/nodebbClient.js`) so NodeBB's own group
privileges reflect this service's decision. NodeBB is never the source of truth for
who is allowed to join or moderate a community — this service is.

## Rejected tokens (→ 401/403)
Same rejection set as every other canonical-auth ecosystem service: HS256 tokens,
legacy `id`/`orgId`/`sessionId` claims, missing/expired/invalid-signature tokens,
wrong `iss`/`aud`.

## Nightlife, Locals, Staffing, Bounty, Education and KYC modules

All routes below are mounted under `/community` (`/v1` and `/api/v1`). "Admin" means
`requirePlatformAdmin` (`super_admin` / `platform_admin` in the RS256 token); "auth" means any
valid session; "public" needs no token.

| Area | Public | Auth (own data / eligible users) | Admin |
|---|---|---|---|
| Clubs, events, bookings (`/nightlife/*`) | list/view clubs, events, stats; guest-list and VIP requests (token optional) | `bookings/mine` | clubs, events, bookings CRUD (`/admin/nightlife/*`), `/admin/overview` |
| Locals (`/nightlife/locals`) | list/view listings | apply, `applications/mine` | listings + applications review |
| Staffing (`/nightlife/gigs`, `profile`, `employer`, `candidates`) | open gigs board | own profile/employer; **verified employer** only: post gigs, directory, WhatsApp reveal (logged, 100/day); **verified candidate** only: apply | verify/reject profiles and employers, remove gigs |
| Bounty (`/bounty/*`) | none (task targets are not public) | accept rules, tasks, reports, own chat thread (20 msgs/min) | tasks, report review, all threads |
| Education (`/edu/*`) | active teachers, upcoming sessions | apply as teacher; **active teacher**: sessions, enrollment decisions; students: request, cancel, review (after a finished approved session) | approve/reject/suspend teachers, cancel sessions |
| KYC (`/kyc`, `/admin/kyc`) | none | submit (5/hour/user), own status | list cases, open documents (**logged**), approve/reject |
| `GET /internal/kyc/:userId` | none | none | none: **internal secret only** (`x-internal-secret`), called by order-service |

Rules worth knowing:
- Ownership is always derived from the token (`req.auth.userId`), never from a body or path id.
- A teacher's meeting link is returned only to that teacher and to students they approved.
- A candidate's WhatsApp number is never in a list response; it is released one profile at a
  time to a verified employer.
- KYC documents are AES-256-GCM encrypted at rest (`KYC_ENCRYPTION_KEY`); the service returns
  503 for KYC without the key. Documents are served `no-store`, `nosniff`, sandboxed CSP.
- Admin "delete" is archive/status-change only; no admin route removes rows.
- All user-supplied links are restricted to http(s) (`validators/httpUrl.js`).
- **Staff tiers** (`middleware/staffAccess.js`). `super` = token role `super_admin`/`platform_admin`;
  `admin` = `country_admin` or granted; `moderator` = granted in `community.staff_members`. `super`
  can never be granted through the API. Routes use `requirePerm(...)`:

  | Permission | super | admin | moderator |
  |---|---|---|---|
  | content.manage (clubs, events, locals, gigs, sessions) | yes | yes | no |
  | content.handle (bookings, applications) | yes | yes | yes |
  | verify.review (profiles, employers, teachers) | yes | yes | yes |
  | support.handle (tickets) | yes | yes | yes |
  | bounty.manage, announce.publish, audit.view, notify.send | yes | yes | no |
  | kyc.review, staff.manage | yes | no | no |

  Grants live at `/admin/staff` (super only; nobody can change their own access).
- **Audit log** (`/admin/audit`, audit.view): `auditAdmin` is mounted once at `/community/admin` and
  records successful writes, KYC document reads and 403 denials (actor, tier, action, target, IP,
  status). It never stores request bodies and there is no edit/delete route.
- **Support** (`/support/tickets*` for members, `/admin/support/tickets*` for staff): members see only
  their own tickets (strangers get 404); 5 new tickets/hour, 10 open at once.
- **Announcements** (`/announcements/active` public, 60 s cache; `/admin/announcements` announce.publish):
  public payload is id/title/body/severity/linkUrl only; links are site paths or https.
- **Staff notify** (`POST /admin/notify`, notify.send, 60/min): on-site link paths only.
- **Notifications** (`/notifications`): each user reads, marks read and deletes only their own feed.
  Email is sent via notification-service (fail-open, escaped HTML, idempotent keys). Venue contact
  emails (`night_clubs.contact_email`) are admin-only fields and never in public responses.
- **Media** (`POST /media`, `GET /media/:id`): images only (JPEG/PNG/WebP, 1 MB, JPEG metadata
  stripped), quotas (12 per member, 500 per admin), 30 uploads/hour. Candidate photos are
  `restricted`: visible only to the owner, site admins and **verified employers**; everything
  else a stranger asks for returns 404. Club and event images are admin-only uploads.
- **Bounty payouts** are a ledger, not a transfer: marking a report paid requires method, amount,
  currency and a transaction reference, and the paid record is final. The site never moves money.
