# 11 — Users & Roles Administration (PRD)

> **Section:** Users & Roles administration for the Imperialpedia Admin Panel.
> **Scope:** the people surface of the admin — Authors, Editors, Moderators, Creators,
> the canonical 8-role registry, per-user detail (sessions / 2FA / `jti` revocation),
> and the invitation lifecycle. Authorization is **always** decided by `rbac-service`
> (`/v1/authorize`, deny-overrides); the frontend only hides/disables what a capability
> list says is unavailable — the server remains the authority. 2FA is **mandatory for
> `editor` rank and above**. This document specifies one page per H2/H3 with concrete
> components, the exact capability strings from the canonical vocabulary, the 8 roles that
> can reach each surface (with scope notes), real REST endpoints, and schema-qualified
> tables. It does **not** restate the role/permission matrix or workflow state machine —
> those live in [04-rbac-and-workflow.md](../04-rbac-and-workflow.md) and are cross-referenced.

**Backing services used throughout this section**

| Service | Base | Role here |
|---|---|---|
| `rbac-service` | `:3005` `/v1` | Role registry, capability bindings, assignments, the PDP (`/authorize`, `/simulate`). |
| `auth-service` | `/v1/auth` | Sessions, MFA/2FA enrollment + verification, invite accept/validate, `/me`. |
| `admin-service` | `/v1/admin` | User roster, user detail, suspend/unsuspend, session revocation, send-verification, impersonation (break-glass). |
| `imperialpedia-service` | `/v1` | Creator profiles + verification queue, author article counts (read projection). |
| `audit-service` | `:3032` | WORM trail; every role grant/revoke, step-up, impersonation, invite is read back here. |
| `notification-service` | `:3031` | Invite emails, role-change notices, 2FA-enforcement nudges. |

**Cross-cutting authorization note (applies to every page below).** Read surfaces under
`/admin/users/*`, `/admin/authors`, `/admin/creators`, `/admin/moderation` require rank
≥ `editor` at the edge. Every **mutation** additionally calls
`POST rbac-service /v1/authorize` with `{subject, action, resource{type,id,scope}}` and
honors returned obligations (`require_mfa`, `limit:own`). `user:manage` / `role:manage`
are bound to **Admin (≤ own rank)** and **Super Admin** only per the §7 matrix — Managing
Editors and below never see write controls on these pages.

---

## Authors — `/admin/authors`

**Purpose.** Operate the verified-contributor registry: author profiles, performance
scorecards (articles, views, reputation, on-time-publish), verification (expert
credentialing), and payout/monetization status for authors enrolled in revenue share.
This is the editorial-org view of people who hold `content:author`; it is **read-mostly**
for editors and **write** only for Admin/Managing-Editor on verification + payout.

**Route.** `/admin/authors` (exists). Author detail opens the shared **User Detail** drawer
(see below) anchored to the author's `user_id`.

**Components.**
- `AuthorRegistryTable` — avatar, name/handle, specialization tags, `article_count`,
  `total_views`, `reputation_score`, verified badge, payout status pill.
- `AuthorScorecardDrawer` — sparkline of published/views over 90d, on-time-publish %,
  open revisions, last-published-at; pulls counts from the read projection.
- `VerificationToggle` — promotes/clears `is_verified` (step-up gated).
- `PayoutStatusCard` — payout method state + last/next payout (read-through to
  monetization; see [05-analytics-monetization-ai.md](../05-analytics-monetization-ai.md#monetization)).
- `ProvisionAuthorButton` → opens **Invitations** flow pre-set to the Author role.
- `SearchBar`, `SpecializationFilter`, `VerifiedFilter`, `EmptyState`, `RowSkeleton`.

**Permissions required.**
- View roster/scorecards: `user:read`, `analytics:view` (for the view/earn metrics).
  Roles: **Super Admin**, **Admin**, **Managing Editor**, **Editor (scope S — only authors
  whose content falls in the editor's assigned categories; scorecard metrics limited to S)**.
- Verify / un-verify an author: `user:manage` + step-up. Roles: **Super Admin**, **Admin**.
- Provision a new author (invite): `user:manage`, `role:manage`. Roles: **Super Admin**, **Admin**.
- Read payout status: `analytics:revenue`. Roles: **Super Admin**, **Admin** only.
- SEO Manager / Legal Reviewer / Author / Contributor / Moderator: **no access** to this admin surface
  (Authors see their own profile via the public/account area, not here).

**API endpoints used.**
- `GET /v1/creators?role=author&page=&limit=` — roster (imperialpedia-service).
- `GET /v1/creators/:id` — profile + aggregates.
- `GET /v1/creators/:id/articles` — published projection for the scorecard.
- `PATCH /v1/creators/:id` — set `is_verified`, specialization, payout metadata (admin).
- `GET /v1/users/:id/roles` (rbac-service) — confirm the author actually holds `content:author`.
- `POST /v1/auth/accept-invite` chain via **Invitations** for provisioning (see below).
- All mutations pre-flighted by `POST /v1/authorize`.

**Database tables affected.**
- `imperialpedia.creator_profiles` (read/update: `is_verified`, `specialization`, `reputation_score`, `meta`).
- `imperialpedia.articles` (read-only projection — `article_count`, `total_views`).
- `rbac.role_assignments` (read — confirm Author grant).
- `audit.audit_logs` (WORM — verification + payout changes).

**Empty / Loading / Error.** Empty = "No authors yet — provision your first contributor."
Loading = table row skeletons + drawer shimmer. Error = inline retry banner; the scorecard
degrades gracefully (shows profile even if the analytics projection 503s). Verification
button shows a spinner and is disabled until `/authorize` returns `allow`.

**Edge cases.** A user can be an Author *and* hold a higher role (e.g. an Editor who also
writes) — show the highest rank but keep the author scorecard. Un-verifying an author does
**not** unpublish their content. Payout fields are hidden (not just disabled) without
`analytics:revenue` to avoid leaking financial data.

```
┌─ Authors / Expert Registry ───────────────────────────── [ + Provision Author ] ┐
│ Search ▢ specialty…   Filter: [ Verified ▾ ] [ Specialization ▾ ]                │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Author              Specialty        Articles  Views   Rep    Verified  Payout    │
│  ◐ E. Vance @econ…   Macro · SEO         120     1.2M   91.4   ✓ expert  ● active  │
│  ◐ J. Wealth @wb…    Investing·Bonds      85     740K   88.0   ✓ expert  ● active  │
│  ◐ S. Crypto @defi…  DeFi · Web3          42     310K   71.2   — pending  ○ none   │
│        └ row click → User Detail drawer (scorecard · sessions · 2FA · roles)       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Editors — `/admin/users/editors`

**Purpose.** Manage the editor roster and — the load-bearing job of this page — assign and
revise each editor's **category scope (S)**. An Editor's authority (review/edit/approve in
[04-rbac-and-workflow.md](../04-rbac-and-workflow.md#a2-permission-matrix)) is meaningless
without a concrete category set; this page is where that ABAC scope is bound on the
`rbac.role_assignments.scope_id`.

**Route.** `/admin/users/editors` (under the existing `/admin/users` group; sibling of the
roster page). Detail opens the **User Detail** drawer.

**Components.**
- `EditorRosterTable` — name, rank badge (Editor / SEO Manager / Managing Editor),
  assigned categories (chips), 2FA status, last active, open review queue depth.
- `CategoryScopeEditor` — multi-select bound to CMS taxonomy; writes scope to the
  assignment. Shows a live "this editor will be able to review N categories" preview.
- `ScopeSimulator` — calls `/v1/simulate` to dry-run "can this editor `content:review`
  category X?" before saving (no decision-log write).
- `AddEditorButton` → **Invitations** pre-set to Editor (forces 2FA enrollment on accept).
- `RoleChangeButton` (promote Editor → Managing Editor) — step-up gated, `≤ own rank`.
- `EmptyState`, `RowSkeleton`, `ScopeDiffConfirm` (shows added/removed categories).

**Permissions required.**
- View roster: `user:read`. Roles: **Super Admin**, **Admin**, **Managing Editor**
  (Managing Editor sees the editorial roster for assignment, read-only on roles).
- Assign / change category scope: `role:manage` (scope-aware). Roles: **Super Admin**,
  **Admin**; **Managing Editor** may set scope **only within the site they own and never
  above editor rank** (obligation `limit:own_site`).
- Promote/demote rank: `role:manage` + `user:manage` + step-up, `≤ own rank`. Roles:
  **Super Admin**, **Admin**.
- Editor / SEO Manager / Author / Contributor / Moderator / Legal Reviewer: **no access**.

**API endpoints used.**
- `GET /v1/admin/users?rank=editor&page=&limit=` — roster (admin-service).
- `GET /v1/users/:userId/roles` and `GET /v1/users/:userId/effective` (rbac-service) — current grants + scope.
- `POST /v1/assignments` `{userId, roleId, scopeType:'organization'|'country', scopeId}` — bind/replace category scope.
- `DELETE /v1/assignments/:id` — remove a scope grant.
- `POST /v1/simulate` — dry-run scope check.
- `POST /v1/authorize` — gate every mutation.
- 2FA enforcement check: `GET /v1/auth/sessions` / MFA status surfaced via User Detail.

**Database tables affected.**
- `rbac.role_assignments` (insert/delete/update — the category `scope_id`).
- `rbac.roles` (read — resolve the Editor/Managing-Editor `role_id` per tenant).
- `rbac.decision_logs` (PDP writes on authorize; simulate does **not** write).
- `identity.users`, `identity.sessions` (read — roster + 2FA/last-active).
- `audit.audit_logs` (WORM — scope changes + promotions).

**Empty / Loading / Error.** Empty = "No editors assigned — invite an editor to start the
review pipeline." Loading = skeleton rows; scope editor shows a category-tree shimmer.
Error on save = optimistic chip update rolls back with a toast; the `ScopeDiffConfirm`
re-opens so no silent partial writes.

**Edge cases.** Removing the **last** category from an editor leaves them rank-`editor`
with empty scope → they can review nothing; surface a warning, not an error. SEO Manager is
an Editor + `seo:*` grant — its category scope governs which content it can SEO-review, so it
appears here too with an "SEO" rank chip. Scope changes take effect on the editor's **next
token refresh**; show "applies within ~N min (token TTL)".

```
┌─ Editors · Category Scope ─────────────────────────────────── [ + Add Editor ] ┐
│  Editor            Rank            Categories (scope S)        2FA   Queue       │
│  M. Khan           Managing Ed.    ALL (site owner)            ✓     —           │
│  A. Rao            Editor          Investing, Bonds, ETFs      ✓     7 pending   │
│  P. Lin            SEO Manager     Investing, Crypto           ✓     2 SEO       │
│      └ select row → [ Edit Scope ]  ▸ ☑ Investing ☑ Bonds ☐ Tax ☐ Crypto …      │
│         Preview: "A. Rao can review 3 categories." [ Simulate ] [ Save scope ]   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Moderators — `/admin/users/moderators`

**Purpose.** Manage the community-moderation roster: who holds `community:moderate` and
over which community scope. Distinct from editors — moderators touch UGC (comments,
debates, posts) and **never** the editorial publish pipeline. This page binds the
moderation scope and links to the moderation work queue at `/admin/moderation`.

**Route.** `/admin/users/moderators`. The actual moderation *work* lives at
`/admin/moderation` (covered in the Community/Moderation section); this page is the **roster
+ scope** admin only.

**Components.**
- `ModeratorRosterTable` — name, community scope (chips), actions-taken (30d), open
  reports assigned, 2FA status, last active.
- `CommunityScopeEditor` — bind moderation scope (e.g. specific forums/topics) to the assignment.
- `AddModeratorButton` → **Invitations** pre-set to Moderator (`member` + `community:moderate`).
- `ModeratorActivityMini` — recent moderation actions sparkline (read from community models).
- `RevokeModeratorButton` — removes the `community:moderate` grant (step-up gated).
- `EmptyState`, `RowSkeleton`.

**Permissions required.**
- View roster: `user:read`. Roles: **Super Admin**, **Admin**, **Managing Editor**.
- Grant / revoke moderator + scope: `role:manage` + `community:moderate` to grant.
  Roles: **Super Admin**, **Admin**.
- A Moderator themselves has `community:moderate` only — **no access** to this admin roster
  page; they work in `/admin/moderation`.
- Editor / SEO Manager / Author / Contributor / Legal Reviewer: **no access**.

**API endpoints used.**
- `GET /v1/admin/users?permission=community:moderate` — roster (admin-service, filtered via rbac effective perms).
- `GET /v1/users/:userId/effective` (rbac-service) — confirm `community:moderate` + scope.
- `POST /v1/assignments` / `DELETE /v1/assignments/:id` — grant/revoke moderator role + community scope.
- `GET /v1/community/...` (imperialpedia-service) — activity counts for the mini-charts.
- `POST /v1/authorize` — gate mutations.

**Database tables affected.**
- `rbac.role_assignments` (insert/delete — moderator grant + community `scope_id`).
- `rbac.role_permissions` (read — confirm `community:moderate` bound to the role).
- `imperialpedia.community_posts`, `imperialpedia.community_debates`, `imperialpedia.votes`,
  `imperialpedia.comments` (read-only — activity metrics).
- `identity.users`, `identity.sessions` (read).
- `audit.audit_logs` (WORM — grant/revoke).

**Empty / Loading / Error.** Empty = "No moderators — community reports route to Admins
until a moderator is assigned." Loading = skeleton rows + chart shimmer. Error on
grant/revoke = toast + rollback; the grant is idempotent (`UNIQUE(user_id, role_id,
scope_id)`) so a retry is safe.

**Edge cases.** A moderator who is **also** an author keeps both grants; this page shows
only the moderation lens. Revoking the last moderator surfaces a banner that reports will
fall back to Admin triage. Scope is community-only — attempting to bind a content category
here is rejected by the scope validator.

---

## Roles — `/admin/roles`

**Purpose.** The control room for the **8 canonical roles**: view each role's capability
bindings per tenant, edit `role_permissions` (with `allow`/`deny` + optional ABAC
constraint), browse the role hierarchy, run the invite flow, and perform **role-change with
step-up auth + full audit**. This is the single most security-sensitive page in the section.

**Route.** `/admin/roles` (exists). Per-role detail at `/admin/roles/[roleKey]` (drawer or
nested route) shows its bound permissions + assignment count.

**Components.**
- `RoleLadderPanel` — the 8 roles rendered on the rank ladder
  (`viewer<member<editor<manager<admin<owner<super_admin`) with the product-role label.
- `CapabilityBindingMatrix` — per-role grid of the **canonical capability vocabulary**
  (content:*, taxonomy:*, glossary:*, seo:*, analytics:*, monetization:*, ai:*, user:*,
  role:manage, audit:view, system:*, community:moderate); each cell is `allow`/`deny`/unset
  with an optional `constraints` editor. Reflects `rbac.role_permissions`.
- `TenantSelector` — roles are per-tenant; switch platform / country / organization tenant.
- `RoleHierarchyTree` — `parent_role_id` inheritance view (read-only render of `/roles/hierarchy`).
- `InviteFlowButton` → **Invitations** with the chosen role + scope pre-bound.
- `RoleChangeDialog` — change a *user's* role; requires **step-up auth** (re-MFA) and writes
  an audit entry; enforces `≤ own rank` (Admin cannot grant admin/owner/super_admin).
- `ConstraintEditor` — JSON-AST condition editor for a binding (e.g. tenant-match), with
  `Simulate` to preview the PDP decision.
- `AuditTrailInline` — last N grants/revokes for the selected role from audit-service.
- `EmptyState`, `Skeleton`, `DenyOverrideHint` (explains deny-overrides resolution).

**Permissions required.**
- View roles + bindings + hierarchy: `role:manage` **or** `audit:view` (read-only).
  Roles: **Super Admin**, **Admin**. Managing Editor and below: **no access** to the role
  registry (they manage *people-into-roles* on the Editors/Moderators pages, not the
  capability bindings themselves).
- Edit a role's capability bindings (`role_permissions`): `role:manage` + step-up.
  Roles: **Super Admin** (any), **Admin** (cannot edit bindings of admin/owner/super_admin —
  `≤ own rank`, enforced server-side by `requireTenantAdmin`).
- Change a user's role: `role:manage` + `user:manage` + **step-up**. Roles: **Super Admin**,
  **Admin (≤ own rank)**.
- Create a non-system custom role: `role:manage`. Roles: **Super Admin**, **Admin**
  (system roles `is_system=true` cannot be deleted/renamed).
- Break-glass (Super Admin bypass): allowed but **🔒 audited** — every action lands in WORM.

**API endpoints used.**
- `GET /v1/roles?tenantId=` and `GET /v1/roles/:id` — role list/detail (rbac-service).
- `GET /v1/roles/hierarchy` — inheritance tree.
- `GET /v1/roles/:roleId/permissions` and `GET /v1/roles/:roleId/permissions/effective` — current + inherited bindings.
- `POST /v1/roles/:roleId/permissions` `{permissionId, effect, constraints}` — attach/override a capability.
- `DELETE /v1/roles/:roleId/permissions/:permissionId` — detach.
- `POST /v1/roles` / `PATCH /v1/roles/:id` / `PUT /v1/roles/:id/parent` — manage custom roles + inheritance.
- `POST /v1/assignments` — change a user's role (the role-change dialog).
- `POST /v1/simulate` — preview a binding/constraint decision (no log).
- `POST /v1/authorize` — gate every mutation; obligations include `require_mfa` → triggers step-up.
- Step-up: `POST /v1/auth/mfa/challenge` → `POST /v1/auth/mfa/verify` before the mutation commits.

**Database tables affected.**
- `rbac.roles` (read/insert/update — custom roles, `parent_role_id`).
- `rbac.permissions` (read — the capability registry the matrix renders).
- `rbac.role_permissions` (insert/delete/update — `effect`, `constraints`).
- `rbac.role_assignments` (insert — role-change dialog).
- `rbac.policies`, `rbac.subject_attributes` (read — for constraint simulation context).
- `rbac.decision_logs` (PDP write on authorize).
- `audit.audit_logs` (WORM — binding edits, role changes, break-glass).

**Empty / Loading / Error.** The 8 system roles always exist (seeded `is_system=true`) so
the ladder is never empty; a fresh **tenant** may have no custom roles → "Only system roles
defined." Loading = matrix skeleton. Error on binding edit = the cell reverts and a toast
explains; if `/authorize` returns `deny` the cell is disabled with a tooltip ("requires
Super Admin"). Step-up cancelled → mutation aborts cleanly, nothing written.

**Edge cases.** Deny-overrides: an explicit `deny` on a parent role beats an `allow` on a
child — the matrix flags conflicting cells. `≤ own rank` is enforced **server-side**
(`requireTenantAdmin` / `requireScopeAdmin`), the UI only mirrors it. Deleting a custom role
that still has assignments is blocked (FK `ON DELETE CASCADE` on assignments is intentional,
but the UI requires explicit "reassign N users first"). SEO Manager / Legal Reviewer are
**Editor + grant** compositions — the matrix shows the base Editor role plus the extra
`seo:*` / `content:legal_review` cells so the composition is legible.

```
┌─ Roles · Capability Bindings ─────────── Tenant: [ Imperialpedia (org) ▾ ] ──────┐
│  RANK LADDER   viewer < member < editor < manager < admin < owner < super_admin   │
│ ┌──────────────┬───────┬───────┬───────┬──────┬───────┬──────┬───────┬─────────┐ │
│ │ Capability   │ S.Adm │ Admin │ M.Ed  │ Edit │ SEO   │ Auth │ Contr │ Mod     │ │
│ ├──────────────┼───────┼───────┼───────┼──────┼───────┼──────┼───────┼─────────┤ │
│ │ content:publish    ✓     ✓      ✓      S†     ✗      ✗      ✗      ✗        │ │
│ │ content:seo_review ✓     ✓      ✓      ✗      ✓      ✗      ✗      ✗        │ │
│ │ content:legal_rev. ✓     ✓      🔒     ✗      ✗      ✗      ✗      ✗        │ │
│ │ community:moderate ✓     ✓      ✓      S      ✗      ✗      ✗      ✓        │ │
│ │ role:manage        ✓   ≤rank    ✗      ✗      ✗      ✗      ✗      ✗        │ │
│ └──────────────┴───────┴───────┴───────┴──────┴───────┴──────┴───────┴─────────┘ │
│  † S = within assigned category scope.  [ Edit binding ] [ Simulate ] [ Audit ]   │
│  ⚠ Changing a user's role requires step-up (re-MFA) and is written to WORM audit. │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Detail — `/admin/users/[userId]`

**Purpose.** The single-user 360: identity, roles + scopes across tenants, **active
sessions** (with device/IP), **2FA status** (enrolled / pending / disabled), and the
controls to **revoke a specific session (`jti`)** or all sessions, suspend/unsuspend, and —
for Super Admin only — break-glass impersonation. This drawer is reused by Authors, Editors,
Moderators, and Roles.

**Route.** `/admin/users/[userId]` (nested under the `/admin/users` group; also surfaced as a
right-side drawer from the roster tables).

**Components.**
- `UserIdentityCard` — name, email (masked unless `user:manage`), status, created/last-login.
- `UserRolesPanel` — all role assignments with tenant + scope; inline "change role" → the
  Roles `RoleChangeDialog` (step-up gated).
- `SessionsTable` — per-session `sid`/`jti`, device, IP, created, last-seen, with
  per-row **Revoke** and a **Revoke all** action.
- `TwoFactorStatusCard` — 2FA state; for `editor`+ shows a **mandatory** badge and, if not
  enrolled, an "enforce now" nudge that emails the user via notification-service.
- `SuspendToggle` — suspend/unsuspend (step-up gated).
- `ImpersonateButton` — **Super Admin only**, break-glass, heavily audited.
- `UserAuditTrail` — this user's recent security events from audit-service.
- `EmptyState`, `Skeleton`, `MaskedField`.

**Permissions required.**
- View detail (roles, sessions, 2FA): `user:read`. Roles: **Super Admin**, **Admin**;
  **Managing Editor** read-only for users in their site scope (no session/role mutation).
- Revoke a session / all sessions: `user:manage`. Roles: **Super Admin**, **Admin (≤ own rank)**.
- Suspend / unsuspend: `user:manage` + step-up. Roles: **Super Admin**, **Admin (≤ own rank)**.
- Change role from here: `role:manage` + `user:manage` + step-up (see Roles page).
- Impersonate: break-glass — **Super Admin only**, `🔒` audited.
- Editor / SEO Manager / Author / Contributor / Moderator / Legal Reviewer: **no access**
  to others' detail; they see only **their own** sessions/2FA via the account area.

**API endpoints used.**
- `GET /v1/admin/users/:userId` — identity + status (admin-service).
- `GET /v1/users/:userId/roles` and `GET /v1/users/:userId/effective` (rbac-service) — roles + effective perms.
- `GET /v1/auth/sessions` (self) / admin session listing surfaced via admin-service user detail.
- `POST /v1/admin/users/:userId/revoke-sessions` — revoke all sessions (`jti` invalidation).
- `DELETE /v1/auth/sessions/:sessionId` — revoke a single session by `sid`.
- `POST /v1/admin/users/:userId/suspend` / `POST /v1/admin/users/:userId/unsuspend`.
- `POST /v1/admin/users/:userId/send-verification` — resend email verification.
- `POST /v1/admin/users/:userId/impersonate` — break-glass (Super Admin).
- 2FA status via `GET /v1/auth/me`; enforcement nudge → notification-service.
- `POST /v1/authorize` + step-up (`/v1/auth/mfa/challenge` → `/verify`) on destructive actions.

**Database tables affected.**
- `identity.users` (read/update — status, suspended flag).
- `identity.sessions` (read/delete — session revocation, `jti`/`sid`).
- `rbac.role_assignments` (read; update on role change).
- `audit.audit_logs` (WORM — revocations, suspends, impersonation, role changes).

**Empty / Loading / Error.** No active sessions → "No active sessions." Loading = card +
table skeletons. Error on revoke = toast + the row stays (no optimistic removal until the
server confirms `jti` is invalidated). Impersonation requires a typed confirmation phrase;
on any `/authorize` deny the button is hidden entirely (not disabled) for non-super-admins.

**Edge cases.** Revoking the **current admin's own** session is allowed but warns "you will
be logged out." A role change here triggers `jti` revocation of the target's existing
sessions (so new scope takes effect immediately, not on TTL). Email is masked for `user:read`
without `user:manage` to limit PII exposure per the §12 security posture.

```
┌─ User · Eleanor Vance ────────────────────────── status: active   2FA: ✓ enrolled ┐
│  Roles                          Sessions                                            │
│  • Author  (org: Imperialpedia) │ sid  device     ip          last-seen   action   │
│  • Editor  (cat: Investing)     │ a91… Chrome/Mac 10.0.2.4    2m ago     [Revoke]  │
│    [ Change role ⤴ step-up ]    │ c02… iOS app    10.0.5.7    1d ago     [Revoke]  │
│                                  │                         [ Revoke ALL sessions ]  │
│  [ Suspend ⤴ step-up ]   [ Resend verification ]   [ Impersonate 🔒 super-admin ]  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Invitations — `/admin/users/invitations`

**Purpose.** Run the **invite → accept → set-password → enforce-2FA** lifecycle. Inviting a
person both creates their identity and binds their role+scope in one flow. For any invite at
**editor rank or above, 2FA enrollment is forced before first publish-capable login** — the
accept flow will not complete to an active session until MFA is enrolled.

**Route.** `/admin/users/invitations` (under the `/admin/users` group). The acceptance UI
itself lives on the public side (`/accept-invite?token=…`) but the **admin management** of
pending/expired invites is here.

**Components.**
- `PendingInvitesTable` — invitee email, role + scope, invited-by, sent-at, expires-at,
  status (pending / accepted / expired / revoked), 2FA-required flag.
- `InviteUserDialog` — email + **role picker (the 8 roles)** + scope (category/community/
  site) + optional message; shows "2FA will be required" when rank ≥ editor.
- `ResendInviteButton`, `RevokeInviteButton`.
- `InviteLinkCopy` — copies the tokenized accept URL (admin convenience).
- `TwoFactorEnforcementBadge` — indicates the invite carries a mandatory-2FA obligation.
- `EmptyState`, `Skeleton`.

**Permissions required.**
- View pending invites: `user:read`. Roles: **Super Admin**, **Admin**, **Managing Editor**
  (Managing Editor may view invites for their site; cannot invite above editor).
- Send an invite (create user + bind role): `user:manage` + `role:manage`, `≤ own rank`.
  Roles: **Super Admin** (any role), **Admin (≤ own rank)**, **Managing Editor** (Author/
  Contributor/Editor within own site only, never admin+).
- Revoke / resend an invite: `user:manage`. Roles: **Super Admin**, **Admin**, **Managing Editor (own)**.
- Editor / SEO Manager / Author / Contributor / Moderator / Legal Reviewer: **no access**.

**API endpoints used.**
- `POST /v1/auth/orgs/:orgId/invite` (auth-service team route) — create the invitation.
- `GET /v1/auth/validate-invite?token=` — accept-page token validation.
- `POST /v1/auth/accept-invite` — set password, create the session.
- `POST /v1/auth/invitations/:token/accept` — alternate accept (team flow).
- `POST /v1/assignments` (rbac-service) — bind role + scope on accept (driven by the invite payload).
- 2FA enforcement on first login: `POST /v1/auth/mfa/enable` → `POST /v1/auth/mfa/verify`
  (required to finish onboarding for editor+).
- `POST /v1/authorize` — gate invite creation/revocation.
- notification-service — sends the invite email + the 2FA-setup reminder.

**Database tables affected.**
- `identity.users` (insert — provisional/invited user).
- `identity.invitations` (insert/update — pending/accepted/expired/revoked; tokenized).
- `rbac.role_assignments` (insert — role+scope bound on accept).
- `audit.audit_logs` (WORM — invite sent / accepted / revoked).

**Empty / Loading / Error.** Empty = "No pending invitations." Loading = table skeleton.
Error on send = inline form error (e.g. "user already exists" → offer "assign role to
existing user" instead). Expired invites are read-only with a one-click **Resend**.

**Edge cases.** Inviting an **existing** user does not duplicate the identity — it adds a
role assignment and (if editor+) verifies their 2FA is enrolled, nudging if not. A revoked
invite invalidates the token immediately (`GET /validate-invite` → 410). The accept flow is
**atomic**: identity + role binding + (for editor+) 2FA gate either all complete or the
session is not issued — no half-provisioned editor without 2FA.

```
┌─ Invitations ───────────────────────────────────────────── [ + Invite user ] ┐
│  Invitee              Role          Scope         Sent     Expires   2FA  State  │
│  amir@ex.com          Editor        Investing     2h ago   in 70h    req  pending│
│  jo@ex.com            Contributor   own           1d ago   in 6d     —    pending│
│  lee@ex.com           SEO Manager   Crypto,ETF    3d ago   expired   req  expired│
│     [ Resend ]  [ Revoke ]                                                        │
│  Invite dialog: email ▢  Role [ Editor ▾ ]  Scope [ Investing ✕ ] ⚠ 2FA required │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Creators — `/admin/creators`

**Purpose.** Operate the public-facing **creator** registry and its **verification queue** —
the imperialpedia-domain identity (display name, bio, avatar, specialization, reputation,
followers) that fronts authors/contributors on the public encyclopedia. Distinct from the
editorial Authors page: Creators is the *engagement/profile* lens with an explicit
verification-request → decide workflow. The verification sub-route already exists at
`/admin/creators/verification`.

**Route.** `/admin/creators` (exists; detail `/admin/creators/[id]`), verification queue at
`/admin/creators/verification` (exists).

**Components.**
- `CreatorGrid` / `CreatorTable` — avatar, display name, specialization, `followers_count`,
  `total_views`, `reputation_score`, verified badge.
- `VerificationQueue` — pending verification requests with evidence/links and **Approve /
  Reject** (writes the decision + reason).
- `CreatorProfileDrawer` — editable display name/bio/avatar/specialization/social links
  (maps to `creator_profiles.meta`); links to the same `user_id` User Detail drawer.
- `ReputationPanel` — read-only reputation + leaderboard rank
  (see [05-analytics-monetization-ai.md](../05-analytics-monetization-ai.md)).
- `VerifyDecisionDialog`, `EmptyState`, `Skeleton`.

**Permissions required.**
- View creators + profiles: `user:read`. Roles: **Super Admin**, **Admin**, **Managing
  Editor**, **Editor (scope S)**.
- Edit a creator profile: `user:manage` **or** the creator editing their **own** profile
  (`O` — own only, via the public account area, not this admin page). Admin override here:
  Roles **Super Admin**, **Admin**.
- Decide verification (approve/reject): `user:manage`. Roles: **Super Admin**, **Admin**,
  **Managing Editor** (editorial trust authority for expert credentialing).
- SEO Manager / Author / Contributor / Moderator / Legal Reviewer: **no admin access**
  (Authors/Contributors manage their **own** creator profile via the account area).

**API endpoints used.**
- `GET /v1/creators?page=&limit=` — registry (imperialpedia-service).
- `GET /v1/creators/:id` and `GET /v1/creators/:id/articles` — profile + content.
- `GET /v1/creators/verifications/pending` — the verification queue.
- `GET /v1/creators/:userId/verification` — a creator's current verification status.
- `POST /v1/creators/:userId/verification/decide` `{decision, reason}` — approve/reject (admin).
- `PATCH /v1/creators/:id` — edit profile / set `is_verified`.
- `POST /v1/authorize` — gate mutations.

**Database tables affected.**
- `imperialpedia.creator_profiles` (read/update — profile, `is_verified`, `meta`, `reputation_score`).
- `imperialpedia.articles` (read — creator article list/counts).
- `imperialpedia.leaderboard_entries` (read — reputation rank).
- `rbac.role_assignments` (read — confirm the creator's platform role).
- `audit.audit_logs` (WORM — verification decisions).

**Empty / Loading / Error.** Empty registry = "No creators yet." Empty queue = "No pending
verifications." Loading = grid/queue skeletons. Error on decide = toast + the request stays
in the queue (decision is idempotent on `user_id`). Verification decision requires a reason
when rejecting.

**Edge cases.** `creator_profiles.user_id` is UNIQUE — a creator maps to exactly one
platform user; approving verification flips `is_verified` and emits a notification.
Verifying a creator is **profile trust**, separate from granting the Author **role** (done on
Authors/Roles pages) — the two can diverge (a verified creator who is not yet an Author).

---

## Cross-section references

- **Permission matrix & enforcement model (defense in depth), workflow state machine:**
  [04-rbac-and-workflow.md](../04-rbac-and-workflow.md).
- **Session policy, 2FA/step-up details, PII masking posture, security settings:**
  [06-security-database-api.md](../06-security-database-api.md).
- **Author/creator earnings, reputation, leaderboard, monetization:**
  [05-analytics-monetization-ai.md](../05-analytics-monetization-ai.md).
- **Audit log viewer surfaces (`/admin/audit`, `/admin/audit-logs`, `/admin/access-logs`):**
  consume the same `audit.audit_logs` WORM trail referenced above.
