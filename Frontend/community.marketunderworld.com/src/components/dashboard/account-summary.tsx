"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Clock, Coins, Heart, LifeBuoy, PiggyBank, TrendingUp, Wallet } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce"
import { getMyWishlist, type Order, type Wishlist } from "@/lib/api/orders"
import { getPointsWallet, type PointsWallet } from "@/lib/api/points"
import { listMyPayments, type CategoryPayment } from "@/lib/api/seller-access"

const money = (n: number, cur = "USD") => `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`
const KIND: Record<string, string> = { category: "Seller category payment", buyer_access: "Marketplace buyer pass", wallet_topup: "Wallet load", agent_activation: "Intermediary deposit", community_tier: "Access tier" }

// One place for a member to see their money and what is waiting: spent, deposited, wallet, average order, wishlist, pending, and a way to ask the team.
export function AccountSummary({ orders }: { orders: Order[] }) {
  const [wallet, setWallet] = useState<PointsWallet | null>(null)
  const [wish, setWish] = useState<Wishlist | null>(null)
  const [payments, setPayments] = useState<CategoryPayment[]>([])
  useEffect(() => {
    getPointsWallet().then(setWallet).catch(() => setWallet(null))
    getMyWishlist(MARKET_UNDERWORLD_STORE_ID).then(setWish).catch(() => setWish(null))
    listMyPayments().then(setPayments).catch(() => setPayments([]))
  }, [])

  const s = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === "paid")
    const spent = paid.reduce((n, o) => n + Number(o.totalAmount), 0)
    const deposited = (wallet?.topups ?? []).filter((t) => t.status === "active").reduce((n, t) => n + Number(t.amountReceived ?? t.amountUsd), 0)
    const waiting = payments.filter((p) => p.status === "payment_submitted" || p.status === "awaiting_payment")
    const pendingOrders = orders.filter((o) => o.paymentStatus === "pending" || o.paymentStatus === "authorized")
    return { spent, deposited, avg: paid.length ? spent / paid.length : 0, paid: paid.length, waiting, pendingOrders, currency: orders[0]?.currencyCode || "USD" }
  }, [orders, wallet, payments])

  const tiles = [
    { label: "Spent on orders", value: money(s.spent, s.currency), icon: TrendingUp, color: "text-blue-400" },
    { label: "Deposited into your wallet", value: money(s.deposited), icon: PiggyBank, color: "text-emerald-400" },
    { label: "Wallet balance", value: wallet ? `${wallet.points.toLocaleString()} pts` : "—", sub: wallet ? `about ${money(wallet.usdValue)}` : "", icon: Coins, color: "text-amber-300" },
    { label: "Average order", value: money(s.avg, s.currency), sub: `${s.paid} paid order${s.paid === 1 ? "" : "s"}`, icon: Wallet, color: "text-purple-400" },
    { label: "Pending", value: String(s.waiting.length + s.pendingOrders.length), sub: "waiting on a payment or on us", icon: Clock, color: "text-red-300" },
    { label: "In your wishlist", value: String(wish?.items.length ?? 0), sub: "saved items", icon: Heart, color: "text-pink-400" },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <NexusCard key={t.label} className="p-5 bg-white/[0.02] border-white/5">
            <t.icon className={`w-5 h-5 ${t.color} mb-3`} />
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.label}</div>
            <div className="text-xl sm:text-2xl font-bold mt-1 break-words">{t.value}</div>
            {t.sub && <div className="text-xs text-gray-500 mt-0.5">{t.sub}</div>}
          </NexusCard>
        ))}
      </div>

      {(s.waiting.length > 0 || s.pendingOrders.length > 0) && (
        <NexusCard className="p-6 bg-white/[0.02] border-white/5">
          <h2 className="font-bold text-white mb-1">Waiting on something</h2>
          <p className="text-sm text-gray-500 mb-4">The team checks every payment by hand. You will get a notification as soon as it is confirmed.</p>
          <ul className="divide-y divide-white/5 text-sm">
            {s.waiting.map((p) => (
              <li key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <span><span className="text-white font-medium">{KIND[p.kind ?? "category"] ?? "Payment"}</span> · ${Number(p.amountUsd).toLocaleString()} · {p.status === "payment_submitted" ? <span className="text-amber-300">sent, waiting for the team to confirm{p.review ? ` (about ${p.review.waitMinutes} minutes)` : ""}</span> : <span className="text-gray-400">started, waiting for your payment and screenshot</span>}</span>
                <Link className="text-cyan-400 underline" href={p.kind === "buyer_access" ? "/buyer-pass" : p.kind === "wallet_topup" ? "/wallet" : p.kind === "community_tier" ? `/access/pay?tier=${p.tierSlug}` : "/seller/access"}>Open</Link>
              </li>
            ))}
            {s.pendingOrders.map((o) => (
              <li key={o.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <span><span className="text-white font-medium">Order {o.orderNumber}</span> · {o.totalAmount} {o.currencyCode} · <span className="text-amber-300">payment not complete</span></span>
                <Link className="text-cyan-400 underline" href={`/checkout/confirmation/${o.id}`}>Open</Link>
              </li>
            ))}
          </ul>
        </NexusCard>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <NexusCard className="p-6 bg-white/[0.02] border-white/5">
          <h2 className="font-bold text-white mb-1 flex items-center gap-2"><Heart className="w-4 h-4 text-pink-400" /> Your wishlist</h2>
          <p className="text-sm text-gray-400">{(wish?.items.length ?? 0) === 0 ? "Nothing saved yet. Tap the heart on a product to keep it here." : `${wish!.items.length} saved item${wish!.items.length === 1 ? "" : "s"}.`}</p>
          <Link href="/wishlist" className="inline-block mt-3 text-sm text-cyan-400 underline">Open my wishlist</Link>
        </NexusCard>
        <NexusCard className="p-6 bg-white/[0.02] border-white/5">
          <h2 className="font-bold text-white mb-1 flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-cyan-400" /> Need to talk to the team?</h2>
          <p className="text-sm text-gray-400">Ask about a payment, an order or your account, or report a problem on the site. A person replies here and we also email you.</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <Link href="/support" className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">Write to the team</Link>
            <Link href="/wallet" className="border border-white/20 text-sm px-4 py-2 rounded-lg">Load my wallet</Link>
          </div>
        </NexusCard>
      </div>
    </div>
  )
}
