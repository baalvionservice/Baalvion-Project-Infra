import React from 'react';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/components/ui/Section';

interface EntityEditorialOverviewProps {
  entityName: string;
  overview?: string;
}

/**
 * Long-form "About" section for Knowledge Entities — distinct from EntityOverview's
 * single pull-quote-style paragraph, which was never meant to hold real
 * article-length depth. Renders nothing when the entity has no editorial
 * overview yet, rather than showing an empty section.
 */
export const EntityEditorialOverview = ({ entityName, overview }: EntityEditorialOverviewProps) => {
  const paragraphs = (overview ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!paragraphs.length) return null;

  return (
    <Section title={`About ${entityName}`} className="animate-in fade-in duration-1000 delay-300">
      <div className="space-y-5 max-w-3xl">
        {paragraphs.map((paragraph, i) => (
          <Text key={i} variant="body" className="text-base leading-relaxed text-foreground/90">
            {paragraph}
          </Text>
        ))}
      </div>
    </Section>
  );
};
