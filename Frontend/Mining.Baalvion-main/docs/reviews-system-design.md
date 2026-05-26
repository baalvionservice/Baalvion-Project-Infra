
# GeoTrade Nexus Review & Rating System Design

This document outlines the architecture for cross-company reputation tracking and verified feedback loops.

## 1. Eligibility & Workflow

A review is only eligible when a `TradeOrder` or `Shipment` enters a terminal state:
- `COMPLETED` (for Orders)
- `DELIVERED` (for Shipments)

### Step-by-Step Flow
1. **Trigger**: System detects order completion.
2. **Notification**: Both parties receive an invitation to rate the counterparty.
3. **Submission**: User completes the multi-category rating form.
4. **Processing**: System updates `ReputationScore` for the target company asynchronously.
5. **Visibility**: Review appears on the company's public profile and enters the Admin Moderation queue if flagged.

## 2. Reputation Score Calculation (Model)

The **Platform Trust Score (0-100)** is a weighted aggregate calculated monthly:

| Component | Weight | Calculation |
| :--- | :--- | :--- |
| **Average Rating** | 50% | `((Avg Stars - 1) / 4) * 100` |
| **Trade Volume** | 20% | Logarithmic factor based on successful metric tons (MT) traded. |
| **Dispute Ratio** | 20% | Penalty for lost disputes vs total trades. |
| **Delivery Speed** | 10% | Variance between `Estimated ETA` and `Actual Delivery`. |

## 3. Review Categories

Ratings are collected across four distinct dimensions:
- **Product Quality**: Purity, grade consistency, packaging integrity.
- **Reliability**: On-time delivery, fulfillment of contracted quantity.
- **Communication**: Response time, transparency in documentation.
- **Professionalism**: Adherence to platform policies and ethical standards.

## 4. API Endpoints (Conceptual)

### Review Submission
- `POST /api/reviews`: Submit a new verified review.
- `GET /api/reviews/:id`: Retrieve details of a specific review.
- `GET /api/reviews/company/:companyId`: Fetch all reviews for a company.

### Moderation
- `POST /api/reviews/:id/report`: Flag a review for administrative review.
- `PATCH /api/admin/reviews/:id/status`: Update status (APPROVED, REMOVED, FLAGGED).
- `GET /api/admin/moderation/queue`: List all pending reports.

### Reputation
- `GET /api/reputation/:companyId`: Get real-time Trust Score and performance metrics.
- `POST /api/reputation/recalculate`: Force update of a company's aggregate score.

## 5. Moderation & Integrity

- **Flagging**: Users can report reviews for "False Information," "Inappropriate Content," or "Incentivized Feedback."
- **AI Sentinel**: Automated system flags reviews that are submitted from the same IP range or occur suspiciously fast (e.g., within 5 mins of order completion).
- **Admin Override**: Super Admins can remove reviews that violate marketplace integrity.
