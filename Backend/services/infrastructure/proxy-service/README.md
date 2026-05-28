# Baalvion NetStack Backend API

Production-ready multi-tenant backend for Baalvion NetStack.

## Stack

- Node.js + Express
- PostgreSQL 15+ (RLS schema included)
- Redis + BullMQ (optional runtime integration)
- Socket.io
- JWT auth (access 15m, refresh 7d cookie)
- Stripe billing
- Zod validation

## Base URLs

- Primary: `/v1`
- Backward compatible: `/api/v1`

## Quick Start

1. Install dependencies:

```bash
cd Backend
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Start server:

```bash
npm run dev
```

4. Health check:

```bash
GET /health
```

## Current Runtime Model

- The API surface is fully wired.
- Tenant-safe behavior is enforced through `orgId` scoping in service logic.
- `sql/netstack_schema.sql` contains production PostgreSQL tables, indexes, and RLS policies.
- Platform feature routes currently use seeded in-memory store for fast integration testing.

## Authentication

### Login

`POST /v1/auth/login`

Request:

```json
{
  "email": "admin@baalvion.com",
  "password": "Baalvion123!"
}
```

Response data:

```json
{
  "token": "<jwt-access-token>",
  "refreshToken": "<jwt-refresh-token>",
  "user": {
    "id": "user_owner",
    "orgId": "org_demo",
    "email": "admin@baalvion.com",
    "role": "owner"
  }
}
```

Notes:

- Access token expires in 15 minutes.
- Refresh token expires in 7 days and is set in httpOnly cookie.

### Refresh

`POST /v1/auth/refresh`

- Uses refresh cookie (or body fallback).
- Returns new access token and expiration.

### MFA

- `POST /v1/auth/mfa/enable`
- `POST /v1/auth/mfa/verify`
- `POST /v1/auth/mfa/disable`

## Auth Header

All protected endpoints require:

```http
Authorization: Bearer <access_token>
```

Default request headers:

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>   # required for protected routes
```

Optional tenant header fallback:

```http
x-org-id: org_demo
```

`x-org-id` is only used as fallback in compatibility flows. Primary tenant context is extracted from JWT.

## Response Format

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601",
    "latency": 12,
    "version": "v1"
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {},
    "requestId": "uuid"
  }
}
```

### Paginated

```json
{
  "success": true,
  "data": {
    "data": [],
    "total": 1250,
    "page": 1,
    "pageSize": 20,
    "totalPages": 63,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601",
    "latency": 10,
    "version": "v1"
  }
}
```

## Endpoint Reference

All examples below use the standard envelope format from the Response Format section.

### Auth Endpoints

#### POST /v1/auth/register
- Headers: `Content-Type: application/json`
- Req Body:
```json
{ "email": "user@acme.com", "password": "StrongPass123!", "name": "User Name", "role": "viewer", "orgId": "org_demo" }
```
- Response `data`:
```json
{ "id": "user_x", "orgId": "org_demo", "email": "user@acme.com", "name": "User Name", "role": "viewer", "status": "active", "mfaEnabled": false, "emailVerified": false }
```

#### POST /v1/auth/login
- Headers: `Content-Type: application/json`
- Req Body:
```json
{ "email": "admin@baalvion.com", "password": "Baalvion123!" }
```
- Response `data`:
```json
{ "token": "<jwt>", "refreshToken": "<refresh>", "user": { "id": "user_owner", "orgId": "org_demo", "email": "admin@baalvion.com", "role": "owner" } }
```

#### POST /v1/auth/logout
- Headers: none
- Req Body: none
- Response `data`: `null`

#### POST /v1/auth/refresh
- Headers: `Content-Type: application/json` (refresh cookie preferred)
- Req Body:
```json
{ "refreshToken": "optional-if-cookie-exists" }
```
- Response `data`:
```json
{ "token": "<jwt>", "expiresAt": "ISO-8601" }
```

#### POST /v1/auth/forgot-password
- Headers: `Content-Type: application/json`
- Req Body:
```json
{ "email": "user@acme.com" }
```
- Response `data`: `null`

#### POST /v1/auth/reset-password
- Headers: `Content-Type: application/json`
- Req Body:
```json
{ "email": "user@acme.com", "newPassword": "NewStrongPass123!" }
```
- Response `data`: `null`

#### POST /v1/auth/verify-email
- Headers: `Content-Type: application/json`
- Req Body:
```json
{ "email": "user@acme.com" }
```
- Response `data`: `null`

#### POST /v1/auth/mfa/enable
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`:
```json
{ "qrCodeUrl": "data:image/png;base64,...", "secret": "BASE32SECRET", "recoveryCodes": ["code1", "code2"] }
```

#### POST /v1/auth/mfa/verify
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "code": "123456" }
```
- Response `data`:
```json
{ "token": "<jwt>" }
```

#### POST /v1/auth/mfa/disable
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

### User Endpoints

#### GET /v1/users/me
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: user profile object

#### POST /v1/users/change-password
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "oldPassword": "OldPass123!", "newPassword": "NewPass123!" }
```
- Response `data`: `null`

#### GET /v1/users?page=1&pageSize=20
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: paginated users object

#### POST /v1/users/invite
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "email": "new@acme.com", "name": "New User", "role": "viewer" }
```
- Response `data`: user object

#### PUT /v1/users/:id
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body: partial user fields
- Response `data`: updated user object

#### DELETE /v1/users/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

#### PUT /v1/users/:id/role
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "role": "admin" }
```
- Response `data`: updated user object

#### POST /v1/users/:id/suspend
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

#### POST /v1/users/:id/reactivate
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

### Proxy Endpoints

#### GET /v1/proxies
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: paginated proxies object

#### GET /v1/proxies/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: proxy object

#### POST /v1/proxies
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "name": "US Pool", "host": "res-us-01.baalvion.net", "port": 9001, "username": "u", "password": "p", "country": "US", "type": "residential", "protocol": "http", "providerId": "provider_brightdata" }
```
- Response `data`: created proxy object

#### PUT /v1/proxies/:id
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body: proxy patch object
- Response `data`: updated proxy object

#### DELETE /v1/proxies/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

#### POST /v1/proxies/:id/rotate
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: rotated proxy object

#### GET /v1/proxies/:id/logs
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: paginated proxy logs object

#### POST /v1/proxies/test
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body: proxy test payload
- Response `data`:
```json
{ "statusCode": 200, "latency": 145, "ip": "198.51.100.10", "location": "US-edge", "headers": { "x-baalvion-proxy": "ok" } }
```

#### POST /v1/proxies/export
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`:
```json
{ "downloadUrl": "/downloads/proxies-export.csv" }
```

### Preset Endpoints

#### GET /v1/presets
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: preset array

#### POST /v1/presets
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "name": "US Residential HTTP", "country": "US", "type": "residential", "protocol": "http" }
```
- Response `data`: created preset

#### PUT /v1/presets/:id
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body: preset patch
- Response `data`: updated preset

#### DELETE /v1/presets/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

### Usage and Analytics Endpoints

#### GET /v1/usage/summary
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `{ orgId, bandwidthUsed, bandwidthLimit, requests, successRate, avgLatency }`

#### GET /v1/usage/history?days=30
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: usage array

#### GET /v1/analytics/bandwidth
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `[{ date, value }]`

#### GET /v1/analytics/success-rate
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `[{ date, value }]`

#### GET /v1/analytics/top-countries
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `[{ country, code, requests, bandwidth }]`

#### GET /v1/analytics/top-domains
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `[{ domain, requests, bandwidth }]`

#### GET /v1/analytics/latency-distribution
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `[{ bucket, count }]`

#### GET /v1/analytics/anomalies
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `[{ date, metric, value, deviation }]`

#### GET /v1/analytics/export?format=csv
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `{ downloadUrl }`

### Billing Endpoints

#### GET /v1/billing/subscription
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: subscription object

#### GET /v1/billing/plans
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: plan array

#### GET /v1/billing/invoices
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: invoice array

#### GET /v1/billing/invoices/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: invoice object

#### POST /v1/billing/change-plan
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "planSlug": "enterprise" }
```
- Response `data`:
```json
{ "checkoutUrl": "https://..." }
```

#### GET /v1/billing/payment-methods
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: payment method array

#### POST /v1/billing/payment-methods
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "type": "card", "brand": "visa", "last4": "4242", "expiry": "12/29", "isDefault": true }
```
- Response `data`: payment method object

#### DELETE /v1/billing/payment-methods/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

#### GET /v1/billing/usage-forecast
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `{ predicted, limit, trend }`

#### POST /v1/billing/webhook
- Headers: `Content-Type: application/json` (plus provider signature header)
- Req Body: Stripe event payload
- Response `data`: `{ received: true }`

### Organization Endpoints

#### GET /v1/org
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: organization object

#### PUT /v1/org
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body: organization patch
- Response `data`: updated organization object

#### GET /v1/org/members
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: membership array

#### POST /v1/org/members/invite
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "email": "member@acme.com", "name": "Member", "role": "viewer" }
```
- Response `data`: membership object

#### PUT /v1/org/members/:id/role
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "role": "admin" }
```
- Response `data`: membership object

#### DELETE /v1/org/members/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

#### GET /v1/org/roles
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: role array

#### GET /v1/org/activity
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: audit/activity array

### API Key Endpoints

#### GET /v1/api-keys
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: api key array

#### POST /v1/api-keys
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "name": "CI Key" }
```
- Response `data`:
```json
{ "apiKey": { "id": "...", "keyPrefix": "bns_..." }, "rawKey": "bns_..." }
```

#### DELETE /v1/api-keys/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

#### POST /v1/api-keys/:id/revoke
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

### Security Endpoints

#### GET /v1/security/sessions
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: session array

#### DELETE /v1/security/sessions/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

#### GET /v1/security/login-history
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: login event array

#### GET /v1/security/ip-allowlist
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: string array

#### POST /v1/security/ip-allowlist
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "ip": "203.0.113.10" }
```
- Response `data`: string array

#### DELETE /v1/security/ip-allowlist/:ip
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: string array

### Notification Endpoints

#### GET /v1/notifications
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: notification array

#### PUT /v1/notifications/:id/read
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

#### POST /v1/notifications/mark-all-read
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `null`

### Audit Log Endpoints

#### GET /v1/audit-logs
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: paginated audit logs

#### GET /v1/audit-logs/export
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `{ downloadUrl }`

### Support Endpoints

#### GET /v1/support/tickets
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: ticket array

#### POST /v1/support/tickets
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "subject": "Proxy issue", "priority": "high", "description": "Timeout spikes" }
```
- Response `data`: created ticket

#### GET /v1/support/tickets/:id
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: ticket with messages

#### POST /v1/support/tickets/:id/reply
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "message": "Please investigate route US-EAST" }
```
- Response `data`: ticket message

#### PUT /v1/support/tickets/:id/close
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: closed ticket

### Dashboard / Export / Feature Flag Endpoints

#### GET /v1/dashboard/summary
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: dashboard summary object

#### POST /v1/exports/usage-logs
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `{ downloadUrl, expiresAt }`

#### POST /v1/exports/api-logs
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `{ downloadUrl, expiresAt }`

#### POST /v1/exports/account-data
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `{ downloadUrl, expiresAt }`

#### DELETE /v1/account
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `{ requestId, estimatedCompletion }`

#### GET /v1/feature-flags/evaluate?orgId=<id>&planSlug=<slug>
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: `{ "flagKey": true/false }`

### Admin Endpoints (platform_admin role)

All below require `Authorization: Bearer <platform_admin_token>`.

#### GET /v1/admin/dashboard
- Req Body: none
- Response `data`: platform dashboard stats

#### GET /v1/admin/tenants
- Req Body: none
- Response `data`: paginated tenant list

#### GET /v1/admin/tenants/:orgId
- Req Body: none
- Response `data`: tenant detail

#### PUT /v1/admin/tenants/:orgId/suspend
- Req Body: none
- Response `data`: `null`

#### PUT /v1/admin/tenants/:orgId/reactivate
- Req Body: none
- Response `data`: `null`

#### POST /v1/admin/tenants/:orgId/override-bandwidth
- Req Body:
```json
{ "bandwidthLimitGb": 8000 }
```
- Response `data`: updated tenant

#### POST /v1/admin/tenants/:orgId/override-credits
- Req Body:
```json
{ "credits": 5000 }
```
- Response `data`: updated tenant

#### GET /v1/admin/users
- Req Body: none
- Response `data`: paginated user list

#### PUT /v1/admin/users/:id/ban
- Req Body: none
- Response `data`: `null`

#### PUT /v1/admin/users/:id/suspend
- Req Body: none
- Response `data`: `null`

#### PUT /v1/admin/users/:id/reactivate
- Req Body: none
- Response `data`: `null`

#### GET /v1/admin/providers
- Req Body: none
- Response `data`: provider array

#### GET /v1/admin/providers/:id
- Req Body: none
- Response `data`: provider + health history

#### POST /v1/admin/providers
- Req Body: provider object
- Response `data`: created provider

#### PUT /v1/admin/providers/:id
- Req Body: provider patch
- Response `data`: updated provider

#### DELETE /v1/admin/providers/:id
- Req Body: none
- Response `data`: `null`

#### GET /v1/admin/providers/:id/health
- Req Body: none
- Response `data`: health points array

#### GET /v1/admin/providers/:id/incidents
- Req Body: none
- Response `data`: incidents array

#### GET /v1/admin/routing-rules
- Req Body: none
- Response `data`: routing rule array

#### POST /v1/admin/routing-rules
- Req Body: routing rule object
- Response `data`: created rule

#### PUT /v1/admin/routing-rules/:id
- Req Body: routing rule patch
- Response `data`: updated rule

#### DELETE /v1/admin/routing-rules/:id
- Req Body: none
- Response `data`: `null`

#### POST /v1/admin/routing-rules/reorder
- Req Body: reorder payload
- Response `data`: reorder result

#### GET /v1/admin/system/services
- Req Body: none
- Response `data`: service status array

#### GET /v1/admin/system/metrics
- Req Body: none
- Response `data`: `{ cpu, memory, rps, errorRate }`

#### GET /v1/admin/abuse/logs
- Req Body: none
- Response `data`: paginated abuse logs

#### PUT /v1/admin/abuse/logs/:id/resolve
- Req Body: none
- Response `data`: `null`

#### GET /v1/admin/abuse/rate-limits
- Req Body: none
- Response `data`: rate limit config array

#### PUT /v1/admin/abuse/rate-limits/:id
- Req Body: rate limit patch
- Response `data`: updated rate limit config

#### GET /v1/admin/revenue/summary?period=30d
- Req Body: none
- Response `data`: `{ mrr, arr, churn, ltv, arpu }`

#### GET /v1/admin/revenue/cohort-retention
- Req Body: none
- Response `data`: `{ cohorts: [...] }`

#### GET /v1/admin/feature-flags
- Req Body: none
- Response `data`: feature flag array

#### PUT /v1/admin/feature-flags/:key
- Req Body: feature flag patch
- Response `data`: updated feature flag

#### GET /v1/admin/audit-logs
- Req Body: none
- Response `data`: paginated audit logs

#### POST /v1/admin/audit-logs/export
- Req Body: optional export filter payload
- Response `data`: `{ downloadUrl }`

### Legacy Payment Compatibility Endpoints

#### GET /v1/payment/plans
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: plan array

#### GET /v1/payment/payment-methods
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: payment method array

#### POST /v1/payment/order
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "plan_id": "plan_enterprise" }
```
- Response `data`: order payload

#### POST /v1/payment/verify
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body:
```json
{ "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "...", "plan_id": "plan_enterprise" }
```
- Response `data`: verification result

#### GET /v1/payment/transactions
- Headers: `Authorization: Bearer <token>`
- Req Body: none
- Response `data`: transaction array

#### POST /v1/payment/orchestrate
- Headers: `Content-Type: application/json`
- Req Body:
```json
{ "plan_id": 1, "provider": "razorpay" }
```
- Response `data`: provider order orchestration payload

#### POST /v1/payment/orchestrator-verify
- Headers: `Content-Type: application/json`
- Req Body: provider verification payload
- Response `data`: verification status

#### POST /v1/payment/validate-fund-account
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body: `{ account_type, fund_account }`
- Response `data`: provider validation result

#### POST /v1/payment/payout
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Req Body: payout payload
- Response `data`: payout result

#### POST /v1/payment/webhook
- Headers: provider signature header + `Content-Type: application/json`
- Req Body: provider webhook payload
- Response `data`: webhook result

#### GET /v1/payment/provider-health
- Headers: none
- Req Body: none
- Response `data`: provider health object

## WebSocket

- URL: `ws://<host>/v1/ws`
- Auth: `token` in socket auth or query
- On connect, user joins org channel `org:<orgId>`

Event shape:

```json
{
  "type": "event.name",
  "orgId": "org-uuid",
  "payload": {},
  "timestamp": "ISO-8601"
}
```

## Environment Variables

See `.env.example` for full list. Key vars:

- `PORT`
- `API_BASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `REFRESH_COOKIE_NAME`
- `CORS_ORIGINS`
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BCRYPT_ROUNDS`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Security Checklist

- JWT auth with short-lived access token
- Refresh token in httpOnly cookie
- Zod validation on input
- Permission middleware per route
- Tenant scoping by orgId
- Rate limiting middleware
- Security headers via Helmet
- Standardized error envelopes

## Database

- Base schema and legacy tables: `sql/schema.sql`
- Multi-tenant RLS schema: `sql/netstack_schema.sql`

To apply RLS schema:

```bash
psql "$DATABASE_URL" -f sql/netstack_schema.sql
```

## Notes

- This README documents implemented behavior in code today.
- If you want, next step is generating a Postman collection from these routes with sample payloads and auth pre-scripts.
