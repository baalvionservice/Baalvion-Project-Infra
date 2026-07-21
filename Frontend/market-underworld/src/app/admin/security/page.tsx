"use client"

import React, { useEffect, useState } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { ShieldCheck, Lock, AlertOctagon, Terminal, Activity, Loader2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getPlatformStats,
  getAuditLogs,
  listRiskEvents,
  listSessions,
  revokeSession,
  type PlatformStats,
  type AuditLogEntry,
  type RiskEvent,
  type AdminSession,
} from '@/lib/api/admin-users';

const SEVERITY_VARIANT: Record<RiskEvent['severity'], 'default' | 'warning' | 'success'> = {
  low: 'default',
  medium: 'warning',
  high: 'warning',
  critical: 'warning',
};

export default function SecurityMonitoringPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      getPlatformStats().catch(() => null),
      getAuditLogs({ limit: 20 }).catch(() => ({ items: [] as AuditLogEntry[], total: 0, page: 1, limit: 20, hasMore: false })),
      listRiskEvents({ limit: 10 }).catch(() => ({ items: [] as RiskEvent[], total: 0, page: 1, limit: 10, hasMore: false })),
      listSessions({ limit: 10 }).catch(() => ({ items: [] as AdminSession[], total: 0, page: 1, limit: 10, hasMore: false })),
    ]).then(([s, logResult, riskResult, sessionResult]) => {
      setStats(s);
      setLogs(logResult.items);
      setRiskEvents(riskResult.items);
      setSessions(sessionResult.items);
      setSessionTotal(sessionResult.total);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (session: AdminSession) => {
    setRevokingId(session.id);
    try {
      await revokeSession(session.id);
      toast({ title: 'Session revoked', description: `${session.email}'s session has been terminated.` });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't revoke session", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center gap-3 text-text-muted min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading security data…
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Security & Audit Logs</h1>
          <p className="text-text-muted font-medium">Real-time protocol monitoring and access control.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Successful Logins (24h)', val: stats ? Number(stats.recentLogins.count).toLocaleString() : '—', icon: ShieldCheck, color: 'text-brand-green' },
          { label: 'Active Sessions', val: sessionTotal.toLocaleString(), icon: Activity, color: 'text-semantic-info' },
          { label: 'Failed Logins (24h)', val: stats ? Number(stats.failedLogins.count).toLocaleString() : '—', icon: Lock, color: 'text-semantic-error' },
          { label: 'Open Risk Events', val: riskEvents.filter((r) => !r.resolvedAt).length.toLocaleString(), icon: AlertOctagon, color: 'text-semantic-warning' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ListingCard className="lg:col-span-8 p-0 overflow-hidden border-brand-border bg-brand-surface">
          <div className="p-6 border-b border-brand-border bg-brand-void/50 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Recent Audit Activity
            </h3>
            <Badge variant="info">{logs.length} EVENTS</Badge>
          </div>
          <div className="p-6 font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
            {logs.length === 0 ? (
              <p className="text-text-muted p-4">No audit activity yet.</p>
            ) : logs.map((log) => (
              <div key={log.id} className="flex gap-4 p-2 rounded hover:bg-white/5 group transition-colors">
                <span className="text-text-ghost shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                <span className="font-bold shrink-0 text-brand-green">[{log.action.toUpperCase()}]</span>
                <span className="text-text-secondary truncate">{log.user_email || log.user_id || 'system'}</span>
                <span className="text-text-ghost ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0">{log.ip_address || ''}</span>
              </div>
            ))}
          </div>
        </ListingCard>

        <div className="lg:col-span-4 space-y-8">
          <ListingCard className="p-8 border-semantic-error/20 bg-semantic-error/5 space-y-4">
            <div className="flex items-center gap-3 text-semantic-error">
              <AlertOctagon className="w-6 h-6" />
              <h4 className="font-bold uppercase tracking-widest text-sm">Risk Events</h4>
            </div>
            {riskEvents.length === 0 ? (
              <p className="text-xs text-text-secondary">No risk events detected.</p>
            ) : (
              <div className="space-y-3">
                {riskEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="text-text-secondary truncate">{event.userEmail}</p>
                      <p className="text-text-ghost font-mono">{event.type.replace(/_/g, ' ')}</p>
                    </div>
                    <Badge variant={SEVERITY_VARIANT[event.severity]} className="shrink-0">{event.severity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </ListingCard>

          <ListingCard className="p-8 border-brand-border bg-brand-surface space-y-4">
            <div className="flex items-center gap-3 text-brand-green">
              <Activity className="w-6 h-6" />
              <h4 className="font-bold uppercase tracking-widest text-sm text-white">Active Sessions</h4>
            </div>
            {sessions.length === 0 ? (
              <p className="text-xs text-text-secondary">No active sessions.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary truncate">{s.email}</p>
                      <p className="text-[10px] text-text-ghost font-mono">{s.ip_address || 'unknown IP'}</p>
                    </div>
                    <button
                      onClick={() => handleRevoke(s)}
                      disabled={revokingId === s.id}
                      title="Revoke session"
                      className="p-1.5 text-text-ghost hover:text-semantic-error transition-colors disabled:opacity-40 shrink-0"
                    >
                      {revokingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ListingCard>
        </div>
      </div>
    </div>
  );
}
