'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { Tag as TagIcon, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntityTagsProps {
  entity: any;
  type: 'country' | 'company' | 'industry' | 'technology';
  className?: string;
}

/**
 * Component for displaying and managing entity-level tags and categories.
 * Provides deep-links to filtered index pages.
 */
export const EntityTags = ({ entity, type, className }: EntityTagsProps) => {
  // Logic to generate relevant taxonomy tags based on entity type
  const getTaxonomyTags = () => {
    switch (type) {
      case 'country':
        return [
          { label: entity.region, param: 'region', value: entity.region?.toLowerCase().replace(' ', '-') },
          { label: 'Sovereign Node', param: null, value: null },
        ];
      case 'company':
        return [
          { label: entity.industry, param: 'industry', value: entity.industry?.toLowerCase().replace(' ', '-') },
          { label: 'Institutional Node', param: null, value: null },
        ];
      case 'industry':
        return [
          { label: entity.sector, param: 'sector', value: entity.sector?.toLowerCase().replace(' ', '-') },
          { label: 'Market Architecture', param: null, value: null },
        ];
      case 'technology':
        return [
          { label: entity.category, param: 'category', value: entity.category?.toLowerCase().replace(' ', '-') },
          { label: 'Innovation Node', param: null, value: null },
        ];
      default:
        return [];
    }
  };

  const taxonomyTags = getTaxonomyTags();
  const contentTags = entity.tags || [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary Taxonomy Tags */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest px-1">
          <TagIcon className="h-3 w-3" /> Taxonomy Hubs
        </div>
        <div className="flex flex-wrap gap-2">
          {taxonomyTags.map((tag, idx) => (
            tag.param ? (
              <Link key={idx} href={`/${type}s?${tag.param}=${tag.value}`}>
                <Badge 
                  variant="secondary" 
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-all cursor-pointer rounded-xl font-bold text-[10px] uppercase"
                >
                  {tag.label}
                </Badge>
              </Link>
            ) : (
              <Badge 
                key={idx}
                variant="outline" 
                className="px-3 py-1.5 border-white/10 bg-background/50 text-muted-foreground font-bold text-[10px] uppercase"
              >
                {tag.label}
              </Badge>
            )
          ))}
        </div>
      </div>

      {/* General Metadata Tags */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-1">
          <Hash className="h-3 w-3" /> Metadata Nodes
        </div>
        <div className="flex flex-wrap gap-2">
          {contentTags.map((tag: string) => (
            <Badge 
              key={tag} 
              variant="outline" 
              className="px-2.5 py-1 border-white/5 bg-background/30 text-muted-foreground/70 hover:text-foreground hover:border-white/20 transition-all cursor-default text-[10px] lowercase italic"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* TODO: Connect to AI tagging API for related tags */}
      {/* Example: /api/ai-tags?entity=slug */}
    </div>
  );
};
