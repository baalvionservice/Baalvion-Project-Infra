'use client';

import { useRef, useState } from 'react';
import { Radio, TrendingUp, Star, Upload, Loader2 } from 'lucide-react';
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
import DocumentEditor from './document-editor/DocumentEditor';
import { mediaApi } from '@/lib/api/media';
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

const emptyState = {
  title: '',
  excerpt: '',
  blocks: [] as ContentBlock[],
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: create, isPending: isCreating } = useCreateContent();
  const { mutateAsync: transition, isPending: isPublishing } = useWorkflowTransition();
  const busy = isCreating || isPublishing;

  const set = <K extends keyof typeof f>(key: K, v: (typeof f)[K]) => setF((prev) => ({ ...prev, [key]: v }));

  const toggleLabel = (label: NewsLabel) => {
    set('labels', f.labels.includes(label) ? f.labels.filter((l) => l !== label) : [...f.labels, label]);
  };

  const reset = () => setF(emptyState);

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await mediaApi.files.upload(form);
      set('featuredImage', res.data.data.url);
    } catch {
      /* surfaced by the global toast layer */
    } finally {
      setIsUploadingImage(false);
    }
  };

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
      blocks: f.blocks,
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
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add News</DialogTitle>
          <DialogDescription>Headline, topic, write the story, publish.</DialogDescription>
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
              <CategoryFilterCombobox
                websiteId={websiteId}
                value={f.topicCategoryId}
                onChange={(v) => set('topicCategoryId', v)}
                placeholder="Select a topic…"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Region (optional)</Label>
              <CategoryFilterCombobox
                websiteId={websiteId}
                value={f.regionCategoryId}
                onChange={(v) => set('regionCategoryId', v)}
                placeholder="No region"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Summary</Label>
            <Textarea
              className="text-sm min-h-[50px]"
              placeholder="One or two plain-text sentences — shown in cards and search results, not in the article itself."
              value={f.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Article</Label>
            <div className="rounded-md border px-3 py-2">
              <DocumentEditor blocks={f.blocks} onChange={(blocks) => set('blocks', blocks)} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Type <span className="font-mono">/</span> for headings, lists, images and more — or just select text to format it, like Google Docs.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Featured Image</Label>
            <div className="flex gap-2">
              <Input
                className="text-sm"
                placeholder="Paste a URL, or upload a photo →  (leave blank to auto-generate artwork)"
                value={f.featuredImage}
                onChange={(e) => set('featuredImage', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { void handleImagePick(e.target.files?.[0]); e.target.value = ''; }}
              />
            </div>
            {f.featuredImage && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/pasted URL, next/image domain allowlisting would reject it
              <img src={f.featuredImage} alt="" className="h-24 w-40 rounded object-cover border" />
            )}
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
