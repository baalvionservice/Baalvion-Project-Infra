import React from 'react';
import Link from 'next/link';

export interface PrimarySource {
  label: string;
  url?: string;
}

/**
 * Collapsed-by-default "Article Sources" disclosure -- the site's one
 * canonical source-crediting panel for a legal guide, replacing any inline
 * "Sources & Further Reading" prose that used to live in the article body
 * itself. Only renders entries the article data actually carries; see the
 * `primarySources` doc comment on LawArticle for the no-fabrication rule
 * this depends on (each url verified to exist before being added).
 */
export function PrimarySources({ sources }: { sources?: PrimarySource[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="article-sources">
      <details>
        <summary>Article Sources</summary>
        <p className="article-sources-intro">
          Law Elite Network requires writers to cite primary, official sources — legislation, court
          decisions, and regulator or institutional publications — for the claims in this guide.
          Read more about our standards in the{' '}
          <Link href="/editorial-process" className="text-blue-700 hover:text-blue-900 underline underline-offset-2">
            editorial process
          </Link>
          .
        </p>
        <ol>
          {sources.map((source, i) => (
            <li key={i}>
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
      </details>
    </div>
  );
}
