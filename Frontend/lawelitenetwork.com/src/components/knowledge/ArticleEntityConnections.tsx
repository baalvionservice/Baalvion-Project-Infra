import React from 'react';
import Link from 'next/link';
import { User, Clapperboard, Gavel, Landmark, Shield, Trophy, Globe2, Tag, type LucideIcon } from 'lucide-react';
import type { ResolvedEntityReference } from '@/lib/entity-reference-resolver';
import type { EntityType } from '@/types/entity-tagging';

const TYPE_META: Record<EntityType, { label: string; icon: LucideIcon }> = {
  person: { label: 'People', icon: User },
  entertainment: { label: 'Entertainment', icon: Clapperboard },
  'legal-case': { label: 'Legal Cases', icon: Gavel },
  court: { label: 'Courts', icon: Landmark },
  'sports-team': { label: 'Teams', icon: Shield },
  'sports-competition': { label: 'Competitions', icon: Trophy },
  country: { label: 'Countries', icon: Globe2 },
  topic: { label: 'Topics', icon: Tag },
  'video-show': { label: 'Shows', icon: Clapperboard },
  'show-person': { label: 'Show people', icon: User },
};

/**
 * Renders an article's automatically detected entity connections (see
 * @/lib/entity-mentions.ts) — e.g. "Actor X faces legal dispute" showing
 * Actor X → Legal Case → Lawyer → Court → Country → Legal Topic. Nothing
 * here is editor-curated: this is exactly the same connection list that
 * makes the article show up on each of those entities' own pages.
 */
export function ArticleEntityConnections({ entities }: { entities: ResolvedEntityReference[] }) {
  if (entities.length === 0) return null;

  const grouped = new Map<EntityType, ResolvedEntityReference[]>();
  entities.forEach((e) => {
    const list = grouped.get(e.entityType) || [];
    list.push(e);
    grouped.set(e.entityType, list);
  });

  return (
    <section className="border border-slate-200 rounded-lg p-5" aria-label="Article connections">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">Connections</h3>
      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([type, refs]) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          return (
            <div key={type} className="flex flex-wrap items-start gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500 uppercase tracking-tight shrink-0 pt-1">
                <Icon className="w-3.5 h-3.5" /> {meta.label}:
              </span>
              <div className="flex flex-wrap gap-2">
                {refs.map((ref) => (
                  <Link
                    key={`${ref.entityType}:${ref.slug}`}
                    href={ref.url}
                    className="text-[13px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1 transition-colors"
                  >
                    {ref.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
