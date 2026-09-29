"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Zap, 
  ShoppingBag, 
  Wallet, 
  Clock, 
  ChevronRight,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { STUDENT_PROFILE } from "@/lib/mock-student-data"

const STUDENT_NAV = [
  {
    group: "HUB",
    items: [
      { name: "Command Center", path: "/student-dashboard", icon: Home },
      { name: "Live Sessions", path: "/student-dashboard/sessions", icon: Zap },
    ]
  },
  {
    group: "TRADE",
    items: [
      { name: "Purchases", path: "/student-dashboard/purchases", icon: ShoppingBag },
      { name: "Wallet Protocol", path: "/student-dashboard/wallet", icon: Wallet },
      { name: "History", path: "/student-dashboard/history", icon: Clock },
    ]
  }
];

export const StudentSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#050508] border-r border-white/5 w-72 fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <img src={STUDENT_PROFILE.avatar} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="Me" />
          <div>
            <h3 className="font-bold text-white leading-none">{STUDENT_PROFILE.name}</h3>
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Learner Node</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {STUDENT_NAV.map((group) => (
          <div key={group.group}>
            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-4">{group.group}</h4>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-all group",
                    pathname === item.path ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-gray-500 hover:text-white hover:bg-white/5"
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

      <div className="p-6 mt-auto border-t border-white/5">
        <Link href="/">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-bold">Terminate Session</span>
          </button>
        </Link>
      </div>
    </div>
  )
}