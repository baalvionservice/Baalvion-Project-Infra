"use client"

import React, { useState, useEffect } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Play, Users, Clock, Zap, Plus, Video, Calendar, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeacherSessionsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Live Session Management</h1>
          <p className="text-text-muted font-medium">Broadcast intelligence and manage student engagement.</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="bg-semantic-warning text-black px-8 h-12 font-bold uppercase text-[11px] tracking-widest">
            <Plus className="w-4 h-4 mr-2" /> New Session Request
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Sessions Completed', val: '247', icon: Video, color: 'text-semantic-info' },
          { label: 'Upcoming Today', val: '2', icon: Calendar, color: 'text-brand-green' },
          { label: 'Avg Engagement', val: '92%', icon: Users, color: 'text-semantic-warning' },
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

      <div className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-green" /> Scheduled Broadcasts
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {[
            { title: 'Advanced Organic Synthesis', time: 'Today, 4:00 PM', duration: '60 min', viewers: 124, status: 'upcoming' },
            { title: 'Laboratory Safety Protocols', time: 'Tomorrow, 10:00 AM', duration: '45 min', viewers: 89, status: 'scheduled' },
          ].map((session, i) => (
            <ListingCard key={i} className="p-6 bg-brand-surface border-brand-border hover:border-semantic-warning transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-semantic-warning border border-white/5">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-semantic-warning transition-colors">{session.title}</h4>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.time}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span>{session.duration}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-text-ghost uppercase">Expected Load</div>
                    <div className="text-sm font-bold text-white">{session.viewers} Students</div>
                  </div>
                  <div className="flex gap-2">
                    <AppButton size="sm" className="bg-semantic-warning text-black font-bold uppercase text-[10px]">Initialize</AppButton>
                    <button className="p-2.5 rounded bg-white/5 border border-white/5 text-text-ghost hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </ListingCard>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Activity } from 'lucide-react';
