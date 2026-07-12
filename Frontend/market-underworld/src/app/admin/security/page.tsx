"use client"

import React, { useState, useEffect } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { ShieldCheck, Lock, Eye, AlertOctagon, Terminal, Database, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOGS = Array.from({ length: 15 }).map((_, i) => ({
  id: `LOG-${8472 + i}`,
  time: new Date(Date.now() - i * 1000 * 60 * 5).toLocaleTimeString(),
  event: i % 3 === 0 ? "Node Authorization Successful" : i % 5 === 0 ? "High Volume Trade Flagged" : "IP Range Audited",
  origin: "South Asia Node #847",
  status: i % 5 === 0 ? "warning" : "success"
}));

export default function SecurityMonitoringPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Security & Audit Logs</h1>
          <p className="text-text-muted font-medium">Real-time protocol monitoring and access control.</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="live">ENCRYPTION: 256-BIT ACTIVE</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Security Score', val: '98/100', icon: ShieldCheck, color: 'text-brand-green' },
          { label: 'Active Tunnels', val: '1,240', icon: Activity, color: 'text-semantic-info' },
          { label: 'Blocked Threats', val: '42', icon: Lock, color: 'text-semantic-error' },
          { label: 'Audit Density', val: 'High', icon: Eye, color: 'text-white' },
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
              <Terminal className="w-4 h-4" /> Live Protocol Stream
            </h3>
            <Badge variant="info">LOGS: LIVE</Badge>
          </div>
          <div className="p-6 font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
            {LOGS.map((log) => (
              <div key={log.id} className="flex gap-4 p-2 rounded hover:bg-white/5 group transition-colors">
                <span className="text-text-ghost shrink-0">{log.time}</span>
                <span className={cn(
                  "font-bold shrink-0",
                  log.status === 'warning' ? "text-semantic-warning" : "text-brand-green"
                )}>[{log.status.toUpperCase()}]</span>
                <span className="text-text-secondary">{log.event}</span>
                <span className="text-text-ghost ml-auto opacity-0 group-hover:opacity-100 transition-opacity">Origin: {log.origin}</span>
              </div>
            ))}
          </div>
        </ListingCard>

        <div className="lg:col-span-4 space-y-8">
          <ListingCard className="p-8 border-semantic-error/20 bg-semantic-error/5 space-y-6">
            <div className="flex items-center gap-3 text-semantic-error">
              <AlertOctagon className="w-6 h-6" />
              <h4 className="font-bold uppercase tracking-widest text-sm">Threat Matrix</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-mono">
              Suspicious activity detected in Node #LAC-442. 12 failed auth attempts from isolated IP range. Audit in progress.
            </p>
            <AppButton variant="secondary" className="w-full border-semantic-error/20 text-semantic-error hover:bg-semantic-error hover:text-white uppercase text-[10px] font-mono tracking-widest h-10">
              Isolate Node
            </AppButton>
          </ListingCard>

          <ListingCard className="p-8 border-brand-border bg-brand-surface space-y-6">
            <div className="flex items-center gap-3 text-brand-green">
              <Database className="w-6 h-6" />
              <h4 className="font-bold uppercase tracking-widest text-sm text-white">Registry Health</h4>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Auth Gateway', status: 'Stable' },
                { label: 'Escrow Engine', status: 'Optimal' },
                { label: 'Identity Tunnel', status: 'Stable' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-xs text-text-secondary">{s.label}</span>
                  <Badge variant="success">{s.status}</Badge>
                </div>
              ))}
            </div>
          </ListingCard>
        </div>
      </div>
    </div>
  );
}
