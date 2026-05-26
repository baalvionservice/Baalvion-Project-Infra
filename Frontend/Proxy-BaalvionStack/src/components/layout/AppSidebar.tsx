import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Globe, Layers, Users, BarChart3, CreditCard, Key, Settings,
  ChevronLeft, ChevronRight, Zap, Shield, ClipboardList, FileText, Wallet, Receipt, ShoppingCart,
  ChevronDown, Activity, Lock, Building2, HeadphonesIcon, Database, Bell, Network, ShieldCheck, Landmark, Brain, Handshake
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnterprise } from "@/contexts/EnterpriseContext";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission?: string;
}

interface NavGroup {
  icon: typeof LayoutDashboard;
  label: string;
  basePath: string;
  permission?: string;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const navEntries: NavEntry[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
  { icon: Network, label: "Proxy Access", path: "/app/proxy-access", permission: "view_proxies" },
  { icon: Globe, label: "Proxy Management", path: "/app/proxies", permission: "view_proxies" },
  { icon: Layers, label: "Presets & Profiles", path: "/app/presets", permission: "view_proxies" },
  { icon: Zap, label: "Proxy Tester", path: "/app/tester", permission: "view_proxies" },
  { icon: Users, label: "Sub Users", path: "/app/sub-users", permission: "manage_users" },
  { icon: BarChart3, label: "Analytics", path: "/app/analytics", permission: "view_analytics" },
  { icon: Brain, label: "Network Analytics", path: "/app/network-analytics", permission: "view_analytics" },
  {
    icon: CreditCard,
    label: "Billing",
    basePath: "/app/billing",
    permission: "manage_billing",
    children: [
      { icon: CreditCard, label: "Overview", path: "/app/billing" },
      { icon: ShoppingCart, label: "Checkout", path: "/app/billing/checkout" },
      { icon: Wallet, label: "Payment Methods", path: "/app/billing/methods" },
      { icon: Receipt, label: "Invoice History", path: "/app/billing/history" },
      { icon: CreditCard, label: "Subscription", path: "/app/billing/subscription" },
    ],
  },
  { icon: FileText, label: "Contract", path: "/app/contract", permission: "manage_billing" },
  { icon: Key, label: "API Keys", path: "/app/api-keys", permission: "manage_api_keys" },
  {
    icon: Building2,
    label: "Organization",
    basePath: "/app/organization",
    children: [
      { icon: Building2, label: "Overview", path: "/app/organization" },
      { icon: Users, label: "Members", path: "/app/organization/members" },
      { icon: Shield, label: "Roles", path: "/app/organization/roles" },
      { icon: CreditCard, label: "Billing", path: "/app/organization/billing" },
    ],
  },
  { icon: Shield, label: "Security", path: "/app/security" },
  { icon: ShieldCheck, label: "Privacy & Trust", path: "/app/privacy" },
  { icon: Landmark, label: "Enterprise", path: "/app/enterprise", permission: "manage_billing" },
  { icon: ShoppingCart, label: "Marketplace", path: "/app/marketplace" },
  { icon: Handshake, label: "Partner Program", path: "/app/partner" },
  { icon: HeadphonesIcon, label: "Support", path: "/app/support" },
  { icon: Bell, label: "Notifications", path: "/app/notifications" },
  { icon: Database, label: "Data & Compliance", path: "/app/data" },
  { icon: ClipboardList, label: "Audit Logs", path: "/app/audit-logs", permission: "view_analytics" },
  { icon: Activity, label: "System Audit", path: "/app/audit", permission: "view_analytics" },
  { icon: Settings, label: "Settings", path: "/app/settings" },
];


export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { hasPermission } = useEnterprise();

  const isGroupActive = (basePath: string) => location.pathname.startsWith(basePath);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-foreground">Baalvion</span>
              <span className="text-xs text-muted-foreground">NetStack</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navEntries.map((entry) => {
          if (isGroup(entry)) {
            const locked = entry.permission ? !hasPermission(entry.permission) : false;

            if (locked) {
              return (
                <Tooltip key={entry.basePath}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-40 cursor-not-allowed text-sidebar-foreground">
                      <entry.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium flex-1">{entry.label}</span>}
                      {!collapsed && <Lock className="w-3.5 h-3.5" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Your role does not have access to {entry.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            const active = isGroupActive(entry.basePath);

            if (collapsed) {
              return (
                <Link
                  key={entry.basePath}
                  to={entry.basePath}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <entry.icon className="w-5 h-5 flex-shrink-0" />
                </Link>
              );
            }

            return (
              <Collapsible key={entry.basePath} defaultOpen={active}>
                <CollapsibleTrigger className={cn(
                  "flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                  active
                    ? "text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                  <div className="flex items-center gap-3">
                    <entry.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{entry.label}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                  {entry.children.map((child) => {
                    const isActive = location.pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <child.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          const isActive = location.pathname === entry.path;
          const locked = entry.permission ? !hasPermission(entry.permission) : false;

          if (locked) {
            return (
              <Tooltip key={entry.path}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-40 cursor-not-allowed text-sidebar-foreground">
                    <entry.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium flex-1">{entry.label}</span>}
                    {!collapsed && <Lock className="w-3.5 h-3.5" />}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Your role does not have access to {entry.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={entry.path}
              to={entry.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <entry.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{entry.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
}
