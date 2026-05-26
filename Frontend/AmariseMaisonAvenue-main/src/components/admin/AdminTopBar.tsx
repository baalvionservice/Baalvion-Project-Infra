'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Globe, 
  Bell, 
  Search, 
  ChevronDown,
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { COUNTRIES } from '@/lib/mock-data';
import { useParams } from 'next/navigation';

/**
 * AdminTopBar: Global Command Matrix.
 * Controls the jurisdictional context of the entire admin platform.
 */
export function AdminTopBar() {
  const { currentUser, scopedNotifications, adminJurisdiction, setAdminJurisdiction, globalSettings } = useAppStore();
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  
  const currentJurisdiction = adminJurisdiction === 'global' ? 'Global Matrix' : COUNTRIES[adminJurisdiction]?.name + ' Hub';
  const isSuper = currentUser?.role === 'super_admin';

  return (
    <header className="h-20 bg-[#0A0A0B]/95 border-b border-white/5 grid grid-cols-[1.2fr_1fr_1.2fr] items-center px-10 sticky top-0 z-40 shrink-0 backdrop-blur-xl">
      
      {/* 1. DISCOVERY GROUP (Left Track) */}
      <div className="flex items-center space-x-6 overflow-hidden min-w-0">
        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-none transition-colors border border-white/5 shrink-0">
          <LayoutDashboard className="w-5 h-5 text-blue-500" />
        </Link>
        <div className="relative w-full max-w-[240px] group min-w-0 flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search Registry..." 
            className="w-full bg-white/5 h-10 pl-12 pr-4 rounded-none text-[10px] font-bold uppercase tracking-widest border-none focus:bg-white/10 transition-all outline-none text-white placeholder:text-white/10 truncate"
          />
        </div>
      </div>

      {/* 2. JURISDICTION SWITCHER (Center Track - Enterprise Anchor) */}
      <div className="flex flex-col items-center justify-center px-4 border-x border-white/5 h-full overflow-hidden min-w-0">
         {isSuper ? (
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <button className="flex flex-col items-center hover:bg-white/5 px-6 py-2 transition-all group border-none bg-transparent outline-none cursor-pointer rounded-none">
                  <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20 group-hover:text-blue-400 transition-colors">Switch Jurisdiction</span>
                  <div className="flex items-center space-x-2 mt-1">
                     <span className="text-xs font-headline font-bold italic text-white uppercase tracking-widest">{currentJurisdiction}</span>
                     <ChevronDown className="w-3 h-3 text-white/20 group-hover:text-white" />
                  </div>
               </button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="center" className="w-64 p-2 bg-[#111113] border-white/10 rounded-none shadow-2xl">
                <DropdownMenuLabel className="text-[8px] uppercase tracking-[0.3em] text-white/20 px-4 py-3">Jurisdictional Nodes</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setAdminJurisdiction('global')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 rounded-none outline-none">
                  <div className="flex items-center space-x-4">
                    <LayoutDashboard className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Global Matrix</span>
                  </div>
                  {adminJurisdiction === 'global' && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                {Object.values(COUNTRIES).map((c) => (
                  <DropdownMenuItem 
                    key={c.code} 
                    onClick={() => setAdminJurisdiction(c.code as any)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 rounded-none outline-none"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-lg grayscale brightness-200 group-hover:grayscale-0">{c.flag}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">{c.name} Hub</span>
                    </div>
                    {adminJurisdiction === c.code && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                  </DropdownMenuItem>
                ))}
             </DropdownMenuContent>
           </DropdownMenu>
         ) : (
           <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20">Jurisdiction Locked</span>
              <div className="flex items-center space-x-2 mt-1">
                 <Lock className="w-3 h-3 text-gold" />
                 <span className="text-xs font-headline font-bold italic text-white uppercase tracking-widest">{currentJurisdiction} Hub</span>
              </div>
           </div>
         )}
      </div>

      {/* 3. ACTIONS & IDENTITY GROUP (Right Track) */}
      <div className="flex items-center justify-end space-x-6 overflow-hidden min-w-0">
        <div className="flex items-center space-x-4 shrink-0">
          <button className="relative p-2 text-white/20 hover:text-white transition-all group bg-transparent border-none outline-none cursor-pointer">
            <Bell size={18} className="group-hover:rotate-12 transition-transform" />
            {scopedNotifications.some(n => !n.read) && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
          </button>
          
          <div className="flex items-center space-x-4 pl-4 border-l border-white/5 shrink-0">
             <div className="flex flex-col items-end hidden 2xl:flex min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white truncate max-w-[100px]">{currentUser?.name}</span>
                <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-white/20 truncate">{(currentUser?.role || '').replace('_', ' ').toUpperCase()}</span>
             </div>
             <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-none flex items-center justify-center font-bold text-xs hover:border-blue-500 transition-colors cursor-pointer">
               {currentUser?.name.charAt(0) || 'A'}
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
