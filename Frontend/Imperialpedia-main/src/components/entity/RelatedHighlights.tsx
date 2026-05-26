import React from 'react';
import { getGraphRelatedEntities } from '@/lib/utils/entityHelpers';
import { ID } from '@/types/common';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Layers } from 'lucide-react';

interface RelatedHighlightsProps {
  entityId: ID;
}

/**
 * Surfacing high-level relational nodes for discovery navigation.
 */
export const RelatedHighlights = ({ entityId }: RelatedHighlightsProps) => {
  const related = getGraphRelatedEntities(entityId);

  if (related.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
        <Layers className="h-4 w-4" /> Relational Nodes
      </div>
      <div className="flex flex-wrap gap-2">
        {related.map((node) => (
          <Link key={node.id} href={`/${node.type}s/${node.slug}`}>
            <Badge 
              variant="secondary" 
              className="px-3 py-1 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary transition-all cursor-pointer rounded-xl font-bold text-[10px] uppercase"
            >
              {node.name}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
};
