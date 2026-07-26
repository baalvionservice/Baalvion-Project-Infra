'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, Loader2, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { mediaApi } from '@/lib/api/media';
import type { NormalizedError } from '@/lib/api/client';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

/**
 * The "Add News" wizard has always had this — the generic content editor
 * (opened via the Edit button on an already-created article) never did, so
 * there was no way to add or replace a featured image after creation. Same
 * upload flow as Add News (mediaApi.files.upload), just available here too.
 */
export default function FeaturedImagePanel({ value, onChange }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await mediaApi.files.upload(form);
      onChange(res.data.data.url);
      toast.success('Image uploaded');
    } catch (err) {
      // cmsApiClient's response interceptor already normalizes axios errors to
      // { code, message, status } — there is no global toast-on-error layer, so
      // without this the upload just silently does nothing on failure (the bug
      // reported: "I am unable to upload images... not able to do it").
      const message = (err as Partial<NormalizedError>)?.message || 'Image upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2 p-4 border-t">
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        <ImageIcon className="h-3.5 w-3.5 text-cyan-500" />
        Featured Image
      </Label>
      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/pasted URL */}
          <img src={value} alt="" className="w-full rounded object-cover aspect-video border" />
          <button
            type="button"
            onClick={() => onChange('')}
            title="Remove featured image"
            className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
          No image — one will be auto-generated
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
        {value ? 'Replace image' : 'Upload image'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { void handleImagePick(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
