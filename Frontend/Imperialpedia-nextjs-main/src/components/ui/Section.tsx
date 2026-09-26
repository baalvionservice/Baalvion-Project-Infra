import React from 'react';
import { cn } from '@/lib/utils';
import { Text } from '@/design-system/typography/text';

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized Section component for grouping related content across the platform.
 */
export const Section = ({ title, description, children, className }: SectionProps) => {
  return (
    <section className={cn('py-12 space-y-6', className)}>
      <div className="space-y-2">
        <Text variant="h2" as="h2" className="text-3xl font-bold tracking-tight">
          {title}
        </Text>
        {description && (
          <Text variant="body" className="text-muted-foreground text-lg">
            {description}
          </Text>
        )}
      </div>
      <div className="pt-4">
        {children}
      </div>
    </section>
  );
};
