// ─── Index Names ─────────────────────────────────────────────────────────────

export const INDICES = {
  JOBS:      'baalvion_jobs',
  ARTICLES:  'baalvion_articles',
  PRODUCTS:  'baalvion_products',
  COMPANIES: 'baalvion_companies',
  CREATORS:  'baalvion_creators',
  // Logistics Core Foundation (trade-service, Phase 4).
  SHIPMENTS:  'baalvion_shipments',
  CONTAINERS: 'baalvion_containers',
} as const;

export type IndexName = (typeof INDICES)[keyof typeof INDICES];

// ─── Field Mappings ───────────────────────────────────────────────────────────

/**
 * Mapping definitions for each index.
 * Used by createIndex() in sync.ts during bootstrap.
 */
export const INDEX_MAPPINGS: Record<IndexName, object> = {
  [INDICES.JOBS]: {
    properties: {
      title:       { type: 'text',    analyzer: 'english', fields: { keyword: { type: 'keyword' } } },
      description: { type: 'text',    analyzer: 'english' },
      location:    { type: 'text',    fields: { keyword: { type: 'keyword' } } },
      skills:      { type: 'keyword' },
      salary: {
        properties: {
          min:      { type: 'float' },
          max:      { type: 'float' },
          currency: { type: 'keyword' },
        },
      },
      company:     { type: 'keyword' },
      postedAt:    { type: 'date' },
      isActive:    { type: 'boolean' },
      orgId:       { type: 'keyword' },
    },
  },

  [INDICES.ARTICLES]: {
    properties: {
      title:       { type: 'text', analyzer: 'english', fields: { keyword: { type: 'keyword' } } },
      content:     { type: 'text', analyzer: 'english' },
      category:    { type: 'keyword' },
      author:      { type: 'keyword' },
      tags:        { type: 'keyword' },
      publishedAt: { type: 'date' },
      isPublished: { type: 'boolean' },
      orgId:       { type: 'keyword' },
    },
  },

  [INDICES.PRODUCTS]: {
    properties: {
      name:        { type: 'text', analyzer: 'english', fields: { keyword: { type: 'keyword' } } },
      description: { type: 'text', analyzer: 'english' },
      category:    { type: 'keyword' },
      price:       { type: 'float' },
      sku:         { type: 'keyword' },
      stockLevel:  { type: 'integer' },
      isActive:    { type: 'boolean' },
      orgId:       { type: 'keyword' },
    },
  },

  [INDICES.COMPANIES]: {
    properties: {
      name:        { type: 'text', analyzer: 'english', fields: { keyword: { type: 'keyword' } } },
      industry:    { type: 'keyword' },
      location:    { type: 'text', fields: { keyword: { type: 'keyword' } } },
      size:        { type: 'keyword' }, // e.g. "1-10", "11-50", "51-200"
      description: { type: 'text', analyzer: 'english' },
      isVerified:  { type: 'boolean' },
      orgId:       { type: 'keyword' },
    },
  },

  [INDICES.CREATORS]: {
    properties: {
      name:      { type: 'text', analyzer: 'english', fields: { keyword: { type: 'keyword' } } },
      bio:       { type: 'text', analyzer: 'english' },
      skills:    { type: 'keyword' },
      platforms: { type: 'keyword' },
      rates: {
        properties: {
          hourly:   { type: 'float' },
          project:  { type: 'float' },
          currency: { type: 'keyword' },
        },
      },
      isAvailable: { type: 'boolean' },
      orgId:       { type: 'keyword' },
    },
  },

  [INDICES.SHIPMENTS]: {
    properties: {
      shipmentNo:         { type: 'keyword' },
      trackingNumber:     { type: 'keyword' },
      status:             { type: 'keyword' },
      mode:               { type: 'keyword' },
      carrierName:        { type: 'text', fields: { keyword: { type: 'keyword' } } },
      originCountry:      { type: 'keyword' },
      destinationCountry: { type: 'keyword' },
      originPort:         { type: 'text', fields: { keyword: { type: 'keyword' } } },
      destinationPort:    { type: 'text', fields: { keyword: { type: 'keyword' } } },
      estimatedArrival:   { type: 'date' },
      tenantId:           { type: 'keyword' },
      orgId:              { type: 'keyword' },
    },
  },

  [INDICES.CONTAINERS]: {
    properties: {
      containerNumber: { type: 'keyword' },
      isoCode:         { type: 'keyword' },
      containerType:   { type: 'keyword' },
      status:          { type: 'keyword' },
      currentLocation: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      shipmentId:      { type: 'keyword' },
      tenantId:        { type: 'keyword' },
      orgId:           { type: 'keyword' },
    },
  },
};

// ─── Document Shape Interfaces ────────────────────────────────────────────────

export interface JobDocument {
  title:       string;
  description: string;
  location:    string;
  skills:      string[];
  salary?:     { min?: number; max?: number; currency?: string };
  company:     string;
  postedAt:    string; // ISO-8601
  isActive:    boolean;
  orgId:       string;
}

export interface ArticleDocument {
  title:       string;
  content:     string;
  category:    string;
  author:      string;
  tags:        string[];
  publishedAt: string; // ISO-8601
  isPublished: boolean;
  orgId:       string;
}

export interface ProductDocument {
  name:        string;
  description: string;
  category:    string;
  price:       number;
  sku:         string;
  stockLevel:  number;
  isActive:    boolean;
  orgId:       string;
}

export interface CompanyDocument {
  name:        string;
  industry:    string;
  location:    string;
  size:        string;
  description: string;
  isVerified:  boolean;
  orgId:       string;
}

export interface CreatorDocument {
  name:        string;
  bio:         string;
  skills:      string[];
  platforms:   string[];
  rates?:      { hourly?: number; project?: number; currency?: string };
  isAvailable: boolean;
  orgId:       string;
}

// ─── Logistics Core Foundation (trade-service, Phase 4) ──────────────────────

export interface ShipmentDocument {
  shipmentNo:          string;
  trackingNumber:      string | null;
  status:               string;
  mode:                 string | null;
  carrierName:          string | null;
  originCountry:        string | null;
  destinationCountry:   string | null;
  originPort:           string | null;
  destinationPort:      string | null;
  estimatedArrival:     string | null; // ISO-8601
  tenantId:             string;
  orgId:                string;
}

export interface ContainerDocument {
  containerNumber: string;
  isoCode:         string | null;
  containerType:   string;
  status:          string;
  currentLocation: string | null;
  shipmentId:      string | null;
  tenantId:        string;
  orgId:           string;
}
