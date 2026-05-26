
# GeoTrade Nexus Notification & Alert System Design

This document outlines the architecture for real-time awareness and event-driven communication within the platform.

## 1. Notification Categories & Priorities

| Category | Priority | Trigger Event | Primary Recipient |
| :--- | :--- | :--- | :--- |
| **FINANCIAL** | HIGH | Escrow Funded, Payment Released, Refund Issued | Buyer, Seller, Finance |
| **LOGISTICS** | MEDIUM | Shipment Dispatched, Port Arrival, Delivery Confirmed | Buyer, Logistics, Warehouse |
| **PROCUREMENT** | MEDIUM | New RFQ Bid, Quotation Accepted, Bid Expired | Buyer, Seller |
| **COMPLIANCE** | HIGH | Document Rejected, License Expired, Security Flag | All Roles |
| **SYSTEM** | LOW | Maintenance Notice, Policy Update, New Feature | All Roles |

## 2. Delivery Logic (Omni-Channel)

The system utilizes a "Channel Multiplexer" to route notifications based on user preferences:
- **In-Platform**: Real-time popover and persistent history ledger.
- **Email**: HTML-formatted transactional emails for all HIGH and MEDIUM priority events.
- **SMS**: Optional opt-in for CRITICAL logistics and financial events.

## 3. Workflow: Event to Alert

1. **Event Capture**: A database trigger or application service detects a state change (e.g., `Order.status` becomes `SHIPPED`).
2. **Payload Construction**: System retrieves the appropriate `NotificationTemplate` and injects context (Order ID, Carrier Name).
3. **Preference Filter**: System checks `UserPreference.notifications` to see if the recipient has this alert type enabled for the specific channel.
4. **Dispatch**: Notification is written to the `notifications` collection and pushed to the client via real-time stream.

## 4. API Endpoints (Conceptual)

- `GET /api/notifications`: Retrieve paginated history for active user.
- `PATCH /api/notifications/:id/read`: Mark a specific alert as viewed.
- `POST /api/admin/broadcast`: Dispatch a system-wide announcement.
- `GET /api/notifications/unread-count`: Fetch current alert badge count.
- `PATCH /api/user/notification-settings`: Update delivery channel preferences.

## 5. UI Placement Standards

- **Header Bell**: Displays unread count; opens high-level summary popover.
- **Notification Page**: Dedicated `/dashboard/notifications` for full history and advanced filtering.
- **Action Links**: Every notification includes a `deep_link` attribute to the associated record (e.g., Order #9921).
