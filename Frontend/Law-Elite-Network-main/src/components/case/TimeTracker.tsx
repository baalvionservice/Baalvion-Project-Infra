
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Play, Square, Loader2, Clock, History, IndianRupee } from 'lucide-react';
import { mockAddTimeLog } from '@/services/cases/case.mock';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TimeTrackerProps {
  caseId: string;
  timeLogs: any[];
  onUpdate: () => void;
}

/**
 * @fileOverview TimeTracker
 * Billable hour logging protocol for practitioners.
 */
export default function TimeTracker({ caseId, timeLogs, onUpdate }: TimeTrackerProps) {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isBillable, setIsBillable] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    setIsActive(false);
    const mins = Math.max(1, Math.round(seconds / 60));
    try {
      await mockAddTimeLog(caseId, {
        durationMinutes: mins,
        isBillable,
        category: 'drafting',
        description: 'Active matter session'
      });
      setSeconds(0);
      onUpdate();
      toast({ title: "Time Synchronized", description: `${mins} minutes committed to the ledger.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Protocol Error" });
    }
  };

  const totalMins = timeLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
  const billableMins = timeLogs.filter(l => l.isBillable).reduce((acc, log) => acc + (log.durationMinutes || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-blue-600 bg-[#0B1F3A] text-white shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-2xl" />
        <CardHeader className="pb-2 border-b border-white/5 relative z-10">
          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
            <Timer className="w-4 h-4" /> Billable Session Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          <div className="text-center mb-6">
            <h2 className={cn(
              "text-5xl font-mono font-bold tracking-tighter tabular-nums mb-2 transition-all",
              isActive ? "text-blue-400 animate-pulse" : "text-white"
            )}>
              {formatTime(seconds)}
            </h2>
            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Session Duration</p>
          </div>

          <div className="flex gap-3">
            {!isActive ? (
              <Button 
                onClick={() => setIsActive(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest h-12 rounded-xl shadow-lg shadow-blue-900/50"
              >
                <Play className="w-4 h-4 mr-2" /> Start Session
              </Button>
            ) : (
              <Button 
                onClick={handleStop}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-widest h-12 rounded-xl shadow-lg shadow-red-900/50"
              >
                <Square className="w-4 h-4 mr-2" /> Commit Entry
              </Button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Total Logged</p>
              <p className="text-sm font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-400" /> {Math.floor(totalMins/60)}h {totalMins%60}m</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Billable Value</p>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 justify-end"><IndianRupee className="w-3.5 h-3.5" /> {(billableMins/60 * 5000).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
          <History className="w-3.5 h-3.5" /> Recent Sessions
        </h4>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {timeLogs.length === 0 ? (
            <p className="text-[9px] text-slate-400 italic text-center py-4">No sessions recorded.</p>
          ) : (
            timeLogs.map((log) => (
              <div key={log.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{log.durationMinutes} Minutes</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{log.category} Protocol</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  "text-[8px] font-bold uppercase",
                  log.isBillable ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400"
                )}>
                  {log.isBillable ? 'Billable' : 'Pro Bono'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
