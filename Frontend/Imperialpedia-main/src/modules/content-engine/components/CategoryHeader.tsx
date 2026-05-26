'use client';

import React from 'react';
import { Category } from '../types/category';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

interface CategoryHeaderProps {
  category: Category;
}

/**
 * Renders the header for a category archive page.
 */
export const CategoryHeader = ({ category }: CategoryHeaderProps) => {
  return (
    <header className="mb-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <Badge variant="outline" className="text-primary border-primary/30">
          Taxonomy Archive
        </Badge>
      </div>
      
      <Text variant="h1" className="mb-4 text-4xl lg:text-6xl font-bold">
        {category.name}
      </Text>
      
      <Text variant="body" className="text-muted-foreground text-lg mb-6 leading-relaxed">
        {category.description}
      </Text>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 w-fit px-4 py-2 rounded-full border">
        <span className="font-bold text-foreground">{category.articleCount}</span>
        <span>published articles in this category</span>
      </div>
    </header>
  );
};
