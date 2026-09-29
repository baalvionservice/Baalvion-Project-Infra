# AWS SES Production Access — Readiness Report

**Property:** https://baalvion.com
**App:** `Frontend/baalvion-com-main` (Next.js 15, static export → Cloudflare)
**Prepared:** 30 June 2026
**Purpose:** Document the website upgrade performed to satisfy Amazon SES production-access
manual review and enterprise SaaS trust standards, after the initial request was denied.

---

## 1. Executive summary

Before this work, `baalvion.com` was a single-page marketing site plus one sign-in screen.
It had **no on-site legal pages, no contact page, no email-usage disclosure, and no visible
account journey** — its footer linked *off-site* to another domain for "Privacy" and "Terms",
so a reviewer visiting `baalvion.com` never saw a binding policy. That is the most common
reason a transactional-email request is rejected: the reviewer cannot confirm a legitimate,
self-contained sending use case.

This upgrade makes the site a complete, production-ready platform that demonstrates a concrete,
**transactional** need for email. Authentication on Baalvion is **passwordless**: identity is
verified with one-time codes sent by email, so reliable email delivery is security-critical
infrastructure, not marketing.

All changes are built, type-checked, and statically exported (21 routes). No secrets were added;
no false claims (invented customers, certifications, or regulators) were made.

---

## 2. Changes made

### New pages (all rendered on `baalvion.com`, no off-site dependency)

| Route | Purpose |
|---|---|
| `/about` | Who Baalvion is, mission, vision, values, company facts |
| `/services` | Platform & services — the four operating domains + the passwordless account layer |
| `/email` | **Email Communications** — full transactional-email disclosure + end-to-end user journey |
| `/security` | Security practices, user commitments, responsible disclosure |
| `/contact` | Contact form (opens mail client to the right team) + direct channels + company info |
| `/legal/privacy` | Privacy Policy |
| `/legal/terms` | Terms of Service |
| `/legal/cookies` | Cookie Policy |
| `/legal/acceptable-use` | Acceptable Use Policy (incl. anti-spam / anti-abuse) |
| `/legal/data-protection` | Data Protection Policy (technical + organisational measures, sub-processors) |
| `/register` | Registration entry point (passwordless) |
| `/account/recovery` | Account access & recovery (the passwordless equivalent of "forgot password") |

`/signin` was retained as the real, working passwordless flow and wrapped in a frame that now
carries policy links.

### Structural / technical changes

- **Footer rebuilt** (`src/lib/content.ts`) — four columns (Company, Account, Support, Legal)
  linking to every new on-site page, plus a copyright notice. All legal links are now first-party.
- **Header made responsive** (`src/components/site-header.tsx`) — added a working mobile menu
  (the site previously had no mobile navigation) and switched nav to real, valid routes.
- **`ROUTES` + `CONTACT` constants** centralise every internal path and the verified contact
  addresses (`support@`, `hello@`, `privacy@`, `security@`, `legal@`, `abuse@` — all on the
  sending domain).
- **`sitemap.xml`** now lists all 11 public pages with priorities; noindex auth pages excluded.
- **`robots.txt`** present and points to the sitemap.
- **Security headers** already enforced at the Cloudflare edge (`public/_headers`): HSTS
  (`max-age=63072000; includeSubDomains; preload`), CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. HTTPS is enforced.
- **SEO metadata** — per-page `title`, `description`, and canonical URLs; existing
  Organization JSON-LD retained.

### New source files

- Content: `src/lib/legal.ts`, `src/lib/site-pages.ts`; extended `src/lib/content.ts`.
- Components: `page/page-shell.tsx`, `page/legal-article.tsx`, `auth/auth-shell.tsx`,
  `contact/contact-form.tsx`.
- Pages: the 12 routes listed above.

### Verification

- `tsc --noEmit` — clean.
- `next build` — success; **21/21 static pages** generated and exported to `out/`.
- Bundles within budget (~102 kB shared First Load JS; pages 105–110 kB).

---

## 3. AWS SES production-access compliance checklist

| AWS review concern | Status | Where |
|---|---|---|
| Legitimate, working website | ✅ | Full multi-page site, no placeholders/dead links |
| Clear description of the business | ✅ | `/about`, homepage |
| **Email use case is transactional, not marketing** | ✅ | `/email` enumerates every message type + trigger |
| How recipients are obtained (opt-in / own action) | ✅ | `/email`: recipients create their own account with a permanent email |
| Examples of the emails sent | ✅ | `/email`: verification, OTP, recovery, security alerts, login, transaction, service |
| Bounce & complaint handling | ✅ | `/email` commitments; Privacy §6; Data Protection §4 |
| No unsolicited bulk email / spam | ✅ | Stated on `/email`, Privacy §3, Acceptable Use §3 |
| Unsubscribe for any non-essential mail | ✅ | `/email` commitment; Terms §4 |
| Privacy Policy (public) | ✅ | `/legal/privacy` |
| Terms of Service (public) | ✅ | `/legal/terms` |
| Acceptable Use / anti-abuse policy | ✅ | `/legal/acceptable-use` |
| Cookie & data-protection disclosure | ✅ | `/legal/cookies`, `/legal/data-protection` |
| Sub-processor / SES disclosure | ✅ | Privacy §6, Data Protection §4 name Amazon SES/AWS |
| Working contact method | ✅ | `/contact` form + 6 role addresses on sending domain |
| Footer links to legal on every page | ✅ | Shared footer across all pages |
| HTTPS enforced / security headers | ✅ | `public/_headers` (HSTS, CSP, etc.) |
| `sitemap.xml` + `robots.txt` | ✅ | Generated in export |
| Sender authentication (SPF/DKIM/DMARC) | ⚠️ Action | DNS — see §5 |

---

## 4. Why Baalvion legitimately needs transactional email

Baalvion authentication is **passwordless by design** — the platform never sets or stores a
password. Every account action that proves identity happens through email:

1. **Register** → email a verification code.
2. **Verify email** → confirm control of the address; activate the account.
3. **Sign in** → email a one-time code (in place of a password) + a login notification.
4. **Operate** → transaction receipts and essential service notices.
5. **Stay secure** → security alerts on new devices or sensitive changes.
6. **Recover access** → a fresh one-time code (there is no password to reset).

Because a single Baalvion account authenticates a user across the entire network of platforms,
**undelivered email directly blocks sign-in and account recovery**. This is the textbook
definition of a transactional use case, and it is now documented for a reviewer on a dedicated,
linked page (`/email`) with the full message catalogue and user journey.

---

## 5. Remaining operational actions (outside the website)

These are infrastructure/DNS steps, not website content, but they materially affect approval:

1. **Verify the sending domain** in SES and publish **SPF, DKIM (CNAMEs), and a DMARC** record
   for `baalvion.com`.
2. Configure an **SNS-backed configuration set** for bounce/complaint events and wire it to the
   existing `@baalvion/email` suppression/log store.
3. In the SES production-access request, paste the URLs above — especially
   `https://baalvion.com/email`, `/legal/privacy`, and `/contact` — and the journey from §4.
4. Confirm a low starting bounce/complaint posture by sending only to verified, own-action
   recipients (already the policy).

---

## 6. Deploy

```bash
cd Frontend/baalvion-com-main
pnpm build      # next build → static export in out/
pnpm deploy     # next build && wrangler deploy  (Cloudflare)
```

Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for the production build so the sign-in human-verification
widget is active.
