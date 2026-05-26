'use client';

import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  Zap,
  Briefcase,
  Wallet,
  MessageSquare,
  Clock,
  AlertCircle,
  Target,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/store/useNotificationStore';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, signOut } = useAuth();
  const { notifications, fetchNotifications, unreadCount, markRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const [role, setRole] = useState<'BRAND' | 'CREATOR' | 'ADMIN'>('BRAND');

  useEffect(() => {
    if (currentUser) {
      setRole(currentUser.role as any);
    }
  }, [currentUser]);

  const toggleRole = () => {
    const nextRole = role === 'BRAND' ? 'CREATOR' : 'BRAND';
    setRole(nextRole);
    router.push(`/dashboard/${nextRole.toLowerCase()}`);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardSidebar mockRole={role as any} onToggleRole={toggleRole} />

      <div className="md:pl-64 flex flex-col flex-1 pb-20 md:pb-0">
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                    <Menu className="h-5 w-5 text-slate-600" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-none shadow-2xl">
                  <DashboardSidebar mockRole={role as any} onToggleRole={toggleRole} />
                </SheetContent>
              </Sheet>
            </div>

            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search campaigns, creators..."
                className="pl-10 bg-slate-100/50 border-none rounded-xl h-10 focus-visible:ring-primary"
              />
            </div>

            <div className="sm:hidden flex items-center gap-2">
              <div className="bg-primary p-1 rounded-lg">
                <Zap className="h-4 w-4 text-white fill-current" aria-hidden="true" />
              </div>
              <span className="font-headline font-bold text-slate-900">Baalvion</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount() > 0 && (
                      <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold animate-in zoom-in">
                        {unreadCount()}
                      </span>
                    )}
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 rounded-2xl overflow-hidden shadow-2xl border-none">
                <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Recent Notifications</h3>
                  <Link href="/dashboard/notifications" className="text-[10px] font-bold text-primary hover:underline">View All</Link>
                </div>
                <ScrollArea className="max-h-[400px]">
                  {(notifications || []).length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={cn(
                            "w-full p-4 flex gap-3 text-left hover:bg-slate-50 transition-colors",
                            !n.read && "bg-primary/5"
                          )}
                        >
                          <div className="h-8 w-8 rounded-lg bg-white border shadow-sm flex items-center justify-center shrink-0">
                            {getNotificationIcon(n.type)}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-2">{n.message}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <Bell className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-400">All caught up!</p>
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-2 pr-1 h-10 gap-2 hover:bg-slate-100 rounded-full transition-all">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase border border-primary/20">
                    {role.charAt(0)}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs font-bold leading-tight">
                      {currentUser?.displayName || 'User'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {role} Access
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-2xl border-none">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg py-2" onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg py-2 text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Exit Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          <ErrorBoundary>
            <div className="w-full h-full">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}