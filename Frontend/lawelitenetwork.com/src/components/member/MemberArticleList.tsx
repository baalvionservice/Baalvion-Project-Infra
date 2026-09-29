import React from 'react';
import { StoryCard } from '@/components/knowledge/news/StoryCard';

export function MemberArticleList({ articles }: { articles: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
      {articles.map((a) => (
        <StoryCard key={a.slug} article={a} />
      ))}
    </div>
  );
}
