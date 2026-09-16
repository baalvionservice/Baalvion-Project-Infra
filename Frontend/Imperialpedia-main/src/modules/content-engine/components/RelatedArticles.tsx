import React from 'react';
import { Article } from '../types';
import { ArticleCard } from './ArticleCard';
import { Grid } from '@/design-system/layout/grid';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';

interface RelatedArticlesProps {
  articles: Article[];
}

/**
 * Displays related articles at the bottom of an article page. Ranked by topic
 * (shared category + tags) — see getRelatedArticles, which now runs
 * server-side (article-detail.tsx) rather than as a client-side fetch: the
 * CMS's public delivery API only allow-lists server origins for CORS (see
 * cms-public.ts), so fetching this from the browser either fails outright or
 * burns a 400ms+1200ms retry sequence for nothing, and it kept related-article
 * links out of the initial HTML entirely, invisible to non-JS crawlers.
 */
export const RelatedArticles = ({ articles }: RelatedArticlesProps) => {
  if (articles.length === 0) return null;

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
