
"use client"

import React, { useState, useEffect } from 'react';
import { ListingCard } from '@/components/ui/ListingCard';
import { GlobalActivityIntelligence } from '@/components/admin/GlobalActivityIntelligence';
import { GlobalRegionIntelligence } from '@/components/admin/GlobalRegionIntelligence';
import { Activity, Globe, Database, Terminal, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlatformStats, getAuditLogs, type PlatformStats, type AuditLogEntry } from '@/lib/api/admin-users';

const TABS = [
  { id: 'intelligence', label: 'Global Intel', icon: Activity },
  { id: 'regions', label: 'Regional Load', icon: Globe },
  { id: 'audit', label: 'Audit Tunnel', icon: Database },
];

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    getPlatformStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    if (activeTab !== 'audit') return;
    setAuditLoading(true);
    getAuditLogs({ limit: 25 })
      .then((res) => setAuditLogs(res.items))
      .catch(() => setAuditLogs([]))
      .finally(() => setAuditLoading(false));
  }, [activeTab]);

  return (
    <div className="p-10 pb-32 max-w-[1600px] mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-brand-green font-bold text-xs uppercase tracking-[0.3em]">
            <ShieldCheck className="w-4 h-4" /> MASTER OVERSIGHT PANEL
          </div>
          <h1 className="text-5xl font-bold tracking-tight uppercase font-display italic leading-none text-white">
            Command <span className="text-brand-green">Terminal.</span>
          </h1>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">
            Global Node Administration • {stats ? `${Number(stats.userCount.count).toLocaleString()} Agents` : '…'} • Level 5 Clearance
          </p>
        </div>
        
        <div className="flex gap-2 p-1 bg-brand-surface border border-brand-border rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-[0.1em] transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-brand-green text-brand-void shadow-lg shadow-brand-green/20" 
                  : "text-text-muted hover:text-white hover:bg-brand-elevated"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'intelligence' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ListingCard className="p-10 border-brand-green/20 bg-brand-green/5 space-y-6">
            <div className="text-[10px] font-bold text-brand-green uppercase tracking-[0.3em]">Total Users</div>
            <div className="text-5xl font-bold text-white font-mono leading-none">{Number(stats.userCount.count).toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-green">
              <Activity className="w-4 h-4" /> ACROSS {Number(stats.orgCount.count).toLocaleString()} ORGS
            </div>
          </ListingCard>
          <ListingCard className="p-10 border-white/5 bg-white/[0.02] space-y-6">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Active Sessions</div>
            <div className="text-5xl font-bold text-white font-mono leading-none">{Number(stats.sessionCount.count).toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
              <Activity className="w-4 h-4" /> LIVE RIGHT NOW
            </div>
          </ListingCard>
          <ListingCard className="p-10 border-white/5 bg-white/[0.02] space-y-6">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Logins (24h)</div>
            <div className="text-5xl font-bold text-white font-mono leading-none">{Number(stats.recentLogins.count).toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
              <ShieldCheck className="w-4 h-4" /> {Number(stats.failedLogins.count).toLocaleString()} FAILED
            </div>
          </ListingCard>
        </div>
      )}

      <main>
        {activeTab === 'intelligence' && <GlobalActivityIntelligence />}
        {activeTab === 'regions' && <GlobalRegionIntelligence />}
        
        {activeTab === 'audit' && (
          <div className="space-y-12">
            <ListingCard className="p-10 border-brand-border bg-brand-surface">
              <div className="flex items-center justify-between mb-12">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-brand-green" /> Global Platform Audit Log
                  </h3>
                  <p className="text-[9px] text-text-muted font-mono uppercase">Real activity from auth.audit_logs</p>
                </div>
              </div>
              {auditLoading ? (
                <div className="flex items-center justify-center gap-3 text-text-muted py-16">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading…
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-text-muted text-sm py-16 text-center">No audit activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-5 bg-brand-void rounded border border-brand-border flex justify-between items-center group hover:border-brand-green transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-2 h-2 rounded-full bg-brand-green" />
                        <div>
                          <div className="text-xs font-bold text-white uppercase font-mono tracking-tight">{log.action}</div>
                          <div className="text-[9px] text-text-muted uppercase font-mono mt-1">
                            {log.user_email || log.user_id || 'system'} {log.ip_address ? `• IP: ${log.ip_address}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] font-mono text-text-ghost">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ListingCard>
          </div>
        )}
      </main>
    </div>
  );
}
