"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Navigation, 
  FileText, 
  Layers, 
  FolderTree, 
  ShieldCheck, 
  Newspaper, 
  Users, 
  History, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  GitPullRequest,
  Gavel,
  Briefcase,
  Bell,
  FileBarChart,
  Brain,
  TrendingUp,
  FileSearch
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { group: "Overview", items: [
    { icon: LayoutDashboard, label: "Command Center", href: "/admin/dashboard" },
    { icon: TrendingUp, label: "Performance Hub", href: "/admin/performance" },
    { icon: Activity, label: "System Health", href: "/admin/system-dashboard" },
    { icon: Brain, label: "Intelligence", href: "/admin/intelligence" },
  ]},
  { group: "Governance", items: [
    { icon: GitPullRequest, label: "Review Queue", href: "/admin/review-queue" },
    { icon: Gavel, label: "Resolutions", href: "/admin/voting" },
    { icon: Briefcase, label: "Board Briefcase", href: "/admin/board-materials" },
    { icon: ShieldCheck, label: "Compliance Registry", href: "/admin/subscribers" },
  ]},
  { group: "Content", items: [
    { icon: FileText, label: "Page Architecture", href: "/admin/pages" },
    { icon: Navigation, label: "Nav Structure", href: "/admin/navigation" },
    { icon: FolderTree, label: "Vault Manager", href: "/admin/data-room" },
    { icon: Bell, label: "Investor Alerts", href: "/admin/notifications" },
  ]},
  { group: "Reporting", items: [
    { icon: FileBarChart, label: "Regulatory Exports", href: "/admin/reports" },
    { icon: History, label: "System Audit", href: "/admin/dashboard" }, // Shared with dashboard tabs
    { icon: Settings, label: "Platform Settings", href: "/admin/dashboard" },
  ]}
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "border-r bg-card transition-all duration-300 flex flex-col h-screen sticky top-0",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="h-16 flex items-center px-6 border-b justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold shrink-0">
          {!isCollapsed && <span className="tracking-tighter text-xl">Baalvion</span>}
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-3 mb-4">
                {group.group}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                    pathname === item.href 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    pathname === item.href ? "text-primary" : "group-hover:text-primary"
                  )} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t bg-muted/20">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed ? "justify-center" : "px-2"
        )}>
          <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-[10px] font-bold">
            GP
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-bold truncate max-w-[120px]">GP Operator</span>
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Admin Session</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
