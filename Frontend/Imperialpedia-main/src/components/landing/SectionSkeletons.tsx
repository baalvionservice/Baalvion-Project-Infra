'use client';

import React from 'react';
import Skeleton from '@/components/common/Skeleton';
import { Container } from '@/design-system/layout/container';

/**
 * Skeleton for the Landing Page Hero Section.
 * // TODO: AI-driven predictive pre-loading for above-the-fold content
 */
export const HeroSectionSkeleton = () => (
  <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
    <Container>
      <div className="max-w-4xl mx-auto text-center space-y-10">
        <div className="flex justify-center">
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-16 lg:h-32 w-full max-w-3xl mx-auto rounded-2xl" />
          <Skeleton className="h-6 w-full max-w-2xl mx-auto rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Skeleton className="h-16 w-48 rounded-2xl" />
          <Skeleton className="h-16 w-48 rounded-2xl" />
        </div>
        <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-lg" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

/**
 * Skeleton for the Features Grid Section.
 * // TODO: Dynamic skeleton layouts based on user device
 */
export const FeaturesSectionSkeleton = () => (
  <section className="py-24 bg-background">
    <Container>
      <div className="max-w-3xl mb-16 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-full max-w-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-8 rounded-[2rem] border border-white/5 bg-card/30 space-y-6">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

/**
 * Skeleton for the Testimonials Section.
 * // TODO: Analytics tracking for loading time and skeleton visibility
 */
export const TestimonialsSectionSkeleton = () => (
  <section className="py-24 bg-background">
    <Container>
      <div className="max-w-3xl mb-16 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-8 rounded-[2rem] border border-white/5 bg-secondary/5 space-y-6">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(j => <Skeleton key={j} className="h-3 w-3 rounded-full" />)}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

/**
 * Skeleton for the FAQ Accordion Section.
 */
export const FAQSectionSkeleton = () => (
  <section className="py-24 bg-background">
    <Container isNarrow>
      <div className="text-center mb-16 space-y-4">
        <div className="flex justify-center"><Skeleton className="h-4 w-32" /></div>
        <Skeleton className="h-12 w-64 mx-auto" />
        <Skeleton className="h-6 w-full max-w-lg mx-auto" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-[2rem] border border-white/5 bg-card/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-6 w-48 lg:w-96" />
              </div>
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

/**
 * Skeleton for the Pricing/Plans Section.
 */
export const PricingSectionSkeleton = () => (
  <section className="py-24 bg-background">
    <Container>
      <div className="text-center mb-16 space-y-4">
        <div className="flex justify-center"><Skeleton className="h-4 w-32" /></div>
        <Skeleton className="h-12 w-64 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-8 rounded-[2.5rem] border border-white/5 bg-card/30 flex flex-col space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-32" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-3 w-20" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="flex gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-xl mt-auto" />
          </div>
        ))}
      </div>
    </Container>
  </section>
);

/**
 * Skeleton for the Social Proof Logo Bar.
 */
export const SocialProofSkeleton = () => (
  <section className="py-12 border-y border-white/5 bg-card/10">
    <Container>
      <div className="flex flex-col items-center space-y-10">
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 w-full">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-8 w-full max-w-[120px] mx-auto" />
          ))}
        </div>
      </div>
    </Container>
  </section>
);

/**
 * Skeleton for the Newsletter Ingestion Form.
 */
export const NewsletterSkeleton = () => (
  <div className="w-full max-w-sm space-y-4">
    <Skeleton className="h-11 w-full rounded-xl" />
    <div className="flex gap-2">
      <Skeleton className="h-11 flex-1 rounded-xl" />
      <Skeleton className="h-11 w-20 rounded-xl" />
    </div>
  </div>
);
