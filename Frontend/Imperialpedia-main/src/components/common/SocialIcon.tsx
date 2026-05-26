'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { trackEvent } from '@/lib/utils/analytics';

interface SocialIconProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

/**
 * High-fidelity Social Discovery Icon.
 * Features animated scale states, accessible labels, and click analytics.
 */
export default function SocialIcon({ href, icon: Icon, label }: SocialIconProps) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent({ category: 'Social', action: 'social_icon_click', label })}
      className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 p-2 rounded-lg hover:bg-primary/10 outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Icon className="w-5 h-5" />
    </a>
  );
}
