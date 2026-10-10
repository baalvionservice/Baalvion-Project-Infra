"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart2, TrendingUp, Package, Star, Users, Eye,
  ArrowUpRight, ArrowDownRight, Loader2, AlertCircle,
} from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { getMyMember, type SellerOverview } from "@/lib/api/members"
import { listMySales, type SellerSale } from "@/lib/api/orders"
import { listMyStores, listStoreProducts, type CommerceProduct } from "@/lib/api/commerce-admin"
import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce"

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number, currency = "USD") {
  return n.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
}

// ── Mini bar chart (pure CSS, no external lib) ────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; max: number }[] }) {
  if (!data.length) return null;
  const peak = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-[9px] text-gray-600 font-bold tabular-nums">
            {d.value > 0 ? d.value : ""}
          </span>
          <div className="w-full rounded-t-md bg-white/5 relative overflow-hidden" style={{ height: "100%" }}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-cyan-400/60 rounded-t-md transition-all duration-700"
              style={{ height: `${Math.max((d.value / peak) * 100, d.value > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-600 font-medium truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, tone = "text-white", change,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; tone?: string;
  change?: { direction: "up" | "down"; text: string };
}) {
  return (
    <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon className={`w-5 h-5 ${tone}`} />
        </div>
        {change && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${change.direction === "up" ? "text-emerald-400" : "text-red-400"}`}>
            {change.direction === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {change.text}
          </span>
        )}
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-2xl font-bold ${tone}`}>{value}</div>
        {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
      </div>
    </NexusCard>
  );
}

// ── Derived data helpers ──────────────────────────────────────────────────────
function monthLabel(iso: string) {
  return new Date(iso + "-01").toLocaleDateString("en-US", { month: "short" });
}

function salesByMonth(sales: SellerSale[]) {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const counts: Record<string, number> = {};
  for (const s of sales) {
    const m = s.createdAt.slice(0, 7);
    if (months.includes(m)) counts[m] = (counts[m] ?? 0) + 1;
  }
  return months.map((m) => ({ label: monthLabel(m), value: counts[m] ?? 0, max: 0 }));
}

function revenueByMonth(sales: SellerSale[]) {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const totals: Record<string, number> = {};
  for (const s of sales) {
    if (s.paymentStatus !== "paid") continue;
    const m = s.createdAt.slice(0, 7);
    if (!months.includes(m)) continue;
    const g = s.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    totals[m] = (totals[m] ?? 0) + g;
  }
  return months.map((m) => ({ label: monthLabel(m), value: Math.round(totals[m] ?? 0), max: 0 }));
}

export default function SellerAnalyticsPage() {
  const [seller, setSeller] = useState<SellerOverview | null>(null);
  const [sales, setSales] = useState<SellerSale[]>([]);
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueRange, setRevenueRange] = useState<"6m" | "all">("6m");

  useEffect(() => {
    Promise.all([
      getMyMember().catch(() => null),
      listMySales(MARKET_UNDERWORLD_STORE_ID).catch(() => []),
      listMyStores().then((stores) =>
        stores.length ? listStoreProducts(stores[0].id, { limit: 100 }).then((r) => r.items) : []
      ).catch(() => []),
    ]).then(([m, s, p]) => {
      if (m?.seller) setSeller(m.seller);
      setSales(s);
      setProducts(p);
    }).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const paidSales = useMemo(() => sales.filter((s) => s.paymentStatus === "paid"), [sales]);

  const totalRevenue = useMemo(() => {
    return paidSales.reduce((sum, s) => sum + s.items.reduce((si, i) => si + Number(i.price) * i.quantity, 0), 0);
  }, [paidSales]);

  const avgOrderValue = paidSales.length ? totalRevenue / paidSales.length : 0;

  const currency = sales[0]?.currencyCode ?? "USD";

  const conversionRate = useMemo(() => {
    if (!sales.length) return 0;
    return Math.round((paidSales.length / sales.length) * 100);
  }, [sales, paidSales]);

  const avgRating = seller?.rating.average ?? null;
  const ratingCount = seller?.rating.count ?? 0;

  const orderBarData = useMemo(() => salesByMonth(sales), [sales]);
  const revenueBarData = useMemo(() => revenueByMonth(sales), [sales]);

  // Top products by order count
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; orders: number; revenue: number }> = {};
    for (const s of paidSales) {
      for (const item of s.items) {
        const key = item.productId ?? item.name;
        if (!counts[key]) counts[key] = { name: item.name, orders: 0, revenue: 0 };
        counts[key].orders += item.quantity;
        counts[key].revenue += Number(item.price) * item.quantity;
      }
    }
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [paidSales]);

  // Month-over-month change
  const momChange = useMemo(() => {
    const now = new Date();
    const thisM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevM = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;
    const thisCount = sales.filter((s) => s.createdAt.startsWith(thisM) && s.paymentStatus === "paid").length;
    const prevCount = sales.filter((s) => s.createdAt.startsWith(prevM) && s.paymentStatus === "paid").length;
    if (!prevCount) return null;
    const pct = Math.round(((thisCount - prevCount) / prevCount) * 100);
    return { direction: pct >= 0 ? "up" : "down" as const, text: `${Math.abs(pct)}% vs last month` };
  }, [sales]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] pt-24 flex items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050508] pt-16 max-w-[1200px] mx-auto px-6">
        <NexusCard className="p-10 text-center border-red-500/20 bg-red-500/5 text-red-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          {error}
        </NexusCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white pb-32">
      <div className="max-w-[1200px] mx-auto px-6 pt-10 space-y-10">

        {/* Header */}
        <header>
          <p className="text-cyan-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-3">Seller · Analytics</p>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Store Analytics</h1>
          <p className="text-gray-500 text-lg">Performance metrics for your listings and sales.</p>
        </header>

        {/* KPI stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={TrendingUp} label="Total Revenue" value={fmt(totalRevenue, currency)}
            sub={`${paidSales.length} paid orders`} tone="text-emerald-400" change={momChange ?? undefined}
          />
          <StatCard
            icon={BarChart2} label="Avg Order Value" value={avgOrderValue ? fmt(avgOrderValue, currency) : "—"}
            sub="Per paid order" tone="text-cyan-400"
          />
          <StatCard
            icon={Users} label="Conversion Rate" value={`${conversionRate}%`}
            sub={`${paidSales.length} of ${sales.length} orders paid`} tone="text-purple-400"
          />
          <StatCard
            icon={Star} label="Seller Rating"
            value={avgRating ? `${avgRating.toFixed(1)} ★` : "—"}
            sub={ratingCount ? `${ratingCount} review${ratingCount !== 1 ? "s" : ""}` : "No reviews yet"}
            tone="text-amber-400"
          />
        </div>

        {/* Listing health */}
        {seller && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Live",        value: seller.listings.published,      color: "bg-emerald-400" },
              { label: "In Review",   value: seller.listings.pending_review, color: "bg-amber-400" },
              { label: "Draft",       value: seller.listings.draft,          color: "bg-gray-600" },
              { label: "Rejected",    value: seller.listings.rejected,       color: "bg-red-400" },
              { label: "Archived",    value: seller.listings.archived,       color: "bg-gray-700" },
            ].map((item) => (
              <NexusCard key={item.label} className="p-5 bg-white/[0.02] border-white/5 text-center space-y-2">
                <div className={`w-2 h-2 rounded-full ${item.color} mx-auto`} />
                <div className="text-2xl font-bold text-white">{item.value}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</div>
              </NexusCard>
            ))}
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders chart */}
          <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white">Orders — Last 6 Months</h2>
                <p className="text-xs text-gray-600 mt-0.5">Paid orders by calendar month</p>
              </div>
              <Package className="w-4 h-4 text-gray-700" />
            </div>
            {sales.length ? (
              <BarChart data={orderBarData} />
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
            )}
          </NexusCard>

          {/* Revenue chart */}
          <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white">Revenue — Last 6 Months</h2>
                <p className="text-xs text-gray-600 mt-0.5">Gross revenue ({currency})</p>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-700" />
            </div>
            {sales.length ? (
              <BarChart data={revenueBarData} />
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
            )}
          </NexusCard>
        </div>

        {/* Top products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Top Products by Revenue</h2>
            <a href="/seller/listings" className="text-xs font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300">
              View all listings →
            </a>
          </div>

          {topProducts.length === 0 ? (
            <NexusCard className="p-16 text-center border-white/5 bg-white/[0.02] space-y-4">
              <Package className="w-10 h-10 text-gray-700 mx-auto" />
              <p className="text-gray-500 font-medium">No sales data yet.</p>
              <p className="text-sm text-gray-600">Once you have completed orders, your top products will appear here.</p>
              <a href="/seller/listings"><NexusButton>Manage Listings</NexusButton></a>
            </NexusCard>
          ) : (
            <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Units Sold</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Revenue</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-600 w-5 tabular-nums">#{i + 1}</span>
                          <span className="font-medium text-white truncate max-w-[260px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400 tabular-nums">{p.orders}</td>
                      <td className="px-6 py-4 text-right font-bold text-white tabular-nums">{fmt(p.revenue, currency)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${Math.round((p.revenue / totalRevenue) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 tabular-nums w-8 text-right">
                            {Math.round((p.revenue / totalRevenue) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </NexusCard>
          )}
        </section>

        {/* Fulfillment stats */}
        {seller && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NexusCard className="p-5 bg-white/[0.02] border-white/5 text-center space-y-2">
              <div className="text-2xl font-bold text-white">{seller.sales.orders}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Orders</div>
            </NexusCard>
            <NexusCard className="p-5 bg-white/[0.02] border-white/5 text-center space-y-2">
              <div className="text-2xl font-bold text-white">{seller.sales.toFulfil}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">To Ship</div>
            </NexusCard>
            <NexusCard className="p-5 bg-white/[0.02] border-white/5 text-center space-y-2">
              <div className="text-2xl font-bold text-emerald-400">{seller.sales.delivered}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Delivered</div>
            </NexusCard>
            <NexusCard className="p-5 bg-white/[0.02] border-white/5 text-center space-y-2">
              <div className="text-2xl font-bold text-amber-400">{seller.sales.toRate}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Awaiting Rating</div>
            </NexusCard>
          </div>
        )}

      </div>
    </div>
  );
}
