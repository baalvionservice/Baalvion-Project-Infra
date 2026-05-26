
"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import AvailabilityForm from "@/components/calendar/AvailabilityForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import { 
  CalendarClock, 
  ShieldCheck, 
  Settings2
} from "lucide-react";

/**
 * @fileOverview AvailabilityPage
 * Updated to use Persistent Layout Architecture.
 */
export default function AvailabilityPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['lawyer']}>
        <DashboardShell>
          <div className="container mx-auto px-8 pt-8 pb-12 max-w-4xl animate-in fade-in duration-700">
            <header className="flex flex-col gap-6 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
                    <CalendarClock className="w-3 h-3" />
                    Executive Scheduling
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 leading-tight">Chambers Availability</h1>
                <p className="text-slate-500 text-sm font-medium italic mt-2">Manage your professional engagement slots within the network.</p>
              </div>
            </header>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Protocol Setup</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Define your consultation parameters</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                    <ShieldCheck className="w-3 h-3" /> Verified Secure
                  </span>
                </div>
              </div>

              <AvailabilityForm />
            </div>
          </div>
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}
