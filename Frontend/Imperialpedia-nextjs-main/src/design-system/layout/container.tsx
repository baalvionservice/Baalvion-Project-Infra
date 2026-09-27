'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { layoutTokens } from './layout-tokens';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  isNarrow?: boolean;
}

/**
 * A layout component that centers content and applies standard page margins.
 */
export const Container = ({ children, className, isNarrow }: ContainerProps) => {
  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8 w-full',
        className
      )}
      style={{
        maxWidth: isNarrow ? layoutTokens.maxArticleWidth : layoutTokens.maxContentWidth,
      }}
    >
      {children}
    </div>
  );
};
