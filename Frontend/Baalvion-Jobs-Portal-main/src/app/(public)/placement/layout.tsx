import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Verified Campus Placements | TalentOS by Baalvion',
  description:
    "Explore Baalvion's verified campus placement record across Type 1, Type 2, and Type 3 colleges. Trusted by leading global companies.",
  alternates: {
    canonical: '/placement',
  },
  openGraph: {
    title: 'Verified Campus Placements | TalentOS by Baalvion',
    description:
      "Explore Baalvion's verified campus placement record. Trusted by leading global companies.",
    url: '/placement',
  },
};

export default function PlacementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
