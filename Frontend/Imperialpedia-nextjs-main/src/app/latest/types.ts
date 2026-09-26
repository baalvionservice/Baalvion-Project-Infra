// ─── Live article type — matches webhook response schema ─────────────────────
export interface LiveArticle {
  articleUrl: string;
  title: string;
  category: LiveCategory;
  sourceName: string;
  publishedAt?: string;
  fetchedAt?: string;
  imageUrl?: string;
  shortDescription?: string;
  detailedExplanation?: string;
  keyPoints?: string[];
}

export type LiveCategory =
  | "All"
  | "Stocks"
  | "Crypto"
  | "Economy"
  | "Banking"
  | "Startups"
  | "GlobalMarkets"
  | "PersonalFinance"
  | "Markets"
  | "RealEstate";

export const WEBHOOK_POST = "https://rameji.app.n8n.cloud/webhook/news";
export const WEBHOOK_POLL = "https://rameji.app.n8n.cloud/webhook/news-poll";
export const POLL_INTERVAL_MS = 2000;
export const MAX_ARTICLES = 300;
export const MAX_POLL_DURATION = 15 * 60 * 1000;

export const LIVE_CATEGORIES: { value: LiveCategory; label: string }[] = [
  { value: "All",            label: "All" },
  { value: "Markets",        label: "Markets" },
  { value: "Stocks",         label: "Stocks" },
  { value: "Crypto",         label: "Crypto" },
  { value: "Economy",        label: "Economy" },
  { value: "Banking",        label: "Banking" },
  { value: "Startups",       label: "Startups" },
  { value: "GlobalMarkets",  label: "Global Markets" },
  { value: "PersonalFinance",label: "Personal Finance" },
];

export const CATEGORY_STYLES: Record<string, string> = {
  Stocks:          "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  Crypto:          "bg-amber-100  text-amber-800  dark:bg-amber-900/40  dark:text-amber-300",
  Economy:         "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Banking:         "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Startups:        "bg-rose-100   text-rose-800   dark:bg-rose-900/40   dark:text-rose-300",
  GlobalMarkets:   "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  PersonalFinance: "bg-teal-100   text-teal-800   dark:bg-teal-900/40   dark:text-teal-300",
  Markets:         "bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300",
  RealEstate:      "bg-lime-100   text-lime-800   dark:bg-lime-900/40   dark:text-lime-300",
};

export function getCategoryStyle(cat?: string): string {
  return CATEGORY_STYLES[cat ?? ""] ?? "bg-muted text-muted-foreground";
}

export function fmtDate(s?: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    return (
      d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch { return ""; }
}