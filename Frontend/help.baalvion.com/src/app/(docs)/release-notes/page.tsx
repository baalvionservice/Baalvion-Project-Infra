import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';

const PATH = '/release-notes';

export const metadata: Metadata = {
  title: 'Release Notes',
  description: 'Feature updates, bug fixes, and improvements to the Baalvion trade platform.',
};

interface Release {
  version: string;
  date: string;
  entries: { type: 'feature' | 'fix' | 'improvement'; text: string }[];
}

const RELEASES: Release[] = [
  {
    version: '2026.07',
    date: 'July 2026',
    entries: [
      { type: 'feature', text: 'Added task-level approval history to the Trade Agent dashboard.' },
      { type: 'improvement', text: 'Faster search results across orders and listings.' },
      { type: 'fix', text: 'Fixed a rare issue where notification preferences reset after a password change.' },
    ],
  },
  {
    version: '2026.06',
    date: 'June 2026',
    entries: [
      { type: 'feature', text: 'Introduced webhook support for order and task events.' },
      { type: 'improvement', text: 'Listing availability updates now reflect on the buyer dashboard in real time.' },
      { type: 'fix', text: 'Corrected pagination on the Reports API for date ranges spanning a month boundary.' },
    ],
  },
  {
    version: '2026.05',
    date: 'May 2026',
    entries: [
      { type: 'feature', text: 'Launched the Baalvion API (v1), including Orders, Listings, and Users endpoints.' },
      { type: 'improvement', text: 'Reworked the seller dashboard fulfillment view for clearer status tracking.' },
      { type: 'fix', text: 'Fixed an issue where trade agents could see tasks from unassigned trades in search results.' },
    ],
  },
];

const BADGE: Record<Release['entries'][number]['type'], string> = {
  feature: 'bg-accent/10 text-accent-strong',
  improvement: 'bg-ok/10 text-ok',
  fix: 'bg-warn/10 text-warn',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Release Notes"
      description="What shipped, and when — new features, improvements, and fixes to the trade platform."
    >
      <div className="not-prose flex flex-col gap-10">
        {RELEASES.map((release) => (
          <section key={release.version}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-display text-xl font-semibold text-foreground">{release.version}</h2>
              <span className="text-sm text-muted-2">{release.date}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {release.entries.map((entry, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3">
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold capitalize ${BADGE[entry.type]}`}>
                    {entry.type}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">{entry.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DocPage>
  );
}
