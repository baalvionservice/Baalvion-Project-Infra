"use client"

import { useCallback, useEffect, useState } from "react"
import { ListingCard, Badge } from "@/components/ui/ListingCard"
import { RotateCcw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { listStoreReturns, updateReturnStatus, type OrderReturn } from "@/lib/api/orders"
import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce"

const STATUS_OPTIONS: OrderReturn["status"][] = ["requested", "approved", "rejected", "received", "refunded", "closed"];

const STATUS_BADGE: Record<OrderReturn["status"], "default" | "success" | "warning" | "info"> = {
  requested: "warning",
  approved: "info",
  rejected: "default",
  received: "info",
  refunded: "success",
  closed: "default",
};

export default function AdminReturnsPage() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listStoreReturns(MARKET_UNDERWORLD_STORE_ID, { limit: 100 })
      .then((res) => setReturns(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (r: OrderReturn, status: OrderReturn["status"]) => {
    setBusyId(r.id);
    try {
      const updated = await updateReturnStatus(MARKET_UNDERWORLD_STORE_ID, r.id, status);
      setReturns((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
      toast({ title: "Return updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't update return", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-10 space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Returns</h1>
        <p className="text-text-muted font-medium">Process return requests across the marketplace.</p>
      </header>

      {loading ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : returns.length === 0 ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface">
          <RotateCcw className="w-10 h-10 text-text-ghost mx-auto mb-4" />
          <p className="text-text-muted font-medium">No return requests.</p>
        </ListingCard>
      ) : (
        <div className="space-y-4">
          {returns.map((r) => (
            <ListingCard key={r.id} className="p-6 border-brand-border bg-brand-surface">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">{r.returnNumber}</span>
                    <Badge variant={STATUS_BADGE[r.status]} className="text-[8px]">{r.status}</Badge>
                  </div>
                  <p className="text-sm text-text-muted mt-1">{r.reason}</p>
                  <p className="text-[10px] text-text-ghost font-mono mt-1">{r.items.length} item(s) · Refund: {r.totalRefund} {r.currencyCode}</p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r, e.target.value as OrderReturn["status"])}
                  disabled={busyId === r.id}
                  className="bg-brand-void border border-brand-border rounded-lg h-9 px-3 text-xs text-white outline-none"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </ListingCard>
          ))}
        </div>
      )}
    </div>
  );
}
