'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/utils/analytics';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  ctaText: string;
  recommended: boolean;
  onCtaClick: (name: string) => void;
}

/**
 * Enhanced Pricing Card Component.
 * Features sophisticated Framer Motion animations and institutional-grade styling.
 * Optimized for WCAG accessibility and integrated with conversion analytics.
 */
export const PricingCard = ({ 
  name, 
  price, 
  description, 
  features, 
  ctaText, 
  recommended, 
  onCtaClick 
}: PricingCardProps) => {
  const handleCta = () => {
    trackEvent({
      category: 'Pricing',
      action: 'pricing_selection',
      label: name
    });
    onCtaClick(name);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card 
        className={cn(
          "glass-card flex flex-col h-full border-none relative overflow-hidden transition-all duration-500 group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-4 focus-within:ring-offset-background",
          recommended 
            ? "ring-2 ring-primary/40 shadow-2xl md:scale-105 z-10 bg-primary/5" 
            : "opacity-90 hover:opacity-100 hover:translate-y-[-8px] hover:shadow-xl hover:border-primary/20"
        )}
      >
        {/* Visual recommended badge */}
        {recommended && (
          <div className="bg-primary text-white text-[9px] font-bold uppercase tracking-widest text-center py-1.5 absolute top-0 left-0 w-full shadow-md" role="status" aria-label="Recommended choice">
            Recommended Intelligence Path
          </div>
        )}
        
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700" aria-hidden="true">
          <Zap size={120} className={recommended ? "text-primary" : "text-muted-foreground"} />
        </div>

        <CardHeader className={cn("p-8", recommended ? "pt-12" : "")}>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{name}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
          </div>
          <div className="pt-6 flex items-baseline gap-1">
            <span className="text-5xl font-bold tracking-tighter text-foreground" aria-label={`Price: ${price} per month`}>{price}</span>
            {price !== "$0" && <span className="text-muted-foreground font-medium" aria-hidden="true">/node</span>}
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-0 flex-grow">
          <div className="space-y-6">
            <div className="h-px bg-gradient-to-r from-white/10 to-transparent" aria-hidden="true" />
            <div className="space-y-4">
              <Text variant="label" className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Included Capabilities</Text>
              <ul className="space-y-3" aria-label={`Features included in the ${name} plan`}>
                {features.map((feature, idx) => (
                  <li key={idx} className="flex gap-3 items-start group/item">
                    <div className="mt-1 p-0.5 rounded-full bg-emerald-500/10 text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    </div>
                    <Text variant="caption" className="text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                      {feature}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-8 pt-0">
          <Button 
            onClick={handleCta}
            aria-label={`${ctaText} for ${name} plan`}
            className={cn(
              "w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all scale-100 active:scale-95 shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              recommended 
                ? "bg-primary hover:bg-primary/90 shadow-primary/20" 
                : "variant-outline border-white/10 bg-card/30 hover:bg-white/5"
            )}
          >
            {ctaText} <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
