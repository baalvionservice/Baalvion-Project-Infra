# Trust & Safety / Compliance Runbook

## Architecture
```
Customer activity → Risk Engine → Payment Fraud / Abuse Detection → Moderation Queue
                                ↘ Destination Threat Intel ↘
                  Enforcement Engine ──Redis (enforce:org, denydest)──▶ GO GATEWAY (blocks BEFORE upstream)
                                ↘ Compliance Audit (append-only, signed) + ClickHouse analytics
```

## Enforcement decision points (gateway, per connection, sub-ms)
1. SSRF guard (RFC1918/metadata) — `internal/security`.
2. **Destination threat-intel** denylist — `denydest:{ip|domain}:*` (Spamhaus/AbuseIPDB/OpenPhish/TOR).
3. Quota block — `quota:block:{org}`.
4. **Org enforcement** — `enforce:org:{id}` (suspend/ban → blocked; geo allow/deny).

## Alerts → actions
| Alert | Meaning | Action |
|---|---|---|
| `kyc_failures_total` rising | KYC rejections / sanctions hits | Review queue → `/admin/trust-safety`; sanctions = auto-critical (suspended) |
| `abuse_events_total{type=...}` spike | spike/geo-fanout/credential abuse | Open moderation case; investigate; `act` → enforcement |
| `blocked_destinations_total` spike | customers hitting malware/phishing | Likely compromised customer or scraping bad infra; risk-eval the org |
| `enforcement_actions_total{action=ban}` | bans applied | Confirm justified; provider-protection: notify upstream if their IPs were abused |
| `moderation_queue_size` > N | backlog | Page on-call T&S; add reviewers |

## KYC
- Provider: Sumsub (config-driven). Webhook `/v1/webhooks/kyc` (HMAC-verified, raw body).
- Sanctions/PEP hits → risk engine forces **critical** → auto-suspend; compliance officer reviews in `/admin/trust-safety`.
- `KYC_REQUIRED=true` gates org activation until approved.

## Takedown workflow (DMCA / law enforcement)
1. Create case (`/admin/trust/cases`, type `dmca`|`le_request`).
2. INVESTIGATING → gather evidence (sessions/usage are in ClickHouse/Postgres; the
   gateway tunnels TLS so payloads are NOT logged — only connection metadata).
3. `act` → enforcement (suspend / geo_restrict) → ACTION_TAKEN.
4. RESOLVED with disposition note (immutable in `moderation_events`).
- Legal hold: enforcement + audit rows are append-only; do not delete.

## GDPR / DSAR
- Export: `/v1/account/privacy/export` → signed JSON bundle.
- Erase: anonymizes PII (email/name), revokes sessions/keys; **financial records retained**
  (legal basis). Retention sweep runs daily (sessions 90d, auth logs `DATA_RETENTION_DAYS`).

## Incident response (abuse spike / provider complaint)
- Identify org(s) via ClickHouse `abuse_events` / `blocked_destinations`.
- Immediate containment: `applyEnforcement` (throttle or suspend).
- Recompute risk: `POST /admin/trust/risk/{orgId}`.
- Notify affected upstream provider; rotate the abused proxy key.
- Post-incident: confirm compliance_audit_logs captured every action (signed).

## SOC2 evidence hooks
- All admin/KYC/enforcement/GDPR actions → `compliance_audit_logs` (append-only, HMAC-signed).
- Access reviews: query distinct admin actors from compliance audit; MFA enforced on admin.
- Change management: infra via GitOps PRs; DB via versioned migrations.
