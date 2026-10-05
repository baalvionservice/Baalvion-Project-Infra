# community.marketunderworld.com: roles, test accounts and test plan

Status: backend and frontend are live (deployed 2026-10-05). KYC is intentionally off until the
encryption key is added. Passwords are **not** in this file; they live only in
`~/Documents/baalvion-community-test-accounts.txt` on the owner's Mac (mode 600).

## 1. Roles

| Role | How it is assigned | Can do |
|---|---|---|
| Visitor | not signed in | browse clubs, locals, education, shop; guest-list requests; see announcements |
| Member | sign up at `/auth/registration` | bookings, `/support` tickets, dashboards, notifications |
| Moderator | super admin grants at `/admin/staff` | bookings + applications, verification queues, support tickets |
| Admin | token role `country_admin`, or granted at `/admin/staff` | everything in the console except KYC and Staff & Access |
| Super admin | token role `super_admin` / `platform_admin` (never grantable via the API) | everything, incl. KYC, staff grants, audit log |

Permission matrix and routes: `Backend/services/ecosystem/community-service/RBAC.md`.

## 2. Test accounts

All sign in at `https://community.marketunderworld.com/auth/signin` (email + password). Emails are
plus-aliases of the owner mailbox, so verification mail lands in one inbox.

| Role | Email | User id (token `sub`) | Notes |
|---|---|---|---|
| Member | infra.baalvion+cmu-member@gmail.com | 134 | plain account |
| Moderator | infra.baalvion+cmu-moderator@gmail.com | 135 | a plain member until granted `moderator` |
| Admin | infra.baalvion+cmu-admin@gmail.com | 136 | a plain member until granted `admin` |
| Super admin | infra.baalvion+cmu-super@gmail.com | assigned on creation | created with `scripts/bootstrapSuperAdmin.js` (section 3) |

User ids are numbers in production (not UUIDs). Accounts start with `email_verified: false`.

## 3. Creating the test super admin

Roles cannot be self-assigned. The platform's sanctioned path is
`Backend/services/identity/auth-service/scripts/bootstrapSuperAdmin.js` (idempotent: creates the
user, an org and a `super_admin` membership; the token then carries `roles: ["super_admin"]`).
Run `~/Documents/create-test-super-admin.sh` on the Mac; it reads the password from the credentials
file and runs the script in the identity container over SSH. Output is JSON with the new user id.

## 4. Granting moderator and admin

1. Sign in as the super admin and open `/admin/staff`.
2. Paste the user id (135 for the moderator, 136 for the admin), a display name, pick the tier, Grant.
3. The grantee signs out and in again (or reloads) to see the new sidebar.

## 5. Test plan (expected results)

1. **Visitor**: `/clubs`, `/locals`, `/education` load; `/support` and `/admin` go to sign-in.
2. **Member (134)**: `/support` opens a ticket; `/admin` shows the sign-in or a "can't open this page" panel.
3. **Moderator (135)**: sidebar shows only queues (guest list, applications, verification) and Support
   Tickets; `/admin/bounty`, `/admin/system/audit`, `/admin/staff` show "your staff level can't open this page".
4. **Admin (136)**: sees bounty, announcements, audit; does **not** see Identity KYC or Staff & Access.
5. **Super admin**: sees everything, including Staff & Access and the audit log.
6. **Support round trip**: member opens a ticket; moderator assigns and replies; member sees "We replied".
7. **Announcement**: admin publishes at `/admin/system/announcements`; banner appears for a signed-out
   visitor; dismissing it persists across reload.
8. **Audit**: `/admin/system/audit` lists the grants, reply and announcement.

API spot checks (replace `$T` with a login token):
```
B=https://api.baalvion.com/api/v1/community
curl -s -H "Authorization: Bearer $T" $B/staff/me          # tier + permissions
curl -s -H "Authorization: Bearer $T" $B/support/tickets/mine
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $T" $B/admin/overview   # 403 for members
```

## 6. Results so far (2026-10-05, production)

Verified with a real numeric-id member token: bookings/mine, notifications, support tickets (create,
read, close), kyc/me, staff/me return 200; admin overview, audit, staff and support queue return 403.
Not yet verified: grants and the moderator/admin/super consoles (need the super admin).

## 7. Known issues and open items

- **Numeric user ids.** The auth service issues numeric ids (`sub: "134"`). Every user-id column in the
  new tables is `VARCHAR(64)`. A database created before PR #712 has UUID columns and must be converted with
  `ALTER TABLE ... ALTER COLUMN ... TYPE varchar(64) USING col::text` (done on production). The older
  community tables (memberships, threads, direct messages) still use UUID user ids and are untested with real tokens.
- **KYC is off** (`/kyc` answers 503) until `KYC_ENCRYPTION_KEY` is set; do not post `requiresKyc` listings yet.
- **Emails.** Verification/reset emails use the generic template and may carry a broken link until PR #710
  (ritual theme + link fix) is merged and auth/notification are redeployed; set
  `FRONTEND_URL_COMMUNITY=https://community.marketunderworld.com` on auth-service.
- `ADMIN_ALERT_EMAIL` is unset, so admins get no email alerts (the in-app queues still work).
- commerce-service and order-service were not redeployed (only needed for KYC-gated products).
- Bounty tasks are seeded as drafts; write rules before publishing.

## 8. Rollback

- Backend: `docker tag baalvion-community-service:v1-uuid baalvion-community-service:local` (or `:previous`
  for the pre-nightlife image), then `docker compose -f docker-compose.data.yml -f docker-compose.app.yml -f
  docker-compose.caddytest.yml --profile community up -d --no-build --no-deps app-community` in `/opt/baalvion/stack`.
  Note `v1-uuid` fails on numeric ids; prefer the current image.
- Frontend: `wrangler rollback`. Backup of the schema before launch: `/opt/baalvion/backups/community-pre-nightlife-20261005.dump`.
