
# GeoTrade Nexus API & Third-Party Integration Design

This document outlines the architecture for managing internal APIs and secure external service connections.

## 1. API Governance Model

GeoTrade Nexus employs a versioned, secure, and monitored API layer to handle the high-density data flow between mining ERPs, logistics carriers, and the platform core.

| Layer | Type | Access Control | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **Nexus Core** | Internal | JWT / RBAC | Frontend dashboards & system services. |
| **Partner Bridge** | External | Scoped API Keys | Logistics tracking & automated bid submission. |
| **Settlement Gateway** | External | mTLS / Webhooks | Payment processing & Escrow releases. |
| **Intelligence Feed** | Inbound | OAuth 2.0 | Market price index data ingestion. |

## 2. Security & Rate Limiting

- **Authentication**: Scoped API keys for third parties; JWT for session-based user access.
- **Throttling**: 
  - Standard Tier: 1,000 req/min.
  - Enterprise Tier: 10,000 req/min.
  - Critical Webhooks: No throttle, prioritised queue.
- **IP Whitelisting**: Mandatory for Level 3 Exporter automated systems and bank-linked settlement gateways.

## 3. Versioning Strategy

The platform utilizes URI-based versioning (e.g., `/api/v1/orders`) combined with an `X-API-Version` header.
- **ACTIVE**: Currently supported and recommended.
- **DEPRECATED**: Supported for 6 months; warnings sent in response headers.
- **RETIRED**: Endpoint returns `410 Gone`.

## 4. Third-Party Service Map

| Service | Category | Integration Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Stripe / LC Connect** | Payment | Webhooks & API | Escrow funding & commission capture. |
| **DHL / Maersk API** | Logistics | REST / SOAP | Real-time vessel tracking & freight quoting. |
| **Google Gemini AI** | Intelligence | Genkit SDK | Compliance verification & descriptions. |
| **Commodity Index** | Market Data | WebSockets | Spot price updates for Mineral Index. |

## 5. Monitoring & Error Handling

The **Integration Sentinel** monitors for:
- **Latency Spikes**: Triggers admin alert if p95 > 2000ms.
- **Error Cascades**: Automatically disables an integration if success rate drops < 85% in a 5-minute window (Circuit Breaker pattern).
- **Payload Integrity**: Validates schema compliance for all inbound third-party data.

## 6. Conceptual API Schema

### ApiEndpoint
- `id`: Unique Identifier
- `name`: Human-readable name
- `path`: URL path
- `version`: Semantic version string
- `status`: ACTIVE, DEPRECATED, RETIRED
- `latencyThreshold`: ms before alert

### IntegrationConfig
- `serviceId`: e.g., 'STRIPE_PROD'
- `apiKeyEncrypted`: Encrypted secret
- `webhookSecret`: Signature validation key
- `status`: ONLINE, OFFLINE, MAINTENANCE
- `lastHeartbeat`: Timestamp
