'use client';

import React from 'react';
import { Text } from '@/design-system/typography/text';
import { ContentSection } from '../types';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { slugify } from '../utils/slugify';

interface ArticleSectionProps {
  section: ContentSection;
}

/**
 * Renders a complete article section, including its title and nested content blocks.
 */
export const ArticleSection = ({ section }: ArticleSectionProps) => {
  const sectionId = section.title ? slugify(section.title) : undefined;

  return (
    <section className="mb-12 scroll-mt-24">
      {section.title && (
        <Text variant="h2" as="h2" id={sectionId} className="mb-6 border-b pb-2 scroll-mt-24">
          {section.title}
        </Text>
      )}
      <div className="space-y-4">
        {section.blocks.map((block) => (
          <ContentBlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
};
