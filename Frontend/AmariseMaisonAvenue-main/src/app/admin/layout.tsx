
'use client';

import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Sparkles, Info } from 'lucide-react';

/**
 * AdminLayout: Unified Dark Luxury Shell
 * Established for institutional monitoring across global hubs.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { globalSettings } = useAppStore();

  return (
    <div className="flex h-screen bg-[#0A0A0B] overflow-hidden font-body antialiased text-white">
      {/* Institutional Navigation */}
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Persistent Tactical Top Bar */}
        <AdminTopBar />
        
        <main className="flex-1 overflow-y-auto relative custom-scrollbar scroll-smooth bg-[#0A0A0B]">
          {/* Guide Mode Overlay */}
          {globalSettings.isGuideMode && (
            <div className="bg-blue-600 text-white px-8 py-3 flex items-center justify-between animate-fade-in shadow-lg relative z-40">
               <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-medium tracking-wide">
                    <span className="font-bold uppercase mr-2">Curatorial Protocol:</span> 
                    Guided flow active for institutional registry management.
                  </div>
               </div>
               <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest opacity-80 cursor-help">
                 <Info className="w-3.5 h-3.5" />
                 <span>Reference Manual</span>
               </div>
            </div>
          )}
          
          <div className="p-12 max-w-[1600px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
