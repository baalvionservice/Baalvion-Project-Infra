'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Upload,
  Search,
  LayoutGrid,
  List as ListIcon,
  Image as ImageIcon,
  Video,
  FileText,
  MoreVertical,
  Trash2,
  Replace,
  Info,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';
import { formatBytes, formatDate } from '@/lib/utils/format';
import {
  useMediaFiles,
  useUploadMedia,
  useDeleteMedia,
  useReplaceMedia,
} from '@/lib/queries/cms-media.queries';
import { useWebsiteStats } from '@/lib/queries/cms-websites.queries';
import type { MediaFile } from '@/lib/api/media';
import type { WebsitePlan } from '@/lib/types/cms-website.types';
import MediaDetailSheet from './MediaDetailSheet';

interface Props {
  canonicalId: string;
  plan: WebsitePlan;
}

type ViewMode = 'grid' | 'list';
type TypeFilter = 'all' | 'image' | 'video' | 'document';

const STORAGE_QUOTA_MB: Record<WebsitePlan, number> = { basic: 1024, pro: 5120, enterprise: 20480 };

const fileKind = (mime: string): Exclude<TypeFilter, 'all'> =>
  mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : 'document';

const KIND_ICON = { image: ImageIcon, video: Video, document: FileText } as const;

export default function MediaManager({ canonicalId, plan }: Props) {
  const { data, isLoading } = useMediaFiles({ limit: 100 });
  const { data: stats } = useWebsiteStats(canonicalId);
  const upload = useUploadMedia();
  const del = useDeleteMedia();
  const replace = useReplaceMedia();

  const [view, setView] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [detail, setDetail] = useState<MediaFile | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  const files = data?.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      if (type !== 'all' && fileKind(f.mimeType) !== type) return false;
      if (q && !f.originalName.toLowerCase().includes(q) && !(f.altText ?? '').toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [files, search, type]);

  const usedMb = Math.round(stats?.mediaStorageUsedMb ?? files.reduce((s, f) => s + f.size, 0) / 1_048_576);
  const quotaMb = STORAGE_QUOTA_MB[plan];
  const usedPct = Math.min(100, Math.round((usedMb / quotaMb) * 100));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    for (const file of Array.from(list)) {
      await upload.mutateAsync({ file }).catch(() => {});
    }
    if (uploadRef.current) uploadRef.current.value = '';
  };

  const triggerReplace = (id: string) => {
    replaceTargetRef.current = id;
    replaceRef.current?.click();
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const oldId = replaceTargetRef.current;
    if (file && oldId) {
      await replace.mutateAsync({ oldId, file }).catch(() => {});
      setDetail(null);
    }
    if (replaceRef.current) replaceRef.current.value = '';
    replaceTargetRef.current = null;
  };

  const typeTabs: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'image', label: 'Images' },
    { key: 'video', label: 'Videos' },
    { key: 'document', label: 'Documents' },
  ];

  return (
    <div className="space-y-4">
      {/* Storage + summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">Storage usage</span>
                <span className="tabular-nums text-muted-foreground">
                  {usedMb} / {quotaMb} MB
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    usedPct >= 90 ? 'bg-rose-500' : usedPct >= 70 ? 'bg-amber-500' : 'bg-green-500',
                  )}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Total Files
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{data?.pagination.total ?? files.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 pl-8 text-sm"
              placeholder="Search files"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            {typeTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  type === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => uploadRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
          <input
            ref={uploadRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            onChange={handleUpload}
          />
          <input ref={replaceRef} type="file" className="hidden" onChange={handleReplace} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No files match your filters.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => uploadRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload files
          </Button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((f) => {
            const kind = fileKind(f.mimeType);
            const Icon = KIND_ICON[kind];
            return (
              <div key={f.id} className="group relative overflow-hidden rounded-md border bg-card">
                <button
                  className="relative block aspect-square w-full bg-muted"
                  onClick={() => setDetail(f)}
                >
                  {kind === 'image' ? (
                    <Image
                      src={f.thumbnailUrl ?? f.url}
                      alt={f.altText ?? f.originalName}
                      fill
                      className="object-cover"
                      sizes="150px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </button>
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{f.originalName}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(f.size)}</p>
                </div>
                <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetail(f)}>
                        <Info className="mr-2 h-4 w-4" />
                        Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => triggerReplace(f.id)}>
                        <Replace className="mr-2 h-4 w-4" />
                        Replace
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => del.mutate(f.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Size</TableHead>
                  <TableHead className="hidden lg:table-cell">Dimensions</TableHead>
                  <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => {
                  const kind = fileKind(f.mimeType);
                  const Icon = KIND_ICON[kind];
                  return (
                    <TableRow key={f.id} className="cursor-pointer" onClick={() => setDetail(f)}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-muted">
                            {kind === 'image' ? (
                              <Image
                                src={f.thumbnailUrl ?? f.url}
                                alt={f.altText ?? f.originalName}
                                fill
                                className="object-cover"
                                sizes="36px"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="max-w-[200px] truncate text-sm font-medium">{f.originalName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                        {formatBytes(f.size)}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {f.width && f.height ? `${f.width}×${f.height}` : '—'}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {formatDate(f.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => triggerReplace(f.id)}>
                              <Replace className="mr-2 h-4 w-4" />
                              Replace
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => del.mutate(f.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <MediaDetailSheet
        file={detail}
        onOpenChange={(v) => !v && setDetail(null)}
        onReplace={triggerReplace}
        onDelete={(id) => {
          del.mutate(id);
          setDetail(null);
        }}
      />
    </div>
  );
}
