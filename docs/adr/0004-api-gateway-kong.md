# ADR-0004: Kong for north-south API gateway; Istio for east-west mesh

**Status:** SUPERSEDED (2026-05-27) → **Traefik** is the single north-south gateway.
The Kong declarative configs and the Kong k8s ingress were removed; routing now
lives in `Backend/infra/api-gateway/dynamic.yml` (Traefik file provider) and is
deployed via `Backend/infra/kubernetes/ingress.yml`. Rationale: one gateway, no
duplicate routing tables, and auth is enforced per-service via `@baalvion/auth-node`
(RS256/JWKS) rather than at the edge. Istio (east-west mTLS) is unchanged.

**Original status:** Accepted · **Date:** 2026-05-26 · **Deciders:** Architecture, SRE, Platform Core

## Context
We need a centralized edge for client traffic (auth, rate limiting, routing, API
governance, tracing) AND zero-trust service-to-service security inside the cluster.
Istio (STRICT mTLS) already exists from the infra work (`infra/mesh`).

## Decision
- **North-south (clients → platform): Kong** (DB-less, declarative `kong.yaml`).
  Chosen for its mature plugin ecosystem (JWT/JWKS, rate-limiting w/ Redis,
  OpenTelemetry, correlation-id, CORS, request-size) and GitOps-friendly
  declarative config. Validates JWTs against the identity platform's JWKS so
  unauthenticated traffic never reaches a service.
- **East-west (service ↔ service): Istio** STRICT mTLS + NetworkPolicies. gRPC
  inter-service calls ride the mesh; the gateways themselves stay OUT of the mesh
  (they're forward proxies — see existing mesh ADR).

## Alternatives
- **Envoy Gateway (Gateway API):** clean K8s-native CRDs, but a thinner plugin set
  today; we'd hand-build rate-limiting/JWT integration. Reconsider as Gateway API
  matures. Kong gives us more out-of-the-box now.
- **Single layer for both:** conflates trust zones; rejected.

## Consequences
- (+) One declarative edge config; auth/rate-limit/tracing enforced centrally, not
  per service.
- (+) Defense in depth: Kong (edge authn) + Istio mTLS (workload identity) +
  NetworkPolicies (deny-all default in the standard chart).
- (−) Two proxy technologies to operate. Accepted — different trust zones,
  different jobs.
