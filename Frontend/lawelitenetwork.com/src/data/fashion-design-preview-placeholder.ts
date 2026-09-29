/**
 * DESIGN PREVIEW ONLY -- delete this file once real Fashion articles exist.
 *
 * Every title is prefixed "[PLACEHOLDER]" on purpose, twice-over: the prefix
 * survives even if this array is ever rendered out of context, and
 * fashion/page.tsx only ever uses it as a fallback when zero real articles
 * (CMS or bundled) exist for the Fashion category -- the moment one real
 * article is published, this entire file stops being referenced and the
 * page fills in with real content automatically. Nothing here is meant to be
 * read as a real story; it exists only so the /fashion layout can be
 * evaluated before real content is written. See fashion/page.tsx's
 * `isPreview` flag, which also forces `noindex` while this is in use.
 */
export const FASHION_DESIGN_PREVIEW_PLACEHOLDER = [
  {
    slug: 'placeholder-designer-trademark-dispute',
    title: '[PLACEHOLDER] Designer Trademark Dispute Over Runway Collection Name',
    summary: '[Placeholder summary] Example of how a lead story with a photo and dek reads once real coverage is published.',
    category: { id: 'fashion', name: 'Fashion', slug: 'fashion' },
    subcategory: { id: 'trademark-disputes', name: 'Trademark Disputes', slug: 'trademark-disputes' },
    updatedAt: 'September 20, 2026',
    views: 0,
  },
  {
    slug: 'placeholder-fashion-week-contract-terms',
    title: '[PLACEHOLDER] Fashion Week Casting Contract Terms Explained',
    summary: '[Placeholder summary] Example side-story card next to the lead story.',
    category: { id: 'fashion', name: 'Fashion', slug: 'fashion' },
    subcategory: { id: 'fashion-week-contracts', name: 'Fashion Week Contracts', slug: 'fashion-week-contracts' },
    updatedAt: 'September 19, 2026',
    views: 0,
  },
  {
    slug: 'placeholder-counterfeit-goods-enforcement',
    title: '[PLACEHOLDER] Counterfeit Goods Enforcement at Border Customs',
    summary: '[Placeholder summary] Second side-story card.',
    category: { id: 'fashion', name: 'Fashion', slug: 'fashion' },
    subcategory: { id: 'trademark-disputes', name: 'Trademark Disputes', slug: 'trademark-disputes' },
    updatedAt: 'September 18, 2026',
    views: 0,
  },
  {
    slug: 'placeholder-model-agency-licensing',
    title: '[PLACEHOLDER] Model Agency Licensing Rules by State',
    summary: '[Placeholder summary] Example category-section lead story.',
    category: { id: 'fashion', name: 'Fashion', slug: 'fashion' },
    subcategory: { id: 'fashion-week-contracts', name: 'Fashion Week Contracts', slug: 'fashion-week-contracts' },
    updatedAt: 'September 17, 2026',
    views: 0,
  },
  {
    slug: 'placeholder-textile-supply-chain-law',
    title: '[PLACEHOLDER] Textile Supply Chain Disclosure Law Basics',
    summary: '[Placeholder summary] Example category-section side story.',
    category: { id: 'fashion', name: 'Fashion', slug: 'fashion' },
    subcategory: { id: 'supply-chain-compliance', name: 'Supply Chain Compliance', slug: 'supply-chain-compliance' },
    updatedAt: 'September 16, 2026',
    views: 0,
  },
  {
    slug: 'placeholder-influencer-brand-deal-clauses',
    title: '[PLACEHOLDER] Influencer Brand Deal Exclusivity Clauses',
    summary: '[Placeholder summary] Second category-section side story.',
    category: { id: 'fashion', name: 'Fashion', slug: 'fashion' },
    subcategory: { id: 'supply-chain-compliance', name: 'Supply Chain Compliance', slug: 'supply-chain-compliance' },
    updatedAt: 'September 15, 2026',
    views: 0,
  },
  {
    slug: 'placeholder-fabric-patent-litigation',
    title: '[PLACEHOLDER] Fabric Technology Patent Litigation Overview',
    summary: '[Placeholder summary] Fills out "The Latest" and sidebar widgets.',
    category: { id: 'fashion', name: 'Fashion', slug: 'fashion' },
    subcategory: { id: 'trademark-disputes', name: 'Trademark Disputes', slug: 'trademark-disputes' },
    updatedAt: 'September 14, 2026',
    views: 0,
  },
];
