import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: string | number;
}

interface QuickStatsProps {
  stats: StatItem[];
  className?: string;
}

/**
 * A dense grid component for surfacing primary data nodes of an entity.
 */
export const QuickStats = ({ stats, className }: QuickStatsProps) => {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-4", className)}>
      {stats.map((stat, idx) => (
        <Card key={idx} className="glass-card border-none bg-card/30 hover:border-primary/20 transition-all group shadow-inner">
          <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
            <Text variant="label" className="text-[10px] opacity-50 font-bold uppercase tracking-widest leading-none">
              {stat.label}
            </Text>
            <div className="text-lg font-bold group-hover:text-primary transition-colors tracking-tight">
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
