# AMARISÉ | INSTITUTIONAL DATABASE ARCHITECTURE (MOCK)

This document defines the production-grade NoSQL schema for the Amarisé Global Luxury Platform. Designed for 5 jurisdictions (US, UK, AE, IN, SG), supporting $100M+ scale.

---

## 🔑 1. Mock Authentication System
Since real authentication is deferred, the system utilizes a **Role-Aware Token Simulation**.

- **Session Validation**: APIs check the `user_sessions` collection. If `session_token` exists and `expires_at` > `now`, the request is authorized.
- **RBAC Logic**: User roles (User, VIP, Admin, Super_Admin) are resolved via the `role` field in the `users` or `admin_users` collections.

---

## 🗄️ 2. Collection Registry

### A. CORE COMMERCE
| Collection | Description | Relationships |
| :--- | :--- | :--- |
| `users` | Customer profiles and regional settings. | 1:N with `orders`, `carts` |
| `user_sessions` | Mock auth tokens for API validation. | 1:1 with `users` |
| `products` | Root product metadata (Global). | 1:N with `product_variants` |
| `product_variants` | Buyable items with regional pricing. | 1:1 with `inventory` |
| `inventory` | Stock levels per jurisdictional hub. | 1:1 with `product_variants` |
| `inventory_locks` | 15-min checkout reservations. | TTL-based auto-release |
| `carts` | Persistent shopping bag state. | 1:1 with `users` |

### B. TRANSACTIONAL LEDGER
| Collection | Description | Relationships |
| :--- | :--- | :--- |
| `orders` | Transaction headers and status. | 1:N with `order_items` |
| `order_items` | Snapshot of variants at purchase. | 1:1 with `product_variants` |
| `payments` | Financial settlement records. | 1:1 with `orders` |
| `payment_logs` | Raw gateway/webhook traces. | 1:1 with `payments` |
| `refunds` | Settlement reversal records. | 1:1 with `payments` |

### C. LOGISTICS & NOTIFICATIONS
| Collection | Description | Relationships |
| :--- | :--- | :--- |
| `shipments` | Carrier and tracking headers. | 1:1 with `orders` |
| `shipment_logs` | Milestone tracking steps. | 1:N with `shipments` |
| `notifications` | Cross-channel user alerts. | 1:N with `users` |

### D. INTERNAL & INTELLIGENCE
| Collection | Description | Relationships |
| :--- | :--- | :--- |
| `admin_users` | Internal staff and hub leads. | N:N with permissions |
| `admin_logs` | Staff action history. | 1:1 with `admin_users` |
| `audit_logs` | Entity-level change history (Diffs). | 1:1 with any entity |
| `ai_logs` | Decision and generation events. | 1:1 with `neural_traces` |
| `neural_traces` | AI reasoning logic and weights. | Deep audit trail |
| `search_index` | Flattened data for vector search. | Sync with `variants` |

### E. GLOBAL CONFIGURATION
| Collection | Description | Purpose |
| :--- | :--- | :--- |
| `country_configs` | Regional hub settings. | Currency, Locale, Hub Flag |
| `fx_rates` | Real-time conversion logic. | Global Pricing Sync |
| `tax_rules` | Jurisdictional tax logic. | VAT/GST/Sales Tax Calculation |

---

## 💎 3. Document Examples (JSON)

### Product Variant (`product_variants/{id}`)
```json
{
  "id": "var_birkin_25_gold",
  "product_id": "prod_hermes_birkin",
  "sku": "H-B25-G-001",
  "attributes": {
    "size": "25CM",
    "color": "Gold",
    "material": "Togo Leather",
    "hardware": "Palladium"
  },
  "regional_pricing": {
    "US": {"amount": 28500, "currency": "USD"},
    "AE": {"amount": 105000, "currency": "AED"},
    "IN": {"amount": 2400000, "currency": "INR"}
  },
  "is_vip_only": true,
  "created_at": "2024-03-15T10:00:00Z"
}
```

### Payment Record (`payments/{id}`)
```json
{
  "id": "pay_settle_992",
  "order_id": "ord_1001",
  "amount": 31741.89,
  "currency": "EUR",
  "gateway": "STRIPE",
  "status": "SUCCESS",
  "idempotency_key": "maison_auth_2024_03_15_X92",
  "gateway_response": {
    "id": "ch_3OcX...",
    "receipt_url": "https://stripe.com/..."
  },
  "created_at": "2024-03-15T12:00:00Z"
}
```

### AI Decision Log (`ai_logs/{id}`)
```json
{
  "id": "ail_9921",
  "feature": "dynamic_pricing",
  "context": {"variant_id": "var_birkin_25_gold", "hub": "AE"},
  "input": {"market_demand": 0.92, "competitor_stock": 0},
  "output": {"suggested_adjustment": +500, "confidence": 0.98},
  "latency_ms": 142,
  "trace_id": "nt_8821"
}
```

---

## ⚡ 4. Indexing & Query Patterns

### Read-Heavy (Storefront)
- **Pattern**: `Collection('product_variants').where('category', '==', 'handbags').where('is_vip_only', '==', false).orderBy('created_at')`
- **Index**: Composite [category, is_vip_only, created_at]

### Write-Heavy (Inventory)
- **Pattern**: `Collection('inventory_locks').where('expires_at', '<', now)`
- **Strategy**: Background cron to release expired locks.

### Global Search
- **Pattern**: Semantic search triggers `ai_logs` then fetches from `search_index`.

---

## 🔐 5. Security Summary (High Level)
- **Admin Isolation**: Admin users in the "IN" hub cannot view "US" revenue data (Partioned by `country_code`).
- **Audit Requirement**: Any change to `base_price` or `stock` MUST generate an `audit_logs` entry.
- **Payment Privacy**: `gateway_response` is restricted to Super_Admin and Finance_Lead roles only.
