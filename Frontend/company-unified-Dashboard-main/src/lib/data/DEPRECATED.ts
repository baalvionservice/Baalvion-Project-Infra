/**
 * @deprecated
 * All JSON data files in this directory (`src/lib/data/`) are deprecated mock fixtures.
 * They are kept for reference only and MUST NOT be imported in production code.
 *
 * All data is now served by dashboard-service (:3009).
 * Use `dashboardApi.*` methods from `@/lib/api-client` instead:
 *
 * - businesses.json / businesses.ts  → dashboardApi.businesses()
 * - shareholders.json                → dashboardApi via /api/v1/shareholders
 * - financial-entries.json           → dashboardApi.financials()
 * - profit-distributions.json        → dashboardApi via /api/v1/distribution/history
 * - audit-logs.json                  → dashboardApi.auditLogs()
 * - employees.json                   → dashboardApi.employees()
 * - kpis.json                        → dashboardApi.kpis()
 * - notifications.json               → dashboardApi.notifications()
 * - fx-rates.json / fx-rates-detailed.json → dashboardApi.fxRates()
 * - countries.json                   → dashboardApi.countries()
 * - equity.json                      → dashboardApi.equity()
 * - corporate-actions.json           → dashboardApi.corporate()
 * - All others                       → equivalent dashboardApi or realtime events
 */

export const _DEPRECATED_NOTICE = true;
