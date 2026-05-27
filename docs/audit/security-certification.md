# Security Certification — Baalvion Auth (Phase 12)

Tags [V]/[S]/[U]/[FAIL]/[BLOCKER]. No live pen-test env → exploit attempts are reasoned/unit, not live.

## Issuer & algorithm
- Canonical issuer auth-service RS256 + JWKS [V]. **3 HS256 issuer islands remain** (trade/elite-circle/insiders) [V][BLOCKER].
- `check-jwt-algorithms` PASS (no unpinned verify / HS256 accept / wildcard in canonical slice) [V].

## Token verification (reasoned + unit; live [U])
| Attack | Result |
|---|---|
| Forged token (bad sig) | rejected — RS256 verify [V unit] |
| HS256 downgrade | rejected — `rejectHs256` [V unit] |
| Issuer mismatch | rejected — `iss` enforced [V] |
| Audience mismatch | rejected — `aud` enforced [V] |
| Expired | rejected — `exp` [V] |
| Replay / revoked | rejected — shared `auth:blacklist:<jti>`, fail-closed [V unit; live [U]] |
| Blacklist bypass | not possible without Redis write; outage fails CLOSED [V] |
| Impersonation abuse | super_admin-gated, ≤15m, isolated issuer, audited, no refresh [V] |

## Token storage
- **localStorage: 7 writes [FAIL]** (Mining, Proxy-BaalvionStack). Backend cookies httpOnly/Secure/SameSite [S].

## Secret management
- Rotation **NOT executed** [U]. Must verify: no plaintext secrets / fallback defaults / .env leakage before go. (Phase-1 removed fallback secrets [S].)

## Legacy auth surface (live)
- Keycloak `realm_access` in baalvion-os [V][FAIL]; Firebase `fb-compat` brand-connector FE [V][FAIL]; Supabase auth elite-circle/law FE [V][FAIL].

## Security score: ~65/100 — canonical core hardened; HS256 islands + legacy FE auth + localStorage + un-rotated secrets are the gap. **Security cert: NOT CERTIFIED (program); CERTIFIED-WITH-RISKS (done slice).**
