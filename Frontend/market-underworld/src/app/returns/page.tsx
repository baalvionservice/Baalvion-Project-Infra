"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, Loader2, Package } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { listMyOrders, listMyReturns, createReturn, type Order, type OrderReturn } from "@/lib/api/orders"
import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce"

const STATUS_VARIANT: Record<OrderReturn["status"], "default" | "success" | "warning" | "info"> = {
  requested: "warning",
  approved: "info",
  rejected: "default",
  received: "info",
  refunded: "success",
  closed: "default",
};

export default function ReturnsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [eligibleOrders, setEligibleOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingOrderId, setRequestingOrderId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/auth/signin?redirect=/returns"); return; }
    Promise.all([
      listMyReturns(MARKET_UNDERWORLD_STORE_ID).catch(() => []),
      listMyOrders(MARKET_UNDERWORLD_STORE_ID).catch(() => []),
    ]).then(([r, orders]) => {
      setReturns(r);
      // Only orders that have actually been paid are return-eligible, and only ones without an
      // existing return request already (avoid duplicate requests for the same order).
      const returnedOrderIds = new Set(r.map((x) => x.orderId));
      setEligibleOrders(orders.filter((o) => o.paymentStatus === "paid" && !returnedOrderIds.has(o.id)));
    }).finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router]);

  const startRequest = (order: Order) => {
    setRequestingOrderId(order.id);
    setSelectedItems(Object.fromEntries(order.items.map((i) => [i.id, i.quantity])));
    setReason("");
  };

  const handleSubmitReturn = async (order: Order) => {
    const items = Object.entries(selectedItems).filter(([, qty]) => qty > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!reason.trim() || items.length === 0) {
      toast({ variant: "destructive", title: "Select at least one item and give a reason" });
      return;
    }
    setSubmitting(true);
    try {
      const created = await createReturn(MARKET_UNDERWORLD_STORE_ID, { orderId: order.id, reason: reason.trim(), items });
      setReturns((prev) => [created, ...prev]);
      setEligibleOrders((prev) => prev.filter((o) => o.id !== order.id));
      setRequestingOrderId(null);
      toast({ title: "Return requested", description: `Return ${created.returnNumber} submitted.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't request return", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center gap-3 text-gray-500 pt-20"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e5e7eb] px-6 py-12 pt-32 max-w-4xl mx-auto space-y-12">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Returns</h1>
        <p className="text-gray-500">Request a return on a paid order, or check the status of one you&apos;ve already submitted.</p>
      </header>

      {eligibleOrders.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Eligible Orders</h2>
          {eligibleOrders.map((order) => (
            <NexusCard key={order.id} className="p-6 border-white/5 bg-white/[0.02] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-bold text-white">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()} · {order.totalAmount} {order.currencyCode}</p>
                </div>
                {requestingOrderId !== order.id && (
                  <NexusButton size="sm" variant="outline" onClick={() => startRequest(order)} className="gap-2 border-white/10">
                    <RotateCcw className="w-3.5 h-3.5" /> Request Return
                  </NexusButton>
                )}
              </div>

              {requestingOrderId === order.id && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <label key={item.id} className="flex items-center gap-3 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={(selectedItems[item.id] || 0) > 0}
                          onChange={(e) => setSelectedItems((prev) => ({ ...prev, [item.id]: e.target.checked ? item.quantity : 0 }))}
                          className="accent-cyan-500"
                        />
                        {item.name} × {item.quantity}
                      </label>
                    ))}
                  </div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for return…"
                    className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-cyan-500/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <NexusButton size="sm" onClick={() => handleSubmitReturn(order)} isLoading={submitting}>Submit Request</NexusButton>
                    <NexusButton size="sm" variant="outline" className="border-white/10" onClick={() => setRequestingOrderId(null)}>Cancel</NexusButton>
                  </div>
                </div>
              )}
            </NexusCard>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">My Return Requests</h2>
        {returns.length === 0 ? (
          <NexusCard className="p-16 text-center border-white/5 bg-white/[0.02]">
            <Package className="w-10 h-10 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No return requests yet.</p>
          </NexusCard>
        ) : (
          <div className="space-y-3">
            {returns.map((r) => (
              <NexusCard key={r.id} className="p-5 border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-bold text-white">{r.returnNumber}</p>
                  <p className="text-xs text-gray-500">{r.reason}</p>
                </div>
                <NexusBadge variant={STATUS_VARIANT[r.status]}>{r.status}</NexusBadge>
              </NexusCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
