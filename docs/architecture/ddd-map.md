# Domain-Driven Design Map

## Domain classification

DDD asks: where is the competitive advantage, and where is it commodity? Invest
engineering in **core**; standardize/share **supporting**; buy or thin-wrap
**generic**.

| Class | Domains | Why | Strategy |
|-------|---------|-----|----------|
| **Core** | Proxy orchestration & edge routing, Provider/IP intelligence, Abuse/Trust | This is the moat — routing quality, ban avoidance, clean IPs. | Deepest investment; richest models; owned by the division. |
| **Supporting** | Metering, Enterprise APIs, Commerce/Mining/Legal/RE/Jobs verticals | Necessary, business-specific, but not the moat. | Build on the platform; standard patterns. |
| **Generic** | Identity, Billing, Notifications, Audit, Organization | Every business needs them; sameness is fine. | Build ONCE as platform-core; every product consumes. |

## Bounded contexts + aggregate roots

Each context owns its data, its language (ubiquitous), and its public contract.

| Context | Aggregate roots | Owns (data) | Publishes (events) | Sync API |
|---------|-----------------|-------------|--------------------|----------|
| **identity** | User, Session, Credential | users, sessions, mfa, jwks | `org.created`, `auth.*`, `security.incident` | `identity.v1.IdentityService` |
| **organization** | Organization, Membership, Role | orgs, members, custom_roles, policies | `org.member.*` | REST `/v1/organization` |
| **billing** | Invoice, Subscription, Ledger | invoices, subscriptions, credit_ledger | `billing.invoice.generated`, `billing.payment.*` | `billing.v1.BillingService` |
| **proxy** | ProxySession, Provider, Allocation | proxy_sessions, providers, ip_allocations, usage | `proxy.session.*`, `provider.health.changed` | `proxy.v1.OrchestrationService` |
| **trust-safety** | Case, RiskScore, EnforcementAction | moderation_cases, risk_scores, enforcement_actions | `abuse.action.triggered` | REST `/v1/admin/trust` |
| **analytics** | (read models only) | feature store, forecasts, anomalies (Timescale/CH) | `metrics.threshold` | REST `/v1/analytics` |
| **audit** | AuditRecord (append-only) | compliance_audit_logs (CH mirror) | — | REST `/v1/admin/audit-logs` |
| **notification** | Notification | notifications | `notification.sent` | REST `/v1/notifications` |

## Context map (relationships)

Relationship patterns name HOW two contexts integrate (Evans):

```
identity ──(Open Host Service: JWKS + gRPC)──▶ ALL contexts        [conformist on identity]
organization ──(events: org.created)──────────▶ proxy, billing, audit
proxy ──(events: session.*, provider.health)──▶ billing, analytics, abuse, audit
proxy ──(Customer/Supplier: gRPC quota)───────▶ billing
billing ──(events: invoice/payment)───────────▶ notification, analytics, audit
abuse ──(events: abuse.action.triggered)──────▶ proxy(enforce), notification, audit
abuse ◀─(events: provider.health, session)─────  proxy            [consumer]
```

- **Open Host Service / Published Language**: `identity` and `billing` expose
  versioned gRPC + a published event language (`@baalvion/contracts`). Downstreams
  are *conformist* — they adopt the contract as-is.
- **Anti-Corruption Layer**: when a vertical (e.g. commerce) integrates a 3rd-party
  payment processor, the ACL lives inside that context; it never leaks the
  external model onto the bus.
- **Customer/Supplier**: `proxy` (customer) drives requirements for `billing`
  (supplier) usage ingestion; the supplier owns the contract, the customer reviews it.

## Where the seams are today (current monolith)

The proxy backend (`Backend/backend-Proxy-BaalvionStack`) currently hosts FOUR
contexts (proxy, billing-of-usage, trust-safety, analytics). The DDD map is what
tells us where to cut: each context above becomes an extraction candidate, in the
order set by [`migration-roadmap.md`](./migration-roadmap.md).
