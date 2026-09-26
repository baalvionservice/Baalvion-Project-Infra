import React from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SourcesCitedProps {
  citations: { title: string; url: string }[];
}

/**
 * Imperialpedia Style "VERIFIED SOURCES & REFERENCES" Box.
 * Features:
 * - Thick black border with hard Imperialpedia box shadow
 * - Red banner tag ("IMPERIALPEDIA VERIFIED")
 * - Bulleted citation links with hover underline accents
 */
export const SourcesCited = ({ citations }: SourcesCitedProps) => {
  if (!citations.length) return null;

  return (
    <div className="mt-12 bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)] p-5 rounded-xs relative">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#c8102e]" />
      
      <Accordion type="single" collapsible className="border-0">
        <AccordionItem value="sources" className="border-0">
          <AccordionTrigger className="hover:no-underline py-2 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 -skew-x-6">
                IMPERIALPEDIA VERIFIED
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white font-mono flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#c8102e]" />
                SOURCES &amp; REFERENCES ({citations.length})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-b-2 border-black dark:border-slate-800 pb-3 font-medium">
              Imperialpedia requires researchers and editors to cite primary sources — official platform
              disclosures, SEC regulatory filings, and direct financial data. Learn more in our{' '}
              <Link href="/editorial-policy" className="text-[#c8102e] font-bold hover:underline">
                editorial policy
              </Link>
              .
            </p>
            <ol className="space-y-2 pt-3 pb-1">
              {citations.map((citation, index) => (
                <li key={`${citation.url}-${index}`} className="flex gap-2 text-xs text-slate-900 dark:text-slate-100 font-bold leading-snug">
                  <span className="shrink-0 font-mono text-[#c8102e]">0{index + 1}.</span>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-black dark:text-white hover:text-[#c8102e] hover:underline break-words"
                  >
                    {citation.title}
                    <ExternalLink className="h-3 w-3 shrink-0 text-[#c8102e]" />
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
