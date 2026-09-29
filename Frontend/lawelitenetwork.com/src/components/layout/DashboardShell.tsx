"use client";

import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { usePathname, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Search, User as UserIcon, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuthContext } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * @fileOverview DashboardShell
 * Master layout for authenticated modules providing unified navigation and topbar commands.
 * Refined for Persistent Navigation Layout Architecture and High Visibility.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthContext();

  const pathSegments = pathname.split("/").filter(Boolean);
  const displayUser = user;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F8FAFC]">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-slate-500 hover:text-[#0B1F3A] transition-colors" />
            <Separator orientation="vertical" className="mx-2 h-4 bg-slate-200" />
            
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">
                      Network
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments.map((segment, index) => {
                  const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
                  const isLast = index === pathSegments.length - 1;
                  
                  return (
                    <React.Fragment key={url}>
                      <BreadcrumbSeparator className="hidden md:block text-slate-300" />
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                            {segment.replace("-", " ")}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={url} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#0B1F3A]">
                              {segment.replace("-", " ")}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600"
                onClick={() => router.push('/dashboard')}
              >
                <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Overview
              </Button>
            </div>

            <Separator orientation="vertical" className="hidden md:block h-4 bg-slate-200 mx-1" />

            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
                  <Avatar className="h-8 w-8 border border-slate-200">
                    <AvatarImage src={(displayUser as any)?.avatar || (displayUser as any)?.profileImage} />
                    <AvatarFallback className="bg-[#0B1F3A] text-white text-[10px] font-bold">
                      {displayUser?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 bg-white border border-slate-200 shadow-xl">
                <div className="p-3 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{displayUser?.name || 'Authorized Member'}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{displayUser?.email}</p>
                </div>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg m-1">
                  <Link href="/profile" className="flex items-center w-full px-2 py-2 text-[10px] font-bold uppercase tracking-wider">
                    <UserIcon className="mr-3 h-3.5 w-3.5 text-blue-600" /> Profile Dossier
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg m-1 text-red-600">
                  <div className="flex items-center w-full px-2 py-2 text-[10px] font-bold uppercase tracking-wider">
                    <LogOut className="mr-3 h-3.5 w-3.5" /> Logout Session
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto page-transition">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
