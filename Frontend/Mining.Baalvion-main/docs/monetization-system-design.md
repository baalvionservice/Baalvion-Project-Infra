
# GeoTrade Nexus Monetization & Premium Services Design

This document outlines the architecture for platform revenue generation and premium feature governance.

## 1. Subscription Tier Model

| Feature | Free | Standard | Premium |
| :--- | :--- | :--- | :--- |
| **Marketplace Access** | Read Only | Full Browse | Full Browse |
| **Listings** | Max 2 | Max 10 | Unlimited |
| **RFQs** | Max 1/day | Max 5/day | Unlimited |
| **AI Market Intelligence** | No | Basic Trends | Deep Forecasts |
| **Transaction Fees** | 5.0% | 3.5% | 2.0% |
| **Analytics Dashboard** | Basic | Operational | Executive BI |
| **Support** | Email | Priority | 24/7 Dedicated |

## 2. Revenue Streams

### 2.1 Commissions (Trade Fees)
- Automatically calculated at `Order.totalValue`.
- Rate determined by `User.subscriptionTier`.
- Stored in `CommissionRecord` for tax and audit purposes.

### 2.2 Subscriptions
- Recurring monthly or annual billing.
- Managed via `SubscriptionRecord` linked to platform payment gateway.

### 2.3 Advertising (PPC & Flat Fee)
- **Featured Listing**: Daily flat fee for search priority.
- **Banner Ads**: Monthly rental for high-traffic placements.
- **Sponsored RFQs**: Increased visibility for critical supply requests.

## 3. Premium Feature Governance (Flags)

The system checks for `User.permissions` or `User.subscriptionId` before allowing access to:
- `AI_MARKET_FORECASTS`
- `PRIORITY_SUPPORT`
- `BULK_EXPORT_REPORTS`
- `ADVANCED_FRAUD_SENTINEL`

## 4. API Structure (Conceptual)

### Subscriptions
- `GET /api/billing/plans`: Retrieve available tiers.
- `POST /api/billing/subscribe`: Initialize plan upgrade.
- `GET /api/billing/usage`: Track premium feature utilization.

### Advertisements
- `POST /api/marketing/campaigns`: Create new promotion.
- `GET /api/marketing/slots`: Check slot availability.
- `GET /api/marketing/stats/:id`: Retrieve real-time performance data.

### Admin Finance
- `PATCH /api/admin/monetization/fees`: Update global fee structure.
- `GET /api/admin/monetization/revenue`: Consolidated financial report.
