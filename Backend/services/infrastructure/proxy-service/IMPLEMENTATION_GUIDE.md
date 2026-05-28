# Baalvion NetStack Backend - Implementation Guide

## Overview

This is a **production-ready, multi-tenant proxy SaaS backend** for "Baalvion NetStack" built on:

- **Express.js** (Node.js)
- **PostgreSQL 15+** with Row-Level Security (RLS) for tenant isolation
- **Redis** (optional) for sessions, rate limiting, and real-time metrics
- **BullMQ** (optional) for async job queues
- **Socket.io** for WebSocket real-time events
- **JWT** (15min access token, 7-day refresh token in httpOnly cookies)
- **Stripe** for billing
- **Zod** for request validation
- **Bcrypt** (cost factor 12) for password hashing
- **Speakeasy/QRCode** for MFA (TOTP)

---

## Architecture

### Multi-Tenant Isolation
Every endpoint extracts `req.auth.orgId` from the JWT and:
1. Validates user has permission (via RBAC)
2. Filters all data by `orgId`
3. Logs the action to audit trails
4. Publishes events to the org's WebSocket room

### Admin Scope
Platform admins (`requirable with `requirePlatformAdmin` middleware) manage:
- Tenant onboarding/suspension
- Provider health and incidents
- System routing rules
- Revenue and feature flags
- Abuse and rate limit policies

---

## Core Services

### 1. **AuthService** (`service/authService.js`)
Handles JWT flows, MFA, and password resets.

**Key Methods:**
- `login({ email, password, ipAddress, userAgent })` → `{ token, refreshToken, user }`
- `refresh(refreshToken)` → `{ token, expiresAt }`
- `enableMfa(auth)` → `{ qrCodeUrl, secret, recoveryCodes }`
- `verifyMfa(auth, code)` → `{ token }`
- `disableMfa(auth)`
- `forgotPassword({ email })`
- `resetPassword({ email, newPassword })`

**Stores** user sessions, login history, and creates audit logs and notifications.

---

### 2. **UserService** (`service/userService.js`)
Tenant-scoped user management.

**Key Methods:**
- `createUser(userData)` → User
- `getUserProfile(userId)` → User (sanitized)
- `listUsers(auth, query)` → PaginatedResponse
- `inviteUser(auth, { email, name, role })` → User
- `updateUserRole(auth, id, role)` → User (emits event)
- `suspendUser(auth, id)` / `reactivateUser(auth, id)`

---

### 3. **ProxyService** (`service/proxyService.js`)
Proxy pool and rotation management.

**Key Methods:**
- `listProxies(auth, query)` → PaginatedResponse
- `createProxy(auth, payload)` → Proxy
- `rotateProxy(auth, id)` → Proxy (new IP from wholesaler adapter)
- `testProxy(auth, payload)` → `{ statusCode, latency, ip, location }`
- `listPresets(auth)` → Preset[]
- `createPreset(auth, payload)` → Preset

**Wholesaler Adapters:**
- `BrightDataAdapter`
- `OxylabsAdapter`
- `SmartproxyAdapter`

Each implements:
```javascript
async allocateIP(options: { country, type, protocol })
async rotateIP(proxyId)
async healthCheck() → { latency, successRate, status }
async getUsage(period)
```

---

### 4. **AnalyticsService** (`service/analyticsService.js`)
Real-time and historical usage + performance data.

**Key Methods:**
- `getUsageSummary(auth)` → `{ bandwidthUsed, bandwidthLimit, requests, successRate, avgLatency }`
- `listUsageHistory(auth, days)` → UsageRecord[]
- `getBandwidthSeries(auth)` / `getSuccessRateSeries(auth)` → TimeSeries[]
- `getTopCountries(auth)` / `getTopDomains(auth)` → TopN[]
- `getLatencyDistribution(auth)` → Histogram
- `getAnomalies(auth)` → AnomalyAlert[]
- `getDashboardSummary(auth)` → Dashboard

---

### 5. **BillingService** (`service/billingService.js`)
Stripe integration with subscription and invoice lifecycle.

**Key Methods:**
- `getSubscription(auth)` → Subscription
- `getInvoices(auth)` → Invoice[]
- `changePlan(auth, planSlug)` → `{ checkoutUrl }`
- `addPaymentMethod(auth, payload)` → PaymentMethod
- `removePaymentMethod(auth, id)`
- `getUsageForecast(auth)` → `{ predicted, limit, trend }`
- `handleWebhook(stripePayload)` (updates subscriptions on stripe events)

**Subscription States:**
- `trial` → `active` → `grace` → `suspended` → `cancelled`

**Usage Enforcement** (based on plan):
- 80% threshold → emit `usage.threshold.warning`
- 90% threshold → emit `usage.threshold.critical`
- 100% → enforce `blocked` | `throttled` | `pay-as-you-go`

---

### 6. **NotificationService** (`service/notificationService.js`)
In-app notification management.

**Key Methods:**
- `listNotifications(auth)` → Notification[]
- `markRead(auth, id)`
- `markAllRead(auth)`

---

### 7. **AdminService** (`service/adminService.js`)
Platform-wide operations (admin-only endpoints).

**Key Methods:**
- `getDashboard()` → PlatformStats
- `listTenants(query)` / `getTenant(orgId)` → Organization
- `updateTenantStatus(orgId, status)` → Organization
- `overrideTenantLimits(orgId, { bandwidthLimitGb, credits })`
- `listProviders()` → Provider[]
- `createProvider(payload)` / `updateProvider(id, payload)` / `deleteProvider(id)`
- `listRoutingRules()` / `createRoutingRule(payload)` / `updateRoutingRule(id, payload)`
- `getSystemServices()` / `getSystemMetrics()` → `{ cpu, memory, rps, errorRate }`
- `getRevenueSummary(period)` → `{ mrr, arr, churn, ltv, arpu }`
- `getFeatureFlags()` / `updateFeatureFlag(key, payload)`

---

## Complete API Surface

### **Authentication** (POST /v1/auth/*)
| Endpoint | Auth? | Description |
|----------|-------|-------------|
| `POST /auth/login` | No | `{ email, password }` → `{ token, refreshToken, user }` |
| `POST /auth/logout` | Yes | Clear session |
| `POST /auth/refresh` | No | `{ refreshToken }` → `{ token, expiresAt }` |
| `POST /auth/forgot-password` | No | `{ email }` → void |
| `POST /auth/reset-password` | No | `{ email, newPassword }` → void |
| `POST /auth/verify-email` | No | `{ email }` → void |
| `POST /auth/mfa/enable` | Yes | → `{ qrCodeUrl, secret, recoveryCodes }` |
| `POST /auth/mfa/verify` | Yes | `{ code }` → `{ token }` |
| `POST /auth/mfa/disable` | Yes | → void |

### **Proxies** (GET/POST/PUT/DELETE /v1/proxies/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /proxies` | `proxy:view` | PaginatedResponse<Proxy> |
| `POST /proxies` | `proxy:create` | CreateProxy → Proxy |
| `GET /proxies/:id` | `proxy:view` | Proxy |
| `PUT /proxies/:id` | `proxy:update` | UpdateProxy → Proxy |
| `DELETE /proxies/:id` | `proxy:delete` | void |
| `POST /proxies/:id/rotate` | `proxy:update` | Proxy (new IP) |
| `GET /proxies/:id/logs` | `proxy:view` | PaginatedResponse<ProxyLog> |
| `POST /proxies/test` | `proxy:view` | TestProxy → `{ statusCode, latency, ip, location }` |
| `POST /proxies/export` | `proxy:view` | `{ downloadUrl }` |

### **Presets** (GET/POST/PUT/DELETE /v1/presets/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /presets` | `preset:view` | Preset[] |
| `POST /presets` | `preset:create` | CreatePreset → Preset |
| `PUT /presets/:id` | `preset:update` | UpdatePreset → Preset |
| `DELETE /presets/:id` | `preset:delete` | void |

### **Usage & Analytics** (/v1/usage/*, /v1/analytics/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /usage/summary` | `usage:view` | UsageRecord |
| `GET /usage/history?days=30` | `usage:view` | UsageRecord[] |
| `GET /analytics/bandwidth?range=7d` | `analytics:view` | `[{ date, value }]` |
| `GET /analytics/success-rate?range=7d` | `analytics:view` | `[{ date, value }]` |
| `GET /analytics/top-countries?limit=10` | `analytics:view` | Country[] |
| `GET /analytics/top-domains?limit=10` | `analytics:view` | Domain[] |
| `GET /analytics/latency-distribution` | `analytics:view` | `[{ bucket, count }]` |
| `GET /analytics/anomalies` | `analytics:view` | Anomaly[] |
| `GET /analytics/export?format=csv` | `analytics:view` | `{ downloadUrl }` |

### **Billing** (/v1/billing/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /billing/subscription` | `billing:view` | Subscription |
| `GET /billing/invoices` | `billing:view` | Invoice[] |
| `GET /billing/invoices/:id` | `billing:view` | Invoice |
| `POST /billing/change-plan` | `billing:update` | `{ planSlug }` → `{ checkoutUrl }` |
| `POST /billing/payment-methods` | `billing:update` | PaymentMethod → PaymentMethod |
| `DELETE /billing/payment-methods/:id` | `billing:update` | void |
| `GET /billing/usage-forecast` | `billing:view` | `{ predicted, limit, trend }` |
| `POST /billing/webhook` | No (Stripe verify) | Stripe event handler |

### **Organization** (/v1/org/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /org` | `org:view` | Organization |
| `PUT /org` | `org:update` | UpdateOrg → Organization |
| `GET /org/members` | `org:member:view` | OrgMembership[] |
| `POST /org/members/invite` | `org:member:invite` | InviteUser → User |
| `PUT /org/members/:id/role` | `org:member:update` | `{ role }` → OrgMembership |
| `DELETE /org/members/:id` | `org:member:remove` | void |
| `GET /org/roles` | `org:view` | Role[] |
| `GET /org/activity` | `org:view` | SystemEvent[] |

### **Users** (/v1/users/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /users` | `user:view` | PaginatedResponse<User> |
| `POST /users/invite` | `user:invite` | InviteUser → User |
| `PUT /users/:id` | `user:update` | UpdateUser → User |
| `DELETE /users/:id` | `user:delete` | void |
| `PUT /users/:id/role` | `user:update` | `{ role }` → User |
| `POST /users/:id/suspend` | `user:suspend` | void |
| `POST /users/:id/reactivate` | `user:suspend` | void |

### **API Keys** (/v1/api-keys/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /api-keys` | `apikey:view` | ApiKey[] (keyHash hidden) |
| `POST /api-keys` | `apikey:create` | `{ name }` → `{ apiKey, rawKey }` (rawKey shown ONCE) |
| `DELETE /api-keys/:id` | `apikey:revoke` | void |
| `POST /api-keys/:id/revoke` | `apikey:revoke` | void |

### **Security** (/v1/security/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /security/sessions` | `security:view` | Session[] |
| `DELETE /security/sessions/:id` | `security:update` | void |
| `GET /security/login-history` | `security:view` | LoginEvent[] |
| `GET /security/ip-allowlist` | `security:view` | string[] |
| `POST /security/ip-allowlist` | `security:update` | `{ ip }` → string[] |
| `DELETE /security/ip-allowlist/:ip` | `security:update` | void |

### **Notifications** (/v1/notifications/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /notifications` | `notification:view` | Notification[] |
| `PUT /notifications/:id/read` | `notification:update` | void |
| `POST /notifications/mark-all-read` | `notification:update` | void |

### **Audit Logs** (/v1/audit-logs/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /audit-logs` | `audit:view` | PaginatedResponse<AuditEvent> |
| `GET /audit-logs/export` | `audit:view` | `{ downloadUrl }` |

### **Support Tickets** (/v1/support/tickets/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /support/tickets` | `support:view` | Ticket[] |
| `POST /support/tickets` | `support:view` | CreateTicket → Ticket |
| `GET /support/tickets/:id` | `support:view` | Ticket (with messages) |
| `POST /support/tickets/:id/reply` | `support:reply` | `{ message }` → TicketMessage |
| `PUT /support/tickets/:id/close` | `support:reply` | → Ticket (status=closed) |

### **Dashboard** (/v1/dashboard/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /dashboard/summary` | `dashboard:view` | DashboardVO with metrics |

### **Exports & GDPR** (/v1/exports/*, /v1/account)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `POST /exports/usage-logs` | `export:create` | `{ downloadUrl, expiresAt }` |
| `POST /exports/api-logs` | `export:create` | `{ downloadUrl, expiresAt }` |
| `POST /exports/account-data` | `export:create` | `{ downloadUrl, expiresAt }` |
| `DELETE /account` | Yes | `{ requestId, estimatedCompletion }` |

### **Feature Flags** (/v1/feature-flags/*)
| Endpoint | Permissions | Description |
|----------|-------------|-------------|
| `GET /feature-flags/evaluate?orgId&planSlug` | Yes | Record<flagKey, boolean> |

### **Admin** (POST /v1/admin/*)
Admin endpoints require `platform_admin` role.

| Endpoint | Description |
|----------|-------------|
| `GET /admin/dashboard` | PlatformStats |
| `GET /admin/tenants?page&status&plan&search` | PaginatedResponse<Tenant> |
| `GET /admin/tenants/:orgId` | Tenant (full detail) |
| `PUT /admin/tenants/:orgId/suspend` | void |
| `PUT /admin/tenants/:orgId/reactivate` | void |
| `POST /admin/tenants/:orgId/override-bandwidth` | void |
| `POST /admin/tenants/:orgId/override-credits` | void |
| `GET /admin/users?page&status` | PaginatedResponse<User> |
| `PUT /admin/users/:id/ban` / `/suspend` / `/reactivate` | void |
| `GET /admin/providers` | Provider[] |
| `GET /admin/providers/:id` | Provider + health history |
| `POST /admin/providers` | Provider |
| `PUT /admin/providers/:id` | Provider |
| `DELETE /admin/providers/:id` | void |
| `GET /admin/providers/:id/health` | ProviderHealthPoint[] |
| `GET /admin/providers/:id/incidents` | ProviderIncident[] |
| `GET /admin/routing-rules` | RoutingRule[] |
| `POST /admin/routing-rules` | RoutingRule |
| `PUT /admin/routing-rules/:id` | RoutingRule |
| `DELETE /admin/routing-rules/:id` | void |
| `POST /admin/routing-rules/reorder` | void |
| `GET /admin/system/services` | SystemService[] |
| `GET /admin/system/metrics` | `{ cpu, memory, rps, errorRate }` |
| `GET /admin/abuse/logs?resolved=false` | PaginatedResponse<AbuseLog> |
| `PUT /admin/abuse/logs/:id/resolve` | void |
| `GET /admin/abuse/rate-limits` | RateLimitConfig[] |
| `PUT /admin/abuse/rate-limits/:id` | RateLimitConfig |
| `GET /admin/revenue/summary?period=30d` | `{ mrr, arr, churn, ltv, arpu }` |
| `GET /admin/revenue/cohort-retention` | `{ cohorts }` |
| `GET /admin/feature-flags` | FeatureFlagDefinition[] |
| `PUT /admin/feature-flags/:key` | FeatureFlagDefinition |
| `GET /admin/audit-logs?action&user&dateFrom` | PaginatedResponse<AuditEvent> |
| `POST /admin/audit-logs/export` | `{ downloadUrl }` |

---

## WebSocket

**URL:** `wss://api.baalvion.com/v1/ws?token=<jwt>`

**Authentication:** JWT in query or handshake auth object.

**Auto-Subscribe:** On connect, user joins `org:<orgId>` room.

**Event Format:**
```json
{
  "type": "event.name",
  "orgId": "org-uuid",
  "payload": {},
  "timestamp": "ISO 8601"
}
```

**Emitted Events:**
- `proxy.health.changed`
- `usage.updated`, `usage.threshold.warning` (80%), `usage.threshold.critical` (90%)
- `enforcement.warning`, `enforcement.throttled`, `enforcement.blocked`
- `provider.incident.started`, `provider.incident.resolved`
- `plan.upgraded`, `plan.cancelled`
- `user.invited`, `user.role.changed`
- `apikey.created`, `apikey.revoked`
- `notification.new`

---

## Database Schema

PostgreSQL 15+ with Row-Level Security (RLS).

### **Tables**
- `organizations` (multi-tenant root)
- `users` (scoped by org)
- `org_memberships` (role assignments)
- `proxies`, `proxy_logs`, `presets` (proxy management)
- `providers` (wholesaler integrations)
- `subscriptions`, `invoices`, `payment_methods` (billing)
- `usage_records`, `api_keys` (tracking)
- `sessions`, `notifications`, `audit_logs` (ops)
- `support_tickets`, `ticket_messages` (support)
- `abuse_logs`, `feature_flags` (compliance & features)

### **RLS Policies**
Each table has a policy that filters by `current_org_id()` set per connection:
```sql
SET app.current_org_id = $1;
```

---

## Configuration

### **.env** (Copy from `.env.example`)

```env
PORT=4000
API_BASE_URL=http://localhost:4000

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=baalvion
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_COOKIE_NAME=baalvion_refresh

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
REDIS_URL=redis://127.0.0.1:6379
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BCRYPT_ROUNDS=12

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

---

## Running the Backend

### **Development**
```bash
npm install
npm run dev
```
Runs with nodemon on port 4000.

### **Production**
```bash
npm install --production
npm start
```
Runs Node.js directly on port (from config).

### **Initialize Database**

1. Create PostgreSQL database:
```sql
CREATE DATABASE baalvion;
```

2. Execute schema:
```bash
psql -U postgres -d baalvion -f sql/netstack_schema.sql
```

3. (Optional) Load sample data from `service/platformStore.js` (in-memory seed on first request).

---

## Key Features

✅ **Multi-tenant isolation** – Every endpoint filters by orgId + RLS  
✅ **RBAC permissions** – Fine-grained permission checks on all routes  
✅ **JWT short-lived tokens** – 15min access + 7day refresh (httpOnly)  
✅ **MFA (TOTP)** – QR-code generation + recovery codes  
✅ **Rate limiting** – Per-IP and per-user buckets  
✅ **Audit logging** – All write operations logged  
✅ **WebSocket events** – Real-time notifications to org rooms  
✅ **Wholesaler adapters** – BrightData, Oxylabs, Smartproxy  
✅ **Stripe integration** – Subscription lifecycle + webhooks  
✅ **API key management** – SHA-256 hashed, show raw key once  
✅ **Request validation** – Zod schemas on all POST/PUT  
✅ **Standard response format** – All responses wrapped in `{ success, data/error, meta }`  
✅ **Error handling** – AppError class with status codes + error codes  
✅ **Admin dashboard** – Platform-wide stats, tenant/provider/revenue management  

---

## Demo Credentials

The system seeds a demo tenant on first request:

- **Admin Email:** `admin@baalvion.com`
- **Demo Password:** `Baalvion123!`
- **Org Slug:** `acme-global`
- **Plan:** `enterprise`

Access via:
```bash
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@baalvion.com","password":"Baalvion123!"}'
```

Returns:
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "user_owner", "email": "admin@baalvion.com", "role": "owner", ... }
  },
  "meta": { "requestId": "uuid", "timestamp": "ISO", "latency": 45, "version": "v1" }
}
```

---

## Troubleshooting

### Port already in use
```bash
npx lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows
```

### Redis required but unavailable
Queue initialization is optional. If not provided, background jobs will be skipped (health checks, usage aggregation, etc.). Log message explains this.

### Stripe webhooks not firing
Ensure `STRIPE_WEBHOOK_SECRET` is valid and webhook is configured on Stripe dashboard to post to `/v1/billing/webhook`.

### RLS policies blocking queries
Set org context on the PostgreSQL connection:
```sql
SET app.current_org_id = 'org-uuid';
```

---

## Next Steps

1. **Connect to real PostgreSQL:** Update `.env` with credentials, run schema, disable in-memory seeding.
2. **Set up Redis:** Provide `REDIS_URL` to enable queues and caching.
3. **Configure Stripe:** Add API keys to handle production billing.
4. **Deploy admin UI:** Use `/v1/admin/...` endpoints in a Remix/Next.js app.
5. **Implement proxy health cron:** Run every 30s via BullMQ to check provider status.
6. **Notify customers:** Emit usage warnings → trigger email via queue.

---

## Permissions Matrix

| Role | Key Permissions |
|------|-----------------|
| `platform_admin` | `*` (all) |
| `owner` | `*` (all within org) |
| `admin` | proxy:*, preset:*, billing:*, usage:*, analytics:*, org:*, user:*, apikey:*, security:*, notification:*, audit:*, support:*, dashboard:*, export:*, feature-flag:view |
| `finance` | billing:view, billing:update, analytics:view, audit:view |
| `support` | proxy:view, usage:view, analytics:view, support:*, notification:view |
| `viewer` | proxy:view, preset:view, usage:view, analytics:view, org:view, user:view, billing:view, dashboard:view, notification:view, audit:view |
| `restricted` | dashboard:view |

---

## API Response Format

All endpoints follow a consistent envelope:

**Success:**
```json
{
  "success": true,
  "data": { "id": "...", ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-02T...",
    "latency": 45,
    "version": "v1"
  }
}
```

**Paginated:**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "total": 1250,
    "page": 1,
    "pageSize": 20,
    "totalPages": 63,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "PROXY_LIMIT_EXCEEDED",
    "message": "You have reached your proxy limit.",
    "details": { "limit": 100, "current": 100 },
    "requestId": "uuid"
  }
}
```

---

## Testing

To validate the API locally:

```bash
# Terminal 1: Start Backend
cd Backend
npm run dev

# Terminal 2: Test endpoints
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@baalvion.com","password":"Baalvion123!"}'

export TOKEN="<token from response>"

curl -X GET http://localhost:4000/v1/proxies \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:4000/v1/analytics/bandwidth \
  -H "Authorization: Bearer $TOKEN"

curl -X GET "http://localhost:4000/v1/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN"  # Fails: user not platform admin
```

---

## File Structure

```
Backend/
  ├── config/
  │   ├── appConfig.js              # Central config management
  │   └── config.json               # Sequelize (legacy)
  ├── controller/
  │   ├── authController.js         # Auth endpoints
  │   ├── userController.js         # User endpoints
  │   ├── platformController.js     # Proxy, billing, analytics...
  │   ├── adminController.js        # Admin-only endpoints
  │   └── paymentController.js      # Legacy Razorpay (kept)
  ├── middleware/
  │   ├── authMiddleware.js         # JWT verification + req.auth
  │   ├── permissionMiddleware.js   # RBAC enforcer
  │   ├── validate.js               # Zod validation wrapper
  │   ├── errorMiddleware.js        # Error → StandardResponse
  │   ├── requestContext.js         # Request ID + timing
  │   └── rateLimit.js              # In-memory rate limiting
  ├── routes/
  │   ├── authRoutes.js             # /v1/auth/* mapped
  │   ├── userRoutes.js             # /v1/users/* mapped
  │   ├── platformRoutes.js         # /v1/proxies, /v1/analytics...
  │   ├── v1.js                     # /v1 router aggregator
  │   └── admin/
  │       └── platformAdminRoutes.js # /v1/admin/* mapped
  ├── service/
  │   ├── authService.js            # JWT + MFA logic
  │   ├── userService.js            # Tenant-scoped users
  │   ├── proxyService.js           # Proxy management
  │   ├── analyticsService.js       # Metrics aggregation
  │   ├── billingService.js         # Stripe lifecycle
  │   ├── notificationService.js    # In-app notifications
  │   ├── adminService.js           # Platform operations
  │   ├── rbac.js                   # Permission matrix
  │   ├── eventBus.js               # EventEmitter + Socket.io
  │   ├── platformStore.js          # In-memory data + seed
  │   ├── queueService.js           # BullMQ initialization
  │   ├── socketService.js          # Socket.io setup
  │   └── providers/
  │       ├── brightDataAdapter.js
  │       ├── oxylabsAdapter.js
  │       └── smartproxyAdapter.js
  ├── utils/
  │   ├── response.js               # sendSuccess, sendError
  │   ├── errors.js                 # AppError class
  │   ├── crypto.js                 # Crypto helpers
  │   └── jwtserver.js              # Token gen/verify
  ├── validators/
  │   └── schemas.js                # Zod schemas
  ├── sql/
  │   ├── schema.sql                # Legacy (unused)
  │   └── netstack_schema.sql       # Production RLS schema
  ├── index.js                      # Server bootstrap
  ├── package.json                  # Dependencies
  ├── .env.example                  # Config template
  └── IMPLEMENTATION_GUIDE.md       # This file
```

---

**Built with ❤️ for Enterprise Proxy SaaS**
