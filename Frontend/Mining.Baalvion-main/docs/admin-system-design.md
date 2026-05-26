
# GeoTrade Nexus Super Admin System Design

This document outlines the architecture and workflows for the platform's central control system.

## 1. Role Permission Matrix

| Role | Permissions | Responsibilities |
| :--- | :--- | :--- |
| **Super Admin** | Full access to all modules, settings, and logs. | Platform governance, root configuration. |
| **Compliance Officer** | Companies, Mining Licenses, Product Moderation. | Verifying legitimacy and mineral purity. |
| **Finance Manager** | Payments, Commissions, Escrow, Refunds. | Financial oversight and platform revenue. |
| **Support Lead** | Users, Disputes, Messages. | User satisfaction and conflict resolution. |
| **Logistics Admin** | Carriers, Warehouses, Shipments. | Supply chain integrity. |

## 2. Admin Activity Logging System

Every write operation performed by an administrator must be recorded in the `admin_logs` collection.
- **Fields**: `timestamp`, `admin_id`, `ip_address`, `action_code`, `entity_type`, `entity_id`, `payload_diff`.
- **Integrity**: Logs are immutable. System alerts if log sequence is broken.

## 3. Fraud Detection Workflow

1. **Detection**: AI services monitor price anomalies (e.g., Lithium priced 50% below market) and overlapping metadata in KYC documents.
2. **Alerting**: System generates a `FraudAlert` with `HIGH` severity.
3. **Investigation**: Compliance Officer reviews the alert in the "Fraud Monitoring" module.
4. **Action**: Admin can:
   - **Suspend**: Temporarily freeze account/listings.
   - **Flag**: Request immediate re-verification of documents.
   - **Clear**: Dismiss alert if false positive.
5. **Reporting**: Findings are logged and affect the user/company's internal trust score.

## 4. Dispute Resolution & Escrow Control

The Dispute Resolution module manages conflicts and enforces financial safety.
1. **Trigger**: Buyer or Seller opens a `Dispute` linked to a `TradeOrder`.
2. **Lockdown**: System automatically sets `TradeOrder.escrowStatus` to `DISPUTED` and freezes `EscrowAccount.balance`.
3. **Evidence**: Admin (Support Lead) reviews `DisputeMessage` thread and attached `InspectionReport` or `Shipment` docs.
4. **Resolution**: Admin issues a `DisputeDecision`.
   - **RELEASE**: Balance released to Seller.
   - **REFUND**: Balance returned to Buyer.
   - **SPLIT**: Pro-rata distribution between parties.
5. **Finalization**: `EscrowAccount` status updated, and financial ledger recorded in `Transactions`.

## 5. Financial Controls (Escrow & Commission)

- **Commission Engine**: Admin sets `%` or `flat fee` in the "Platform Config" module. These are applied dynamically at checkout.
- **Escrow Oversight**: Admin can manually intercede in escrow funds *only* when a formal `Dispute` is open and active.

## 6. API Structure (Conceptual)

### User Management
- `GET /api/admin/users`: Search and filter user base.
- `PATCH /api/admin/users/:id/status`: Suspend/Activate.
- `POST /api/admin/users/:id/roles`: Assign permissions.

### Compliance
- `POST /api/admin/companies/:id/verify`: Approve/Reject registration.
- `GET /api/admin/companies/verification-queue`: Pending reviews.

### Disputes & Resolution
- `GET /api/admin/disputes`: Fetch all active conflicts.
- `POST /api/admin/disputes/:id/resolve`: Issue decision and execute payment action.
- `GET /api/admin/disputes/:id/evidence`: Retrieve all files and messages.

### Finance
- `GET /api/admin/finances/escrow-monitor`: Real-time view of funds in transit.
- `POST /api/admin/finances/disputes/:id/resolve`: Release or refund funds.
