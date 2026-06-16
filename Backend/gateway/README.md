<div align="center">

<img src="assets/banner.svg" alt="Gateway — Baalvion Platform" width="100%">

<br/>
<br/>

**The proxy data plane — an HTTP/HTTPS-CONNECT + SOCKS5 forward proxy in Go that authenticates customers, routes through upstream providers, meters real bandwidth, and streams usage events.**

![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgx_v5-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-go--redis_v9-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-metrics-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-distroless-2496ED?style=for-the-badge&logo=docker&logoColor=white)

<sub>[Overview](#overview) · [Architecture](#architecture) · [Build &amp; Test](#build--test) · [Running](#running) · [Usage](#usage) · [Ports](#ports) · [Providers](#provider-model) · [Project Structure](#project-structure)</sub>

</div>

---

## Overview

This is the **data plane** of the Baalvion proxy network: a forward proxy that
sits between customer traffic and upstream proxy providers. It authenticates each
request against the control-plane database, applies rate and concurrency limits,
allocates sticky sessions, routes through the best available provider, meters the
bytes that flow, and emits usage events.

- **Domain / tier:** Infrastructure (data plane), distinct from the API ingress in
  [`Backend/infra/api-gateway/`](../infra/api-gateway/).
- **Module:** `github.com/baalvion/gateway`
- **Entry point:** [`cmd/gateway/main.go`](cmd/gateway/main.go)
- **Default ports:** `:10000` (HTTP + HTTPS CONNECT), `:1080` (SOCKS5), `:9090`
  (metrics / health) — all overridable via env.

## Architecture

```mermaid
flowchart LR
  C[Client] --> A[Auth<br/>Postgres api_keys + Redis lockout]
  A --> R[Rate / Concurrency<br/>Redis]
  R --> S[Session allocator<br/>Redis sticky]
  S --> RT[Provider router<br/>geo / health / weight / failover]
  RT --> U[Upstream provider<br/>or direct egress]
  U --> D[Destination]
  U --> M[Byte metering] --> ES[(Redis Stream<br/>usage:events)]
```

Request flow:

```
Client → Auth (Postgres api_keys + Redis lockout) → Rate/Concurrency (Redis)
       → Session allocator (Redis sticky) → Provider router (geo/health/weight/failover)
       → Upstream provider (Bright Data / Oxylabs / SOAX / Smartproxy / IPRoyal) → Destination
       → byte metering → Redis Stream `usage:events`
```

## Tech Stack

| Concern | Choice |
|---|---|
| Language | Go `1.25` |
| Postgres driver | `jackc/pgx/v5` |
| Redis client | `redis/go-redis/v9` |
| Metrics | `prometheus/client_golang` |
| Networking | `golang.org/x/net` (proxy primitives) |
| Container | `golang:1.25-alpine` build → `gcr.io/distroless/static-debian12:nonroot` |

## Build & Test

```bash
cd Backend/gateway
go mod tidy          # resolves go.sum (run once; needs network)
go build ./...
go test ./...        # parser, SSRF (incl. DNS-rebinding), router failover
```

> Authored without a Go toolchain in CI here —
> `go mod tidy && go build ./... && go test ./...` is the local verification step.

## Running

### Local, direct egress (no provider account needed)

```bash
export DATABASE_URL='postgres://baalvion:baalvion_dev_pass@localhost:5432/baalvion_db'
export REDIS_URL='redis://localhost:6379'
export ALLOW_DIRECT=true
go run ./cmd/gateway
```

### With real providers

```bash
export PROVIDERS_JSON="$(cat providers.example.json)"   # fill in real credentials
go run ./cmd/gateway
```

## Configuration

Read at startup by [`internal/config/config.go`](internal/config/config.go):

| Variable | Default | Purpose |
|---|---|---|
| `LISTEN_HTTP` | `:10000` | HTTP proxy + HTTPS CONNECT listener |
| `LISTEN_SOCKS` | `:1080` | SOCKS5 listener |
| `LISTEN_METRICS` | `:9090` | metrics / health listener |
| `DATABASE_URL` | _(none)_ | control-plane Postgres (api_keys) |
| `REDIS_URL` | `redis://127.0.0.1:6379` | lockout, rate/concurrency, sessions, usage stream |
| `ALLOW_DIRECT` | `false` | enable datacenter-direct egress via the gateway's own IP |
| `PROVIDERS_JSON` / `PROVIDERS_FILE` | _(none)_ | inline JSON / path to the upstream provider array |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | _(none)_ | optional OTLP trace export |

## Usage

```bash
# Password is a bvl_proxy_ key issued by POST /v1/developer/proxy/sessions.
# HTTPS via CONNECT, US geo, sticky session:
curl -x http://customer-acme-country-us-session-abc123:bvl_proxy_XXX@localhost:10000 https://api.ipify.org

# SOCKS5:
curl --socks5 customer-acme-country-de:bvl_proxy_XXX@localhost:1080 https://api.ipify.org
```

## Ports

| Port  | Purpose                    |
|-------|----------------------------|
| 10000 | HTTP proxy + HTTPS CONNECT |
| 1080  | SOCKS5                     |
| 9090  | /metrics /healthz /readyz  |

## Provider model

No fake adapters. Each provider in `PROVIDERS_JSON` is a real upstream proxy
reached over HTTP-CONNECT or SOCKS5. `usernameTemplate` placeholders
(`{country} {state} {city} {asn} {zone} {session}`) are expanded per provider
convention to target geo/session. With real credentials, traffic is genuinely
forwarded; without them the provider is skipped by the router (no simulated
success). `direct` is a real datacenter-direct egress via the gateway's own IP.

## Project Structure

| Path | Purpose |
|---|---|
| `cmd/gateway/` | binary entry point |
| `internal/auth/` | api-key parsing + customer authentication |
| `internal/ratelimit/`, `internal/quota/` | rate / concurrency / quota enforcement |
| `internal/session/` | sticky session allocation |
| `internal/router/`, `internal/orchestrator/` | provider routing, scoring, circuit breaking, ban detection |
| `internal/provider/` | upstream provider adapters + direct egress |
| `internal/proxy/` | HTTP/CONNECT + SOCKS5 handlers |
| `internal/metering/`, `internal/metrics/` | byte metering + Prometheus metrics |
| `internal/security/`, `internal/enforce/` | SSRF guard, DNS-rebinding defense, policy enforcement |
| `internal/intel/` | ASN / reputation intelligence |
| `internal/health/`, `internal/config/`, `internal/model/` | health probes, env config, shared types |
| `deploy/` | `helm/` and `k8s/` deployment manifests |

## Notes

- The SSRF guard (with DNS-rebinding defense) and router failover are covered by
  tests under `internal/security`, `internal/enforce`, and `internal/orchestrator`.
- Egress is real-only: a provider without working credentials is dropped from
  routing rather than simulated.

---

<div align="center">
<sub>Part of the <a href="https://github.com/baalvionservice/Baalvion-Project-Infra">Baalvion Platform</a> · centralized identity · domain-driven monorepo</sub>
</div>
