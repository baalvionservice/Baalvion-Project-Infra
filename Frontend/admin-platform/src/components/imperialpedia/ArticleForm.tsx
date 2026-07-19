'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { serviceClients, normalizeError } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Lock, Loader2, Send, Archive } from 'lucide-react';

export interface ArticleValue {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  cover_image: string;
  reading_time_min: number;
  author_name: string;
  is_premium: boolean;
}

// Read-only fields the form only displays (never edits) — status changes go through the
// dedicated publish/archive actions below, matching what the API actually accepts
// (updateArticle's `allowed` list has no `status` field — see articlesController.js).
export interface ArticleMeta {
  id: number;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  views_count: number;
  likes_count: number;
}

const EMPTY: ArticleValue = {
  title: '', summary: '', content: '', category: '', tags: [],
  cover_image: '', reading_time_min: 0, author_name: '', is_premium: false,
};

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-red-100 text-red-700',
};

interface Props { initial?: ArticleValue; meta?: ArticleMeta }

export function ArticleForm({ initial, meta }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<ArticleValue>(initial ?? EMPTY);
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(meta);
  const set = <K extends keyof ArticleValue>(key: K, v: ArticleValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'articles'] });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: value.title,
        summary: value.summary || undefined,
        content: value.content || undefined,
        category: value.category || undefined,
        tags: tagsText.split(',').map((s) => s.trim()).filter(Boolean),
        cover_image: value.cover_image || undefined,
        reading_time_min: value.reading_time_min || 0,
        author_name: value.author_name || undefined,
        is_premium: value.is_premium,
      };
      const client = serviceClients.imperialpedia;
      const res = isEdit ? await client.patch(`/articles/${meta!.id}`, payload) : await client.post('/articles', payload);
      return res.data;
    },
    onSuccess: () => {
      invalidate();
      router.push('/imperialpedia/articles');
    },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const publish = useMutation({
    mutationFn: () => serviceClients.imperialpedia.post(`/articles/${meta!.id}/publish`),
    onSuccess: invalidate,
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const archive = useMutation({
    mutationFn: () => serviceClients.imperialpedia.delete(`/articles/${meta!.id}`),
    onSuccess: () => {
      invalidate();
      router.push('/imperialpedia/articles');
    },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!value.title.trim()) {
      setError('Title is required.');
      return;
    }
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {meta && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <Badge className={STATUS_STYLES[meta.status]}>{meta.status}</Badge>
            <span className="font-mono text-xs text-muted-foreground">/{meta.slug}</span>
            <span className="text-muted-foreground">{meta.views_count} views · {meta.likes_count} likes</span>
            <div className="ml-auto flex gap-2">
              {meta.status === 'draft' && (
                <Button type="button" size="sm" variant="outline" onClick={() => publish.mutate()} disabled={publish.isPending}>
                  {publish.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                  Publish
                </Button>
              )}
              {meta.status !== 'archived' && (
                <Button
                  type="button" size="sm" variant="outline"
                  onClick={() => window.confirm('Archive this article? It will no longer be publicly visible.') && archive.mutate()}
                  disabled={archive.isPending}
                >
                  {archive.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Archive className="mr-1.5 h-3.5 w-3.5" />}
                  Archive
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Article</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={value.title} onChange={(e) => set('title', e.target.value)} placeholder="Why Compound Interest Matters" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={value.category} onChange={(e) => set('category', e.target.value)} placeholder="Investing Basics" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author_name">Author name <span className="text-muted-foreground">(display override)</span></Label>
            <Input id="author_name" value={value.author_name} onChange={(e) => set('author_name', e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="tags">Tags <span className="text-muted-foreground">(comma-separated)</span></Label>
            <Input id="tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="etf, retirement, tax" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cover_image">Cover image URL</Label>
            <Input id="cover_image" value={value.cover_image} onChange={(e) => set('cover_image', e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reading_time_min">Reading time (minutes)</Label>
            <Input
              id="reading_time_min" type="number" min={0}
              value={value.reading_time_min} onChange={(e) => set('reading_time_min', Number(e.target.value) || 0)}
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" rows={2} value={value.summary} onChange={(e) => set('summary', e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" rows={12} value={value.content} onChange={(e) => set('content', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Monetization</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-md border p-2">
            <Checkbox
              id="is_premium"
              checked={value.is_premium}
              onCheckedChange={(c) => set('is_premium', !!c)}
              className="h-3.5 w-3.5"
            />
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <Label htmlFor="is_premium" className="text-xs font-normal">
              Premium — requires an active Pro/Enterprise subscription to read the full body
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/imperialpedia/articles')}>Cancel</Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create article'}
        </Button>
      </div>
    </form>
  );
}
