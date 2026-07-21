"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, FolderTree, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { name: "Listings", path: "/seller/listings", icon: Package },
  { name: "Orders", path: "/seller/orders", icon: ClipboardList },
  { name: "Categories", path: "/seller/categories", icon: FolderTree },
];

// Lightweight top nav for the seller listing-management surfaces (/seller/listings,
// /seller/categories) — deliberately separate from SellerSidebar, which is scoped to
// /seller-dashboard's gift-card-catalog admin tooling, not product listing management.
export function SellerNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-white/5 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1000px] mx-auto px-10 flex gap-1 py-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
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
