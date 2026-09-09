'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import {
  useQuota,
  useSignals,
  usePreflight,
  useBriefs,
  useDrafts,
  useDraft,
  useRunPipeline,
  useRunDrafting,
  useGateDraft,
  useApproveDraft,
  useRejectDraft,
  useCoverage,
} from '@/lib/queries/editorial.queries';
import type { ArticleDraft, ContentBlock, CoverageRow, GateResult, StoryBrief } from '@/lib/types/editorial.types';
import './newsroom.css';

/** The nine gates, in the order a reviewer works down them. */
const GATE_ORDER = [
  'minSources', 'maxSimilarity', 'citationCoverage', 'bannedClaims', 'requiredSections',
  'quoteVerification', 'wordCount', 'reviewerDistinct', 'requireOriginalArt',
  'rateLimits', 'publishWindow', 'dailyMax', 'hourlyMax', 'minMinutesBetweenPosts',
  'categoryMaxPerDay', 'maxArticlesPerAuthorPerDay', 'deadCategoryRoute',
];

const GATE_LABEL: Record<string, string> = {
  minSources: 'Sourcing',
  maxSimilarity: 'Similarity',
  citationCoverage: 'Citation coverage',
  bannedClaims: 'Banned claims',
  requiredSections: 'Section skeleton',
  quoteVerification: 'Quote verification',
  wordCount: 'Word budget',
  reviewerDistinct: 'Reviewer ≠ author',
  requireOriginalArt: 'Original art',
  rateLimits: 'Rate limits',
  publishWindow: 'Publishing window',
  dailyMax: 'Daily ceiling',
  hourlyMax: 'Hourly cap',
  minMinutesBetweenPosts: 'Minimum spacing',
  categoryMaxPerDay: 'Beat ceiling',
  maxArticlesPerAuthorPerDay: 'Byline ceiling',
  deadCategoryRoute: 'Live route',
};

const pct = (v: string | number | null | undefined) =>
  v == null || v === '' ? '—' : `${Number(v).toFixed(1)}%`;

function sortGates(results: GateResult[]): GateResult[] {
  const rank = (r: GateResult) => {
    const i = GATE_ORDER.indexOf(r.rule);
    return (r.status === 'failed' ? 0 : 1000) + (i === -1 ? 500 : i);
  };
  return [...results].sort((a, b) => rank(a) - rank(b));
}

function Stage({ label, value, note, blocked }: {
  label: string; value: string | number; note?: string; blocked?: boolean;
}) {
  return (
    <div className={`bv-newsroom__stage${blocked ? ' bv-newsroom__stage--blocked' : ''}`}>
      <span className="bv-newsroom__stage-k">{label}</span>
      <span className="bv-newsroom__stage-v">{value}</span>
      <span className="bv-newsroom__stage-note">{note ?? ''}</span>
    </div>
  );
}

function DraftBody({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="bv-newsroom__body">
      {(blocks ?? []).map((b) => {
        if (b.type === 'heading') return <h2 key={b.id}>{b.content?.text}</h2>;
        const html = b.content?.html ?? '';
        // Blocks are written by draftService, which escapes every interpolated
        // string before wrapping it in <p> — the only markup here is its own.
        return <div key={b.id} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}

const COVERAGE_LABEL: Record<string, string> = {
  fresh: 'FRESH', stale: 'STALE', empty: 'NONE', no_route: 'NO ROUTE',
};

/** One section or region, with how long since it was last filed to. */
function CoverageLine({ row }: { row: CoverageRow }) {
  const tone = row.status === 'fresh' ? 'pass' : row.status === 'stale' ? 'hold' : 'fail';
  return (
    <div className="bv-newsroom__cov">
      <span className="bv-newsroom__cov-n">{row.slug}</span>
      <span className="bv-newsroom__cov-c">{row.last7d}</span>
      <span className={`bv-nr-pill bv-nr-pill--${tone}`}>
        {COVERAGE_LABEL[row.status]}
        {row.ageDays !== null && row.status !== 'fresh' ? ` ${row.ageDays}d` : ''}
      </span>
    </div>
  );
}

export default function NewsroomPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: quota } = useQuota(websiteId);
  const { data: preflight } = usePreflight(websiteId);
  // Not filtered by decision: a signal leaves 'accepted' for 'clustered' the
  // moment stage 2 runs, so filtering on 'accepted' reports zero on-beat stories
  // immediately after a successful run.
  const { data: signals } = useSignals(websiteId, { limit: 500 });
  const { data: briefs } = useBriefs(websiteId, { limit: 100 });
  const { data: drafts, isLoading: draftsLoading } = useDrafts(websiteId, { limit: 100 });
  const { data: openDraft } = useDraft(websiteId, selectedId);
  const { data: coverage } = useCoverage(websiteId);

  const runPipeline = useRunPipeline(websiteId);
  const runDrafting = useRunDrafting(websiteId);
  const gateDraft = useGateDraft(websiteId);
  const approveDraft = useApproveDraft(websiteId);
  const rejectDraft = useRejectDraft(websiteId);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: 'Websites', href: '/cms/websites' },
      { label: 'Newsroom' },
    ]);
  }, [setBreadcrumbs]);

  // Open the first draft as soon as the queue arrives — an empty reader beside a
  // full queue reads as broken.
  useEffect(() => {
    if (!selectedId && drafts?.length) setSelectedId(drafts[0].id);
  }, [drafts, selectedId]);

  const briefList: StoryBrief[] = briefs ?? [];
  const draftList: ArticleDraft[] = drafts ?? [];

  const counts = useMemo(() => ({
    briefsReady: briefList.filter((b) => b.status === 'ready').length,
    briefsBlocked: briefList.filter((b) => b.status === 'insufficient_sources').length,
    primary: briefList.filter((b) => b.sourcingBasis === 'verified_primary').length,
    gatePassed: draftList.filter((d) => d.gateStatus === 'passed' && d.status === 'drafted').length,
    gateFailed: draftList.filter((d) => d.gateStatus === 'failed').length,
    published: draftList.filter((d) => d.status === 'published').length,
  }), [briefList, draftList]);

  const onBeat = (signals ?? []).filter((s) => s.decision !== 'rejected');
  const lastRun = runPipeline.data;
  const blockers = (preflight?.problems ?? []).filter((p) => p.blocks !== 'intake');
  const gates = openDraft ? sortGates(openDraft.gateResults ?? []) : [];
  const busy = runPipeline.isPending || runDrafting.isPending;

  return (
    <div className="bv-newsroom">
      <header className="bv-newsroom__masthead">
        <span className="bv-newsroom__wordmark">Baalvion <span>Newsroom</span></span>
        <span className="bv-newsroom__site">
          {quota ? `${quota.publishedToday}/${quota.dailyTarget} today · ceiling ${quota.hardCeiling}` : 'loading desk state'}
        </span>
        <span className="bv-newsroom__live">
          <span className="bv-newsroom__dot" />
          {quota?.windowOpen ? 'Window open' : 'Window closed'}
        </span>
      </header>

      {blockers.length > 0 && (
        <div className="bv-newsroom__alert">
          {blockers.map((p) => `${p.code}: ${p.message}`).join('  ·  ')}
        </div>
      )}

      <div className="bv-newsroom__rail">
        <Stage
          label="1 · Intake"
          value={onBeat.length || '—'}
          note={`${signals?.length ?? 0} scanned this window`}
        />
        <Stage
          label="2 · Clusters"
          value={lastRun?.stages?.cluster?.clusters ?? '—'}
          note={lastRun?.stages?.cluster
            ? `${lastRun.stages.cluster.withPrimary ?? 0} with a primary document`
            : 'run to measure'}
        />
        <Stage
          label="3 · Briefs"
          value={counts.briefsReady}
          note={`${counts.primary} primary · ${counts.briefsBlocked} unsourced`}
        />
        <Stage
          label="4 · Drafts"
          value={draftList.filter((d) => d.status === 'drafted').length}
          note={blockers.some((b) => b.code === 'LLM_NOT_CONFIGURED') ? 'no model key' : 'awaiting review'}
          blocked={blockers.some((b) => b.code === 'LLM_NOT_CONFIGURED')}
        />
        <Stage
          label="5 · Gates"
          value={counts.gatePassed}
          note={`${counts.gateFailed} held · ${counts.published} published`}
        />
      </div>

      <div className="bv-newsroom__work">
        {/* queue ------------------------------------------------------- */}
        <section className="bv-newsroom__pane">
          <div className="bv-newsroom__pane-head">
            <span className="bv-newsroom__pane-title">Draft queue</span>
            <span className="bv-newsroom__pane-count">{draftList.length}</span>
          </div>
          <div className="bv-newsroom__pane-body">
            {draftsLoading && <div className="bv-newsroom__empty">Loading</div>}
            {!draftsLoading && draftList.length === 0 && (
              <div className="bv-newsroom__empty">No drafts yet — run the pipeline</div>
            )}
            {draftList.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`bv-newsroom__row${d.id === selectedId ? ' bv-newsroom__row--on' : ''}`}
              >
                <span className="bv-newsroom__row-t">{d.title}</span>
                <span className="bv-newsroom__row-m">
                  <span className={`bv-nr-pill bv-nr-pill--${
                    d.status === 'published' ? 'pass'
                      : d.gateStatus === 'passed' ? 'pass'
                        : d.gateStatus === 'failed' ? 'fail' : 'idle'
                  }`}
                  >
                    {d.status === 'published' ? 'live' : d.gateStatus}
                  </span>
                  <span>sim {pct(d.similarityPct)}</span>
                  <span>cite {pct(d.citationCoveragePct)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* reader ------------------------------------------------------ */}
        <section className="bv-newsroom__pane">
          <div className="bv-newsroom__pane-head">
            <span className="bv-newsroom__pane-title">Draft</span>
            <span className="bv-newsroom__pane-count">{openDraft?.modelUsed ?? ''}</span>
          </div>
          <div className="bv-newsroom__pane-body">
            {!openDraft && <div className="bv-newsroom__empty">Select a draft</div>}
            {openDraft && (
              <article className="bv-newsroom__reader">
                <p className="bv-newsroom__kicker">{openDraft.categoryHint ?? 'unfiled'}</p>
                <h1 className="bv-newsroom__hed">{openDraft.title}</h1>
                {openDraft.dek && <p className="bv-newsroom__dek">{openDraft.dek}</p>}
                <p className="bv-newsroom__meta">
                  <span>{openDraft.authorSlug ?? 'no byline'}</span>
                  <span>{openDraft.citations?.length ?? 0} citations</span>
                  <span>{new Date(openDraft.createdAt).toLocaleString()}</span>
                </p>
                <DraftBody blocks={openDraft.contentBlocks} />
              </article>
            )}
          </div>
        </section>

        {/* gates ------------------------------------------------------- */}
        <section className="bv-newsroom__pane">
          <div className="bv-newsroom__pane-head">
            <span className="bv-newsroom__pane-title">Gates</span>
            <span className="bv-newsroom__pane-count">
              {gates.length ? `${gates.filter((g) => g.status === 'passed').length}/${gates.length}` : '—'}
            </span>
          </div>

          {openDraft && (
            <div className="bv-newsroom__metrics">
              <div className="bv-newsroom__metric">
                <span className="bv-newsroom__metric-k">Similarity</span>
                <span className="bv-newsroom__metric-v">{pct(openDraft.similarityPct)}</span>
              </div>
              <div className="bv-newsroom__metric">
                <span className="bv-newsroom__metric-k">Cited</span>
                <span className="bv-newsroom__metric-v">{pct(openDraft.citationCoveragePct)}</span>
              </div>
              <div className="bv-newsroom__metric">
                <span className="bv-newsroom__metric-k">Status</span>
                <span className="bv-newsroom__metric-v">{openDraft.status}</span>
              </div>
            </div>
          )}

          <div className="bv-newsroom__pane-body">
            {!openDraft && <div className="bv-newsroom__empty">No draft selected</div>}
            {openDraft && gates.length === 0 && (
              <div className="bv-newsroom__empty">Not yet gated — run the check</div>
            )}
            {gates.map((g) => (
              <div key={g.rule} className={`bv-newsroom__gate bv-newsroom__gate--${g.status === 'failed' ? 'fail' : 'pass'}`}>
                <span className="bv-newsroom__gate-k">
                  <span>{GATE_LABEL[g.rule] ?? g.rule}</span>
                  <span>{g.status === 'failed' ? 'REFUSED' : 'OK'}</span>
                </span>
                <span className="bv-newsroom__gate-m">{g.message}</span>
              </div>
            ))}
          </div>

          {coverage && (
            <div className="bv-newsroom__cov-block">
              <div className="bv-newsroom__pane-head">
                <span className="bv-newsroom__pane-title">Coverage · {coverage.windowDays}d</span>
                <span className="bv-newsroom__pane-count">
                  {coverage.publishedLast24h}/{coverage.dailyTarget} today
                </span>
              </div>
              <div className="bv-newsroom__cov-sub">Regions — /world</div>
              {coverage.regions.map((r) => <CoverageLine key={r.slug} row={r} />)}
              <div className="bv-newsroom__cov-sub">Sections publishing into</div>
              {coverage.sections
                .filter((sec) => sec.status !== 'no_route' || sec.last7d > 0)
                .slice(0, 8)
                .map((sec) => <CoverageLine key={sec.slug} row={sec} />)}
            </div>
          )}

          <div className="bv-newsroom__actions">
            <button
              type="button"
              className="bv-nr-btn bv-nr-btn--go"
              disabled={busy}
              onClick={() => runPipeline.mutate({})}
            >
              {runPipeline.isPending ? 'Running…' : 'Run pipeline'}
            </button>
            <button
              type="button"
              className="bv-nr-btn"
              disabled={busy || counts.briefsReady === 0}
              onClick={() => runDrafting.mutate({ limit: 5 })}
            >
              Draft {counts.briefsReady} ready brief{counts.briefsReady === 1 ? '' : 's'}
            </button>
            <button
              type="button"
              className="bv-nr-btn"
              disabled={!openDraft || gateDraft.isPending}
              onClick={() => selectedId && gateDraft.mutate(selectedId)}
            >
              Re-run gates
            </button>
            <button
              type="button"
              className="bv-nr-btn"
              disabled={!openDraft || openDraft.gateStatus !== 'passed' || openDraft.status === 'published' || approveDraft.isPending}
              onClick={() => selectedId && approveDraft.mutate({ draftId: selectedId })}
            >
              {openDraft?.status === 'published' ? 'Published' : 'Approve & publish'}
            </button>
            <button
              type="button"
              className="bv-nr-btn"
              disabled={!openDraft || openDraft.status === 'published' || rejectDraft.isPending}
              onClick={() => selectedId && rejectDraft.mutate({ draftId: selectedId })}
            >
              Reject
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
