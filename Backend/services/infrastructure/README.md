# Domain: infrastructure

Ingress, proxy data-plane, realtime transport, notifications — the plumbing.

## Services
| Service | Bounded context | Notes |
|---|---|---|
| `realtime-service` | websocket / realtime transport | remote-JWKS edge verifier |
| `notification-service` | notifications / fan-out | |
| `proxy-service` | proxy control plane | was `backend-Proxy-BaalvionStack` |

> The Go API **`gateway`** is the platform's single public ingress. It is the one
> `ingress: public` descriptor (rule I1) and lives at `Backend/gateway/`, *not*
> under `services/`, because it is the front door rather than a business service.
> Its catalog domain is `infrastructure`.

## Domain rules
- `proxy-platform` / `proxy-gateway` / `edge-service` / `asn-allocation-service` are
  reserved bounded contexts for the proxy/edge buildout.

> Services migrate into this folder per `Backend/MIGRATION.md`.
