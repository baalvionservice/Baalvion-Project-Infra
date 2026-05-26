
# GeoTrade Nexus RFQ Marketplace System Design

This document outlines the architecture for the Request for Quotation (RFQ) marketplace, facilitating large-scale mineral procurement and competitive bidding.

## 1. Negotiation Workflow

The RFQ system follows a multi-stage negotiation pipeline to ensure fair market value and compliance.

1. **Publication**: Buyer creates an RFQ (Public/Private). System matches the request with verified sellers of that mineral type.
2. **Quotation (Bidding)**: Verified sellers review specs and submit `RFQQuotation` objects including unit price and delivery logistics.
3. **Comparison**: Buyer uses the side-by-side comparison tool to evaluate bids based on unit price, seller trust score, and timeline.
4. **Negotiation**: Structured message threads (`RFQNegotiation`) allow for price adjustments and spec clarifications.
5. **Selection & Award**: Buyer clicks "Accept Quotation." The system locks the RFQ status to `AWARDED`.
6. **Conversion**: The system triggers the `OrderManagement` service to automatically generate a `TradeOrder` or `SupplyContract` based on the accepted quote.

## 2. API Structure (Conceptual)

### RFQ Management
- `POST /api/rfq/create`: Initialize a new procurement request.
- `GET /api/rfq/marketplace`: Search public RFQs (Seller view).
- `GET /api/rfq/:id/quotations`: Retrieve all bids for an RFQ (Buyer view).
- `PATCH /api/rfq/:id/status`: Update status (e.g., move to UNDER_REVIEW).

### Quotations & Negotiation
- `POST /api/rfq/:id/quote`: Submit a bid for a specific request.
- `POST /api/rfq/:id/negotiate`: Send a negotiation message or counter-offer.
- `POST /api/rfq/:id/accept/:quoteId`: Finalize selection and trigger order creation.

## 3. Marketplace Integrity & Rules

- **Verification Gate**: Only companies with `KYC Level 2` or higher can create RFQs or submit quotations.
- **Price Sentinel**: AI services monitor quotations for extreme outliers (price manipulation detection).
- **Transparency**: All negotiation records are immutable and accessible to Admins during disputes.
- **Expiry Logic**: RFQs automatically transition to `EXPIRED` if the deadline passes without an award.

## 4. Comparison Tool Factors

| Factor | Weight | Importance |
| :--- | :--- | :--- |
| **Unit Price** | High | Direct impact on procurement budget. |
| **Supplier Rating** | High | Reliability and product quality verification. |
| **Delivery Speed** | Medium | Critical for time-sensitive infrastructure projects. |
| **Quantity Match** | Medium | Ability to fulfill the entire requested volume. |
