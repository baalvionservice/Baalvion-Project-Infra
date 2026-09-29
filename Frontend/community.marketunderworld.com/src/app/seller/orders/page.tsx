"use client"

import { useEffect, useState } from "react"
import { Package, Loader2, ChevronDown, ChevronUp, Truck, CheckCircle2 } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import { listMyStores, listStoreProducts, type CommerceStoreSummary } from "@/lib/api/commerce-admin"
import { listStoreOrders, updateOrderStatus, recordPayment, createShipment, type Order } from "@/lib/api/orders"

const STATUS_OPTIONS: Order["status"][] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

const STATUS_BADGE: Record<Order["status"], "default" | "success" | "warning" | "info"> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "default",
  refunded: "default",
};

export default function SellerOrdersPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<CommerceStoreSummary[]>([]);
  const [storeId, setStoreId] = useState<string>("");
  const [myProductIds, setMyProductIds] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [trackingDraft, setTrackingDraft] = useState<{ carrier: string; trackingNumber: string }>({ carrier: "", trackingNumber: "" });

  useEffect(() => {
    listMyStores().then((s) => { setStores(s); if (s.length > 0) setStoreId(s[0].id); else setLoading(false); });
  }, []);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    Promise.all([
      listStoreOrders(storeId, { limit: 100 }),
      listStoreProducts(storeId, { limit: 500 }).catch(() => ({ items: [], pagination: { total: 0, page: 1, limit: 500, totalPages: 0, hasNext: false, hasPrev: false } })),
    ])
      .then(([orderRes, productRes]) => {
        setOrders(orderRes.items);
        setMyProductIds(new Set(productRes.items.map((p) => p.id)));
      })
      .catch((err) => toast({ variant: "destructive", title: "Couldn't load orders", description: err instanceof Error ? err.message : "Please try again." }))
      .finally(() => setLoading(false));
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasMyProduct = (order: Order) => order.items.some((i) => i.productId && myProductIds.has(i.productId));

  const handleStatusChange = async (order: Order, status: Order["status"]) => {
    setBusyId(order.id);
    try {
      const updated = await updateOrderStatus(storeId, order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      toast({ title: "Order status updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't update status", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkCryptoPaid = async (order: Order) => {
    setBusyId(order.id);
    try {
      const updated = await recordPayment(storeId, order.id, {
        provider: "crypto",
        amount: Number(order.totalAmount),
        currencyCode: order.currencyCode,
        status: "captured",
        paidAt: new Date().toISOString(),
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      toast({ title: "Payment recorded", description: "Order marked as paid." });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't record payment", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const handleShip = async (order: Order) => {
    if (!trackingDraft.carrier.trim() || !trackingDraft.trackingNumber.trim()) return;
    setBusyId(order.id);
    try {
      await createShipment(storeId, order.id, trackingDraft);
      const updated = await updateOrderStatus(storeId, order.id, "shipped");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      setTrackingDraft({ carrier: "", trackingNumber: "" });
      toast({ title: "Shipment created", description: "Tracking info saved and order marked shipped." });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't create shipment", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-10 space-y-8 max-w-[1100px] mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Orders</h1>
        <p className="text-gray-500 font-medium text-lg">
          Fulfil and track orders for your store. Items you sell are highlighted — this store is shared with other approved sellers.
        </p>
      </header>

      {stores.length > 1 && (
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
        >
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500 py-16"><Loader2 className="w-5 h-5 animate-spin" /> Loading orders…</div>
      ) : orders.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <Package className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No orders yet.</p>
        </NexusCard>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const expanded = expandedId === order.id;
            const mine = hasMyProduct(order);
            return (
              <NexusCard key={order.id} className={`p-0 overflow-hidden border-white/5 bg-white/[0.01] ${mine ? "ring-1 ring-cyan-500/20" : "opacity-60"}`}>
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Package className="w-4 h-4 text-gray-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white font-mono">{order.orderNumber}</p>
                      <p className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleString()} · {order.items.length} items{!mine ? " · none are yours" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <NexusBadge variant={STATUS_BADGE[order.status]}>{order.status}</NexusBadge>
                    <NexusBadge variant={order.paymentStatus === "paid" ? "success" : "warning"}>{order.paymentStatus}</NexusBadge>
                    <span className="text-sm font-bold text-white">{order.totalAmount} {order.currencyCode}</span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </button>

                {expanded && (
                  <div className="p-5 border-t border-white/5 space-y-6">
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className={`flex justify-between text-sm p-3 rounded-lg ${item.productId && myProductIds.has(item.productId) ? "bg-cyan-500/5 border border-cyan-500/10" : "bg-white/[0.02]"}`}>
                          <span className="text-gray-300">{item.name} × {item.quantity}</span>
                          <span className="text-gray-500 font-mono">{item.price} {order.currencyCode}</span>
                        </div>
                      ))}
                    </div>

                    {mine && (
                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order, e.target.value as Order["status"])}
                            disabled={busyId === order.id}
                            className="bg-black/40 border border-white/10 rounded-lg h-9 px-3 text-xs text-white outline-none"
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>

                        {order.paymentStatus === "pending" && (
                          <NexusButton size="sm" onClick={() => handleMarkCryptoPaid(order)} isLoading={busyId === order.id} className="gap-2 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Payment Received
                          </NexusButton>
                        )}
                      </div>
                    )}

                    {mine && (
                      <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-white/5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Carrier</label>
                          <input
                            value={trackingDraft.carrier}
                            onChange={(e) => setTrackingDraft((d) => ({ ...d, carrier: e.target.value }))}
                            placeholder="e.g. FedEx"
                            className="bg-black/40 border border-white/10 rounded-lg h-9 px-3 text-xs text-white outline-none w-32"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Tracking #</label>
                          <input
                            value={trackingDraft.trackingNumber}
                            onChange={(e) => setTrackingDraft((d) => ({ ...d, trackingNumber: e.target.value }))}
                            placeholder="Tracking number"
                            className="bg-black/40 border border-white/10 rounded-lg h-9 px-3 text-xs text-white outline-none w-48"
                          />
                        </div>
                        <NexusButton size="sm" variant="outline" onClick={() => handleShip(order)} isLoading={busyId === order.id} className="gap-2 text-xs border-white/10">
                          <Truck className="w-3.5 h-3.5" /> Add Tracking &amp; Mark Shipped
                        </NexusButton>
                      </div>
                    )}
                  </div>
                )}
              </NexusCard>
            );
          })}
        </div>
      )}
    </div>
  )
}
