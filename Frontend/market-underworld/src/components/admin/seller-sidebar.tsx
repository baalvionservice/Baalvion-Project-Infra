"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Boxes,
  Truck,
  LogOut,
  ChevronRight,
  Store,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

const SELLER_NAV = [
  {
    group: "OPERATIONS",
    items: [
      { name: "Merchant Overview", path: "/seller-dashboard", icon: LayoutDashboard },
      { name: "Catalog Inventory", path: "/seller-dashboard/inventory", icon: Boxes },
      { name: "Orders", path: "/seller-dashboard/orders", icon: Truck },
    ]
  },
  {
    group: "PROFILE",
    items: [
      { name: "Public Storefront", path: "/marketplace", icon: Store },
    ]
  }
];

export const SellerSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#050508] border-r border-white/5 w-72 fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-white/5">
        <Link href="/seller-dashboard" className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-green flex items-center justify-center text-black font-bold">NX</div>
          <div>
            <h3 className="font-bold text-white leading-none">Global Merchant</h3>
            <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Merchant Node</span>
          </div>
        </Link>
        <Link href="/seller-dashboard/inventory">
          <AppButton className="w-full h-10 text-[10px] uppercase font-mono tracking-widest">
            <RefreshCw className="w-3 h-3 mr-2" /> Sync Catalog
          </AppButton>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {SELLER_NAV.map((group) => (
          <div key={group.group}>
            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-4">{group.group}</h4>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-all group",
                    pathname === item.path ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4 h-4", pathname === item.path ? "text-emerald-400" : "text-gray-500 group-hover:text-white")} />
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

import { AppButton } from "@/components/ui/AppButton";