'use client';

import React from 'react';
import { Check, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BaseCard } from './BaseCard';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText?: string;
  className?: string;
  onCtaClick?: () => void;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  isPopular,
  ctaText = "Get Started",
  className,
  onCtaClick
}: PricingCardProps) {
  return (
    <BaseCard 
      className={cn(
        "relative h-full flex flex-col p-8 transition-all duration-300",
        isPopular ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary" : "border-slate-200",
        className
      )}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg uppercase tracking-widest">
          <Star className="h-3 w-3 fill-current" />
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-black text-slate-900">{name}</h3>
        <p className="text-sm text-slate-500 mt-2 font-medium">{description}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-900">{price}</span>
          <span className="text-slate-400 font-bold text-sm">/mo</span>
        </div>
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm font-medium text-slate-600">
            <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Check className="h-3 w-3 text-emerald-600" />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button 
        onClick={onCtaClick}
        className={cn(
          "w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest group",
          isPopular ? "bg-primary hover:bg-primary/90" : "bg-slate-900 hover:bg-slate-800"
        )}
      >
        {ctaText}
        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </BaseCard>
  );
}
