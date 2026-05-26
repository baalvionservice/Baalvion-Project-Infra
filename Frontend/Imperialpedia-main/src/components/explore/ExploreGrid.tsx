'use client';

import React from 'react';
import { Globe, Building, Factory, Cpu } from 'lucide-react';
import { ExploreCard } from './ExploreCard';

/**
 * A responsive grid component for the discovery categories.
 */
export const ExploreGrid = () => {
  const categories = [
    {
      title: 'Countries',
      description: 'Browse global country profiles, economic data, and geopolitical insights from our 200+ sovereign nodes.',
      href: '/countries',
      icon: Globe,
    },
    {
      title: 'Companies',
      description: 'Audit institutional benchmarks, founding data, and market influence for leading global corporations.',
      href: '/companies',
      icon: Building,
    },
    {
      title: 'Industries',
      description: 'Explore the global market architecture across manufacturing, finance, healthcare, and energy.',
      href: '/industries',
      icon: Factory,
    },
    {
      title: 'Technologies',
      description: 'Trace the evolution of innovation from generative AI to quantum computing and blockchain.',
      href: '/technologies',
      icon: Cpu,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {categories.map((cat) => (
        <ExploreCard key={cat.href} {...cat} />
      ))}
    </div>
  );
};
