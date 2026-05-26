"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Brain,
  Search,
  BookOpen,
  Terminal,
  DollarSign,
  BarChart3,
  Settings,
  ChevronRight,
  ShieldCheck,
  Layers,
  ShieldAlert,
  Globe,
  Tag as TagIcon,
  Package,
  X,
} from "lucide-react";
import { Text } from "@/design-system/typography/text";

const navGroups = [
  {
    label: "Governance",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Pages Empire", href: "/admin/pages", icon: FileText },
      { label: "AI Content Lab", href: "/admin/ai", icon: Brain },
      { label: "User & RBAC", href: "/admin/users", icon: Users },
    ],
  },
  {
    label: "Index Control",
    items: [
      { label: "Glossary Hub", href: "/admin/glossary", icon: BookOpen },
      { label: "Knowledge Graph", href: "/knowledge-map", icon: Layers },
      { label: "Taxonomy (Tags)", href: "/admin/tags", icon: TagIcon },
      { label: "SEO Engine", href: "/admin/seo", icon: Search },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Monetization", href: "/admin/monetization", icon: DollarSign },
      { label: "Analytics Hub", href: "/admin/analytics", icon: BarChart3 },
      { label: "API Gateway", href: "/admin/api-hub", icon: Terminal },
      { label: "Compliance", href: "/admin/compliance", icon: ShieldAlert },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Global Hub", href: "/admin/global", icon: Globe },
      { label: "Media Library", href: "/admin/media", icon: Package },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-card/30 border-r border-white/5 h-screen flex flex-col bg-background shrink-0 overflow-hidden transition-transform duration-300 ease-in-out z-50",
        "lg:sticky lg:top-0 lg:translate-x-0",
        "fixed top-0 left-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 group outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-primary">
              <Text variant="h4" className="text-white font-bold">
                I
              </Text>
            </div>
            <div className="flex flex-col">
              <Text
                variant="h4"
                className="font-bold tracking-tight text-sm leading-none"
              >
                Super Admin
              </Text>
              <Text
                variant="caption"
                className="text-[8px] uppercase tracking-widest text-muted-foreground mt-1"
              >
                Control Center
              </Text>
            </div>
          </Link>
          
          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            <Text
              variant="label"
              className="px-4 text-[9px] text-muted-foreground/60 font-bold uppercase tracking-[0.2em]"
            >
              {group.label}
            </Text>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={16}
                        className={cn(
                          isActive
                            ? "text-white"
                            : "group-hover:text-primary transition-colors"
                        )}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {item.label}
                      </span>
                    </div>
                    {isActive && (
                      <ChevronRight
                        size={14}
                        className="animate-in slide-in-from-left-1 duration-300"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:rotate-12 transition-transform">
            <ShieldCheck size={16} className="text-primary" />
          </div>
          <div className="flex items-center gap-2 text-primary font-bold text-[9px] uppercase tracking-widest mb-2">
            <ShieldCheck size={12} /> Root Handshake Active
          </div>
          <Text variant="bodySmall" weight="bold" className="truncate text-xs">
            Eleanor Vance
          </Text>
          <Text
            variant="caption"
            className="text-muted-foreground block text-[9px] mt-1"
          >
            Status: Operational
          </Text>
        </div>
      </div>
    </aside>
    </>
  );
}
