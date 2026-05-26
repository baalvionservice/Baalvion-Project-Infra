"use client";

import React from 'react';
import { Plan } from '@/types/subscription';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShieldCheck, Zap, Award } from 'lucide-react';

interface SubscriptionPlansProps {
  plans: Plan[];
  onSelect: (planId: string) => void;
  currentPlanId?: string;
  isProcessing?: boolean;
}

/**
 * @fileOverview SubscriptionPlans
 * High-fidelity plan selection interface for practitioners.
 */
export default function SubscriptionPlans({ 
  plans, 
  onSelect, 
  currentPlanId, 
  isProcessing 
}: SubscriptionPlansProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {plans.map((plan) => {
        const isCurrent = currentPlanId === plan.id;
        const isElite = plan.id === 'elite';
        
        return (
          <Card 
            key={plan.id} 
            className={`glass-panel border-white/5 executive-card relative overflow-hidden flex flex-col ${
              plan.recommended ? 'border-accent/40 shadow-2xl shadow-accent/5 scale-[1.02] z-10' : ''
            }`}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0">
                <div className="bg-accent text-accent-foreground text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg shadow-lg">
                  Most Popular
                </div>
              </div>
            )}

            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isElite ? 'bg-accent/20 text-accent' : 'bg-white/5 text-muted-foreground'
                }`}>
                  {plan.id === 'basic' && <Zap className="w-5 h-5" />}
                  {plan.id === 'pro' && <ShieldCheck className="w-5 h-5" />}
                  {plan.id === 'elite' && <Award className="w-5 h-5" />}
                </div>
                <div>
                  <CardTitle className="font-headline text-xl italic text-white">{plan.name}</CardTitle>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Professional Standing</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-headline italic text-white">₹{plan.price.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">/ month</span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground italic">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-6 border-t border-white/5 bg-white/[0.02]">
              <Button
                onClick={() => onSelect(plan.id)}
                disabled={isCurrent || isProcessing}
                className={`w-full h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                  isCurrent 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/10'
                }`}
              >
                {isCurrent ? "Active Tier" : isProcessing ? "Synchronizing..." : `Choose ${plan.name} Tier`}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
