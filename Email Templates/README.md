# Email Templates — visual preview folder

This folder is a **preview/reference folder, not the source of truth.** The real, editable templates live in code at
[`Backend/services/infrastructure/notification-service/templates/`](../Backend/services/infrastructure/notification-service/templates/) — that's what actually sends when a real email goes out. Everything in `previews/` here is generated output for browsing.

## How to use this

Open [`previews/index.html`](previews/index.html) in a browser — it lists every template with its rendered subject line and a link to the full HTML preview.

## How to regenerate after editing a template

```bash
node "Email Templates/generate-previews.cjs"
```

Run this from the repo root any time you change something in `templates/index.js`, `templates/base.js`, or `templates/premium/`. It re-renders every template with realistic sample data and rewrites everything in `previews/`. Never hand-edit a file inside `previews/` — it will just be overwritten next run.

## Scope: single site first

Previews are currently rendered for the **`baalvion`** brand only (the flagship baalvion.com site), per the plan to get one site's email system fully right before extending the same reusable template system to the other brands (proxy/BaalvionStack, Law Elite, etc.). `templates/premium/brands.js` already has real tokens for several other brands when we're ready to add their previews here.

## What's covered right now (22 templates)

**Lifecycle (brand-themed, via `templates/premium/`):** welcome, onboardingDay1, onboardingDay3, onboardingDay7, reengagement, leadNotification

**Account & security:** emailVerification, passwordReset, loginAlert, securityAlert, orgInvite, mfaEnabled, impersonationAlert

**Orders & payments:** orderConfirmation, orderPaid, paymentFailed, paymentRefunded, paymentReminder, invoice

**Subscriptions:** subscriptionRenewal, subscriptionExpiry (two preview files — `subscriptionExpiry.html` for "expiring soon" and `subscriptionExpiry-expired.html` for "already expired" — same template, one boolean flag)

The last 6 (paymentFailed, paymentRefunded, paymentReminder, invoice, subscriptionRenewal, subscriptionExpiry) are built and tested (`notification-service/test/templates.test.js`) but **not yet wired to send automatically** — no service in the platform currently publishes a matching event with a known payload shape. See [`docs/audits/2026-09-04-account-otp-payment-notification-audit/03-notification-system.md`](../docs/audits/2026-09-04-account-otp-payment-notification-audit/03-notification-system.md) for the full picture of what's wired vs. not.
