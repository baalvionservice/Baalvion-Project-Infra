
# GeoTrade Nexus Platform Moderation & Fraud Design

This document outlines the architecture for protecting marketplace integrity and enforcing safety standards.

## 1. Automated Fraud Detection Workflow

The system uses a rule-based engine to flag high-risk behavior:
1.  **Price Anomaly**: Detects listings or RFQs with pricing >50% outside the `MineralPriceIndex` range.
2.  **Identity Overlap**: Flags multiple companies sharing the same IP address or Director ID documents.
3.  **Spodumene Velocity**: Limits new accounts to 3 RFQs/day until KYC Level 2 is achieved.
4.  **KYC Rejection Loop**: Automatically suspends accounts with 3 consecutive rejected verification attempts.

## 2. Case Management Lifecycle

Every investigation follows a structured path:
- **TRIGGER**: Automated flag or `UserReport`.
- **INGESTION**: A `ModerationCase` is created with a `CRITICAL` or `HIGH` severity.
- **ASSIGNMENT**: Case assigned to a **Compliance Officer** or **Super Admin**.
- **INVESTIGATION**: Admin reviews associated `AuditLogs`, `Conversations`, and `Documents`.
- **RESOLUTION**: Admin executes a `ModerationAction` (Warning, Suspension, Content Removal).
- **LOGGING**: Decision is recorded in `AuditLog` with Admin ID and reasoning.

## 3. Reporting Triggers (UI)

Users can report activity via:
- **Product Listing**: "Report Suspicious Listing" (Price manipulation, fake photos).
- **Messaging**: "Report Abuse" (Off-platform payment solicitation, harassment).
- **RFQ**: "Report Spam" (Non-serious buyers).
- **Reviews**: "Report Manipulation" (Rating rings, incentivized feedback).

## 4. API Endpoints (Conceptual)

### Reporting
- `POST /api/moderation/report`: Submit a new user report.
- `GET /api/moderation/cases`: Fetch assigned cases for current admin.
- `PATCH /api/moderation/cases/:id`: Update case status.

### Enforcement
- `POST /api/moderation/action`: Execute suspension or removal.
- `GET /api/moderation/flags`: Real-time stream of automated risk signals.

### Logs
- `GET /api/moderation/audit`: Search platform-wide integrity logs.

## 5. Safety Control Settings

Admins configure global thresholds:
- `MAX_RFQ_UNVERIFIED`: 2 per day.
- `MIN_RATING_FEATURED`: 4.5 stars.
- `AUTO_SUSPEND_FRAUD_SCORE`: 90/100.
