'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StackProps {
  children: React.ReactNode;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

const spacingMap = {
  none: 'space-y-0',
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-8',
  xl: 'space-y-12',
};

/**
 * A vertical layout component that spaces children consistently.
 */
export const Stack = ({ children, spacing = 'md', align = 'stretch', className }: StackProps) => {
  return (
    <div className={cn('flex flex-col', spacingMap[spacing], `items-${align}`, className)}>
      {children}
    </div>
  );
};
