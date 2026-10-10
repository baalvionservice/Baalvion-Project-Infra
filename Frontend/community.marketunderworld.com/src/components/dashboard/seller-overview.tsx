"use client"

import Link from "next/link"
import {
  AlertCircle, ArrowRight, Boxes, Check, Circle, Coins, FolderCheck, MessageSquare, PackageCheck, Star, Truck, Wallet,
} from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import type { SellerOverview } from "@/lib/api/members"
import type { SellerSale } from "@/lib/api/orders"

const money = (revenue: Record<string, number>) => {
  const entries = Object.entries(revenue)
  return entries.length ? entries.map(([c, v]) => `${v.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${c}`).join(" · ") : "0.00"
}

function Stat({ label, value, hint, icon: Icon, tone = "text-cyan-400", href }: { label: string; value: string; hint?: string; icon: React.ComponentType<{ className?: string }>; tone?: string; href?: string }) {
  const card = (
    <NexusCard className="p-5 bg-white/[0.02] border-white/5 h-full hover:border-white/15 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        <Icon className={`w-4 h-4 ${tone}`} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </NexusCard>
  )
  return href ? <Link href={href} className="block h-full">{card}</Link> : card
}

export function SellerOverviewPanel({ seller, sales }: { seller: SellerOverview; sales: SellerSale[] }) {
  const { roadmap, listings, sales: s, rating } = seller
  const approved = seller.application.status === "approved"
  const activeCategories = seller.categories.filter((c) => c.status === "active")
  const pendingCategories = seller.categories.filter((c) => c.status !== "active")
  const live = listings.published
  const inReview = listings.pending_review

  const attention: { text: string; href: string }[] = []
  if (seller.application.status === "pending") attention.push({ text: "Your seller application is waiting for admin review.", href: "/seller/onboarding" })
  if (seller.application.status === "rejected") attention.push({ text: `Your application was declined${seller.application.rejectionReason ? `: ${seller.application.rejectionReason}` : "."}`, href: "/seller/onboarding" })
  if (s.toFulfil > 0) attention.push({ text: `${s.toFulfil} paid order${s.toFulfil > 1 ? "s" : ""} waiting to be shipped.`, href: "/seller/sales" })
  if (s.toRate > 0) attention.push({ text: `${s.toRate} delivered order${s.toRate > 1 ? "s" : ""} — rate the buyer${s.toRate > 1 ? "s" : ""}.`, href: "/seller/sales" })
  if (listings.rejected > 0) attention.push({ text: `${listings.rejected} listing${listings.rejected > 1 ? "s were" : " was"} rejected — fix and resubmit.`, href: "/seller/listings" })
  if (pendingCategories.length > 0) attention.push({ text: "A category payment is not confirmed yet.", href: "/seller/access" })

  return (
    <div className="space-y-10">
      {/* Roadmap */}
      <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white">Your seller roadmap</h2>
            <p className="text-sm text-gray-500">{roadmap.completed} of {roadmap.total} steps done</p>
          </div>
          {roadmap.next && (
            <Link href={roadmap.next.href}><NexusButton>{roadmap.next.label} <ArrowRight className="w-4 h-4 ml-2 inline" /></NexusButton></Link>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${(roadmap.completed / roadmap.total) * 100}%` }} /></div>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {roadmap.steps.map((step) => {
            const isNext = roadmap.next?.key === step.key
            return (
              <li key={step.key}>
                <Link href={step.href} className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors ${step.done ? "border-emerald-500/20 bg-emerald-500/5 text-gray-300" : isNext ? "border-cyan-400/40 bg-cyan-400/5 text-white" : "border-white/5 text-gray-500"}`}>
                  {step.done ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Circle className={`w-4 h-4 shrink-0 ${isNext ? "text-cyan-400" : "text-gray-700"}`} />}
                  <span>{step.label}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </NexusCard>

      {/* Needs attention */}
      {attention.length > 0 && (
        <NexusCard className="p-5 bg-amber-500/5 border-amber-500/20 space-y-3">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> Needs your attention</p>
          <ul className="space-y-2">
            {attention.map((a) => (
              <li key={a.text}><Link href={a.href} className="text-sm text-gray-200 hover:text-white flex items-center justify-between gap-4">{a.text}<ArrowRight className="w-4 h-4 text-gray-500 shrink-0" /></Link></li>
            ))}
          </ul>
        </NexusCard>
      )}

      {/* Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Revenue" value={money(s.revenue)} hint={`${s.paid} paid order${s.paid === 1 ? "" : "s"}`} icon={Wallet} tone="text-emerald-400" href="/seller/sales" />
        <Stat label="To ship" value={String(s.toFulfil)} hint={`${s.shipped} on the way · ${s.delivered} delivered`} icon={Truck} tone="text-amber-400" href="/seller/sales" />
        <Stat label="Live listings" value={String(live)} hint={inReview ? `${inReview} in review · ${listings.draft} draft` : `${listings.draft} draft`} icon={Boxes} tone="text-purple-400" href="/seller/listings" />
        <Stat label="Rating" value={rating.count ? `${rating.average?.toFixed(1)} ★` : "—"} hint={rating.count ? `${rating.count} review${rating.count === 1 ? "" : "s"}` : "No reviews yet"} icon={Star} tone="text-amber-300" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2"><FolderCheck className="w-4 h-4 text-cyan-400" /> Categories you can sell in</h3>
            <Link href="/seller/access" className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">{approved ? "Unlock more" : "Manage"}</Link>
          </div>
          {seller.categories.length === 0 ? (
            <p className="text-sm text-gray-500">None yet. Each category is a one-time $2,000 payment in USDT, Bitcoin or Binance Pay and covers all its sub-categories.</p>
          ) : (
            <ul className="space-y-2">
              {seller.categories.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm"><span className="text-gray-200">{c.name ?? "Category"}</span>
                  <NexusBadge variant={c.status === "active" ? "success" : "warning"}>{c.status === "active" ? "active" : c.status === "payment_submitted" ? "checking payment" : "awaiting payment"}</NexusBadge></li>
              ))}
            </ul>
          )}
        </NexusCard>

        <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2"><Coins className="w-4 h-4 text-amber-400" /> Tokens</h3>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">not withdrawable</span>
          </div>
          <div className="text-4xl font-bold text-white">{seller.tokens.toLocaleString()}</div>
          <p className="text-sm text-gray-500">Spend 5 tokens to talk to the admin for 5 minutes.</p>
          <Link href="/seller/access"><NexusButton variant="secondary"><MessageSquare className="w-4 h-4 mr-2 inline" /> Talk to admin</NexusButton></Link>
        </NexusCard>
      </div>

      {/* Recent sales */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Recent sales</h2>
          <Link href="/seller/sales" className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">View all</Link>
        </div>
        {sales.length === 0 ? (
          <NexusCard className="p-10 text-center bg-white/[0.02] border-white/5 space-y-3">
            <PackageCheck className="w-9 h-9 text-gray-700 mx-auto" />
            <p className="text-gray-400 font-medium">No sales yet.</p>
            <p className="text-sm text-gray-600">{live > 0 ? "Your listing is live — share it to get your first order." : "Get a listing approved and live and your orders will show up here."}</p>
            <Link href={live > 0 ? "/shop" : "/seller/listings"}><NexusButton variant="secondary">{live > 0 ? "See the shop" : "Go to listings"}</NexusButton></Link>
          </NexusCard>
        ) : (
          <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02] divide-y divide-white/5">
            {sales.slice(0, 5).map((sale) => (
              <Link key={sale.id} href="/seller/sales" className="flex items-center justify-between gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-gray-300">{sale.orderNumber}</div>
                  <div className="text-xs text-gray-500 truncate">{sale.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")} · {sale.buyer.name ?? "Buyer"}{sale.buyer.memberNumber ? ` · ${sale.buyer.memberNumber}` : ""}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <NexusBadge variant={sale.status === "delivered" ? "success" : "info"}>{sale.status}</NexusBadge>
                  {sale.canRateBuyer && <NexusBadge variant="warning">rate buyer</NexusBadge>}
                </div>
              </Link>
            ))}
          </NexusCard>
        )}
      </section>
    </div>
  )
}
