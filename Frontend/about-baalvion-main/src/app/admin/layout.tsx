'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Layers,
  MessageSquare,
  LogOut,
  Globe,
  Settings,
  Newspaper,
  ClipboardList,
  BarChart3,
  Users,
  Megaphone,
  ShieldCheck,
  Cpu,
  Bell,
  Search
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { adminLogout } from "./login/actions";

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Updates Log', href: '/admin/updates', icon: ClipboardList },
  { name: 'Pages', href: '/admin/pages', icon: FileText },
  { name: 'Projects', href: '/admin/projects', icon: Briefcase },
  { name: 'Ecosystem', href: '/admin/ecosystem', icon: Layers },
  { name: 'Management', href: '/admin/management', icon: Users },
  { name: 'Engagement', href: '/admin/engagement', icon: Megaphone },
  { name: 'Governance', href: '/admin/governance', icon: ShieldCheck },
  { name: 'SEO & Sitemap', href: '/admin/seo', icon: Search },
  { name: 'News & Intel', href: '/admin/news', icon: Newspaper },
  { name: 'Technical', href: '/admin/technical', icon: Cpu },
  { name: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') return <>{children}</>;


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className="w-64 border-r border-gray-200 bg-white hidden lg:flex flex-col fixed inset-y-0 shadow-sm overflow-y-auto custom-scrollbar transition-all duration-300 z-50"
        aria-label="BOS Admin Sidebar"
      >
        <div className="p-6 sticky top-0 bg-white z-10 border-b border-gray-50">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Return to Public Baalvion Site">
            <div className="w-8 h-8 bg-[#FF9900] flex items-center justify-center rounded-sm group-hover:scale-105 transition-transform" aria-hidden="true">
              <Globe className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight text-[11px] uppercase tracking-widest leading-none">BAALVION</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 py-6">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold transition-all group",
                pathname === link.href 
                  ? "bg-[#FF9900] text-white shadow-md shadow-orange-100" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              <link.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", pathname === link.href ? "text-white" : "text-gray-400")} aria-hidden="true" />
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1 sticky bottom-0 bg-white">
          <button className="flex w-full items-center gap-3 px-4 py-2 rounded-md text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors" aria-label="System Settings Configuration">
            <Settings className="w-4 h-4 text-gray-400" aria-hidden="true" />
            System Settings
          </button>
          <form action={adminLogout}>
            <button type="submit" className="flex w-full items-center gap-3 px-4 py-2 rounded-md text-xs font-bold text-destructive hover:bg-destructive/5 transition-colors" aria-label="Securely Sign Out of BOS Portal">
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-0" id="admin-module-title">
              {adminLinks.find(l => l.href === pathname)?.name || 'BOS Enterprise Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="relative p-2 text-gray-400 hover:text-gray-900 transition-colors" aria-label="System Notifications">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[10px] font-bold">3 System Alerts Pending</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">Super Admin</p>
                <p className="text-[9px] text-[#FF9900] font-bold uppercase tracking-wider">Level 10 Authority</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF9900] font-bold shadow-sm" aria-hidden="true">B</div>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto w-full flex-1" aria-labelledby="admin-module-title">
          {children}
        </div>
      </main>
    </div>
  );
}
