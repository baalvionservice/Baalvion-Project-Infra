"use client"

import React, { useState, useEffect } from 'react';
import { LIVE_ACTIVITY_MOCK } from '@/data/mockData';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Play, Users, Clock, Zap, Search, Calendar, MoreVertical, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentSessionsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Learning Sessions</h1>
          <p className="text-text-muted font-medium">Access live broadcasts and your historical learning log.</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="bg-brand-green text-black px-8 h-12 font-bold uppercase text-[11px] tracking-widest">
            Book New Session
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Joined', val: '24', icon: Video, color: 'text-brand-green' },
          { label: 'Hours Learned', val: '36.5', icon: Clock, color: 'text-semantic-info' },
          { label: 'Live Now', val: '2', icon: Play, color: 'text-semantic-error' },
          { label: 'Certifications', val: '3', icon: Zap, color: 'text-semantic-warning' },
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

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
            <Play className="w-4 h-4 text-brand-green" /> Recommended Live Intelligence
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {LIVE_ACTIVITY_MOCK.activeSessions.map((session) => (
            <ListingCard key={session.id} className="p-0 border-brand-border bg-brand-surface overflow-hidden group hover:border-brand-green transition-all">
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
                <div className="absolute top-4 left-4 z-20">
                  <Badge variant="live">LIVE</Badge>
                </div>
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{session.viewers}</span>
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
                <AppButton className="w-full font-mono text-[10px] uppercase h-10 tracking-[0.2em]">Connect Intelligence Stream</AppButton>
              </div>
            </ListingCard>
          ))}
        </div>
      </div>
    </div>
  );
}
