# Baalvion Invest — Global Investment Platform

End-to-end platform where investors from any country onboard, complete KYC/AML,
review deal documents, perform due diligence, negotiate privately, sign
digitally, fund via escrow, and track portfolio performance.

**Stack:** Next.js 15 + Tailwind v4 · NestJS 11 · PostgreSQL + Prisma ·
JWT (RS256) + TOTP MFA · AWS S3 · Stripe + Wise · Sumsub.

## Monorepo layout

```
investment-platform/
├── apps/
│   ├── api/   → NestJS backend (REST /api/v1 + WS deal-room)
│   └── web/   → Next.js 15 investor portal
├── packages/
│   └── database/  → Prisma schema (multi-file) + client
└── docs/api-design.md
```

## Quick start

```bash
# 0. Prereqs: Node 20+, pnpm 9, a PostgreSQL 14+ database
cp .env.example .env        # fill DATABASE_URL + secrets (see below)
pnpm install

# 1. Generate keys/secrets for .env
openssl genrsa -out access_private.pem 2048
openssl rsa -in access_private.pem -pubout -out access_public.pem
#  → paste PEMs into JWT_ACCESS_PRIVATE_KEY / JWT_ACCESS_PUBLIC_KEY (\n-escaped)
openssl rand -base64 32     # → ENCRYPTION_KEY

# 2. Database
pnpm --filter @baalvion-invest/database build      # prisma generate + tsc
pnpm db:migrate                                     # create tables

# 3. Run (two terminals)
pnpm --filter @baalvion-invest/api dev    # API   → http://localhost:4000/api/v1
pnpm --filter @baalvion-invest/web dev    # Web   → http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` for the web app.

> Integration providers (Sumsub, Stripe, Wise, S3) **degrade gracefully**: with
> no credentials they return deterministic simulated results, so the entire
> investor journey is exercisable locally without external accounts.

## Feature map

| Phase | Capability | Backend module | Frontend |
|-------|-----------|----------------|----------|
| 1 | Auth: register/login, RS256 JWT, rotating refresh, TOTP MFA | `auth` | `/login`, `/register` |
| 2 | Investor onboarding (profile, preferences, accreditation) | `investors` | `/onboarding` |
| 2 | KYC/AML via Sumsub + webhook | `compliance` | `/onboarding` |
| 2 | Company onboarding, profile, founders, cap table | `companies` | — |
| 2 | Opportunity discovery + AI matching | `opportunities` | `/opportunities` |
| 2 | Deal room: secure messaging (WS), members, NDA | `deals` | `/deals/[id]` |
| 2 | Document vault: S3 presigned up/download, access logs, DD | `documents` | deal room |
| 3 | Term sheets, counters, e-signatures, investments, positions | `investments` | deal room |
| 3 | Escrow + payments (Stripe in, Wise out), double-entry ledger | `payments` | deal room |
| 3 | Portfolio, returns (MOIC), distributions, tax docs | `portfolio` | `/portfolio`, `/dashboard` |
| 3 | Admin: KYC/accreditation/company review queues | `admin` | — |
| — | In-app notifications | `notifications` | — |

## End-to-end happy path

1. Register → personal investor org is provisioned (OWNER).
2. `/onboarding` → set investor profile, start Sumsub KYC.
3. `/opportunities` → browse live rounds / AI-recommended → open one.
4. **Express interest** → a private `Deal` + deal room is created.
5. Negotiate in chat, run due-diligence checklist, propose/accept a term sheet.
6. Accepting a term sheet creates a committed `Investment` + `EscrowAccount`.
7. **Fund** escrow (Stripe PaymentIntent) → webhook marks funded → ledger posts
   `investor:cash → escrow:hold`.
8. Release escrow → `escrow:hold → company:cash`, investment goes ACTIVE, a
   `Position` opens, deal closes.
9. `/portfolio` & `/dashboard` → holdings, MOIC, distributions, tax docs.

## Security highlights

- Argon2id passwords; user-enumeration-resistant login.
- RS256 access tokens (15m) + opaque rotating refresh tokens with reuse
  detection (family revocation).
- TOTP MFA with AES-256-GCM-encrypted seeds + single-use backup codes.
- Global rate-limiting, Helmet, strict validation, uniform error envelope.
- Multi-tenant isolation on `orgId`; per-org RBAC guard.
- Webhook signature verification (Stripe, Sumsub) over raw request bodies.
- Double-entry ledger enforces balanced postings on every money movement.
