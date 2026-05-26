'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TestimonialCardProps {
  name: string;
  role: string;
  company?: string;
  photoUrl?: string;
  content: string;
  className?: string;
}

/**
 * A sophisticated card representing an expert or institutional endorsement.
 * Features trust indicators, high-contrast typography, and accessible semantic roles.
 */
export function TestimonialCard({ name, role, company, photoUrl, content, className }: TestimonialCardProps) {
  return (
    <Card className={cn(
      "glass-card border-none shadow-xl bg-secondary/5 h-full transition-all duration-500 hover:border-secondary/30 group",
      className
    )}>
      <CardContent className="p-8 lg:p-10 space-y-6 flex flex-col h-full relative overflow-hidden">
        {/* Visual Watermark */}
        <div className="absolute top-4 right-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Quote size={80} />
        </div>

        {/* Rating Nodes - Visual Trust Signals */}
        <div className="flex gap-1" aria-label="5 star rating">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={14} className="fill-secondary text-secondary" />
          ))}
        </div>
        
        {/* Quote Body */}
        <Text variant="bodySmall" className="text-foreground/90 italic leading-relaxed text-lg flex-grow relative z-10">
          "{content}"
        </Text>

        {/* Identity Handshake */}
        <div className="flex items-center gap-4 pt-6 border-t border-white/5 relative z-10">
          <Avatar className="h-14 w-14 rounded-2xl border-2 border-background ring-1 ring-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500">
            {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left">
            <Text variant="bodySmall" weight="bold" className="block text-foreground truncate text-base">
              {name}
            </Text>
            <Text variant="caption" className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] block truncate mt-0.5">
              {role}{company ? ` • ${company}` : ""}
            </Text>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
