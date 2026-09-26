'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { serviceClients, normalizeError } from '@/lib/api/client';
import { mediaApi } from '@/lib/api/media';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PromptContentRulesNotice } from './PromptContentRulesNotice';
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp, Upload } from 'lucide-react';

export interface PromptImage { url: string; alt: string; credit: string }

export interface PromptItem {
  heading: string;
  subtitle: string;
  prompt_text: string;
  model: string;
  images: PromptImage[];
  chatgpt_url: string;
  gemini_url: string;
}

export interface PromptValue {
  slug: string;
  title: string;
  intro: string;
  hero_image: string;
  category: string;
  tags: string;
  items: PromptItem[];
  pro_tips: string;
  is_trending: boolean;
  trending_order: number | '';
}

export interface PromptMeta {
  id: string;
  status: 'active' | 'archived';
  viewsCount: number;
  copiesCount: number;
}

const EMPTY_IMAGE: PromptImage = { url: '', alt: '', credit: '' };
const EMPTY_ITEM: PromptItem = {
  heading: '', subtitle: '', prompt_text: '', model: '',
  images: [{ ...EMPTY_IMAGE }], chatgpt_url: '', gemini_url: '',
};
const EMPTY: PromptValue = {
  slug: '', title: '', intro: '', hero_image: '', category: '', tags: '',
  items: [{ ...EMPTY_ITEM, images: [{ ...EMPTY_IMAGE }] }],
  pro_tips: '', is_trending: false, trending_order: '',
};

interface Props { initial?: PromptValue; meta?: PromptMeta }

/**
 * URL field + real file upload, side by side. The site's CSP only allows images from
 * imperialpedia.com/api.baalvion.com, so a pasted URL from anywhere else (e.g. straight off
 * Gemini/Google) silently fails to render — uploading through cms-service's media store (same
 * pipeline NewsMetaPanel's gallery-image upload uses) guarantees the resulting URL is on an
 * allowed host.
 */
function ImageUrlField({ value, onChange, placeholder }: { value: string; onChange: (url: string) => void; placeholder?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await mediaApi.files.upload(form);
      onChange(res.data.data.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(normalizeError(err as AxiosError).message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? 'Image URL, or upload →'} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }} />
      <Button type="button" variant="outline" size="icon" title="Upload image" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export function PromptForm({ initial, meta }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<PromptValue>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const isEdit = Boolean(meta);
  const set = <K extends keyof PromptValue>(key: K, v: PromptValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  const setItem = <K extends keyof PromptItem>(i: number, key: K, v: PromptItem[K]) =>
    setValue((prev) => ({ ...prev, items: prev.items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)) }));

  const setItemImage = (i: number, j: number, key: keyof PromptImage, v: string) =>
    setValue((prev) => ({
      ...prev,
      items: prev.items.map((it, idx) => idx === i
        ? { ...it, images: it.images.map((img, jdx) => (jdx === j ? { ...img, [key]: v } : img)) }
        : it),
    }));

  const addItem = () => setValue((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM, images: [{ ...EMPTY_IMAGE }] }] }));
  const removeItem = (i: number) => setValue((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  const toggleCollapsed = (i: number) => setCollapsed((prev) => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const addItemImage = (i: number) => setValue((prev) => ({
    ...prev,
    items: prev.items.map((it, idx) => (idx === i ? { ...it, images: [...it.images, { ...EMPTY_IMAGE }] } : it)),
  }));
  const removeItemImage = (i: number, j: number) => setValue((prev) => ({
    ...prev,
    items: prev.items.map((it, idx) => (idx === i ? { ...it, images: it.images.filter((_, jdx) => jdx !== j) } : it)),
  }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'prompts'] });

  const save = useMutation({
    mutationFn: async () => {
      const items = value.items.map((it) => ({
        heading: it.heading.trim(),
        subtitle: it.subtitle.trim() || undefined,
        prompt_text: it.prompt_text.trim(),
        model: it.model.trim() || undefined,
        images: it.images
          .map((img) => ({ url: img.url.trim(), alt: img.alt.trim() || undefined, credit: img.credit.trim() || undefined }))
          .filter((img) => img.url),
        chatgpt_url: it.chatgpt_url.trim() || undefined,
        gemini_url: it.gemini_url.trim() || undefined,
      })).filter((it) => it.heading && it.prompt_text && it.images.length > 0);

      const payload = {
        slug: value.slug,
        title: value.title,
        intro: value.intro || undefined,
        hero_image: value.hero_image || undefined,
        category: value.category || undefined,
        tags: value.tags.split(',').map((s) => s.trim()).filter(Boolean),
        items,
        pro_tips: value.pro_tips || undefined,
        is_trending: value.is_trending,
        trending_order: value.trending_order === '' ? undefined : Number(value.trending_order),
      };
      const client = serviceClients.imperialpedia;
      const res = isEdit ? await client.patch(`/prompts/${meta!.id}`, payload) : await client.post('/prompts', payload);
      return res.data;
    },
    onSuccess: () => {
      invalidate();
      router.push('/imperialpedia/prompts');
    },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const archive = useMutation({
    mutationFn: () => serviceClients.imperialpedia.delete(`/prompts/${meta!.id}`),
    onSuccess: () => { invalidate(); router.push('/imperialpedia/prompts'); },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!value.slug.trim() || !value.title.trim()) {
      setError('Slug and title are required.');
      return;
    }
    const hasValidItem = value.items.some((it) => it.heading.trim() && it.prompt_text.trim() && it.images.some((img) => img.url.trim()));
    if (!hasValidItem) {
      setError('At least one prompt (heading, prompt text, and an example image) is required — real output, not a placeholder.');
      return;
    }
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <PromptContentRulesNotice />

      {meta && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <span className="text-muted-foreground">{meta.viewsCount} views</span>
            <span className="text-muted-foreground">{meta.copiesCount} copies</span>
            {meta.status !== 'archived' && (
              <Button
                type="button" size="sm" variant="outline" className="ml-auto"
                onClick={() => window.confirm('Archive this roundup post? It will disappear from /prompts and /trending-prompts.') && archive.mutate()}
                disabled={archive.isPending}
              >
                Archive
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Roundup post</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={value.slug} onChange={(e) => set('slug', e.target.value)} placeholder="gemini-halloween-photo-prompts-for-men" disabled={isEdit} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={value.category} onChange={(e) => set('category', e.target.value)} placeholder="halloween" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={value.title} onChange={(e) => set('title', e.target.value)} placeholder="5 Best Gemini Halloween Photo Prompts for Men" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="intro">Intro paragraph <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="intro" rows={3} value={value.intro} onChange={(e) => set('intro', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero_image">Hero / card thumbnail <span className="text-muted-foreground">(optional — falls back to the first prompt's first image)</span></Label>
            <ImageUrlField value={value.hero_image} onChange={(url) => set('hero_image', url)} />
            {value.hero_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.hero_image} alt="" className="mt-1 h-16 w-16 rounded object-cover" />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags <span className="text-muted-foreground">(comma-separated)</span></Label>
            <Input id="tags" value={value.tags} onChange={(e) => set('tags', e.target.value)} placeholder="gemini, halloween, men" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Prompts in this roundup ({value.items.length})</h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" /> Add prompt
          </Button>
        </div>

        {value.items.map((item, i) => {
          const isCollapsed = collapsed.has(i);
          return (
            <Card key={i}>
              <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
                <button type="button" onClick={() => toggleCollapsed(i)} className="flex items-center gap-2 text-sm font-medium">
                  {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  Prompt {i + 1}{item.heading ? `: ${item.heading}` : ''}
                </button>
                {value.items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              {!isCollapsed && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`heading-${i}`}>Heading</Label>
                      <Input id={`heading-${i}`} value={item.heading} onChange={(e) => setItem(i, 'heading', e.target.value)} placeholder="Vampire Fangs Portrait" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`model-${i}`}>Model</Label>
                      <Input id={`model-${i}`} value={item.model} onChange={(e) => setItem(i, 'model', e.target.value)} placeholder="Gemini (Nano Banana)" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label htmlFor={`subtitle-${i}`}>Subtitle <span className="text-muted-foreground">(optional)</span></Label>
                      <Input id={`subtitle-${i}`} value={item.subtitle} onChange={(e) => setItem(i, 'subtitle', e.target.value)} />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label htmlFor={`prompt-text-${i}`}>Prompt text</Label>
                      <Textarea id={`prompt-text-${i}`} rows={5} value={item.prompt_text} onChange={(e) => setItem(i, 'prompt_text', e.target.value)} placeholder="Paste the exact prompt that produced the image(s) below." />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`chatgpt-${i}`}>Open in ChatGPT URL <span className="text-muted-foreground">(optional)</span></Label>
                      <Input id={`chatgpt-${i}`} value={item.chatgpt_url} onChange={(e) => setItem(i, 'chatgpt_url', e.target.value)} placeholder="https://chatgpt.com/" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`gemini-${i}`}>Open in Gemini URL <span className="text-muted-foreground">(optional)</span></Label>
                      <Input id={`gemini-${i}`} value={item.gemini_url} onChange={(e) => setItem(i, 'gemini_url', e.target.value)} placeholder="https://gemini.google.com/app" />
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-[11px] text-muted-foreground">Real output image(s) this exact prompt produced — never a stock or placeholder image.</p>
                    {item.images.map((img, j) => (
                      <div key={j} className="grid gap-2 md:grid-cols-3">
                        <div className="flex gap-2 md:col-span-3">
                          <div className="flex-1">
                            <ImageUrlField value={img.url} onChange={(url) => setItemImage(i, j, 'url', url)} />
                          </div>
                          {item.images.length > 1 && (
                            <Button type="button" variant="outline" size="icon" onClick={() => removeItemImage(i, j)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {img.url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img.url} alt="" className="h-16 w-16 rounded object-cover md:col-span-3" />
                        )}
                        <Input value={img.alt} onChange={(e) => setItemImage(i, j, 'alt', e.target.value)} placeholder="Alt text" />
                        <Input className="md:col-span-2" value={img.credit} onChange={(e) => setItemImage(i, j, 'credit', e.target.value)} placeholder="Credit (optional)" />
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addItemImage(i)}>
                      <Plus className="mr-2 h-4 w-4" /> Add another image
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Pro tips & trending</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pro_tips">Pro tips <span className="text-muted-foreground">(optional, shown at the bottom of the page)</span></Label>
            <Textarea id="pro_tips" rows={3} value={value.pro_tips} onChange={(e) => set('pro_tips', e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="is_trending">Show on /trending-prompts</Label>
              <p className="text-[11px] text-muted-foreground">Editorial pick, not computed — curated ranking below.</p>
            </div>
            <Switch id="is_trending" checked={value.is_trending} onCheckedChange={(v) => set('is_trending', v)} />
          </div>
          {value.is_trending && (
            <div className="space-y-1.5 md:w-64">
              <Label htmlFor="trending_order">Trending order <span className="text-muted-foreground">(lower shows first)</span></Label>
              <Input
                id="trending_order" type="number" min={0}
                value={value.trending_order} onChange={(e) => set('trending_order', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/imperialpedia/prompts')}>Cancel</Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create post'}
        </Button>
      </div>
    </form>
  );
}
