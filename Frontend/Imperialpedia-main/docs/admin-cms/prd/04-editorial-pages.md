# 04 — Editorial Pipeline Surfaces (PRD)

> **Section:** Editorial pipeline screens — the human-facing surfaces that drive content from
> `draft` to `published` through the CMS workflow state machine.
> **Scope:** Workflow Queue / Kanban board, My Reviews, Legal Review Queue, Revisions browser
> (visual diff + rollback), and the Editorial Calendar.
> **Authoring lens:** Lead Product Architect + Senior UI/UX Engineer.

This document specifies the *pages* that operationalize the editorial workflow. The **state machine,
transition rules, legal-routing predicates, comment model, and rollback semantics** are the contract;
they are defined in [../04-rbac-and-workflow.md](../04-rbac-and-workflow.md#b-editorial-workflow-8) (section B)
and the workflow-UI reference [14-workflow-ui.md](./14-workflow-ui.md). This PRD does **not** re-derive
the machine — it shows the screens that read and drive it. The canonical store is `cms-service`
(schema `cms`): `cms.cms_contents` (block-based content), `cms.cms_workflows` (one row per content,
`current_state` + actor/timestamp columns), `cms.cms_content_revisions` (immutable `snapshot` JSONB
snapshots, monotonic `revision_number`), `cms.cms_approval_logs` (per-transition log), and the additive
`cms.content_comments` (collaboration). All mutations are RS256-authed and authorized at
`rbac-service /v1/authorize` (deny-overrides). The frontend hides/disables actions from
`GET /v1/me/permissions`; the server is always the authority.

**Grounding note on real vs. additive schema.** The shipped `cms.cms_workflows.current_state` enum is
`draft, pending_review, changes_requested, approved, scheduled, published, archived`; the shipped action
enum (`cms.cms_approval_logs.action`, `transitionSchema`) is
`submit_for_review, approve, request_changes, publish, schedule, unpublish, archive, restore_to_draft`.
The `seo_review` / `legal_review` states, the gate reviewer columns, and `cms.content_comments` are the
**additive** extensions specified in [../04-rbac-and-workflow.md](../04-rbac-and-workflow.md#b1-state-machine)
(§B.1/B.4). This section's pages are written against the *post-extension* machine; where a screen depends
on an additive column it is called out so backend and frontend land together.

**Route reality.** Only `/admin/scheduler` is scaffolded today; the `/admin/editorial/*` routes below are
**new** and must be added to `Frontend/Imperialpedia-main/src/app/admin/`. The Revisions surface reuses the
existing `/admin/content/[slug]/...` segment. The Editorial Calendar **reuses** `/admin/scheduler` (we do
not invent a second calendar route).

**API surface.** The admin UI talks to a thin `/v1/...` editorial BFF (REST envelope
`{ success, data, error, meta:{total,page,limit} }`; dashboard reads via GraphQL BFF). The BFF resolves the
caller's active `websiteId` from JWT `org_id` + site selection and proxies to the website-scoped
`cms-service` routes (`/cms/websites/:websiteId/content/...`). Endpoints are written in their stable `/v1`
form below; the underlying cms-service route is noted once per page.

---

## Workflow Queue / Kanban Board

### Purpose

The editorial command center: every in-flight content item across the pipeline, as a drag-to-transition
Kanban board (and a dense table alternative). It answers "what is in each stage, who holds the ball, what is
breaching SLA, and what can *I* move?" Drag targets are filtered to the transitions the caller is authorized
for, so the board is both a status view and the primary action surface for editors and managing editors.

### Route

`/admin/editorial/queue` (new). Default landing for `editor` rank and above. `View: [ Board ▾ | Table ]`
toggle is persisted in the URL (`?view=board|table`) along with filters (`?category=`, `?mine=1`,
`?type=`, `?assignee=`) so a filtered board is shareable — per the URL-as-state convention.

### Components

- `EditorialBoard` — column-per-state Kanban (`DRAFT`, `PENDING REVIEW`, `CHANGES REQ.`, `SEO REVIEW`,
  `LEGAL REVIEW`, `APPROVED/SCHED.`), virtualized columns for high item counts.
- `WorkflowColumn` — one workflow state; header shows count + SLA-at-risk badge.
- `ContentCard` — title, type chip, author avatar, ball-in-court assignee (`●`), due/SLA chip, legal-flag
  `⚠`, schedule time `🕒`. Drag handle.
- `TransitionDragLayer` — on drag-start, highlights only the columns the caller may transition *this* card
  into (resolved from `GET /v1/me/permissions` + card state); illegal targets dimmed and non-droppable.
- `TransitionConfirmDialog` — appears on drop; required-comment enforcement for `request_changes` and gate
  rejections; `schedule` opens a datetime picker; destructive transitions trigger step-up auth.
- `BoardFilters` — category (scoped), content-type, assignee, "Mine only", text search (proxied to
  `search-service`).
- `BoardTableView` — sortable dense table fallback (same data, same actions via row menu).
- `SlaBadge`, `BallInCourtAvatar`, `BulkTransitionBar` (multi-select in table view).

### Permissions required

Page gate: rank ≥ `editor` (route group). Capabilities consumed:

- `content:read` — view the board. **Editor/SEO Mgr/Legal/Author/Contributor** all see it but filtered to
  their scope: Editor sees assigned categories (scope **S**); Author/Contributor see **own** items only
  (**O**); Legal Reviewer effectively sees only items in `legal_review` (their queue is the dedicated page).
- `content:review` — drag `pending_review → seo_review` (editorial approve) or `→ changes_requested`.
  **Editor (S), Managing Editor, Admin, Super Admin.**
- `content:seo_review` — drag out of `seo_review`. **SEO Manager, Managing Editor, Admin, Super Admin.**
- `content:legal_review` — drag out of `legal_review`. **Legal Reviewer, Admin, Super Admin** only
  (Managing Editor is `🔒` audited break-glass).
- `content:publish` / `content:schedule` — drag `approved → published|scheduled`. **Managing Editor, Admin,
  Super Admin** (Editor only if delegated, scope **S**).
- `content:submit` — Author/Contributor may drag own `draft → pending_review` (and resubmit from
  `changes_requested`).

Scope notes: every list query is category-scoped server-side via ABAC; a card a role cannot act on renders
read-only (no drag handle). The board never shows an action the server would reject — but the server still
re-authorizes every transition (UI is advisory only).

### API endpoints used

- `GET /v1/editorial/queue` — board payload: items grouped by state, with assignee, sla, flags, allowed
  actions per item. Supports `?state=`, `?category=`, `?type=`, `?assignee=`, `?mine=1`, `?page=`, `?limit=`.
  (Backed by cms-service `GET /cms/websites/:websiteId/content/pending` plus a state-grouped list.)
- `POST /v1/content/:id/transition` — body `{ action, notes?, scheduledAt? }`. The single mutation for every
  drag. (cms-service `POST /cms/websites/:websiteId/content/:contentId/workflow/transition`.)
- `POST /v1/content/:id/submit` — convenience alias for `action:submit_for_review`.
- `POST /v1/content/:id/publish` — convenience alias for `action:publish`.
- `GET /v1/me/permissions` — capability list to gate drag targets.
- `GET /v1/editorial/queue/counts` — lightweight per-column counts + SLA-at-risk totals (polled / SSE for
  live badges).

### Database tables affected

- `cms.cms_workflows` (read: state, assignee, scheduled time, reviewer columns; write via transition).
- `cms.cms_contents` (read: title, type, slug, author, category; `status` mirrored by transition service).
- `cms.cms_approval_logs` (insert: one row per transition — `from_state`, `to_state`, `action`, `actor_id`,
  `notes`).
- `cms.cms_content_revisions` (insert: every transition snapshots the block tree in the same DB transaction).
- `cms.content_comments` (insert when a transition carries a required comment, e.g. `request_changes`).
- Emits `content.workflow.transitioned` (and `content.published` on publish) to `baalvion:events`;
  `audit-service` and `notification-service` consume. `search-service` reindexes on publish.

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Editorial Queue        [ Board ▾ | Table ]   Mine ☑   Category: Investing ▾   Type: All ▾   🔍 │
├──────────┬───────────────┬───────────────┬──────────────┬───────────────┬─────────────────────┤
│ DRAFT (4)│ PENDING REV(3)│ CHANGES REQ(2)│ SEO REVIEW(2) │ LEGAL REVIEW(1)│ APPROVED/SCHED.(3)  │
├──────────┼───────────────┼───────────────┼──────────────┼───────────────┼─────────────────────┤
│ ▢ P/E…   │ ▢ ETF basics  │ ▢ Options 101 │ ▢ Inflation  │ ▢ "Best ROI"  │ ▢ Tax-loss…         │
│  A. Rao  │  → M.Khan ●   │  author ↺     │  → SEO ●      │  ⚠ flagged    │  🕒 Jun 7 09:00     │
│ ▢ Bonds… │  SLA 4h ⚠     │ ▢ REIT split  │ ▢ REIT…      │  → Legal ●    │ ▢ Yield curve ✓ready│
│ ▢ Forex… │ ▢ Compound…   │               │              │               │ ▢ CPI explainer     │
│ ▢ Margin │               │               │              │               │                     │
└──────────┴───────────────┴───────────────┴──────────────┴───────────────┴─────────────────────┘
  drag a card → allowed target columns highlight (others dimmed). drop on CHANGES REQ. ⇒ comment required.
```

### Empty / Loading / Error states & edge cases

- **Loading:** skeleton columns with shimmer cards; counts show `—` until `/counts` resolves.
- **Empty (whole board):** "No content in flight. Start a draft →" CTA to `/admin/content/new`. Per-column
  empty: muted "Nothing here".
- **Error:** column-scoped error card with Retry; a failed `/queue` falls back to the table view if cached.
- **Edge — illegal drop:** server returns `403`/`409`; card snaps back, toast names the missing capability or
  state mismatch; optimistic move is rolled back.
- **Edge — concurrent transition (lost update):** card carries the workflow `updated_at`; transition sends
  `If-Unmodified-Since`/version; on `409` the card refreshes and the user is told "moved by {actor}".
- **Edge — legal gate skipped:** items not matching the legal predicate (§B.3) never appear in `LEGAL REVIEW`
  and go `seo_review → approved` directly; the board reflects that automatically.
- **Edge — schedule in the past:** datetime picker blocks past times; backend re-validates.

---

## My Reviews

### Purpose

A focused, single-reviewer worklist: "everything waiting on *me*." It collapses the multi-stage board into the
caller's actionable inbox — items where they are the assigned reviewer/approver — so editors, SEO managers,
and legal reviewers can clear their queue without scanning the whole board. This is the SLA-driving surface.

### Route

`/admin/editorial/reviews` (new). Tabs by gate the caller can act on: `Editorial`, `SEO`, `Legal`
(tabs render only if the caller holds the matching capability). `?tab=` + `?sort=due|age|priority` in URL.

### Components

- `ReviewInbox` — list of `ReviewItem` rows, grouped by due/SLA bucket (`Overdue`, `Today`, `This week`).
- `ReviewItem` — title, type, author, time-in-state, SLA countdown, quick-action buttons (`Approve`,
  `Request changes`, `Reject`) gated by capability.
- `ReviewTabs` — `Editorial | SEO | Legal` (each tab = one gate; hidden if unauthorized).
- `QuickReviewDrawer` — opens content read-view + comment composer + decision buttons without leaving the
  inbox; deep-links to full editor for heavy edits.
- `InlineCommentThread` — `cms.content_comments` thread (block-anchored), with `@mention` autocomplete.
- `BulkApproveBar` — multi-select approve for low-risk batches (Editorial/SEO tabs only; never Legal).
- `SlaCountdown`, `AssigneeReassignMenu` (Managing Editor can reassign ball-in-court).

### Permissions required

Page gate: rank ≥ `editor`. Tab/action gating:

- **Editorial tab** — `content:review`. **Editor (S), Managing Editor, Admin, Super Admin.** Shows items in
  `pending_review` assigned to / in-scope-for the caller.
- **SEO tab** — `content:seo_review`. **SEO Manager, Managing Editor, Admin, Super Admin.** Items in
  `seo_review`.
- **Legal tab** — `content:legal_review`. **Legal Reviewer, Admin, Super Admin** (Managing Editor `🔒`). Items
  in `legal_review` — but the dedicated [Legal Review Queue](#legal-review-queue) is the primary legal
  surface; this tab is a convenience mirror.
- Reassign ball-in-court — `content:review` **plus** rank ≥ `manager` (Managing Editor/Admin).
- Authors/Contributors do **not** see this page (no review capability); their pending items live on the board
  and on their own dashboard.

Scope notes: Editorial tab is category-scoped (**S**); an editor only sees reviews for assigned categories.
Legal/SEO are site-wide for their respective specialist roles.

### API endpoints used

- `GET /v1/editorial/reviews?gate=editorial|seo|legal&sort=&page=&limit=` — the caller's assigned queue for a
  gate (server filters by `assignee_id` / scope / state). (cms-service `GET .../content/pending` with gate +
  assignee filter.)
- `POST /v1/content/:id/transition` — `approve` / `request_changes` (+ required `notes`) / gate `reject`.
- `GET /v1/content/:id/comments` and `POST /v1/content/:id/comments` — review thread.
  (cms-service `.../content/:contentId/comments` — additive route on the additive `content_comments` table.)
- `PATCH /v1/content/:id/workflow/assignee` — reassign ball-in-court (manager+).
- `GET /v1/me/permissions` — which tabs/actions to show.

### Database tables affected

- `cms.cms_workflows` (read state + `assignee_id` + gate reviewer cols; write `*_reviewed_by/at`, `assignee_id`).
- `cms.cms_approval_logs` (insert on each decision).
- `cms.content_comments` (insert review comments / required change-requests).
- `cms.cms_content_revisions` (insert snapshot on approve/reject transitions).
- `cms.cms_contents` (read; `status` mirrored by transition service).

### Empty / Loading / Error states & edge cases

- **Empty:** "Inbox zero — no reviews waiting on you." with a link to the board.
- **Loading:** row skeletons; SLA chips deferred.
- **Error:** banner + Retry; decision buttons disabled until the item reloads.
- **Edge — item moved out from under you:** if another reviewer or a reassignment changed the state, the row
  shows "no longer in your queue" and removes itself on next poll; a stale `approve` returns `409`.
- **Edge — required comment missing:** `request_changes`/`reject` buttons stay disabled until the comment
  field is non-empty (mirrors server validation).
- **Edge — Legal bulk:** bulk approve is disabled on the Legal tab by design (each legal decision is
  individually non-repudiable).

---

## Legal Review Queue

### Purpose

The compliance gate for financially sensitive content. Imperialpedia publishes financial information, so a
narrow **Legal Reviewer** role (and Admin) adjudicate items routed into `legal_review` by the legal predicate
(§B.3: `financial_term|guide|tutorial` with a `finmath`/`formula` block, compliance-lexicon matches, non-empty
`custom_fields.disclosures`, or a manual "needs legal" flag). This is a deliberately **restricted** surface:
the Legal Reviewer sees *only this queue plus read-only content* — no board, no editor, no publish.

### Route

`/admin/editorial/legal` (new). **Legal Reviewer + Admin (+ Super Admin) only** — hard route gate; everyone
else 403s out of the route group. Managing Editor reaches it only via audited break-glass.

### Components

- `LegalQueue` — list of items in `legal_review`, sorted by oldest-in-state (compliance SLA first).
- `LegalQueueItem` — title, type, **trigger reason** chip (which predicate routed it: `formula block`,
  `lexicon: "guaranteed return"`, `disclosures present`, `manual flag`), age-in-state, author.
- `LegalReadView` — read-only rendered content with compliance-relevant blocks (finmath/formula, disclosures,
  flagged prose) **highlighted**; no edit affordances.
- `DisclosureChecklist` — enforces the standardized "not financial advice" disclosure block is present before
  approve (blocks approval for the predicate categories if missing).
- `LegalDecisionBar` — `Approve (→ approved)` / `Reject (→ changes_requested, comment required)` with step-up
  auth; reason categories captured into `cms_approval_logs.metadata`.
- `LegalCommentThread` — `cms.content_comments` with `kind=approval|rejection`; cites the offending block.

### Permissions required

Page gate: capability `content:legal_review` **and** the role is Legal Reviewer, Admin, or Super Admin.

- `content:legal_review` — approve/reject legal gate. **Legal Reviewer (narrow grant), Admin, Super Admin.**
  Managing Editor is `🔒` (break-glass, step-up + audited) and must not be a routine path.
- `content:read` — read-only content view (Legal Reviewer's grant is read + legal-decide only; **no**
  `content:edit.any`, **no** `content:publish`, **no** media/taxonomy).
- Author/Contributor/Editor/SEO Manager: **denied** (not in queue; route 403). Editors see legal items only as
  read-only cards on the board.

Scope notes: Legal Reviewer is intentionally the most constrained writer in the system — it can change *only*
the legal gate outcome. All other write capabilities are absent from its grant set.

### API endpoints used

- `GET /v1/editorial/legal?sort=age&page=&limit=` — items in `legal_review` with trigger-reason metadata.
  (cms-service `GET .../content/pending?state=legal_review`.)
- `GET /v1/content/:id` — read-only content + blocks for the read view.
- `POST /v1/content/:id/transition` — `approve` (`legal_review → approved`) or `reject`
  (`legal_review → changes_requested`, `notes` required). Sets `legal_reviewed_by/at`.
- `GET /v1/content/:id/comments`, `POST /v1/content/:id/comments`.
- `GET /v1/me/permissions` — confirm legal capability before render.

### Database tables affected

- `cms.cms_workflows` (read `current_state=legal_review`; write `legal_reviewed_by`, `legal_reviewed_at`,
  `current_state`).
- `cms.cms_approval_logs` (insert: `approve` or `reject` with `metadata.trigger_reason`,
  `metadata.reason_category`).
- `cms.content_comments` (insert legal `approval`/`rejection` notes).
- `cms.cms_contents` (read; `custom_fields.disclosures` consulted for the disclosure checklist; `status`
  mirrored).
- `cms.cms_content_revisions` (insert snapshot on the legal transition).

### Wireframe

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│  Legal Review Queue           (Legal Reviewer · Admin only)        Sort: Oldest ▾   ⚠ 3 │
├──────────────────────────────┬────────────────────────────────────────────────────────┤
│  QUEUE                        │  "Best ROI funds 2026"   guide · 2d 4h in legal review  │
│  ▸ "Best ROI funds…" ⚠ 2d4h   │  Trigger: lexicon "guaranteed return" · formula block    │
│    lexicon · formula          │  ┌──────────────────────────────────────────────────┐  │
│  ▸ Crypto tax guide   1d1h    │  │ …prose with “guaranteed return” HIGHLIGHTED…     │  │
│    disclosures present        │  │ [ Disclosure: NOT FINANCIAL ADVICE ]  ✗ missing  │  │
│  ▸ Margin tutorial    3h      │  └──────────────────────────────────────────────────┘  │
│    manual flag                │  Disclosure block required → Approve disabled            │
│                               │  [ Reject (comment) ]            [ Approve ]  (step-up)  │
└──────────────────────────────┴────────────────────────────────────────────────────────┘
```

### Empty / Loading / Error states & edge cases

- **Empty:** "No items awaiting legal review." (the desired steady state).
- **Loading:** queue skeleton + read-view placeholder.
- **Error:** banner + Retry; decision bar disabled until item loads.
- **Edge — disclosure missing:** Approve is hard-disabled for predicate categories until the standardized
  disclosure block exists; server re-enforces at publish.
- **Edge — content edited after routing:** if the author edits and resubmits, the item leaves the legal queue
  (back through review); a stale legal `approve` returns `409`.
- **Edge — break-glass by Managing Editor:** allowed only with step-up auth; the action is tagged
  `metadata.break_glass=true` and emits a high-severity audit event.

---

## Revisions Browser, Visual Diff & Rollback

### Purpose

The full version history of a single content item with a block-level visual diff between any two revisions and
a forward-only rollback. Every transition and meaningful save writes an immutable `snapshot` to
`cms.cms_content_revisions`; this surface lets editors compare, understand "what changed and who changed it,"
and restore a prior state **without** destroying history (restore creates a *new* revision).

### Routes

- `/admin/content/[slug]/revisions` (new, reuses the existing `/admin/content/[slug]/...` segment) — the
  per-content history for the content being edited; deep-linked from the editor and from cards.
- `/admin/editorial/revisions` (new) — a cross-content revisions browser (search by content, author,
  date-range; jump into a specific item's history). Convenience entry; the per-content route is canonical.

### Components

- `RevisionTimeline` — vertical list of `RevisionEntry` (revision_number, author, change_note, timestamp,
  the transition that produced it, "current" marker).
- `RevisionEntry` — selectable for A/B diff; shows actor + `change_note` + state label.
- `DiffViewer` — two-column block diff: added blocks (green), removed (red), changed (amber) with
  **word-level prose diff** inside paragraphs; collapses unchanged runs.
- `DiffControls` — pick base/target revisions, swap, "compare to current", show-unchanged toggle.
- `RollbackButton` — restore the selected revision; opens `RollbackConfirmDialog`.
- `RollbackConfirmDialog` — explains that restore creates a new revision; for a *published* item, warns it
  re-enters the workflow at `approved` (re-publish) unless emergency takedown (Admin → straight to
  `archived`). Step-up auth for published rollbacks.
- `RevisionMetaPanel` — diff stats (blocks added/removed/changed, words changed).

### Permissions required

Page gate: rank ≥ `editor` (view history/diff). Action gating:

- `content:read` — view timeline + diff. **Editor (S), SEO Mgr, Managing Editor, Admin, Super Admin**;
  Author/Contributor on **own** content (**O**).
- `content:rollback` — restore a revision. **Editor (S), Managing Editor, Admin, Super Admin.** Author may roll
  back only **own draft** revisions (**O**, draft-state); Contributor **denied**. SEO Manager **denied**.
- Rollback of a **published** item — rank ≥ `manager` (Managing Editor/Admin) because it re-enters publish;
  emergency takedown to `archived` is Admin/Super Admin with step-up.

Scope notes: diff is read-only and category-scoped; the Rollback button is hidden when the caller lacks
`content:rollback` for *this* item's scope/state. Server re-authorizes the restore regardless of UI state.

### API endpoints used

- `GET /v1/content/:id/revisions?page=&limit=` — paginated history (newest first).
  (cms-service `GET /cms/websites/:websiteId/content/:contentId/revisions`.)
- `GET /v1/content/:id/revisions/:revisionId` — single `snapshot` for one side of the diff.
- `GET /v1/content/:id/revisions/diff?base=&target=` — server-computed block/word diff (or computed client-side
  from two `snapshot` fetches; server-side preferred for large trees).
- `POST /v1/content/:id/rollback` → maps to cms-service
  `POST /cms/websites/:websiteId/content/:contentId/revisions/:revisionId/restore` — creates a **new** revision
  from the chosen one (forward-only; history immutable). Body may carry `{ revisionId, mode:'reedit'|'takedown' }`.

### Database tables affected

- `cms.cms_content_revisions` (read all; **insert** a new snapshot on restore — never update/delete).
- `cms.cms_contents` (write: block tree + `revision_count`++ + `last_edited_by` on restore; `status` may move
  to `approved` or `archived` via the accompanying transition).
- `cms.cms_workflows` (write: published-item rollback re-enters at `approved`, or `archived` for takedown).
- `cms.cms_approval_logs` (insert: rollback recorded as `restore_to_draft`/restore action with
  `metadata.restored_from_revision`).
- Emits `content.rolled_back` (and `content.published`/`content.archived` if state changes) to
  `baalvion:events`.

### Wireframe

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│  "Compound interest explained"  ·  Revision history            base #12 ▾   ⇄   #15 ▾   │
├───────────────────────┬─────────────────────────────────────────────────────────────────┤
│  HISTORY              │  DIFF  #12 → #15        +3 blocks  −1 block  ~2 changed  · 84 words│
│  ● #15 (current)      │  ┌───────────────────────────┬───────────────────────────────┐   │
│    M.Khan · publish   │  │ #12                       │ #15                           │   │
│  ○ #14 R.Patel save   │  │ The rate is fixed…        │ The rate is ~variable~ …      │   │
│  ○ #13 R.Patel submit │  │ [removed: legacy table]   │                               │   │
│  ○ #12 A.Rao approve  │  │                           │ [added: example block ✚]      │   │
│  …                    │  └───────────────────────────┴───────────────────────────────┘   │
│                       │  [ Restore #12 ]  (creates new revision · published ⇒ re-publish) │
└───────────────────────┴─────────────────────────────────────────────────────────────────┘
```

### Empty / Loading / Error states & edge cases

- **Empty:** a brand-new content with only revision #1 shows "No prior revisions to compare yet."
- **Loading:** timeline skeleton; diff pane "Select two revisions to compare."
- **Error:** per-pane error + Retry; rollback disabled until both snapshots load.
- **Edge — huge block tree:** diff is server-computed and paginated by block; client falls back to "summary
  only" if the payload exceeds a size budget.
- **Edge — rollback of published:** explicit warning + step-up; restore re-enters `approved` (re-publish),
  not a silent live swap.
- **Edge — autosave noise:** lightweight autosave revisions are visually de-emphasized and prunable (keep last
  K + all transition revisions) so the timeline stays readable.
- **Edge — concurrent edit:** restoring while someone else edits triggers a `409`; user is told to refresh.

---

## Editorial Calendar

### Purpose

The time-based planning view: scheduled publishes and in-flight items on a calendar, with ball-in-court and
due dates, so the Managing Editor owns the publishing pipeline at a glance. It complements the board (state
view) with a **when** view — what goes live today/this week, what is at risk, and where the gaps are.

### Route

`/admin/scheduler` (**reuse** the existing scaffolded route — we do not invent a second calendar). The
editorial calendar is the primary content of this page; `?view=month|week|agenda` and `?category=` in URL.

### Components

- `EditorialCalendar` — month/week/agenda grid of `CalendarItem`s positioned by `scheduled_publish_at`
  (scheduled) or due date (in-flight).
- `CalendarItem` — title, type chip, state color, ball-in-court avatar, `🕒` schedule time, `⚠` SLA/at-risk.
- `CalendarToolbar` — view switch, today, category filter, "show in-flight" toggle, "show scheduled" toggle.
- `ScheduleDrawer` — click a slot/item to set/adjust `scheduled_publish_at` (creates/updates the BullMQ
  schedule job via the transition `schedule` action); reschedule = drag the item to a new slot.
- `DueDateLane` (agenda view) — overdue / today / upcoming buckets with ball-in-court.
- `UpcomingPublishList` — sidebar list of the next N scheduled items with quick "publish now" / "unschedule".
- `ConflictBadge` — flags two items scheduled into the same high-traffic window (advisory).

### Permissions required

Page gate: rank ≥ `editor` (view). Action gating:

- `content:read` — view the calendar. **Editor (S, own categories), SEO Mgr, Managing Editor, Admin,
  Super Admin**; Author/Contributor see **own** scheduled/in-flight items (**O**).
- `content:schedule` — set/adjust a schedule (drag-to-reschedule, ScheduleDrawer). **Managing Editor, Admin,
  Super Admin** (Editor if delegated, scope **S**).
- `content:publish` — "publish now" from the calendar. **Managing Editor, Admin, Super Admin.**
- Unschedule / cancel — `content:schedule`; cancels the queued job.

Scope notes: the calendar is category-scoped for editors; Managing Editor/Admin see the whole site. Scheduling
controls are hidden for roles without `content:schedule` (read-only calendar).

### API endpoints used

- `GET /v1/editorial/calendar?from=&to=&view=&category=` — scheduled + in-flight items in a date range with
  ball-in-court + due/SLA. (Composes cms-service `GET .../content?status=scheduled` + the `pending` queue;
  dashboard-style read may go through the GraphQL BFF.)
- `POST /v1/content/:id/transition` — `action:schedule` (with `scheduledAt`) to set/reschedule;
  `action:publish` for publish-now; unschedule via re-transition. (cms-service workflow transition; the
  controller enqueues/cancels the BullMQ `schedule_job_id`.)
- `GET /v1/editorial/queue/counts` — at-risk/overdue totals for toolbar badges.
- `GET /v1/me/permissions`.

### Database tables affected

- `cms.cms_workflows` (read `current_state`, `scheduled_publish_at`, `schedule_job_id`, `assignee_id`; write on
  schedule/reschedule/publish/unschedule).
- `cms.cms_contents` (read title/type/category/author; `status` + `scheduled_at` mirrored by the transition
  service).
- `cms.cms_approval_logs` (insert: `schedule` / `publish` / unschedule transitions).
- `cms.cms_content_revisions` (insert snapshot on publish).
- BullMQ scheduler queue (out-of-DB: `schedule_job_id` job enqueued/cancelled; not a `cms` table).
- Emits `content.scheduled` / `content.published` to `baalvion:events`.

### Empty / Loading / Error states & edge cases

- **Empty:** "Nothing scheduled or in flight in this range." with a CTA to the queue.
- **Loading:** calendar grid skeleton; sidebar list shimmer.
- **Error:** banner + Retry; drag-to-reschedule disabled until reload.
- **Edge — reschedule conflict:** dragging into a past slot is blocked; backend re-validates `scheduledAt`.
- **Edge — schedule job drift:** if `schedule_job_id` is missing/stale (queue restarted), the item shows a
  "schedule needs re-confirm" badge; re-saving the schedule re-enqueues.
- **Edge — publish-now on a scheduled item:** cancels the queued job and publishes immediately; calendar
  removes the future slot.
- **Edge — timezone:** all times shown in the admin's locale TZ but stored/queued in UTC; the drawer states
  the TZ explicitly to avoid off-by-one scheduling.

---

## Cross-references

- State machine, transition table, legal predicate, comment model, rollback semantics, and the additive
  schema (`seo_review`/`legal_review` states, gate reviewer columns, `content_comments`):
  [../04-rbac-and-workflow.md](../04-rbac-and-workflow.md#b-editorial-workflow-8) (§B).
- Full workflow-UI behavior reference (drag rules, dialogs, suggestion mode):
  [14-workflow-ui.md](./14-workflow-ui.md).
- Content types, block editor, and the editor surfaces these pages deep-link into:
  [../02-content-cms.md](../02-content-cms.md).
- Permission matrix + enforcement (defense in depth, `GET /me/permissions`):
  [../04-rbac-and-workflow.md](../04-rbac-and-workflow.md#a2-permission-matrix) (§A.2–A.4).
- Audit (WORM hash-chain) and notification fan-out consumed by every transition:
  [../06-security-database-api.md](../06-security-database-api.md).
```

