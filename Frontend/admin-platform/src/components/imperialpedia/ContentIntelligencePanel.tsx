'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { serviceClients, normalizeError } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { buildSignalRows, describeProviderResult, originalityCheckButtonLabel, severityForProviderSimilarity, type OriginalityCheckState, type OriginalityProviderResult } from '@/lib/content-intelligence/originality';
import {
  categoryLabel,
  evidenceStatusLabel,
  evidenceStatusSeverity,
  sourceQualityLabel,
  buildSummaryRows,
  verifyClaimsButtonLabel,
  mergeResearchIntoClaims,
  type Claim,
  type FactSourceIntelligence,
  type ClaimResearchResult,
  type VerifyClaimsState,
} from '@/lib/content-intelligence/factSource';
import {
  statusLabel,
  statusSeverity,
  statusExplanation,
  categorySymbol,
  isAuditStale,
  relativeTimeFrom,
  runAuditButtonLabel,
  externalVerificationLabel,
  isDismissible,
  type FullEditorialAudit,
  type AuditCategory,
  type RunAuditState,
} from '@/lib/content-intelligence/editorialAudit';
import {
  deriveUiStatus,
  reviewStatusLabel,
  reviewStatusSeverity,
  reviewStatusExplanation,
  isChecklistComplete,
  canApprove,
  approveButtonLabel,
  shortFingerprint,
  reviewerDisplayName,
  type EditorialReviewState,
  type EditorialReviewRecord,
  type ApproveReviewState,
} from '@/lib/content-intelligence/editorialReview';
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle, Circle, Sparkles, ScanSearch, ShieldCheck, ClipboardCheck } from 'lucide-react';

// Below this word count we don't even call the API — matches the backend's own
// MIN_ANALYZABLE_WORDS floor (articleAnalysisService.js), avoids wasted requests on "Hello world".
const MIN_WORDS_TO_ANALYZE = 30;
const DEBOUNCE_MS = 900;

interface AnalyzeInput {
  articleId?: number;
  title: string;
  content: string;
  summary?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  status?: string;
  category?: string;
}

interface Issue { area: string; severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION'; message: string }

interface LengthMetrics {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentenceLength: number;
  avgParagraphLength: number;
}

interface Depth {
  wordCount: number;
  topicComplexity: 'low' | 'medium' | 'high';
  suggestedMin: number;
  suggestedMax: number;
  reason: string;
  currentDepth: string;
}

interface PrimaryTopicCoverage {
  topic: string;
  inTitle: boolean;
  inH1: boolean;
  inIntroduction: boolean;
  inHeadings: number;
  inConclusion: boolean | null;
  occurrences: number;
  status: string;
}

interface TopicCoverageEntry { concept: string; status: 'covered' | 'partial' | 'missing'; note: string }

interface SemanticCoverage { headingStuffing: boolean; consecutiveUsage: boolean; forcedSynonymPattern: boolean; issues: string[] }

interface CannibalizationEntry { slug: string; title: string; sharedWords: string[]; note: string }

interface WritingSignals {
  repeatedPhrasesCount: number;
  repeatedOpeningsCount: number;
  genericWordingCount: number;
  formulaicStructure: string;
  sentenceVariation: 'Good' | 'Warning';
  paragraphVariation: 'Good' | 'Warning';
  punctuationPattern: string;
}

interface InternalOverlapEntry { slug: string; title: string; similarity: number; matchingPassage: string | null; note: string }

const ORIGINALITY_REVIEW_STATUSES = ['Clean', 'Review recommended', 'External check required', 'Provider unavailable', 'Not checked'] as const;

interface AnalysisResult {
  analyzable: boolean;
  message?: string;
  wordCount: number;
  overallScore?: number;
  scores?: { seo: number; structure: number; readability: number; writingQuality: number; internalLinking: number };
  length?: LengthMetrics;
  depth?: Depth;
  topics?: { primary: string | null; confidence: string; related: { phrase: string; occurrences: number }[]; aiSuggestedMissing: string[] | null };
  primaryTopicCoverage?: PrimaryTopicCoverage | null;
  topicCoverage?: TopicCoverageEntry[];
  semanticCoverage?: SemanticCoverage;
  cannibalization?: CannibalizationEntry[];
  intent?: { detected: string; confidence: string; coverage: string; missing: string | null };
  title?: { length: number; issues: Issue[] };
  headings?: { list: { level: number; text: string }[]; issues: string[] };
  readability?: { fleschScore: number | null; avgSentenceLength: number; longSentenceCount: number; label: string };
  questions?: string[];
  writingQuality?: {
    repeatedPhrases: { phrase: string; occurrences: number }[];
    repeatedOpenings: { opener: string; occurrences: number }[];
    genericPhrases: string[];
    emDash: { count: number; unusual: boolean };
    keywordStuffing: { occurrences: number; stuffed: boolean };
  };
  seo?: {
    metaTitle: { current: string | null; suggestion: string | null };
    metaDescription: { current: string | null; suggestion: string | null; tooShort: boolean; tooLong: boolean };
    slug: { current: string; suggestion: string; note: string } | null;
  };
  internalLinks?: { anchor: string; targetSlug: string; targetTitle: string }[];
  sourceOpportunities?: string[];
  writingSignals?: WritingSignals;
  internalOverlap?: InternalOverlapEntry[];
  originalityReview?: { status: typeof ORIGINALITY_REVIEW_STATUSES[number] };
  factSourceIntelligence?: FactSourceIntelligence;
  issues?: Issue[];
  aiEnhanced?: boolean;
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'text-emerald-600' : value >= 60 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <Progress value={value} className="h-1.5 flex-1" />
      <span className={`w-8 text-right font-medium ${color}`}>{value}</span>
    </div>
  );
}

function StatusIcon({ status }: { status: 'ok' | 'warn' | 'todo' }) {
  if (status === 'ok') return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />;
  if (status === 'warn') return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />;
  return <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

const SEVERITY_STYLES: Record<Issue['severity'], string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  WARNING: 'bg-amber-100 text-amber-700',
  SUGGESTION: 'bg-slate-100 text-slate-600',
};

const EVIDENCE_SEVERITY_COLOR: Record<'ok' | 'warn' | 'todo', string> = {
  ok: 'text-emerald-600',
  warn: 'text-amber-600',
  todo: 'text-muted-foreground',
};

function ClaimRow({ claim, research, onLocate }: { claim: Claim; research: ClaimResearchResult | undefined; onLocate?: (needle: string) => void }) {
  const evidenceStatus = research?.status ?? (claim.researchStatus === 'not_researched' ? null : 'needs_research');
  return (
    <li className="rounded-md border border-border/60 p-2">
      <button type="button" onClick={() => onLocate?.(claim.text)} className="flex w-full items-start gap-2 text-left text-xs hover:underline">
        <Badge className={`shrink-0 px-1.5 py-0 text-[10px] ${SEVERITY_STYLES[claim.severity]}`}>{claim.severity}</Badge>
        <span>{claim.text}</span>
      </button>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-1 text-[11px] text-muted-foreground">
        <span>{categoryLabel(claim.category)}</span>
        <span>·</span>
        <span>{claim.citationPresent ? `Source: ${sourceQualityLabel(claim.sourceQuality)}` : 'Not verified'}</span>
        {claim.timeSensitive && <span className="text-amber-600">· Time-sensitive</span>}
        {claim.jurisdiction.unclear && <span className="text-amber-600">· Jurisdiction unclear</span>}
        {claim.primarySourceOpportunity && <span className="text-amber-600">· Primary-source opportunity ({claim.recommendedSourceType})</span>}
      </div>
      {evidenceStatus && (
        <div className={`mt-1 pl-1 text-[11px] ${EVIDENCE_SEVERITY_COLOR[evidenceStatusSeverity(evidenceStatus)]}`}>
          {evidenceStatusLabel(evidenceStatus)}
        </div>
      )}
      {research && research.sources.length > 0 && (
        <details className="mt-1 pl-1">
          <summary className="cursor-pointer text-[11px] text-muted-foreground">Evidence ({research.sources.length})</summary>
          <ul className="mt-1 space-y-1.5">
            {research.sources.map((s, i) => (
              <li key={`${s.url}-${i}`} className="rounded border border-border/50 p-1.5 text-[11px]">
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground">
                  {sourceQualityLabel(s.authorityLevel)}
                  {s.publishedAt ? ` · ${s.publishedAt}` : ''}
                  {s.sourceType ? ` · ${s.sourceType}` : ''}
                </p>
                {s.relevance && <p className="text-muted-foreground italic">{s.relevance}</p>}
                <p>
                  {s.supportsClaim === true && <span className="text-emerald-600">Supports this claim</span>}
                  {s.supportsClaim === false && <span className="text-red-600">Contradicts this claim</span>}
                  {s.supportsClaim === null && <span className="text-muted-foreground">Relevance unclear</span>}
                </p>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open Source</a>
              </li>
            ))}
          </ul>
        </details>
      )}
      {research?.sourceConflict && (
        <p className="mt-1 pl-1 text-[11px] text-amber-700">
          Sources disagree — human editor must resolve the discrepancy.
        </p>
      )}
      {research?.note && research.sources.length === 0 && (
        <p className="mt-1 pl-1 text-[11px] text-muted-foreground">{research.note}</p>
      )}
    </li>
  );
}

const CATEGORY_STATUS_COLOR: Record<'ok' | 'warn' | 'critical', string> = {
  ok: 'text-emerald-600',
  warn: 'text-amber-600',
  critical: 'text-red-600',
};

const AUDIT_STATUS_COLOR: Record<'ok' | 'warn' | 'critical' | 'todo', string> = {
  ok: 'text-emerald-600',
  warn: 'text-amber-600',
  critical: 'text-red-600',
  todo: 'text-muted-foreground',
};

function AuditCategoryRow({
  category, dismissed, onDismiss, onLocate,
}: {
  category: AuditCategory;
  dismissed: Set<string>;
  onDismiss: (key: string) => void;
  onLocate?: (needle: string) => void;
}) {
  const visibleIssues = category.issues.filter((i) => !dismissed.has(`${category.key}:${i.message}`));
  return (
    <details className="rounded-md border border-border/60 p-2">
      <summary className="flex cursor-pointer items-center justify-between text-xs">
        <span className={`flex items-center gap-1.5 font-medium ${CATEGORY_STATUS_COLOR[category.status]}`}>
          {categorySymbol(category.status)} {category.label}
        </span>
        <span className="text-muted-foreground">{category.issueCount === 0 ? 'No issues' : `${category.issueCount} issue${category.issueCount === 1 ? '' : 's'}`}</span>
      </summary>
      {visibleIssues.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {visibleIssues.map((issue, i) => {
            const key = `${category.key}:${issue.message}`;
            return (
              <li key={`${key}-${i}`} className="flex items-start justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => issue.location && onLocate?.(issue.location)}
                  className="flex flex-1 items-start gap-1.5 text-left hover:underline"
                  disabled={!issue.actionable}
                >
                  <Badge className={`shrink-0 px-1.5 py-0 text-[10px] ${SEVERITY_STYLES[issue.severity]}`}>{issue.severity}</Badge>
                  <span>{issue.message}</span>
                </button>
                {isDismissible(issue) && (
                  <button type="button" onClick={() => onDismiss(key)} className="shrink-0 text-[10px] text-muted-foreground hover:underline">
                    Dismiss
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
}

interface Props {
  input: AnalyzeInput;
  /** Optional: scroll/focus the editor to a piece of flagged text. Best-effort only. */
  onLocate?: (needle: string) => void;
}

/**
 * Live Content Intelligence — editorial + SEO suggestions for the writer, computed by
 * POST /ai/article-analysis. Debounced on the title/content the writer is actively editing;
 * never blocks saving/publishing and never rewrites the article itself (see analyzeArticle in
 * articleAnalysisService.js for the full heuristic list — suggestions only, everywhere).
 */
export function ContentIntelligencePanel({ input, onLocate }: Props) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [manualNonce, setManualNonce] = useState(0);
  const debouncedTitle = useDebounce(input.title, DEBOUNCE_MS);
  const debouncedContent = useDebounce(input.content, DEBOUNCE_MS);

  const wordCount = useMemo(
    () => (debouncedContent.trim() ? debouncedContent.trim().split(/\s+/).length : 0),
    [debouncedContent]
  );
  const belowThreshold = wordCount < MIN_WORDS_TO_ANALYZE;

  const query = useQuery({
    // manualNonce lets [Analyze Now] force a refetch even if the debounced text hasn't changed.
    queryKey: ['imperialpedia', 'article-analysis', debouncedTitle, debouncedContent, input.metaDescription, input.slug, manualNonce],
    queryFn: async () => {
      const payload: AnalyzeInput = {
        articleId: input.articleId,
        title: debouncedTitle,
        content: debouncedContent,
        summary: input.summary,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        slug: input.slug,
        status: input.status,
        category: input.category,
      };
      const res = await serviceClients.imperialpedia.post<{ data: AnalysisResult }>('/ai/article-analysis', payload);
      return res.data.data ?? (res.data as unknown as AnalysisResult);
    },
    enabled: !belowThreshold,
    staleTime: 30_000,
    retry: 1,
  });

  const data = query.data;

  // External originality check: EXPLICIT action only — never triggered by the debounced
  // auto-analysis above, so an external provider is never called on every keystroke (spec §15).
  const originalityCheck = useMutation({
    mutationFn: async () => {
      const res = await serviceClients.imperialpedia.post<{ data: OriginalityProviderResult & { checkedAt: string; matches: unknown[]; originalityReview: { status: string } } }>(
        '/ai/originality-check',
        { articleId: input.articleId, title: input.title, content: input.content, slug: input.slug }
      );
      return res.data.data ?? (res.data as unknown as OriginalityProviderResult);
    },
  });
  const originalityCheckState: OriginalityCheckState = originalityCheck.isPending
    ? 'pending'
    : originalityCheck.isError
      ? 'error'
      : originalityCheck.isSuccess
        ? 'success'
        : 'idle';

  // Explicit claim research (Prompt 3 Stage B): EXPLICIT action only, same reasoning as the
  // originality check above — never triggered by the debounced auto-analysis, so an external
  // research provider is never called on every keystroke. Stage A claim DETECTION above is
  // already part of `data` (the debounced /ai/article-analysis response); this mutation only
  // requests research/evidence for those already-detected claims.
  const verifyClaims = useMutation({
    mutationFn: async () => {
      const res = await serviceClients.imperialpedia.post<{ data: { researchStatus: string; provider: string | null; results: ClaimResearchResult[]; skippedCount?: number } }>(
        '/ai/verify-claims',
        { title: input.title, content: input.content }
      );
      return res.data.data ?? (res.data as unknown as { researchStatus: string; provider: string | null; results: ClaimResearchResult[] });
    },
  });
  const verifyClaimsState: VerifyClaimsState = verifyClaims.isPending
    ? 'pending'
    : verifyClaims.isError
      ? 'error'
      : verifyClaims.isSuccess
        ? 'success'
        : 'idle';
  const researchByClaimId = mergeResearchIntoClaims(data?.factSourceIntelligence?.claims ?? [], verifyClaims.data?.results);

  // Prompt 4 — Full Editorial Audit: an EXPLICIT, manual "Run Full Audit" action, never part of
  // the debounced typing loop. It aggregates the local analysis already in `data`, plus the
  // most recent (already server-produced) originality-check and verify-claims results this
  // session holds, if any — never a fresh external provider call from here (spec §17/§30).
  const [dismissedAuditIssues, setDismissedAuditIssues] = useState<Set<string>>(new Set());
  const [checkedReviewItems, setCheckedReviewItems] = useState<Set<string>>(new Set());
  const [reviewerNote, setReviewerNote] = useState('');
  const [acknowledgedCritical, setAcknowledgedCritical] = useState(false);
  const fullAudit = useMutation({
    mutationFn: async () => {
      const payload = {
        articleId: input.articleId,
        title: input.title,
        content: input.content,
        summary: input.summary,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        slug: input.slug,
        status: input.status,
        category: input.category,
        externalOriginality: originalityCheck.data
          ? { status: originalityCheck.data.status, similarity: originalityCheck.data.similarity }
          : undefined,
        claimResearch: verifyClaims.data
          ? { researchStatus: verifyClaims.data.researchStatus, results: verifyClaims.data.results.map((r) => ({ claimId: r.claimId, status: r.status, sourceConflict: r.sourceConflict })) }
          : undefined,
      };
      const res = await serviceClients.imperialpedia.post<{ data: FullEditorialAudit }>('/ai/full-editorial-audit', payload);
      return res.data.data ?? (res.data as unknown as FullEditorialAudit);
    },
    onSuccess: () => {
      // A fresh audit reflects a NEW snapshot of the article — prior dismissals/checklist state
      // referred to the OLD audit's issues, so they're cleared rather than silently carried
      // forward onto possibly-different issues.
      setDismissedAuditIssues(new Set());
      setCheckedReviewItems(new Set());
      setAcknowledgedCritical(false);
    },
  });
  const runAuditState: RunAuditState = fullAudit.isPending ? 'pending' : fullAudit.isError ? 'error' : fullAudit.isSuccess ? 'success' : 'idle';
  const stale = isAuditStale(fullAudit.data ?? null, input.title, input.content);
  const toggleReviewItem = (id: string) => setCheckedReviewItems((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const dismissAuditIssue = (key: string) => setDismissedAuditIssues((prev) => new Set(prev).add(key));

  // PROMPT 5 — Human-Vetted Publishing Workflow. The server is authoritative for review/approval
  // state (spec §29); this query reads GET /articles/:id/editorial-review, which is only
  // meaningful once the article has been saved (has a real id).
  const reviewQuery = useQuery({
    queryKey: ['imperialpedia', 'editorial-review', input.articleId],
    queryFn: async () => {
      const res = await serviceClients.imperialpedia.get<{ data: EditorialReviewState }>(`/articles/${input.articleId}/editorial-review`);
      return res.data.data ?? (res.data as unknown as EditorialReviewState);
    },
    enabled: Boolean(input.articleId),
    staleTime: 5_000,
  });

  const checklistIds = fullAudit.data ? fullAudit.data.humanReviewChecklist.map((item) => item.id) : [];
  const checklistComplete = isChecklistComplete(checkedReviewItems, checklistIds);
  const criticalCount = fullAudit.data?.summary.critical ?? 0;
  const serverReviewStatus = reviewQuery.data?.status ?? 'NOT_REVIEWED';
  const reviewUiStatus = deriveUiStatus(serverReviewStatus, checkedReviewItems.size, checklistIds.length);
  const approveIsAllowed = canApprove({
    checklistComplete,
    auditStale: stale || !fullAudit.data,
    criticalCount,
    acknowledgedCritical,
    hasArticleId: Boolean(input.articleId),
  });

  // Approval is an EXPLICIT, human-triggered action — never automatic, never triggered by
  // running the audit itself (spec §5/§23/§35). It only ever consumes the LAST full audit this
  // session already produced; it never re-runs analysis or calls an external provider.
  const approveReview = useMutation({
    mutationFn: async () => {
      if (!input.articleId || !fullAudit.data) throw new Error('Run the full editorial audit first.');
      const payload = {
        reviewedFingerprint: fullAudit.data.contentFingerprint,
        auditStatusAtReview: fullAudit.data.status,
        criticalCount: fullAudit.data.summary.critical,
        warningCount: fullAudit.data.summary.warnings,
        suggestionCount: fullAudit.data.summary.suggestions,
        checklistState: Object.fromEntries(fullAudit.data.humanReviewChecklist.map((item) => [item.id, checkedReviewItems.has(item.id)])),
        acknowledgedCritical,
        reviewerNote: reviewerNote.trim() || undefined,
      };
      const res = await serviceClients.imperialpedia.post<{ data: { status: string; currentFingerprint: string; review: EditorialReviewRecord } }>(
        `/articles/${input.articleId}/editorial-review/approve`,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'editorial-review', input.articleId] });
    },
  });
  const approveReviewState: ApproveReviewState = approveReview.isPending
    ? 'pending'
    : approveReview.isError
      ? 'error'
      : approveReview.isSuccess
        ? 'success'
        : 'idle';

  return (
    <Card className="sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Content Intelligence
        </CardTitle>
        <Button
          type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs"
          onClick={() => setManualNonce((n) => n + 1)}
          disabled={belowThreshold || query.isFetching}
        >
          {query.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1">Analyze Now</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {belowThreshold && (
          <p className="text-xs text-muted-foreground">
            Write at least {MIN_WORDS_TO_ANALYZE} words ({wordCount} so far) to see live suggestions.
          </p>
        )}

        {!belowThreshold && query.isFetching && !data && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
          </div>
        )}

        {!belowThreshold && query.isError && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Analysis temporarily unavailable ({normalizeError(query.error as AxiosError).message}). Your draft is safe — keep writing.
          </p>
        )}

        {!belowThreshold && data && !data.analyzable && (
          <p className="text-xs text-muted-foreground">{data.message}</p>
        )}

        {!belowThreshold && data?.analyzable && (
          <>
            <div className="space-y-2.5 rounded-md border-2 border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <ClipboardCheck className="h-3.5 w-3.5 text-primary" /> FULL EDITORIAL AUDIT
                </p>
                <Button
                  type="button" size="sm" variant="outline" className="h-7 px-2 text-xs"
                  onClick={() => fullAudit.mutate()}
                  disabled={fullAudit.isPending}
                >
                  {fullAudit.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />}
                  {runAuditButtonLabel(runAuditState, Boolean(fullAudit.data))}
                </Button>
              </div>

              {fullAudit.isError && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Full audit temporarily unavailable ({normalizeError(fullAudit.error as AxiosError).message}). Your draft is safe — try again.
                </p>
              )}

              {!fullAudit.data && !fullAudit.isPending && !fullAudit.isError && (
                <p className="text-xs text-muted-foreground">No full audit has been run yet for this draft.</p>
              )}

              {fullAudit.data && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${AUDIT_STATUS_COLOR[statusSeverity(fullAudit.data.status)]}`}>
                      {statusLabel(fullAudit.data.status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{statusExplanation(fullAudit.data.status)}</p>

                  {stale && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      The article has changed since this audit was generated — audit may be stale.{' '}
                      <button type="button" className="underline" onClick={() => fullAudit.mutate()}>Run Again</button>
                    </p>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    Last full audit: {relativeTimeFrom(fullAudit.data.generatedAt)}
                    {' · '}Content changed since audit: {stale ? 'Yes' : 'No'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span>Critical: <span className="font-medium text-red-600">{fullAudit.data.summary.critical}</span></span>
                    <span>Warnings: <span className="font-medium text-amber-600">{fullAudit.data.summary.warnings}</span></span>
                    <span>Suggestions: <span className="font-medium">{fullAudit.data.summary.suggestions}</span></span>
                  </div>

                  <p className="text-xs italic text-muted-foreground">{fullAudit.data.qualitySummary}</p>

                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <p>External originality: {externalVerificationLabel('originality', fullAudit.data.externalVerification.originality)}</p>
                    <p>External claim verification: {externalVerificationLabel('research', fullAudit.data.externalVerification.research)}</p>
                  </div>

                  <div className="space-y-1.5">
                    {fullAudit.data.categories.map((category) => (
                      <AuditCategoryRow key={category.key} category={category} dismissed={dismissedAuditIssues} onDismiss={dismissAuditIssue} onLocate={onLocate} />
                    ))}
                  </div>

                  <div className="space-y-2 rounded-md border border-border/60 p-2">
                    <p className="text-xs font-semibold text-muted-foreground">HUMAN EDITORIAL REVIEW</p>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                      <span className="text-muted-foreground">
                        Status: <span className={`font-medium ${AUDIT_STATUS_COLOR[reviewStatusSeverity(reviewUiStatus)]}`}>{reviewStatusLabel(reviewUiStatus)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Article version: <span className="font-mono text-foreground">{shortFingerprint(fullAudit.data.contentFingerprint)}</span>
                      </span>
                      {reviewQuery.data?.review && (
                        <span className="text-muted-foreground">
                          Reviewer: <span className="text-foreground">{reviewerDisplayName(reviewQuery.data.review.reviewerUserId, currentUser?.id ?? null, currentUser?.fullName ?? null)}</span>
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        Audit status: <span className="text-foreground">{statusLabel(fullAudit.data.status)}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{reviewStatusExplanation(reviewUiStatus)}</p>

                    {!input.articleId && (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
                        Save the article first — editorial review is tracked against a saved article version.
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <span>Critical: <span className="font-medium text-red-600">{fullAudit.data.summary.critical}</span></span>
                      <span>Warnings: <span className="font-medium text-amber-600">{fullAudit.data.summary.warnings}</span></span>
                      <span>Suggestions: <span className="font-medium">{fullAudit.data.summary.suggestions}</span></span>
                    </div>

                    <p className="text-[11px] font-medium text-muted-foreground">
                      CHECKLIST ({checkedReviewItems.size}/{fullAudit.data.humanReviewChecklist.length} reviewed)
                    </p>
                    <ul className="space-y-1">
                      {fullAudit.data.humanReviewChecklist.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-xs">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={checkedReviewItems.has(item.id)}
                            onChange={() => toggleReviewItem(item.id)}
                            id={`review-${item.id}`}
                          />
                          <label htmlFor={`review-${item.id}`}>{item.label}</label>
                        </li>
                      ))}
                    </ul>

                    {criticalCount > 0 && (
                      <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={acknowledgedCritical}
                          onChange={(e) => setAcknowledgedCritical(e.target.checked)}
                          id="acknowledge-critical"
                        />
                        <label htmlFor="acknowledge-critical">
                          Critical editorial issues remain. Confirm that you reviewed them before approving.
                        </label>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label htmlFor="reviewer-note" className="text-[11px] font-medium text-muted-foreground">Reviewer notes (optional)</label>
                      <textarea
                        id="reviewer-note"
                        rows={2}
                        className="w-full rounded-md border border-border/60 p-1.5 text-xs"
                        placeholder="Add any editorial notes, factual corrections, source decisions, or follow-up items…"
                        value={reviewerNote}
                        onChange={(e) => setReviewerNote(e.target.value)}
                      />
                    </div>

                    <Button
                      type="button" size="sm" variant={reviewUiStatus === 'APPROVED' ? 'default' : 'outline'} className="h-7 px-2 text-xs"
                      disabled={!approveIsAllowed || approveReview.isPending}
                      onClick={() => approveReview.mutate()}
                    >
                      {approveReview.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                      {approveButtonLabel(approveReviewState)}
                    </Button>

                    {approveReview.isError && (
                      <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-800">
                        Could not save editorial review. No approval was recorded. ({normalizeError(approveReview.error as AxiosError).message})
                      </p>
                    )}
                    {approveReview.isSuccess && (
                      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-800">
                        Approved for publication. The existing Publish action on this article will now be available.
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      This records a real, server-side approval tied to this exact article version — it is not an automated score and does not
                      by itself publish the article. Editing the article after approval requires a new review.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{data.overallScore}</span>
              <span className="text-xs text-muted-foreground">/ 100 overall (editorial score, not a ranking or AI-detection score)</span>
            </div>

            {data.scores && (
              <div className="space-y-1.5">
                <ScoreRow label="SEO" value={data.scores.seo} />
                <ScoreRow label="Structure" value={data.scores.structure} />
                <ScoreRow label="Readability" value={data.scores.readability} />
                <ScoreRow label="Writing" value={data.scores.writingQuality} />
                <ScoreRow label="Internal links" value={data.scores.internalLinking} />
              </div>
            )}

            {data.issues && data.issues.length > 0 && (
              <div className="space-y-1.5 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">ISSUES</p>
                <ul className="space-y-1.5">
                  {data.issues.slice(0, 12).map((issue, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-2 text-left text-xs hover:underline"
                        onClick={() => onLocate?.(issue.message)}
                      >
                        <Badge className={`shrink-0 px-1.5 py-0 text-[10px] ${SEVERITY_STYLES[issue.severity]}`}>{issue.severity}</Badge>
                        <span>{issue.message}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(data.length || data.depth) && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">ARTICLE DEPTH</p>
                {data.length && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Words: <span className="text-foreground">{data.length.wordCount}</span></span>
                    <span>Characters: <span className="text-foreground">{data.length.charCount}</span></span>
                    <span>Sentences: <span className="text-foreground">{data.length.sentenceCount}</span></span>
                    <span>Paragraphs: <span className="text-foreground">{data.length.paragraphCount}</span></span>
                    <span>Avg sentence: <span className="text-foreground">{data.length.avgSentenceLength}w</span></span>
                    <span>Avg paragraph: <span className="text-foreground">{data.length.avgParagraphLength}w</span></span>
                  </div>
                )}
                {data.depth && (
                  <div className="mt-1.5 space-y-0.5 text-xs">
                    <p>Topic complexity: <span className="font-medium capitalize">{data.depth.topicComplexity}</span></p>
                    <p className="text-muted-foreground">
                      Suggested depth: approximately {data.depth.suggestedMin}–{data.depth.suggestedMax} words
                    </p>
                    <p className="text-muted-foreground italic">{data.depth.reason}</p>
                    <p>
                      Current depth:{' '}
                      <span className={data.depth.currentDepth === 'Within suggested range' ? 'text-emerald-600' : 'text-amber-600'}>
                        {data.depth.currentDepth}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {data.topics && (
              <div className="space-y-1.5 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">KEYWORD & TOPIC COVERAGE</p>
                {data.topics.primary ? (
                  <>
                    <p className="text-xs">
                      Primary topic: <span className="font-medium">{data.topics.primary}</span>{' '}
                      <span className="text-muted-foreground">({data.topics.confidence} confidence)</span>
                    </p>
                    {data.primaryTopicCoverage && (
                      <p className="text-xs text-muted-foreground">
                        {data.primaryTopicCoverage.status}
                        {' · '}title {data.primaryTopicCoverage.inTitle ? 'yes' : 'no'}
                        {' · '}intro {data.primaryTopicCoverage.inIntroduction ? 'yes' : 'no'}
                        {' · '}{data.primaryTopicCoverage.occurrences}× in body
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No clear primary topic detected yet.</p>
                )}

                {data.topicCoverage && data.topicCoverage.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Covered: {data.topicCoverage.filter((c) => c.status === 'covered').length}
                      {' · '}Partial: {data.topicCoverage.filter((c) => c.status === 'partial').length}
                      {' · '}Missing: {data.topicCoverage.filter((c) => c.status === 'missing').length}
                    </p>
                    <ul className="space-y-1">
                      {data.topicCoverage.slice(0, 10).map((c, i) => (
                        <li key={`${c.concept}-${i}`}>
                          <button
                            type="button"
                            onClick={() => onLocate?.(c.concept)}
                            className="flex w-full items-start gap-1.5 text-left text-xs hover:underline"
                            title={c.note}
                          >
                            <StatusIcon status={c.status === 'covered' ? 'ok' : c.status === 'partial' ? 'warn' : 'todo'} />
                            {c.concept}
                            {c.status === 'missing' && <span className="text-[10px] text-muted-foreground">(AI suggestion — optional)</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {data.semanticCoverage && (
                  <p className="text-xs text-muted-foreground">
                    Semantic coverage:{' '}
                    {data.semanticCoverage.issues.length === 0 ? (
                      <span className="text-emerald-600">reads naturally</span>
                    ) : (
                      <span className="text-amber-600">{data.semanticCoverage.issues.length} signal(s) to review</span>
                    )}
                    {' · '}Keyword stuffing risk:{' '}
                    <span className={data.writingQuality?.keywordStuffing.stuffed ? 'text-amber-600' : 'text-emerald-600'}>
                      {data.writingQuality?.keywordStuffing.stuffed ? 'elevated' : 'low'}
                    </span>
                  </p>
                )}
                {data.semanticCoverage && data.semanticCoverage.issues.length > 0 && (
                  <ul className="space-y-1">
                    {data.semanticCoverage.issues.map((issue, i) => (
                      <li key={i}>
                        <button type="button" onClick={() => onLocate?.(issue)} className="flex w-full items-start gap-1.5 text-left text-xs hover:underline">
                          <StatusIcon status="warn" /> {issue}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {data.cannibalization && data.cannibalization.length > 0 && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">POSSIBLE TOPIC OVERLAP</p>
                {data.cannibalization.map((c) => (
                  <p key={c.slug} className="text-xs text-muted-foreground">
                    <StatusIcon status="warn" /> {c.note} <span className="italic">&ldquo;{c.title}&rdquo;</span> (/{c.slug})
                  </p>
                ))}
              </div>
            )}

            {data.intent && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">SEARCH INTENT</p>
                <p className="text-xs">
                  {data.intent.detected} <span className="text-muted-foreground">({data.intent.confidence})</span> — coverage:{' '}
                  <span className={data.intent.coverage === 'Good' ? 'text-emerald-600' : 'text-amber-600'}>{data.intent.coverage}</span>
                </p>
                {data.intent.missing && <p className="text-xs text-muted-foreground">Missing: {data.intent.missing}</p>}
              </div>
            )}

            {data.headings && data.headings.list.length > 0 && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">HEADING STRUCTURE</p>
                {data.headings.issues.length === 0 ? (
                  <p className="flex items-center gap-1.5 text-xs"><StatusIcon status="ok" /> Hierarchy looks fine</p>
                ) : (
                  data.headings.issues.map((issue, i) => (
                    <button key={i} type="button" onClick={() => onLocate?.(issue)} className="flex w-full items-start gap-1.5 text-left text-xs hover:underline">
                      <StatusIcon status="warn" /> {issue}
                    </button>
                  ))
                )}
              </div>
            )}

            {data.readability && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">READABILITY</p>
                <p className="text-xs">{data.readability.label}</p>
                <p className="text-xs text-muted-foreground">
                  Avg sentence length {data.readability.avgSentenceLength} words
                  {data.readability.longSentenceCount > 0 && ` · ${data.readability.longSentenceCount} long sentence(s)`}
                </p>
              </div>
            )}

            {data.writingQuality && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">WRITING QUALITY</p>
                {data.writingQuality.repeatedPhrases.length === 0 &&
                data.writingQuality.repeatedOpenings.length === 0 &&
                data.writingQuality.genericPhrases.length === 0 &&
                !data.writingQuality.emDash.unusual &&
                !data.writingQuality.keywordStuffing.stuffed ? (
                  <p className="flex items-center gap-1.5 text-xs"><StatusIcon status="ok" /> No repetition or generic phrasing detected</p>
                ) : (
                  <>
                    {data.writingQuality.repeatedPhrases.map((r) => (
                      <button key={r.phrase} type="button" onClick={() => onLocate?.(r.phrase)} className="flex w-full items-start gap-1.5 text-left text-xs hover:underline">
                        <StatusIcon status="warn" /> "{r.phrase}" ×{r.occurrences}
                      </button>
                    ))}
                    {data.writingQuality.genericPhrases.length > 0 && (
                      <p className="flex items-center gap-1.5 text-xs"><StatusIcon status="warn" /> {data.writingQuality.genericPhrases.length} generic phrase(s)</p>
                    )}
                    {data.writingQuality.emDash.unusual && (
                      <p className="flex items-center gap-1.5 text-xs"><StatusIcon status="warn" /> Em-dash usage unusually frequent ({data.writingQuality.emDash.count})</p>
                    )}
                    {data.writingQuality.keywordStuffing.stuffed && (
                      <p className="flex items-center gap-1.5 text-xs"><StatusIcon status="warn" /> Repetitive keyword usage ({data.writingQuality.keywordStuffing.occurrences}×)</p>
                    )}
                  </>
                )}
              </div>
            )}

            {(data.writingSignals || data.internalOverlap) && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">ORIGINALITY & WRITING SIGNALS</p>

                {data.originalityReview && (
                  <p className="text-xs">
                    Originality review:{' '}
                    <span
                      className={
                        data.originalityReview.status === 'Clean'
                          ? 'text-emerald-600'
                          : data.originalityReview.status === 'External check required'
                            ? 'text-red-600'
                            : 'text-amber-600'
                      }
                    >
                      {data.originalityReview.status}
                    </span>
                  </p>
                )}

                {data.writingSignals && (
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Writing signals</p>
                    {buildSignalRows(data.writingSignals).map((row) => (
                      <div key={row.label} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className={row.warn ? 'text-amber-600' : 'text-foreground'}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-muted-foreground">Internal overlap</p>
                  <p className="text-xs text-muted-foreground">
                    Potential matches: <span className="text-foreground">{data.internalOverlap?.length ?? 0}</span>
                  </p>
                  {data.internalOverlap && data.internalOverlap.length > 0 && (
                    <ul className="space-y-1">
                      {data.internalOverlap.map((m) => (
                        <li key={m.slug}>
                          <button
                            type="button"
                            onClick={() => onLocate?.(m.matchingPassage ?? m.title)}
                            className="flex w-full items-start gap-1.5 text-left text-xs hover:underline"
                            title={m.note}
                          >
                            <StatusIcon status="warn" /> Similar passage found in &ldquo;{m.title}&rdquo; (/{m.slug})
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <p className="text-[11px] font-medium text-muted-foreground">External originality</p>
                  <p className="text-xs text-muted-foreground">{describeProviderResult(originalityCheck.data ?? null)}</p>
                  {originalityCheck.data?.status === 'checked' && severityForProviderSimilarity(originalityCheck.data.similarity) === 'CRITICAL' && (
                    <p className="flex items-center gap-1.5 text-xs text-red-700">
                      <Badge className={`shrink-0 px-1.5 py-0 text-[10px] ${SEVERITY_STYLES.CRITICAL}`}>CRITICAL</Badge>
                      Significant external match reported — originality review recommended before publishing.
                    </p>
                  )}
                  <Button
                    type="button" size="sm" variant="outline" className="h-7 px-2 text-xs"
                    onClick={() => originalityCheck.mutate()}
                    disabled={originalityCheck.isPending}
                  >
                    {originalityCheck.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="mr-1.5 h-3.5 w-3.5" />}
                    {originalityCheckButtonLabel(originalityCheckState)}
                  </Button>
                </div>
              </div>
            )}

            {data.seo && (
              <div className="space-y-1.5 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">SEO</p>
                {data.seo.metaTitle.suggestion && (
                  <p className="text-xs"><StatusIcon status="todo" /> Suggested meta title: <span className="italic">{data.seo.metaTitle.suggestion}</span></p>
                )}
                {data.seo.metaDescription.suggestion && (
                  <p className="text-xs"><StatusIcon status="todo" /> Suggested meta description: <span className="italic">{data.seo.metaDescription.suggestion}</span></p>
                )}
                {data.seo.slug && (
                  <p className="text-xs text-amber-700"><StatusIcon status="warn" /> Slug suggestion: {data.seo.slug.suggestion} — {data.seo.slug.note}</p>
                )}
              </div>
            )}

            {data.internalLinks && data.internalLinks.length > 0 && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">INTERNAL LINK OPPORTUNITIES</p>
                {data.internalLinks.map((link) => (
                  <button key={link.targetSlug} type="button" onClick={() => onLocate?.(link.anchor)} className="flex w-full items-start gap-1.5 text-left text-xs hover:underline">
                    <StatusIcon status="todo" /> "{link.anchor}" → {link.targetTitle}
                  </button>
                ))}
              </div>
            )}

            {data.sourceOpportunities && data.sourceOpportunities.length > 0 && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">SOURCE SUGGESTIONS</p>
                {data.sourceOpportunities.map((s, i) => (
                  <button key={i} type="button" onClick={() => onLocate?.(s)} className="flex w-full items-start gap-1.5 text-left text-xs hover:underline">
                    <StatusIcon status="todo" /> {s}
                  </button>
                ))}
              </div>
            )}

            {data.factSourceIntelligence && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">FACT & SOURCE REVIEW</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {buildSummaryRows(data.factSourceIntelligence.summary).map((row) => (
                    <span key={row.label}>{row.label}: <span className="text-foreground">{row.value}</span></span>
                  ))}
                </div>

                <Button
                  type="button" size="sm" variant="outline" className="h-7 px-2 text-xs"
                  onClick={() => verifyClaims.mutate()}
                  disabled={verifyClaims.isPending || data.factSourceIntelligence.claims.length === 0}
                >
                  {verifyClaims.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />}
                  {verifyClaimsButtonLabel(verifyClaimsState, data.factSourceIntelligence.claims.length)}
                </Button>

                {verifyClaims.isError && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Claim research temporarily unavailable ({normalizeError(verifyClaims.error as AxiosError).message}). Your draft is safe — try again later.
                  </p>
                )}
                {verifyClaims.isSuccess && verifyClaims.data.researchStatus === 'not_configured' && (
                  <p className="text-xs text-muted-foreground">
                    No research provider is configured — claims below are flagged for manual verification, not automatically checked.
                  </p>
                )}

                {data.factSourceIntelligence.claims.length === 0 ? (
                  <p className="flex items-center gap-1.5 text-xs"><StatusIcon status="ok" /> No verifiable claims detected in this draft</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data.factSourceIntelligence.claims.map((claim) => (
                      <ClaimRow key={claim.id} claim={claim} research={researchByClaimId.get(claim.id)} onLocate={onLocate} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
