"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, FolderTree, KeyRound, Users, BarChart2, Wallet, LayoutDashboard, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { name: "Listings",       path: "/seller/listings",   icon: Package   },
  { name: "Orders",         path: "/seller/sales",       icon: Users     },
  { name: "Analytics",      path: "/seller/analytics",   icon: BarChart2 },
  { name: "Payouts",        path: "/seller/payouts",     icon: Wallet    },
  { name: "Categories",     path: "/seller/categories",  icon: FolderTree },
  { name: "Access",         path: "/seller/access",      icon: KeyRound  },
];

// Full seller top-nav: back link + all seller sections
export function SellerNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-white/5 bg-[#050508]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-1 py-2">
        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-white hover:bg-white/5 transition-all mr-2 shrink-0"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-700 shrink-0" />
        {/* Seller nav tabs */}
        {NAV.map((item) => {
          const active = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                active ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-3.5 h-3.5" /> {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
