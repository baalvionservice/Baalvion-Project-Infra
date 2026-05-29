# Baalvion Jobs Portal (TalentOS) — Live Conversion Status

Conversion of **Frontend/Baalvion-Jobs-Portal-main** (Next.js 14, `jobs.baalvion.com`) and its
backend **Backend/services/ecosystem/jobs-service** (Node/Express/Sequelize/Postgres) from
mock data to a real, full‑stack application wired for **candidate, recruiter, and admin** roles.

_Last updated: 2026‑05‑29._

---

## TL;DR

The portal runs end‑to‑end on real backend data. All three roles log in and use the product;
the public careers site, the apply wizard, the admin ATS, the campus module, and the candidate
self‑service portal all render and write **real Postgres data**. File uploads go to **MinIO** and
transactional **email** is delivered (Mailpit dev catcher). It has **not** been committed/prod‑built
yet, and a few features (AI, live notification push) require external keys/infra.

---

## Architecture

| Piece | Detail |
|---|---|
| Frontend | Next.js 14, port **3026**. Adapter pattern: `services/adapter.ts` → `serverAdapter` (real) vs `mockAdapter`, switched by `NEXT_PUBLIC_USE_MOCK` (`false`). |
| Backend | jobs-service, port **3002**, Postgres schema `jobs`, DB `baalvion_db`. RS256 auth via `@baalvion/auth-node`. |
| Auth | auth-service (Docker) port **3001**, issuer `baalvion-auth`, aud `baalvion-platform`. Frontend talks to it through a same‑origin **BFF proxy** (`src/app/api/auth/[...path]`) that strips the cookie `Secure` flag for http://localhost. |
| Identity model | Baalvion auth makes every self‑registered user an org *owner*, so the **jobs-service owns portal roles + the employer org, keyed by email**: `system_users` row ⇒ staff role (+ employer org override); otherwise ⇒ candidate (data found by email). Resolved in `middleware/authMiddleware.js` → `req.portal`. |
| Storage | **MinIO** (S3‑compatible) `:9000`, bucket `baalvion-jobs` (public‑read in dev). |
| Email | **Mailpit** dev SMTP catcher — SMTP `:1025`, inbox UI/API **http://localhost:8025**. |

### Run it locally
```bash
# infra (Docker): postgres, redis, auth-service, minio, mailpit  — already in docker-compose
docker compose up -d postgres redis auth-service minio
docker run -d --name baalvion-mailpit --restart unless-stopped --network baalvion-net -p 1025:1025 -p 8025:8025 axllent/mailpit

# backend
cd Backend/services/ecosystem/jobs-service && npm run seed && node index.js   # :3002

# frontend
cd Frontend/Baalvion-Jobs-Portal-main && npm run dev                          # :3026
```

### Demo accounts (password `Passw0rd!23`)
| Role | Email | Lands on |
|---|---|---|
| Admin | `jobs-admin@baalvion.test` | `/dashboard` |
| Recruiter | `jobs-recruiter@baalvion.test` | `/dashboard` |
| Candidate | `jobs-candidate@baalvion.test` | `/my-account` |

Candidates can also self‑register at **`/register`** (auto‑login → `/my-account`).

---

## ✅ Finished (real + verified)

### Backend (jobs-service)
- Booting on RS256 (JWKS + static public key), connected to Postgres, idempotent seed (`npm run seed`).
- Existing domains: jobs, applications, candidates, interviews, campus (colleges/students/placements), analytics, reference data, search.
- **New domains built**: offers, system_users, organizations, payments, notifications, documents, notes, audit_logs, projects, milestones (`controller/workspaceController.js`, `routes/workspaceRoutes.js`).
- **Portal identity**: `/me/profile`, `/me/applications`, `/me/applications/:id`, `/me/offers`, `/me/offers/:id/response`, `/me/interviews`, `/me/documents` — all candidate‑email‑scoped.
- **File uploads → MinIO**: `/uploads/file` (auth), `/uploads/public` (anonymous apply), public‑read bucket.
- **Full analytics** (KPIs, status distribution, 6‑month trend, department hiring) computed from real data.
- Standardized `{success,data,meta}` envelope; write validators relaxed where the UI needed it (candidate fields, optional interviewer_id, optional feedback recommendation).

### Frontend
- Server adapter auto‑unwraps the backend envelope + snake→camel + per‑entity mappers (jobs, candidates, applications, interviews, offers, documents).
- Auth: BFF proxy, single‑flight refresh (fixes a token‑rotation race), role from `/me/profile`, role‑based redirect, candidate registration.
- Public careers (browse + apply wizard with resume upload), candidate `/my-account` (own applications/interviews/offers/documents + app detail), admin/recruiter ATS, campus.

### Verified in a real browser (Playwright/Edge)
- **Candidate**: register/login → `/my-account` → sees **own** application; apply wizard → success + resume stored in MinIO (downloadable); document upload → MinIO; **offer Accept → SENT→ACCEPTED** (application → hired).
- **Recruiter**: login → ATS (candidates, jobs, applications, interviews, offers) all real data.
- **Admin**: all 26 admin routes render real data, 0 console errors; analytics charts; send offer.
- **Email**: "Application Received" (jobs-service) and "Reset your Baalvion password" (auth-service) delivered to Mailpit.
- Backend write contracts verified: status change, interview schedule, feedback, offer, campus college/student, payments, notifications, documents, notes, audit, projects.

---

## ⏳ Pending / to continue

### Needs external keys or infra decisions
- **AI features** (resume scoring, AI matching, `ai/flows`): require a real `GEMINI_API_KEY` (currently blank). The scoring worker is heuristic without it.
- **Live notification push**: notifications are real (DB‑backed, fetched, mark‑read works) but the websocket **push is a no‑op** (`subscribeToNotifications` stub). Live push needs wiring `Backend/services/infrastructure/realtime-service`.

### Production readiness
- **Production build**: `next build`/`tsc` reports ~170 **pre‑existing** TypeScript type‑skew errors (React 18 `ReactNode`/`bigint` + recharts/lucide JSX), and `next.config.js` has no `ignoreBuildErrors`. Dev (`next dev`, SWC) runs fine. Fix = align `@types/react`/recharts versions or set `ignoreBuildErrors`.
- **Containerize jobs-service** (compose already has a `baalvion-jobs` slot) + add **Mailpit to compose** so the whole stack auto‑restarts. _Note: Docker Desktop in this dev env has been unstable (engine crashed twice mid‑session); recovery = elevated `Restart-Service com.docker.service` → `wsl --shutdown` → relaunch Docker Desktop._
- Point frontend env at the **gateway** URLs for deployment (currently direct `localhost:3001/3002`); production email = real SMTP creds (Mailpit is the dev stand‑in).

### Lower priority
- A couple of secondary admin widgets/actions not exhaustively click‑tested (edit/delete/bulk on every entity; settings save; project‑governance, withdrawals).
- Apply form doesn't prefill name/email when a candidate is already logged in.
- No admin UI to grant staff roles (adding a recruiter/admin = `system_users` insert).
- No automated tests for the new code.

---

## Notes
- All work currently lives on branch `release/auth-foundation-v1`.
- `.env` files (DB/JWT/MinIO/SMTP secrets) are intentionally **not** committed.
