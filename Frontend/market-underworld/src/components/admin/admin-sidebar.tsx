"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard,
  Users,
  Globe,
  ShoppingBag, 
  CreditCard, 
  ShieldCheck,
  Database,
  Lock,
  ChevronRight,
  LogOut,
  FolderTree,
  ShoppingCart,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  RotateCcw,
  Tag
} from "lucide-react"
import { cn } from "@/lib/utils"

const ADMIN_NAV = [
  {
    group: "OVERVIEW",
    items: [
      { name: "Global Dashboard", path: "/admin", icon: LayoutDashboard },
      { name: "Regional Analytics", path: "/admin/analytics", icon: Globe },
    ]
  },
  {
    group: "MANAGEMENT",
    items: [
      { name: "User Registry", path: "/admin/users", icon: Users },
      { name: "Seller Marketplace", path: "/admin/sellers", icon: ShieldCheck },
      { name: "Seller Applications", path: "/admin/seller-applications", icon: ClipboardCheck },
      { name: "Listing Moderation", path: "/admin/moderation", icon: FileCheck },
      { name: "Listing Oversight", path: "/admin/marketplace", icon: ShoppingBag },
      { name: "Categories", path: "/admin/categories", icon: FolderTree },
      { name: "Live Carts", path: "/admin/carts", icon: ShoppingCart },
      { name: "Order Management", path: "/admin/orders", icon: ClipboardList },
      { name: "Returns", path: "/admin/returns", icon: RotateCcw },
      { name: "Discount Codes", path: "/admin/discounts", icon: Tag },
      { name: "Payment Settings", path: "/admin/payment-settings", icon: CreditCard },
    ]
  },
  {
    group: "MONITORING",
    items: [
      { name: "Security Node", path: "/admin/security", icon: Lock },
      { name: "System Logs", path: "/admin/forum/logs", icon: Database },
    ]
  }
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#050508] border-r border-white/5 w-72 fixed left-0 top-0 z-50">
      <div className="p-8 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center text-black shadow-lg">
            <span className="font-bold text-[14px]">NX</span>
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white block leading-none">NEXUS</span>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Super Admin</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar">
        {ADMIN_NAV.map((group) => (
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
                      ? "bg-red-600/10 text-red-400 border border-red-500/20" 
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4 h-4", pathname === item.path ? "text-red-400" : "text-gray-500 group-hover:text-white")} />
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
