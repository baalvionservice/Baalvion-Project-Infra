"use client"

import React from 'react';
import { ListingCard } from '@/components/ui/ListingCard';
import { Globe } from 'lucide-react';

// Regional load telemetry is not collected yet. This used to render simulated per-region
// figures; it now says so instead of showing numbers nobody measured.
export const GlobalRegionIntelligence = () => (
  <ListingCard className="p-16 border-white/5 bg-white/[0.02] text-center space-y-4">
    <Globe className="w-10 h-10 text-text-muted mx-auto" />
    <h3 className="text-lg font-bold text-white uppercase tracking-widest">No regional data yet</h3>
    <p className="text-sm text-text-muted max-w-md mx-auto">Per-region traffic and load are not being recorded. They will appear here once a source for them exists.</p>
  </ListingCard>
);
