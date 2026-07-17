"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Globe, 
  BarChart3, 
  Users, 
  MessageSquare, 
  ShoppingBag, 
  CreditCard, 
  Send, 
  Settings, 
  ArrowUpRight,
  ChevronRight,
  Map as MapIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NexusBadge } from "@/components/ui/nexus-card"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface RegionNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  flag?: string;
  count?: number;
}

const REGION_NAV: { group: string; items: RegionNavItem[] }[] = [
  {
    group: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/admin/region", icon: LayoutDashboard },
      { name: "Region Analytics", path: "#", icon: BarChart3 },
      { name: "Region Map", path: "#", icon: MapIcon },
    ]
  },
  {
    group: "COUNTRIES",
    items: [
      { name: "India", path: "/admin/country", icon: Globe, flag: "🇮🇳" },
      { name: "Pakistan", path: "#", icon: Globe, flag: "🇵🇰" },
      { name: "Bangladesh", path: "#", icon: Globe, flag: "🇧🇩" },
      { name: "Sri Lanka", path: "#", icon: Globe, flag: "🇱🇰" },
      { name: "Nepal", path: "#", icon: Globe, flag: "🇳🇵" },
    ]
  },
  {
    group: "MANAGEMENT",
    items: [
      { name: "Teachers", path: "#", icon: Users, count: 49 },
      { name: "Students", path: "#", icon: Users, count: 490 },
      { name: "Regional Orders", path: "#", icon: ShoppingBag },
    ]
  }
];

export const RegionSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F] border-r border-white/5 w-72 fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="text-4xl">🌿</div>
          <div>
            <h3 className="font-bold text-white leading-none">South Asia</h3>
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Region Admin</span>
          </div>
        </div>
        
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Admin Context</div>
          <div className="font-bold text-sm text-white">Raj Patel</div>
          <div className="text-[9px] text-emerald-500 font-bold uppercase mt-1">🟢 Region Online</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {REGION_NAV.map((group) => (
          <div key={group.group}>
            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-4">{group.group}</h4>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-all group",
                    pathname === item.path ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.flag ? <span className="text-lg">{item.flag}</span> : <item.icon className="w-4 h-4" />}
                    <span className="text-sm font-bold">{item.name}</span>
                  </div>
                  {item.count && <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-full">{item.count}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <Link href="/admin/super" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Report to Super Admin</span>
          <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
        </Link>
      </div>
    </div>
  )
}