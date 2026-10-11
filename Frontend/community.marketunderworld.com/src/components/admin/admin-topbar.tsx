"use client"

import Link from "next/link"
import { LogOut, Menu, Search, Store } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useAdminAccess } from "@/components/admin/admin-access"
import { AdminNotificationBell } from "@/components/admin/admin-notifications"

const TIER_LABEL = { super: "Super admin", admin: "Admin", moderator: "Moderator" } as const

// The admin top bar: who is signed in (real), search, a way back to the site, and sign out.
export const AdminTopBar = ({ onOpenMenu }: { onOpenMenu: () => void }) => {
  const { user, logout } = useAuth()
  const { tier } = useAdminAccess()

  return (
    <nav className="h-16 bg-[#070710]/95 backdrop-blur-xl border-b border-white/10 flex items-center gap-3 px-4 sm:px-6 lg:px-8">
      <button onClick={onOpenMenu} aria-label="Open the admin menu" className="lg:hidden p-2.5 text-gray-300 hover:text-white bg-white/5 rounded-lg border border-white/10 shrink-0">
        <Menu className="w-5 h-5" />
      </button>

      <button onClick={() => window.dispatchEvent(new CustomEvent("open-global-search"))} aria-label="Search"
        className="flex items-center gap-3 flex-1 max-w-md h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors min-w-0">
        <Search className="w-4 h-4 shrink-0" /> <span className="truncate">Search the site</span>
      </button>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0">
        <AdminNotificationBell />
        <Link href="/" className="hidden sm:inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5">
          <Store className="w-4 h-4" /> View site
        </Link>
        <div className="text-right hidden md:block max-w-[14rem]">
          <div className="text-sm font-semibold text-white leading-tight truncate">{user?.email ?? "Signed in"}</div>
          <div className="text-xs text-gray-500">{tier ? TIER_LABEL[tier] : "Staff"}</div>
        </div>
        <button onClick={async () => { await logout(); window.location.href = "/" }} aria-label="Sign out" title="Sign out"
          className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-red-500/10 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  )
}
