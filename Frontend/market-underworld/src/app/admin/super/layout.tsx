"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Globe, 
  Database, 
  ShieldCheck, 
  Settings, 
  Activity, 
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/components/auth/RoleGuard';

const SIDEBAR_ITEMS = [
  { group: 'OVERVIEW', items: [
    { name: 'Dashboard', path: '/admin/super', icon: LayoutDashboard },
    { name: 'System Map', path: '/admin/super/map', icon: Globe },
    { name: 'Financials', path: '/admin/super/financial', icon: Activity },
  ]},
  { group: 'NODES', items: [
    { name: 'Users', path: '/admin/super/users', icon: Users },
    { name: 'Teachers', path: '/admin/super/teachers', icon: ShieldCheck },
    { name: 'Sellers', path: '/admin/super/sellers', icon: Database },
  ]},
  { group: 'ADMIN', items: [
    { name: 'Settings', path: '/admin/super/settings', icon: Settings },
  ]}
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RoleGuard allow={['super_admin']}>
    <div className="min-h-screen bg-[#0B0C0F] flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#252A33] fixed h-full bg-[#0B0C0F] z-50">
        <div className="p-8 border-b border-[#252A33]">
          <Link href="/admin/super" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#39FF14] flex items-center justify-center text-black font-bold">MU</div>
            <div>
              <div className="font-bold text-lg">Control</div>
              <div className="text-[10px] text-[#39FF14] font-bold uppercase tracking-widest">Super Admin</div>
            </div>
          </Link>
        </div>

        <nav className="p-6 space-y-10 overflow-y-auto no-scrollbar h-[calc(100vh-100px)]">
          {SIDEBAR_ITEMS.map((group) => (
            <div key={group.group} className="space-y-4">
              <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.2em] px-4">{group.group}</h4>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md transition-all group",
                      pathname === item.path ? "bg-[#39FF14]/10 text-[#39FF14]" : "text-[#6B7280] hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <ChevronRight className={cn("w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity", pathname === item.path && "opacity-100")} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
          
          <button className="flex items-center gap-3 p-3 rounded-md text-[#EF4444] hover:bg-[#EF4444]/10 w-full transition-all">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Terminate Session</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 ml-72">
        <div className="h-14 border-b border-[#252A33] bg-[#0B0C0F]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
            <span className="text-[10px] font-bold text-[#C8CDD8] uppercase tracking-widest">Global Payouts Operational</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono text-xs text-[#6B7280]">Key: MU-ADMIN-8472</span>
            <div className="w-8 h-8 rounded-sm bg-[#181B21] border border-[#252A33]" />
          </div>
        </div>
        {children}
      </main>
    </div>
    </RoleGuard>
  );
}