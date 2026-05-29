"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Scale, Users, UserCog, Briefcase, CalendarClock, CreditCard,
  BadgeDollarSign, Star, Newspaper, FolderTree, ListTree, Gift, Megaphone,
  ScrollText, ShieldAlert, Loader2, LogOut, ShieldCheck,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ElementType };

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "People",
    items: [
      { href: "/admin/lawyers", label: "Lawyers", icon: Scale },
      { href: "/admin/clients", label: "Clients", icon: Users },
      { href: "/admin/users", label: "Users", icon: UserCog },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/admin/cases", label: "Cases", icon: Briefcase },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarClock },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    section: "Commerce",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: BadgeDollarSign },
      { href: "/admin/referrals", label: "Referrals", icon: Gift },
    ],
  },
  {
    section: "Content",
    items: [
      { href: "/admin/articles", label: "Articles", icon: Newspaper },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/subcategories", label: "Subcategories", icon: ListTree },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
      { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
    ],
  },
];

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-6 text-center">{children}</div>;
}

export default function AdminShell({ title, children }: { title?: string; children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const admin = isAdmin; // law role (from /auth/me), authoritative — not the identity org-role

  if (loading) {
    return (
      <Centered>
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading admin console…</p>
      </Centered>
    );
  }

  if (!isAuthenticated) {
    return (
      <Centered>
        <ShieldAlert className="w-12 h-12 text-amber-500" />
        <h1 className="text-xl font-semibold">Sign in required</h1>
        <p className="text-muted-foreground max-w-md">The admin console requires an authenticated administrator session.</p>
        <Button onClick={() => router.push("/login")}>Go to login</Button>
      </Centered>
    );
  }

  if (!admin) {
    return (
      <Centered>
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-muted-foreground max-w-md">Your account does not have administrator privileges for the Law Elite Network.</p>
        <Button variant="outline" onClick={() => router.push("/")}>Return home</Button>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-background">
        <div className="flex items-center gap-2 px-5 h-16 border-b">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div className="leading-tight">
            <div className="font-semibold text-sm">Law Elite</div>
            <div className="text-[11px] text-muted-foreground">Admin Console</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="px-2 mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{group.section}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => { logout(); router.push("/login"); }}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-background flex items-center px-6">
          <h1 className="text-lg font-semibold">{title || "Dashboard"}</h1>
          {/* mobile nav fallback */}
          <nav className="ml-auto md:hidden flex gap-1 overflow-x-auto">
            {NAV.flatMap((g) => g.items).slice(0, 6).map((item) => (
              <Link key={item.href} href={item.href} className="text-xs px-2 py-1 rounded hover:bg-muted whitespace-nowrap">{item.label}</Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
