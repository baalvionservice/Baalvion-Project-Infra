# 01 · Architecture, Grouping & Dependencies

## 1. Production architecture

Single EC2 host runs Caddy (edge TLS) + 6 Node app containers + the JVM payment app +
on-box Redis/Neo4j/Kafka. PostgreSQL is managed RDS. Browsers reach only Caddy (80/443);
everything else is private on the Docker bridge network.

```mermaid
flowchart TB
  subgraph Internet
    U[Browsers / API clients]
  end
  U -->|HTTPS 443| R53[Route 53 DNS]
  R53 --> EIP[Elastic IP]

  subgraph VPC["AWS VPC (ap-south-1)"]
    subgraph EC2["EC2 t3.large — Docker host (private subnet + EIP)"]
      CADDY[Caddy 2 · TLS edge · :80/:443]
      subgraph NET["compose bridge network (private)"]
        AID[app-identity]
        ACO[app-commerce]
        ATR[app-trade]
        AEC[app-ecosystem]
        APL[app-platform]
        AER[app-edge-realtime]
        APAY[app-payments · JVM]
        REDIS[(Redis 7)]
        NEO[(Neo4j 5)]
        KAFKA[(Kafka + ZK)]
      end
      CADDY --> AID
      CADDY --> AER
      CADDY --> APL
    end
    RDS[(RDS PostgreSQL · Multi-AZ)]
    SES[Amazon SES]
    S3[(S3 media bucket)]
    SM[Secrets Manager / SSM]
    CW[CloudWatch Logs + Alarms]
    ECR[(ECR images)]
  end

  AID --> RDS
  ACO --> RDS
  ATR --> RDS
  AEC --> RDS
  APL --> RDS
  AER --> RDS
  APAY --> RDS
  ATR --> NEO
  APAY --> KAFKA
  AER --> SES
  AID --> SES
  APL --> S3
  ATR --> S3
  EC2 -. pull .-> ECR
  EC2 -. secrets .-> SM
  EC2 -. logs/metrics .-> CW
```

**Edge routing (Caddyfile):** `auth.baalvion.com → app-identity:3026`,
`api.baalvion.com → app-edge-realtime:4000`, `ws.baalvion.com → app-edge-realtime:3040`,
`admin.baalvion.com → app-platform:3021` (+ `/auth-bff/*` shim → app-identity:3001,
`/api/v1/public/*` → app-platform:3018). Internal service-to-service calls use Docker DNS
and bypass Caddy.

## 2. Service grouping — all 43 deployables

One image (`baalvion-backend`) runs six "personalities"; pm2 starts only each container's
modules. The JVM is the seventh deployable.

```mermaid
flowchart LR
  IMG[[baalvion-backend image]]
  IMG --> C1 & C2 & C3 & C4 & C5 & C6
  C1["app-identity (5)"]:::n
  C2["app-commerce (7)"]:::n
  C3["app-trade (6)"]:::n
  C4["app-ecosystem (10)"]:::n
  C5["app-platform (10)"]:::n
  C6["app-edge-realtime (4)"]:::n
  C7["app-payments · JVM (1)"]:::j
  classDef n fill:#e8f0fe,stroke:#4285f4;
  classDef j fill:#fce8e6,stroke:#ea4335;
```

| Container | Ct | Modules · port |
|---|---:|---|
| **app-identity** | 5 | auth `3001` · auth-gateway `3026` · oauth `3023` · rbac `3053` · session `3022` |
| **app-commerce** | 7 | commerce `3012` · inventory `3014` · fulfillment `3016` · market `3007` · order `3013` · trade-service `3025` · marketplace `3060` |
| **app-trade** | 6 | network-graph `3047` · order-execution `3052` · product-registry `3048` · quality-inspection `3050` · supplier-lifecycle `3051` · trade-documentation `3049` |
| **app-ecosystem** | 10 | about `3010` · agent `3044` · brand-connector `3006` · crm `3063` · ctm `3017` · insiders `3050` · ir `3008` · jobs `3002` · mining `3003` · real-estate `3005` |
| **app-platform** | 10 | admin `3021` · dashboard `3009` · tenant `3043` · cms `3018` · imperialpedia `3004` · law `3015` · audit `3032` · developer `3042` · report `3041` · search `3036` |
| **app-edge-realtime** | 4 | proxy/BFF `4000` · realtime-infra `3040` · realtime-platform `3046` · notification `3031` |
| **app-payments (JVM)** | 1 | financial payment-service `3015` |
| **Total** | **43** | 42 Node processes + 1 JVM |

**Excluded by design:** `law-elite` (in-memory demo shell — decommission) · `ml-service`
(Python; optional accelerator, OFF by default, Node has an in-process fallback).

## 3. Container-to-container & backing-service dependency map

```mermaid
flowchart TD
  subgraph apps[App containers]
    AID[app-identity]
    ACO[app-commerce]
    ATR[app-trade]
    AEC[app-ecosystem]
    APL[app-platform]
    AER[app-edge-realtime]
    APAY[app-payments JVM]
  end
  subgraph backing[Backing services]
    PG[(PostgreSQL / RDS)]
    RD[(Redis)]
    NE[(Neo4j)]
    KA[(Kafka)]
    SES[SES]
    S3[(S3)]
    OS[(OpenSearch — optional)]
  end

  AID --> PG & RD
  ACO --> PG & RD
  AEC --> PG & RD
  APL --> PG & RD
  AER --> PG & RD
  ATR --> PG & RD & NE
  APAY --> PG & KA
  AER --> SES
  AID --> SES
  APL --> S3
  ATR --> S3
  APL -.optional.-> OS
  AEC -.optional.-> OS

  %% cross-container (Docker DNS, gateway-signed / internal-secret)
  AER -. payments .-> APAY
  AER -. auth verify .-> AID
  APL -. notify .-> AER
  ACO -. notify .-> AER
  AID -. notify .-> AER
```

**Hard dependencies (boot-blocking):**
- **All app containers → Redis** (compose `depends_on: redis healthy`).
- **app-trade → Neo4j** — `network-graph-service` calls `verifyConnectivity()` and
  **`process.exit(1)`** on failure. Neo4j is therefore mandatory in prod.
- **app-payments → DB** (Flyway-migrated `payments` schema) + **Kafka** (@EnableKafka;
  tolerates absence but logs continuous reconnect noise — provide Kafka/MSK).

**Soft/lazy dependencies (degrade, don't crash):**
- `search-service` → OpenSearch (absent ⇒ HTTP 503 degraded mode by design).
- `jobs-service` → Elasticsearch (absent ⇒ Postgres full-text fallback).
- S3/SES/payment-gateways → first-use, not boot.

**Trust boundaries:** cross-service calls are gateway-signed (`GATEWAY_SIGNING_SECRET`) or
carry `x-internal-secret` (`INTERNAL_SERVICE_SECRET`); all token verification is RS256 via
`@baalvion/auth-node` (single issuer).

➡ Next: [02 · AWS resources & images](02-aws-resources-and-images.md)
