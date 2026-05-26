
# GeoTrade Nexus Multi-Language & Localization Design

This document outlines the architecture for supporting a global user base through interface translation and content localization.

## 1. Localization Model

The platform utilizes a dual-track localization strategy:

| Component | Handling Method | Storage Strategy |
| :--- | :--- | :--- |
| **System UI** | Key-based translation files. | `translations` collection (indexed by key + locale). |
| **Marketplace Content** | Field-level overrides for entities. | `localized_content` collection (links to entity IDs). |
| **Regional Formats** | Formatting utilities based on User Preference. | Client-side formatters using `Intl` API. |

## 2. Language Registry

| Locale | Language | Script Direction | Region Focus |
| :--- | :--- | :--- | :--- |
| `en` | English | LTR | Global Standard |
| `zh` | Chinese (Simplified) | LTR | East Asia / Procurement |
| `ar` | Arabic | RTL | Middle East / Finance |
| `es` | Spanish | LTR | South America / Mining |
| `fr` | French | LTR | Africa / Logistics |
| `hi` | Hindi | LTR | South Asia / Manufacturing |

## 3. Localization Workflow

1.  **Detection**: System checks `UserPreference.language`. If null, falls back to `navigator.language` or `Accept-Language` header.
2.  **UI Loading**: Client fetches translation bundle for the current "namespace" (e.g., `dashboard`, `marketplace`).
3.  **Content Resolution**: When rendering a `ProductListing`, the system checks for a record in `localized_content` where `entityId = product.id` and `language = currentLocale`.
4.  **Formatting**: Date and Currency strings are passed through the `RegionalFormatter` which applies preferences for `dateFormat` and `unitSystem`.

## 4. API Structure (Conceptual)

### Management
- `GET /api/localization/languages`: Retrieve list of supported locales.
- `GET /api/localization/bundle/:namespace/:locale`: Fetch translation keys for a specific UI section.
- `POST /api/admin/localization/update`: Admin update for a specific translation key.

### Content
- `POST /api/content/translate`: Request a localized version of a specific content field.
- `GET /api/content/localized/:entityType/:id`: Retrieve all available language versions for a record.

## 5. Regional Formatting Standards

- **Units**: Default to Metric (MT, kg, km) with user-toggle for Imperial (Tons, lbs, miles).
- **Currency**: Primary display in native currency with secondary conversion to `UserPreference.referenceCurrency`.
- **Dates**: Standardized to ISO 8601 for storage; rendered per regional preference (e.g., `YYYY-MM-DD`).
