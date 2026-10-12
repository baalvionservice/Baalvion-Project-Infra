// Who each person is on the platform, put together from the services that know: sign-up details from the user service,
// then seller applications, payments (buyer pass, categories, tiers), intermediaries, staff and KYC. A source that cannot be
// read (for example a moderator without access to payments) is skipped, so the list still works.
import { listUsers, type AdminUser } from "./admin-users"

export interface Person {
  user: AdminUser
  seller: { status: "pending" | "approved" | "rejected"; storeName: string } | null
  buyerPass: boolean
  categories: number
  tiers: string[]
  waitingPayments: number
  intermediary: { status: string; name: string } | null
  staff: string | null
  kyc: string | null
}

async function get<T>(proxy: "commerce" | "community", path: string): Promise<T | null> {
  try {
    const res = await fetch(`/api/${proxy}-proxy${path}`, { credentials: "include", cache: "no-store" })
    const body = await res.json().catch(() => ({}))
    return res.ok && body.success !== false ? (body.data as T) : null
  } catch { return null }
}
const rows = <T,>(d: unknown): T[] => (Array.isArray(d) ? (d as T[]) : d && typeof d === "object" && Array.isArray((d as { items?: unknown[] }).items) ? ((d as { items: T[] }).items) : [])

export async function loadPeople(): Promise<Person[]> {
  const users: AdminUser[] = []
  for (let page = 1; page <= 10; page += 1) {
    const r = await listUsers({ page, limit: 100 })
    users.push(...r.items)
    if (!r.hasMore) break
  }
  const [apps, bonds, inter, staff, kyc] = await Promise.all([
    get<unknown>("commerce", "/seller-applications?limit=100"),
    get<unknown>("commerce", "/seller-bonds?limit=100"),
    get<unknown>("commerce", "/intermediaries/admin"),
    get<unknown>("community", "/admin/staff"),
    get<unknown>("community", "/admin/kyc"),
  ])
  const byUser = <T extends Record<string, unknown>>(list: T[], key: string) => { const m = new Map<string, T[]>(); for (const x of list) { const k = String(x[key] ?? ""); if (k) m.set(k, [...(m.get(k) ?? []), x]) } return m }
  const A = byUser(rows<Record<string, unknown>>(apps), "applicantUserId")
  const B = byUser(rows<Record<string, unknown>>(bonds), "sellerUserId")
  const I = byUser(rows<Record<string, unknown>>(inter), "userId")
  const S = byUser(rows<Record<string, unknown>>(staff), "userId")
  const K = byUser(rows<Record<string, unknown>>(kyc), "userId")

  return users.map((user) => {
    const a = A.get(user.id) ?? []
    const best = a.find((x) => x.status === "approved") ?? a.find((x) => x.status === "pending") ?? a[0]
    const b = B.get(user.id) ?? []
    const i = (I.get(user.id) ?? [])[0]
    const st = (S.get(user.id) ?? [])[0]
    const k = (K.get(user.id) ?? [])[0]
    return {
      user,
      seller: best ? { status: best.status as "pending" | "approved" | "rejected", storeName: String(best.storeName ?? "") } : null,
      buyerPass: b.some((x) => x.kind === "buyer_access" && x.status === "active"),
      categories: b.filter((x) => x.kind === "category" && x.status === "active").length,
      tiers: b.filter((x) => x.kind === "community_tier" && x.status === "active").map((x) => String(x.tierSlug)),
      waitingPayments: b.filter((x) => x.status === "payment_submitted").length,
      intermediary: i ? { status: String(i.status), name: String(i.displayName ?? "") } : null,
      staff: st ? String(st.tier ?? "staff") : null,
      kyc: k ? String(k.status) : null,
    }
  })
}
