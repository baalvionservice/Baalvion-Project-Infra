
# GeoTrade Nexus Promotion & Advertisement System Design

This document outlines the architecture for supplier-driven product promotion and platform-wide advertising.

## 1. Promotion Types & Logic

| Type | Placement | Objective | Pricing Model |
| :--- | :--- | :--- | :--- |
| **Featured Listing** | Search Results (Top 3) | Increase product visibility. | Daily Flat Fee |
| **Homepage Banner** | Main Landing Page | Brand awareness for major producers. | Monthly Rental |
| **Sponsored Profile** | Supplier Directory (Top) | Increase RFQ invitations. | Pay-Per-Click (PPC) |
| **Search Priority** | Category Pages | Targeted outreach for specific minerals. | Weighted Bid |

## 2. Supplier Workflow (Campaign Creation)

1. **Selection**: Supplier chooses "Featured Listing" or "Banner Ad".
2. **Configuration**: Uploads creative (image/text) and selects the target mineral/profile.
3. **Duration**: Selects timeframe (7, 30, 90 days).
4. **Approval**: Campaign enters `PENDING_APPROVAL` status for Admin review.
5. **Activation**: Upon approval and payment verification, campaign goes `ACTIVE`.

## 3. Performance Tracking (Metrics)

The system tracks engagement data for every active promotion:
- **Impressions**: Number of times the ad was loaded.
- **Clicks**: Number of unique user interactions.
- **Conversion**: Linked RFQ creations or direct inquiries.
- **Heatmap**: Regional engagement distribution.

## 4. Admin Inventory Management

Admins control the "Ad Inventory" via the `ad_slots` collection.
- **Slot Definition**: `id`, `location`, `max_occupancy`, `base_price`.
- **Moderation Queue**: Manual review of banner images and promotional copy to ensure professional B2B standards.
- **Revenue Analytics**: Tracking monthly advertising GMV.

## 5. API Endpoints (Conceptual)

- `GET /api/marketing/slots`: Retrieve available ad positions and pricing.
- `POST /api/marketing/campaigns`: Initialize a new promotion request.
- `GET /api/marketing/performance/:id`: Fetch real-time engagement data.
- `PATCH /api/admin/marketing/approve/:id`: Administrative activation of ads.
