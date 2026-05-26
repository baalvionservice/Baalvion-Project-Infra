'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, FolderPlus, Image as ImageIcon, Trash2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mediaApi, type MediaFile } from '@/lib/api/media';
import { useUIStore } from '@/lib/store/uiStore';
import { formatBytes } from '@/lib/utils/format';
import Image from 'next/image';

export default function MediaPage() {
  const { setBreadcrumbs } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['media', 'files'],
    queryFn: () => mediaApi.files.list({ limit: 50 }).then((r) => r.data),
  });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Media' }]);
  }, [setBreadcrumbs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        await mediaApi.files.upload(formData);
      }
      toast.success(`${files.length} file(s) uploaded`);
      refetch();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mediaApi.files.delete(id);
      toast.success('File deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader
        title="Media Library"
        description={`${data?.pagination.total ?? 0} files`}
        actions={
          <>
            <Button variant="outline" size="sm">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleUpload}
            />
          </>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <EmptyState
          icon={ImageIcon}
          title="No media files"
          description="Upload images, videos, and documents"
          action={{ label: 'Upload Files', onClick: () => fileInputRef.current?.click() }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data.data.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-md border bg-card overflow-hidden"
            >
              <div className="aspect-square relative bg-muted">
                {file.mimeType.startsWith('image/') ? (
                  <Image
                    src={file.thumbnailUrl ?? file.url}
                    alt={file.altText ?? file.originalName}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{file.originalName}</p>
                <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>View</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(file.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
