
"use client";

import React from "react";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import AdminTabs from "@/components/admin/AdminTabs";
import UserList from "@/components/admin/UserList";
import LawyerVerificationList from "@/components/admin/LawyerVerificationList";
import BookingList from "@/components/admin/BookingList";
import AuditLogPanel from "@/components/admin/AuditLogPanel";
import CaseList from "@/components/case/CaseList";
import RiskDashboard from "@/components/admin/RiskDashboard";
import SystemSettingsForm from "@/components/admin/SystemSettingsForm";
import FinancialReconciliation from "@/components/admin/FinancialReconciliation";
import ComplianceCenter from "@/components/admin/ComplianceCenter";
import AutomationBuilder from "@/components/admin/AutomationBuilder";
import AIAssistantPanel from "@/components/admin/AIAssistantPanel";
import ContentManager from "@/components/admin/ContentManager";
import CatalogManager from "@/components/admin/CatalogManager";
import BroadcastManager from "@/components/admin/BroadcastManager";
import SupportCenter from "@/components/admin/SupportCenter";
import KeywordManager from "@/components/admin/KeywordManager";
import { 
  ShieldCheck, 
  Loader2, 
  TrendingUp, 
  Users,
  Briefcase,
  IndianRupee,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['admin']}>
        <DashboardShell>
          <div className="flex flex-col lg:flex-row min-h-screen">
            <div className="flex-1">
              <AdminDashboardContent />
            </div>
            <aside className="w-full lg:w-80 border-l border-slate-200 bg-white/50 backdrop-blur-sm hidden xl:block">
              <AIAssistantPanel />
            </aside>
          </div>
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { 
    users, 
    cases, 
    bookings, 
    stats, 
    loading, 
    refresh 
  } = useAdminDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 opacity-20" />
      </div>
    );
  }

  const pendingLawyers = users.filter((u: any) => u.roleId === 'lawyer' && u.profileStatus === 'pending');

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              System Authority Command
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">
            Authority Command Center
          </h1>
          <p className="text-slate-500 text-sm italic mt-2">Orchestrating global network integrity and operational excellence.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Network Health</p>
            <div className="flex items-center gap-2">
              <Progress value={98} className="w-32 h-1.5 bg-slate-100" />
              <span className="text-xs font-bold text-emerald-600">98%</span>
            </div>
          </div>
          <Link href="/admin/analytics">
            <Button className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl px-6 h-12 font-bold shadow-lg group">
              <TrendingUp className="w-4 h-4 mr-2" /> Strategic Analytics
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
        <StatCard label="Population" value={stats.totalUsers} sub="Verified Members" icon={<Users className="w-4 h-4 text-blue-600" />} />
        <StatCard label="Velocity" value={`${stats.totalBookings}`} sub="Active Engagements" icon={<Zap className="w-4 h-4 text-amber-500" />} />
        <StatCard label="Dossiers" value={stats.totalCases} sub="Legal Briefs" icon={<Briefcase className="w-4 h-4 text-blue-600" />} />
        <StatCard label="Security" value="Stable" sub="Verified Protocol" icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />} />
        <StatCard label="Settlement" value={`₹${stats.revenue.toLocaleString()}`} sub="Escrow Secured" icon={<IndianRupee className="w-4 h-4 text-emerald-600" />} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AdminTabs>
          {(tab: string) => {
            if (tab === "users") return <UserList users={users} />;
            if (tab === "lawyers") return <LawyerVerificationList pendingLawyers={pendingLawyers} onAction={refresh} />;
            if (tab === "content") return <ContentManager />;
            if (tab === "links") return <KeywordManager />;
            if (tab === "catalog") return <CatalogManager />;
            if (tab === "broadcast") return <BroadcastManager />;
            if (tab === "support") return <SupportCenter />;
            if (tab === "bookings") return <BookingList bookings={bookings} />;
            if (tab === "cases") return <CaseList cases={cases} title="Network Matter Monitor" />;
            if (tab === "risk") return <RiskDashboard />;
            if (tab === "automation") return <AutomationBuilder />;
            if (tab === "finance") return <FinancialReconciliation />;
            if (tab === "compliance") return <ComplianceCenter />;
            if (tab === "audit") return <AuditLogPanel />;
            if (tab === "settings") return <SystemSettingsForm />;
            return null;
          }}
        </AdminTabs>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string, value: number | string, sub: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 executive-card group shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</h3>
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <p className="text-[10px] text-blue-600/70 font-medium uppercase tracking-tight">{sub}</p>
    </div>
  );
}
