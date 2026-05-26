# Baalvion Proxy Gateway (data plane)

The real proxy network: an HTTP/HTTPS-CONNECT + SOCKS5 forward proxy in Go that
authenticates customers against the control-plane DB (Prompt 1/2), routes through
upstream providers, meters real bandwidth, and streams usage events.

```
Client → Auth (Postgres api_keys + Redis lockout) → Rate/Concurrency (Redis)
       → Session allocator (Redis sticky) → Provider router (geo/health/weight/failover)
       → Upstream provider (Bright Data / Oxylabs / SOAX / Smartproxy / IPRoyal) → Destination
       → byte metering → Redis Stream `usage:events`
```

## Build & test
```bash
cd Backend/gateway
go mod tidy          # resolves go.sum (run once; needs network)
go build ./...
go test ./...        # parser, SSRF (incl. DNS-rebinding), router failover
```
> Built/authored without a Go toolchain in CI here — `go mod tidy && go build ./... && go test ./...`
> is the verification step to run locally.

## Run (local, direct egress — no provider account needed to exercise the data path)
```bash
export DATABASE_URL='postgres://baalvion:baalvion_dev_pass@localhost:5432/baalvion_db'
export REDIS_URL='redis://localhost:6379'
export ALLOW_DIRECT=true
go run ./cmd/gateway
```

## Run (with real providers)
```bash
export PROVIDERS_JSON="$(cat providers.example.json)"   # fill in real credentials
go run ./cmd/gateway
```

## Use it
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

## Provider model (no fake adapters)
Each provider in `PROVIDERS_JSON` is a real upstream proxy reached over HTTP-CONNECT
or SOCKS5. `usernameTemplate` placeholders (`{country} {state} {city} {asn} {zone}
{session}`) are expanded per provider convention to target geo/session. With real
credentials, traffic is genuinely forwarded; without them the provider is skipped
by the router (no simulated success). `direct` is a real datacenter-direct egress
via the gateway's own IP.
