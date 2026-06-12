/**
 * @fileOverview Content provider for the corporate platform.
 *
 * This is the seam between the frontend and the eventual persistence layer
 * (database + admin/CMS). It currently returns an EMPTY, real-data-free store
 * so every page renders honest empty / "pending company disclosure" states —
 * nothing is fabricated.
 *
 * To go live, replace `loadStore()` with a real source (DB query, central CMS
 * fetch, etc.). The function is async so swapping in I/O requires no call-site
 * changes. All getters degrade gracefully to empty arrays.
 *
 * Verified company facts (the ONLY hard data we publish) live in `companyFacts`.
 */

import type {
  ContentStore,
  License,
  LicenseKind,
  Location,
  MineSite,
  NewsArticle,
  Product,
  ProductCategory,
  Project,
  QuarrySite,
  Equipment,
  GalleryItem,
  TeamMember,
} from './types';

/** The only verified, publishable corporate facts. */
export const companyFacts = {
  brand: 'Baalvion Mining Inc.',
  legalName: 'Baalvion Industries Private Limited',
  cin: 'U43121OD2025PTC048479',
  incorporated: '2025',
  phone: '+91 89512 84770',
  emails: {
    trade: 'trade@baalvion.com',
    investors: 'investors@baalvion.com',
    careers: 'careers@baalvion.com',
    procurement: 'procurement@baalvion.com',
    media: 'media@baalvion.com',
  },
  headquarters:
    'Altamount Road, Lodha Altamount, Mumbai, Maharashtra – 400026, India',
  registeredOffice:
    'C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha – 764036, India',
} as const;

/** Empty store — populated by the admin/CMS in production. No fabricated rows. */
const EMPTY_STORE: ContentStore = {
  locations: [],
  quarrySites: [],
  mineSites: [],
  equipment: [],
  productCategories: [],
  products: [],
  licenses: [],
  projects: [],
  news: [],
  team: [],
  gallery: [],
};

/**
 * Loads the content store. Swap this body for a DB/CMS read in production.
 * TODO(platform): wire to Postgres (see docs/PLATFORM_ARCHITECTURE.md schema)
 * or the central Baalvion CMS. Must keep returning a ContentStore shape.
 */
export async function loadStore(): Promise<ContentStore> {
  return EMPTY_STORE;
}

/** Only published records are ever shown publicly. */
function published<T extends { status: string }>(rows: T[]): T[] {
  return rows.filter((r) => r.status === 'published');
}

// ── Public, read-only getters used by pages ─────────────────────────────────
export async function getQuarrySites(): Promise<QuarrySite[]> {
  return published((await loadStore()).quarrySites);
}
export async function getQuarrySite(slug: string): Promise<QuarrySite | null> {
  return (await getQuarrySites()).find((q) => q.slug === slug) ?? null;
}
export async function getMineSites(): Promise<MineSite[]> {
  return published((await loadStore()).mineSites);
}
export async function getEquipment(): Promise<Equipment[]> {
  return published((await loadStore()).equipment);
}
export async function getProductCategories(): Promise<ProductCategory[]> {
  return published((await loadStore()).productCategories);
}
export async function getProducts(): Promise<Product[]> {
  return published((await loadStore()).products);
}
export async function getProduct(slug: string): Promise<Product | null> {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const store = await loadStore();
  const cat = store.productCategories.find((c) => c.slug === categorySlug && c.status === 'published');
  if (!cat) return [];
  return published(store.products).filter((p) => p.categoryId === cat.id);
}
/** Publicly-visible licenses only (respects per-record visibility control). */
export async function getPublicLicenses(): Promise<License[]> {
  return (await loadStore()).licenses.filter((l) => l.publiclyVisible);
}
export async function getLicensesByKind(kind: LicenseKind): Promise<License[]> {
  return (await getPublicLicenses()).filter((l) => l.kind === kind);
}
export async function getProjects(): Promise<Project[]> {
  return published((await loadStore()).projects);
}
export async function getNews(): Promise<NewsArticle[]> {
  return published((await loadStore()).news);
}
export async function getNewsArticle(slug: string): Promise<NewsArticle | null> {
  return (await getNews()).find((n) => n.slug === slug) ?? null;
}
export async function getTeam(): Promise<TeamMember[]> {
  return published((await loadStore()).team).sort((a, b) => a.order - b.order);
}
export async function getGallery(): Promise<GalleryItem[]> {
  return published((await loadStore()).gallery);
}
export async function getLocations(): Promise<Location[]> {
  return published((await loadStore()).locations);
}
