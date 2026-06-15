# ControlTheMarket — payments + 100-user onboarding go-live

Everything needed to take **real payments** on `controlthemarket.com` and **onboard 100+ users**.
The code is on branch `feat/ctm-payments-onboarding`. Three things below are **yours** (keys, SES,
running the invite script); the rest is wired.

## Architecture (no new infra)
```
Browser ─ /pricing or /company/billing ─ choose Stripe|Razorpay
   │  POST {gateway}/ecosystem/ctm/api/v1/payments/checkout   (JWT; amount priced SERVER-side)
   ▼
ctm-service (:3017) ── resolves keys from the CMS vault (admin panel) for slug "control-the-market"
   │  Stripe → hosted redirect   |   Razorpay → hosted modal (public key only; no secret in browser)
   ▼
Provider webhook ─POST {gateway}/ecosystem/ctm/api/v1/payments/webhook─ ctm-service
        (HMAC-verified, idempotent, amount-checked) → invoice Paid + subscription active
```

## 1. Payments — keys live in the admin panel (no redeploy)
**Admin panel → CMS → Websites → "Control The Market" → Integrations & Keys**, add and **enable**:
- **Stripe**: `secretKey`, `webhookSecret`  (mark status = configured)
- **Razorpay**: `keyId`, `keySecret`, `webhookSecret`  (mark status = configured)

Both can be on at once — the buyer picks at checkout. ctm-service reads them within ~60s, no redeploy.

**Set on the ctm-service host** (wiring, not secrets) so it can reach the vault + fail closed in prod:
```
CMS_BASE_URL=http://cms-service:3011/api/v1
INTERNAL_SERVICE_SECRET=<shared platform internal secret>
PAYMENT_SITE_SLUG=control-the-market
PAYMENT_SUCCESS_URL=https://controlthemarket.com/company/billing?paid=1
PAYMENT_CANCEL_URL=https://controlthemarket.com/company/billing?canceled=1
NODE_ENV=production            # makes the no-charge "manual" fallback fail closed
```

**Register the webhook in each provider dashboard** → URL:
`https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1/payments/webhook`
- Stripe events: `checkout.session.completed`, `payment_intent.succeeded` → secret = the Stripe `webhookSecret` you put in the vault
- Razorpay events: `payment.captured`, `order.paid` → secret = the Razorpay `webhookSecret` you put in the vault

> Plan catalog: checkout resolves a real backend `plan_id` from `GET /plans` and **fails loudly** if a
> plan name isn't in the catalog (never charges a wrong price). Ensure the `ctm.plans` rows match the
> tiers shown on `/pricing` (seed `Basic`/`Pro` if the catalog only has `free`/`pro`/`enterprise`).

## 2. Email (AWS SES) — required so invites/verification actually send
Create **SES SMTP credentials** and **verify the `controlthemarket.com` sending domain (SPF + DKIM)**.
Set on **auth-service** AND **notification-service**:
```
SMTP_HOST=email-smtp.<region>.amazonaws.com
SMTP_PORT=587                  # STARTTLS is enforced in code
SMTP_USER=<SES SMTP username>
SMTP_PASS=<SES SMTP password>
EMAIL_FROM=no-reply@controlthemarket.com   # a verified From address
```
Until SMTP is set, mailers log to console (no delivery). Send yourself one test invite first.

## 3. Onboard 100+ — bulk invite into free/trial
On the auth-service host (env loaded), with a CSV of `email,role,fullName`:
```
node scripts/bulkInviteFromCsv.js <ctm-orgId> people.csv <ownerUserId> https://controlthemarket.com member
```
- `<ctm-orgId>` = the company org to add people to; `<ownerUserId>` must have manage-users on it.
- Invites are CTM-branded (link → `controlthemarket.com/accept-invite`); accepting creates the account,
  verifies email, and ctm-service auto-provisions the user's profile + **free plan** on first login.
- Acceptance is rate-limited 20/hr/IP — fine for individuals; if a cohort accepts from one egress IP,
  stagger or raise the limit.

## Go-live smoke test
1. `curl https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1/payments/provider` → lists `stripe`/`razorpay` once keys are in the vault.
2. `https://controlthemarket.com/pricing` → Choose Plan → pick a provider → real checkout opens.
3. Pay a small real amount → land on `/company/billing?paid=1` → webhook flips invoice **Paid** + subscription **active** (check provider dashboard shows the webhook 200).
4. Run the invite script for 1–2 test emails → confirm the email arrives and accept works.

## Known follow-ups (not blocking first transactions)
- **DB RLS** on the `ctm` schema (today tenant isolation is app-layer only — the exploitable IDORs are
  already closed; RLS is defense-in-depth and needs a `DB_APP_USER` + migration).
- **Frontend "Invite team" step** in company onboarding still collects emails locally — the operator CSV
  script is the live 100-user path; wiring that step to the bulk-invite API is a UX follow-up.
- CTM has **no CSP** today, so Stripe/Razorpay load freely; consider adding one as hardening later.
