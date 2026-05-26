'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { Article } from '../types';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface ArticleCardProps {
  article: Article;
}

/**
 * A sophisticated card component to display article previews in listings.
 */
export const ArticleCard = ({ article }: ArticleCardProps) => {
  return (
    <Link href={`/articles/${article.slug}`} className="group block h-full">
      <Card className="glass-card flex flex-col h-full overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:border-primary/40">
        <div className="relative aspect-video w-full overflow-hidden">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-primary font-bold">
              {article.category}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {article.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 pt-0 flex-grow">
          <Text variant="bodySmall" className="text-muted-foreground line-clamp-3 mb-4">
            {article.description}
          </Text>
        </CardContent>

        <CardFooter className="p-5 pt-0 border-t border-white/5 flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <Text variant="caption">
                {article.publishedAt ? format(new Date(article.publishedAt), 'MMM d, yyyy') : 'Recent'}
              </Text>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <Text variant="caption">{article.readingTime}m</Text>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
        </CardFooter>
      </Card>
    </Link>
  );
};
