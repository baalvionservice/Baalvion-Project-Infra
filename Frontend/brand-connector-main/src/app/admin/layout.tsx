'use client';

import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  Zap
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
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/use-realtime-data';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  const { data: notifications } = useNotifications(currentUser?.id);
  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar mockRole="ADMIN" />

      <div className="md:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-none shadow-2xl">
                  <DashboardSidebar mockRole="ADMIN" />
                </SheetContent>
              </Sheet>
            </div>

            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users, campaigns, logs..."
                className="pl-10 bg-slate-100/50 border-none rounded-xl h-10 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Admin Mode</span>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 rounded-2xl overflow-hidden shadow-2xl border-none">
                <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">System Alerts</h3>
                </div>
                <ScrollArea className="max-h-[400px]">
                  {notifications && notifications.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((n) => (
                        <div key={n.id} className="w-full p-4 flex gap-3 text-left">
                          <div className="h-8 w-8 rounded-lg bg-white border shadow-sm flex items-center justify-center shrink-0">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-2">{n.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-xs font-bold text-slate-400">No new alerts.</p>
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-2 pr-1 h-10 gap-2 hover:bg-slate-100 rounded-full transition-all">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-[10px] uppercase">
                    AD
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs font-bold leading-tight">{currentUser?.displayName || 'Admin'}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Root Admin</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                <DropdownMenuLabel>Administrative Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg py-2" onClick={() => router.push('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" /> System Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg py-2 text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
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
    </div>
  );
}