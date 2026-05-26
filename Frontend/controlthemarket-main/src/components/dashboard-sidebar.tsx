"use client";

import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Logo } from "./logo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Building,
  LogOut,
  ChevronDown,
  Trophy,
  AreaChart,
  FileCheck,
  MessageSquare,
  Settings,
  GitCompare,
  History,
  AlertTriangle,
  LayoutGrid,
  Lightbulb,
  FlaskConical,
  Bot,
  Terminal,
  Code,
  ScrollText,
  Shield,
  Video,
  Github,
  Webhook,
  Bell,
  Handshake,
  Plug,
  ArrowLeftRight,
  Monitor,
  Server,
  HeartPulse,
  CreditCard,
  Receipt,
  PieChart,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const candidateNav = [
  { name: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { name: "Role Tasks", href: "/candidate/tasks", icon: Briefcase },
  { name: "My Tasks", href: "/candidate/submissions", icon: FileText },
  { name: "Rankings", href: "/candidate/rankings", icon: Trophy },
  { name: "Live Session", href: "/candidate/live-session", icon: Monitor },
];

const companyNav = [
  { name: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/company/tasks", icon: Briefcase },
  { name: "Submissions", href: "/company/submissions", icon: FileCheck },
  { name: "Live Session", href: "/company/live-session", icon: Monitor },
  { name: "Recordings", href: "/company/recordings", icon: Video },
  { name: "Analytics", href: "/company/analytics", icon: AreaChart },
  { name: "Compare", href: "/company/compare", icon: GitCompare },
  { name: "Feedback", href: "/company/feedback", icon: MessageSquare },
  { name: "Subscription", href: "/company/subscription", icon: CreditCard },
  { name: "Invoices", href: "/company/invoices", icon: Receipt },
  { name: "Usage", href: "/company/usage", icon: PieChart },
  { name: "Settings", href: "/company/settings", icon: Settings },
];

const adminNav = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Intelligence Hub", href: "/admin/intelligence", icon: Lightbulb },
  { name: "Automation Hub", href: "/admin/automation", icon: Bot },
  { name: "Role Dashboards", href: "/admin/roles", icon: LayoutGrid },
  { name: "Manage Users", href: "/admin/users", icon: Users },
  { name: "Manage Tenants", href: "/admin/companies", icon: Building },
  { name: "Team Collaboration", href: "/admin/teams", icon: Handshake },
  { name: "Manage Tasks", href: "/admin/tasks", icon: Briefcase },
  { name: "Global Submissions", href: "/admin/submissions", icon: FileCheck },
  { name: "Execution Environment", href: "/admin/execution", icon: Terminal },
  {
    name: "Live Session Monitoring",
    href: "/admin/live-session",
    icon: Monitor,
  },
  { name: "Session Recordings", href: "/admin/recordings", icon: Video },
  { name: "System Health", href: "/admin/health", icon: HeartPulse },
  { name: "System Monitoring", href: "/admin/monitoring", icon: Monitor },
  { name: "Load Handling", href: "/admin/load-handling", icon: Server },
  { name: "Error Tracking", href: "/admin/errors", icon: AlertTriangle },
  { name: "Candidate Rankings", href: "/admin/rankings", icon: Trophy },
  { name: "Real-Time Monitoring", href: "/admin/activity", icon: History },
  { name: "System Logs", href: "/admin/logs", icon: ScrollText },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Backend Testing", href: "/admin/testing", icon: FlaskConical },
  { name: "GitHub Integration", href: "/admin/integrations", icon: Github },
  { name: "Webhooks", href: "/admin/webhooks", icon: Webhook },
  { name: "3rd-Party Integrations", href: "/admin/api-settings", icon: Plug },
  {
    name: "Integration Logs",
    href: "/admin/integration-logs",
    icon: ArrowLeftRight,
  },
  { name: "Platform Analytics", href: "/admin/analytics", icon: AreaChart },
  { name: "Revenue Analytics", href: "/admin/revenue", icon: Banknote },
  { name: "Notifications", href: "/admin/alerts", icon: Bell },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  let navItems: typeof candidateNav = [];
  if (user?.role === "candidate") navItems = candidateNav;
  if (user?.role === "company") navItems = companyNav;
  if (user?.role === "admin") navItems = adminNav;

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profile?.avatarUrl} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="font-semibold text-sidebar-foreground">
                      {user.name}
                    </p>
                    <p className="text-xs text-sidebar-foreground/70">
                      {user.role === "company" && user.companyName
                        ? user.companyName
                        : user.email}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${user.role}/profile`}>
                    <Users className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
