
# GeoTrade Nexus AI Smart Recommendation Engine Design

This document outlines the architecture for the personalized suggestion system that drives engagement across the global mining marketplace.

## 1. Logic & Algorithm Weights

The engine utilizes a hybrid approach combining content-based filtering (technical specs) and collaborative filtering (user behavior).

### Weighting Parameters (Admin-Configurable)
| Parameter | Weight | Description |
| :--- | :--- | :--- |
| **Technical Match** | 40% | Mineral grade, purity, and particle size compatibility. |
| **Geographic Proximity** | 20% | Distance between seller port and buyer destination. |
| **Behavioral History** | 25% | Past views, clicks, and favorited entities. |
| **Market Urgency** | 15% | Recency of listing and RFQ deadlines. |

## 2. Role-Based Recommendation Logic

### For Buyers (Procurement Focus)
- **"Top Picks"**: Products matching technical grades previously purchased.
- **"Rising Suppliers"**: New verified suppliers in the buyer's preferred trade region.
- **"Arbitrage Alerts"**: Products priced below the current `MineralPriceIndex` for the region.

### For Sellers (Sales Focus)
- **"High-Match RFQs"**: Requests for Quotation that align with current inventory specs.
- **"Potential Partners"**: Logistics providers frequently used for similar routes.
- **"Market Gaps"**: Notification of high demand/low supply minerals matching seller's mining capability.

## 3. Feedback Loop & Reinforcement
- **Explicit Feedback**: Users can rate a recommendation as "Helpful" or "Not Helpful".
- **Implicit Feedback**: Clicks and subsequent inquiries (RFQs/Orders) generated from a suggestion are logged as successful conversions.

## 4. API Endpoints (Conceptual)

- `GET /api/ai/recommendations`: Retrieve personalized items for the active session.
- `POST /api/ai/feedback`: Submit user sentiment on a specific suggestion.
- `GET /api/admin/ai/performance`: Aggregate CTR and conversion metrics for AI items.
- `PATCH /api/admin/ai/weights`: Update global algorithm importance factors.

## 5. UI Placement Standards
- **Dashboard Home**: Horizontal carousel of "Top Picks".
- **Product Detail Sidebar**: "Similar Grade Minerals" section.
- **RFQ Marketplace**: "Recommended for You" prioritized list.
