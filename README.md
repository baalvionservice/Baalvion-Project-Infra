[README.md](https://github.com/user-attachments/files/28348478/README.md)
# BAALVION

> Enterprise-grade multi-platform infrastructure ecosystem with centralized authentication, gateway federation, and modular service architecture.

---

## Overview

BAALVION is a scalable enterprise infrastructure platform built around a centralized authentication foundation, multi-service backend architecture, and a growing suite of specialized frontend applications. The platform is designed for production-style deployment with security, observability, and multi-tenant isolation as first-class concerns.

---

## Current Milestone — Auth Foundation v1 ✅

The first major backend infrastructure milestone is complete. The platform now ships with a full enterprise authentication and security architecture:

- **RS256 asymmetric JWT** signing and verification
- **Redis-backed session** infrastructure
- **PostgreSQL multi-schema** database architecture
- **HTTPS reverse proxy** routing
- **Secure refresh token rotation**
- **Auth gateway federation**
- **Enterprise security middleware**
- **Queue-based async infrastructure**
- **RBAC foundation**

---

## Architecture

```
Frontend Applications
        ↓
HTTPS Reverse Proxy / Gateway  (:80 / :443)
        ↓
Auth Gateway (:3099)
        ↓
Auth Service (:3001)
        ↓
PostgreSQL (:5432) + Redis (:6379)
```

---

## Platform Applications

| Application        | Port   | Status              |
|--------------------|--------|---------------------|
| Mining             | 3028   | ✅ Live              |
| Company Dashboard  | 3024   | ✅ Live              |
| Elite Circle       | 8081   | ✅ Live              |
| GTI / Trade        | 9003   | ✅ Live              |
| Admin Platform     | 3030   | ✅ Live              |
| Imperialpedia      | 3029   | ✅ Live              |
| IR Baalvion        | 3027   | ✅ Live              |
| Jobs Portal        | 3026   | ✅ Live              |
| ControlTheMarket   | 3034   | ✅ Live              |
| About Baalvion     | 3020   | ✅ Live              |
| Amarise            | 3033   | ✅ Live              |
| Brand Connector    | 3035   | 🔧 In Progress       |
| Law Elite          | 9002   | 🔧 In Progress       |
| Proxy / Gateway    | 8080   | ✅ Live              |

---

## Docker Infrastructure

| Container              | Image                          | Port(s)           | Status                  |
|------------------------|--------------------------------|-------------------|-------------------------|
| baalvion-keycloak      | keycloak:26.0                  | 8088→8080         | ✅ Running               |
| baalvion-auth          | baalvionprojects-auth-service  | 3001              | ⚠️ Restarting (crash loop)|
| baalvion-orders        | baalvionprojects-order-service | 3013              | ⚠️ Restarting (crash loop)|
| baalvion-postgres      | postgres:15-alpine             | 5432              | ✅ Healthy               |
| baalvion-redis         | redis:7-alpine                 | 6379              | ✅ Healthy               |
| baalvion-minio         | minio/minio:latest             | 9000–9001         | ✅ Healthy               |
| baalvion-minio-init    | minio/mc:latest                | —                 | ✅ Exited (0) — completed|
| desktop-control-plane  | kindest/node:v1.34.3           | 6443              | ✅ Running (K8s)         |

---

## Infrastructure Status

| Component             | Status  | Notes                              |
|-----------------------|---------|------------------------------------|
| Auth Gateway          | ✅       |                                    |
| Auth Service          | ⚠️       | Crash loop — needs investigation   |
| Orders Service        | ⚠️       | Crash loop — needs investigation   |
| Redis                 | ✅       | ⚠️ No auth password set            |
| PostgreSQL            | ✅       |                                    |
| HTTPS Reverse Proxy   | ✅       |                                    |
| JWT RS256             | ✅       |                                    |
| Refresh Tokens        | ✅       |                                    |
| Secure Cookies        | ✅       |                                    |
| Security Headers      | ✅       |                                    |
| Queue Infrastructure  | ✅       |                                    |
| Multi-schema DB       | ✅       |                                    |
| Docker Infrastructure | ✅       |                                    |
| Keycloak IAM          | ✅       | Running on :8088                   |
| MinIO Object Storage  | ✅       | Running on :9000–9001              |
| Kubernetes (Kind)     | ✅       | Local cluster running              |

---

## Authentication Flow

```
User Login
    ↓
Gateway Validation
    ↓
Credential Verification
    ↓
RS256 JWT Issued
    ↓
Refresh Cookie Issued
    ↓
Redis Session Stored
    ↓
Protected API Access
```

---

## Database Schemas

The PostgreSQL instance uses isolated schemas per domain:

| Schema          | Domain                                  |
|-----------------|-----------------------------------------|
| `auth`          | Users, sessions, organizations, roles   |
| `about`         | Company and profile content             |
| `brand`         | Brand connector data                    |
| `commerce`      | Orders, payments, invoices              |
| `analytics`     | Event tracking and reporting            |
| `notifications` | Alerts and messaging                    |
| `jobs`          | Job listings and applications           |
| `insiders`      | Forum threads, community features       |
| `real_estate`   | Property listings and documents         |
| `orders`        | Order management service schema         |
| `imperialpedia` | Asset summaries and financial data      |

---

## Known Issues (Active)

> These issues are logged and actively being resolved.

### 🔴 Service Crash Loops
- `baalvion-auth` — Auth service restarting continuously. Likely caused by migration failures or missing env vars on startup.
- `baalvion-orders` — Orders service restarting. `orders.orders_orders` relation does not exist — schema not yet migrated.

### 🟠 Database Migration Errors
- `column "is_featured" does not exist` — `real_estate.properties` index migration ran before column was added.
- `column "org_id" does not exist` — `real_estate.property_documents` index migration ran out of order.
- `column "symbol" does not exist` — `imperialpedia.asset_summaries` index migration ran before column was added.
- `relation "orders.orders_orders" does not exist` — Orders schema tables have not been migrated yet.
- `null value in column "id" of relation "organizations"` — `auth.organizations` table missing `DEFAULT gen_random_uuid()` on `id` column.
- `increment_thread_views` function uses unqualified table name — needs `insiders.forum_threads` prefix.

### 🟠 Application Bugs
- `invalid input syntax for type uuid: "undefined"` — JavaScript `undefined` is being passed to DB queries in the Insiders forum module. Needs null/undefined guards before DB calls.

### 🔴 Security — Redis Exposed
- Redis is bound to `0.0.0.0:6379` with no password. Should have `requirepass` set and binding restricted to Docker internal network only.
- Two cross-protocol scripting attack attempts detected in logs (from `172.19.0.1` — Docker host gateway).

---

## Tech Stack

### Backend
- **Runtime:** Node.js 22
- **Framework:** Express / Custom Gateway Architecture
- **Database:** PostgreSQL 15 (multi-schema)
- **Cache / Sessions:** Redis 7
- **Auth:** JWT (RS256), HTTP-only cookies, refresh token rotation
- **IAM:** Keycloak 26.0
- **Object Storage:** MinIO
- **Process Manager:** PM2

### Infrastructure
- **Containers:** Docker / Docker Compose
- **Reverse Proxy:** HTTPS local gateway (Envoy)
- **Queue:** Async worker infrastructure
- **Orchestration:** Kubernetes (Kind — local cluster)
- **Monorepo:** pnpm workspaces + Turborepo

---

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 22+
- pnpm

### Start Infrastructure

```bash
docker compose up -d
```

### Verify Services

```bash
# Auth Gateway
curl http://localhost:3099/health

# Redis
docker exec -it baalvion-redis redis-cli ping

# PostgreSQL
docker exec -it baalvion-postgres psql -U baalvion -d baalvion_db

# Check all containers
docker ps
```

### Start App Services (PM2)

```bash
# Start all services
.\start.ps1

# Stop all services
.\stop.ps1
```

---

## Branch Strategy

```
main
 └── release/auth-foundation-v1
        ├── feature/frontend-auth-integration
        ├── feature/rbac-system
        ├── feature/api-gateway
        ├── feature/observability
        └── feature/production-deployment
```

---

## Roadmap

### In Progress
- [ ] Fix auth-service and orders-service crash loops
- [ ] Resolve outstanding database migration errors
- [ ] Frontend auth integration across all platform apps
- [ ] RBAC enforcement on protected routes
- [ ] Protected frontend routing
- [ ] Redis security hardening (requirepass + network isolation)

### Upcoming
- [ ] API federation
- [ ] Observability stack (Prometheus, Grafana, distributed tracing)
- [ ] CI/CD pipeline
- [ ] Production deployment pipeline
- [ ] Kubernetes orchestration (full cluster)
- [ ] Multi-tenant isolation
- [ ] Secrets management (Vault or cloud-native)

---

## Security

This repository does not include:

- `.env` files or secrets
- TLS certificates or private keys
- `node_modules`
- Local logs or database dumps

All secrets are managed via environment variables. See `.env.example` for required configuration.

---

## Vision

BAALVION is being built as a scalable enterprise-grade multi-platform infrastructure ecosystem — centralized authentication, gateway federation, modular services, and a growing suite of specialized applications serving distinct verticals across finance, real estate, community, media, and commerce.

---

*Auth Foundation v1 — Backend infrastructure milestone complete.*
