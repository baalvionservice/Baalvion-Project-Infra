"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Clock, IndianRupee, ShieldCheck } from 'lucide-react';

interface PaymentSummaryProps {
  booking: {
    id: string;
    date: string;
    time: string;
  };
}

/**
 * @fileOverview PaymentSummary
 * Financial reconciliation view for consultation engagements.
 */
export default function PaymentSummary({ booking }: PaymentSummaryProps) {
  const amount = 5000; // Standard network consultation fee

  return (
    <Card className="glass-panel border-accent/20 bg-accent/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
      <CardHeader className="pb-4 border-b border-white/5">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
          <FileText className="w-4 h-4" /> Settlement Ledger
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Engagement ID</span>
            <span className="text-white">#{booking.id.slice(-8)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-accent opacity-50" />
              <span className="text-xs text-white/80">{new Date(booking.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-accent opacity-50" />
              <span className="text-xs text-white/80">{booking.time}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Settlement</p>
              <p className="text-[9px] text-accent font-medium uppercase italic mt-0.5">Includes network security fee</p>
            </div>
            <div className="text-right">
              <span className="font-headline text-3xl italic text-white flex items-center gap-1.5">
                <IndianRupee className="w-5 h-5 text-emerald-400" /> {amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <p className="text-[9px] text-muted-foreground italic leading-tight">
            Transaction is secured by Law Elite Network protocols. Funds are held in escrow until session completion.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
