"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, BarChart3, Mic, ArrowRight } from "lucide-react";
import type { FinancialReport } from "@/lib/ir-reports";

const REPORTS_PAGE = "/news-and-events/financial-reports";

// Compact currency formatter — turns 1250000000 into "$1.25B" etc.
function money(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function QuarterlyResultsSection() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    fetch("/api/ir/reports")
      .then((r) => r.json())
      .then((j) => {
        if (!on) return;
        const reports: FinancialReport[] = j?.data ?? [];
        // Prefer the latest quarterly report; otherwise the latest report of any type.
        const latest = reports.find((r) => r.type === "quarterly") ?? reports[0] ?? null;
        setReport(latest);
      })
      .catch(() => {})
      .finally(() => on && setLoaded(true));
    return () => {
      on = false;
    };
  }, []);

  // Build the KPI tiles only from metrics that actually exist on the report.
  const kpis: { label: string; value: string }[] = [];
  if (report) {
    if (report.revenue != null)
      kpis.push({ label: report.revenueGrowthPct != null ? `Revenue · +${report.revenueGrowthPct}% YoY` : "Revenue", value: money(report.revenue) });
    if (report.netIncome != null) kpis.push({ label: "Net income", value: money(report.netIncome) });
    if (report.eps != null) kpis.push({ label: "EPS", value: `$${report.eps.toFixed(2)}` });
  }

  const periodLabel = report?.period ?? "Latest period";
  const releaseHref = report?.fileUrl || REPORTS_PAGE;

  return (
    <section className="relative w-full min-h-[400px] py-16 text-white">
      {/* On-brand gradient backdrop (no external image dependency) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.25),transparent_45%)] bg-neutral-950" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="container relative z-10 mx-auto flex min-h-[336px] flex-col items-center justify-center px-4 text-center space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Financial Results</p>
          <h2 className="text-3xl md:text-5xl font-bold">{report ? report.title : "Quarterly Results"}</h2>
          <p className="text-lg font-semibold tracking-wider text-white/80">{periodLabel}</p>
        </div>

        {/* Real headline KPIs (rendered only when present on the published report) */}
        {kpis.length > 0 && (
          <div className="grid w-full max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {kpis.map((k) => (
              <div key={k.label} className="bg-neutral-950/80 px-6 py-5">
                <p className="text-3xl md:text-4xl font-bold tracking-tight">{k.value}</p>
                <p className="mt-1 text-xs text-white/60">{k.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 sm:gap-12 md:gap-20">
          <Link href={releaseHref} className="flex flex-col items-center gap-2 text-white hover:text-primary transition-colors">
            <FileText className="h-7 w-7" />
            <span className="text-sm font-semibold">Earnings Release</span>
          </Link>
          <Link href={REPORTS_PAGE} className="flex flex-col items-center gap-2 text-white hover:text-primary transition-colors">
            <BarChart3 className="h-7 w-7" />
            <span className="text-sm font-semibold">Financial Reports</span>
          </Link>
          <Link href="/news-and-events/events" className="flex flex-col items-center gap-2 text-white hover:text-primary transition-colors">
            <Mic className="h-7 w-7" />
            <span className="text-sm font-semibold">Webcasts</span>
          </Link>
        </div>

        <Button asChild className="bg-white text-black hover:bg-gray-200 rounded-sm">
          <Link href={REPORTS_PAGE}>
            All financial reports <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        {loaded && !report && (
          <p className="text-xs text-white/40">Financial reports will appear here once published in the investor console.</p>
        )}
      </div>
    </section>
  );
}
