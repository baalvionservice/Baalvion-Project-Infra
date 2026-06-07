# Managing Your Investor Relations Site — Team Guide

**Baalvion Industries Private Limited — Investor Relations**

This guide is for the team that maintains the IR website. **No coding is required** for anything in
Parts 1–3 — you do it all in the admin console and it goes live automatically.

- **Admin console (where you manage everything):** http://localhost:3030
- **Public investor site (what visitors see):** http://localhost:3027
- **Login:** `superadmin@baalvion.com` / `Sup3rAdmin!2026`
  *(Ask your administrator for your own login — see Part 5 for roles.)*

> 💡 After publishing, changes appear on the public site within about **2 minutes**. If you don't see
> a change, wait a moment and refresh (Ctrl+Shift+R).

---

## Part 1 — The 3-step publishing flow (read this first)

Everything you publish follows the same simple flow:

1. **Create / edit** — write or change the item. It starts as a **Draft** (not visible to the public).
2. **Publish** (or **Schedule**) — click Publish to make it live now, or pick a date to publish later automatically.
3. **It appears on the public site** within ~2 minutes.

Nothing is public until you publish it. You can always **unpublish** to take it down, or **edit + re-publish** to update it.

---

## Part 2 — What you can add & manage (no developer needed)

### A) News, Press Releases, Board, Leadership, Reports, Governance (the CMS)
**Where:** Admin → **CMS → Websites → ir.baalvion.com → Content**
Direct link: http://localhost:3030/cms/websites/ir.baalvion.com/content

Use the **"Sections:"** chips at the top to jump to a section:
`Press Releases · Earnings Reports · News · Board of Directors · Executive Committee · Functional Leadership · Vice Presidents`

**To add an item:** click **New Content** → choose the Type (e.g. *News*) → fill in the title and body
→ assign the right **Category/section** → **Publish**.

**To edit:** click the item → make changes → **Publish** (re-publishing updates the live page).

**Photos & files:** inside the editor you can upload an **image** (e.g. a board member's headshot — it
becomes their photo) or attach a **PDF** (e.g. a report). Just use the image/file blocks in the editor.

| To manage… | Section / Type | Appears on |
|---|---|---|
| Press releases | Press Releases | /news-and-events/press-releases |
| News articles | News | /news-and-events/news |
| Board members (name, photo, bio) | Board of Directors | /governance/board-of-directors |
| Executives & leadership | Executive Committee / Functional Leadership / VPs | /governance/leadership |

### B) Investor data modules
**Where:** Admin → **Investor Relations** menu (http://localhost:3030/ir)

| Module | What you manage | Public page |
|---|---|---|
| **Financial Reports** | Quarterly/annual reports + PDF + Publish | /news-and-events/financial-reports |
| **Earnings** | Calls, webcasts, transcripts | (events / webcast pages) |
| **Events & Calendar** | AGM, investor days, roadshows | /news-and-events/events |
| **Regulatory Filings** | 10-K/10-Q/8-K, proxies | /news-and-events/filings |
| **Documents** | Presentations, fact sheets, data-room | /news-and-events/documents + investor-day |
| **Shareholders** | Ownership register (+ CSV bulk import) | (internal) |
| **Performance** | NAV history & IRR/DPI/TVPI metrics | (dashboard) |
| **Stock & Market** | Share price, market cap, dividend data | /news-and-events/stock |

**Email alerts:** people who sign up at `/resources/email-alerts` are saved automatically — no action needed.

---

## Part 3 — Adding a brand-new section (no developer needed)

Want a new section like **ESG & Sustainability**, **Awards**, or **Annual Meeting**?

1. Admin → CMS → ir.baalvion.com → **Categories** → **New Category**
   (or create a **sub-category** under an existing one, like the leadership tiers).
2. It instantly becomes a new **chip** on the Content screen.
3. Create content and assign it to the new category → Publish.

---

## Part 4 — Safety nets (built in, automatic)

- **Revisions / version history** — every save is snapshotted; you can roll back a mistake.
- **Scheduling** — set a future date/time and the item publishes itself then.
- **Approval workflow** — for regulated disclosures, items move
  **Writer → Reviewer → Compliance → Publisher** so nothing goes out unchecked.
- **Audit log** — every change is recorded (who, what, when).
- **Drafts are private** — nothing is public until published.

---

## Part 5 — Team roles & logins

### Starter team logins (created and verified)
Five role-based logins exist in the Baalvion organization, each scoped to **ir.baalvion.com**.
Sign in at **http://localhost:3030**. **Shared starter password: `Baalvion!Team2026`** — change it per
person, or rename/replace these with your real teammates (or ask to have specific people added).

| Login | Role | Can do |
|---|---|---|
| `writer@baalvion.com` | **Writer** (cms_author) | Create & edit content, submit for review — **cannot publish** |
| `reviewer@baalvion.com` | **Reviewer** (cms_reviewer) | Review & approve, request changes |
| `compliance@baalvion.com` | **Compliance** (cms_compliance) | Compliance sign-off on regulated items |
| `publisher@baalvion.com` | **Publisher** (cms_publisher) | Publish / schedule / unpublish |
| `editor@baalvion.com` | **Editor** (cms_editor) | Manage content, categories, bulk actions |

*(The platform superadmin `superadmin@baalvion.com` can do everything, including managing members.)*

> ✅ Verified: a Writer can create a draft but is **blocked from publishing** (403); a Reviewer approves
> and a Publisher publishes. The approval workflow is enforced by these roles.

### Managing roles
Add/replace people or change roles in **CMS → ir.baalvion.com → Team & Access**:

| Role | Can do |
|---|---|
| **Author / Contributor** | Create & edit content, submit for review |
| **Reviewer** | Review and approve content |
| **Compliance** | Compliance sign-off on regulated items |
| **Publisher** | Publish / schedule / unpublish |
| **Editor** | Manage content, categories, bulk actions |
| **Admin** | Everything, incl. members & settings |
| **Viewer** | Read-only |

> To add a brand-new person: create their user first (Identity → Users), then add them under
> **Team & Access** with the role above. (New teammates must be in the Baalvion organization to access the IR site.)

---

## Part 6 — When you need a developer

Almost everything is self-service. You only need a developer for:

- A **new kind of data module** (e.g. a "Dividends" tracker) or a **new public page**.
- A **new custom field** on an item (e.g. an ISIN code on reports).
- **Design changes** or a **live market-data feed** (the connector is built — it just needs a real
  stock ticker configured via one setting).

These follow a documented, repeatable pattern, so they're quick and low-risk.

---

## Quick reference

| I want to… | Go to |
|---|---|
| Post a news article | /cms/websites/ir.baalvion.com/content → News → New |
| Add/edit a board member + photo | …/content → Board of Directors |
| Upload a financial report PDF | /ir/financials → New |
| Add an event / AGM | /ir/events → New |
| Update the share price | /ir/market |
| Add a new section | …/categories → New Category |
| See the live site | http://localhost:3027 |

*Tip: this file can be printed or exported to PDF for the team (e.g. open in any Markdown viewer → Print → Save as PDF).*
