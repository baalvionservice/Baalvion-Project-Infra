'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Copy, Replace, Trash2, ExternalLink, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatBytes, formatDateTime } from '@/lib/utils/format';
import { useUpdateMedia } from '@/lib/queries/cms-media.queries';
import type { MediaFile } from '@/lib/api/media';

interface Props {
  file: MediaFile | null;
  onOpenChange: (v: boolean) => void;
  onReplace: (id: string) => void;
  onDelete: (id: string) => void;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate font-medium">{value}</span>
    </div>
  );
}

export default function MediaDetailSheet({ file, onOpenChange, onReplace, onDelete }: Props) {
  const update = useUpdateMedia();
  const [altText, setAltText] = useState('');
  const [filename, setFilename] = useState('');

  useEffect(() => {
    if (file) {
      setAltText(file.altText ?? '');
      setFilename(file.originalName);
    }
  }, [file]);

  if (!file) return null;

  const kind = file.mimeType.startsWith('image/')
    ? 'image'
    : file.mimeType.startsWith('video/')
      ? 'video'
      : 'document';

  const copyUrl = () => {
    navigator.clipboard.writeText(file.url).then(
      () => toast.success('URL copied'),
      () => toast.error('Could not copy'),
    );
  };

  const dirty = altText !== (file.altText ?? '') || filename !== file.originalName;

  return (
    <Sheet open={!!file} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="truncate">{file.originalName}</SheetTitle>
          <SheetDescription className="text-xs capitalize">{kind} · {file.mimeType}</SheetDescription>
        </SheetHeader>

        {/* Preview */}
        <div className="relative mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {kind === 'image' ? (
            <Image
              src={file.url}
              alt={file.altText ?? file.originalName}
              fill
              className="object-contain"
              sizes="400px"
              unoptimized
            />
          ) : kind === 'video' ? (
            <video src={file.url} controls className="h-full w-full" />
          ) : (
            <FileText className="h-12 w-12 text-muted-foreground" />
          )}
        </div>

        {/* Editable metadata */}
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">File name</Label>
            <Input
              className="h-9 text-sm"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>
          {kind === 'image' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Alt text (accessibility &amp; SEO)</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Describe this image…"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          )}
          <Button
            size="sm"
            className="w-full"
            disabled={!dirty || update.isPending}
            onClick={() =>
              update.mutate({ id: file.id, payload: { altText, filename } })
            }
          >
            <Save className="mr-2 h-4 w-4" />
            Save changes
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Metadata */}
        <div className="divide-y divide-border/60">
          <MetaRow label="Size" value={formatBytes(file.size)} />
          {file.width && file.height && (
            <MetaRow label="Dimensions" value={`${file.width} × ${file.height}px`} />
          )}
          <MetaRow label="Type" value={file.mimeType} />
          <MetaRow label="Uploaded" value={formatDateTime(file.createdAt)} />
          <MetaRow label="Uploaded by" value={`User #${file.uploadedBy}`} />
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={copyUrl}>
            <Copy className="mr-2 h-4 w-4" />
            Copy URL
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onReplace(file.id)}>
            <Replace className="mr-2 h-4 w-4" />
            Replace
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(file.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
