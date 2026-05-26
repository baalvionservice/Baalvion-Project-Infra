'use client';

import React from 'react';
import { ContentSection } from '../types';
import { ArticleSection } from './ArticleSection';

interface ArticleBodyProps {
  sections: ContentSection[];
}

/**
 * Orchestrates the rendering of all sections within an article.
 */
export const ArticleBody = ({ sections }: ArticleBodyProps) => {
  // Sort sections by order to ensure correct display
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="article-body max-w-none">
      {sortedSections.map((section) => (
        <ArticleSection key={section.id} section={section} />
      ))}
    </div>
  );
};
