
# GeoTrade Nexus Market Data & Price Index Design

This document outlines the architecture for the platform's financial intelligence and market tracking system.

## 1. Data Aggregation Model

The system calculates "Nexus Spot Prices" using a volume-weighted average price (VWAP) model from four primary sources:
- **Transaction Data**: Finalized trade orders on the platform.
- **RFQ Quotations**: Aggregated bids from verified sellers.
- **Supplier Listings**: Public asking prices in the marketplace.
- **External Feeds**: (Conceptual) Third-party commodity index integrations.

## 2. Regional Arbitrage Engine

The platform tracks price spreads between major geographical trade hubs:
- **APAC (Asia Pacific)**: Primarily Shanghai and Singapore benchmarked prices.
- **EMEA (Europe/Middle East)**: Rotterdam and Dubai port-exit prices.
- **AMER (Americas)**: Houston and Rio de Janeiro benchmarked prices.

## 3. Supply/Demand Signal Calculation

Market "Heat" is calculated using the following variables:
- `Active RFQs / Active Suppliers` = Demand Intensity.
- `Total Contracted Volume (MT) / Total Available Stock (MT)` = Scarcity Ratio.

## 4. Alert Engine Logic

The Alert Engine runs asynchronously to monitor the `MineralPriceIndex` updates.
- **Trigger**: Every time a `MineralPriceIndex` document is updated.
- **Validation**: Queries `PriceAlert` collection for users tracking the specific mineral.
- **Execution**: If `Condition` (ABOVE/BELOW) is met, generates a `Notification` entity.

## 5. Visual Standards

- **Area Charts**: Used for price trends to emphasize volume and stability.
- **Bullish/Bearish Indicators**: Standardized green (#10b981) and red (#ef4444) colors for price velocity.
- **Spread Visualization**: Comparison of regional prices relative to the Global Average (Base 0).

