"use client"

import React, { useState, useEffect } from 'react';
import { LIVE_ACTIVITY_MOCK } from '@/data/mockData';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Search, Activity, Users, Globe, Play, XCircle, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SessionMonitoringPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Live Session Monitoring</h1>
          <p className="text-text-muted font-medium">Real-time oversight of all global operational broadcasts.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-semantic-error/10 px-4 py-2 rounded border border-semantic-error/20">
            <Activity className="w-4 h-4 text-semantic-error animate-pulse" />
            <span className="text-xs font-mono font-bold text-semantic-error uppercase">Active Streams: 100</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {LIVE_ACTIVITY_MOCK.activeSessions.map((session) => (
          <ListingCard key={session.id} className="p-0 border-brand-border bg-brand-surface overflow-hidden group hover:border-brand-green transition-all">
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <Badge variant="live">LIVE</Badge>
                <Badge variant="info" className="font-mono text-[8px]">{session.regionId.toUpperCase()}</Badge>
              </div>
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{session.viewers}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-brand-green" />
                  <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">{session.duration}</span>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-brand-green transition-colors leading-tight italic">
                  {session.title}
                </h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-2">Operator: {session.teacherName}</p>
              </div>
              
              <div className="p-4 bg-brand-void rounded border border-brand-border flex items-center justify-between">
                <div className="text-[9px] font-bold text-text-muted uppercase">Intelligence Segment:</div>
                <div className="text-[9px] font-bold text-brand-green uppercase font-mono">{session.product}</div>
              </div>

              <div className="flex gap-2">
                <AppButton className="flex-1 font-mono text-[10px] uppercase h-10 tracking-[0.2em]">Join Stream</AppButton>
                <button className="px-4 rounded bg-semantic-error/10 text-semantic-error border border-semantic-error/20 hover:bg-semantic-error hover:text-white transition-all"><XCircle className="w-4 h-4" /></button>
              </div>
            </div>
          </ListingCard>
        ))}
      </div>
    </div>
  );
}
