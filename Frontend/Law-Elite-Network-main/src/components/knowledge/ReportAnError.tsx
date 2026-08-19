import React from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';

/**
 * Per-article link into the network's real, existing corrections inbox (see
 * /corrections) -- prefilled with the article's title and URL rather than
 * standing up a new backend form. Keeps the site-wide corrections policy as
 * the single source of truth; this is just a shortcut into it from the
 * article the reader is actually looking at.
 */
export function ReportAnError({ title, url }: { title: string; url: string }) {
  const subject = encodeURIComponent(`Correction request: ${title}`);
  const body = encodeURIComponent(`Article: ${title}\nURL: ${url}\n\nWhat looks wrong:\n`);

  return (
    <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-3">
      <a
        href={`mailto:corrections@lawelitenetwork.com?subject=${subject}&body=${body}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-news-600 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" aria-hidden="true" /> Report an error in this guide
      </a>
      <Link
        href="/editorial-process"
        className="text-[12px] font-semibold text-slate-500 hover:text-news-600 transition-colors"
      >
        How we publish and review legal education
      </Link>
    </div>
  );
}
