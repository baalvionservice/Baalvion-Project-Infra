'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { normalizeError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PHOTO_LICENSES, peopleApi, type PhotoRecord } from '@/lib/law/people';

const SELECT = 'h-9 rounded-md border border-input bg-background px-3 text-sm';

/** Photos are fetched with the staff token (the public route only serves published profiles), then shown from an object URL. */
function PhotoThumb({ id, alt }: { id: number; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    peopleApi.photoBlob(id).then((b) => { if (!cancelled) { url = URL.createObjectURL(b); setSrc(url); } }).catch(() => {});
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [id]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={alt} className="h-32 w-28 rounded-md object-cover object-top" /> : <div className="h-32 w-28 animate-pulse rounded-md bg-muted" />;
}

export function PersonPhotos({ personId, personName }: { personId: number; personName: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [credit, setCredit] = useState('');
  const [license, setLicense] = useState<string>(PHOTO_LICENSES[0]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const key = ['law', 'person-photos', personId];
  const { data: photos = [], isLoading } = useQuery({ queryKey: key, queryFn: () => peopleApi.photos(personId) });
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const fail = (e: unknown) => setError(normalizeError(e as AxiosError).message);

  const upload = useMutation({
    mutationFn: () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error('Choose an image file first');
      const form = new FormData();
      form.append('file', file);
      form.append('credit', credit);
      form.append('license', license);
      if (sourceUrl) form.append('source_url', sourceUrl);
      form.append('alt_text', `Photo of ${personName}`);
      return peopleApi.uploadPhoto(personId, form);
    },
    onSuccess: () => { setError(null); setCredit(''); setSourceUrl(''); if (fileRef.current) fileRef.current.value = ''; refresh(); },
    onError: (e) => setError(e instanceof Error && !('response' in e) ? e.message : normalizeError(e as AxiosError).message),
  });
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<PhotoRecord> }) => peopleApi.updatePhoto(id, body),
    onSuccess: () => { setError(null); refresh(); },
    onError: fail,
  });

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-4">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : photos.length === 0 ? <p className="text-sm text-muted-foreground">No photos yet. Until one is added the site shows an initials tile.</p> : photos.map((p) => (
          <div key={p.id} className={`w-44 space-y-2 rounded-lg border p-3 ${p.is_active ? '' : 'opacity-50'}`}>
            <PhotoThumb id={p.id} alt={p.alt_text || personName} />
            <div className="flex flex-wrap gap-1">
              {p.is_primary && <Badge className="bg-green-100 text-green-700">Primary</Badge>}
              {!p.is_active && <Badge className="bg-gray-100 text-gray-600">Off</Badge>}
            </div>
            <p className="text-xs leading-snug text-muted-foreground">{p.credit}<br />{p.license}</p>
            <div className="flex flex-wrap gap-1">
              {!p.is_primary && p.is_active && <Button size="sm" variant="outline" onClick={() => patch.mutate({ id: p.id, body: { is_primary: true } })}>Make primary</Button>}
              <Button size="sm" variant="ghost" onClick={() => patch.mutate({ id: p.id, body: p.is_active ? { is_active: false, is_primary: false } : { is_active: true } })}>
                {p.is_active ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <form className="space-y-3 rounded-lg border p-4" onSubmit={(e) => { e.preventDefault(); upload.mutate(); }}>
        <p className="text-sm font-medium">Upload a photo</p>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="block text-sm" aria-label="Photo file" />
        <div className="flex flex-wrap gap-2">
          <Input className="w-72" placeholder="Credit, e.g. Jane Doe / Wikimedia Commons" value={credit} onChange={(e) => setCredit(e.target.value)} aria-label="Credit" />
          <select className={SELECT} value={license} onChange={(e) => setLicense(e.target.value)} aria-label="Licence">
            {PHOTO_LICENSES.map((l) => <option key={l}>{l}</option>)}
          </select>
          <Input className="w-72" placeholder="Source URL (optional)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} aria-label="Source URL" />
        </div>
        <Button type="submit" size="sm" disabled={upload.isPending || !credit.trim()}>{upload.isPending ? 'Uploading…' : 'Upload'}</Button>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG or WebP under 6 MB. Only upload photos LEN owns, has bought, or that carry a licence allowing reuse: public domain, CC0, CC BY or CC BY-SA (never non-commercial or no-derivatives). The credit is shown on the page.
        </p>
      </form>
    </div>
  );
}
