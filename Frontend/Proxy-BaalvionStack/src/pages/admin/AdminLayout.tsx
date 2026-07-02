import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import {
  Users, CreditCard, MessageSquare, LayoutDashboard, ChevronLeft, Shield,
  Server, Route, ShieldAlert, Activity, TrendingUp, Map, Heart, Rocket,
  Layers, DollarSign, BarChart3, Building2, Flag, Paintbrush, ShieldCheck,
  Globe, Brain, Store, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { isPlatformAdmin } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ScrollArea } from "@/components/ui/scroll-area";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: TrendingUp, label: "Control Room", path: "/admin/control-room" },
  { icon: Map, label: "Network Map", path: "/admin/network-map" },
  { icon: ShieldAlert, label: "Risk Center", path: "/admin/risk-center" },
  { icon: ShieldCheck, label: "Trust & Safety", path: "/admin/trust-safety" },
  { icon: Rocket, label: "Growth Engine", path: "/admin/growth" },
  { icon: Heart, label: "Customer Health", path: "/admin/customer-health" },
  { icon: Layers, label: "Middleware", path: "/admin/middleware" },
  { icon: DollarSign, label: "Pricing Simulator", path: "/admin/pricing-sim" },
  { icon: BarChart3, label: "Cohort Retention", path: "/admin/cohort" },
  { icon: Building2, label: "Tenants", path: "/admin/tenants" },
  { icon: Users, label: "User Management", path: "/admin/users" },
  { icon: CreditCard, label: "Plans & Billing", path: "/admin/plans" },
  { icon: CreditCard, label: "Payments", path: "/admin/payments" },
  { icon: DollarSign, label: "Revenue", path: "/admin/revenue" },
  { icon: DollarSign, label: "Financial Ops", path: "/admin/finance" },
  { icon: Store, label: "Marketplace", path: "/admin/marketplace" },
  { icon: ShieldAlert, label: "Chargebacks", path: "/admin/chargebacks" },
  { icon: Server, label: "Providers", path: "/admin/providers" },
  { icon: Map, label: "Orchestration", path: "/admin/orchestration" },
  { icon: Globe, label: "Edge Network", path: "/admin/edge-network" },
  { icon: Brain, label: "AI Intelligence", path: "/admin/intelligence" },
  { icon: Route, label: "Supplier Routing", path: "/admin/routing" },
  { icon: Activity, label: "System Health", path: "/admin/health" },
  { icon: ClipboardList, label: "Audit Logs", path: "/admin/audit-logs" },
  { icon: Flag, label: "Feature Flags", path: "/admin/feature-flags" },
  { icon: Paintbrush, label: "White Label", path: "/admin/whitelabel" },
  { icon: MessageSquare, label: "Support Tickets", path: "/admin/tickets" },
];

function AdminAccessDenied({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Admin access required</h1>
          <p className="text-muted-foreground">
            {email ? (
              <>You're signed in as <span className="text-foreground font-medium">{email}</span>, which doesn't have</>
            ) : (
              <>This account doesn't have</>
            )}{" "}
            platform-admin permissions. Sign in with a super-admin account to open the admin panel.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onSignOut}>Sign out</Button>
          <Link to="/app/dashboard">
            <Button variant="ghost">Back to app</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const { isInitialized, isAuthenticated, user, logout } = useAuth();

  // Silent session-restore still in flight — render nothing to avoid a flash of
  // the admin shell (or a premature redirect) before the session is known.
  if (!isInitialized) return null;

  // Not signed in → send to login, remembering the intended admin destination.
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Signed in but not a platform admin → hard stop (the API enforces this too).
  if (!isPlatformAdmin(user?.role)) {
    return <AdminAccessDenied email={user?.email} onSignOut={logout} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette />
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground">Admin Panel</span>
              <span className="text-xs text-muted-foreground">NetStack</span>
            </div>
          </Link>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-1">
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== "/admin" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-destructive text-destructive-foreground shadow-md" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <Link to="/app">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <div className="p-6">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
