'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Sparkles, Zap, Activity } from 'lucide-react';
import { WaitlistForm } from './WaitlistForm';
import { useTranslation } from 'react-i18next';

/**
 * High-fidelity Call-To-Action (CTA) Section.
 * Orchestrates the primary conversion handshake at the end of the discovery cycle.
 * Featuring Framer Motion animations and Phase 2 AI placeholders.
 */
export const CtaSection = () => {
  const { t } = useTranslation('common');

  return (
    <section 
      role="region"
      aria-labelledby="cta-heading"
      className="py-32 bg-background relative overflow-hidden"
    >
      {/* Background Architectural Glows */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full blur-[120px]" />
      </div>

      <Container isNarrow className="relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-10 max-w-3xl mx-auto"
        >
          {/* Animated Identity Icon */}
          <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] border border-primary/20 flex items-center justify-center mx-auto mb-8 shadow-2xl group hover:scale-110 transition-transform duration-500">
            <Sparkles className="h-12 w-12 text-primary group-hover:rotate-12 transition-transform" aria-hidden="true" />
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
              <Zap className="h-4 w-4" aria-hidden="true" />
              <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">
                {/* TODO: AI-driven dynamic CTA label based on user segment */}
                {t('cta.label')}
              </Text>
            </div>
            
            <Text variant="h2" id="cta-heading" className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
              {/* TODO: AI-driven dynamic headline suggestions */}
              {t('cta.title')}
            </Text>
            
            <Text variant="body" className="text-muted-foreground text-lg lg:text-xl leading-relaxed">
              {t('cta.subtitle')}
            </Text>
          </div>

          {/* Lead Capture Node */}
          <div className="pt-8">
            <WaitlistForm />
          </div>

          {/* Institutional Telemetry Node */}
          <div className="pt-12 flex flex-col items-center gap-4 opacity-40">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <Activity className="h-4 w-4" aria-hidden="true" /> Indexing Engine: Live
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" aria-hidden="true" />
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> AI Analyst Kernel v4.2
              </div>
            </div>
          </div>
        </motion.div>
      </Container>

      {/* 
        TODO: AI-driven dynamic CTA text based on user behavior (Phase 2)
        TODO: Analytics tracking for impressions and conversion velocity
        TODO: Backend integration for institutional lead qualification
      */}
    </section>
  );
};
