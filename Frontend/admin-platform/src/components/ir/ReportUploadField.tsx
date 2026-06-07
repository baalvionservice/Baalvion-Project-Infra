'use client';

import { useRef, useState } from 'react';
import { UploadCloud, FileText, X, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/cn';
import { uploadReportFile } from '@/lib/api/ir';

interface ReportUploadFieldProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

// Uploads the report PDF through the CMS media library (ir-service has no multipart
// endpoint) and hands back the stored URL via onChange. Drag-drop or click to pick.
export default function ReportUploadField({ value, onChange }: ReportUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (file.type && !/pdf|image|presentation|sheet|word|document/.test(file.type)) {
      toast.error('Please upload a PDF or document file');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadReportFile(file, setProgress);
      onChange(url);
      toast.success('File uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  if (value) {
    const name = decodeURIComponent(value.split('/').pop() ?? 'document');
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-rose-500" />
          <span className="truncate text-sm">{name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={value} target="_blank" rel="noopener noreferrer" title="Open file">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(null)} title="Remove">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) void handleFile(f);
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        uploading && 'pointer-events-none opacity-70',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
          <Progress value={progress} className="mt-1 h-1.5 w-40" />
        </>
      ) : (
        <>
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Drag &amp; drop the report file, or click to browse</p>
          <p className="text-xs text-muted-foreground">PDF, Word, PowerPoint, Excel or image</p>
        </>
      )}
    </div>
  );
}
