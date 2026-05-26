
'use client';

import React from 'react';
import FAQItem from "./FAQItem";
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { HelpCircle } from 'lucide-react';

/**
 * Landing Page FAQ Hub.
 * Orchestrates the discovery of platform knowledge via a high-fidelity accordion.
 */
export default function FAQSection() {
  const faqs = [
    {
      question: "What is Imperialpedia?",
      answer: "Imperialpedia is the world's most scalable AI-powered financial intelligence engine, providing deep-dive research across 1,000,000+ programmatic nodes.",
    },
    {
      question: "Who can use Imperialpedia?",
      answer: "Investors, institutional researchers, analysts, and AI companies can benefit from our high-fidelity structured data and analytical suites.",
    },
    {
      question: "How can I access the data?",
      answer: "Access nodes are available through our Enterprise API, the AI Research Assistant, or through direct export of premium knowledge graph datasets.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-background scroll-mt-20">
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
            <FAQItem key={idx} {...faq} />
          ))}
        </div>

        {/* TODO: AI-generated FAQs based on user queries and behavior */}
        {/* TODO: Analytics tracking for FAQ interactions */}
        {/* TODO: Dynamic prioritization of top-viewed questions */}
      </Container>
    </section>
  );
}
