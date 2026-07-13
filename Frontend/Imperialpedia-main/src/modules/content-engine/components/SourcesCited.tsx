import React from 'react';
import { Text } from '@/design-system/typography/text';
import { ExternalLink } from 'lucide-react';

interface SourcesCitedProps {
  citations: { title: string; url: string }[];
}

/**
 * "Sources & References" list rendered at the end of an article body — an E-E-A-T trust
 * signal for finance content, editable per-article via the CMS's citations custom field.
 */
export const SourcesCited = ({ citations }: SourcesCitedProps) => {
  if (!citations.length) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <Text variant="h6" className="font-bold uppercase tracking-widest text-muted-foreground mb-4">
        Sources &amp; References
      </Text>
      <ol className="space-y-2">
        {citations.map((citation, index) => (
          <li key={`${citation.url}-${index}`} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
            <span className="shrink-0 font-semibold">{index + 1}.</span>
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 text-primary hover:underline break-words"
            >
              {citation.title}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
};
