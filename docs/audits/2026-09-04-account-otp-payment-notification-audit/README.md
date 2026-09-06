# Account / OTP / Payment / Notification system audit — 2026-09-04

Full-platform audit checking a 16-section product checklist (account lifecycle, admin credentials, OTP, payments, order notifications, reminders, subscriptions, invoices, admin alerts, user dashboards, central notification system, email templates, webhook idempotency, database design, scheduled jobs, security) against what's actually implemented across every backend service and frontend app in the Baalvion monorepo.

**Read [00-CRITICAL-SECURITY-FINDINGS.md](00-CRITICAL-SECURITY-FINDINGS.md) first.** Six of the findings below are live exploitable bugs, not checklist gaps — they matter regardless of which features you decide to build next.

This is not one app. It's 20+ backend services across 6 bounded contexts (identity, commerce, trade, ecosystem, infrastructure, platform), each with wildly different maturity. A single "done / not done" verdict would be misleading, so every section below is broken out per-service with file:line evidence.

## Scorecard — 16 checklist sections

| # | Section | Status | Detail |
|---|---|---|---|
| 1 | User Account lifecycle | 🟡 Partial — 10/18 items solid in the reference service, 4 partial (dead notification triggers), 4 missing (change-password, change-email, account activation, account deletion) | [01](01-account-otp-credentials.md) |
| 2 | User Credentials (admin-created) | 🟡 Partial — good pattern in auth-service; **broken in proxy-service** (critical #1-3) | [01](01-account-otp-credentials.md) |
| 3 | OTP System | 🟢 Done — for its 2 live purposes (phone verify, email login); not extended to forgot-password/change-email/payment OTP | [01](01-account-otp-credentials.md) |
| 4 | Payment System | 🟡 Mixed — 3-5 services have a genuinely solid, verified, idempotent payment core; several have no real gateway at all (2 are critical bugs, #4-5) | [02](02-payments-orders-invoices-refunds.md) |
| 5 | Purchase/Order Notifications | 🔴 Mostly missing — only order-service sends creation+payment emails; nothing for processing/shipped/cancelled/refunded anywhere | [02](02-payments-orders-invoices-refunds.md) |
| 6 | Payment Reminders | 🔴 Missing entirely — no service has due/overdue/expiring reminder logic | [02](02-payments-orders-invoices-refunds.md) |
| 7 | Subscription System | 🟡 Partial — exists in ~6 services, but **no service auto-renews or auto-expires** a subscription; all lifecycle changes are manual API calls | [02](02-payments-orders-invoices-refunds.md) |
| 8 | Invoice & Receipt | 🔴 Mostly missing — DB tables often exist and go unused; **no PDF generation found anywhere in the platform** | [02](02-payments-orders-invoices-refunds.md) |
| 9 | Admin Notifications | 🔴 Missing as a real feature — two services built their own ad hoc alerting, no unified layer | [03](03-notification-system.md) |
| 10 | User Dashboard | 🟡 Partial — ~5 frontend apps have solid account areas, several have almost none | [05](05-dashboards-and-security-posture.md) |
| 11 | Central Notification System | 🟡 Partial — the dispatch engine itself is well built (BullMQ, retries, DLQ), but **7+ services bypass it entirely** and mail directly | [03](03-notification-system.md) |
| 12 | Email Templates | 🟡 Partial — 8 of 14 checklist templates exist in the central service (payment-failed, reminder, invoice, refund, subscription renewal/expiry are missing there) | [03](03-notification-system.md) |
| 13 | Payment Webhooks (idempotency) | 🟡 Mixed — several excellent implementations, one duplicates refunds on replay (critical #6) | [04](04-database-scheduled-jobs-webhooks.md) |
| 14 | Database Design | 🟡 Partial — most tables exist somewhere; **no refunds ledger, no user_devices table, no notification_logs anywhere platform-wide** | [04](04-database-scheduled-jobs-webhooks.md) |
| 15 | Scheduled/Automatic Jobs | 🟡 Partial — ad hoc per-service, no general sweep pattern; a couple are wired but disabled by default | [04](04-database-scheduled-jobs-webhooks.md) |
| 16 | Security & Monitoring | 🟢 Mostly done at code level (hashing, RS256 JWT, validation, audit logs all solid) — but **zero error-monitoring/APM tool anywhere**; infra-level items (SSL, firewall, backups) are unverifiable from the repo | [05](05-dashboards-and-security-posture.md) |

**Rough tally: 2 of 16 areas are solid/production-ready, 10 are partially built with real gaps, 4 are essentially not built at all** (order-state notifications beyond the basics, payment reminders, invoice/receipt generation, admin alerting) — on top of 6 separate live security/correctness bugs that need fixing regardless of feature scope.

## How to read this

- [00-CRITICAL-SECURITY-FINDINGS.md](00-CRITICAL-SECURITY-FINDINGS.md) — 6 live bugs, ranked by severity, with file:line evidence and a fix direction for each.
- [01-account-otp-credentials.md](01-account-otp-credentials.md) — checklist sections 1-3.
- [02-payments-orders-invoices-refunds.md](02-payments-orders-invoices-refunds.md) — checklist sections 4-8, per service, plus a scorecard table.
- [03-notification-system.md](03-notification-system.md) — checklist sections 9, 11, 12.
- [04-database-scheduled-jobs-webhooks.md](04-database-scheduled-jobs-webhooks.md) — checklist sections 13-15.
- [05-dashboards-and-security-posture.md](05-dashboards-and-security-posture.md) — checklist sections 10, 16.

## Scope & method

Read-only code audit (no changes made). ~18 parallel research passes across every service with a payment/notification/account surface, cross-checked with file:line citations. Six items — SSL/firewall/SSH/backups/patching/server-monitoring — are infrastructure-level and were explicitly **not** checked; they can only be verified by logging into wherever this is actually hosted (e.g. a Hostinger VPS), not by reading code.

Mail transport itself (SES-backed, outbound-only, fail-loud on send failure) was verified in an earlier pass in the same conversation and is solid — not re-litigated here.

Next step, when you're ready to schedule the work: triage the 6 critical findings first (they're security bugs, not roadmap items), then use the scorecard above to decide which of the 4 "missing" areas to build first.
