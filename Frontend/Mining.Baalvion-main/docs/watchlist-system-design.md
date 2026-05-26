
# GeoTrade Nexus Watchlist & Alert System Design

This document outlines the architecture for tracking marketplace items and delivering proactive business intelligence.

## 1. Monitoring Workflows

### Favorites (Manual Bookmarking)
- **Action**: User clicks the "Heart" or "Star" icon on a Listing, Profile, or RFQ.
- **Logic**: System adds a record to the `favorites` collection linking `userId` + `entityId`.
- **UI**: Displayed in the dedicated "My Watchlist" hub.

### Automated Alerts (Triggers)
The system monitors state changes in tracked entities:
| Event | Trigger Condition | Notification Payload |
| :--- | :--- | :--- |
| **Price Drop** | `ProductListing.price` decreases by >5% | "Price updated for [Mineral]: Now $[Price]" |
| **New Bid** | `RFQQuotation` created for watched RFQ | "New bid received for RFQ #[ID]" |
| **Supplier Grade** | `SupplierProfile.averageRating` changes | "New review for followed supplier [Name]" |
| **New Inventory** | Followed Supplier publishes a new Listing | "[Name] just listed [Mineral] ([Grade])" |

## 2. API Structure (Conceptual)

### Tracking
- `POST /api/watchlist/toggle`: Add or remove an entity from user's favorites.
- `GET /api/watchlist/summary`: Retrieve aggregated count of tracked items.
- `GET /api/watchlist/items?type=[PRODUCT|SUPPLIER|RFQ]`: Fetch full details of bookmarked items.

### Alerts
- `GET /api/alerts/history`: Fetch time-stamped log of triggered alerts.
- `PATCH /api/alerts/preferences`: Update delivery channels (Email/In-app) for event types.
- `DELETE /api/alerts/clear`: Mark alerts as read or remove from log.

## 3. Database Schema (Conceptual Tables)

### favorite_items
- `id`: Unique Identifier
- `userId`: Reference to User
- `entityType`: ENUM (PRODUCT, SUPPLIER, RFQ)
- `entityId`: Reference to target record
- `createdAt`: Timestamp

### alert_events
- `id`: Unique Identifier
- `userId`: Target Recipient
- `type`: ENUM (PRICE_CHANGE, NEW_BID, etc)
- `payload`: JSON data for notification
- `status`: ENUM (UNREAD, READ)
- `triggeredAt`: Timestamp

## 4. UI Structure

- **Watchlist Hub**: A centralized dashboard view with categorized tabs for Products, Suppliers, and RFQs.
- **Alert Panel**: A side-drawer or popover for real-time activity updates.
- **Action Buttons**: Standardized "Favorite" icons integrated into all discovery components.
