
# GeoTrade Nexus Search & Advanced Filter System Design

This document outlines the architecture for the platform's discovery and filtering infrastructure.

## 1. Search Logic & Categorization

The search system uses a multi-entity index to provide categorized results from a single query.

| Entity Type | Primary Search Fields | Key Filters |
| :--- | :--- | :--- |
| **Products** | Name, Mineral Type, Grade, Origin. | Purity %, Price Range, Quantity, Certification. |
| **Suppliers** | Company Name, Region, Bio. | Verification Level, Years Active, Rating. |
| **RFQs** | Title, Mineral Type, Destination. | Status (Open/Closed), Quantity Range, Deadline. |

## 2. Advanced Filter Models

### Technical Mineral Filters (Product Context)
- **Chemical Composition**: Dynamic range sliders based on mineral type (e.g., Fe % for Iron, SiO2 % for Silica).
- **Physical Specs**: Particle size (mm), Moisture content (%).
- **Compliance**: Filter for specific certifications (ISO, Responsible Sourcing).

### Trust & Logistics Filters (Supplier Context)
- **Verification Tier**: Level 1, 2, or 3 KYC.
- **Export Capability**: Filter for companies with active international trade permits.
- **Geographic Proximity**: Distance from specific global trade hubs/ports.

## 3. Saved Search & Alert Workflow

1. **Selection**: User applies complex filters (e.g., "Iron Ore > 62% Fe in South America").
2. **Persistence**: User clicks "Save Search". System records criteria in `SavedSearch` entity.
3. **Monitoring**: A background process matches new `ProductListing` or `RFQRequest` records against saved searches.
4. **Trigger**: Upon match, system generates a `Notification` for the user.

## 4. API Endpoints (Conceptual)

### Execution
- `GET /api/search?q={query}&type={category}`: Primary search.
- `GET /api/search/suggestions?q={partial}`: Autocomplete keywords and company names.

### Management
- `POST /api/search/saved`: Save current filter state for a user.
- `GET /api/search/saved`: Retrieve user's saved searches.
- `DELETE /api/search/saved/:id`: Remove saved search.

### Analytics
- `GET /api/admin/search/analytics`: Identify trending minerals and frequent "No Results" queries.

## 5. Visual Standards

- **Filter Sidebar**: Sticky left-hand layout with collapsible sections.
- **Result Highlighting**: Keywords are bolded in snippets.
- **Verification Priority**: Verified results are boosted in default relevance ranking.
