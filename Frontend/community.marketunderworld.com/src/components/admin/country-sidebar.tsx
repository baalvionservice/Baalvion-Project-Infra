"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  ArrowUpRight,
  ChevronRight,
  Circle,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"

const TEACHERS_LIST = [
  { name: "Rahul Patel", status: "active" },
  { name: "Anita Singh", status: "active" },
  { name: "Vikram Kumar", status: "active" },
  { name: "Deepa Nair", status: "live" },
  { name: "Arjun Sharma", status: "inactive" },
];

export const CountrySidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F] border-r border-white/5 w-72 fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="text-4xl">🇮🇳</div>
          <div>
            <h3 className="font-bold text-white leading-none">India Admin</h3>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Country Scoped</span>
          </div>
        </div>
        
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
          <div className="text-[9px] font-bold text-blue-400 uppercase mb-1">Admin Context</div>
          <div className="font-bold text-sm text-white">Priya Sharma</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        <div>
          <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-4">OVERVIEW</h4>
          <div className="space-y-1">
            <Link href="/admin/country" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", pathname === "/admin/country" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-gray-500 hover:text-white hover:bg-white/5")}>
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm font-bold">Dashboard</span>
            </Link>
            <Link href="#" className="flex items-center gap-3 p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-bold">Analytics</span>
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-4">TEACHERS</h4>
          <div className="space-y-1">
            {TEACHERS_LIST.map((t) => (
              <Link key={t.name} href="/admin/teacher" className="flex items-center justify-between p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-3">
                  <Circle className={cn("w-2 h-2 fill-current", t.status === 'live' ? 'text-red-500 animate-pulse' : t.status === 'active' ? 'text-emerald-500' : 'text-gray-700')} />
                  <span className="text-sm font-bold">{t.name}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-4">OPERATIONS</h4>
          <div className="space-y-1">
            <button className="flex items-center gap-3 p-3 w-full rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all text-left">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-bold">Today's Schedule</span>
            </button>
            <button className="flex items-center gap-3 p-3 w-full rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all text-left">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-bold">Country Revenue</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-6 border-t border-white/5">
        <Link href="/admin/region" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Report to Region</span>
          <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
        </Link>
      </div>
    </div>
  )
}