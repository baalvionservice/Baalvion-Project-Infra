'use client';

import React from 'react';
import { Globe } from 'lucide-react';
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
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {categories.map((cat) => (
        <ExploreCard key={cat.href} {...cat} />
      ))}
    </div>
  );
};
