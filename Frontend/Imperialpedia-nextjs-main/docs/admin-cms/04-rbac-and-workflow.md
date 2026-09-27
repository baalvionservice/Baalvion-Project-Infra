# 04 — Users & Roles, and Editorial Workflow

Covers **§7 (User & Role Management + permission matrix)** and **§8 (Editorial Workflow, comments, approvals,
notifications, version control, rollback)**.

---

## A. Roles & RBAC (§7)

### A.1 Mapping product roles → platform role ranks

The platform already defines a strict rank ladder (`@baalvion/auth-node`):

```
viewer < member < editor < manager < admin < owner < super_admin
```

The 8 product roles map onto this ladder **plus** scoped grants from `rbac-service` (RBAC+ABAC PDP).
Rank gives a coarse floor; `rbac-service` policies give fine-grained, **scope-aware** permissions
(e.g. "Editor of the *Investing* category only").

| Product role | Base rank | Scope (ABAC) | Intent |
|--------------|-----------|--------------|--------|
| **Super Admin** | `super_admin` | global | Platform owner; bypasses all checks. Break-glass, audited. |
| **Admin** | `admin` | org/site | Runs Imperialpedia: settings, billing, users (below admin), all content. |
| **Managing Editor** | `manager` | site | Owns the editorial calendar & publishing; assigns reviewers; final publish. |
| **Editor** | `editor` | category set | Reviews/edits/approves content in assigned categories. |
| **SEO Manager** | `editor` + `seo:*` grant | site | SEO review gate, redirects, sitemaps, linking; cannot publish prose alone. |
| **Author** | `member` + `content:author` | own + assigned | Creates & edits own content; submits for review; cannot publish. |
| **Contributor** | `member` (restricted) | own | Drafts only; every submission is reviewed; no media delete. |
| **Moderator** | `member` + `community:moderate` | community | Moderates comments/community/UGC; no editorial publish. |

> The public **Visitor / Registered User / Contributor / Author** ladder from the brief maps to
> `viewer/member` on the public side; the **admin** roles above are what the Admin Panel enforces.

### A.2 Permission matrix

Legend: ✓ = allowed · **O** = own content only · **S** = within assigned scope (category/community) ·
✗ = denied · 🔒 = allowed but audited/break-glass.

| Capability | Super Admin | Admin | Managing Editor | Editor | SEO Mgr | Author | Contributor | Moderator |
|---|---|---|---|---|---|---|---|---|
| Create draft | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit any content | ✓ | ✓ | ✓ | S | ✗ | O | O | ✗ |
| Edit SEO metadata | ✓ | ✓ | ✓ | S | ✓ | O | ✗ | ✗ |
| Submit for review | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Approve (editorial) | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| SEO review/approve | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Legal review/approve | ✓ | ✓ | 🔒 | ✗ | ✗ | ✗ | ✗ | ✗ |
| Publish | ✓ | ✓ | ✓ | S(if delegated) | ✗ | ✗ | ✗ | ✗ |
| Unpublish / archive | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| Rollback to revision | ✓ | ✓ | ✓ | S | ✗ | O(draft) | ✗ | ✗ |
| Delete content | ✓ | ✓ | 🔒 | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage categories/tags | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| Glossary publish | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| Media upload | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Media delete | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ |
| Moderate comments/UGC | ✓ | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✓ |
| Manage redirects/sitemaps | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| View analytics | ✓ | ✓ | ✓ | S | ✓(SEO) | O | ✗ | ✗ |
| Manage monetization | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage users/roles | ✓ | ✓(≤ own rank) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage AI/integrations | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View audit logs | ✓ | ✓ | S | ✗ | ✗ | ✗ | ✗ | ✗ |
| Platform/security settings | ✓ | 🔒 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### A.3 Enforcement model (defense in depth)

1. **Edge / route group:** `/admin/*` requires an authenticated session with rank ≥ `editor` (Author dashboard is a subset).
2. **BFF/API:** every mutating endpoint calls `rbac-service /v1/authorize` with `{subject, action, resource{type,id,scope}}`; deny-overrides; obligations (e.g. `limit:own`) honored.
3. **Service controller:** ownership-or-rank gate as already done in `imperialpedia-service` (`author_id === userId || rank ≥ admin`).
4. **Row-level:** `@baalvion/tenancy` RLS keeps multi-brand data isolated; category scope filters list queries.

Permissions are **registered** in `rbac-service`'s permission registry (e.g. `content:publish`,
`content:approve`, `seo:review`, `legal:review`, `community:moderate`, `monetization:manage`, `user:manage`,
`media:delete`) and bound to roles per tenant. No permission strings are hard-coded in the frontend — the
UI hides/disables actions based on a `GET /me/permissions` capability list (server remains the authority).

### A.4 Account security per role

- **2FA mandatory** for `editor` rank and above (publishing power) — see [06](./06-security-database-api.md#security).
- **Step-up auth** for destructive/break-glass actions (delete content, change another user's role, edit platform security settings).
- **Session policy:** shorter idle timeout for admin/owner; `jti` revocation on role change.

---

## B. Editorial Workflow (§8)

### B.1 State machine

The required pipeline **Contributor → Author → Editor → SEO Review → Legal Review → Publish** maps onto the
existing `cms_workflows.current_state` enum, with two **review gates** (SEO, Legal) added as sub-states of
`pending_review`. We extend the enum minimally:

```
draft → pending_review → (changes_requested ↺) → seo_review → legal_review → approved → scheduled → published
                                                                                   ↘ archived
```

```sql
-- additive: SEO + Legal gates as explicit states
ALTER TYPE cms.enum_cms_workflows_current_state ADD VALUE IF NOT EXISTS 'seo_review'   AFTER 'pending_review';
ALTER TYPE cms.enum_cms_workflows_current_state ADD VALUE IF NOT EXISTS 'legal_review' AFTER 'seo_review';
-- mirror on cms_contents.status (kept in sync by the workflow transition service)
```

`cms_workflows` already tracks `submitted_by/at`, `reviewed_by/at`, `approved_by/at`, `published_by/at`,
`comments`, `scheduled_publish_at`, `schedule_job_id`. We add reviewer columns for the two gates:

```sql
ALTER TABLE cms.cms_workflows
  ADD COLUMN IF NOT EXISTS seo_reviewed_by   bigint NULL,
  ADD COLUMN IF NOT EXISTS seo_reviewed_at   timestamptz NULL,
  ADD COLUMN IF NOT EXISTS legal_reviewed_by bigint NULL,
  ADD COLUMN IF NOT EXISTS legal_reviewed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS assignee_id       bigint NULL;     -- current ball-in-court
```

### B.2 Transition rules

| From | Action | Allowed role | To | Side effects |
|------|--------|--------------|----|--------------|
| `draft` | submit | Author/Contributor (owner) | `pending_review` | SEO + content gates must pass; notify assigned Editor |
| `pending_review` | request changes | Editor (scope) | `changes_requested` | comment required; notify author |
| `pending_review` | approve editorial | Editor (scope) | `seo_review` | assign SEO Manager |
| `changes_requested` | resubmit | Author (owner) | `pending_review` | re-run gates |
| `seo_review` | approve | SEO Manager | `legal_review`* | *skipped if content not legal-sensitive (see B.3) |
| `seo_review` | reject | SEO Manager | `changes_requested` | comment required |
| `legal_review` | approve | Admin/Legal | `approved` | record `legal_reviewed_*` |
| `approved` | publish now | Managing Editor | `published` | revalidate CDN, emit `content.published`, project to read model |
| `approved` | schedule | Managing Editor | `scheduled` | set `scheduled_publish_at` + queue job (`schedule_job_id`) |
| `scheduled` | (timer) | system | `published` | at `scheduled_publish_at` |
| `published` | unpublish | Managing Editor/Admin | `archived` | 410/redirect handling |
| any | rollback | Editor+ (scope) | (same) | restore a prior revision (B.6) |

> The existing self-deadlock bug noted in platform memory (`workflowService.transition` must run
> `createRevision` + `auditService.logWorkflowAction` **inside** the same transaction) is a hard
> requirement here — every transition is one atomic DB transaction that also writes the audit log.

### B.3 Legal-review routing (financial-compliance aware)

Imperialpedia gives financial information → **legal/compliance review is conditional but strict**.
Content is routed through `legal_review` when **any** of:

- `content_type IN (financial_term, guide, tutorial)` **and** contains a `finmath`/`formula` block, or
- prose matches a compliance lexicon (e.g. "guaranteed return", "buy/sell", "tax advice"), or
- `custom_fields.disclosures` is non-empty, or
- editor manually flags "needs legal".

Otherwise `seo_review → approved` directly. Every published financial article carries a standardized
**"not financial advice"** disclosure block (enforced at publish for the above categories).

### B.4 Comments & collaboration

```sql
CREATE TABLE cms.content_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid NOT NULL REFERENCES cms.cms_contents(id) ON DELETE CASCADE,
  block_id    text NULL,                              -- anchor to a specific block (editor inline comment)
  parent_id   uuid NULL REFERENCES cms.content_comments(id) ON DELETE CASCADE,
  author_id   bigint NOT NULL,
  body        text NOT NULL,
  kind        varchar(16) NOT NULL DEFAULT 'comment'  -- comment|suggestion|approval|rejection
                CHECK (kind IN ('comment','suggestion','approval','rejection')),
  resolved    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_comments_content ON cms.content_comments (content_id, resolved);
```

- **Block-anchored comments** + threaded replies; "resolve" to clear.
- **Suggestion mode** (track-changes): reviewers propose block edits; author accepts/rejects.
- `@mentions` notify via `notification-service`.

### B.5 Approval system & notifications

- Each gate is an explicit approval with actor + timestamp (columns above) → a full **audit trail** in
  `audit-service` (WORM). Approvals are non-repudiable.
- **Notifications** (`notification-service` fan-out, per-user channel prefs):
  - submit → editor "review requested"; request-changes → author; gate-approved → next assignee;
    scheduled → author "goes live at…"; published → author + watchers; SLA breach → managing editor.
- **Editorial calendar** (`/admin/scheduler`) shows scheduled + in-flight items with ball-in-court + due dates.

### B.6 Version control & rollback

Already modeled: `cms_revisions` + `cms_contents.revision_count`. Design:

```sql
-- cms.cms_revisions (existing) snapshot shape per save/transition:
-- { id, content_id, revision_no, title, content_blocks JSONB, seo_metadata JSONB,
--   custom_fields JSONB, author_id, change_summary, created_at }
CREATE INDEX IF NOT EXISTS cms_revisions_content_no ON cms.cms_revisions (content_id, revision_no DESC);
```

- **Every transition + meaningful save** writes an immutable revision snapshot (full block tree, not a diff —
  storage is cheap, correctness matters). `revision_no` is monotonic per content.
- **Diff view:** block-level visual diff between any two revisions (added/removed/changed blocks; word-level
  prose diff inside paragraphs).
- **Rollback:** restore revision N → creates a **new** revision (never destroys history; immutable trail).
  Allowed per matrix (Editor+ in scope). A rollback of a *published* article re-enters the workflow at
  `approved` (re-publish) unless it's an emergency takedown (Admin → straight to `archived`).
- **Autosave revisions** are lightweight + pruned (keep last K + all transition revisions) to bound growth.

### B.7 Workflow board (wireframe)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Editorial Workflow            View: [ Board ▾ ]   Mine ☑   Category: Investing ▾       │
├───────────┬───────────────┬──────────────┬─────────────┬──────────────┬───────────────┤
│  DRAFT    │ PENDING REVIEW│ CHANGES REQ.  │ SEO REVIEW  │ LEGAL REVIEW │ APPROVED/SCHED.│
├───────────┼───────────────┼──────────────┼─────────────┼──────────────┼───────────────┤
│ ▢ P/E…    │ ▢ ETF basics  │ ▢ Options 101│ ▢ Inflation │ ▢ "Best ROI" │ ▢ Tax-loss…   │
│   A. Rao  │   → M.Khan ●  │   author ↺   │   → SEO ●   │   ⚠ flagged  │   🕒 Jun 7 9am │
│ ▢ Bonds…  │ ▢ Compound…   │              │ ▢ REIT…     │              │ ▢ Yield curve │
│           │   SLA 4h ⚠    │              │             │              │   ✓ ready     │
└───────────┴───────────────┴──────────────┴─────────────┴──────────────┴───────────────┘
   drag a card to transition (allowed targets highlighted by your role)
```
