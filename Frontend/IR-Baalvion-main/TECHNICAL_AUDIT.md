# Baalvion Investor Relations Platform – Technical Audit v1.0

## 1. Executive Summary
The Baalvion IR Platform is a production-grade Next.js 15 application designed for institutional-grade investor relations, capital operations, and governance transparency. It utilizes a custom **RBAC (Role-Based Access Control) Engine** to simulate a multi-persona environment (Public, Investor, Admin, Board) without requiring a live backend.

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS + ShadCN UI
- **Charts:** Recharts (SSR-Safe)
- **State Management:** Custom Hook-based Abstraction + localStorage Persistence
- **Security:** Edge Middleware + JWT-style Mock Cookie Sessions

---

## 2. Page Inventory & Routing Map

### 2.1 Public Infrastructure (Role: `public`)
| Route | Purpose | Components | SEO / Data |
|-------|---------|------------|------------|
| `/` | Primary Index / Hero | `HeroSection`, `WhoWeAre`, `TrustSignals` | JSON-LD `FinancialService` |
| `/governance/overview` | Policy & Frameworks | `GovernanceOverview` | Corporate Bylaws focus |
| `/governance/leadership` | Executive Profiles | `LeadershipPage` | `ExecutiveCommittee` schema |
| `/news-and-events/news` | Media Center | `NewsSection`, `Carousel` | `NewsArticle` schema |
| `/news-and-events/events` | Investor Day Hub | `Calendar`, `FeaturedPresentation` | `Event` structured data |
| `/onboarding` | Registration Funnel | `OnboardingFunnel`, `Stepper` | Multi-step user entry |

### 2.2 Secure Investor Portal (Role: `phase1`, `phase2`, `phase3`)
| Route | Purpose | Key Module | Access Level |
|-------|---------|------------|--------------|
| `/performance` | **Unified Command** | `MetricsGrid`, `PerformanceCharts` | Accredited Only |
| `/dashboard` | P1 Overview | `CapitalSummary`, `NavChart` | Institutional |
| `/data-room` | P1 Vault | `DocumentCard`, `ActivityLog` | Audit-Grade |
| `/phase2/dashboard` | SPV Management | `SpvOverview`, `CapitalAccount` | Deal-Specific |
| `/phase3/dashboard` | Operator Equity | `EquityGrant`, `VestingSchedule` | Invited Operators |
| `/governance/my-voting`| Ballot Center | `ResolutionCard`, `SecureBallot` | Voting Power |

### 2.3 Admin GP Command Center (Role: `admin`, `compliance`)
| Route | Purpose | Key Module |
|-------|---------|------------|
| `/admin/dashboard` | GP Operations | `ApprovalsPanel`, `VotingPanel` |
| `/admin/intelligence` | ESG & Risk | `ESGDashboard`, `RiskRadar` |
| `/admin/reports` | Regulatory Export | `ReportGenerator`, `DataSnapshot` |
| `/admin/subscribers` | Investor Registry | `SubscriberManager`, `AccessControl` |

---

## 3. Core Component Catalog (`/src/components/*`)

### 3.1 Layout & Navigation
- **`Header`**: Context-aware nav builder. Uses `navigationService` to filter links by role.
- **`Sidebar`**: Administrative navigation with collapsed states.
- **`LanguageSelector`**: i18n bridge. Dispatches `locale-changed` events.

### 3.2 Financial & Data Visualization
- **`NavChart`**: Responsive Area chart. Includes hidden `table` for screen reader accessibility.
- **`MetricsSummaryGrid`**: High-density display for PE metrics (IRR, TVPI, DPI).
- **`CapitalFlowVisualization`**: Hierarchical block view of the "Commitment -> Deployed" pipeline.

### 3.3 Operations & Interaction
- **`CapitalCallGenerator`**: Admin-only tool for pro-rata financial arithmetic.
- **`AllocationEngine`**: Logic-heavy component for deploying funds into SPV buckets.
- **`ActivityLogPanel`**: Persistent audit trail sidebar. Connected to the global `auditService`.

---

## 4. Advanced Hook Abstraction (`/src/hooks/*`)
*All hooks are designed to be "Backend Ready"—simply swap the simulated service for a `fetch` request.*

- **`useAuth`**:
  - **Purpose:** Manages identity and role escalation.
  - **Logic:** Syncs `localStorage` with `cookies` for middleware-level enforcement.
- **`useCapitalTransactions`**:
  - **Purpose:** Handles the lifecycle of money.
  - **Logic:** Calculates pro-rata drawdowns and tracks wire confirmations.
- **`useNavMetrics`**:
  - **Purpose:** Central source for valuation data.
  - **Logic:** Provides deterministic performance history for charts.
- **`useDocumentDownload`**:
  - **Purpose:** Secure egress management.
  - **Logic:** Triggers a `DataRoom` audit log entry *before* initiating the simulated download.

---

## 5. Security & RBAC Architecture

### 5.1 Role-Based Access Control (`/src/lib/rbac/*`)
- **`PERMISSION_REGISTRY`**: Single source of truth mapping actions (e.g., `PUBLISH_NAV`) to roles.
- **`ROUTE_POLICIES`**: Maps URL prefixes to required permissions.
- **`checkPermission`**: Utility used by components to conditionally render UI elements.

### 5.2 Edge Middleware (`/src/middleware.ts`)
The "Gatekeeper" of the application.
1. Intercepts incoming requests.
2. Resolves required permission from `routeRegistry`.
3. Validates `baalvion_session_mock` cookie.
4. Redirects unauthorized users to `/` with a clear signal.

---

## 6. Data Lifecycle & Persistence

### 6.1 Simulation Store
- **`StorageAdapter`**: A persistence wrapper for `localStorage`.
- **`domain` isolation:** Ensures `navigation` data doesn't mix with `audit` data.
- **Latency Simulation:** Hardcoded 400ms delay to simulate network round-trips.

### 6.2 Audit-Grade Logging
The `auditService` captures:
- `userRole`
- `module` (e.g., Navigation, Reporting)
- `action` (e.g., Edit, Approve)
- `previousState` vs `newState` (for diffing)

---

## 7. Internationalization & Accessibility (i18n / A11y)

### 7.1 i18n Engine
- **Dictionaries:** `/i18n/*.json` (EN, ES, FR).
- **Formatting:** `src/utils/i18n.ts` uses the `Intl` API for localized currency (`$1.2M` vs `1,2M €`) and decimal separators.

### 7.2 A11y Compliance
- **Skip-to-Content:** Found in `RootLayout`.
- **ARIA Enrichment:** Charts use `aria-labelledby` and hidden data tables.
- **Contrast:** Private equity theme optimized for readable high-contrast ratios.

---

## 8. Dynamic Flows (The "Baalvion Lifecycle")

1. **Discovery:** User lands on `/` as `public`.
2. **Onboarding:** User navigates to `/onboarding`.
3. **Escalation:** Completion of onboarding updates `baalvion_session_mock` cookie to `p1_institutional`.
4. **Operations:** Investor views `/performance`. Admin generates a call in `/admin/dashboard`.
5. **Transparency:** Alert fires via `useNotifications`. Investor downloads "Performance Package" via `EventPackageDownload`.
6. **Audit:** Every step above is captured in the **Compliance Ledger**.

---

## 9. Developer Extension Guide

### Adding a New Document
1. Update `src/lib/dataroom/data.ts`.
2. Assign the appropriate `allowedRoles`.
3. The `DataRoomPage` will automatically sanitize the view.

### Adding a New Admin Module
1. Add route to `src/lib/rbac/routeRegistry.ts`.
2. Define permissions in `src/lib/rbac/permissionRegistry.ts`.
3. Update `Sidebar` link tree in `src/components/admin/sidebar.tsx`.

### Connecting a Real Backend
1. Update `ENV_CONFIG.mode` to `"production"`.
2. Replace mock logic in `/src/hooks/*` with async `fetch` or `axios` calls.
3. Update `authService` to handle real JWT tokens in the `baalvion_session_mock` cookie.

---
*Audit Completed by: Baalvion AI Engineering Team*
