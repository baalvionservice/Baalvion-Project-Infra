'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GridProps {
  children: React.ReactNode;
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const gapMap = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-8',
  xl: 'gap-12',
};

/**
 * A flexible Grid component for responsive layouts.
 */
export const Grid = ({ children, columns = 1, gap = 'md', className }: GridProps) => {
  const getColsClass = () => {
    if (typeof columns === 'number') {
      return `grid-cols-${columns}`;
    }
    const { sm, md, lg, xl } = columns;
    return cn(
      sm && `sm:grid-cols-${sm}`,
      md && `md:grid-cols-${md}`,
      lg && `lg:grid-cols-${lg}`,
      xl && `xl:grid-cols-${xl}`
    );
  };

  return (
    <div className={cn('grid', getColsClass(), gapMap[gap], className)}>
      {children}
    </div>
  );
};
