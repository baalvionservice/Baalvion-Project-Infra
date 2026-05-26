'use client';

import React from 'react';
import { EntityListItem } from './EntityListItem';
import { Grid } from '@/design-system/layout/grid';
import { Text } from '@/design-system/typography/text';
import { SearchX } from 'lucide-react';
import { BaseEntity } from '@/types/entity';

interface EntityListProps {
  entities: BaseEntity[];
  type: string;
  totalCount: number;
}

/**
 * Orchestrates the rendering of a list of knowledge entities.
 */
export const EntityList = ({ entities, type, totalCount }: EntityListProps) => {
  if (entities.length === 0) {
    return (
      <div className="py-24 text-center space-y-6 bg-muted/10 rounded-[3rem] border-2 border-dashed border-white/5">
        <SearchX className="w-16 h-16 text-muted-foreground mx-auto opacity-30" />
        <div className="space-y-2">
          <Text variant="h3" className="font-bold">No results localized</Text>
          <Text variant="bodySmall" className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Try adjusting your search terms or taxonomy filters to discover new intelligence nodes.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <Text variant="label" className="text-muted-foreground font-bold">
          Localized <span className="text-foreground">{totalCount}</span> intelligence nodes
        </Text>
      </div>

      <Grid columns={{ sm: 1, md: 2, lg: 3, xl: 4 }} gap="lg">
        {entities.map((entity) => (
          <EntityListItem
            key={entity.id}
            name={entity.name}
            type={type}
            category={entity.category}
            description={entity.description}
            slug={entity.slug}
          />
        ))}
      </Grid>
    </div>
  );
};
