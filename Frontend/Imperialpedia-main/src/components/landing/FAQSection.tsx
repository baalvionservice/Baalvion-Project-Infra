'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { HelpCircle, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { useTranslation } from 'react-i18next';

/**
 * Landing Page FAQ Section.
 * Features an interactive accordion and FAQPage structured data for SEO.
 */
export const FAQSection = () => {
  const { t } = useTranslation('common');

  // TODO: AI-generated dynamic FAQs based on user queries
  // TODO: Multi-language translations for FAQ content synchronized with i18n
  // TODO: Predictive FAQ suggestions based on engagement analytics

  const faqs = [
    {
      question: "What is Imperialpedia?",
      answer: "Imperialpedia is the world's most scalable AI-powered structured knowledge engine, designed to provide deep-dive intelligence across 1,000,000+ programmatic nodes."
    },
    {
      question: "How do I join the waitlist?",
      answer: "You can secure your spot by clicking any 'Join Waitlist' button on this page and entering your institutional email address. You will receive a handshake confirmation once your node is indexed."
    },
    {
      question: "Who can use Imperialpedia?",
      answer: "Our platform is architected for institutional researchers, financial analysts, private wealth managers, academic institutions, and AI companies requiring high-fidelity structured datasets."
    },
    {
      question: "When will AI insights be available?",
      answer: "Phase 2 of the Imperialpedia rollout will introduce the full Generative AI suite, including real-time research synthesis, automated fiscal audits, and predictive catalyst scanning."
    }
  ];

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
            <Text variant="label" className="font-bold tracking-widest uppercase">{t('faq.label')}</Text>
          </div>
          <Text variant="h2" className="text-3xl lg:text-5xl font-bold tracking-tight">
            {t('faq.title')}
          </Text>
          <Text variant="body" className="text-muted-foreground max-w-2xl mx-auto">
            {t('faq.subtitle')}
          </Text>
        </div>

        <Card className="glass-card border-none shadow-2xl overflow-hidden p-2">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-b border-white/5 px-6 last:border-0"
              >
                <AccordionTrigger className="text-left font-bold text-lg py-6 hover:text-primary transition-colors hover:no-underline group">
                  <span className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-all duration-300">
                      {index + 1}
                    </span>
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-8 pl-12 text-muted-foreground leading-relaxed text-base animate-in slide-in-from-top-2 duration-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <div className="mt-12 p-8 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-8 group">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="text-left space-y-1">
              <Text variant="bodySmall" weight="bold">{t('faq.support_title')}</Text>
              <Text variant="caption" className="text-muted-foreground">{t('faq.support_desc')}</Text>
            </div>
          </div>
          <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/5 shadow-sm">
            {t('faq.support_button')}
          </Button>
        </div>
      </Container>
    </section>
  );
};