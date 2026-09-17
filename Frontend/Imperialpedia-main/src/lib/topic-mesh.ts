/**
 * topic-mesh.ts
 * Utility module for building the site-wide internal link mesh.
 * Uses only exported helpers from topic-config so no internals are leaked.
 */

import { siblingsFor, parentFor, topicCopy } from './topic-config';

export interface FeaturedGuide {
  title: string;
  href: string;
  description?: string;
}

export interface SubcategoryMeshItem {
  slug: string;
  title: string;
  href: string;
  description: string;
  featuredGuides: FeaturedGuide[];
}

export interface MeshGroup {
  label: string;
  href: string;
  items: SubcategoryMeshItem[];
}

/* ─────────────────────────────────────────────────────────────
   Curated featured guides per subcategory slug
   ───────────────────────────────────────────────────────────── */
export const SUBTOPIC_FEATURED_GUIDES: Record<string, FeaturedGuide[]> = {
  // Creator Economy
  'creator-economy': [
    { title: 'Diversifying Income: Sponsorships, Ad Revenue & Digital Goods', href: '/creator-economy/diversifying-income-sponsorships-ad-revenue-digital-goods' },
    { title: 'YouTube Partner Program vs Direct Brand Deals', href: '/creator-economy/youtube-partner-program-vs-direct-brand-deals' },
    { title: 'Benchmarking Instagram Creator Sponsorship Rates', href: '/creator-economy/benchmarking-instagram-creator-sponsorship-rates' },
  ],
  'youtube-monetization': [
    { title: 'YouTube RPM vs CPM Explained: Key Revenue Differences', href: '/creator-economy/youtube-rpm-vs-cpm-explained' },
    { title: 'YouTube Shorts Monetization vs Long-Form Payout Rates', href: '/creator-economy/youtube-shorts-monetization-vs-long-form-payout-rates' },
    { title: 'AdSense Payment Schedules & Threshold Rules', href: '/creator-economy/adsense-payment-schedules-and-threshold-rules' },
  ],
  'instagram-monetization': [
    { title: 'Instagram Creator Subscriptions & Reel Bonus Rules', href: '/creator-economy/instagram-creator-subscriptions-and-reel-bonus-rules' },
    { title: 'Sponsored Post Rate Benchmarks for Micro-Influencers', href: '/creator-economy/sponsored-post-rate-benchmarks-for-micro-influencers' },
    { title: 'Creator Contract Essentials & Invoice Payment Terms', href: '/creator-economy/creator-contract-essentials-and-invoice-payment-terms' },
  ],
  'website-monetization': [
    { title: 'Display Ad Networks: Mediavine vs Raptive vs Ezoic', href: '/creator-economy/display-ad-networks-mediavine-vs-raptive-vs-ezoic' },
    { title: 'Affiliate Marketing Commission Structures & Tracking', href: '/creator-economy/affiliate-marketing-commission-structures-and-tracking' },
    { title: 'Calculating Page RPM & Session Revenue', href: '/creator-economy/calculating-page-rpm-and-session-revenue' },
  ],
  'social-media-earnings': [
    { title: 'Cross-Platform Payout Comparison: TikTok, YouTube & X', href: '/creator-economy/cross-platform-payout-comparison-tiktok-youtube-and-x' },
    { title: 'How Platform Creator Funds Calculate RPM', href: '/creator-economy/how-platform-creator-funds-calculate-rpm' },
    { title: 'Ad Revenue Sharing Models & CPM Trends', href: '/creator-economy/ad-revenue-sharing-models-and-cpm-trends' },
  ],
  'creator-guides': [
    { title: 'Taxes for Creators: Deductions, Quarterly Estimates & LLCs', href: '/creator-economy/taxes-for-creators-deductions-quarterly-estimates-and-llcs' },
    { title: 'Building a Sustainable Digital Media Business', href: '/creator-economy/building-a-sustainable-digital-media-business' },
    { title: 'Rate Sheets & Media Kit Templates for Creators', href: '/creator-economy/rate-sheets-and-media-kit-templates-for-creators' },
  ],
  'creator-tools': [
    { title: 'RPM & CPM Calculator for YouTube & Web Creators', href: '/creator-economy/rpm-and-cpm-calculator-for-youtube-and-web-creators' },
    { title: 'Sponsorship Rate Estimator Tool', href: '/creator-economy/sponsorship-rate-estimator-tool' },
    { title: 'Platform Payout Comparison Chart', href: '/creator-economy/platform-payout-comparison-chart' },
  ],

  // Banking
  banking: [
    { title: 'FDIC & NCUA Insurance Limits Explained ($250k Cap)', href: '/banking' },
    { title: 'High-Yield Savings vs Standard Checking Accounts', href: '/savings' },
    { title: 'Overdraft Protections & Fee Waiver Rules', href: '/checking' },
  ],
  savings: [
    { title: 'Top High-Yield Savings Accounts (HYSA) Ranked', href: '/savings' },
    { title: 'Setting Realistic Emergency Fund Milestones', href: '/savings' },
    { title: 'CD Laddering Strategy vs Liquid Savings', href: '/cd-rates' },
  ],
  checking: [
    { title: 'How to Avoid Monthly Account Maintenance Fees', href: '/checking' },
    { title: 'Direct Deposit Perks & Early Paycheck Access', href: '/banking' },
  ],
  'credit-cards': [
    { title: 'How Credit Utilization Impacts FICO Credit Scores', href: '/credit-cards' },
    { title: 'Maximizing Cashback & Travel Reward Multipliers', href: '/credit-cards' },
  ],
  loans: [
    { title: 'Personal Loan Interest Rates & Debt Consolidation', href: '/loans' },
    { title: 'Fixed vs Variable Rate Mortgage Financing Guide', href: '/mortgages' },
  ],

  // Personal Finance
  budgeting: [
    { title: 'The 50/30/20 Budgeting Framework Explained', href: '/budgeting-basics' },
  ],
  'budgeting-basics': [
    { title: 'Zero-Based Budgeting vs Envelope System', href: '/budgeting-basics' },
  ],
};

/** All major site-wide category hubs — ensures every page links to the full site */
export const MAJOR_CATEGORY_HUBS: { label: string; href: string; desc: string }[] = [
  { label: 'Creator Economy', href: '/creator-economy', desc: 'YouTube, Instagram & website monetization.' },
  { label: 'Banking & Accounts', href: '/banking', desc: 'Checking, savings, CDs & money market.' },
  { label: 'Investing & Markets', href: '/investing', desc: 'Stocks, ETFs, options & retirement guides.' },
  { label: 'Personal Finance', href: '/personal-finance', desc: 'Budgeting, credit & debt management.' },
  { label: 'Market News', href: '/market-news', desc: 'Daily markets, company earnings & trends.' },
  { label: 'Economy & Indicators', href: '/economy', desc: 'Fed rates, inflation, GDP & fiscal policy.' },
  { label: 'Product Reviews', href: '/reviews', desc: 'Independent reviews of banks, apps & cards.' },
  { label: 'Budgeting Basics', href: '/budgeting-basics', desc: 'Simple money management frameworks.' },
];

/**
 * Builds the full internal link mesh (topic cluster + site directory) for a given slug.
 * Falls back to the creator-economy group if no group is found for the slug.
 */
export function getMeshGroupForSlug(categorySlug?: string): MeshGroup {
  const slug = categorySlug ?? 'creator-economy';

  // Use siblingsFor to get the live children of the same group
  let siblings = siblingsFor(slug);
  let parentInfo = parentFor(slug);

  // If this IS a top-level hub (not a child), try treating slug as its own group "root"
  if (!siblings) {
    const FALLBACK_GROUPS: Record<string, string[]> = {
      'creator-economy': ['creator-economy', 'youtube-monetization', 'instagram-monetization', 'website-monetization', 'social-media-earnings', 'creator-guides', 'creator-tools'],
      banking: ['savings', 'checking', 'cd-rates', 'money-market', 'credit-cards', 'loans', 'mortgages', 'auto-loans', 'student-loans'],
      'personal-finance': ['budgeting', 'debt', 'credit', 'planning'],
    };
    const fallbackChildren = FALLBACK_GROUPS[slug] || FALLBACK_GROUPS['creator-economy'];
    siblings = fallbackChildren.map((s) => ({ slug: s, label: topicCopy(s).title }));
    parentInfo = { label: topicCopy(slug).title, href: `/${slug}` };
  }

  const groupLabel = parentInfo?.label ?? topicCopy(slug).title;
  const groupHref = parentInfo?.href ?? `/${slug}`;

  const items: SubcategoryMeshItem[] = siblings.map((sibling) => {
    const copy = topicCopy(sibling.slug);
    const href = `/${sibling.slug}`;
    const guides = SUBTOPIC_FEATURED_GUIDES[sibling.slug] ?? [
      {
        title: `${copy.title} Guide & Key Concepts`,
        href,
        description: copy.description ?? `Explore top articles and guides in ${copy.title}.`,
      },
    ];

    // Avoid repetitive heading tags (e.g., CREATOR ECONOMY header followed by CREATOR ECONOMY subcolumn)
    let subTitle = sibling.label;
    if (subTitle.toLowerCase().trim() === groupLabel.toLowerCase().trim()) {
      subTitle = 'Strategy & Overview';
    }

    return {
      slug: sibling.slug,
      title: subTitle,
      href,
      description: copy.description ?? '',
      featuredGuides: guides,
    };
  });

  return { label: groupLabel, href: groupHref, items };
}
