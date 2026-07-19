'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import { AlertTriangle, CheckCircle2, Link2Off, ImageOff, FileText, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EntityRow {
  id: string;
  type: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  image?: string | null;
  competitors?: string[];
  technologies?: string[];
  key_companies?: string[];
  top_countries?: string[];
  related_technologies?: string[];
  industries?: string[];
}

interface GlossaryRow {
  id: string;
  status: string;
}

const ENTITY_TYPES: Array<{ type: string; label: string }> = [
  { type: 'company', label: 'Companies' },
  { type: 'country', label: 'Countries' },
  { type: 'industry', label: 'Industries' },
  { type: 'technology', label: 'Technologies' },
];

function extractRows<T>(d: unknown): T[] {
  const env = d as { data?: unknown } | undefined;
  const x = (env && 'data' in env ? env.data : env) as unknown;
  if (Array.isArray(x)) return x as T[];
  const items = (x as { items?: unknown })?.items;
  return Array.isArray(items) ? (items as T[]) : [];
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className={cn('text-4xl font-bold tabular-nums', color)}>
      {score}
      <span className="text-lg text-muted-foreground">/100</span>
    </div>
  );
}

/**
 * Content-health rollup for Imperialpedia's knowledge graph — the platform-wide
 * admin dashboard (`/dashboard`) covers infra/identity metrics only and has zero
 * visibility into entities or companies; this page fills that gap with real,
 * computed numbers instead of a static links grid.
 *
 * "Broken links" for a knowledge graph means broken entity relationships:
 * a company listing a competitor slug that no longer exists, a technology
 * referencing a related_technology that was deleted, etc. — computed by cross-
 * checking every relationship array against the actual set of entity slugs,
 * not a placeholder metric.
 */
export default function ImperialpediaAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => {
    setBreadcrumbs([{ label: 'Imperialpedia' }]);
  }, [setBreadcrumbs]);

  const { data: entitiesData, isLoading: entitiesLoading } = useQuery({
    queryKey: ['imperialpedia', 'entities', 'health'],
    queryFn: () => serviceClients.imperialpedia.get('/entities', { params: { limit: 500 } }).then((r) => r.data),
  });
  const { data: glossaryData, isLoading: glossaryLoading } = useQuery({
    queryKey: ['imperialpedia', 'glossary', 'health'],
    queryFn: () => serviceClients.imperialpedia.get('/glossary', { params: { limit: 500 } }).then((r) => r.data),
  });
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['imperialpedia', 'articles', 'health'],
    queryFn: () => serviceClients.imperialpedia.get('/articles', { params: { status: 'all', limit: 500 } }).then((r) => r.data),
  });

  const entities = extractRows<EntityRow>(entitiesData);
  const glossaryTerms = extractRows<GlossaryRow>(glossaryData);
  const articles = extractRows<{ id: number; status: string; is_premium: boolean }>(articlesData);

  const health = useMemo(() => {
    const knownSlugs = new Set(entities.map((e) => `${e.type}:${e.slug}`));
    const countByType: Record<string, number> = {};
    let missingDescription = 0;
    let missingImage = 0;
    let missingCategory = 0;
    const brokenRelationships: { entity: EntityRow; refType: string; refSlug: string }[] = [];

    const checkRefs = (entity: EntityRow, refType: string, slugs?: string[]) => {
      (slugs ?? []).forEach((slug) => {
        if (slug && !knownSlugs.has(`${refType}:${slug}`)) {
          brokenRelationships.push({ entity, refType, refSlug: slug });
        }
      });
    };

    for (const e of entities) {
      countByType[e.type] = (countByType[e.type] ?? 0) + 1;
      if (!e.description?.trim()) missingDescription++;
      if (!e.image?.trim()) missingImage++;
      if (!e.category?.trim()) missingCategory++;

      checkRefs(e, 'company', e.competitors);
      checkRefs(e, 'company', e.key_companies);
      checkRefs(e, 'technology', e.technologies);
      checkRefs(e, 'technology', e.related_technologies);
      checkRefs(e, 'country', e.top_countries);
      checkRefs(e, 'industry', e.industries);
    }

    const totalChecks = entities.length * 3; // description + image + category, per entity
    const failedChecks = missingDescription + missingImage + missingCategory + brokenRelationships.length;
    const score = entities.length > 0 ? Math.max(0, Math.round(100 - (failedChecks / (totalChecks || 1)) * 100)) : 100;

    return { countByType, missingDescription, missingImage, missingCategory, brokenRelationships, score };
  }, [entities]);

  const isLoading = entitiesLoading || glossaryLoading || articlesLoading;
  const glossaryPublished = glossaryTerms.filter((t) => t.status === 'published').length;
  const articlesPremium = articles.filter((a) => a.is_premium).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Imperialpedia" description="Structured entities & editorial content (imperialpedia-service)" />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Content Health Score</CardTitle></CardHeader>
            <CardContent>
              <ScoreRing score={health.score} />
              <p className="mt-1 text-xs text-muted-foreground">
                Across {entities.length} entities — description, image, category &amp; relationship integrity.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Missing Fields</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3.5 w-3.5" /> Missing description</span><span className="font-semibold">{health.missingDescription}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-muted-foreground"><ImageOff className="h-3.5 w-3.5" /> Missing image</span><span className="font-semibold">{health.missingImage}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-muted-foreground"><Tag className="h-3.5 w-3.5" /> Missing category</span><span className="font-semibold">{health.missingCategory}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Broken Relationships</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-2xl font-bold tabular-nums">
                {health.brokenRelationships.length === 0 ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <Link2Off className="h-6 w-6 text-red-600" />
                )}
                {health.brokenRelationships.length}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Competitor / technology / country / industry references pointing at a slug that no longer exists.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && health.brokenRelationships.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertTriangle className="h-4 w-4" /> Broken relationships to fix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {health.brokenRelationships.slice(0, 10).map((b, i) => (
                <div key={i} className="flex items-center justify-between border-b py-1.5 last:border-0">
                  <div>
                    <Link href={`/imperialpedia/entities/${b.entity.type}/${b.entity.slug}/edit`} className="font-medium hover:underline">
                      {b.entity.name}
                    </Link>
                    <span className="text-muted-foreground"> references missing {b.refType} </span>
                    <span className="font-mono text-xs">/{b.refSlug}</span>
                  </div>
                </div>
              ))}
              {health.brokenRelationships.length > 10 && (
                <p className="text-xs text-muted-foreground">+ {health.brokenRelationships.length - 10} more.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENTITY_TYPES.map(({ type, label }) => (
          <Link
            key={type}
            href={`/imperialpedia/entities?type=${type}`}
            className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
          >
            <div className="text-2xl font-bold tabular-nums">{isLoading ? '—' : health.countByType[type] ?? 0}</div>
            <div className="mt-1 text-sm text-muted-foreground">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/imperialpedia/articles"
          className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="font-semibold">Articles →</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? 'Community-authored articles — status, moderation, premium/paywall flag.' :
              `${articles.length} articles, ${articlesPremium} premium.`}
          </p>
        </Link>
        <Link
          href="/imperialpedia/glossary"
          className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="font-semibold">Glossary →</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? 'Investopedia-style financial terms — definitions, formulas, examples, related terms.' :
              `${glossaryTerms.length} terms, ${glossaryPublished} published.`}
          </p>
        </Link>
        <Link
          href="/imperialpedia/entities"
          className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="font-semibold">Entities →</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Structured knowledge-graph entities — companies, countries, industries, technologies.
          </p>
        </Link>
        <Link
          href="/imperialpedia/world"
          className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="font-semibold">World Control →</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Control the live /world markets &amp; news page — indices, watchlist, news source and
            regions.
          </p>
        </Link>
        <Link
          href="/imperialpedia/market-data"
          className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="font-semibold">Market Data →</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Sync health for the live asset_summaries pipeline powering /market-news, /world and
            /markets/quote/* — last success/error, row counts, manual resync.
          </p>
        </Link>
        <Link
          href="/imperialpedia/affiliate"
          className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="font-semibold">Affiliate Products →</div>
          <p className="mt-1 text-sm text-muted-foreground">
            CTA links with click tracking + a revenue-estimate report by merchant, category, or content type.
          </p>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Entities ({entities.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : entities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No entities found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {entities.slice(0, 50).map((e, i) => (
                    <tr key={String(e.id ?? i)} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{e.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{e.type}</td>
                      <td className="py-2 pr-4"><Badge className="bg-gray-100 text-gray-600">published</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
