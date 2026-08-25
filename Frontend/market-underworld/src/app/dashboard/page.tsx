"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Package,
  Heart,
  Gift,
  MessageSquare,
  ShoppingBag,
  Settings,
  ArrowRight,
  CreditCard,
  Clock,
} from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useAuth } from "@/context/auth-context"
import { listMyOrders, getMyWishlist, type Order } from "@/lib/api/orders"
import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce"
import { getMyOrders as getMyGiftCardOrders, type GiftCardOrder } from "@/lib/api/giftcards"
import { getMyWallet, usdAvailable, type Wallet as WalletAccount } from "@/lib/api/wallet"
import { WalletBalanceCard } from "@/components/wallet/wallet-balance-card"
import { DepositModal } from "@/components/wallet/deposit-modal"
import { DashboardGiftCardGrid } from "@/components/marketplace/dashboard-giftcard-grid"

const STATUS_VARIANT: Record<Order["paymentStatus"], "success" | "warning" | "default"> = {
  paid: "success",
  pending: "warning",
  authorized: "warning",
  partially_paid: "warning",
  refunded: "default",
  voided: "default",
  failed: "default",
}

const QUICK_LINKS = [
  { label: "Shop", description: "Browse verified listings", href: "/shop", icon: ShoppingBag },
  { label: "Forum", description: "Communities you can join", href: "/forum", icon: MessageSquare },
  { label: "My Orders", description: "Full order & payment history", href: "/invoices", icon: Package },
  { label: "Wishlist", description: "Items you've saved", href: "/wishlist", icon: Heart },
  { label: "Gift Cards", description: "Your redeemable cards", href: "/my-cards", icon: Gift },
  { label: "Settings", description: "Notifications & language", href: "/settings/notifications", icon: Settings },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [giftCardOrders, setGiftCardOrders] = useState<GiftCardOrder[]>([])
  const [wallet, setWallet] = useState<WalletAccount | null>(null)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshWallet = () => { getMyWallet().then(setWallet) }

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push("/auth/signin?redirect=/dashboard")
      return
    }
    Promise.all([
      listMyOrders(MARKET_UNDERWORLD_STORE_ID).catch(() => []),
      getMyWishlist(MARKET_UNDERWORLD_STORE_ID).catch(() => ({ items: [] as { id: string }[] })),
      getMyGiftCardOrders().catch(() => []),
      getMyWallet(),
    ]).then(([o, w, g, wal]) => {
      setOrders(o)
      setWishlistCount(w.items.length)
      setGiftCardOrders(g)
      setWallet(wal)
      setLoading(false)
    })
  }, [authLoading, isAuthenticated, router])

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === "paid")
    const totalSpent = paid.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const pending = orders.filter((o) => o.paymentStatus === "pending").length
    const currency = orders[0]?.currencyCode || "USD"
    return {
      totalSpent: `${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`,
      count: orders.length,
      pending,
    }
  }, [orders])

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [orders]
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050508] text-white pt-24 pb-32 flex items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading your dashboard…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <header>
          <p className="text-cyan-400 font-bold text-[12px] uppercase tracking-[0.2em] mb-3">Dashboard</p>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}</h1>
          <p className="text-gray-500 font-medium text-lg">Your orders, wishlist, and gift cards in one place.</p>
        </header>

        <div className="max-w-sm">
          <WalletBalanceCard balance={usdAvailable(wallet)} onDeposit={() => setDepositModalOpen(true)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Spent", val: stats.totalSpent, icon: CreditCard, color: "text-blue-400" },
            { label: "Orders", val: String(stats.count), icon: Package, color: "text-purple-400" },
            { label: "Pending", val: String(stats.pending), icon: Clock, color: "text-gray-500" },
            { label: "Wishlist", val: String(wishlistCount), icon: Heart, color: "text-pink-400" },
          ].map((stat) => (
            <NexusCard key={stat.label} className="p-6 bg-white/[0.02] border-white/5 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-2xl font-bold">{stat.val}</div>
              </div>
            </NexusCard>
          ))}
        </div>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <NexusCard className="p-6 bg-white/[0.02] border-white/5 hover:border-cyan-400/30 hover:bg-white/[0.04] transition-colors group h-full">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                      <link.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="font-bold text-white mb-1">{link.label}</div>
                  <p className="text-sm text-gray-500">{link.description}</p>
                </NexusCard>
              </Link>
            ))}
          </div>
        </section>

        <DashboardGiftCardGrid walletBalance={usdAvailable(wallet)} />

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Orders</h2>
            <Link href="/invoices" className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300">
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <NexusCard className="p-16 text-center border-white/5 bg-white/[0.02] space-y-4">
              <Package className="w-10 h-10 text-gray-700 mx-auto" />
              <p className="text-gray-500 font-medium">You haven&apos;t placed any orders yet.</p>
              <Link href="/shop"><NexusButton>Browse Products</NexusButton></Link>
            </NexusCard>
          ) : (
            <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
              <table className="w-full text-left">
                <thead className="bg-white/[0.01] border-b border-white/5">
                  <tr>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order #</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-6">
                        <div className="font-mono text-sm font-bold text-gray-400 group-hover:text-blue-400 transition-colors">{order.orderNumber}</div>
                      </td>
                      <td className="p-6 text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-6 text-right">
                        <div className="font-bold text-sm text-white">{order.totalAmount} {order.currencyCode}</div>
                      </td>
                      <td className="p-6 text-center">
                        <NexusBadge variant={STATUS_VARIANT[order.paymentStatus]}>{order.paymentStatus}</NexusBadge>
                      </td>
                      <td className="p-6 text-right">
                        <Link href={`/checkout/confirmation/${order.id}`}>
                          <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest">View</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </NexusCard>
          )}
        </section>

        {giftCardOrders.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Gift Cards</h2>
              <Link href="/my-cards" className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {giftCardOrders.slice(0, 3).map((card) => (
                <NexusCard key={card.id} className="p-6 bg-white/[0.02] border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{card.brandName}</div>
                    <div className="text-sm text-gray-500">{card.denominationValue} {card.currencyCode}</div>
                  </div>
                </NexusCard>
              ))}
            </div>
          </section>
        )}
      </div>

      <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} onCredited={refreshWallet} />
    </div>
  )
}
