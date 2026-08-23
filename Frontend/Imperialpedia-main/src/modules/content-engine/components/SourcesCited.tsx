import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SourcesCitedProps {
  citations: { title: string; url: string }[];
}

/**
 * "Sources & References" — an E-E-A-T trust signal for finance content,
 * editable per-article via the CMS's citations custom field. Collapsed by
 * default behind a small click-to-open trigger rather than an always-open
 * list, so it doesn't compete with the article body for attention.
 */
export const SourcesCited = ({ citations }: SourcesCitedProps) => {
  if (!citations.length) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <Accordion type="single" collapsible className="border rounded-lg px-3">
        <AccordionItem value="sources" className="border-0">
          <AccordionTrigger className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:no-underline py-2.5">
            Sources &amp; References
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              Imperialpedia requires writers to cite primary sources — government data, regulatory
              filings, and original reporting — to support the facts in this article. Learn more about
              our standards in our{' '}
              <Link href="/editorial-policy" className="text-primary hover:underline font-medium">
                editorial policy
              </Link>
              .
            </p>
            <ol className="space-y-1.5 pt-3 pb-1">
              {citations.map((citation, index) => (
                <li key={`${citation.url}-${index}`} className="flex gap-1.5 text-xs text-muted-foreground leading-snug">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
