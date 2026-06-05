# 14 — Editorial Workflow UI & State Machine

> **Scope:** The end-to-end editorial pipeline for `cms.cms_contents` — the state machine,
> transition rules, conditional legal routing, the Kanban + Review UIs, the notification matrix,
> and SLA / ball-in-court ownership.
> **Grounds on:** [04-rbac-and-workflow.md §B](../04-rbac-and-workflow.md) (canonical state machine),
> [02-content-cms.md](../02-content-cms.md) (content model, validation gates),
> [03-seo-and-media.md](../03-seo-and-media.md) (SEO gate), and the **real** cms-service code:
> `service/workflowService.js`, `service/revisionService.js`, `service/auditService.js`,
> `models/cmsWorkflow.js`, `models/cmsApprovalLog.js`, `migrations/20260007-create-cms-workflows.js`.
> **Route:** `/admin/scheduler` (board + calendar) and `/admin/content/[slug]/edit` (review surface).
> **Transition API:** `POST /v1/cms/websites/:websiteId/content/:contentId/workflow/transition`.

This document does **not** re-specify roles (see [04 §A](../04-rbac-and-workflow.md)) or the block editor
(see [02 §D](../02-content-cms.md)). It specifies how content *moves* and what the UI looks like while it does.

---

## A. The state machine

### A.1 States

The existing `cms_workflows.current_state` enum is
`draft, pending_review, changes_requested, approved, scheduled, published, archived`. Per
[04 §B.1](../04-rbac-and-workflow.md), we add **two explicit review-gate states** so the pipeline is
auditable per gate instead of hiding gates inside `pending_review`:

```sql
-- additive (see 04 §B.1); enum on cms_workflows.current_state AND mirrored on cms_contents.status
ALTER TYPE cms.enum_cms_workflows_current_state ADD VALUE IF NOT EXISTS 'seo_review'   AFTER 'pending_review';
ALTER TYPE cms.enum_cms_workflows_current_state ADD VALUE IF NOT EXISTS 'legal_review' AFTER 'seo_review';
```

| State | Meaning | Ball-in-court (default assignee) |
|-------|---------|----------------------------------|
| `draft` | Being written; private to author + scope editors | Author |
| `pending_review` | Submitted; editorial review of substance | assigned Editor (scope) |
| `changes_requested` | Sent back with required changes | Author (loopback) |
| `seo_review` | Editorial-approved; SEO gate | SEO Manager |
| `legal_review` | **Conditional**; compliance gate (see §C) | Legal Reviewer |
| `approved` | All gates cleared; ready to go live | Managing Editor |
| `scheduled` | Approved + future publish time set | system timer (BullMQ) |
| `published` | Live; projected to read model + indexed | — (watchers) |
| `archived` | Unpublished / taken down (410 / redirect) | — |

> `status` on `cms_contents` is kept byte-for-byte in sync with `current_state` by the transition
> service (the same `wfUpdate`/`contentUpdate` pair that already exists in `workflowService.transition`).

### A.2 Diagram (ASCII)

```
                                      ┌──────────────── request_changes (Editor) ─────────────────┐
                                      │                                                            │
                                      ▼                                                            │
  ┌─────────┐  submit   ┌────────────────┐  approve_editorial  ┌────────────┐                     │
  │  DRAFT  │──────────▶│ PENDING_REVIEW │────────────────────▶│ SEO_REVIEW │                     │
  └─────────┘           └────────────────┘   (Editor, scope)   └────────────┘                     │
       ▲                        │                                  │     │                         │
       │                        │ request_changes (Editor)         │     │ seo_reject (SEO Mgr)    │
       │                        ▼                                  │     ▼                         │
       │               ┌──────────────────┐◀─────────────────────┼──── (note required) ───────────┤
       │  resubmit     │ CHANGES_REQUESTED│                       │                                │
       └───────────────│   (loopback)     │                       │ seo_approve (SEO Mgr)          │
        (Author, owner)└──────────────────┘                       │                                │
                                                                  ▼                                │
                            needsLegal == false                   ◇  legal routing decision (§C)   │
                       ┌──────────────────────────────────────────┤                               │
                       │ (gate skipped)            needsLegal==true│                               │
                       ▼                                           ▼                               │
                 ┌────────────┐                            ┌──────────────┐  legal_reject ─────────┘
                 │  APPROVED  │◀── legal_approve (Legal) ──│ LEGAL_REVIEW │   (Admin/Legal, note)
                 └────────────┘                            └──────────────┘
                   │        │
       publish_now │        │ schedule (set scheduled_publish_at + BullMQ job)
    (Managing Ed.) │        ▼
                   │   ┌───────────┐  (timer fires @ scheduled_publish_at)
                   │   │ SCHEDULED │──────────────┐
                   │   └───────────┘              │ unschedule → APPROVED
                   ▼          (system)            ▼
              ┌───────────┐◀───────────────────────
              │ PUBLISHED │
              └───────────┘
                   │  unpublish (Managing Ed./Admin)         rollback (Editor+ scope) — see §D.6 / 04 §B.6
                   ▼
              ┌──────────┐    emergency_takedown (Admin 🔒, step-up) ──▶ ARCHIVED (straight from PUBLISHED)
              │ ARCHIVED │
              └──────────┘
                   │ restore_to_draft (Editor+)
                   └────────────────────────────▶ DRAFT
```

Legend: `◇` = decision node (legal routing, evaluated automatically on `seo_approve`).
`🔒` = audited break-glass action requiring step-up auth ([04 §A.4](../04-rbac-and-workflow.md)).

---

## B. Transitions table

Allowed roles use the **8 canonical roles** from the PRD. Each maps to the existing
`requiredLevel` floor in `workflowService.TRANSITIONS` (`cms_admin:100 / cms_editor:80 /
cms_publisher:70 / cms_reviewer:60 / cms_seo_manager:50 / cms_author:40 / cms_contributor:20`),
**and** to a fine-grained capability checked at the BFF via `rbac-service /v1/authorize`
(deny-overrides; the level floor is a coarse pre-filter, the capability is authoritative).
Capability strings are the canonical vocabulary (see [04 §A.2](../04-rbac-and-workflow.md)).

| # | From | Action | Allowed role(s) | Capability | Guard / precondition | To | Side effects (all in ONE txn unless noted) |
|---|------|--------|-----------------|------------|----------------------|----|--------------------------------------------|
| 1 | `draft` / `changes_requested` | **submit** | Author, Contributor (owner); Editor+ | `content:submit` | Submit-gate passes: ≥1 heading + ≥1 paragraph (FAQ ≥1 Q/A); SEO minimums met ([02 §B.1.5](../02-content-cms.md)); featured image for article/news/encyclopedia; all reference blocks resolve | `pending_review` | revision snapshot; audit `submit_for_review`; set `submitted_by/at`; `assignee_id` ← scope Editor; notify Editor; cache.del |
| 2 | `pending_review` | **request_changes** | Editor (scope), Managing Editor | `content:review` | **note required** (`requiresNote`) | `changes_requested` | audit `request_changes`; set `reviewed_by/at`, `comments`; `assignee_id` ← author; notify author |
| 3 | `pending_review` | **approve_editorial** | Editor (scope), Managing Editor | `content:review` | content gates still valid | `seo_review` | revision snapshot; audit; `assignee_id` ← SEO Manager; notify SEO Manager |
| 4 | `changes_requested` | **resubmit** | Author (owner) | `content:submit` | re-run submit-gate (#1) | `pending_review` | revision snapshot; audit; `assignee_id` ← Editor; notify Editor |
| 5 | `seo_review` | **seo_approve** | SEO Manager | `content:seo_review` | **SEO gate must pass**: meta title 30–60, desc 70–160, exactly 1 H1, alt text on every image, canonical valid, ≥1 internal link ([03](../03-seo-and-media.md)) | `legal_review` *or* `approved` | record `reviewed_for.seo` = ts; **legal routing decision §C**; revision snapshot; audit `approve`(meta `gate:seo`); notify next assignee |
| 6 | `seo_review` | **seo_reject** | SEO Manager | `content:seo_review` | **note required** | `changes_requested` | audit `request_changes`(meta `gate:seo`); `assignee_id` ← author; notify author |
| 7 | `legal_review` | **legal_approve** | Legal Reviewer, Admin | `content:legal_review` | finmath/disclosure blocks present & valid; "not financial advice" disclosure block enforced for financial categories | `approved` | record `legal_reviewed_by/at`, `reviewed_for.legal` = ts; audit `approve`(meta `gate:legal`); `assignee_id` ← Managing Editor; notify Managing Editor |
| 8 | `legal_review` | **legal_reject** | Legal Reviewer, Admin | `content:legal_review` | **note required** | `changes_requested` | audit `request_changes`(meta `gate:legal`); `assignee_id` ← author; notify author + Managing Editor |
| 9 | `approved` | **publish_now** | Managing Editor, Admin | `content:publish` | all `reviewed_for` gates satisfied for the routing profile | `published` | revision snapshot; audit `publish`; set `published_by/at`, `cms_contents.published_at`; **post-commit** (fire-and-forget): emit `content.published`, CDN revalidate, project to `imperialpedia.articles`, search index; notify author + watchers |
| 10 | `approved` | **schedule** | Managing Editor, Admin | `content:schedule` | `scheduledPublishAt` in the future (`requiresScheduledAt`) | `scheduled` | set `scheduled_publish_at`, `cms_contents.scheduled_at`; enqueue BullMQ job → `schedule_job_id`; audit `schedule`; notify author ("goes live at…") |
| 11 | `scheduled` | **unschedule** | Managing Editor, Admin | `content:schedule` | — | `approved` | cancel BullMQ job (clear `schedule_job_id`, `scheduled_publish_at`); audit; notify author |
| 12 | `scheduled` | **(timer)** | system (BullMQ worker) | — | `now ≥ scheduled_publish_at` | `published` | same publish side effects as #9 (#9's post-commit set); actor = `system` |
| 13 | `published` | **unpublish** | Managing Editor, Admin | `content:archive` | — | `archived` | clear `cms_contents.published_at`; audit; **post-commit**: emit `content.unpublished`, 410/redirect handling, de-index; notify author |
| 14 | `published` | **emergency_takedown** 🔒 | Admin (step-up) | `content:archive` | step-up auth ([04 §A.4](../04-rbac-and-workflow.md)) | `archived` | same as #13 + audit flagged `breakGlass:true` |
| 15 | `archived` / `changes_requested` | **restore_to_draft** | Editor+ (scope) | `content:edit.any` | — | `draft` | audit `restore_to_draft`; `assignee_id` ← author |
| 16 | any non-terminal | **rollback** | Editor+ (scope); Author (own, draft only) | `content:rollback` | target revision exists; published rollback re-enters at `approved` (re-publish), not destructive ([04 §B.6](../04-rbac-and-workflow.md)) | (same state) | restore revision as a **new** revision (never destroys history); audit `rollback`(meta `restoredFrom:revNo`) |
| 17 | any | **reassign** | Managing Editor, Admin | `content:review` | new assignee has the capability required by current state | (same state) | set `assignee_id`; audit `reassign`(meta `from/to`); notify new assignee |

**Roles that can NEVER transition prose to live:** SEO Manager (gate only, no `content:publish`),
Legal Reviewer (gate only), Author, Contributor. This matches the matrix in [04 §A.2](../04-rbac-and-workflow.md).

### B.1 Schema additions (additive migration)

Extends `cms_workflows` (per [04 §B.1](../04-rbac-and-workflow.md)) so each gate is independently auditable
and the board can render ball-in-court + SLA:

```sql
ALTER TABLE cms.cms_workflows
  ADD COLUMN IF NOT EXISTS seo_reviewed_by    bigint      NULL,
  ADD COLUMN IF NOT EXISTS seo_reviewed_at    timestamptz NULL,
  ADD COLUMN IF NOT EXISTS legal_reviewed_by  bigint      NULL,
  ADD COLUMN IF NOT EXISTS legal_reviewed_at  timestamptz NULL,
  ADD COLUMN IF NOT EXISTS assignee_id        bigint      NULL,   -- current ball-in-court
  ADD COLUMN IF NOT EXISTS state_entered_at   timestamptz NULL,   -- SLA clock start (set on every transition)
  ADD COLUMN IF NOT EXISTS sla_due_at         timestamptz NULL,   -- derived from per-state SLA policy (§F)
  ADD COLUMN IF NOT EXISTS legal_required     boolean     NOT NULL DEFAULT false; -- frozen at seo_approve (§C)
CREATE INDEX IF NOT EXISTS cms_workflows_assignee  ON cms.cms_workflows (assignee_id, current_state);
CREATE INDEX IF NOT EXISTS cms_workflows_sla_due   ON cms.cms_workflows (sla_due_at) WHERE current_state NOT IN ('published','archived','draft');
```

The `cms_approval_logs.action` enum already includes
`submit_for_review, approve, request_changes, publish, schedule, unpublish, archive, restore_to_draft, autosave`.
We add `reassign` and `rollback`, and use `metadata.gate ∈ {seo, legal}` to disambiguate which gate an
`approve`/`request_changes` belongs to (no enum churn for the gate distinction):

```sql
ALTER TYPE cms.enum_cms_approval_logs_action ADD VALUE IF NOT EXISTS 'reassign';
ALTER TYPE cms.enum_cms_approval_logs_action ADD VALUE IF NOT EXISTS 'rollback';
```

---

## C. Conditional legal-routing logic

Imperialpedia publishes financial information, so legal/compliance review is **conditional but strict**
(matches [04 §B.3](../04-rbac-and-workflow.md)). The decision is computed **server-side at the moment of
`seo_approve`** (transition #5), frozen into `cms_workflows.legal_required`, and never trusted from the client.

```ts
// runs inside the seo_approve transaction, on the locked workflow row
function needsLegalReview(content: CmsContent): boolean {
  const blocks = content.contentBlocks ?? [];
  const cf = content.customFields ?? {};

  // 1) Financial content type carrying a formula/finmath block
  const financialType = ['financial_term', 'guide', 'tutorial', 'encyclopedia'].includes(content.contentType);
  const hasFinMath = blocks.some(b => b.type === 'finmath' || b.type === 'math');
  if (financialType && hasFinMath) return true;

  // 2) Prose matches the compliance lexicon (server-side, case-insensitive, word-boundary)
  const prose = blocks
    .filter(b => ['paragraph', 'heading', 'callout', 'quote'].includes(b.type))
    .map(b => String(b.content?.html ?? b.content?.text ?? ''))
    .join(' ');
  if (COMPLIANCE_LEXICON.test(prose)) return true;   // "guaranteed return", "buy/sell", "tax advice", …

  // 3) Disclosures explicitly attached
  if (Array.isArray(cf.disclosures) && cf.disclosures.length > 0) return true;

  // 4) Editor manual flag ("needs legal")
  if (cf.needsLegal === true) return true;

  return false;
}

// COMPLIANCE_LEXICON — maintained in cms-service config, reviewed by Legal quarterly.
const COMPLIANCE_LEXICON = /\b(guaranteed\s+returns?|risk[-\s]?free|buy\s+now|sell\s+now|insider|
  tax\s+advice|will\s+(?:double|triple)|get\s+rich|assured\s+profit|no\s+risk)\b/i;
```

**Routing outcome at `seo_approve`:**

- `needsLegalReview() === true` → `legal_review` (assignee = Legal Reviewer), `legal_required = true`.
- `needsLegalReview() === false` → `approved` directly (gate skipped), `legal_required = false`.

**Publish-time enforcement (#9 / #12):** for any content whose `content_type` is financial
(`financial_term, guide, tutorial, encyclopedia`) OR whose `legal_required = true`, the publish transition
**hard-blocks** unless a standardized **"not financial advice"** disclosure block is present in
`content_blocks` (the publish guard injects/validates it). Re-deriving `legal_required` is not needed at
publish because it was frozen at SEO approval; but an edit after approval that adds finmath/lexicon hits
**re-opens** the workflow (any `content:edit.*` on an `approved`/`scheduled` item drops it to
`changes_requested`, forcing the gates to re-run — prevents a "clean approval, dirty publish" bypass).

---

## D. UI screens

### D.1 Kanban board (`/admin/scheduler`, View: Board)

Columns are the workflow states (gate states shown explicitly). Cards are draggable; **only the
transitions your role+scope allows are valid drop targets** — the rest are dimmed and reject the drop
with an inline toast. Drop targets are computed from the same capability list returned by
`GET /v1/me/permissions` (server stays authoritative; the BFF re-checks on drop).

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Editorial Workflow      View:[ Board ▾ ]  Mine ☑  Category: Investing ▾  Type: All ▾   🔎 search…   │
├──────────┬───────────────┬──────────────┬─────────────┬──────────────┬────────────┬─────────────────┤
│  DRAFT   │ PENDING REVIEW│ CHANGES REQ. │  SEO REVIEW │ LEGAL REVIEW │  APPROVED  │ SCHEDULED/PUBL. │
│   (4)    │     (3)       │     (2)      │     (2)     │     (1)      │    (3)     │      (5)        │
├──────────┼───────────────┼──────────────┼─────────────┼──────────────┼────────────┼─────────────────┤
│┌────────┐│┌─────────────┐│┌────────────┐│┌───────────┐│┌────────────┐│┌──────────┐│┌───────────────┐│
││P/E ratio││ ETF basics  ││ Options 101││ Inflation ││"Best ROI"  ││Tax-loss…  ││ Yield curve   ││
││Term     ││ Article     ││ Guide      ││ Article   ││⚠ finmath   ││ ✓ ready   ││ 🕒 Jun 7 9:00 ││
││◌ A.Rao  ││ ◉ M.Khan    ││ ↺ author   ││ ◉ SEO:Lee ││ ◉ Legal:Vo ││ ◉ ME:Diaz ││ ◉ system      ││
││ ●draft  ││ SLA 4h ⚠    ││ note ✎     ││ SEO 91 ✓  ││ disclosures││ all gates ││ proj→articles ││
│└────────┘│└─────────────┘│└────────────┘│└───────────┘│└────────────┘│└──────────┘│└───────────────┘│
│┌────────┐│┌─────────────┐│              │┌───────────┐│              │┌──────────┐│┌───────────────┐│
││Bonds…  ││ Compound… ⏰ ││              ││ REIT intro││              ││Dividends ││ Forex 101     ││
││Article ││ SLA breach! ││              ││ SEO 64 ⚠  ││              ││ 🕒 sched ││ ● published   ││
│└────────┘│└─────────────┘│              │└───────────┘│              │└──────────┘│└───────────────┘│
└──────────┴───────────────┴──────────────┴─────────────┴──────────────┴────────────┴─────────────────┘
  drag a card → allowed targets glow; disallowed dim. Card chips: type · assignee · SLA · gate score
  Filters persist as a saved view per user. "Mine" = cards where assignee_id == me OR author == me.
```

Card affordances: avatar = `assignee_id` (ball-in-court); SLA chip (green / `⚠` approaching /
`⏰`/`breach!` red, from `sla_due_at`); a gate-score chip (SEO score, legal-flag badge);
click → opens the Review screen. Drag fires `POST …/workflow/transition` with the inferred `action`
for the source→target pair; an invalid pair returns `WORKFLOW_INVALID_TRANSITION` and the card snaps back.

A **Calendar** sub-view (`View: Calendar`) of the same route renders `scheduled_publish_at` items on a
month grid (drag to reschedule = transition #11 then #10), plus in-flight items grouped by `sla_due_at`.

### D.2 Review screen (`/admin/content/[slug]/edit`, Review mode)

Opened from a board card or the Pending queue. Read-optimized: rendered preview (RSC block render),
revision **diff**, threaded **comments**, and the **gate action bar** scoped to the reviewer's role.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Back   Understanding Compound Interest        state: ● SEO_REVIEW   assignee: Lee (SEO)   [⋯]      │
│ ┌──────────────────────────────────────────────────────────┬───────────────────────────────────────┐│
│ │ [ Preview ] [ Diff ▾ rev 7 ↔ rev 6 ] [ Blocks ]          │  GATE: SEO REVIEW                       ││
│ │ ┌──────────────────────────────────────────────────────┐ │  ┌─ SEO checklist ─────────────────┐   ││
│ │ │  Understanding Compound Interest                      │ │  │ ✓ meta title 52/60               │   ││
│ │ │  Compound interest is interest on interest…          │ │  │ ✓ description 138/160            │   ││
│ │ │  ~~old: A = P(1+r)^t~~  ++new: A = P(1+r/n)^{nt}++    │ │  │ ✓ exactly 1 H1                   │   ││
│ │ │  [callout key-takeaway] The earlier you start…       │ │  │ ⚠ alt text missing (1 image)     │   ││
│ │ │  [finmath ⨏] interactive calculator                  │ │  │ ✓ canonical valid                │   ││
│ │ └──────────────────────────────────────────────────────┘ │  │ ✓ internal links: 4              │   ││
│ │  block-level diff: + added · − removed · ~ changed       │  └──────────────────────────────────┘   ││
│ │ ┌─ Comments (2 open) ──────────────────────────────────┐ │   gate score: 91 / 100                  ││
│ │ │ @Khan ▸ block#h2-3: tighten this dek      [resolve]  │ │  ┌──────────────────────────────────┐   ││
│ │ │   ↳ @Rao: done in rev 7                              │ │  │ [ ✓ Approve SEO → Legal/Approved] │   ││
│ │ │ @Lee ▸ block#img-1: needs alt text        [open]    │ │  │ [ ✗ Request changes (note req.)  ]│   ││
│ │ │ + add comment…                              @mention │ │  │ [ ⤺ Reassign… ]                   │   ││
│ │ └──────────────────────────────────────────────────────┘ │  └──────────────────────────────────┘   ││
│ └──────────────────────────────────────────────────────────┴───────────────────────────────────────┘│
│  Activity: submitted by Rao 2d · editorial-approved by Khan 1d · entered SEO_REVIEW 4h ago (SLA 8h)   │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Gate action bar** is role-aware: an Editor sees *Approve editorial / Request changes*; an SEO
  Manager sees the SEO checklist + *Approve SEO / Reject*; a Legal Reviewer sees the **Legal Review
  Queue–scoped** view (read content + disclosure inspector + *Legal approve / Legal reject* only — no
  editing, no other content; matches the narrow Legal Reviewer role).
- **Approve** is **disabled until the gate checklist passes** for that gate (SEO minimums for SEO,
  disclosure presence for Legal). The button is a client-side affordance only — the server re-runs the
  guard inside the transaction; a stale UI cannot bypass it.
- **Request changes / reject** opens a **required note** field (`requiresNote`). The note is written to
  `cms_workflows.comments` + the approval log, and surfaces in the author's loopback notification.
- **Diff** uses `cms_revisions` snapshots (block-level add/remove/change + word-level prose diff inside
  paragraphs, per [04 §B.6](../04-rbac-and-workflow.md)). Default compares the two latest revisions.
- **Comments** are block-anchored (`content_comments.block_id`), threaded, `@mention`-aware
  (notification fan-out), and "resolve"-able — schema already specified in [04 §B.4](../04-rbac-and-workflow.md).

### D.3 Pending queue (`/admin/scheduler`, View: Queue) and per-role inboxes

A flat, sortable list backed by `GET …/content/pending` and `…?assignee=me`. Each reviewer role gets a
filtered default: Editors → `pending_review` in their categories; SEO Manager → `seo_review`; Legal
Reviewer → `legal_review` only; Managing Editor → `approved` + SLA-breaching everything. Sort by SLA due,
oldest-first by default (worst ball-in-court surfaces at top).

---

## E. Notifications matrix

All notifications fan out through **notification-service** (`/v1/dispatch`), honoring each user's
per-channel preferences (email / in-app / push). Triggered **post-commit** (after the transaction
commits, fire-and-forget like the existing `content.published` emit) so a notification failure can never
roll back a transition. Recipients are resolved from RBAC scope (e.g. "Editors of category X").

| Transition | Primary recipient (→ becomes ball-in-court) | CC / watchers | Channel default | Template |
|------------|---------------------------------------------|---------------|-----------------|----------|
| submit / resubmit (#1, #4) | assigned **Editor** (scope) | category Managing Editor | in-app + email | `review_requested` |
| request_changes (#2) | **Author** | — | in-app + email | `changes_requested` (incl. note) |
| approve_editorial (#3) | **SEO Manager** | author (FYI) | in-app | `seo_review_requested` |
| seo_approve → legal (#5a) | **Legal Reviewer** | Managing Editor, author | in-app + email | `legal_review_requested` |
| seo_approve → approved (#5b) | **Managing Editor** | author | in-app | `ready_to_publish` |
| seo_reject (#6) | **Author** | — | in-app + email | `seo_rejected` (incl. note) |
| legal_approve (#7) | **Managing Editor** | author | in-app | `ready_to_publish` |
| legal_reject (#8) | **Author** | Managing Editor | in-app + email | `legal_rejected` (incl. note) |
| schedule (#10) | **Author** | watchers | in-app + email | `scheduled_for` (go-live time) |
| publish (#9 / #12) | **Author** | watchers, subscribers | in-app + push | `published` |
| unpublish / takedown (#13/#14) | **Author** | Managing Editor, Admin | in-app + email | `unpublished` |
| reassign (#17) | **new assignee** | previous assignee | in-app | `reassigned` |
| **SLA approaching** (§F) | current **assignee** | — | in-app | `sla_warning` |
| **SLA breach** (§F) | **Managing Editor** + assignee | Admin | in-app + email | `sla_breached` |
| @mention in comment | mentioned user | — | in-app | `mention` |

Every transition is **also** written to the WORM audit log (`cms_approval_logs` → consumed into
`audit-service` via `baalvion:events`), independent of notifications — approvals are non-repudiable
even if notification delivery fails.

---

## F. SLA, ball-in-court & assignee

- **Ball-in-court** = `cms_workflows.assignee_id`. Set on **every** transition to the role responsible for
  the *next* action (see the "→ becomes ball-in-court" column in §E). `draft`/`changes_requested` →
  author; review states → the gate's reviewer; `approved` → Managing Editor; `scheduled`/`published`
  → no owner.
- **SLA clock.** `state_entered_at` is stamped on each transition; `sla_due_at = state_entered_at + policy[state]`.
  Default policy (per-website-configurable in `/admin/settings`):

  | State | SLA | Escalation |
  |-------|-----|-----------|
  | `pending_review` | 8 business hours | warn assignee @75%, escalate to Managing Editor on breach |
  | `seo_review` | 8 business hours | warn @75%, escalate to Managing Editor |
  | `legal_review` | 24 hours | warn @75%, escalate to Admin |
  | `approved` (awaiting publish) | 24 hours | nudge Managing Editor |
  | `changes_requested` | informational only (author-owned; no auto-escalation) | — |

- **Monitoring.** A lightweight scheduled sweep (BullMQ repeatable job in cms-service, reusing the same
  scheduler infra as `schedule_job_id`) scans `cms_workflows` via the `cms_workflows_sla_due` partial
  index for rows crossing 75% and 100% of SLA, and emits `sla_warning` / `sla_breached` notifications
  (idempotent — a `last_sla_notified_stage` guard prevents duplicate alerts). The board renders the SLA
  chip directly from `sla_due_at` (no extra query).

---

## G. Atomicity & the deadlock contract (NON-NEGOTIABLE)

Every transition is **exactly one DB transaction** that updates the workflow row, mirrors `status` onto
`cms_contents`, snapshots a revision, and writes the audit log — all on the **same** `t`. This is already
implemented correctly in `service/workflowService.js` and **must not regress**. The two known
self-deadlock traps (documented in the real code) are hard requirements here:

1. **`revisionService.createRevision(contentId, userId, note, t)`** — the **4th arg `t` is mandatory**.
   Inside, `content.increment('revisionCount')` opens a *second* connection if `t` is omitted and tries
   to UPDATE the `cms_contents` row the outer transaction already locked → self-deadlock → pool timeout →
   the whole transition rolls back. (See `revisionService.js:29-61` comment.)
2. **`auditService.logWorkflowAction({…}, t)`** — the approval-log INSERT performs an FK check
   (`FOR KEY SHARE`) on the `cms_workflows` row the outer txn holds locked; running it on a separate
   connection self-deadlocks. The transaction `t` **must** be threaded through. (See `auditService.js:5-15`.)

Pattern (already in place — preserve it when adding the SEO/Legal gates):

```js
await sequelize.transaction(async (t) => {
  const workflow = await CmsWorkflow.findOne({ where: { contentId }, transaction: t, lock: t.LOCK.UPDATE });
  // …validate def.from, compute wfUpdate/contentUpdate (incl. new gate columns)…
  await workflow.update(wfUpdate, { transaction: t });
  await content.update({ ...contentUpdate, lastEditedBy: userId }, { transaction: t });
  await revisionService.createRevision(contentId, userId, `State changed to ${toState}`, t); // ← t!
  await auditService.logWorkflowAction({ workflowId: workflow.id, /*…*/ }, t);                // ← t!
  await cache.del(cache.keys.content(contentId));
});
// post-commit, fire-and-forget ONLY: notification-service dispatch, content.published emit,
// CDN revalidate, read-model projection, search index. NEVER inside the txn.
```

The new gate transitions (`seo_approve`, `seo_reject`, `legal_approve`, `legal_reject`) extend the
existing `TRANSITIONS` map and `wfUpdate` branch logic; they snapshot a revision on approval transitions
(`seo_approve`, `legal_approve`) and **always** write the audit log on the same `t`. The legal-routing
decision (§C) is computed **inside** the `seo_approve` transaction from the already-locked content row,
so the `to` state and `legal_required` are written atomically with the rest of the transition.

---

## H. Cross-references

- **Roles, permission matrix, enforcement (defense-in-depth), 2FA/step-up** → [04 §A](../04-rbac-and-workflow.md).
- **Canonical state machine, comments schema, version control/rollback, board wireframe** → [04 §B](../04-rbac-and-workflow.md).
- **Content model, validation gates (`submit_for_review`), content types & required blocks** → [02 §B](../02-content-cms.md).
- **SEO gate criteria, redirects on unpublish, internal linking** → [03](../03-seo-and-media.md).
- **Read-model projection on `content.published` → `imperialpedia.articles`, search index** → [02 §A](../02-content-cms.md).
- **Audit (WORM, hash-chain) + events bus** → [06 §security](../06-security-database-api.md), `baalvion:events`.
```
