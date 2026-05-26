"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, IndianRupee, ShieldCheck, Info } from 'lucide-react';

interface BookingSummaryProps {
  lawyer: {
    name: string;
    specialization: string;
    consultationFee: number;
  };
  date: string;
  time: string;
}

/**
 * @fileOverview BookingSummary
 * Professional audit view of the proposed consultation terms.
 * Polished with premium icons and glass-panel effects.
 */
export default function BookingSummary({
  lawyer,
  date,
  time,
}: BookingSummaryProps) {
  if (!date || !time) {
    return (
      <div className="glass-panel p-6 rounded-2xl border-white/5 border-dashed flex flex-col items-center justify-center gap-3 opacity-40">
        <Info className="w-6 h-6 text-muted-foreground" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select schedule to generate summary</p>
      </div>
    );
  }

  return (
    <Card className="glass-panel border-accent/20 bg-accent/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500 shadow-2xl">
      <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Consultation Protocol
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Practitioner Assigned</p>
            <p className="font-headline text-2xl italic text-white">{lawyer.name}</p>
            <p className="text-[9px] font-medium text-accent uppercase tracking-widest mt-1">{lawyer.specialization} Practitioner</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Session Fee</p>
            <p className="font-headline text-2xl italic text-emerald-400">₹{lawyer.consultationFee.toLocaleString()}</p>
            <p className="text-[8px] font-bold text-emerald-400/50 uppercase tracking-widest mt-1">Escrow Secured</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-muted-foreground uppercase">Scheduled Date</p>
              <p className="text-xs font-medium text-white">{new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-muted-foreground uppercase">Executive Time</p>
              <p className="text-xs font-medium text-white">{time}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3 border border-white/5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-[9px] text-muted-foreground italic leading-tight">
            Consultation is governed by the Law Elite Network engagement terms. Session is conducted over a secure, end-to-end encrypted executive channel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
