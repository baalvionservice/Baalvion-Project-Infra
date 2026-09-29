"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Building2,
  BellRing,
  KeyRound,
  Gauge,
  CreditCard,
  Settings,
  Radar,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/explorer", label: "News Explorer", icon: Search },
  { href: "/dashboard/trends", label: "Trends", icon: TrendingUp },
  { href: "/dashboard/entities", label: "Entities", icon: Building2 },
  { href: "/dashboard/alerts", label: "Alerts", icon: BellRing },
  { href: "/dashboard/api-keys", label: "API", icon: KeyRound },
  { href: "/dashboard/usage", label: "Usage", icon: Gauge },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 md:block">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Radar className="h-5 w-5 text-primary" aria-hidden />
        <Link href="/" className="font-display text-base font-semibold">
          Baalvion Intelligence
        </Link>
      </div>
      <nav className="space-y-1 p-3" aria-label="Dashboard">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
