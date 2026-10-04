"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { access, type Permission, type StaffMe, type Tier } from "@/lib/api/staff"

// What each console page needs. "platform" = the commerce/identity-governed pages, which only the
// super and admin tiers use (those backends enforce their own roles too). Longest prefix wins.
export const PAGE_REQUIREMENTS: [string, Permission | "platform"][] = [
  ["/admin/staff", "staff.manage"],
  ["/admin/kyc", "kyc.review"],
  ["/admin/bounty", "bounty.manage"],
  ["/admin/investments", "content.manage"],
  ["/admin/clubs/bookings", "content.handle"],
  ["/admin/clubs", "content.manage"],
  ["/nightlife/verify", "verify.review"],
  ["/admin/locals/applications", "content.handle"],
  ["/admin/locals", "content.manage"],
  ["/admin/education/approvals", "verify.review"],
  ["/admin/education", "content.manage"],
  ["/admin/sessions", "content.manage"],
  ["/admin/support/tickets", "support.handle"],
  ["/admin/system/announcements", "announce.publish"],
  ["/admin/system/audit", "audit.view"],
  ["/admin/users", "platform"],
  ["/admin/sellers", "platform"],
  ["/admin/seller-applications", "platform"],
  ["/admin/moderation", "platform"],
  ["/admin/marketplace", "platform"],
  ["/admin/categories", "platform"],
  ["/admin/carts", "platform"],
  ["/admin/orders", "platform"],
  ["/admin/returns", "platform"],
  ["/admin/discounts", "platform"],
  ["/admin/payment-settings", "platform"],
  ["/admin/forum", "platform"],
  ["/admin/support", "platform"],
  ["/admin/security", "platform"],
  ["/admin/analytics", "platform"],
];

export function requirementFor(path: string): Permission | "platform" | null {
  const hit = PAGE_REQUIREMENTS.filter(([prefix]) => path === prefix || path.startsWith(`${prefix}/`)).sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? hit[1] : null;
}

interface AccessValue {
  tier: Tier | null;
  loading: boolean;
  can: (need: Permission | "platform" | null) => boolean;
}

const Ctx = createContext<AccessValue>({ tier: null, loading: true, can: () => false });
export const useAdminAccess = () => useContext(Ctx);

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [me, setMe] = useState<StaffMe | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      setDone(true)
      return
    }
    access.me().then(setMe).catch(() => setMe(null)).finally(() => setDone(true))
  }, [isLoading, isAuthenticated])

  const value = useMemo<AccessValue>(() => {
    const tier = me?.tier ?? null
    const perms = new Set(me?.permissions ?? [])
    return {
      tier,
      loading: !done,
      can: (need) => {
        if (!tier) return false
        if (need === null) return true
        if (need === "platform") return tier === "super" || tier === "admin"
        return perms.has(need)
      },
    }
  }, [me, done])

  const staff = !!value.tier
  useEffect(() => {
    if (done && !staff) router.replace("/auth/signin")
  }, [done, staff, router])

  if (!done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508]">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    )
  }
  if (!staff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#050508] text-center px-6">
        <ShieldAlert className="w-8 h-8 text-red-400" />
        <p className="text-white font-bold">You don&apos;t have access to this area.</p>
        <p className="text-gray-500 text-sm">Redirecting to sign in&hellip;</p>
      </div>
    )
  }

  const need = requirementFor(pathname)
  return (
    <Ctx.Provider value={value}>
      {need && !value.can(need) ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#050508] text-center px-6">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
          <p className="text-white font-bold">Your staff level ({value.tier}) can&apos;t open this page.</p>
          <p className="text-gray-500 text-sm">Ask a super admin if you need access.</p>
          <a href="/admin" className="text-sm text-fuchsia-400 underline">Back to the dashboard</a>
        </div>
      ) : children}
    </Ctx.Provider>
  )
}
