'use client';

import { Search, Globe, EyeOff, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { SeoMeta } from '@/lib/types/cms.types';
import type { ContentBlock } from '@/lib/types/cms-content.types';
import { computeContentScore, computeKeywordScore, type SeoScoreResult } from '@/lib/cms/seoScore';

interface Props {
  value: SeoMeta;
  onChange: (seo: SeoMeta) => void;
  titleSuffix?: string;
  // Real data for the SERP preview + scores — all optional so this still renders sanely
  // on pages that don't have a saved slug/domain yet (a brand-new, unsaved draft).
  slug?: string;
  blocks?: ContentBlock[];
  websiteDomain?: string | null;
  /** Best-effort public path prefix, e.g. the primary category's slug ("streaming"). */
  pathPrefix?: string | null;
}

function ScoreGauge({ label, result }: { label: string; result: SeoScoreResult }) {
  const color = result.score >= 80 ? 'text-emerald-600' : result.score >= 50 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className={`text-sm font-semibold ${color}`}>{result.score}<span className="text-[10px] text-muted-foreground">/100</span></span>
      </div>
      <Progress value={result.score} className="h-1.5" />
      <ul className="space-y-1">
        {result.checklist.map((item) => (
          <li key={item.id} className="flex items-start gap-1.5 text-[11px]">
            {item.pass
              ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
              : <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />}
            <span>
              <span className={item.pass ? 'text-foreground' : 'text-foreground/90'}>{item.label}</span>
              <span className="text-muted-foreground"> — {item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SeoPanel({ value, onChange, titleSuffix, slug, blocks, websiteDomain, pathPrefix }: Props) {
  const update = (patch: Partial<SeoMeta>) => onChange({ ...value, ...patch });

  const titlePreview = [value.title, titleSuffix].filter(Boolean).join(' | ');
  const descLength = (value.description ?? '').length;

  // Real preview URL — was a hardcoded "https://yoursite.com/page-slug" placeholder before,
  // which told an editor nothing true about where this would actually live. Best-effort:
  // domain + primary-category prefix (how Law Elite Network's own URLs are shaped) + slug.
  // Sites with a different URL scheme (e.g. Imperialpedia's dated paths) will see an
  // approximation, not the exact route — still far more real than the old fake domain.
  const previewHost = websiteDomain?.replace(/^https?:\/\//, '').replace(/\/+$/, '') || 'yoursite.com';
  const previewPath = ['', pathPrefix, slug || 'page-slug'].filter(Boolean).join('/');
  const previewUrl = `https://${previewHost}${previewPath}`;

  const focusKeyword = value.keywords?.[0] ?? '';
  const contentScore = blocks ? computeContentScore({ title: value.title ?? titlePreview, metaDescription: value.description ?? '', blocks }) : null;
  const keywordScore = blocks
    ? computeKeywordScore({
        focusKeyword,
        title: value.title ?? titlePreview,
        slug: slug ?? '',
        metaDescription: value.description ?? '',
        blocks,
      })
    : null;

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Search className="h-4 w-4 text-muted-foreground" />
        SEO Settings
      </div>

      {/* Search preview — real domain + path, not a placeholder */}
      <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
        <p className="text-blue-600 dark:text-blue-400 font-medium truncate">
          {titlePreview || 'Page Title | Site Name'}
        </p>
        <p className="text-green-700 dark:text-green-400 text-[11px] truncate">
          {previewUrl}
        </p>
        <p className="text-muted-foreground line-clamp-2">
          {value.description || 'Meta description will appear here (aim for 150–160 characters).'}
        </p>
      </div>

      {/* Content Score + Keyword Score — computed live from the actual draft text, not
          an AI call and not an external service. See src/lib/cms/seoScore.ts. */}
      {contentScore && (
        <div className="space-y-4 rounded-lg border p-3">
          <ScoreGauge label="Content Score" result={contentScore} />
          <Separator />
          {keywordScore ? (
            <ScoreGauge label={`Keyword Score — "${focusKeyword}"`} result={keywordScore} />
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Add a keyword below (the first one becomes the focus keyword) to see how well this draft targets it.
            </p>
          )}
          <div className="flex items-start gap-1.5 rounded-md bg-muted/60 px-2 py-1.5 text-[10px] text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              Both scores are computed from this draft&apos;s own text — real, checkable facts about
              length, structure, and keyword placement. This panel does not estimate a chance to
              rank against competitors — that needs live competitor/SERP data from a paid provider
              (e.g. Ahrefs, SEMrush, DataForSEO), which isn&apos;t connected here. Ask an admin if
              you want that wired up.
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">SEO Title</Label>
          <Input
            className="h-8 text-xs"
            placeholder="Override page title for search engines"
            value={value.title ?? ''}
            onChange={(e) => update({ title: e.target.value })}
          />
          {titleSuffix && (
            <p className="text-[11px] text-muted-foreground">Preview: {titlePreview}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs shrink-0">Meta Description</Label>
            <span className={`shrink-0 whitespace-nowrap text-[11px] tabular-nums ${descLength > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {descLength}/160
            </span>
          </div>
          <textarea
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Brief description for search engine results"
            value={value.description ?? ''}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Keywords (comma-separated)</Label>
          <Input
            className="h-8 text-xs"
            placeholder="keyword1, keyword2, keyword3"
            value={(value.keywords ?? []).join(', ')}
            onChange={(e) =>
              update({ keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })
            }
          />
          <p className="text-[11px] text-muted-foreground">The first keyword is treated as the focus keyword above.</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          Open Graph
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">OG Image URL</Label>
          <Input
            className="h-8 text-xs"
            placeholder="https://... (1200×630 recommended)"
            value={value.ogImage ?? ''}
            onChange={(e) => update({ ogImage: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Canonical URL</Label>
          <Input
            className="h-8 text-xs"
            placeholder="https://... (optional, overrides default)"
            value={value.canonicalUrl ?? ''}
            onChange={(e) => update({ canonicalUrl: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EyeOff className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium">No Index</p>
            <p className="text-[11px] text-muted-foreground">Hide from search engines</p>
          </div>
        </div>
        <Switch
          checked={value.noIndex ?? false}
          onCheckedChange={(v) => update({ noIndex: v })}
        />
      </div>
    </div>
  );
}
