import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
  app: "Dashboard",
  admin: "Admin",
  proxies: "Proxy Management",
  presets: "Presets & Profiles",
  "sub-users": "Sub Users",
  analytics: "Analytics",
  billing: "Billing",
  "api-keys": "API Keys",
  settings: "Settings",
  "audit-logs": "Audit Logs",
  compliance: "Compliance",
  security: "Security Center",
  contract: "Contract",
  "control-room": "Control Room",
  "network-map": "Network Map",
  "risk-center": "Risk Center",
  growth: "Growth Engine",
  "customer-health": "Customer Health",
  middleware: "Middleware",
  "pricing-sim": "Pricing Simulator",
  cohort: "Cohort Retention",
  users: "User Management",
  plans: "Plans & Billing",
  providers: "Providers",
  routing: "Supplier Routing",
  health: "System Health",
  tickets: "Support Tickets",
  tenants: "Tenant Management",
  "feature-flags": "Feature Flags",
  whitelabel: "White Label",
  abuse: "Abuse Monitoring",
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link to="/" className="hover:text-foreground transition-colors"><Home className="w-3.5 h-3.5" /></Link>
      {crumbs.map(c => (
        <div key={c.path} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          {c.isLast ? (
            <span className="text-foreground font-medium">{c.label}</span>
          ) : (
            <Link to={c.path} className="hover:text-foreground transition-colors">{c.label}</Link>
          )}
        </div>
      ))}
    </nav>
  );
}
