"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { useAdminAccess } from "@/components/admin/admin-access"
import { adminOverview, type AdminOverview } from "@/lib/api/admin-overview"

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

const SHORTCUTS = [
  { href: "/admin/seller-payments", label: "Seller payments", note: "Confirm deposits and passes" },
  { href: "/escrow/admin-dashboard", label: "Intermediaries", note: "Applications, disputes, refunds" },
  { href: "/admin/seller-applications", label: "Seller applications", note: "Approve new sellers" },
  { href: "/admin/payment-addresses", label: "Payment addresses", note: "Where payments are sent" },
  { href: "/admin/moderation", label: "Listing moderation", note: "Review submitted listings" },
  { href: "/admin/orders", label: "Orders", note: "Marketplace orders" },
]

// Hell Road admin home. Every number comes from live counts; nothing is estimated.
export default function AdminHome() {
  const { tier, can } = useAdminAccess()
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
  const waiting = data ? queues.reduce((n, q) => n + (data.queues?.[q.key] ?? 0), 0) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-red-400">Hell Road Admin</p>
          <h1 className="text-3xl font-bold text-white mt-1">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Signed in as {tier === "super" ? "super admin" : tier === "admin" ? "admin" : "moderator"}.
            {data ? ` ${waiting} item${waiting === 1 ? "" : "s"} waiting for you.` : ""}
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white border border-white/10 rounded-lg px-4 py-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">The counts could not be loaded.</p>
            <p className="text-amber-200/80">{error}. You can still use the links below.</p>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center gap-3 text-gray-400 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : data ? (
        <>
          <section>
            <h2 className="text-lg font-bold text-white mb-4">Needs attention</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {queues.map((q) => {
                const n = data.queues?.[q.key] ?? 0
                return (
                  <Link key={q.key} href={q.href} className={`rounded-xl border p-5 transition-colors ${n > 0 ? "border-red-500/40 bg-red-950/20 hover:border-red-400" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                    <div className={`text-3xl font-bold ${n > 0 ? "text-red-300" : "text-gray-300"}`}>{n.toLocaleString()}</div>
                    <div className="text-sm text-gray-300 mt-1">{q.label}</div>
                  </Link>
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4">On the site</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {INVENTORY.map((i) => (
                <div key={i.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="text-2xl font-bold text-white">{(data.inventory?.[i.key] ?? 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-400 mt-1">{i.label}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {(tier === "super" || tier === "admin") && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Shortcuts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHORTCUTS.map((s) => (
              <Link key={s.href} href={s.href} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-red-500/50 transition-colors">
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
