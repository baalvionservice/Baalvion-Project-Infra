import React from "react";
import Link from "next/link";
import companiesData from "@/data/companies/companies.json";
import { getAssetQuote } from "@/lib/data/loaders";

const CNBC_RED = "#CC0000"; // matches this site's existing news-template accent, not the /markets section's own palette
const GREEN = "#0a7d3d";

interface TrackedCompany {
  name: string;
  slug: string;
  ticker: string | null;
}

const TRACKED_COMPANIES = (companiesData as TrackedCompany[]).filter((c) => c.ticker);

/** Whole-word, case-insensitive match so e.g. "META" doesn't match inside "metadata". */
function mentionsCompany(text: string, name: string): boolean {
  const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return pattern.test(text);
}

function findMentionedCompanies(searchText: string, max = 3): TrackedCompany[] {
  const matches: TrackedCompany[] = [];
  for (const company of TRACKED_COMPANIES) {
    if (mentionsCompany(searchText, company.name)) {
      matches.push(company);
      if (matches.length >= max) break;
    }
  }
  return matches;
}

/** Server Component — scans the article's own title/tags/excerpt for tracked
 * company names and shows a live quote chip for each match. No new content
 * model needed: this is a text scan against the same companies.json already
 * used by /companies, not a dedicated ticker-tagging field on articles. */
export async function ArticleMarketWidget({ title, tags, excerpt }: { title: string; tags?: string[]; excerpt?: string }) {
  const searchText = [title, ...(tags ?? []), excerpt ?? ""].join(" ");
  const mentioned = findMentionedCompanies(searchText);
  if (mentioned.length === 0) return null;

  const quotes = await Promise.all(mentioned.map((c) => getAssetQuote(c.ticker!)));

  const rows = mentioned
    .map((c, i) => ({ company: c, quote: quotes[i] }))
    .filter((r) => r.quote?.current_price != null);

  if (rows.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-black tracking-widest text-gray-900 uppercase border-b-2 pb-2 mb-4" style={{ borderColor: CNBC_RED }}>
        Related Markets
      </h3>
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
