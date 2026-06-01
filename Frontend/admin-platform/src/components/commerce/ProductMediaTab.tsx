'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Star, Trash2, ArrowUp, ArrowDown, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useProductMedia,
  useUploadProductMedia,
  useReplaceProductMedia,
  useFeatureProductMedia,
  useReorderProductMedia,
  useDeleteProductMedia,
} from '@/lib/queries/product-media.queries';
import type { ProductMediaItem } from '@/lib/types/commerce.types';

type Props = { storeId: string; productId: string };

export default function ProductMediaTab({ storeId, productId }: Props) {
  const { data: media, isLoading } = useProductMedia(storeId, productId);
  const upload = useUploadProductMedia(storeId, productId);
  const replace = useReplaceProductMedia(storeId, productId);
  const feature = useFeatureProductMedia(storeId, productId);
  const reorder = useReorderProductMedia(storeId, productId);
  const remove = useDeleteProductMedia(storeId, productId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const items: ProductMediaItem[] = (media ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress(0);
    upload.mutate(
      { file, fields: { isFeatured: items.length === 0 }, onProgress: setProgress },
      { onSettled: () => setProgress(null) },
    );
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && replaceTarget) replace.mutate({ mediaId: replaceTarget, file });
    setReplaceTarget(null);
    if (replaceInputRef.current) replaceInputRef.current.value = '';
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const ids = items.map((m) => m.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          Media {items.length > 0 && <span className="text-muted-foreground font-normal">({items.length})</span>}
        </CardTitle>
        <div className="flex items-center gap-2">
          {progress != null && (
            <span className="text-xs text-muted-foreground tabular-nums">Uploading {progress}%</span>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplace} />
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ImagePlus className="mr-1 h-3 w-3" />}
            Upload image
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-md" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No images yet. Upload the first to set the product hero.</p>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>Upload image</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((m, index) => (
              <div key={m.id} className="group relative overflow-hidden rounded-md border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.thumbnailUrl || m.url}
                  alt={m.altText || 'Product image'}
                  className="aspect-square w-full object-cover"
                />
                {m.isFeatured && (
                  <Badge className="absolute left-2 top-2 gap-1" variant="default">
                    <Star className="h-3 w-3 fill-current" /> Featured
                  </Badge>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/90 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)} title="Move up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === items.length - 1 || reorder.isPending} onClick={() => move(index, 1)} title="Move down">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {!m.isFeatured && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={feature.isPending} onClick={() => feature.mutate(m.id)} title="Set as featured">
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setReplaceTarget(m.id); replaceInputRef.current?.click(); }} title="Replace">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={remove.isPending} onClick={() => remove.mutate(m.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
