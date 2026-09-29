'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cmsContentApi } from '@/lib/api/cms-content';
import { cmsWorkflowApi } from '@/lib/api/cms-workflow';
import { cmsApiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types/common.types';
import type { ContentBlock, ContentItemType } from '@/lib/types/cms-content.types';

type ImportItem = {
  title: string;
  slug?: string;
  type?: ContentItemType;
  categorySlug?: string;
  excerpt?: string;
  featuredImage?: string;
  body?: string;
  blocks?: ContentBlock[];
  tagIds?: string[];
  publish?: boolean;
  scheduledAt?: string | null;
};

type Props = {
  websiteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
};

const SAMPLE = `[
  {
    "title": "Example Article Title",
    "categorySlug": "banking",
    "excerpt": "One-line summary used in cards and SEO.",
    "featuredImage": "https://picsum.photos/seed/example/1200/675",
    "body": "First paragraph.\\n\\nSecond paragraph.",
    "publish": true
  }
]`;

const CSV_SAMPLE = `title,categorySlug,excerpt,featuredImage,body,publish
Example Article Title,banking,One-line summary,https://picsum.photos/seed/x/1200/675,"First paragraph.\\nSecond paragraph.",true`;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

/** RFC4180-ish single CSV line splitter (handles quoted fields + "" escapes). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Parse a CSV string (header row + rows) into import items. `\n` in body → newline. */
function parseCsv(text: string): ImportItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    return {
      title: row.title,
      slug: row.slug || undefined,
      categorySlug: row.categorySlug || row.category || undefined,
      excerpt: row.excerpt || undefined,
      featuredImage: row.featuredImage || row.image || undefined,
      body: (row.body || '').replace(/\\n/g, '\n') || undefined,
      publish: row.publish ? !/^(false|no|0)$/i.test(row.publish) : true,
      scheduledAt: row.scheduledAt || undefined,
    } as ImportItem;
  }).filter((it) => it.title);
}

function bodyToBlocks(item: ImportItem): ContentBlock[] {
  if (item.blocks?.length) return item.blocks;
  const text = item.body ?? item.excerpt ?? '';
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => ({ id: `b${i}`, type: 'paragraph' as ContentBlock['type'], order: i, content: { text: p } }));
}

export default function ImportContentDialog({ websiteId, open, onOpenChange, onImported }: Props) {
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);

  const handleImport = async () => {
    setResult(null);
    const trimmed = raw.trim();
    let items: ImportItem[];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        items = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        setResult({ ok: 0, failed: 0, errors: [`Invalid JSON: ${(e as Error).message}`] });
        return;
      }
    } else {
      items = parseCsv(trimmed);
      if (!items.length) {
        setResult({
          ok: 0,
          failed: 0,
          errors: ['Could not parse input. Paste a JSON array, or CSV with a header row containing "title".'],
        });
        return;
      }
    }
    if (!items.length) return;

    setBusy(true);
    setProgress({ done: 0, total: items.length });

    // Resolve category slug → id from the raw category tree (the mapped
    // taxonomy API drops children, so hit the endpoint directly and flatten).
    const catBySlug = new Map<string, string>();
    try {
      type CatNode = { id: string; slug: string; children?: CatNode[] };
      const res = await cmsApiClient.get<ApiResponse<CatNode[]>>(
        `/cms/websites/${websiteId}/categories?limit=500`,
      );
      const walk = (nodes?: CatNode[]) => {
        for (const c of nodes ?? []) {
          catBySlug.set(c.slug, c.id);
          walk(c.children);
        }
      };
      walk(res.data.data);
    } catch {
      /* category resolution is best-effort */
    }

    let ok = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const slug = item.slug ? slugify(item.slug) : slugify(item.title);
      try {
        const created = await cmsContentApi.create({
          websiteId,
          type: item.type ?? 'article',
          title: item.title,
          slug,
          excerpt: item.excerpt,
          featuredImage: item.featuredImage,
          blocks: bodyToBlocks(item),
          seo: { title: item.title, description: item.excerpt ?? '' },
          tagIds: item.tagIds ?? [],
          categoryIds: item.categorySlug && catBySlug.has(item.categorySlug) ? [catBySlug.get(item.categorySlug)!] : undefined,
        });
        const contentId = created.data.data.id;

        if (item.scheduledAt) {
          await cmsWorkflowApi.transition({ contentId, action: 'approve' }).catch(() => undefined);
          await cmsWorkflowApi.transition({ contentId, action: 'schedule', scheduledAt: item.scheduledAt });
        } else if (item.publish !== false) {
          await cmsWorkflowApi.transition({ contentId, action: 'publish' });
        }
        ok++;
      } catch (e) {
        failed++;
        if (errors.length < 8) errors.push(`${slug}: ${(e as Error).message}`);
      }
      setProgress({ done: i + 1, total: items.length });
    }

    setBusy(false);
    setResult({ ok, failed, errors });
    if (ok > 0) onImported();
  };

  const close = () => {
    if (busy) return;
    setRaw('');
    setProgress(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Content</DialogTitle>
          <DialogDescription>
            Paste a <strong>JSON array</strong> or <strong>CSV</strong> (header row with
            <code> title</code>). Each row is created, categorized (by <code>categorySlug</code>),
            and published (or scheduled via <code>scheduledAt</code>). Built for high-volume uploads.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Articles JSON</Label>
            <Textarea
              className="h-64 font-mono text-xs"
              placeholder={SAMPLE}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="text-xs text-muted-foreground underline disabled:opacity-50"
              onClick={() => setRaw(SAMPLE)}
              disabled={busy}
            >
              Insert JSON sample
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground underline disabled:opacity-50"
              onClick={() => setRaw(CSV_SAMPLE)}
              disabled={busy}
            >
              Insert CSV sample
            </button>
          </div>

          {progress && (
            <p className="text-xs text-muted-foreground">
              Importing {progress.done}/{progress.total}…
            </p>
          )}
          {result && (
            <div className="rounded-md border p-3 text-xs">
              <p className="font-medium">
                Imported {result.ok} {result.ok === 1 ? 'item' : 'items'}
                {result.failed > 0 ? `, ${result.failed} failed` : ''}.
              </p>
              {result.errors.map((err, i) => (
                <p key={i} className="mt-1 text-destructive">{err}</p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={close} disabled={busy}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          <Button size="sm" onClick={handleImport} disabled={busy || !raw.trim()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {busy ? 'Importing…' : 'Import & Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
