import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut } from "@/components/ui/command";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import {
  LayoutDashboard, Globe, BarChart3, CreditCard, Key, Users, Settings, Shield, Server, Route,
  ShieldAlert, Activity, TrendingUp, Heart, Map, FileText, Building2, Flag, Paintbrush, Puzzle, Layers,
  Plus, Download, UserPlus, Sun, Moon, Zap, Monitor, Search
} from "lucide-react";

interface CommandEntry {
  icon: typeof Globe;
  label: string;
  group: string;
  path?: string;
  action?: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const commands: CommandEntry[] = [
    // Navigation
    { icon: LayoutDashboard, label: "Go to Dashboard", path: "/app", group: "Navigation" },
    { icon: Globe, label: "Go to Proxy Management", path: "/app/proxies", group: "Navigation" },
    { icon: BarChart3, label: "Go to Analytics", path: "/app/analytics", group: "Navigation" },
    { icon: CreditCard, label: "Go to Billing", path: "/app/billing", group: "Navigation" },
    { icon: Key, label: "Go to API Keys", path: "/app/api-keys", group: "Navigation" },
    { icon: Shield, label: "Go to Security Center", path: "/app/security", group: "Navigation" },
    { icon: Users, label: "Go to Sub Users", path: "/app/sub-users", group: "Navigation" },
    { icon: Settings, label: "Go to Settings", path: "/app/settings", group: "Navigation" },
    { icon: FileText, label: "Go to Audit Logs", path: "/app/audit-logs", group: "Navigation" },
    { icon: FileText, label: "Go to Contract", path: "/app/contract", group: "Navigation" },
    // Quick Actions
    { icon: Plus, label: "Create Proxy", group: "Quick Actions", action: () => { navigate("/app/proxies"); toast.success("Navigate to Proxies to create a new proxy"); } },
    { icon: Key, label: "Generate API Key", group: "Quick Actions", action: () => { navigate("/app/api-keys"); toast.success("Navigate to API Keys to generate a new key"); } },
    { icon: UserPlus, label: "Invite Team Member", group: "Quick Actions", action: () => { navigate("/app/organization/members"); toast.success("Navigate to Members to invite a team member"); } },
    { icon: Download, label: "Export Proxy List", group: "Quick Actions", action: () => { toast.success("Proxy list exported successfully"); } },
    { icon: Zap, label: "Run Proxy Test", group: "Quick Actions", action: () => { navigate("/app/tester"); } },
    { icon: Search, label: "Open Support", group: "Quick Actions", action: () => { navigate("/app/support"); } },
    { icon: Building2, label: "Open Organization", group: "Quick Actions", action: () => { navigate("/app/organization"); } },
    { icon: theme === "dark" ? Sun : Moon, label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`, group: "Quick Actions", action: () => { setTheme(theme === "dark" ? "light" : "dark"); }, shortcut: "T" },
    // Admin
    { icon: Shield, label: "Admin Dashboard", path: "/admin", group: "Admin" },
    { icon: TrendingUp, label: "Control Room", path: "/admin/control-room", group: "Admin" },
    { icon: Map, label: "Network Map", path: "/admin/network-map", group: "Admin" },
    { icon: Server, label: "Providers", path: "/admin/providers", group: "Admin" },
    { icon: ShieldAlert, label: "Abuse Monitoring", path: "/admin/abuse", group: "Admin" },
    { icon: Activity, label: "System Health", path: "/admin/health", group: "Admin" },
    { icon: Flag, label: "Feature Flags", path: "/admin/feature-flags", group: "Admin" },
    { icon: Heart, label: "Customer Health", path: "/admin/customer-health", group: "Admin" },
    { icon: Layers, label: "Middleware", path: "/admin/middleware", group: "Admin" },
    { icon: Building2, label: "Tenants", path: "/admin/tenants", group: "Admin" },
    { icon: Route, label: "Supplier Routing", path: "/admin/routing", group: "Admin" },
    { icon: Paintbrush, label: "White Label", path: "/admin/whitelabel", group: "Admin" },
    // Public
    { icon: Puzzle, label: "Integrations", path: "/integrations", group: "Public" },
    { icon: Globe, label: "Proxy Comparison", path: "/proxy-comparison", group: "Public" },
    { icon: Monitor, label: "Status Page", path: "/status", group: "Public" },
    { icon: Zap, label: "Infrastructure", path: "/infrastructure", group: "Public" },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((cmd: CommandEntry) => {
    setOpen(false);
    if (cmd.action) {
      cmd.action();
    } else if (cmd.path) {
      navigate(cmd.path);
    }
  }, [navigate]);

  const groups = Array.from(new Set(commands.map(c => c.group)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search... (navigation, actions, admin)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group} heading={group}>
            {commands.filter(c => c.group === group).map((cmd) => (
              <CommandItem
                key={(cmd.path || "") + cmd.label}
                onSelect={() => runCommand(cmd)}
                className="cursor-pointer"
              >
                <cmd.icon className="mr-2 h-4 w-4" />
                <span>{cmd.label}</span>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
