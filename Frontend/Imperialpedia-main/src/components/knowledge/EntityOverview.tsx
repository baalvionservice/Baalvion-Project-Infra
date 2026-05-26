import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/components/ui/Section';

interface EntityOverviewProps {
  description: string;
  stats?: { label: string; value: string | number }[];
}

/**
 * Shared Overview section for Knowledge Entities.
 */
export const EntityOverview = ({ description, stats }: EntityOverviewProps) => {
  return (
    <Section title="Overview" className="animate-in fade-in duration-1000 delay-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <Text variant="body" className="text-xl text-muted-foreground leading-relaxed italic border-l-4 border-primary/30 pl-8">
            {description}
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {stats?.map((stat) => (
            <Card key={stat.label} className="glass-card border-none bg-primary/5 hover:bg-primary/10 transition-colors">
              <CardContent className="p-6">
                <Text variant="label" className="text-[10px] opacity-50 block mb-1 uppercase font-bold tracking-widest">{stat.label}</Text>
                <Text variant="h4" className="text-xl font-bold">{stat.value}</Text>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
};
