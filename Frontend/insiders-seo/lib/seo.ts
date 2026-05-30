import type { Investor, Founder } from "./api";

export const sectorSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const titleCase = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Distinct, slugged sectors across all investors (drives the programmatic /investors/sector/[sector] hubs).
export function sectorsFrom(investors: Investor[]): { sector: string; slug: string; count: number }[] {
  const map = new Map<string, { sector: string; slug: string; count: number }>();
  for (const inv of investors) {
    for (const s of inv.focus_sectors || []) {
      const slug = sectorSlug(s);
      if (!slug) continue;
      const cur = map.get(slug);
      if (cur) cur.count += 1;
      else map.set(slug, { sector: s, slug, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export const investorsInSector = (investors: Investor[], slug: string) =>
  investors.filter((i) => (i.focus_sectors || []).some((s) => sectorSlug(s) === slug));

export const usd = (n?: number | null) =>
  n == null ? null : n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M` : n >= 1_000 ? `$${Math.round(n / 1_000)}K` : `$${n}`;

export const investorTitle = (i: Investor) =>
  `${i.firm || i.name}${i.firm && i.name ? ` — ${i.name}` : ""} | ${(i.focus_sectors || []).slice(0, 3).join(", ") || "Active"} investor`;

export const investorDesc = (i: Investor) => {
  const stages = (i.stages || []).join(", ");
  const sectors = (i.focus_sectors || []).slice(0, 4).join(", ");
  return (
    i.thesis?.slice(0, 150) ||
    `${i.firm || i.name} is an active ${i.firm_type || ""} investor${sectors ? ` in ${sectors}` : ""}${stages ? ` at ${stages}` : ""}. See recent investments and connect on Baalvion.`
  );
};

export const founderTitle = (f: Founder) =>
  `${f.company_name || f.full_name}${f.sector ? ` — ${f.sector}` : ""}${f.stage ? ` (${f.stage}) raising` : ""}`;

export const founderDesc = (f: Founder) =>
  (f.headline || f.company_about || f.bio || `${f.company_name} is raising on Baalvion.`)?.slice(0, 155);
