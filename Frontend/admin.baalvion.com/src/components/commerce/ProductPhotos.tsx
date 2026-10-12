'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UploadCloud, Star, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { productMediaApi } from '@/lib/api/product-media';
import {
  productMediaKeys, useProductMedia, useFeatureProductMedia, useDeleteProductMedia,
} from '@/lib/queries/product-media.queries';
import { cn } from '@/lib/utils/cn';

const MAX_MB = 25;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

// Client-side check so a wrong file gets a plain-English reason instead of a server error.
export function checkImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return `"${file.name}" is not a picture. Use JPG, PNG or WebP.`;
  if (file.size > MAX_MB * 1024 * 1024) return `"${file.name}" is bigger than ${MAX_MB} MB. Please use a smaller photo.`;
  return null;
}

interface Props {
  storeId: string;
  /** Present once the product exists. Absent while creating: pictures wait in `pending`. */
  productId?: string;
  pending: File[];
  onPendingChange: (files: File[]) => void;
}

export default function ProductPhotos({ storeId, productId, pending, onPendingChange }: Props) {
  const qc = useQueryClient();
  const live = !!productId;
  const { data: media = [], isLoading } = useProductMedia(storeId, productId ?? '');
  const feature = useFeatureProductMedia(storeId, productId ?? '');
  const remove = useDeleteProductMedia(storeId, productId ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [toRemove, setToRemove] = useState<string | null>(null);

  const items = useMemo(() => media.slice().sort((a, b) => a.sortOrder - b.sortOrder), [media]);
  const previews = useMemo(() => pending.map((f) => URL.createObjectURL(f)), [pending]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const handleFiles = useCallback(async (list: FileList | File[]) => {
    const files = Array.from(list);
    const good: File[] = [];
    for (const f of files) {
      const problem = checkImage(f);
      if (problem) toast.error(problem); else good.push(f);
    }
    if (!good.length) return;
    if (!live) { onPendingChange([...pending, ...good]); return; }

    setUploading({ done: 0, total: good.length });
    let ok = 0;
    for (const [i, file] of good.entries()) {
      try {
        await productMediaApi.upload(storeId, productId!, file, { isFeatured: items.length === 0 && i === 0 });
        ok++;
      } catch (e) {
        toast.error(`Could not upload "${file.name}": ${(e as { message?: string }).message ?? 'try again'}`);
      }
      setUploading({ done: i + 1, total: good.length });
    }
    setUploading(null);
    await qc.invalidateQueries({ queryKey: productMediaKeys.all(storeId, productId!) });
    if (ok) toast.success(ok === 1 ? 'Photo added' : `${ok} photos added`);
  }, [live, pending, onPendingChange, storeId, productId, items.length, qc]);

  const count = live ? items.length : pending.length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files); }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        )}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Drag photos here, or</p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={!!uploading}>
          {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading {uploading.done} of {uploading.total}…</> : 'Choose photos'}
        </Button>
        <p className="text-xs text-muted-foreground">You can pick several at once. JPG, PNG or WebP, up to {MAX_MB} MB each.</p>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ''; }} />
      </div>

      {live && isLoading && <p className="text-sm text-muted-foreground">Loading photos…</p>}

      {count === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No photos yet. A product needs at least one before it can go on the website.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {live
            ? items.map((m) => (
                <li key={m.id} className="group relative overflow-hidden rounded-lg border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element -- served from the commerce API */}
                  <img src={m.thumbnailUrl || m.url} alt={m.altText || 'Product photo'} className="aspect-square w-full object-cover" />
                  {m.isFeatured && <Badge className="absolute left-2 top-2 gap-1"><Star className="h-3 w-3" />Main photo</Badge>}
                  <div className="flex items-center justify-between gap-1 p-2">
                    {m.isFeatured
                      ? <span className="text-xs text-muted-foreground">Shown first</span>
                      : <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={feature.isPending} onClick={() => feature.mutate(m.id)}>Make main</Button>}
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Remove photo" onClick={() => setToRemove(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))
            : pending.map((f, i) => (
                <li key={`${f.name}-${i}`} className="relative overflow-hidden rounded-lg border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                  <img src={previews[i]} alt={f.name} className="aspect-square w-full object-cover" />
                  {i === 0 && <Badge className="absolute left-2 top-2 gap-1"><Star className="h-3 w-3" />Main photo</Badge>}
                  <div className="flex items-center justify-between gap-1 p-2">
                    <span className="truncate text-xs text-muted-foreground">{f.name}</span>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label="Remove photo" onClick={() => onPendingChange(pending.filter((_, k) => k !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
        </ul>
      )}
      {!live && pending.length > 0 && <p className="text-xs text-muted-foreground">These upload automatically when you click “Create product”.</p>}

      <ConfirmModal
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title="Remove this photo?"
        description="It will no longer show on the product. You can upload it again any time."
        confirmLabel="Remove photo"
        isLoading={remove.isPending}
        onConfirm={() => { if (toRemove) remove.mutate(toRemove, { onSettled: () => setToRemove(null) }); }}
      />
    </div>
  );
}
