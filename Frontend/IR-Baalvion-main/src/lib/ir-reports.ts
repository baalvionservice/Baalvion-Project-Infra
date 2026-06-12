// Server-side financial-reports fetcher.
//
// Reads published financial reports straight from ir-service (:3008). This runs on the
// server (in RSC / route handlers), so it reaches the backend on 127.0.0.1 directly —
// no browser CORS, no NEXT_PUBLIC wiring. Anonymous reads return the configured default
// org's PUBLISHED reports only (ir-service IR_DEFAULT_ORG_ID = the Baalvion org), which
// is exactly what should be public. If ir-service is unreachable we fall back to a small
// seed set so the page still renders rather than 500-ing.

const IR_SERVICE_URL = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';

export type FinancialReportType = 'quarterly' | 'annual' | 'interim' | 'special';

export interface FinancialReport {
  id: string;
  title: string;
  type: FinancialReportType;
  typeLabel: string;
  year: number;
  quarter: number | null;
  period: string;
  summary: string | null;
  highlights: string[];
  fileUrl: string | null;
  publishedAt: string | null;
  // Headline KPIs (null when not provided in the source report)
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  revenueGrowthPct: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  quarterly: 'Quarterly Report',
  annual: 'Annual Report',
  interim: 'Interim Report',
  special: 'Special Report',
};

function mapReport(r: any): FinancialReport {
  const type = (r.report_type ?? 'annual') as FinancialReportType;
  const year = Number(r.period_year) || new Date(r.published_at ?? Date.now()).getFullYear();
  const quarter = r.period_quarter != null ? Number(r.period_quarter) : null;
  return {
    id: String(r.id),
    title: r.title,
    type,
    typeLabel: TYPE_LABELS[type] ?? 'Report',
    year,
    quarter,
    period: quarter ? `Q${quarter} ${year}` : `FY ${year}`,
    summary: r.summary ?? null,
    highlights: Array.isArray(r.highlights) ? r.highlights : [],
    fileUrl: r.file_url ?? null,
    publishedAt: r.published_at ?? null,
    revenue: r.revenue != null ? Number(r.revenue) : null,
    netIncome: r.net_income != null ? Number(r.net_income) : null,
    eps: r.eps != null ? Number(r.eps) : null,
    revenueGrowthPct: r.revenue_growth_pct != null ? Number(r.revenue_growth_pct) : null,
  };
}

// Minimal fallback so the page never renders empty/broken when ir-service is down.
const SEED: FinancialReport[] = [
  {
    id: 'seed-annual-2025',
    title: 'Annual Report 2025',
    type: 'annual',
    typeLabel: 'Annual Report',
    year: 2025,
    quarter: null,
    period: 'FY 2025',
    summary: 'Full-year financial performance and strategic review.',
    highlights: [],
    fileUrl: null,
    publishedAt: '2026-01-31T00:00:00.000Z',
    revenue: null,
    netIncome: null,
    eps: null,
    revenueGrowthPct: null,
  },
];

export async function getFinancialReports(): Promise<{ reports: FinancialReport[]; live: boolean }> {
  try {
    const res = await fetch(`${IR_SERVICE_URL}/api/v1/reports?limit=50`, {
      // Editorial-style freshness: revalidate so newly published reports appear without a redeploy.
      next: { revalidate: 120 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`ir-service ${res.status}`);
    const json = await res.json();
    const items = Array.isArray(json?.data?.items) ? json.data.items : [];
    const reports = items
      .map(mapReport)
      .sort((a: FinancialReport, b: FinancialReport) =>
        b.year - a.year || (b.quarter ?? 0) - (a.quarter ?? 0),
      );
    return { reports, live: true };
  } catch {
    return { reports: SEED, live: false };
  }
}
