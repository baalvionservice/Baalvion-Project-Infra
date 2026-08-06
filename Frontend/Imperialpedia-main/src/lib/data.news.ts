import { ArticleStatus } from "@/modules/content-engine/types";
import { articleArtDataUri } from "@baalvion/illustrations";
import type { EntityMention } from "@/lib/entityLinkInjector";

export type NewsCategory =
  | "Markets"
  | "Economy"
  | "Stocks"
  | "Crypto"
  | "PersonalFinance"
  | "RealEstate"
  | "ETFs"
  | "Editorial"
  | "Guides"
  | "Bonds"
  | "Business"
  | "Investing"
  | "Tech"
  | "Politics"
  | "World"
  | "Finance"
  | "HealthScience"
  | "Media"
  | "Energy"
  | "Climate";

export interface NewsAuthor {
  name: string;
  title?: string;
  avatarUrl?: string;
}
export interface RelatedLink {
  label: string;
  href: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  author: NewsAuthor;
  related?: RelatedLink[];
  status?: ArticleStatus;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  imageUrl: string;
  imageCaption?: string;
  slug: string;
  featured?: boolean;
  /** Editorial flags mirroring cms_contents — see cms-service migration 20260020. */
  isBreaking?: boolean;
  isTrending?: boolean;
  isEditorsPick?: boolean;
  isPremium?: boolean;
  /** Fixed taxonomy: breaking/exclusive/live/analysis/opinion/explained/bullish/bearish. */
  newsLabels?: string[];
  galleryImages?: string[];
  videoUrl?: string;
  externalSourceName?: string;
  externalSourceUrl?: string;
  keyTakeaways?: string[];
  body: NewsBodyBlock[];
  tags?: string[];
  /** View count, when the source (CMS) tracks it — omit from UI when absent rather than fabricating a number. */
  views?: number;
  /** Raw CMS custom fields (e.g. `breaking`, `videoUrl`) passed through for data-gated UI like the breaking ticker and video carousel. */
  customFields?: Record<string, unknown>;
  /**
   * Underlying CMS `contentType` (e.g. `"article"` vs `"news"`), when known — lets
   * link-building code tell content-engine guides (canonical `/<categorySlug>/<slug>`)
   * apart from dated news (canonical `/YYYY/MM/DD/<slug>`). Undefined for the bundled
   * demo `newsArticles` set, which is always dated news. See `newsArticleHref`.
   */
  contentType?: string;
  /**
   * The CMS category's own slug (e.g. `"bonds"`, `"cd-rates"`) — distinct from the
   * coarse display `category` bucket above. Drives the canonical `/<categorySlug>/<slug>`
   * article URL so a guide's permalink lives under its real topic instead of a flat
   * `/financial-intelligence/` bucket. Undefined when the CMS row has no category.
   */
  categorySlug?: string;
  /**
   * Persisted, save-time knowledge-graph entity mentions (companies,
   * industries, technologies, countries) detected in this article's body —
   * see src/lib/entityLinkInjector.tsx for how these become real internal
   * links, and Backend/services/knowledge/imperialpedia-service/service/
   * entityMentionDetectionService.js for how they're computed. Undefined for
   * the bundled demo set and anything not sourced from the live CMS.
   */
  entityMentions?: EntityMention[];
  /**
   * World-news geographic tagging (from CMS `customFields.worldRegion` /
   * `customFields.worldCountry` / `customFields.worldState`) — when region
   * and country are set on a `contentType: "news"` row, drives the nested
   * `/world/<region>/<country>/YYYY/MM/DD/<slug>` permalink instead of the
   * flat dated URL; adding `worldState` nests one level deeper into
   * `/world/<region>/<country>/<state>/YYYY/MM/DD/<slug>`. See `newsArticleHref`.
   */
  worldRegion?: string;
  worldCountry?: string;
  worldState?: string;
}

// ── Body block types ──────────────────────────────────────────────────────────

export type NewsBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "callout"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; url: string; caption?: string };

// ── Data ──────────────────────────────────────────────────────────────────────

const rawNewsArticles: Omit<NewsArticle, "imageUrl">[] = [];

// Original, deterministic artwork per news article (no stock/placeholder images) —
// generated from each article's own title/category/tags, computed after the literal
// above since object literals can't reference their own sibling properties.
export const newsArticles: NewsArticle[] = rawNewsArticles.map((article) => ({
  ...article,
  imageUrl: articleArtDataUri({
    title: article.title,
    category: article.category,
    tags: article.tags,
    excerpt: article.excerpt,
    seed: article.slug,
  }),
}));
