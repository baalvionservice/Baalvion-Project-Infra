'use client';

import { Search, Globe, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { SeoMeta } from '@/lib/types/cms.types';

interface Props {
  value: SeoMeta;
  onChange: (seo: SeoMeta) => void;
  titleSuffix?: string;
}

export default function SeoPanel({ value, onChange, titleSuffix }: Props) {
  const update = (patch: Partial<SeoMeta>) => onChange({ ...value, ...patch });

  const titlePreview = [value.title, titleSuffix].filter(Boolean).join(' | ');
  const descLength = (value.description ?? '').length;

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Search className="h-4 w-4 text-muted-foreground" />
        SEO Settings
      </div>

      {/* Search preview */}
      <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
        <p className="text-blue-600 dark:text-blue-400 font-medium truncate">
          {titlePreview || 'Page Title | Site Name'}
        </p>
        <p className="text-green-700 dark:text-green-400 text-[11px]">
          https://yoursite.com/page-slug
        </p>
        <p className="text-muted-foreground line-clamp-2">
          {value.description || 'Meta description will appear here (aim for 150–160 characters).'}
        </p>
      </div>

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
          <div className="flex justify-between">
            <Label className="text-xs">Meta Description</Label>
            <span className={`text-[11px] ${descLength > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
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
