"use client";

import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

/**
 * AdminShell — the client-side chrome for the admin console: persistent sidebar
 * (RBAC-aware nav), top command bar (jurisdiction switcher), and the routed page.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0B] text-white">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main className="custom-scrollbar flex-1 overflow-y-auto bg-[#0A0A0B] p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
