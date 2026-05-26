'use client';

import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import TestimonialCarousel from '@/components/common/TestimonialCarousel';
import { Quote, Globe, ShieldCheck, Building, Sparkles } from 'lucide-react';

/**
 * @fileOverview Landing Page Testimonials Section.
 * Showcases expert feedback via an interactive, responsive carousel.
 */

const testimonials = [
  {
    name: "Alice Johnson",
    role: "Market Analyst",
    company: "Capital Insights",
    content: "Imperialpedia’s AI knowledge engine accelerated our research like never before. The structured data nodes are a game changer.",
    photoUrl: "https://picsum.photos/seed/alice/100/100",
  },
  {
    name: "David Lee",
    role: "Startup Founder",
    company: "NextGen Fintech",
    content: "Instant insights and structured data saved our team weeks of work. It is the architectural foundation we needed.",
    photoUrl: "https://picsum.photos/seed/david/100/100",
  },
  {
    name: "Maria Garcia",
    role: "Investor",
    company: "Global Assets",
    content: "A must-have tool for decision-making and market research. The AI analyst suite has drastically reduced our discovery time.",
    photoUrl: "https://picsum.photos/seed/maria/100/100",
  }
];

const partners = [
  { name: "Tech University", icon: Globe },
  { name: "Global Assets Inc", icon: Building },
  { name: "Research Lab Alpha", icon: ShieldCheck },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-background overflow-hidden relative" aria-labelledby="testimonials-heading">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl pointer-events-none blur-[150px] opacity-[0.05] z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-3xl mb-16 px-2 space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary mb-2">
            <Sparkles className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Early User Handshake</Text>
          </div>
          <Text variant="h2" id="testimonials-heading" className="text-3xl lg:text-5xl font-bold tracking-tight">What Our Users Say</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Imperialpedia is built for the global intelligence community. Here is what our institutional researchers and startup founders are experiencing.
          </Text>
        </div>

        {/* TODO: AI-generated testimonial content based on user activity */}
        {/* TODO: Analytics tracking for testimonial visibility and interactions */}
        <div className="relative">
          <TestimonialCarousel testimonials={testimonials} />
        </div>

        {/* Logo Bar - Institutional Trust */}
        <div className="mt-24 pt-12 border-t border-white/5">
          <Text variant="label" className="text-center text-muted-foreground/50 mb-10 uppercase tracking-[0.3em] text-[10px]">
            Trusted by Global Institutions
          </Text>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            {partners.map((p) => (
              <div key={p.name} className="flex items-center gap-3 group cursor-default">
                <p.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-bold uppercase tracking-widest group-hover:text-foreground transition-colors">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
