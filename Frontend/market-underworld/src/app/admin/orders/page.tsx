"use client"

import { useCallback, useEffect, useState } from "react"
import { ListingCard, Badge } from "@/components/ui/ListingCard"
import { AppButton } from "@/components/ui/AppButton"
import { Search, Package, Loader2, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { listStoreOrders, updateOrderStatus, refundOrder, recordPayment, type Order } from "@/lib/api/orders"
import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce"

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

const PAGE_SIZE = 50;

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback((opts: { page?: number; search?: string; status?: string } = {}) => {
    setLoading(true);
    setError(null);
    listStoreOrders(MARKET_UNDERWORLD_STORE_ID, { page: opts.page ?? 1, limit: PAGE_SIZE, search: opts.search, status: opts.status || undefined })
      .then((res) => {
        setOrders(res.items);
        setTotal(res.pagination.total);
        setPage(res.pagination.page);
        setHasMore(res.pagination.hasNext);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load({ page: 1, search, status: statusFilter });
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    load({ page: 1, search, status });
  };

  const handleStatusChange = async (order: Order, status: Order["status"]) => {
    setBusyId(order.id);
    try {
      const updated = await updateOrderStatus(MARKET_UNDERWORLD_STORE_ID, order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      toast({ title: "Order updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't update order", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkPaid = async (order: Order) => {
    setBusyId(order.id);
    try {
      const updated = await recordPayment(MARKET_UNDERWORLD_STORE_ID, order.id, {
        provider: order.payments[0]?.provider || "manual",
        amount: Number(order.totalAmount),
        currencyCode: order.currencyCode,
        status: "captured",
        paidAt: new Date().toISOString(),
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      toast({ title: "Payment recorded" });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't record payment", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const handleRefund = async (order: Order) => {
    if (!window.confirm(`Refund order ${order.orderNumber} for ${order.totalAmount} ${order.currencyCode}?`)) return;
    setBusyId(order.id);
    try {
      const updated = await refundOrder(MARKET_UNDERWORLD_STORE_ID, order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      toast({ title: "Order refunded" });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't refund", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Order Management</h1>
          <p className="text-text-muted font-medium">{total > 0 ? `${total.toLocaleString()} orders across the marketplace.` : "All orders across the marketplace."}</p>
        </div>
      </header>

      <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface">
        <div className="p-6 border-b border-brand-border bg-brand-void/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order number…"
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </form>
          <div className="flex gap-2 flex-wrap">
            {["", ...STATUS_OPTIONS].map((s) => (
              <button
                key={s || "all"}
                onClick={() => handleStatusFilter(s)}
                className={`px-3 h-9 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${statusFilter === s ? "bg-brand-green text-black" : "bg-brand-void border border-brand-border text-text-muted hover:text-white"}`}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="p-16 text-center text-semantic-error font-medium">
            {error}
            <div className="mt-4">
              <AppButton onClick={() => load({ page, search, status: statusFilter })} className="bg-brand-void border border-brand-border text-white px-6 h-10 text-xs font-bold uppercase">Retry</AppButton>
            </div>
          </div>
        ) : loading ? (
          <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-text-muted font-medium flex flex-col items-center gap-4">
            <Package className="w-10 h-10 text-text-ghost" />
            No orders found.
          </div>
        ) : (
          <div className="divide-y divide-brand-border/50">
            {orders.map((order) => {
              const expanded = expandedId === order.id;
              return (
                <div key={order.id}>
                  <button onClick={() => setExpandedId(expanded ? null : order.id)} className="w-full p-6 flex items-center justify-between gap-4 text-left hover:bg-brand-void/30 transition-colors">
                    <div className="min-w-0">
                      <div className="font-bold text-white font-mono text-sm">{order.orderNumber}</div>
                      <div className="text-[10px] text-text-muted">{new Date(order.createdAt).toLocaleString()} · {order.items.length} items</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={STATUS_BADGE[order.status]} className="text-[8px]">{order.status}</Badge>
                      <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"} className="text-[8px]">{order.paymentStatus}</Badge>
                      <span className="text-sm font-bold text-white font-mono">{order.totalAmount} {order.currencyCode}</span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-6 pb-6 space-y-4">
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm p-3 rounded-lg bg-brand-void/50">
                            <span className="text-text-secondary">{item.name} × {item.quantity}</span>
                            <span className="text-text-muted font-mono">{item.price} {order.currencyCode}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order, e.target.value as Order["status"])}
                          disabled={busyId === order.id}
                          className="bg-brand-void border border-brand-border rounded-lg h-9 px-3 text-xs text-white outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {order.paymentStatus !== "paid" && (
                          <AppButton size="sm" onClick={() => handleMarkPaid(order)} isLoading={busyId === order.id} className="bg-brand-green text-black text-xs">
                            Mark Paid
                          </AppButton>
                        )}
                        {order.paymentStatus === "paid" && (
                          <AppButton size="sm" variant="danger" onClick={() => handleRefund(order)} disabled={busyId === order.id} className="gap-2 text-xs">
                            <RefreshCcw className="w-3.5 h-3.5" /> Refund
                          </AppButton>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && total > PAGE_SIZE && (
          <div className="p-6 border-t border-brand-border flex items-center justify-between text-xs text-text-muted font-mono">
            <span>Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
            <div className="flex gap-2">
              <AppButton disabled={page <= 1} onClick={() => load({ page: page - 1, search, status: statusFilter })} className="bg-brand-void border border-brand-border text-white px-4 h-9 text-[10px] font-bold uppercase disabled:opacity-40">Prev</AppButton>
              <AppButton disabled={!hasMore} onClick={() => load({ page: page + 1, search, status: statusFilter })} className="bg-brand-void border border-brand-border text-white px-4 h-9 text-[10px] font-bold uppercase disabled:opacity-40">Next</AppButton>
            </div>
          </div>
        )}
      </ListingCard>
    </div>
  )
}
