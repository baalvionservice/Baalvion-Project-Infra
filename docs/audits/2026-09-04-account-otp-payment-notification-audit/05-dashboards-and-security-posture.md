# User dashboards (frontend) and security & monitoring posture

Covers checklist sections "User Dashboard" and "Security & Monitoring". Identity/login is centralized via auth-gateway + the `auth-baalvion` SSO widget (session cookies through `@baalvion/auth-node`), so several frontends lean on the shared gateway rather than building their own password UI — noted per app below.

## User dashboard coverage by frontend app

| Item | admin-platform | Proxy-BaalvionStack | Jobs-Portal | Global-Trade-Infra | company-unified-Dashboard | AmariseMaisonAvenue |
|---|---|---|---|---|---|---|
| Profile | ✅ | ✅ | ✅ (candidate) | ✅ | ⚠️ no dedicated page | ✅ |
| Login/Security | ⚠️ platform risk monitoring, not personal | ✅ real 2FA | ❌ | ✅ MFA | ⚠️ RBAC/audit only, not personal | ✅ password reset + session revoke |
| Purchase history | ❌ (staff, not personal) | ⚠️ folded into billing history | ❌ | ✅ | ❌ | ✅ |
| Invoices/receipts | ✅ | ✅ (CSV export) | ❌ | ✅ | ✅ | ❌ |
| Subscriptions | ✅ | ✅ | ❌ | ❌ (no subscription model) | ✅ | ✅ |
| Pending/failed payments | ✅ | ⚠️ only a "past due" badge | ❌ | ✅ | ⚠️ unconfirmed | ❌ |
| Refunds | ✅ | ⚠️ static policy page only | ❌ | ⚠️ escrow-dispute flow, no distinct tracker | ❌ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ not wired into account area |
| Devices/sessions | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Activity log | ✅ | ✅ | ⚠️ admin-only module | ✅ | ✅ | ❌ |

**Other apps with real account areas, briefly:**
- **Law-Elite-Network-main** — ✅ profile, notifications, invoices, subscriptions; ❌ security/sessions/refunds/activity-log for end users.
- **Mining.Baalvion-main** — ✅ profile, notifications; refund policy is a static page only; ❌ purchase history/invoices/sessions.
- **brand-connector-main** — ✅ invoices, subscriptions, refunds, notifications, profile.
- **controlthemarket-main** — ✅ profile, invoices/subscription (company role), activity log; security is admin-only.
- **market-underworld** — ✅ invoices, subscriptions, purchases, notifications, sessions (role-scoped).
- **IR-Baalvion-main** — ✅ notifications, subscriptions, activity log; ❌ security/devices/purchase/invoices/refunds.

**No real user-account dashboard (correctly N/A):** `baalvion-com-main` (marketing site — `/account` is password recovery only), `auth-baalvion` (pure SSO widget), `baalvion-intelligence` (no account UI found).

## Security & monitoring — backend spot-check (auth-service, order-service, notification-service, proxy-service)

| Item | Status | Evidence |
|---|---|---|
| Password hashing | ✅ | argon2id primary (64MiB/timeCost 3/parallelism 4), bcrypt(12) fallback, auto-detected by hash prefix — `auth-service/utils/password.js` |
| JWT/session security | ✅ | RS256-only, enforced by `Backend/packages/auth-node` — explicitly commented as "the ONLY module in the monorepo permitted to import jsonwebtoken," rejects any non-RS256 token, used by 49+ services. One narrow deviation: `admin-service/service/adminService.js:672` signs a support-impersonation token directly via `jsonwebtoken` (isolated issuer) |
| Rate limiting | ✅ | Confirmed in order-, notification-, proxy-service beyond the identity-domain coverage already detailed in file 01 |
| CSRF | ⚠️ mixed by design, not a gap | Cookie-session flows (auth-service/auth-gateway) implement real double-submit-cookie CSRF; bearer-JWT APIs carry none, which is correct/moot for pure `Authorization`-header auth |
| Input validation | ✅ | zod used consistently across all 4 spot-checked services |
| SQL injection | ✅ | Sequelize + `pg` everywhere checked; parameterized queries only, including in the riskiest-looking interpolation spots checked (proxy-service's GDPR/SCIM services) |
| XSS protection | ✅ | `helmet` present broadly — 20+ services checked |
| Payment webhook signature verification | ✅ (with the exceptions already listed in files 02/04) | |
| Audit logs | ✅ genuinely strong | `audit-service` maintains a tamper-evident SHA-256 hash chain across rows (`services/hashChain.js`), captures actor/org/IP/user-agent/action/resource/tenant/outcome/severity/correlation-id, and enforces tenant row-level security |
| Error logging / monitoring (Sentry/Datadog/CloudWatch/New Relic) | ❌ **Real gap** | Zero hits repo-wide across `Backend/services` package.json files — only local structured `pino` logging exists. If a service crashes, or an OTP/payment webhook silently starts failing, nothing pages anyone; someone has to go looking at logs |

## Infra-level items — not verifiable from the repo

These require checking the actual server/hosting, not the code, and were **not** investigated as part of this audit:

- HTTPS/SSL configuration
- Firewall rules
- SSH key-only authentication
- Disabled/closed unnecessary ports
- Database backup jobs (and whether restores are ever tested)
- Automatic security updates
- Server/uptime monitoring

If/when this platform is deployed onto a specific box (e.g. a Hostinger VPS), these need a live check on that machine — they can't be confirmed from the codebase.
