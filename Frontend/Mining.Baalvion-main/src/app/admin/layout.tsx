
"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Search, Bell, ShieldCheck, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import Link from "next/link";
import { authApi } from "@/lib/api-client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Real session check: triggers a cookie refresh and loads the profile. No localStorage role.
      const result = await authApi.me();
      if (cancelled) return;
      const ADMIN_ROLES = ['admin', 'super_admin', 'compliance', 'finance', 'support', 'logistics'];
      if (!result.ok || !result.data) {
        router.replace('/login');
        return;
      }
      const userRole = String(result.data.role || '').toLowerCase();
      if (!ADMIN_ROLES.includes(userRole)) {
        router.replace('/'); // authenticated but not an admin
        return;
      }
      setRole(userRole.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
      setIsReady(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (!isReady) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar className="hidden lg:flex" />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-slate-950 border-slate-800">
                <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                <SheetDescription className="sr-only">Platform governance and system configuration</SheetDescription>
                <AdminSidebar className="flex h-full w-full" isMobile />
              </SheetContent>
            </Sheet>
            
            <div className="relative w-full max-lg hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input 
                type="text" 
                placeholder="Search global records (UID, TXN, License)..." 
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                aria-label="Search platform records"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              System Secure
            </div>
            <Button variant="ghost" size="icon" className="relative text-slate-500" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" aria-hidden="true" />
            </Button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <Link href="/admin/profile" className="text-right hidden sm:block hover:opacity-80 transition-opacity">
              <p className="text-sm font-bold leading-none text-slate-900">{role || "Admin"}</p>
              <p className="text-[10px] text-slate-500 font-medium">Platform HQ</p>
            </Link>
          </div>
        </header>
        <main className="p-4 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
