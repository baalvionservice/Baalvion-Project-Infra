// Everything waiting for an admin, gathered from the services that own each queue. A call that fails (for example a
// moderator who may not open payments) is simply left out, so each person sees what they are allowed to act on.

export interface AdminNotice { key: string; count: number; text: string; href: string; cta: string; urgent?: boolean }

async function get<T>(proxy: "commerce" | "community", path: string): Promise<T | null> {
  try {
    const res = await fetch(`/api/${proxy}-proxy${path}`, { credentials: "include", cache: "no-store" })
    const body = await res.json().catch(() => ({}))
    return res.ok && body.success !== false ? (body.data as T) : null
  } catch { return null }
}
const n = (v: unknown) => (Array.isArray(v) ? v.length : v && typeof v === "object" && Array.isArray((v as { items?: unknown[] }).items) ? ((v as { total?: number; items: unknown[] }).total ?? (v as { items: unknown[] }).items.length) : 0)
const plural = (c: number, one: string, many: string) => `${c} ${c === 1 ? one : many}`

export async function fetchAdminNotices(): Promise<AdminNotice[]> {
  const [payments, sellers, listings, intermediaries, disputes, djs, draws, overview, kyc, requests, elite, tickets, joins] = await Promise.all([
    get<unknown>("commerce", "/seller-bonds?limit=100&status=payment_submitted"),
    get<unknown>("commerce", "/seller-applications?status=pending&limit=100"),
    get<unknown>("commerce", "/admin/products/pending?limit=100"),
    get<{ status: string }[]>("commerce", "/intermediaries/admin"),
    get<unknown>("commerce", "/intermediary-trades/admin?status=disputed"),
    get<unknown>("commerce", "/engagement/admin/dj-demands?status=pending"),
    get<{ items: { status: string; closesAt: string }[] }>("commerce", "/engagement/admin/lottery"),
    get<{ queues: Record<string, number> }>("community", "/admin/overview"),
    get<unknown>("community", "/admin/kyc?status=submitted"),
    get<unknown>("community", "/admin/access-requests?status=pending"),
    get<unknown>("community", "/admin/nightlife/elite-host?status=pending"),
    get<{ counts?: Record<string, number> }>("community", "/admin/support/tickets?status=open"),
    get<unknown>("community", "/admin/join-requests"),
  ])
  const q = overview?.queues ?? {}
  const waitingIntermediaries = (intermediaries ?? []).filter((i) => i.status === "applied" || i.status === "payment_submitted").length
  const drawsToRun = (draws?.items ?? []).filter((d) => d.status === "closed" || (d.status === "open" && new Date(d.closesAt).getTime() <= Date.now())).length
  const openTickets = tickets?.counts?.open ?? 0

  const all: (AdminNotice | null)[] = [
    { key: "payments", count: n(payments), text: "", href: "/admin/seller-payments", cta: "Check and confirm", urgent: true },
    { key: "disputes", count: n(disputes), text: "", href: "/escrow/admin-dashboard", cta: "Decide", urgent: true },
    { key: "sellers", count: n(sellers), text: "", href: "/admin/seller-applications", cta: "Review" },
    { key: "listings", count: n(listings), text: "", href: "/admin/moderation", cta: "Approve or reject" },
    { key: "intermediaries", count: waitingIntermediaries, text: "", href: "/escrow/admin-dashboard", cta: "Review" },
    { key: "tickets", count: openTickets, text: "", href: "/admin/support/tickets", cta: "Reply", urgent: true },
    { key: "kyc", count: n(kyc), text: "", href: "/admin/kyc", cta: "Verify" },
    { key: "bookings", count: q.pendingBookings ?? 0, text: "", href: "/admin/clubs/bookings", cta: "Answer" },
    { key: "locals", count: q.pendingApplications ?? 0, text: "", href: "/admin/locals/applications", cta: "Review" },
    { key: "vetting", count: (q.pendingProfiles ?? 0) + (q.pendingEmployers ?? 0), text: "", href: "/nightlife/verify", cta: "Review" },
    { key: "djs", count: n(djs), text: "", href: "/admin/clubs/dj-demands", cta: "Approve or reject" },
    { key: "draws", count: drawsToRun, text: "", href: "/admin/clubs/lottery", cta: "Run the draw" },
    { key: "elite", count: n(elite), text: "", href: "/admin/clubs/elite-host", cta: "Review" },
    { key: "requests", count: n(requests), text: "", href: "/admin/access-requests", cta: "Decide" },
    { key: "joins", count: n(joins), text: "", href: "/admin/forum", cta: "Approve or decline" },
    { key: "reports", count: q.submittedReports ?? 0, text: "", href: "/admin/bounty", cta: "Review" },
    { key: "bounty", count: q.unreadThreads ?? 0, text: "", href: "/admin/bounty", cta: "Read and reply" },
  ]
  const TEXT: Record<string, (c: number) => string> = {
    payments: (c) => `${plural(c, "payment", "payments")} waiting for you to confirm`,
    disputes: (c) => `${plural(c, "trade dispute", "trade disputes")} to decide`,
    sellers: (c) => `${plural(c, "seller application", "seller applications")} to review`,
    listings: (c) => `${plural(c, "new listing", "new listings")} waiting for approval`,
    intermediaries: (c) => `${plural(c, "intermediary application", "intermediary applications")} to review`,
    tickets: (c) => `${plural(c, "help ticket", "help tickets")} waiting for a reply`,
    kyc: (c) => `${plural(c, "identity check", "identity checks")} to verify`,
    bookings: (c) => `${plural(c, "guest list or VIP request", "guest list and VIP requests")} to answer`,
    locals: (c) => `${plural(c, "application to a Locals listing", "applications to Locals listings")}`,
    vetting: (c) => `${plural(c, "nightlife profile or employer", "nightlife profiles and employers")} to vet`,
    djs: (c) => `${plural(c, "DJ proposal", "DJ proposals")} to approve`,
    draws: (c) => `${plural(c, "ticket draw", "ticket draws")} ready to run`,
    elite: (c) => `${plural(c, "Elite party application", "Elite party applications")} to review`,
    requests: (c) => `${plural(c, "department request", "department requests")} from members`,
    joins: (c) => `${plural(c, "forum join request", "forum join requests")} to decide`,
    reports: (c) => `${plural(c, "bug bounty report", "bug bounty reports")} to review`,
    bounty: (c) => `${plural(c, "unread bounty message", "unread bounty messages")}`,
  }
  return all.filter((x): x is AdminNotice => !!x && x.count > 0).map((x) => ({ ...x, text: TEXT[x.key](x.count) }))
}
