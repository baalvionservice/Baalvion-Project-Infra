import React from 'react';
import Link from 'next/link';
import { classifySources } from '@/lib/sources-classify';

export interface PrimarySource {
  label: string;
  url?: string;
}

const GROUPS: { key: 'primaryLegislation' | 'courtDecisions' | 'governmentSources' | 'regulators' | 'other'; label: string }[] = [
  { key: 'primaryLegislation', label: 'Primary legislation' },
  { key: 'courtDecisions', label: 'Court decision' },
  { key: 'governmentSources', label: 'Government source' },
  { key: 'regulators', label: 'Official regulator' },
  { key: 'other', label: 'Other sources' },
];

/**
 * The site's one canonical source-crediting section for a legal guide --
 * collapsed by default, opened on click. Categorized via classifySources()
 * into the buckets legal-YMYL readers expect. Only renders entries the
 * article data actually carries; see the `primarySources` doc comment on
 * LawArticle for the no-fabrication rule this depends on (each url verified
 * to exist before being added).
 */
export function PrimarySources({ sources }: { sources?: PrimarySource[] }) {
  if (!sources || sources.length === 0) return null;

  const grouped = classifySources(sources);

  return (
    <section id="sources" className="article-sources scroll-mt-32">
      <details>
        <summary>Sources</summary>
        <p className="article-sources-intro">
          Law Elite Network requires writers to cite primary, official sources — legislation, court
          decisions, and regulator or institutional publications — for the claims in this guide.
          Read more about our standards in the{' '}
          <Link href="/editorial-process" className="text-blue-700 hover:text-blue-900 underline underline-offset-2">
            editorial process
          </Link>
          .
        </p>
        <div className="space-y-6 mt-6">
          {GROUPS.map(({ key, label }) => {
            const entries = grouped[key];
            if (entries.length === 0) return null;
            return (
              <div key={key}>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">{label}</h3>
                <ol className="space-y-1.5">
                  {entries.map((source, i) => (
                    <li key={i} className="text-[14px] leading-relaxed">
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-blue-700 hover:text-blue-900 hover:underline underline-offset-2 transition-colors"
                        >
                          {source.label}
                        </a>
                      ) : (
                        source.label
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
