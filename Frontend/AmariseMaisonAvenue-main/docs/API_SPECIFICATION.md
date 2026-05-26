# AMARISÉ | ENTERPRISE API SPECIFICATION (V1)

This document defines the production-grade API contracts for the Amarisé Global Luxury Platform.

---

## 🔑 1. Authentication & Authorization
Since real Firebase Auth is deferred, we use a **Role-Aware Mock Token** system.

**Header**: `Authorization: Bearer {session_token}`

| Token | Role | Jurisdiction |
| :--- | :--- | :--- |
| `mock-user-token` | `user` | US |
| `mock-vip-token` | `vip` | AE |
| `mock-admin-token` | `admin` | GLOBAL |

---

## 🛍️ 2. Product & Registry APIs

### `GET /products`
Fetches curated artifacts with multi-market filtering.
- **Query Params**: `country`, `category`, `price_min`, `price_max`.
- **Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "prod_birkin_25",
      "name": "Birkin 25 Gold",
      "price": 28500,
      "currency": "USD",
      "stock_status": "available"
    }
  ]
}
```

---

## 💳 3. Payment & Settlement (Critical)

### `POST /payments/initiate`
Initializes a financial settlement session.
- **Header Required**: `X-Idempotency-Key` (Unique UUID)
- **Request**:
```json
{
  "order_id": "ord_1001",
  "gateway": "STRIPE",
  "amount": 28500,
  "currency": "USD"
}
```
- **Edge Case (Duplicate Key)**: Returns `409 Conflict` with the original transaction reference.

---

## 📦 4. Inventory Lock Management

### `POST /inventory/lock`
Reserves an artifact for 15 minutes.
- **Request**:
```json
{
  "variant_id": "var_001",
  "quantity": 1
}
```
- **Response**:
```json
{
  "status": "locked",
  "lock_id": "lock_992",
  "expires_at": "2024-03-15T12:15:00Z"
}
```

---

## 🔄 5. End-to-End Purchase Flow

1. **Discovery**: `GET /products?category=handbags`
2. **Reservation**: `POST /inventory/lock` (Triggers 15m timer)
3. **Intent**: `POST /orders/create` (Status: `PENDING_PAYMENT`)
4. **Settlement**: `POST /payments/initiate` (Returns `client_secret` or `gateway_id`)
5. **Verification**: `POST /payments/verify` (Simulates gateway webhook)
6. **Confirmation**: `GET /orders/{id}` (Status: `PAID`, triggers `shipment_init`)

---

## ⚠️ 6. Error Matrix

| Code | Message | Scenario |
| :--- | :--- | :--- |
| `401` | `Unauthorized` | Invalid or expired session token. |
| `402` | `Payment Required` | Gateway declined the transaction. |
| `409` | `Inventory Exhausted` | Item locked by another user or out of stock. |
| `422` | `Validation Error` | Invalid currency for the specified hub. |
