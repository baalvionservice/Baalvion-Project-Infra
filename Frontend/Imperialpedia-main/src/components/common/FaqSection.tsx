'use client';

import React from 'react';
import FaqItem from "./FaqItem";
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { HelpCircle, Sparkles } from 'lucide-react';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';

interface FaqSectionProps {
  faqs: {
    question: string;
    answer: string;
  }[];
}

/**
 * Landing Page FAQ Hub.
 * Orchestrates the discovery of platform knowledge via a high-fidelity accordion.
 */
export default function FaqSection({ faqs }: FaqSectionProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <section id="faq" className="py-24 bg-background scroll-mt-20">
      <JsonLd data={faqSchema} />
      
      <Container isNarrow>
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary mb-4 animate-in fade-in duration-700">
            <HelpCircle className="h-5 w-5" />
            <Text variant="label" className="font-bold tracking-widest uppercase">Information Triage</Text>
          </div>
          <Text variant="h2" className="text-3xl lg:text-5xl font-bold tracking-tight">
            Frequently Asked Questions
          </Text>
          <Text variant="body" className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about the world's most scalable intelligence infrastructure.
          </Text>
        </div>

        <div className="bg-card/30 p-4 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm px-6 lg:px-10">
          {faqs.map((faq, idx) => (
            <FaqItem key={idx} {...faq} />
          ))}
        </div>

        <div className="mt-12 p-8 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-8 group">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="text-left space-y-1">
              <Text variant="bodySmall" weight="bold">Still have questions?</Text>
              <Text variant="caption" className="text-muted-foreground">Our AI Research Assistant can provide deeper context on our roadmap.</Text>
            </div>
          </div>
          <button className="h-12 px-8 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/5 shadow-sm transition-all">
            Query the Analyst Hub
          </button>
        </div>

        {/* TODO: AI-generated FAQ personalization based on user behavior */}
        {/* TODO: Dynamic FAQ ranking based on search queries */}
        {/* TODO: Analytics tracking for FAQ interactions */}
      </Container>
    </section>
  );
}
