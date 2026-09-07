# CanWeMarry — operations, moderation and trust audit

Written before the Prompt 8 changes, from the code rather than from memory. Everything below
was read out of `domain/permissions.js`, `domain/roles.js`, `routes/v1.js` and the services,
or measured against the running system.

## Roles, exactly as they exist

No new global roles were needed. There are five, plus a per-community role that is a
different dimension entirely.

| Role | Permissions | Data access | Actions | Audited |
|---|---|---|---|---|
| **anonymous** | 2 — `case:view`, `resource:view` | Published, non-private cases in summary form; the resource directory | none | n/a |
| **USER** | 13 | Own cases and drafts; cases they participate in or support; communities they belong to | open a case, comment, post, react, report, invite participants | report creation |
| **SUPPORTER** | 14 (+`case:support`) | as USER, plus cases they were accepted to support | offer support | — |
| **VOLUNTEER** | 16 (+`community:create`, `resource:manage`) | as SUPPORTER | host a community, curate resources | — |
| **MODERATOR** | 24 | Every case, including drafts and withheld ones (`case:moderate`) | review reports, hide/lock/remove content, warn, suspend, grant SUPPORTER and VOLUNTEER | every moderation action |
| **ADMIN** | 27 (+`admin:users`, `admin:cases`, `admin:audit`) | as MODERATOR, plus the account list and the audit trail | as MODERATOR, plus appoint MODERATOR and ADMIN | every action |

**Community roles are a separate dimension.** `community_members.role` holds
MEMBER / MODERATOR / ADMIN and grants authority over *one community*. It confers nothing on
the platform: a community administrator has whatever platform role their account holds, and
usually that is USER.

The one asymmetry worth naming: **MODERATOR may grant only SUPPORTER and VOLUNTEER**
(`MODERATOR_GRANTABLE`). Appointing a moderator or an administrator is ADMIN-only.

## What already exists

| Area | Backend | Frontend |
|---|---|---|
| Report queue | `reportService.list` — filters on status and severity; ordered severity-then-age | `/moderation` — a flat list, `status: OPEN` hard-coded, no filters |
| Report detail | `reportService.get` | `/moderation/reports/[id]` |
| Report review | `reportService.review` — status, severity, resolution note | review panel |
| Moderation actions | `moderationService.apply` — 10 actions, written reason required (NOT NULL) | action panel |
| Moderation history | `moderationService.history` — filters on target and actor | `/moderation/history`, `/admin/moderation` |
| User administration | `GET /admin/users`, role grant/revoke | `/admin/users` |
| Audit trail | `auditService.record` / `.list` | `/admin/audit` |
| Case moderation | `GET /admin/cases` | `/admin/cases` |
| Suspension | `moderationService` SUSPEND / UNSUSPEND with `expires_at` | suspend dialog |

**Severity is real, not invented**: `reports.severity` is written at creation —
`URGENT_REASONS` (THREAT_OR_VIOLENCE, SELF_HARM_RISK, COERCION) become `CRITICAL`, everything
else `NORMAL`. Status is OPEN / TRIAGED / ACTIONED / DISMISSED.

## Suspension expiry — measured, not assumed

`middleware/authMiddleware.js`:

```js
if (user.status === 'SUSPENDED' && (!user.suspended_until || user.suspended_until > new Date())) {
    throw forbidden('This account is suspended.');
}
```

So expiry **is** enforced dynamically, on every request, with no background job. An expired
suspension stops blocking access by itself.

But the `status` column still reads `SUSPENDED` after expiry — nothing rewrites it. So the
**stored state and the effective state diverge**, and any screen that lists `status` as the
answer to "is this person suspended?" will be wrong for every expired suspension. That is the
single most important thing this audit found, and the suspension view must report the
effective state, not the column.

## Gaps this prompt closes

- **G1 — no command centre.** `/moderation` is a bare list. Nothing shows queue size, how old
  the oldest waiting report is, how many are critical, who is suspended, or what was recently
  decided. A moderator cannot tell whether the queue is healthy without reading it.
- **G2 — the queue cannot be filtered.** The page hard-codes `status: OPEN`, so a resolved
  report is unreachable and there is no way to look at one reason or one target type.
- **G3 — no suspension view.** Suspensions can be applied and lifted but not *seen*, and the
  expiry divergence above is invisible.
- **G4 — no analytics of any kind.** Nothing answers how the product is doing.
- **G5 — no operational health.** Nothing shows whether Postgres, Redis or the identity
  service is reachable.
- **G6 — `ALLOW_PUBLIC_CASES` is invisible.** It changes what the whole product does and an
  administrator has no way to see its state.

## Rules constraining the work

- Counters and summaries must never carry case titles, participant identities, community
  membership or email addresses. "3 reports require review", never "3 reports about X".
- Analytics are aggregates over the **whole authorized dataset**, computed in SQL. A number
  derived from one page of rows would be a lie about the database.
- No ranking of people. No moderator leaderboards, no top reporters, no most-supported
  anything. Safety is not a competition and participation here is sensitive.
- A feature flag whose value lives in the environment gets a **read-only display**. A toggle
  that does not change backend behaviour is worse than no toggle.
- Nothing gets a global privacy bypass. Staff see cases because `case:moderate` is a stated
  permission with an audit trail, not because "admin".

## What the Prompt 8 pass built

| Gap | Closed by |
|---|---|
| G1 no command centre | `GET /moderation/summary` + `/moderation` — queue size, critical count, oldest waiting, suspensions in force, recent decisions, what is waiting by category. One request, all aggregates. |
| G2 queue could not be filtered | status, severity, reason, target type, unresolved, and four sorts — all mapping to stored columns, all applied in SQL |
| G3 no suspension view | `/moderation/suspensions`, reporting the **effective** state rather than the column |
| G4 no analytics | `GET /admin/analytics` — 26 metrics over five groups, each shipped with its own definition, four windows, UTC |
| G5 no operational health | `GET /admin/health` — real round trips to Postgres, the identity service's JWKS and the notification table |
| G6 `ALLOW_PUBLIC_CASES` invisible | `GET /admin/configuration` — read-only, with where it is actually changed |

Found while testing rather than while reading:

- **The suspend dialog told operators the opposite of the truth.** Its copy read "Nothing lifts
  a suspension automatically — a moderator has to reinstate the account", while the middleware
  has always restored access the moment `suspended_until` passes. Corrected, and the
  suspensions screen now explains the real behaviour: the block lifts, the record does not
  clear.
- **The report payload named the reporter to moderators.** Nothing in the product used it; it
  was being sent because it was in the row. Removed, and replaced on the detail view with
  `reportsOnTarget` — how many separate people flagged something, which is the signal a
  moderator actually wants and identifies nobody.
- **A visually-hidden label widened every admin page.** `.sr-only` is absolutely positioned,
  and with no positioned ancestor inside the horizontally scrolling table its containing block
  was the page — so a 1px span landed at x=454 on a 390px screen. Scroll containers are now
  containing blocks.
- **One `RoleManager` renders per table row, all sharing `id="grant-role"`**, so every role
  select after the first had no label bound to it. Now `useId()`.
- **The suspend dialog re-rendered a formatted `Date.now()`**, so server and client output
  disagreed by a second and React reported a hydration mismatch on every visit.
- **The cleanup script left the queue behind.** Reports, moderation actions and audit rows
  outlive the accounts that made them — `reporter_id` and `actor_id` are left dangling rather
  than nulled or cascaded — so a "cleaned" database still had six reports about content that
  no longer existed, and analytics counted them.
