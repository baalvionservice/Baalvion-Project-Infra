'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagListProps {
  tags: string[];
  className?: string;
}

/**
 * A reusable component to display a collection of article tags as badges.
 */
export const TagList = ({ tags, className }: TagListProps) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="text-[10px] py-1 px-2 border-primary/20"
        >
          <TagIcon className="w-2.5 h-2.5 mr-1 text-primary/60" />
          {tag}
        </Badge>
      ))}
    </div>
  );
};
