'use client';

import React from 'react';
import { Quote, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BaseCard } from './BaseCard';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  quote: string;
  rating?: number;
  className?: string;
}

export function TestimonialCard({
  name,
  role,
  company,
  avatar,
  quote,
  rating = 5,
  className
} : TestimonialCardProps) {
  return (
    <BaseCard className={cn("p-8 flex flex-col h-full", className)}>
      <div className="flex items-center gap-0.5 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={cn(
              "h-4 w-4", 
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-100"
            )} 
          />
        ))}
      </div>

      <div className="relative mb-8 flex-1">
        <Quote className="absolute -top-4 -left-2 h-10 w-10 text-primary/5 -z-10" />
        <p className="text-slate-600 italic leading-relaxed text-lg font-medium relative z-10">
          "{quote}"
        </p>
      </div>

      <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-50">
        <Avatar className="h-12 w-12 border-2 border-white shadow-sm rounded-xl">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/5 text-primary font-black">{name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-black text-slate-900 text-sm leading-tight">{name}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            {role} @ {company}
          </span>
        </div>
      </div>
    </BaseCard>
  );
}
