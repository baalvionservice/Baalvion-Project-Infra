"use client";

import React, { useState, useEffect } from 'react';
import { 
  History, 
  PlusCircle, 
  UserCheck, 
  RefreshCw, 
  CalendarClock, 
  MessageSquare, 
  FileUp,
  Loader2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { subscribeToActivities } from '@/services/activities/activityService';
import { formatDistanceToNow } from 'date-fns';

interface ActivityTimelineProps {
  caseId: string;
}

/**
 * @fileOverview ActivityTimeline
 * High-fidelity visual audit ledger for individual legal matters.
 * Real-time subscription to the network's activity feed.
 */
export default function ActivityTimeline({ caseId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToActivities(caseId, (data) => {
      setActivities(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [caseId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'case_created': return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case 'lawyer_assigned': return <UserCheck className="w-4 h-4 text-accent" />;
      case 'status_changed': return <RefreshCw className="w-4 h-4 text-blue-400" />;
      case 'appointment_booked': return <CalendarClock className="w-4 h-4 text-amber-400" />;
      case 'message_sent': return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'document_uploaded': return <FileUp className="w-4 h-4 text-cyan-400" />;
      default: return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 glass-panel rounded-3xl border-white/5">
        <Loader2 className="w-8 h-8 animate-spin text-accent opacity-50" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Audit Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {activities.length === 0 ? (
        <div className="py-20 text-center space-y-4 px-8 glass-panel rounded-3xl border-white/5 bg-white/[0.01]">
          <History className="w-16 h-16 text-muted-foreground/10 mx-auto mb-2" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Audit Ledger Empty</h4>
            <p className="text-xs text-muted-foreground italic">Platform intelligence has not yet recorded events for this specific brief.</p>
          </div>
        </div>
      ) : (
        <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
          {activities.map((act, index) => (
            <div key={act.id} className="relative animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="absolute -left-11 top-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg shadow-black/20 z-10 bg-background/80 backdrop-blur-sm">
                {getIcon(act.type)}
              </div>
              
              <div className="glass-panel p-5 rounded-2xl border-white/5 hover:border-white/10 transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h5 className="text-sm font-bold text-white group-hover:text-accent transition-colors">
                    {act.message}
                  </h5>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter whitespace-nowrap">
                    <Clock className="w-3 h-3" /> {act.createdAt ? formatDistanceToNow(new Date(act.createdAt.seconds ? act.createdAt.seconds * 1000 : act.createdAt)) : 'just now'} ago
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/30" />
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      Event Logged • Protocol Verified
                    </p>
                  </div>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/20 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
