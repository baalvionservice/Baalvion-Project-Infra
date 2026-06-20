import { useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  LayoutDashboard,
  Users,
  Globe,
  DollarSign,
  Shield,
  ChevronLeft,
  Menu,
  LogOut,
  Bell,
  Settings,
  Video,
  MessageSquare,
  FileText,
  Link,
  GraduationCap,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ProtocolLayoutProps {
  children: ReactNode;
  role: "admin" | "expert" | "student";
  breadcrumbs?: { label: string; href: string }[];
}

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, route: "/protocol/admin" },
  { label: "Experts", icon: Shield, route: "/protocol/admin/experts" },
  { label: "Countries", icon: Globe, route: "/protocol/admin/countries" },
  { label: "Revenue", icon: DollarSign, route: "/protocol/admin/revenue" },
  { label: "Users", icon: Users, route: "/protocol/admin/users" },
];

const expertNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, route: "/protocol/expert" },
  { label: "Students", icon: Users, route: "/protocol/expert/students" },
  { label: "Calls", icon: Video, route: "/protocol/expert/calls" },
  { label: "Feed", icon: MessageSquare, route: "/protocol/expert/feed" },
  { label: "Content", icon: FileText, route: "/protocol/expert/content" },
  { label: "Invite Links", icon: Link, route: "/protocol/expert/invites" },
];

const studentNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, route: "/protocol/student" },
  { label: "Calls", icon: Video, route: "/protocol/student/calls" },
  { label: "Feed", icon: MessageSquare, route: "/protocol/student/feed" },
  { label: "Store", icon: ShoppingBag, route: "/protocol/student/store" },
];

const roleConfig = {
  admin: {
    label: "Super Admin",
    icon: Shield,
    navItems: adminNavItems,
    gradient: "from-amber-500 to-orange-600"
  },
  expert: {
    label: "Expert (CAD)",
    icon: GraduationCap,
    navItems: expertNavItems,
    gradient: "from-emerald-500 to-teal-600"
  },
  student: {
    label: "Student",
    icon: Users,
    navItems: studentNavItems,
    gradient: "from-blue-500 to-indigo-600"
  }
};

const ProtocolLayout = ({ children, role, breadcrumbs: propBreadcrumbs }: ProtocolLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const config = roleConfig[role];
  const RoleIcon = config.icon;

  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "Protocol", route: "/protocol" }];
    
    if (pathParts.length >= 2) {
      breadcrumbs.push({ 
        label: config.label, 
        route: `/protocol/${role}` 
      });
    }
    
    if (pathParts.length >= 3) {
      const lastPart = pathParts[pathParts.length - 1];
      breadcrumbs.push({ 
        label: lastPart.charAt(0).toUpperCase() + lastPart.slice(1), 
        route: location.pathname 
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = propBreadcrumbs || getBreadcrumbs();
  const title = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : config.label;

  return (
    <div className="min-h-screen bg-background protocol-bg flex">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex-1 flex flex-col bg-card border-r border-border protocol-scrollbar">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate("/protocol")}
            >
              <div className="w-8 h-8 border border-primary/30 rotate-45 flex items-center justify-center group-hover:border-primary/60 transition-colors protocol-glow">
                <Eye className="w-4 h-4 text-primary -rotate-45" />
              </div>
              {sidebarOpen && (
                <span className="text-foreground/90 font-light tracking-wider text-sm">PROTOCOL</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex text-muted-foreground hover:text-foreground protocol-btn"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {/* Role Badge */}
          <div className={`p-4 border-b border-border ${!sidebarOpen && "flex justify-center"}`}>
            <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center"}`}>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                <RoleIcon className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <p className="text-foreground/90 text-sm font-medium">{config.label}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-muted-foreground text-xs">Active Session</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {config.navItems.map((item) => {
              const isActive = location.pathname === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => navigate(item.route)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 protocol-btn ${
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.15)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 sidebar-item"
                  } ${!sidebarOpen && "justify-center"}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-border space-y-1">
            <button
              onClick={() => navigate("/protocol/select-role")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all protocol-btn ${!sidebarOpen && "justify-center"}`}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">Switch Role</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden modal-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-muted-foreground protocol-btn"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-medium text-foreground/90">{title}</h1>
              <Breadcrumb className="hidden md:flex">
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <BreadcrumbItem key={crumb.route || index}>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="text-muted-foreground text-xs">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <>
                          <BreadcrumbLink 
                            onClick={() => navigate(crumb.route || crumb.href)}
                            className="text-muted-foreground/60 text-xs hover:text-muted-foreground cursor-pointer transition-colors"
                          >
                            {crumb.label}
                          </BreadcrumbLink>
                          <BreadcrumbSeparator className="text-muted-foreground/30" />
                        </>
                      )}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground relative protocol-btn">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground protocol-btn">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto protocol-scrollbar animate-page-enter">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProtocolLayout;
