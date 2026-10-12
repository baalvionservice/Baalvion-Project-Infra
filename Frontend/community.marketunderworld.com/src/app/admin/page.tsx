"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { useAdminAccess } from "@/components/admin/admin-access"
import { adminOverview, type AdminOverview } from "@/lib/api/admin-overview"
import { useAdminNotices } from "@/components/admin/admin-notifications"
import { cmsAdmin } from "@/lib/api/cms-admin"
import { CMS_PAGES } from "@/lib/cms-pages"
import type { AdminNotice } from "@/lib/api/admin-notifications"

// Where each waiting item is handled.
const QUEUES: { key: keyof AdminOverview["queues"]; label: string; href: string; need: string }[] = [
  { key: "pendingBookings", label: "Guest list and VIP requests", href: "/admin/clubs/bookings", need: "content.handle" },
  { key: "pendingApplications", label: "Applications to Locals listings", href: "/admin/locals/applications", need: "content.handle" },
  { key: "pendingProfiles", label: "Candidate profiles to review", href: "/nightlife/verify", need: "verify.review" },
  { key: "pendingEmployers", label: "Employers to review", href: "/nightlife/verify", need: "verify.review" },
  { key: "submittedReports", label: "Bug bounty reports", href: "/admin/bounty", need: "bounty.manage" },
  { key: "unreadThreads", label: "Unread bounty messages", href: "/admin/bounty", need: "bounty.manage" },
]

const INVENTORY: { key: keyof AdminOverview["inventory"]; label: string }[] = [
  { key: "clubs", label: "Clubs" },
  { key: "listings", label: "Locals listings" },
  { key: "upcomingEvents", label: "Upcoming events" },
  { key: "activeGigs", label: "Open gigs" },
  { key: "hunters", label: "Bounty hunters" },
]

// The waiting items, grouped by the kind of job, so one person can work through them in order.
const GROUPS: { title: string; note: string; keys: string[] }[] = [
  { title: "Money", note: "Payments to confirm and trades to decide. Members are waiting on these.", keys: ["payments", "disputes", "intermediaries"] },
  { title: "People", note: "Identity checks, sellers, help tickets and requests from members.", keys: ["tickets", "kyc", "sellers", "requests", "vetting", "joins"] },
  { title: "Nights and events", note: "Guest lists, events, DJs, draws and parties.", keys: ["bookings", "events", "elite", "djs", "draws"] },
  { title: "Content and work", note: "Listings, local jobs and bounty reports.", keys: ["listings", "locals", "reports", "bounty"] },
]

const DO_NOW = [
  { href: "/admin/clubs", label: "Add or edit a venue", note: "Write its page, add photos" },
  { href: "/admin/clubs/events", label: "Post an event", note: "Poster, date, tickets" },
  { href: "/admin/clubs/lottery", label: "Create or run a draw", note: "India $6, Dubai $10" },
  { href: "/admin/content", label: "Write page content", note: "Google title, intro, FAQs" },
  { href: "/admin/seller-payments", label: "Confirm payments", note: "Deposits, passes, tiers" },
  { href: "/admin/support/tickets", label: "Reply to help tickets", note: "Members asking for help" },
  { href: "/admin/users", label: "Find a person", note: "Buyers, sellers, staff" },
  { href: "/", label: "Open the live site", note: "See what members see" },
]

const MORE = [
  { href: "/escrow/admin-dashboard", label: "Intermediaries", note: "Applications, disputes, refunds" },
  { href: "/admin/seller-applications", label: "Seller applications", note: "Approve new sellers" },
  { href: "/admin/payment-addresses", label: "Payment addresses", note: "Where payments are sent" },
  { href: "/admin/moderation", label: "Listing moderation", note: "Review submitted listings" },
  { href: "/admin/orders", label: "Orders", note: "Marketplace orders" },
  { href: "/admin/dating", label: "Dating profiles", note: "Hide a profile" },
]

// Hell Road admin home. Every number comes from live counts; nothing is estimated.
export default function AdminHome() {
  const { tier, can } = useAdminAccess()
  const notices = useAdminNotices()
  const [data, setData] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    setError(null)
    adminOverview()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the counts"))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const queues = QUEUES.filter((q) => can(q.need as never))
  void queues
  const [written, setWritten] = useState<number | null>(null)
  useEffect(() => { cmsAdmin.list().then((r) => setWritten(r.filter((x) => x.hasSeo).length)).catch(() => setWritten(null)) }, [])
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const items = notices.items
  const grouped = GROUPS.map((g) => ({ ...g, rows: (items ?? []).filter((n) => g.keys.includes(n.key)) })).filter((g) => g.rows.length > 0)

  const Row = ({ n }: { n: AdminNotice }) => (
    <li>
      <Link href={n.href} onClick={() => notices.markSeen(n)} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 group">
        <span className={`shrink-0 min-w-[2.25rem] h-9 px-2 rounded-lg flex items-center justify-center font-bold ${n.urgent ? "bg-red-600 text-white" : "bg-white/10 text-white"}`}>{n.count}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-white">{notices.isNew(n) && <span aria-label="New" className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 align-middle" />}{n.text}</span>
          <span className="block text-xs text-gray-500">{n.cta}</span>
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-sm text-gray-400 group-hover:text-white">Open <ArrowRight className="w-4 h-4" /></span>
      </Link>
    </li>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-10 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-red-400">Hell Road Admin</p>
          <h1 className="text-3xl font-bold text-white mt-1">{greeting}</h1>
          <p className="text-gray-400 mt-1">
            {items === null ? "Checking what needs you…" : notices.total === 0 ? "Nothing is waiting. You are all caught up." : `${notices.total} thing${notices.total === 1 ? "" : "s"} waiting for you${notices.unseen > 0 ? `, ${notices.unseen} new` : ""}.`}
          </p>
        </div>
        <div className="flex gap-2">
          {notices.unseen > 0 && <button onClick={notices.markAllSeen} className="text-sm text-gray-300 hover:text-white border border-white/10 rounded-lg px-4 py-2">Mark all seen</button>}
          <button onClick={() => { load(); notices.reload() }} className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white border border-white/10 rounded-lg px-4 py-2">
            <RefreshCw className={`w-4 h-4 ${loading || notices.busy ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div><p className="font-semibold">Some counts could not be loaded.</p><p className="text-amber-200/80">{error}. You can still use the buttons below.</p></div>
        </div>
      )}

      <section aria-labelledby="todo">
        <h2 id="todo" className="text-lg font-bold text-white mb-1">Do these first</h2>
        <p className="text-sm text-gray-500 mb-4">Start at the top. When you finish one, the number goes down by itself.</p>
        {items === null ? (
          <div className="p-6 flex items-center gap-3 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Checking…</div>
        ) : grouped.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center"><CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500" /><p className="mt-3 text-gray-300">All caught up. New payments, requests and tickets will show here.</p></div>
        ) : (
          <div className="space-y-5">
            {grouped.map((g) => (
              <div key={g.title} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5"><h3 className="font-semibold text-white">{g.title}</h3><p className="text-xs text-gray-500">{g.note}</p></div>
                <ul className="divide-y divide-white/5">{g.rows.map((n) => <Row key={n.key} n={n} />)}</ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="donow">
        <h2 id="donow" className="text-lg font-bold text-white mb-4">Do something now</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DO_NOW.map((a) => (
            <Link key={a.href} href={a.href} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-red-500/60 transition-colors">
              <div className="font-semibold text-white text-sm sm:text-base">{a.label}</div>
              <div className="text-xs text-gray-500 mt-1">{a.note}</div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="site">
        <h2 id="site" className="text-lg font-bold text-white mb-4">The site at a glance</h2>
        {loading && !data ? <div className="flex items-center gap-3 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div> : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {data && INVENTORY.map((i) => (
              <div key={i.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-2xl font-bold text-white">{(data.inventory?.[i.key] ?? 0).toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">{i.label}</div>
              </div>
            ))}
            <Link href="/admin/content" className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-red-500/60">
              <div className="text-2xl font-bold text-white">{written === null ? "—" : `${written}/${CMS_PAGES.length}`}</div>
              <div className="text-xs text-gray-400 mt-1">pages with Google text written</div>
            </Link>
          </div>
        )}
      </section>

      {(tier === "super" || tier === "admin") && (
        <section aria-labelledby="more">
          <h2 id="more" className="text-lg font-bold text-white mb-4">More tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MORE.map((s) => (
              <Link key={s.href} href={s.href} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-red-500/50 transition-colors">
                <div className="font-semibold text-white">{s.label}</div>
                <div className="text-sm text-gray-400 mt-1">{s.note}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
