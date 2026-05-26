'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  id?: string;
}

const spacingMap = {
  sm: 'py-8',
  md: 'py-16',
  lg: 'py-24',
  xl: 'py-32',
};

/**
 * Represents a major content block of a page with standard vertical padding.
 */
export const Section = ({ children, spacing = 'md', className, id }: SectionProps) => {
  return (
    <section id={id} className={cn(spacingMap[spacing], className)}>
      {children}
    </section>
  );
};
