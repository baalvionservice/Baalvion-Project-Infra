'use client';

import React, { useEffect, useState } from 'react';
import { Article } from '../types';
import { getRelatedArticles } from '../services/content-service';
import { ArticleCard } from './ArticleCard';
import { Grid } from '@/design-system/layout/grid';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';

interface RelatedArticlesProps {
  currentArticleId: string;
  category?: string;
}

/**
 * Component to display related articles at the bottom of an article page.
 */
export const RelatedArticles = ({ currentArticleId, category }: RelatedArticlesProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRelated() {
      try {
        setLoading(true);
        const response = await getRelatedArticles(currentArticleId, category);
        setArticles(response.data);
      } catch (err) {
        console.error('Failed to load related articles', err);
      } finally {
        setLoading(false);
      }
    }

    loadRelated();
  }, [currentArticleId, category]);

  if (loading || articles.length === 0) return null;

  return (
    <Section spacing="md" className="border-t mt-20">
      <div className="mb-10">
        <Text variant="label" className="text-primary mb-2">Discovery Engine</Text>
        <Text variant="h3">Related Intelligence</Text>
        <Text variant="bodySmall" className="text-muted-foreground mt-1">
          Deepen your understanding with these related financial insights.
        </Text>
      </div>

      <Grid columns={{ sm: 1, md: 3 }} gap="lg">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </Grid>
    </Section>
  );
};
