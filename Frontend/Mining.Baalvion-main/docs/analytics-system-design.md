
# GeoTrade Nexus Business Intelligence & Analytics Design

This document outlines the advanced business intelligence architecture for the global mining marketplace.

## 1. Multi-Tiered Analytics Map

| Level | Access Role | Core Metrics (KPIs) | Primary Visualization |
| :--- | :--- | :--- | :--- |
| **Executive BI** | Super Admin | GMV, Yield, Region Growth, Compliance Drift. | Complex Area Charts (Multi-Variant) |
| **Monetization** | Finance Manager | Commission Velocity, Ad Rev, Refund Impact. | Waterfall Charts (Revenue Flow) |
| **Operational** | Logistics/WH | Latency, Capacity Util, Route Efficiency. | Heatmaps & Gauge Charts |
| **Strategic** | Seller/Buyer | Inventory Turnover, Procurement Spend Trends. | Time-Series Line Charts |

## 2. Advanced Report Generation Workflow

1. **Trigger**: User configures a BI Template (e.g., "Quarterly Tax Audit") with advanced segment filters.
2. **Aggregation**: System initiates an asynchronous job to scan `TradeOrder`, `RevenueLedger`, and `UserBehaviorLog`.
3. **Synthesis**: Data is digitally signed and compiled into high-fidelity PDF/CSV formats.
4. **Delivery**: Report is stored in `GeneratedReport` and notification is dispatched via secure system channel.

## 3. Anomaly Detection Logic (Sentinel)

The platform employs heuristic rules to identify marketplace outliers:
- **Price Sentinel**: Cross-references listings against `MineralPriceIndex`. Deviations >40% trigger `BIRunRecord`.
- **Velocity Sentinel**: Identifies rapid account registration or RFQ spam from shared IP/metadata.
- **Revenue Sentinel**: Monitors daily commission collection. Drops >25% vs moving average trigger `HIGH` severity alert.

## 4. Visualization Standards

- **Executive Dashboards**: Focus on "Big Picture" metrics using high-contrast KPI cards.
- **Trend Analysis**: Use `AreaChart` with gradient fills to represent volume-weighted trends.
- **Distribution**: Use `PieChart` with `innerRadius` (Donut) for categorical breakdowns (e.g., Minerals, Regions).
- **Alert Indicators**: Standardized color tokens:
  - **#10b981 (Emerald)**: Normal/Optimal performance.
  - **#f59e0b (Amber)**: Warning/Deviation.
  - **#ef4444 (Rose)**: Critical Anomaly.

## 5. BI Data Schema (Conceptual)

### BIRunRecord
- `id`: Unique Job Identifier
- `templateId`: Reference to BI Template
- `actorId`: User who initiated the run
- `filters`: JSON representation of query parameters
- `runtime`: Duration of execution
- `status`: SUCCESS, FAILED, RUNNING

### AnomalyAlert
- `type`: Category of anomaly
- `score`: Probability/Confidence score (0-100)
- `entityContext`: Linked objects (User, Order, Listing)
- `resolvedBy`: Admin ID who closed the alert

