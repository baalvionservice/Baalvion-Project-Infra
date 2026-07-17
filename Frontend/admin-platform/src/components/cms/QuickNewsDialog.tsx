'use client';

import { useState } from 'react';
import { Radio, TrendingUp, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/cn';
import { slugify } from '@/lib/utils/format';
import CategoryFilterCombobox from './CategoryFilterCombobox';
import { useCreateContent } from '@/lib/queries/cms-content.queries';
import { useWorkflowTransition } from '@/lib/queries/cms-workflow.queries';
import { NEWS_LABELS, type ContentBlock, type CreateContentPayload, type NewsLabel } from '@/lib/types/cms-content.types';

interface Props {
  websiteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful create (publish or draft) so the caller can refresh its list. */
  onCreated?: () => void;
}

// One paragraph block per blank-line-separated chunk — good enough for a quick
// newsroom upload; open "Edit full article" afterward for the real block editor.
function bodyToBlocks(body: string): ContentBlock[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text, i) => ({ id: crypto.randomUUID(), type: 'paragraph', order: i, content: { text } }));
}

const emptyState = {
  title: '',
  excerpt: '',
  body: '',
  featuredImage: '',
  topicCategoryId: '',
  regionCategoryId: '',
  isBreaking: false,
  isTrending: false,
  isFeatured: false,
  labels: [] as NewsLabel[],
};

/**
 * Fast, News-only "just get it published" form — title, category, region, body,
 * flags, done. The full block editor (SEO, revisions, custom fields, reviewer
 * workflow, etc.) is still there for deeper editing; this is deliberately the
 * 20-second path for a daily newsroom upload, not a replacement for it.
 */
export default function QuickNewsDialog({ websiteId, open, onOpenChange, onCreated }: Props) {
  const [f, setF] = useState(emptyState);
  const { mutateAsync: create, isPending: isCreating } = useCreateContent();
  const { mutateAsync: transition, isPending: isPublishing } = useWorkflowTransition();
  const busy = isCreating || isPublishing;

  const set = <K extends keyof typeof f>(key: K, v: (typeof f)[K]) => setF((prev) => ({ ...prev, [key]: v }));

  const toggleLabel = (label: NewsLabel) => {
    set('labels', f.labels.includes(label) ? f.labels.filter((l) => l !== label) : [...f.labels, label]);
  };

  const reset = () => setF(emptyState);

  const submit = async (publish: boolean) => {
    if (!f.title.trim()) return;
    const categoryIds = [f.topicCategoryId, f.regionCategoryId].filter(Boolean);
    const payload: CreateContentPayload = {
      websiteId,
      type: 'news',
      title: f.title,
      slug: slugify(f.title),
      excerpt: f.excerpt || undefined,
      featuredImage: f.featuredImage || undefined,
      blocks: bodyToBlocks(f.body),
      categoryIds: categoryIds.length ? categoryIds : undefined,
      isBreaking: f.isBreaking,
      isTrending: f.isTrending,
      isFeatured: f.isFeatured,
      newsLabels: f.labels,
    };
    const res = await create(payload);

    if (publish) {
      await transition({ contentId: res.data.data.id, action: 'publish' });
    }
    reset();
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add News</DialogTitle>
          <DialogDescription>The fast path — title, category, body, publish. No formatting tools needed.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Headline</Label>
            <Input
              className="text-sm"
              placeholder="What happened?"
              value={f.title}
              onChange={(e) => set('title', e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Topic</Label>
              <CategoryFilterCombobox websiteId={websiteId} value={f.topicCategoryId} onChange={(v) => set('topicCategoryId', v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Region (optional)</Label>
              <CategoryFilterCombobox websiteId={websiteId} value={f.regionCategoryId} onChange={(v) => set('regionCategoryId', v)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Summary</Label>
            <Textarea
              className="text-sm min-h-[50px]"
              placeholder="One or two sentences — shown in cards and search results."
              value={f.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Body</Label>
            <Textarea
              className="text-sm min-h-[140px]"
              placeholder="Write the article. Leave a blank line between paragraphs."
              value={f.body}
              onChange={(e) => set('body', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Featured Image URL</Label>
            <Input
              className="text-sm"
              placeholder="https://… (leave blank to auto-generate artwork)"
              value={f.featuredImage}
              onChange={(e) => set('featuredImage', e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox checked={f.isBreaking} onCheckedChange={(c) => set('isBreaking', !!c)} className="h-3.5 w-3.5" />
              <Radio className="h-3.5 w-3.5 text-red-500" /> Breaking
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox checked={f.isTrending} onCheckedChange={(c) => set('isTrending', !!c)} className="h-3.5 w-3.5" />
              <TrendingUp className="h-3.5 w-3.5 text-orange-500" /> Trending
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox checked={f.isFeatured} onCheckedChange={(c) => set('isFeatured', !!c)} className="h-3.5 w-3.5" />
              <Star className="h-3.5 w-3.5 text-amber-500" /> Featured
            </label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Labels</Label>
            <div className="flex flex-wrap gap-1.5">
              {NEWS_LABELS.map((label) => {
                const active = f.labels.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleLabel(label)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] capitalize transition-colors',
                      active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="outline" size="sm" onClick={() => submit(false)} disabled={busy || !f.title.trim()}>
            Save Draft
          </Button>
          <Button size="sm" onClick={() => submit(true)} disabled={busy || !f.title.trim()}>
            {busy ? 'Publishing…' : 'Publish Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
