import React from 'react';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';

interface EntityHeaderProps {
  name: string;
  type: string;
  tags?: string[];
}

/**
 * Shared Header for Knowledge Entity pages.
 */
export const EntityHeader = ({ name, type, tags }: EntityHeaderProps) => {
  return (
    <div className="space-y-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="uppercase font-bold text-[10px] tracking-widest px-3 py-1 bg-primary/10 text-primary border-primary/20">
          {type}
        </Badge>
      </div>
      <Text variant="h1" className="text-4xl lg:text-7xl font-bold tracking-tight">
        {name}
      </Text>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] border-white/10 uppercase tracking-tighter opacity-60">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
