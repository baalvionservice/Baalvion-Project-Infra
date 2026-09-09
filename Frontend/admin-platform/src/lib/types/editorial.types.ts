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

// ── Stage 3-5: briefs, drafts and the gates ─────────────────────────────────

export interface BriefSource {
  signalId: string;
  name: string | null;
  url: string;
  type: string | null;
  publishedAt: string | null;
  /** A regulator, court or agency publishing its own notice. */
  isPrimary: boolean;
}

export interface BriefFact {
  statement: string;
  sourceUrl: string;
  figure?: string;
}

export interface BriefQuote {
  text: string;
  speaker?: string;
  sourceUrl: string;
}

/** Why the brief was allowed to proceed. Null while it was refused. */
export type SourcingBasis = 'multi_outlet' | 'verified_primary' | null;

export interface StoryBrief {
  id: string;
  websiteId: string;
  clusterKey: string;
  workingTitle: string;
  sources: BriefSource[];
  facts: BriefFact[];
  disputed: { claim: string; readings?: string[] }[];
  quotes: BriefQuote[];
  angle: string | null;
  whyItMatters: string | null;
  entities: string[];
  sourcingBasis: SourcingBasis;
  /** 'pending' | 'ready' | 'insufficient_sources' | 'failed' */
  status: string;
  failureReason: string | null;
  createdAt: string;
}

export interface ContentBlock {
  id: string;
  type: string;
  order: number;
  content: { text?: string; html?: string; level?: number };
}

export interface DraftCitation {
  claim: string;
  sourceUrl: string;
  sourceName?: string;
}

export interface ArticleDraft {
  id: string;
  websiteId: string;
  briefId: string;
  title: string;
  dek: string | null;
  slug: string | null;
  contentBlocks: ContentBlock[];
  citations: DraftCitation[];
  authorSlug: string | null;
  reviewerSlug: string | null;
  categoryHint: string | null;
  /** 'pending' | 'passed' | 'failed' */
  gateStatus: string;
  gateResults: GateResult[];
  similarityPct: string | number | null;
  citationCoveragePct: string | number | null;
  /** 'generating' | 'drafted' | 'approved' | 'published' | 'rejected' | 'failed' */
  status: string;
  modelUsed: string | null;
  failureReason: string | null;
  cmsContentId: string | null;
  createdAt: string;
}

export interface GateResult {
  rule: string;
  status: 'passed' | 'failed';
  message: string;
}

export interface GateVerdict {
  draftId: string;
  gateStatus: string;
  allowed: boolean;
  results: GateResult[];
  failedCount: number;
  words: number;
  warnings: { rule: string; message: string }[];
}

export interface PreflightProblem {
  code: string;
  message: string;
  /** Which stage this stops: 'all' | 'intake' | 'brief' | 'draft'. */
  blocks: string;
}

export interface Preflight {
  ok: boolean;
  problems: PreflightProblem[];
}

export interface PipelineRun {
  ok: boolean;
  preflight: Preflight;
  ms: number;
  stages: {
    intake?: { scanned?: number; accepted?: number; rejected?: number; skipped?: string; error?: string };
    cluster?: { clusters?: number; multiOutlet?: number; withPrimary?: number; error?: string };
    brief?: { ready?: number; insufficientSources?: number; failed?: number; skipped?: string; error?: string };
    draft?: { drafted?: number; briefsReady?: number; skipped?: string; error?: string };
    gate?: { evaluated?: number; passed?: number; failed?: number; error?: string };
  };
}

// ── Coverage ────────────────────────────────────────────────────────────────

/** 'fresh' | 'stale' | 'empty' | 'no_route' — see coverageService. */
export type CoverageStatus = 'fresh' | 'stale' | 'empty' | 'no_route';

export interface CoverageRow {
  slug: string;
  last24h: number;
  last7d: number;
  lastPublishedAt: string | null;
  ageDays: number | null;
  status: CoverageStatus;
}

export interface Coverage {
  windowDays: number;
  publishedInWindow: number;
  publishedLast24h: number;
  dailyTarget: number;
  sections: CoverageRow[];
  regions: CoverageRow[];
  plan: { slug: string; label: string; targetPct: number }[];
  staleAfterDays: number;
}
