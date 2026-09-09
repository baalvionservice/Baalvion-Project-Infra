// Editorial pipeline types. Mirrors cms-service's cms_editorial_charters and
// cms_publication_policies — see those models for what each field governs.

export interface EditorialCharter {
  id: string;
  websiteId: string;
  niche: string;
  audience: string;
  /** The house perspective — what makes output this site's rather than generic. */
  houseAngle: string;
  voice: string | null;
  /** 'news' | 'article' — one kind of output per site. */
  outputContentType: string;
  covers: string[];
  /** news-service categories that are genuinely this site's beat. */
  wireCategories: string[];
  excludes: string[];
  stanceRules: string[];
  bannedClaims: string[];
  requiredSections: string[];
  minSources: number;
  /** A regulator's own announcement needs no second outlet to confirm it. */
  singlePrimarySourceOk: boolean;
  maxSimilarityPct: number;
  minCitationCoveragePct: number;
  requireQuoteVerification: boolean;
  status: string;
  updatedAt: string;
}

export interface CategoryMixEntry {
  categorySlug: string;
  label: string;
  targetPct: number;
  minPerDay: number;
  maxPerDay: number;
}

export interface PublishWindow {
  label: string;
  startHourUtc: number;
  endHourUtc: number;
  /** ISO days, 1 = Monday. */
  days: number[];
}

export interface WordCountRule {
  format: string;
  min: number;
  max: number;
}

export interface PublicationPolicy {
  id: string;
  websiteId: string;
  dailyTarget: number;
  dailyMax: number;
  hourlyMax: number;
  minMinutesBetweenPosts: number;
  weekendTargetPct: number;
  categoryMix: CategoryMixEntry[];
  formatMix: { format: string; targetPct: number }[];
  publishWindows: PublishWindow[];
  wordCountRules: WordCountRule[];
  requireOriginalArt: boolean;
  requireReviewerDistinctFromAuthor: boolean;
  maxArticlesPerAuthorPerDay: number;
  correctionsPolicyUrl: string | null;
  correctionWindowHours: number;
  staleAfterDays: number;
  requireUpdateNote: boolean;
  autoPublishEnabled: boolean;
  autoPublishDelayMinutes: number;
  notifyEmails: string[];
  onTimerConflict: string;
  deadCategorySlugs: string[];
  routesVerifiedAt: string | null;
  status: string;
  updatedAt: string;
}

export interface PolicyCategory {
  id: string;
  slug: string;
  name: string;
  /** False when the site's public route for this category redirects or 404s. */
  routeAlive: boolean;
}

export interface PolicyWithCategories {
  policy: PublicationPolicy | null;
  categories: PolicyCategory[];
}

export interface BeatState {
  categorySlug: string;
  label: string;
  targetPct: number;
  want: number;
  done: number;
  deficit: number;
  atCeiling: boolean;
}

export interface QuotaState {
  dailyTarget: number;
  publishedToday: number;
  remaining: number;
  hardCeiling: number;
  beats: BeatState[];
  windowOpen: boolean;
  currentWindow: PublishWindow | null;
  autoPublishEnabled: boolean;
  autoPublishDelayMinutes: number;
  notifyEmails: string[];
  state: {
    publishedToday: number;
    publishedLastHour: number;
    lastPublishedAt: string | null;
    perCategory: Record<string, number>;
    perAuthor: Record<string, number>;
  };
}

export interface ScoreReason {
  component: string;
  points: number;
  detail: string;
}

export interface StorySignal {
  id: string;
  title: string;
  url: string;
  sourceName: string | null;
  sourceType: string | null;
  publishedAt: string | null;
  wireCategory: string | null;
  summary: string | null;
  relevanceScore: number | null;
  scoreReasons: ScoreReason[];
  decision: string;
  rejectionReason: string | null;
  clusterKey: string | null;
}

export interface IntakeResult {
  scanned: number;
  created: number;
  rescored: number;
  accepted: number;
  rejected: number;
  wireError: string | null;
}

export interface StoryCluster {
  clusterKey: string;
  size: number;
  sourceCount: number;
  topScore: number;
  titles: string[];
}
