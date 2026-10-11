import type { Club } from "@/data/clubs-data";

export const SITE = "https://community.marketunderworld.com";

export const slugOf = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export const TYPE_LABEL: Record<string, string> = { pub: "pub", bar: "bar", nightclub: "nightclub", biergarten: "beer garden" };

export interface AreaGroup { name: string; slug: string; clubs: Club[] }
export interface CityGroup { name: string; slug: string; state: string; clubs: Club[]; areas: AreaGroup[] }

export function groupByCity(clubs: Club[]): CityGroup[] {
  const cities = new Map<string, CityGroup>();
  for (const c of clubs) {
    if (!c.city) continue;
    const slug = slugOf(c.city);
    const g = cities.get(slug) ?? { name: c.city, slug, state: c.state, clubs: [], areas: [] };
    g.clubs.push(c);
    cities.set(slug, g);
  }
  for (const g of cities.values()) {
    const areas = new Map<string, AreaGroup>();
    for (const c of g.clubs) {
      if (!c.suburb) continue;
      const slug = slugOf(c.suburb);
      if (!slug) continue;
      const a = areas.get(slug) ?? { name: c.suburb, slug, clubs: [] };
      a.clubs.push(c);
      areas.set(slug, a);
    }
    g.areas = [...areas.values()].sort((a, b) => b.clubs.length - a.clubs.length || a.name.localeCompare(b.name));
  }
  return [...cities.values()].sort((a, b) => b.clubs.length - a.clubs.length);
}

export const typeWord = (c: Club) => TYPE_LABEL[c.venueType ?? ""] ?? "venue";

// schema.org markup for a single venue, using only facts we hold.
export function venueJsonLd(c: Club) {
  const type = c.venueType === "nightclub" ? "NightClub" : c.venueType === "pub" || c.venueType === "bar" ? "BarOrPub" : "LocalBusiness";
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: c.name,
    url: `${SITE}/clubs/venue/${c.id}`,
    address: { "@type": "PostalAddress", streetAddress: c.address || undefined, addressLocality: c.suburb || c.city, addressRegion: c.state, addressCountry: "IN" },
    ...(c.latitude != null && c.longitude != null ? { geo: { "@type": "GeoCoordinates", latitude: c.latitude, longitude: c.longitude } } : {}),
    ...(c.phone ? { telephone: c.phone } : {}),
    ...(c.website ? { sameAs: [c.website] } : {}),
    ...(c.openingHours ? { openingHours: c.openingHours } : {}),
    ...(c.gallery && c.gallery.length > 0 || c.image ? { image: [c.image, ...(c.gallery ?? []).map((g) => g.url)].filter(Boolean) } : {}),
    ...(c.priceRange ? { priceRange: c.priceRange } : {}),
    ...(c.about || c.description ? { description: (c.about || c.description || "").slice(0, 500) } : {}),
  };
}

export function faqJsonLd(c: Club) {
  const items = (c.faqs ?? []).filter((f) => f.q && f.a);
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function itemListJsonLd(name: string, clubs: Club[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: clubs.length,
    itemListElement: clubs.slice(0, 50).map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/clubs/venue/${c.id}`, name: c.name })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: `${SITE}${t.path}` })),
  };
}
