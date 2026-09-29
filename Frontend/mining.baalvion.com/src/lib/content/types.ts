/**
 * @fileOverview Canonical content model for the Baalvion corporate platform.
 *
 * These types are the single source of truth shared by:
 *   - the public frontend pages (quarry, products, licenses, sites, news…)
 *   - the API route handlers under /api/* (CRUD scaffolds)
 *   - a future admin/CMS that populates the data
 *
 * IMPORTANT: No records are fabricated anywhere in the repo. The content store
 * (./store.ts) ships EMPTY; pages render honest empty / "pending company
 * disclosure" states until management supplies real data via the CMS/admin.
 */

export type PublishStatus = 'draft' | 'published' | 'archived';

export interface Seo {
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface MediaAsset {
  url: string;
  alt: string;
  caption?: string;
  kind?: 'image' | 'document' | 'video';
}

/** Office / operational location. */
export interface Location {
  id: string;
  name: string;
  type: 'headquarters' | 'registered-office' | 'mine' | 'quarry' | 'warehouse' | 'office';
  addressLine: string;
  city?: string;
  region?: string;
  country: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  status: PublishStatus;
}

/** A quarry site and its operational profile (all metrics optional → pending). */
export interface QuarrySite {
  id: string;
  name: string;
  slug: string;
  locationId?: string;
  materials: string[];            // category labels only, never invented tonnage
  capabilities: string[];
  productionCapacity?: string;    // e.g. "120,000 TPA" — omit until disclosed
  equipment: string[];
  safetyPrograms: string[];
  environmentalManagement: string[];
  rehabilitation?: string;
  description?: string;
  gallery: MediaAsset[];
  status: PublishStatus;
  seo?: Seo;
}

/** A mine site (mining, distinct from quarry). */
export interface MineSite {
  id: string;
  name: string;
  slug: string;
  locationId?: string;
  minerals: string[];
  capabilities: string[];
  productionCapacity?: string;
  description?: string;
  gallery: MediaAsset[];
  status: PublishStatus;
  seo?: Seo;
}

/** Equipment / fleet item. */
export interface Equipment {
  id: string;
  name: string;
  category: 'extraction' | 'crushing' | 'screening' | 'haulage' | 'loading' | 'drilling' | 'other';
  description?: string;
  siteId?: string;
  image?: MediaAsset;
  status: PublishStatus;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: MediaAsset;
  status: PublishStatus;
  seo?: Seo;
}

export interface ProductSpec {
  label: string;
  value: string;
}

/** A mineral / quarry material / aggregate / stone / construction product. */
export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description?: string;
  specifications: ProductSpec[]; // grade/size etc. expressed as label/value rows
  grade?: string;
  size?: string;
  applications: string[];
  datasheets: MediaAsset[];      // downloadable technical datasheets (when provided)
  gallery: MediaAsset[];
  status: PublishStatus;
  seo?: Seo;
}

export type LicenseKind =
  | 'quarry-license'
  | 'mining-license'
  | 'environmental-clearance'
  | 'government-approval'
  | 'industry-registration'
  | 'corporate-registration'
  | 'iso-certification';

export type LicenseStatus = 'active' | 'pending' | 'expired' | 'renewing' | 'not-disclosed';

/**
 * A license / certification / approval. `number` and `document` are intentionally
 * optional and MUST be left empty unless management supplies the genuine value —
 * the UI never invents license numbers or certificate references.
 */
export interface License {
  id: string;
  kind: LicenseKind;
  title: string;
  authority?: string;            // issuing body, when disclosed
  number?: string;               // NEVER fabricated
  status: LicenseStatus;
  issuedOn?: string;             // ISO date
  expiresOn?: string;            // ISO date — drives expiry tracking
  document?: MediaAsset;         // downloadable certificate, when provided
  publiclyVisible: boolean;      // visibility control
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  category?: string;
  summary?: string;
  locationId?: string;
  stage?: 'planned' | 'in-progress' | 'completed';
  gallery: MediaAsset[];
  status: PublishStatus;
  seo?: Seo;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  body?: string;
  coverImage?: MediaAsset;
  publishedOn?: string;
  status: PublishStatus;
  seo?: Seo;
}

export interface TeamMember {
  id: string;
  name?: string;                 // omitted → "Profile coming soon"
  role: string;
  bio?: string;
  photo?: MediaAsset;
  order: number;
  status: PublishStatus;
}

export interface GalleryItem {
  id: string;
  title: string;
  asset: MediaAsset;
  album?: string;
  status: PublishStatus;
}

/** Aggregate shape of the whole content store (mirrors the would-be DB tables). */
export interface ContentStore {
  locations: Location[];
  quarrySites: QuarrySite[];
  mineSites: MineSite[];
  equipment: Equipment[];
  productCategories: ProductCategory[];
  products: Product[];
  licenses: License[];
  projects: Project[];
  news: NewsArticle[];
  team: TeamMember[];
  gallery: GalleryItem[];
}
