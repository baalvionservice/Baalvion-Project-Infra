"use client"

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Loader2, AlertTriangle, Gift } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getMyOrders, type GiftCardOrder } from "@/lib/api/giftcards";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<GiftCardOrder["status"], { label: string; className: string }> = {
  pending_payment: { label: "Awaiting payment", className: "text-gray-400 border-gray-500/20 bg-gray-500/5" },
  paid: { label: "Payment confirmed", className: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },
  fulfilling: { label: "Delivering…", className: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
  fulfilled: { label: "Delivered", className: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
  failed: { label: "Delivery failed", className: "text-red-400 border-red-500/20 bg-red-500/5" },
  refunded: { label: "Refunded", className: "text-gray-400 border-gray-500/20 bg-gray-500/5" },
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-3">
        <code className="text-sm text-white flex-1 break-all">{value}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="shrink-0 text-gray-500 hover:text-fuchsia-400 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function MyCardsPage() {
  const [orders, setOrders] = useState<GiftCardOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders().then((data) => { setOrders(data); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Navbar />

      <main className="container max-w-5xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-16 space-y-4">
          <div className="flex items-center gap-3 text-fuchsia-400 font-bold text-[12px] uppercase tracking-[0.2em]">
            <Gift className="w-4 h-4" /> My Cards
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">Your Gift Cards.</h1>
          <p className="text-gray-500">Purchase history and redeem codes for every card you've bought.</p>
        </header>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading your orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-16 text-center">
            <p className="text-gray-400 font-medium">You haven't bought any gift cards yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const status = STATUS_LABEL[order.status];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border border-white/8 bg-[#0d0d14] p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      {order.brandLogoUrl ? (
                        <img src={order.brandLogoUrl} alt={order.brandName} className="h-8 object-contain" />
                      ) : (
                        <div className="h-8 px-3 flex items-center rounded bg-white/5 text-xs font-bold">{order.brandName}</div>
                      )}
                      <div>
                        <p className="font-bold text-white">{order.brandName}</p>
                        <p className="text-xs text-gray-500">{order.currencyCode} {order.denominationValue}</p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border", status.className)}>
                      {status.label}
                    </span>
                  </div>

                  {order.status === "fulfilled" && order.redeemCode && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <CopyField label="Redeem Code" value={order.redeemCode} />
                      {order.redeemPin && <CopyField label="PIN" value={order.redeemPin} />}
                    </div>
                  )}

                  {order.status === "failed" && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300/80">
                        {order.fulfillmentError || "Delivery failed. Your payment was received — support has been notified for manual fulfillment."}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
