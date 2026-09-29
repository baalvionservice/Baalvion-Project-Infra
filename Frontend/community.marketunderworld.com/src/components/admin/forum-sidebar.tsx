"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShieldAlert, Database, Users, Flag, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Trimmed to real, working sections only. Reports Queue now has a real backend (NodeBB flags
// via community-service's /admin/flags — see adminController.listFlags) and was added back.
// The rest of the original mock nav (Thread Manager, Announcements, VIP Sections, Community
// Health, Forum Settings) still linked to pages with no backend — left out per the "no mock
// in production" directive until each has one.
const FORUM_NAV = [
  { name: "Join Requests", path: "/admin/forum", icon: LayoutDashboard },
  { name: "Reports Queue", path: "/admin/forum/reports", icon: Flag },
  { name: "Members", path: "/admin/forum/members", icon: Users },
  { name: "Moderation Logs", path: "/admin/forum/logs", icon: Database },
];

export const ForumSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#050508] border-r border-white/5 w-72 fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-none">Community Mod</h3>
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Forum Moderator</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-1 no-scrollbar">
        {FORUM_NAV.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl transition-all group",
              pathname === item.path ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5" : "text-gray-500 hover:text-white hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("w-4 h-4", pathname === item.path ? "text-cyan-400" : "text-gray-500 group-hover:text-white")} />
              <span className="text-sm font-bold">{item.name}</span>
            </div>
            <ChevronRight className={cn("w-3 h-3 opacity-0 transition-all", pathname === item.path ? "opacity-100" : "group-hover:opacity-40")} />
          </Link>
        ))}
      </nav>
    </div>
  )
}
