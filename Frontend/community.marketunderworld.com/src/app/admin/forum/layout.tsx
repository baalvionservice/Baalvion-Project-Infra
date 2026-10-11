"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

// The admin layout above already provides the sidebar and top bar, so the forum pages only add their own section tabs.
const TABS = [
  { name: "Join requests", path: "/admin/forum" },
  { name: "Reports", path: "/admin/forum/reports" },
  { name: "Thread queue", path: "/admin/forum/queue" },
  { name: "Members", path: "/admin/forum/members" },
  { name: "Strikes", path: "/admin/forum/strikes" },
  { name: "Ranks and badges", path: "/admin/forum/badges" },
  { name: "Moderation logs", path: "/admin/forum/logs" },
]

export default function ForumAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div>
      <nav aria-label="Forum admin sections" className="flex gap-2 overflow-x-auto pt-1 pb-4 mb-6 border-b border-white/10 [scrollbar-width:none]">
        {TABS.map((t) => {
          const on = pathname === t.path
          return (
            <Link key={t.path} href={t.path} aria-current={on ? "page" : undefined}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium border ${on ? "bg-red-600 border-red-600 text-white" : "border-white/10 text-gray-300 hover:text-white hover:border-white/25"}`}>{t.name}</Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
