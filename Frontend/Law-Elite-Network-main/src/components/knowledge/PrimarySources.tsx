import React from 'react';
import { Landmark, ExternalLink } from 'lucide-react';

export interface PrimarySource {
  label: string;
  url?: string;
}

/**
 * Structured, checkable-source panel for a legal guide -- distinct from any
 * inline "Sources & Further Reading" prose in the article body itself. Only
 * renders entries the article data actually carries; see the `primarySources`
 * doc comment on LawArticle for the no-fabrication rule this depends on.
 */
export function PrimarySources({ sources }: { sources?: PrimarySource[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="w-4 h-4 text-blue-600" aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Primary Sources</span>
      </div>
      <ul className="space-y-2.5">
        {sources.map((source, i) => (
          <li key={i} className="text-[14px] leading-relaxed text-slate-700">
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-start gap-1.5 text-blue-700 hover:text-blue-900 hover:underline underline-offset-2 transition-colors"
              >
                <span>{source.label}</span>
                <ExternalLink className="w-3 h-3 mt-1 shrink-0" aria-hidden="true" />
              </a>
            ) : (
              <span>{source.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
