'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { ArrowRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntityListItemProps {
  name: string;
  type: string;
  category: string;
  description: string;
  slug: string;
  className?: string;
}

/**
 * A refined list item component for knowledge entities.
 */
export const EntityListItem = ({ name, type, category, description, slug, className }: EntityListItemProps) => {
  const route = `/${type}s/${slug}`;

  return (
    <Link href={route} className={cn("group block", className)}>
      <Card className="glass-card h-full transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:border-primary/40 overflow-hidden">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
              <Layers size={18} />
            </div>
            <Badge variant="secondary" className="bg-background/50 border-white/10 text-[10px] font-bold uppercase tracking-widest">
              {category}
            </Badge>
          </div>
          
          <div className="space-y-2 mb-4 flex-grow">
            <Text variant="h4" className="group-hover:text-primary transition-colors">
              {name}
            </Text>
            <Text variant="bodySmall" className="text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </Text>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all uppercase tracking-widest pt-4 border-t border-white/5">
            Audit Node <ArrowRight size={14} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
