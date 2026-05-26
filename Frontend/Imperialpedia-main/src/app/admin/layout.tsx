"use client";

import React, { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Bell, Search, Zap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Super Admin Workspace Layout.
 * Features a locked viewport with independent scroll areas for the sidebar and main hub.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex  min-h-screen w-full bg-background overflow-hidden">
      {/* 1. STICKY GOVERNANCE SIDEBAR */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col  min-w-0 h-full overflow-hidden">
        {/* 2. COMMAND HEADER */}
        <header className="h-16 border-b border-white/5 bg-card/20 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl border border-white/5 bg-card/30"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                placeholder="Search index, users, or nodes..."
                className="w-full h-10 pl-10 bg-background/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mr-2">
              <Zap size={14} className="animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                AI Hub Online
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl border border-white/5 bg-card/30"
            >
              <Bell size={18} />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center border-2 border-background">
                3
              </Badge>
            </Button>

            <div className="h-8 w-px bg-white/5 mx-2" />

            <Button
              variant="ghost"
              className="rounded-xl border border-white/5 bg-card/30 gap-3 px-3"
            >
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                EV
              </div>
              <span className="text-xs font-bold hidden sm:inline">Vance</span>
            </Button>
          </div>
        </header>

        {/* 3. DYNAMIC CONTENT HUD */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar bg-background/50">
          <div className="max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
