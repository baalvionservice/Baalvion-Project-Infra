'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { X } from 'lucide-react';
import { normalizeError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LINK_KINDS, peopleApi, slugify } from '@/lib/law/people';

const SELECT = 'h-9 rounded-md border border-input bg-background px-3 text-sm';

/** Tags connect a profile to topics, articles, cases, teams and other people; the website turns them into links and related content. */
export function PersonTags({ personId }: { personId: number }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<string>('topic');
  const [target, setTarget] = useState('');
  const [relationship, setRelationship] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: links = [], isLoading } = useQuery({ queryKey: ['law', 'person-links', personId], queryFn: () => peopleApi.links(personId) });

  const add = useMutation({
    mutationFn: () => peopleApi.addLink({ person_id: personId, kind, target_slug: kind === 'country' ? target.trim().toUpperCase() : slugify(target), relationship: relationship.trim() || null }),
    onSuccess: () => { setTarget(''); setRelationship(''); setError(null); qc.invalidateQueries({ queryKey: ['law', 'person-links', personId] }); },
    onError: (e) => setError(normalizeError(e as AxiosError).message),
  });
  const remove = useMutation({
    mutationFn: (id: number) => peopleApi.removeLink(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['law', 'person-links', personId] }),
    onError: (e) => setError(normalizeError(e as AxiosError).message),
  });

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {isLoading ? <span className="text-sm text-muted-foreground">Loading…</span> : links.length === 0 ? <span className="text-sm text-muted-foreground">No tags yet.</span> : links.map((l) => (
          <span key={l.id} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs">
            <span className="font-semibold">{l.kind}</span>: {l.target_slug}{l.relationship ? ` (${l.relationship})` : ''}
            <button type="button" aria-label={`Remove tag ${l.target_slug}`} className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate(l.id)}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (target.trim()) add.mutate(); }}>
        <select className={SELECT} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Tag type">
          {LINK_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <Input className="w-56" placeholder={kind === 'country' ? 'US' : 'slug, e.g. constitutional-law'} value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Tag target" />
        <Input className="w-56" placeholder="Relationship (optional)" value={relationship} onChange={(e) => setRelationship(e.target.value)} aria-label="Relationship" />
        <Button type="submit" size="sm" disabled={add.isPending || !target.trim()}>Add tag</Button>
      </form>
      <p className="text-xs text-muted-foreground">The target is the slug used in the entity’s URL (for a case: the part after /legal/cases/).</p>
    </div>
  );
}
