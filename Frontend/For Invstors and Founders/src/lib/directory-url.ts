// Every directory URL is built here — links, breadcrumbs, canonicals, structured data and the
// sitemap all call these. When they're built ad hoc in each component they drift, and a canonical
// that disagrees with the link pointing at it is an indexing bug that's invisible in the UI.

type HasSlug = { id: string; slug?: string | null; firm?: string | null; name?: string | null; company_name?: string | null; full_name?: string | null };

const slugify = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// "ascend-angels-9d928143" — readable, and the 8-char id suffix is what the API resolves by,
// so renaming a firm changes the URL without breaking the old one.
const entitySlug = (e: HasSlug, label: string | null | undefined) =>
  e.slug || `${slugify(label || "profile") || "profile"}-${String(e.id).slice(0, 8)}`;

export const investorPath = (i: HasSlug) => `/investors/${entitySlug(i, i.firm || i.name)}`;
export const founderPath = (f: HasSlug) => `/founders/${entitySlug(f, f.company_name || f.full_name)}`;

// A member's own profile — a different record type from a company compiled from filings, so it
// gets a different URL space rather than sharing /founders and hoping the ids never collide.
export const memberPath = (m: HasSlug) => `/members/${entitySlug(m, m.company_name || m.full_name)}`;

// Form D gives a person no identifier, so the name is the address. Two people sharing a name
// share a page; the affiliation list makes that visible instead of merging them into one person.
export const personPath = (name: string) => `/people/${slugify(name)}`;

// Facet pages: "biotech companies in San Francisco" is the query founders actually type, and it
// had no URL — sector and type lived only in the query string, which search engines treat as the
// same page. "type" and "sector" are safe path markers because an entity slug always ends in
// -<8 hex>, so these can never collide with a profile URL.
export const facetPath = (
  base: "investors" | "founders",
  facet: string,
  { country, state, city }: { country?: string; state?: string; city?: string } = {},
) => {
  const marker = base === "investors" ? "type" : "sector";
  const head = `/${base}/${marker}/${slugify(facet)}`;
  if (!country) return head;
  return `${head}/in/${[country, state, city].filter(Boolean).join("/")}`;
};

export const placePath = (
  base: "investors" | "founders",
  { country, state, city }: { country?: string; state?: string; city?: string } = {},
) => {
  if (!country) return `/${base}`;
  const parts = [country, state, city].filter(Boolean);
  return `/${base}/in/${parts.join("/")}`;
};

// Slugs are lower-case; headings and breadcrumbs are not. Small words stay lower-case the way
// place names are actually written ("Isle of Man", not "Isle Of Man").
const MINOR = new Set(["of", "and", "the", "in", "on", "da", "de", "del", "du", "van", "von"]);
export const titleCasePlace = (slug: string) =>
  slug.split("-").map((w, i) => (i > 0 && MINOR.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
