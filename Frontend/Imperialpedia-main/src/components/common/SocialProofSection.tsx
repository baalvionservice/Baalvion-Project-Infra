'use client';

import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import LogoCard from './LogoCard';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

/**
 * @fileOverview Landing Page Social Proof Section.
 * Showcases institutional partners, investors, and media features.
 * 
 * TODO: AI-powered dynamic social proof based on user segment (Phase 2)
 * TODO: Personalized logos or press features based on regional detection
 * TODO: Analytics tracking for logo interactions and traversal
 */

const logos = [
  { src: "https://placehold.co/200x80/1C1822/FFFFFF/png?text=FORBES", alt: "Forbes" },
  { src: "https://placehold.co/200x80/1C1822/FFFFFF/png?text=BLOOMBERG", alt: "Bloomberg" },
  { src: "https://placehold.co/200x80/1C1822/FFFFFF/png?text=REUTERS", alt: "Reuters" },
  { src: "https://placehold.co/200x80/1C1822/FFFFFF/png?text=TECHCRUNCH", alt: "TechCrunch" },
  { src: "https://placehold.co/200x80/1C1822/FFFFFF/png?text=WIRED", alt: "Wired" },
  { src: "https://placehold.co/200x80/1C1822/FFFFFF/png?text=CNBC", alt: "CNBC" },
];

export default function SocialProofSection() {
  const { t } = useTranslation('common');

  return (
    <section className="py-12 border-y border-white/5 bg-card/10 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[100px] pointer-events-none" />
      
      <Container>
        <div className="flex flex-col items-center space-y-10">
          <div className="flex items-center gap-3 animate-in fade-in duration-1000">
            <ShieldCheck className="h-4 w-4 text-primary/60" />
            <Text variant="label" className="text-[10px] font-bold text-muted-foreground/60 tracking-[0.3em] uppercase">
              The Standard for Institutional Research
            </Text>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 w-full items-center">
            {logos.map((logo, idx) => (
              <LogoCard key={logo.alt} {...logo} index={idx} />
            ))}
          </div>

          <div className="pt-4 opacity-40 hover:opacity-100 transition-opacity">
            <Text variant="caption" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary" /> Integrated with the Global Intelligence Index
            </Text>
          </div>
        </div>
      </Container>
    </section>
  );
}
