
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Clock, 
  ShieldCheck, 
  Zap, 
  ArrowDownLeft, 
  FileText, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getRefundStep } from '@/lib/refunds';
import { TransactionStatus } from '@/types';

interface RefundTimelineProps {
  status: TransactionStatus;
  amount: number;
  id: string;
  className?: string;
}

export function RefundTimeline({ status, amount, id, className }: RefundTimelineProps) {
  const currentStep = getRefundStep(status);

  const steps = [
    { label: 'Request Received', icon: Clock },
    { label: 'Escrow Unlock', icon: Zap },
    { label: 'Wallet Credit', icon: ArrowDownLeft },
    { label: 'Credit Note Issued', icon: FileText },
  ];

  return (
    <Card className={cn("border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100", className)}>
      <CardHeader className="p-8 border-b bg-orange-50/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <ArrowDownLeft className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tight">Refund Tracker</CardTitle>
            <CardDescription className="text-xs font-bold text-orange-600 uppercase">Transaction: #{id.substring(0, 8)}</CardDescription>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Returning</p>
          <p className="text-2xl font-black text-slate-900">₹{amount.toLocaleString()}</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-10 lg:p-12">
        <div className="relative py-10">
          {/* Background Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full" />
          
          {/* Progress Line */}
          <motion.div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          <div className="relative flex justify-between">
            {steps.map((step, i) => {
              const active = i + 1 <= currentStep;
              const isLast = i + 1 === steps.length;
              
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "h-10 w-10 rounded-full border-4 flex items-center justify-center z-10 transition-all duration-500",
                    active ? "bg-orange-500 border-white text-white shadow-lg" : "bg-white border-slate-100 text-slate-300"
                  )}>
                    {active && i + 1 < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest text-center max-w-[80px]",
                    active ? "text-orange-600" : "text-slate-400"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Marketplace Guarantee</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Refunds are processed using our audited multi-signature workflow. Funds are returned to your available balance and can be reused for future campaigns immediately.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
