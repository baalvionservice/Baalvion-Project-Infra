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
import { Loader2 } from 'lucide-react';

export interface EntityValue {
  type: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  country?: string;
  industry?: string;
  image?: string;
  tags: string[];
}

const EMPTY: EntityValue = {
  type: '', name: '', slug: '', description: '', category: '',
  country: '', industry: '', image: '', tags: [],
};

interface Props { initial?: EntityValue; isEdit?: boolean }

export function EntityForm({ initial, isEdit = false }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<EntityValue>(initial ?? EMPTY);
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);

  // The API upserts by (type, slug), so those fields define identity and are
  // locked once editing an existing entity to avoid accidentally forking it.
  const set = <K extends keyof EntityValue>(key: K, v: EntityValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type: value.type.trim(),
        name: value.name.trim(),
        slug: value.slug.trim() || undefined,
        description: value.description?.trim() || null,
        category: value.category?.trim() || null,
        country: value.country?.trim() || null,
        industry: value.industry?.trim() || null,
        image: value.image?.trim() || null,
        tags: tagsText.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const res = await serviceClients.imperialpedia.post('/entities', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'entities'] });
      router.push('/imperialpedia/entities');
    },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!value.type.trim() || !value.name.trim()) {
      setError('Type and name are required.');
      return;
    }
    if (!isEdit && !value.slug.trim()) {
      setError('Slug is required (it forms the entity identity together with type).');
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <Input id="type" value={value.type} onChange={(e) => set('type', e.target.value)} disabled={isEdit} placeholder="company" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug {isEdit ? '' : <span className="text-muted-foreground">(identity, with type)</span>}</Label>
            <Input id="slug" value={value.slug} onChange={(e) => set('slug', e.target.value)} disabled={isEdit} placeholder="acme-corp" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme Corporation" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={value.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={5} placeholder="Overview of this entity…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={value.category ?? ''} onChange={(e) => set('category', e.target.value)} placeholder="Manufacturing" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={value.country ?? ''} onChange={(e) => set('country', e.target.value)} placeholder="US" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" value={value.industry ?? ''} onChange={(e) => set('industry', e.target.value)} placeholder="Industrials" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" value={value.image ?? ''} onChange={(e) => set('image', e.target.value)} placeholder="https://…/logo.png" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="tags">Tags <span className="text-muted-foreground">(comma-separated)</span></Label>
            <Input id="tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="public, fortune-500" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/imperialpedia/entities')}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create entity'}
        </Button>
      </div>
    </form>
  );
}
