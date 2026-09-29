"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Store, 
  MessageSquare, 
  ChevronRight,
  TrendingUp,
  Activity,
  Zap,
  Tag,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

const TEACHER_NAV = [
  {
    group: "OPERATIONS",
    items: [
      { name: "Overview", path: "/teacher-dashboard", icon: LayoutDashboard },
      { name: "Live Sessions", path: "/teacher-dashboard/sessions", icon: Activity },
      { name: "Student List", path: "/teacher-dashboard/students", icon: Users },
    ]
  },
  {
    group: "ASSETS",
    items: [
      { name: "Promote Products", path: "/teacher-dashboard/products", icon: Store },
    ]
  },
  {
    group: "PERFORMANCE",
    items: [
      { name: "Revenue Metrics", path: "/teacher-dashboard/revenue", icon: CreditCard },
    ]
  }
];

export const TeacherSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F] border-r border-white/5 w-72 fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500/20 p-1">
            <img src="https://picsum.photos/seed/priya/100/100" className="w-full h-full object-cover rounded-xl" alt="Priya" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-none">Priya Sharma</h3>
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Operator Node</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {TEACHER_NAV.map((group) => (
          <div key={group.group}>
            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-4">{group.group}</h4>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-all group",
                    pathname === item.path 
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" 
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4 h-4", pathname === item.path ? "text-orange-400" : "text-gray-500 group-hover:text-white")} />
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
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </Link>
      </div>
    </div>
  )
}