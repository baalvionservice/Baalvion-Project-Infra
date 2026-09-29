"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authApi, getCurrentUser } from "@/lib/api-client";
import { 
  ShieldAlert, 
  Users, 
  Building2, 
  PackageSearch, 
  Settings2, 
  DollarSign,
  History,
  LayoutDashboard,
  LogOut,
  Globe,
  Scale,
  Star,
  FileDown,
  BookOpen,
  FileStack,
  Megaphone,
  ShieldCheck,
  Languages,
  Brain,
  LifeBuoy,
  Cable,
  Lock,
  Zap,
  CreditCard,
  User,
  Truck,
  UserCheck
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "My Profile", href: "/admin/profile", icon: User },
  { name: "Lead Management", href: "/admin/leads", icon: UserCheck },
  { name: "Platform BI", href: "/admin/reports", icon: FileDown },
  { name: "Monetization Hub", href: "/admin/monetization", icon: DollarSign },
  { name: "Security Center", href: "/admin/security", icon: Lock },
  { name: "Global Trade", href: "/admin/trade", icon: Globe },
  { name: "Logistics Gov", href: "/admin/logistics", icon: Truck },
  { name: "Localization", href: "/admin/localization", icon: Languages },
  { name: "System Scale", href: "/admin/performance", icon: Zap },
  { name: "Product Catalog", href: "/admin/catalog", icon: BookOpen },
  { name: "AI Tuning", href: "/admin/ai", icon: Brain },
  { name: "Integrations", href: "/admin/integrations", icon: Cable },
  { name: "Ad Management", href: "/admin/marketing", icon: Megaphone },
  { name: "Trade Documents", href: "/admin/documents", icon: FileStack },
  { name: "User Control", href: "/admin/users", icon: Users },
  { name: "Company Verification", href: "/admin/companies", icon: Building2 },
  { name: "Product Moderation", href: "/admin/products", icon: PackageSearch },
  { name: "Dispute Center", href: "/admin/disputes", icon: Scale },
  { name: "Support Desk", href: "/admin/support", icon: LifeBuoy },
  { name: "Review Moderation", href: "/admin/reviews", icon: Star },
  { name: "Finances & Fees", href: "/admin/finances", icon: CreditCard },
  { name: "Fraud Monitoring", href: "/admin/fraud", icon: ShieldAlert },
  { name: "Audit Logs", href: "/admin/logs", icon: History },
  { name: "Platform Config", href: "/admin/settings", icon: Settings2 },
];

interface AdminSidebarProps {
  className?: string;
  isMobile?: boolean;
}

export function AdminSidebar({ className, isMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("Super Admin");

  useEffect(() => {
    const r = getCurrentUser()?.role;
    if (r) setRole(r.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
  }, []);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    router.push("/login");
  };

  return (
    <aside className={cn(
      "w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen sticky top-0",
      className
    )}>
      <div className="p-8 flex items-center gap-3">
        <div className="bg-secondary rounded-lg p-1.5">
          <ShieldCheck className="h-6 w-6 text-slate-950" />
        </div>
        <div>
          <span className="font-headline font-bold text-xl tracking-tight text-white block truncate max-w-[160px]">Baalvion HQ</span>
          <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">Master Command</span>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              pathname === item.href 
                ? "bg-secondary text-slate-950 shadow-lg shadow-secondary/10" 
                : "hover:bg-white/5 hover:text-white text-slate-400"
            )}
          >
            <item.icon className={cn("h-4 w-4 shrink-0", pathname === item.href ? "text-slate-950" : "text-slate-400 group-hover:text-white")} />
            {item.name}
          </Link>
        ))}
      </div>

      <div className="p-6 border-t border-sidebar-border bg-slate-950/50">
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold border border-slate-700 shrink-0">
            {role[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate text-white">{role}</span>
            <span className="text-[9px] text-slate-500 uppercase font-black">Industrial Governance</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-slate-400"
        >
          <LogOut className="h-4 w-4" />
          End Session
        </button>
      </div>
    </aside>
  );
}
