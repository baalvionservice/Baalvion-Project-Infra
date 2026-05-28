# Law Elite — Backend Microservices

> Relocated from `Frontend/Law-Elite-Network-main/backend/` → `Backend/law-elite/`
> so that frontends contain only frontend code and all backends live under `Backend/`.

A self-contained microservices cluster fronted by an API gateway.

## Workflow / architecture

```
                 ┌──────────────────────────────────────────────┐
  Law-Elite SPA  │              gateway  (Express, :3000)         │
  (:9002)  ─────▶│  http-proxy-middleware + JWT auth.middleware   │
                 └──────────────────────────────────────────────┘
                     │ /api/auth, /api/users      │ /api/cases     │ /api/payments
                     ▼ (public + protected)       ▼ (protected)    ▼ (protected)
            user-service (Express, :3001)  case-service (:3002)  payment-service (Java/Spring, :8080)
```

| Service | Path | Runtime | Port | Gateway route |
|---------|------|---------|------|---------------|
| gateway | `gateway/` | Node + Express 4 | 3000 | — (entry) |
| user-service | `services/user-service/` | Node + Express 4 | 3001 | `/api/auth` (public), `/api/users` (auth) |
| case-service | `services/case-service/` | Node + Express 4 | 3002 | `/api/cases` (auth) |
| payment-service | `services/payment-service/` | Java / Spring Boot | 8080 | `/api/payments` (auth) |

- The **gateway** terminates auth (`gateway/src/middleware/auth.middleware.js`, `JWT_SECRET`) and proxies to the
  services via the `*_SERVICE_URL` env vars (see `docker-compose.yml`).
- Each service is independently built (own `Dockerfile`) and runs `node src/server.js` (Java service runs Spring Boot).

## Run

```bash
cd Backend/law-elite
docker compose up --build        # gateway :3000 + user :3001 + case :3002 + payment :8080
```

## Notes / follow-ups
- The Law-Elite frontend currently runs on **mock services** (`USE_MOCK=true` in `src/services/*Service.ts`);
  point it at the gateway (`:3000`) to use this backend, or migrate these domains into the unified
  **Baalvion OS** (`Backend/baalvion-os`) backend.
- Overlaps with the top-level `Backend/law-service` (a separate Express 5 service for the same domain).
  These two should eventually be consolidated (recommended target: Baalvion OS) to satisfy the
  "one centralized backend / no duplicate systems" rule.
