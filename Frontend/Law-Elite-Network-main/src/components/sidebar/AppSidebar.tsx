
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Briefcase, 
  CalendarClock, 
  MessageSquare, 
  Search, 
  Settings2, 
  Users, 
  ShieldAlert, 
  History, 
  TrendingUp,
  Clock,
  Gavel,
  ShieldCheck,
  IndianRupee,
  Award,
  FileText,
  Bell,
  Inbox
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * @fileOverview AppSidebar
 * Unified navigation component surgically adapted for Bank-Grade UI.
 * Updated with full Lawyer Dashboard modules.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role } = useAuthContext();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const menuItems = {
    client: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Legal Briefs", url: "/cases", icon: Briefcase },
      { title: "My Counsel", url: "/my-counsel", icon: Users },
      { title: "Document Vault", url: "/vault", icon: ShieldCheck },
      { title: "Appointments", url: "/appointments", icon: CalendarClock },
      { title: "Messages", url: "/chat", icon: MessageSquare },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Billing Hub", url: "/billing", icon: FileText },
      { title: "Settlements", url: "/transactions", icon: IndianRupee },
      { title: "Membership", url: "/plans", icon: Award },
      { title: "Find Counsel", url: "/lawyers", icon: Search },
      { title: "Settings", url: "/profile", icon: Settings2 },
    ],
    lawyer: [
      { title: "Dashboard", url: "/lawyer/dashboard", icon: LayoutDashboard },
      { title: "Case Requests", url: "/lawyer/requests", icon: Inbox },
      { title: "Active Matters", url: "/cases", icon: Briefcase },
      { title: "Schedule", url: "/appointments", icon: CalendarClock },
      { title: "Secure Uplink", url: "/chat", icon: MessageSquare },
      { title: "Vault", url: "/vault", icon: ShieldCheck },
      { title: "Earnings", url: "/lawyer/earnings", icon: IndianRupee },
      { title: "Standing", url: "/plans", icon: Award },
      { title: "Availability", url: "/lawyer/availability", icon: Clock },
      { title: "Chambers Profile", url: "/lawyer/profile", icon: Settings2 },
    ],
    admin: [
      { title: "Command Center", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Network Analytics", url: "/admin/analytics", icon: TrendingUp },
      { title: "Matter Audit", url: "/cases", icon: ShieldAlert },
      { title: "User Registry", url: "/admin/dashboard", icon: Users },
      { title: "System Logs", url: "/admin/dashboard", icon: History },
    ]
  };

  const currentItems = menuItems[role as keyof typeof menuItems] || menuItems.client;

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-[#0B1F3A]" {...props}>
      <SidebarHeader className="p-6 bg-[#0B1F3A]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
            <Gavel className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col -space-y-1 group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold tracking-tight text-white">
              Law <span className="text-blue-400">Elite</span>
            </span>
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400">Network</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-[#0B1F3A]">
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Professional Shell
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3">
              {currentItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-11 rounded-lg transition-all duration-200 mb-1 ${
                        isActive 
                          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" 
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                      onClick={() => setOpenMobile(false)}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                        <span className={`text-xs font-semibold tracking-wide ${isActive ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-6 group-data-[collapsible=icon]:hidden bg-[#0B1F3A]">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Secure Session</span>
          </div>
          <p className="text-[9px] text-slate-400 uppercase font-medium">
            Tier: <span className="text-blue-400 font-bold">{role?.toUpperCase() || 'MEMBER'}</span>
          </p>
        </div>
      </div>
      
      <SidebarRail />
    </Sidebar>
  );
}
