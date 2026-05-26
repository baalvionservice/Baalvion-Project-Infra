'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import Link from 'next/link';
import { ChevronRight, Layers } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { BaseEntity } from '@/types/entity';

interface RelatedEntitiesProps {
  entities: BaseEntity[];
}

/**
 * Grid of related intelligence nodes grouped by taxonomy.
 * Powered by the Knowledge Graph Relationship Engine.
 */
export const RelatedEntities = ({ entities }: RelatedEntitiesProps) => {
  if (!entities || entities.length === 0) return null;

  // Group entities by type for superior discovery navigation
  const grouped = entities.reduce((acc, entity) => {
    const type = entity.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(entity);
    return acc;
  }, {} as Record<string, BaseEntity[]>);

  return (
    <Section title="Knowledge Graph Connections" className="animate-in fade-in duration-1000 delay-500">
      <div className="space-y-10">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="space-y-4">
            <Text variant="label" className="text-primary font-bold opacity-70 ml-1">
              Related {type}s
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((entity) => (
                <Link key={entity.slug} href={`/${entity.type}s/${entity.slug}`} className="group">
                  <Card className="glass-card border-none hover:bg-white/5 transition-all duration-300 hover:translate-y-[-4px]">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-background/50 border border-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                          <Layers size={20} />
                        </div>
                        <div className="space-y-1">
                          <Text variant="bodySmall" weight="bold" className="group-hover:text-primary transition-colors">
                            {entity.name}
                          </Text>
                          <Text variant="caption" className="uppercase text-[8px] font-bold tracking-widest opacity-50">
                            {entity.type} Node
                          </Text>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};
