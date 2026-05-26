"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShieldCheck, Zap, Award } from 'lucide-react';
import { Plan } from '@/services/subscriptions/subscription.mock';

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  onSelect: (planId: string) => void;
  isLoading: boolean;
}

/**
 * @fileOverview PlanCard
 * High-fidelity selection component for network membership tiers.
 */
export default function PlanCard({ plan, isCurrent, onSelect, isLoading }: PlanCardProps) {
  const getIcon = () => {
    switch (plan.id) {
      case 'basic': return <ShieldCheck className="w-6 h-6 text-slate-400" />;
      case 'premium':
      case 'pro': return <Zap className="w-6 h-6 text-blue-600" />;
      case 'elite': return <Award className="w-6 h-6 text-amber-500" />;
      default: return <ShieldCheck className="w-6 h-6" />;
    }
  };

  return (
    <Card className={`flex flex-col h-full transition-all duration-300 ${
      plan.recommended 
        ? "border-blue-600 shadow-xl shadow-blue-50 scale-105 z-10" 
        : "border-slate-200"
    }`}>
      {plan.recommended && (
        <div className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest py-1 text-center">
          Network Recommended
        </div>
      )}
      
      <CardHeader className="text-center pt-8">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
          {getIcon()}
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
        <div className="mt-2 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-slate-900">₹{plan.price.toLocaleString()}</span>
          <span className="text-slate-500 text-xs font-medium uppercase">/ month</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-8 py-6">
        <ul className="space-y-4">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-600 font-medium">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="px-8 pb-8">
        <Button 
          className={`w-full h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${
            isCurrent 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" 
              : "bg-[#0B1F3A] text-white hover:bg-slate-800 shadow-lg"
          }`}
          onClick={() => onSelect(plan.id)}
          disabled={isCurrent || isLoading}
        >
          {isCurrent ? "Current Standing" : `Upgrade to ${plan.name}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
