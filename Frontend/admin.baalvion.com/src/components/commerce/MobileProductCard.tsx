'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, Check, ImageOff, Loader2, Pencil, X } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkImage } from '@/components/commerce/ProductPhotos';
import { productMediaApi } from '@/lib/api/product-media';
import { productMediaKeys, useProductMedia } from '@/lib/queries/product-media.queries';
import { useUpdateProduct, useUpdateVariant } from '@/lib/queries/commerce-products.queries';
import { placeholderReasons } from '@/lib/commerce/placeholders';
import { priceOf } from '@/lib/commerce/priceOf';
import { formatMoney } from '@/lib/utils/format';
import type { Product } from '@/lib/types/commerce.types';

// One product as a phone-sized card: see the photo and price, fix either with one tap.
export default function MobileProductCard({ product, storeId, currency }: { product: Product; storeId: string; currency: string }) {
  const qc = useQueryClient();
  const { data: media = [] } = useProductMedia(storeId, product.id);
  const updateProduct = useUpdateProduct(storeId, product.id);
  const updateVariant = useUpdateVariant(storeId, product.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const price = priceOf(product);
  const main = media.slice().sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder)[0];
  const needs = placeholderReasons({
    description: product.description,
    colors: Array.isArray(product.customFields?.colors) ? (product.customFields!.colors as string[]) : [],
    listingStatus: product.customFields?.listingStatus,
  }).length > 0;

  const savePrice = async () => {
    const n = Number(value);
    if (value.trim() === '' || !(n >= 0)) { toast.error('Enter the price as a plain number, like 4500.'); return; }
    setBusy(true);
    try {
      // The storefront reads customFields.basePrice first; keep the main variant in step with it.
      await updateProduct.mutateAsync({ customFields: { ...(product.customFields ?? {}), basePrice: n } } as never);
      const v = product.variants?.find((x) => x.isDefault) ?? product.variants?.[0];
      if (v && Number(v.price) !== n) await updateVariant.mutateAsync({ variantId: v.id, payload: { price: n } });
      setEditing(false);
    } catch { /* the mutation hooks already explain the failure */ } finally { setBusy(false); }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    for (const [i, f] of Array.from(files).entries()) {
      const problem = checkImage(f);
      if (problem) { toast.error(problem); continue; }
      try { await productMediaApi.upload(storeId, product.id, f, { isFeatured: media.length === 0 && i === 0 }); ok++; }
      catch (e) { toast.error(`Could not upload "${f.name}": ${(e as { message?: string }).message ?? 'try again'}`); }
    }
    setUploading(false);
    if (ok) { toast.success(ok === 1 ? 'Photo added' : `${ok} photos added`); await qc.invalidateQueries({ queryKey: productMediaKeys.all(storeId, product.id) }); }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <li className="flex gap-3 rounded-xl border bg-card p-3">
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40" aria-label="Add photo">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element -- served from the commerce API
          <img src={main.thumbnailUrl || main.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground"><ImageOff className="h-5 w-5" />No photo</span>
        )}
        <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => void addPhotos(e.target.files)} />

      <div className="min-w-0 flex-1 space-y-1.5">
        <Link href={`/commerce/products/${product.id}`} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">{product.name}</Link>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={product.status} />
          {needs && <Badge variant="destructive" className="text-[10px]">Needs real details</Badge>}
          {media.length > 0 && <span className="text-[11px] text-muted-foreground">{media.length} photo{media.length === 1 ? '' : 's'}</span>}
        </div>

        {editing ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{currency}</span>
            <Input autoFocus type="number" inputMode="decimal" min={0} value={value} onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void savePrice(); if (e.key === 'Escape') setEditing(false); }} className="h-9 w-28" aria-label="Price" />
            <Button type="button" size="icon" className="h-9 w-9" disabled={busy} onClick={() => void savePrice()} aria-label="Save price"><Check className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditing(false)} aria-label="Cancel"><X className="h-4 w-4" /></Button>
          </div>
        ) : (
          <button type="button" onClick={() => { setValue(price != null ? String(price) : ''); setEditing(true); }} className="flex items-center gap-1.5 text-sm font-semibold">
            {price != null ? formatMoney(price, currency) : <span className="text-destructive">Set price</span>}
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </li>
  );
}
