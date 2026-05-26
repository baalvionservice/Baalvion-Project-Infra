// ─── Review Article Types ──────────────────────────────────────────────────

export interface ReviewAuthor {
  name: string;
  title?: string;
  avatarUrl?: string;
}

export interface ProviderKeySpec {
  label: string;
  value: string;
}

// A "Why We Chose It" sub-section — one per category label the provider won
export interface WhyWeChoseItSection {
  heading: string; // e.g. "Best Overall"
  body: string;
}

export interface Provider {
  id: string;
  name: string;
  logoUrl: string;
  /** All category labels this provider won — shown in the H2 title */
  categoryLabels: string[];
  overallScore: number;
  /** 2-3 items shown in the "Fast Facts" box beside the logo */
  fastFacts: ProviderKeySpec[];
  /** One section per categoryLabel for "Why We Chose It" */
  whyWeChoseIt: WhyWeChoseItSection[];
  pros: string[];
  cons: string[];
  /** Overview paragraph shown below Pros & Cons */
  overview: string;
  ctaUrl: string;
  ctaLabel: string;
  affiliateDisclosure?: string;
}

export interface PickCard {
  providerId: string;
  categoryLabel: string;
  providerName: string;
  logoUrl: string;
  summaryBlurb: string;
  ctaUrl: string;
  ctaLabel: string;
}

export interface ComparisonRow {
  providerName: string;
  logoUrl: string;
  specs: Record<string, string>;
  overallScore: number;
  ctaUrl: string;
}

export interface ReviewFAQ {
  question: string;
  answer: string;
}

export interface ReviewArticle {
  pageType: "review";
  slug: string;
  title: string;
  subhead: string;
  lastUpdated: string;
  reviewedBy: ReviewAuthor;
  factCheckedBy?: ReviewAuthor;
  methodologyLink?: string;
  methodology: string;
  comparisonColumns: string[];
  picks: PickCard[];
  providers: Provider[];
  comparisonRows: ComparisonRow[];
  faqs: ReviewFAQ[];
  category: string;
  metaDescription: string;
}