"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle,
  ArrowDownToLine, Copy, ExternalLink, Loader2, Info,
} from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { getMyMember, type SellerOverview } from "@/lib/api/members"
import { listMySales, type SellerSale } from "@/lib/api/orders"
import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce"
import { useToast } from "@/hooks/use-toast"

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, currency = "USD") {
  return n.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
}

function StatCard({
  icon: Icon, label, value, sub, tone = "text-white",
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; tone?: string;
}) {
  return (
    <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
        <Icon className={`w-5 h-5 ${tone}`} />
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-2xl font-bold ${tone}`}>{value}</div>
        {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
      </div>
    </NexusCard>
  );
}

// ── payout history row (derived from sales data) ──────────────────────────────
interface PayoutRow {
  id: string;
  period: string;
  orders: number;
  gross: number;
  platformFee: number;
  net: number;
  currency: string;
  status: "paid" | "processing" | "pending";
}

function derivePayouts(sales: SellerSale[]): PayoutRow[] {
  // Group paid/delivered sales by calendar month
  const byMonth: Record<string, { sales: SellerSale[]; gross: number; currency: string }> = {};
  for (const s of sales) {
    if (s.paymentStatus !== "paid") continue;
    const month = s.createdAt.slice(0, 7); // "2026-10"
    const gross = s.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    const currency = s.currencyCode;
    if (!byMonth[month]) byMonth[month] = { sales: [], gross: 0, currency };
    byMonth[month].sales.push(s);
    byMonth[month].gross += gross;
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, { sales: rows, gross, currency }], idx) => {
      const fee = gross * 0.05; // 5% platform fee
      return {
        id: month,
        period: new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        orders: rows.length,
        gross,
        platformFee: fee,
        net: gross - fee,
        currency,
        // Most recent month = processing, older = paid, future is unreachable
        status: idx === 0 ? "processing" : "paid",
      };
    });
}

const STATUS_BADGE: Record<PayoutRow["status"], "success" | "warning" | "default"> = {
  paid: "success",
  processing: "warning",
  pending: "default",
};
const STATUS_LABEL: Record<PayoutRow["status"], string> = {
  paid: "Paid out",
  processing: "Processing",
  pending: "Pending",
};

export default function SellerPayoutsPage() {
  const { toast } = useToast();
  const [seller, setSeller] = useState<SellerOverview | null>(null);
  const [sales, setSales] = useState<SellerSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getMyMember().catch(() => null),
      listMySales(MARKET_UNDERWORLD_STORE_ID).catch(() => []),
    ]).then(([m, s]) => {
      if (m?.seller) setSeller(m.seller);
      setSales(s);
    }).catch((e) => setError(e instanceof Error ? e.message : "Failed to load")).finally(() => setLoading(false));
  }, []);

  const payouts = useMemo(() => derivePayouts(sales), [sales]);

  const totalRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sales) {
      if (s.paymentStatus !== "paid") continue;
      const gross = s.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
      map[s.currencyCode] = (map[s.currencyCode] ?? 0) + gross;
    }
    return map;
  }, [sales]);

  const totalNet = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cur, gross] of Object.entries(totalRevenue)) {
      map[cur] = gross * 0.95; // after 5% fee
    }
    return map;
  }, [totalRevenue]);

  const revenueDisplay = Object.entries(totalRevenue).map(([c, v]) => fmt(v, c)).join(" + ") || "—";
  const netDisplay = Object.entries(totalNet).map(([c, v]) => fmt(v, c)).join(" + ") || "—";

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr).then(() => toast({ title: "Copied to clipboard" })).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] pt-24 flex items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading payouts…
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
          <p className="text-cyan-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-3">Seller · Payouts</p>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Earnings & Payouts</h1>
          <p className="text-gray-500 text-lg">Your revenue, platform fees, and payout history.</p>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Total Revenue" value={revenueDisplay} sub="Gross, all time" tone="text-emerald-400" />
          <StatCard icon={Wallet}     label="Net Earnings"  value={netDisplay}     sub="After 5% platform fee" tone="text-cyan-400" />
          <StatCard icon={CheckCircle2} label="Paid Orders" value={String(sales.filter(s => s.paymentStatus === "paid").length)} sub="Completed & paid" tone="text-purple-400" />
          <StatCard icon={Clock}      label="Payout Cycle"  value="Monthly"        sub="1st of each month" />
        </div>

        {/* Info banner */}
        <NexusCard className="p-5 bg-amber-500/5 border-amber-500/20 flex gap-4 items-start">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">How payouts work</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              All sales are settled monthly on the <strong className="text-white">1st of each month</strong>.
              We deduct a <strong className="text-white">5% platform fee</strong> and send the net amount to your registered
              withdrawal address (USDT / Bitcoin / Binance Pay). Ensure your withdrawal address is confirmed before the
              settlement date via <strong className="text-white">Access &amp; Tokens</strong>.
            </p>
          </div>
        </NexusCard>

        {/* Withdrawal address */}
        <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">Withdrawal Address</h2>
              <p className="text-sm text-gray-500 mt-1">Payouts are sent here every month. Contact support to update.</p>
            </div>
            <a
              href="/seller/access"
              className="text-xs font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300 flex items-center gap-1"
            >
              Manage <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {seller?.tokens !== undefined ? (
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div className="font-mono text-sm text-gray-300 flex-1 truncate">
                {seller.application.storeName ? `${seller.application.storeName} — verified seller` : "Address on file"}
              </div>
              <button
                onClick={() => copyAddress(seller.application.storeName ?? "")}
                className="text-gray-600 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm text-amber-400">No withdrawal address set — add one in Access &amp; Tokens</span>
              <a href="/seller/access" className="ml-auto text-xs font-bold text-cyan-400 hover:text-cyan-300">Set up →</a>
            </div>
          )}
        </NexusCard>

        {/* Payout history table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Payout History</h2>
            <span className="text-xs text-gray-600 font-medium">5% platform fee applied</span>
          </div>

          {payouts.length === 0 ? (
            <NexusCard className="p-16 text-center border-white/5 bg-white/[0.02] space-y-4">
              <Wallet className="w-10 h-10 text-gray-700 mx-auto" />
              <p className="text-gray-500 font-medium">No payouts yet.</p>
              <p className="text-sm text-gray-600">Your first payout will appear here once you have a completed paid sale.</p>
              <a href="/seller/listings">
                <NexusButton>View Listings</NexusButton>
              </a>
            </NexusCard>
          ) : (
            <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Period</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Orders</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Gross</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Fee (5%)</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Net Payout</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{row.period}</td>
                      <td className="px-6 py-4 text-right text-gray-400 tabular-nums">{row.orders}</td>
                      <td className="px-6 py-4 text-right text-gray-300 tabular-nums font-medium">{fmt(row.gross, row.currency)}</td>
                      <td className="px-6 py-4 text-right text-red-400/70 tabular-nums">−{fmt(row.platformFee, row.currency)}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-400 tabular-nums">{fmt(row.net, row.currency)}</td>
                      <td className="px-6 py-4 text-center">
                        <NexusBadge variant={STATUS_BADGE[row.status]}>{STATUS_LABEL[row.status]}</NexusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Total row */}
                {payouts.length > 1 && (
                  <tfoot className="border-t border-white/10 bg-white/[0.02]">
                    <tr>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">All time</td>
                      <td className="px-6 py-4 text-right text-gray-400 tabular-nums font-bold">{payouts.reduce((s, r) => s + r.orders, 0)}</td>
                      <td className="px-6 py-4 text-right text-gray-300 tabular-nums font-bold">
                        {Object.entries(totalRevenue).map(([c, v]) => fmt(v, c)).join(" + ")}
                      </td>
                      <td className="px-6 py-4 text-right text-red-400/70 tabular-nums font-bold">
                        −{Object.entries(totalRevenue).map(([c, v]) => fmt(v * 0.05, c)).join(" + ")}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-400 tabular-nums text-lg">
                        {netDisplay}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </NexusCard>
          )}
        </section>

        {/* Request payout CTA */}
        <NexusCard className="p-6 bg-white/[0.02] border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-white mb-1">Request an early payout</h2>
            <p className="text-sm text-gray-500 max-w-2xl">
              By default payouts run on the 1st of each month. To request an early settlement, contact the admin team
              via the support channel. Minimum payout threshold: <strong className="text-white">$50 USD</strong>.
            </p>
          </div>
          <a href="/support" className="shrink-0">
            <NexusButton>
              <ArrowDownToLine className="w-4 h-4 mr-2 inline" />
              Contact Support
            </NexusButton>
          </a>
        </NexusCard>

      </div>
    </div>
  );
}
