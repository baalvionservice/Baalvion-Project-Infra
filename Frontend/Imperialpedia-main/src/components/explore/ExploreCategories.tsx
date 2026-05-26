'use client';

import React from 'react';
import { Section } from '@/components/ui/Section';
import { ExploreGrid } from './ExploreGrid';

/**
 * Wrapper for the primary knowledge taxonomy discovery.
 */
export const ExploreCategories = () => {
  return (
    <Section 
      title="Knowledge Taxonomy" 
      description="Select an intelligence hub to begin your research across our structured knowledge index."
    >
      <ExploreGrid />
    </Section>
  );
};
