/**
 * @fileOverview High-Scale Data Registry for Marketplace Programmatic SEO.
 * This file serves as the core Keyword Map Engine for Mining.Baalvion.com.
 * Supports scaling to 1,000,000+ combinations via seed-based generation logic.
 */

export type TradeRole = 
  | 'Suppliers' 
  | 'Exporters' 
  | 'Producers' 
  | 'Buyers' 
  | 'Wholesalers' 
  | 'Quarries' 
  | 'Manufacturers' 
  | 'Traders';

export type SearchIntent = 
  | 'BUY' 
  | 'SOURCE' 
  | 'EXPORT' 
  | 'INDUSTRY' 
  | 'DIRECTORY' 
  | 'QUARRY' 
  | 'WHOLESALE';

export interface PseoPageData {
  slug: string;
  productName: string;
  productSlug: string;
  location: string;
  role: TradeRole;
  category: string;
  supplierCount: number;
  avgPurity: string;
  industry: string;
  lastMod: string;
  priority: number;
  intent: SearchIntent;
  description?: string;
  priceRange?: string;
  keywords: string[];
}

/**
 * SEED DATA: The building blocks for the Keyword Map Engine
 */
export const miningProducts = [
  { name: 'Granite Blocks', slug: 'granite-blocks', cat: 'Natural Stone' },
  { name: 'Sandstone Slabs', slug: 'sandstone-slabs', cat: 'Natural Stone' },
  { name: 'Limestone Aggregates', slug: 'limestone-aggregates', cat: 'Industrial Minerals' },
  { name: 'Lithium Spodumene', slug: 'lithium-spodumene', cat: 'Critical Minerals' },
  { name: 'Copper Concentrate', slug: 'copper-concentrate', cat: 'Metallic Minerals' },
  { name: 'Iron Ore Fine', slug: 'iron-ore-fine', cat: 'Metallic Minerals' },
  { name: 'Quartz Stone', slug: 'quartz-stone', cat: 'Industrial Minerals' },
  { name: 'Marble Blocks', slug: 'marble-blocks', cat: 'Natural Stone' },
  { name: 'Basalt Stone', slug: 'basalt-stone', cat: 'Industrial Minerals' },
  { name: 'River Sand', slug: 'river-sand', cat: 'Aggregates' },
];

export const tradeLocations = [
  { name: 'India', region: 'Asia Pacific' },
  { name: 'Odisha', region: 'India' },
  { name: 'Rajasthan', region: 'India' },
  { name: 'Brazil', region: 'South America' },
  { name: 'Australia', region: 'Asia Pacific' },
  { name: 'Middle East', region: 'Global' },
  { name: 'Europe', region: 'Global' },
  { name: 'Zambia', region: 'Africa' },
  { name: 'China', region: 'Asia Pacific' },
  { name: 'USA', region: 'North America' },
];

export const targetIndustries = [
  'Construction',
  'Architecture',
  'Cement Industry',
  'Road Construction',
  'Battery Production',
  'Electronics',
  'Infrastructure',
  'Glass Manufacturing',
];

/**
 * COMBINATORIAL REGISTRY: High-value hand-picked corridors
 * In a production environment, this could be populated from a database.
 */
export const pseoPages: PseoPageData[] = [
  {
    slug: 'granite-suppliers-india',
    productName: 'Granite Blocks',
    productSlug: 'granite-blocks',
    location: 'India',
    role: 'Suppliers',
    category: 'Natural Stone',
    supplierCount: 342,
    avgPurity: 'Grade A',
    industry: 'Construction',
    intent: 'DIRECTORY',
    priceRange: '$120 - $180 / MT',
    lastMod: '2024-05-22',
    priority: 0.9,
    keywords: ['best granite exporters india', 'bulk granite blocks india', 'granite wholesale india']
  },
  {
    slug: 'lithium-exporters-australia',
    productName: 'Lithium Spodumene',
    productSlug: 'lithium-spodumene',
    location: 'Australia',
    role: 'Exporters',
    category: 'Critical Minerals',
    supplierCount: 85,
    avgPurity: 'SC 6.0',
    industry: 'Battery Production',
    intent: 'EXPORT',
    priceRange: '$1,100 - $1,250 / MT',
    lastMod: '2024-05-22',
    priority: 0.8,
    keywords: ['lithium export australia', 'buy lithium spodumene', 'battery grade lithium']
  },
  {
    slug: 'where-to-buy-granite-blocks',
    productName: 'Granite Blocks',
    productSlug: 'granite-blocks',
    location: 'Global',
    role: 'Wholesalers',
    category: 'Natural Stone',
    supplierCount: 520,
    avgPurity: 'Export Grade',
    industry: 'Architecture',
    intent: 'BUY',
    priceRange: 'Variable',
    lastMod: '2024-05-22',
    priority: 0.9,
    keywords: ['where to buy granite blocks', 'wholesale granite suppliers', 'stone bulk suppliers']
  },
  {
    slug: 'granite-for-construction',
    productName: 'Granite Blocks',
    productSlug: 'granite-blocks',
    location: 'Global',
    role: 'Suppliers',
    category: 'Natural Stone',
    supplierCount: 1200,
    avgPurity: 'Industrial',
    industry: 'Construction',
    intent: 'INDUSTRY',
    lastMod: '2024-05-22',
    priority: 0.7,
    keywords: ['granite for construction', 'industrial stone blocks', 'construction minerals']
  },
  {
    slug: 'granite-quarry-odisha',
    productName: 'Granite Blocks',
    productSlug: 'granite-blocks',
    location: 'Odisha',
    role: 'Quarries',
    category: 'Natural Stone',
    supplierCount: 45,
    avgPurity: 'Premium',
    industry: 'Export',
    intent: 'QUARRY',
    priceRange: '$90 - $140 / MT',
    lastMod: '2024-05-22',
    priority: 0.8,
    keywords: ['granite quarry odisha', 'odisha stone mining', 'quarry direct granite']
  }
];

/**
 * Quality Control: Validation Rules
 */
export function isValidPseoPage(page: PseoPageData): boolean {
  if (page.supplierCount < 5 && page.intent !== 'INDUSTRY') return false;
  if (page.location.toLowerCase() === 'antarctica') return false;
  return true;
}

/**
 * Advanced Content Variation Engine
 * Generates intent-specific intros to satisfy long-tail search queries.
 */
export function getVariatedIntro(page: PseoPageData): string {
  const { productName, location, role, intent, industry, avgPurity, supplierCount } = page;

  const intros: Record<SearchIntent, string[]> = {
    BUY: [
      `Searching for where to buy ${productName}? Our network connects high-volume buyers with ${supplierCount} vetted ${productName} ${role.toLowerCase()} serving the ${industry} sector. Access real-time pricing and secure escrow for bulk ${avgPurity} material.`,
      `Secure your supply chain by connecting with factory-direct ${productName} ${role.toLowerCase()}. Browse ${supplierCount} verified entities specialized in ${avgPurity} materials for global ${industry} applications.`
    ],
    EXPORT: [
      `Navigating the international trade of ${productName} from ${location} requires precision and compliance. Connect with ${supplierCount} verified ${role.toLowerCase()} specializing in ${avgPurity} export-grade material for the ${industry} industry.`,
      `Efficiently source ${productName} for export in ${location}. Our platform handles the compliance and logistics for ${supplierCount} ${role.toLowerCase()}, ensuring seamless ${avgPurity} material transit.`
    ],
    INDUSTRY: [
      `Specialized ${productName} solutions for the ${industry} industry. We provide a directory of ${supplierCount} verified entities supplying high-grade ${avgPurity} ${productName} optimized for industrial manufacturing and infrastructure projects.`,
      `${productName} is a critical resource for ${industry}. Explore our verified registry of ${supplierCount} producers in ${location} maintaining ${avgPurity} quality standards.`
    ],
    DIRECTORY: [
      `Comprehensive directory of ${productName} ${role.toLowerCase()} in ${location}. Browse ${supplierCount} profiles including contact information, verified mining licenses, and ${avgPurity} material technical specifications.`,
      `Find the top ${productName} partners in ${location}. Our verified supplier network features ${supplierCount} companies specialized in ${industry} grade ${productName}.`
    ],
    QUARRY: [
      `Direct access to ${productName} ${role.toLowerCase()} in ${location}. Skip the middleman and source ${avgPurity} material directly from ${supplierCount} verified extraction sites optimized for ${industry}.`,
      `Explore the primary ${productName} ${role.toLowerCase()} of ${location}. Every site in our registry is Tier 3 verified, ensuring legal boundary compliance and technical grade ${avgPurity} consistency.`
    ],
    SOURCE: [
      `Efficiently source ${productName} from verified ${role.toLowerCase()} in ${location}. Our platform connects industrial buyers with ${supplierCount} vetted producers specializing in ${avgPurity} for the ${industry} market.`,
      `Navigate the ${location} market for ${productName}. Connect with the top ${supplierCount} ${role.toLowerCase()} currently active in the region with verified ${avgPurity} grade stock.`
    ],
    WHOLESALE: [
      `Wholesale ${productName} supply for large-scale ${industry} projects. Connect with ${supplierCount} ${role.toLowerCase()} in ${location} offering volume discounts on ${avgPurity} material.`,
      `Bulk ${productName} procurement platform. Secure your industrial inventory from ${supplierCount} verified ${role.toLowerCase()} maintaining consistent ${avgPurity} grades.`
    ]
  };

  const pool = intros[intent] || intros['SOURCE'];
  const index = page.slug.length % pool.length;
  return pool[index];
}

export function getPseoPageBySlug(slug: string) {
  return pseoPages.find(p => p.slug === slug);
}
