/** The 8 real, working tools at /financial-tools/<slug> — confirmed against
 *  src/app/financial-tools/*. Never link to /calculators/[slug] (dead 404 stub). */
export interface RelatedCalculator {
  slug: string;
  name: string;
}

const CALCULATORS: Record<string, RelatedCalculator> = {
  "compound-interest": { slug: "compound-interest", name: "Compound Interest Calculator" },
  loan: { slug: "loan", name: "Loan Repayment Calculator" },
  investment: { slug: "investment", name: "Investment ROI Calculator" },
  inflation: { slug: "inflation", name: "Inflation Impact Calculator" },
  cagr: { slug: "cagr", name: "CAGR Calculator" },
  dividend: { slug: "dividend", name: "Dividend Calculator" },
  "position-size": { slug: "position-size", name: "Position Size Calculator" },
  "profit-loss": { slug: "profit-loss", name: "Profit/Loss Calculator" },
};

// categorySlug (topic-config.ts key) -> relevant calculator slugs. Deliberately
// partial — most of the 400+ topic pages have no naturally-related calculator,
// and that's fine (the widget just doesn't render there).
const TOPIC_CALCULATORS: Record<string, string[]> = {
  "compound-interest": ["compound-interest"],
  savings: ["compound-interest"],
  checking: ["compound-interest"],
  "money-market": ["compound-interest"],
  "cd-rates": ["compound-interest"],
  retirement: ["compound-interest", "investment"],
  investing: ["investment", "compound-interest"],
  portfolio: ["investment"],
  "mutual-funds": ["investment"],
  etfs: ["investment"],
  bonds: ["investment"],
  "real-estate": ["investment"],
  stocks: ["cagr", "dividend", "profit-loss", "position-size"],
  brokers: ["position-size", "profit-loss"],
  options: ["position-size", "profit-loss"],
  crypto: ["profit-loss", "position-size"],
  cryptocurrency: ["profit-loss", "position-size"],
  inflation: ["inflation"],
  economy: ["inflation"],
  indicators: ["inflation"],
  "credit-cards": ["loan"],
  loans: ["loan"],
  mortgages: ["loan"],
  "auto-loans": ["loan"],
  "student-loans": ["loan"],
  debt: ["loan"],
  "personal-finance": ["compound-interest"],
};

/** Real, working calculators related to an article's category — or []. */
export function getRelatedCalculators(categorySlug?: string | null): RelatedCalculator[] {
  if (!categorySlug) return [];
  const slugs = TOPIC_CALCULATORS[categorySlug] ?? [];
  return slugs.map((s) => CALCULATORS[s]).filter(Boolean);
}
