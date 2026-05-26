
# GeoTrade Nexus Multi-Country Trade & Export Design

This document outlines the architecture for managing international mineral transactions across diverse regulatory jurisdictions.

## 1. Export Verification Workflow (Sellers)

Only Level 3 Verified Sellers can initiate international exports.
1. **Pre-check**: System validates `Seller.country` has active `ExportPermission`.
2. **License Validation**: Seller must have a valid `Export License` document uploaded and approved by an Admin.
3. **Restricted Minerals**: Certain minerals (e.g., Critical Minerals) require additional government clearance based on the source country.

## 2. Cross-Border Validation Logic

When a trade is initiated between Country A (Seller) and Country B (Buyer):
- **Step 1**: Query `TradeRule` where `origin=A` and `destination=B`.
- **Step 2**: If `status == PROHIBITED`, block order creation.
- **Step 3**: Collect `requiredDocuments` defined in the rule (e.g., Phytosanitary Certificate for specific aggregates).
- **Step 4**: Validate that the `Buyer` is not in a sanctioned trade region.

## 3. Multi-Currency Display Model

The platform uses a "Base Currency" (USD) for internal ledgers and provides "Reference Conversion" for the UI.
- **Order Level**: Fixed at the point of contract in the selected currency.
- **Marketplace Level**: Dynamic conversion based on `currency_rates`.
- **Supported Currencies**: USD, EUR, INR, AED, SGD, ZAR, AUD.

## 4. International Trade Routes

Routes are conceptualized as Port-to-Port segments.
- **Logistics Integration**: Transport bids are automatically categorized as "Domestic" or "International" based on route crosses.
- **Customs Documentation**: Bill of Lading, Certificate of Origin, and Commercial Invoice are mandatory for all international routes.

## 5. API Endpoints (Conceptual)

- `GET /api/trade/compliance-check`: Validate if a trade pair is legal for a specific mineral.
- `GET /api/trade/documents-required`: Fetch checklist of docs for a specific export route.
- `POST /api/trade/convert-currency`: Get current exchange rate for display purposes.
