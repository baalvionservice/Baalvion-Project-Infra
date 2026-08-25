import React from "react";
import Link from "next/link";
import companiesData from "@/data/companies/companies.json";
import { getAssetQuote } from "@/lib/data/loaders";
import type { EntityMention } from "@/lib/entityLinkInjector";

const CNBC_RED = "#CC0000"; // matches this site's existing news-template accent, not the /markets section's own palette
const GREEN = "#0a7d3d";
const MAX_QUOTE_CHIPS = 3;

export interface TrackedCompany {
  name: string;
  slug: string;
  ticker: string | null;
}

const TRACKED_COMPANIES = (companiesData as TrackedCompany[]).filter((c) => c.ticker);

/**
 * Cross-references the article's already-detected, persisted entity mentions
 * (see src/lib/entityLinkInjector.tsx) against the tracked-company/ticker
 * list, so the sidebar quote widget uses the one real detector (imperialpedia-
 * service's entityMentionDetectionService, full body, aliases-aware) instead
 * of re-scanning title/tags/excerpt itself — this used to be a second,
 * divergent detector.
 */
export function trackedCompaniesFromMentions(mentions: EntityMention[] | undefined, max = MAX_QUOTE_CHIPS): TrackedCompany[] {
  if (!mentions?.length) return [];
  const companySlugs = new Set(mentions.filter((m) => m.entityType === "company").map((m) => m.entitySlug));
  return TRACKED_COMPANIES.filter((c) => companySlugs.has(c.slug)).slice(0, max);
}

/** Server Component — shows a live quote chip for each tracked company the
 * article's persisted entity mentions include. No text scan here anymore:
 * detection already happened once at publish time (see
 * entityMentionDetectionService.js), this just renders the result. */
export async function ArticleMarketWidget({ entityMentions }: { entityMentions?: EntityMention[] }) {
  const mentioned = trackedCompaniesFromMentions(entityMentions);
  if (mentioned.length === 0) return null;

  const quotes = await Promise.all(mentioned.map((c) => getAssetQuote(c.ticker!)));

  const rows = mentioned
    .map((c, i) => ({ company: c, quote: quotes[i] }))
    .filter((r) => r.quote?.current_price != null);

  if (rows.length === 0) return null;

  return (
    <div>
      <h2 className="text-xs font-black tracking-widest text-gray-900 uppercase border-b-2 pb-2 mb-4" style={{ borderColor: CNBC_RED }}>
        Related Markets
      </h2>
      <ul className="space-y-3">
        {rows.map(({ company, quote }) => {
          const price = quote!.current_price!;
          const pct = quote!.change_pct_24h;
          const up = (pct ?? 0) >= 0;
          return (
            <li key={company.slug}>
              <Link href={`/markets/quote/${company.ticker}`} className="flex items-center justify-between group">
                <span className="text-sm font-semibold text-gray-800 group-hover:text-[#CC0000] transition-colors">
                  {company.name}
                </span>
                <span className="flex items-baseline gap-1.5 text-xs font-mono">
                  <span className="text-gray-900 font-semibold tabular-nums">${Number(price).toFixed(2)}</span>
                  {pct != null && (
                    <span className="font-bold tabular-nums" style={{ color: up ? GREEN : CNBC_RED }}>
                      {up ? "▲" : "▼"} {Math.abs(Number(pct)).toFixed(2)}%
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
