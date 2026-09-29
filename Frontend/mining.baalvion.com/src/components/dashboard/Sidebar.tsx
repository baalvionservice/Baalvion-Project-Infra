"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Truck, 
  ShieldCheck, 
  BarChart4, 
  MessageSquare, 
  Settings, 
  CreditCard,
  LogOut,
  Gem,
  Pickaxe,
  Factory,
  FileStack,
  FileSignature,
  Warehouse,
  DollarSign,
  Gavel,
  Star,
  FileDown,
  TrendingUp,
  BellRing,
  Megaphone,
  Heart,
  User,
  Globe
} from "lucide-react";

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  // { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "My Mines", href: "/dashboard/mines", icon: Pickaxe },
  { name: "Production", href: "/dashboard/production", icon: Factory },
  { name: "Inventory", href: "/dashboard/inventory", icon: Gem },
  { name: "Warehouse", href: "/dashboard/warehouse", icon: Warehouse },
  { name: "Watchlist", href: "/dashboard/watchlist", icon: Heart },
  { name: "Tenders", href: "/dashboard/tenders", icon: Gavel },
  { name: "RFQs", href: "/dashboard/rfq", icon: ClipboardList },
  { name: "Orders", href: "/dashboard/orders", icon: CreditCard },
  { name: "Contracts", href: "/dashboard/contracts", icon: FileSignature },
  { name: "Documents", href: "/dashboard/documents", icon: FileStack },
  { name: "Logistics", href: "/dashboard/logistics", icon: Truck },
];

const secondaryNavItems = [
  { name: "Price Index", href: "/dashboard/market/prices", icon: TrendingUp },
  { name: "Price Alerts", href: "/dashboard/market/alerts", icon: BellRing },
  { name: "Market Intelligence", href: "/dashboard/market", icon: BarChart4 },
  { name: "Marketing & Ads", href: "/dashboard/marketing", icon: Megaphone },
  { name: "Compliance Hub", href: "/dashboard/compliance", icon: ShieldCheck },
  { name: "Finance Hub", href: "/dashboard/finance", icon: DollarSign },
  { name: "Reputation", href: "/dashboard/reviews", icon: Star },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Company Profile", href: "/dashboard/profile", icon: User },
  { name: "Billing & Plans", href: "/dashboard/settings/billing", icon: CreditCard },
  { name: "Reports & BI", href: "/dashboard/reports", icon: FileDown },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  className?: string;
  isMobile?: boolean;
}

export function DashboardSidebar({ className, isMobile }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen sticky top-0",
      className
    )}>
      <div className="p-6 flex items-center gap-2">
        <div className="bg-white rounded-lg p-1">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-headline font-bold text-lg tracking-tight text-white leading-none">Baalvion</span>
          <span className="text-[8px] font-bold text-secondary uppercase tracking-widest mt-0.5">Mining Network</span>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-8 overflow-y-auto scrollbar-hide">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 mb-4 px-2">Operations</h3>
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  pathname === item.href 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", pathname === item.href ? "text-secondary" : "text-sidebar-foreground/70 group-hover:text-white")} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 mb-4 px-2">Intelligence</h3>
          <nav className="space-y-1">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  pathname === item.href 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", pathname === item.href ? "text-secondary" : "text-sidebar-foreground/70 group-hover:text-white")} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs shrink-0">
            BM
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate text-white">Baalvion Partner</span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate">Tier 3 Verified</span>
          </div>
        </div>
        <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors text-sidebar-foreground/70">
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
