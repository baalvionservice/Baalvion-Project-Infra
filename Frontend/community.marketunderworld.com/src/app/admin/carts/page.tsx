"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Clock, Search, User } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import {
  listLiveCarts,
  listAbandonedCarts,
  getUserCartHistory,
  type AdminCartRow,
  type CartEventRow,
} from "@/lib/api/cart"

type Tab = "live" | "abandoned";

export default function AdminCartsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("live");
  const [carts, setCarts] = useState<AdminCartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIdQuery, setUserIdQuery] = useState("");
  const [history, setHistory] = useState<CartEventRow[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const fetcher = tab === "live" ? listLiveCarts({ limit: 50 }) : listAbandonedCarts({ limit: 50, abandonedAfterMinutes: 30 });
    fetcher
      .then((res) => setCarts(res.items))
      .catch((err) => toast({ variant: "destructive", title: "Couldn't load carts", description: err instanceof Error ? err.message : "Please try again." }))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const lookupHistory = async () => {
    if (!userIdQuery.trim()) return;
    setHistoryLoading(true);
    try {
      const res = await getUserCartHistory(userIdQuery.trim(), { limit: 50 });
      setHistory(res.items);
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't load cart history", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="p-10 space-y-8 max-w-[1100px] mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Live Carts</h1>
        <p className="text-gray-500 font-medium text-lg">See exactly what shoppers are dropping in their carts, in real time — before they check out.</p>
      </header>

      <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-lg w-fit">
        <button
          onClick={() => setTab("live")}
          className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${tab === "live" ? "bg-cyan-500 text-black" : "text-gray-400 hover:text-white"}`}
        >
          Live
        </button>
        <button
          onClick={() => setTab("abandoned")}
          className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${tab === "abandoned" ? "bg-cyan-500 text-black" : "text-gray-400 hover:text-white"}`}
        >
          Abandoned (30m+)
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 font-medium">Loading…</div>
      ) : carts.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <ShoppingCart className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{tab === "live" ? "No active carts right now." : "No abandoned carts right now."}</p>
        </NexusCard>
      ) : (
        <div className="space-y-3">
          {carts.map((cart) => (
            <NexusCard key={cart.id} className="p-5 border-white/5 bg-white/[0.01]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {cart.userId ? `User #${cart.userId}` : "Guest"} — {cart.items.length} item{cart.items.length === 1 ? "" : "s"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <NexusBadge>{cart.subtotal} {cart.currencyCode}</NexusBadge>
                      {tab === "abandoned" && (
                        <span className="flex items-center gap-1 text-xs text-amber-400"><Clock className="w-3 h-3" /> stale</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 max-w-md">
                  {cart.items.slice(0, 4).map((item, i) => (
                    <span key={i} className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded">
                      {item.quantity}× {item.name}
                    </span>
                  ))}
                  {cart.items.length > 4 && <span className="text-[10px] text-gray-600">+{cart.items.length - 4} more</span>}
                </div>
              </div>
            </NexusCard>
          ))}
        </div>
      )}

      <NexusCard className="p-6 space-y-4 border-white/5 bg-white/[0.02]">
        <h3 className="font-bold text-white text-sm uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <User className="w-4 h-4" /> Per-User Cart History
        </h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={userIdQuery}
              onChange={(e) => setUserIdQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") lookupHistory(); }}
              placeholder="User ID"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>
          <NexusButton size="sm" onClick={lookupHistory} isLoading={historyLoading}>Look up</NexusButton>
        </div>
        {history && (
          history.length === 0 ? (
            <p className="text-gray-500 text-sm">No cart activity found for this user.</p>
          ) : (
            <div className="space-y-2">
              {history.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between text-xs bg-white/[0.02] rounded-lg px-3 py-2 border border-white/5">
                  <span className="text-gray-400">{new Date(ev.occurredAt).toLocaleString()}</span>
                  <NexusBadge>{ev.eventType.replace('_', ' ')}</NexusBadge>
                  <span className="text-gray-300 truncate max-w-xs">{ev.itemSnapshot?.name ?? "—"}</span>
                  <span className="text-gray-500">{ev.cartSnapshot.itemCount} items · {ev.cartSnapshot.totalAmount} {ev.cartSnapshot.currencyCode}</span>
                </div>
              ))}
            </div>
          )
        )}
      </NexusCard>
    </div>
  )
}
