
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  MessageSquare, 
  ShieldAlert, 
  Users, 
  Flag, 
  Bell, 
  Settings, 
  ChevronRight,
  Hash,
  Database,
  Search,
  Lock,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

const FORUM_NAV = [
  {
    group: "MODERATION",
    items: [
      { name: "Mod Dashboard", path: "/admin/forum", icon: LayoutDashboard },
      { name: "Reports Queue", path: "/admin/forum/reports", icon: Flag },
      { name: "Flagged Content", path: "/admin/forum/flagged", icon: ShieldAlert },
      { name: "User Bans", path: "/admin/forum/bans", icon: Lock },
    ]
  },
  {
    group: "CONTENT",
    items: [
      { name: "Thread Manager", path: "/admin/forum/threads", icon: Hash },
      { name: "Announcements", path: "/admin/forum/announcements", icon: Bell },
      { name: "VIP Sections", path: "/admin/forum/vip", icon: MessageSquare },
    ]
  },
  {
    group: "SYSTEM",
    items: [
      { name: "Community Health", path: "/admin/forum/health", icon: TrendingUp },
      { name: "Moderation Logs", path: "/admin/forum/logs", icon: Database },
      { name: "Forum Settings", path: "/admin/forum/settings", icon: Settings },
    ]
  }
];

export const ForumSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#050508] border-r border-white/5 w-72 fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-none">NEXUS Mod</h3>
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Forum Moderator</span>
          </div>
        </div>
        
        <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
          <div className="text-[9px] font-bold text-cyan-400 uppercase mb-1">Moderation Queue</div>
          <div className="font-bold text-lg text-white">18 Items</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {FORUM_NAV.map((group) => (
          <div key={group.group}>
            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-4">{group.group}</h4>
            <div className="space-y-1">
              {group.items.map((item) => (
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
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">247 Online</span>
          </div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
