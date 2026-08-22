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
  tags?: string[];
  categorySlug?: string;
}

/**
 * Component to display related articles at the bottom of an article page.
 * Ranked by topic (shared category + tags) — see getRelatedArticles. Shows
 * every topic match, however many that is — not capped to a fixed count.
 */
export const RelatedArticles = ({ currentArticleId, category, tags, categorySlug }: RelatedArticlesProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRelated() {
      try {
        setLoading(true);
        const response = await getRelatedArticles(currentArticleId, category, tags, categorySlug);
        setArticles(response.data);
      } catch (err) {
        console.error('Failed to load related articles', err);
      } finally {
        setLoading(false);
      }
    }

    loadRelated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentArticleId, category, categorySlug, tags?.join(',')]);

  if (loading || articles.length === 0) return null;

  return (
    <Section spacing="md" className="border-t mt-20">
      <div className="mb-10">
        <Text variant="h3">Related Articles</Text>
      </div>

      <Grid columns={{ sm: 1, md: 2, lg: 4 }} gap="lg">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </Grid>
    </Section>
  );
};
