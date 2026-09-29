'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Plus, Trash2, FileUp, CheckCircle2 } from 'lucide-react';
import { SelectField, TextField } from './BusinessField';
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, type BusinessDocument, type BusinessOnboardingData } from './options';

const newDoc = (): BusinessDocument => ({ documentType: '', title: '', fileUrl: '', fileName: '', fileSizeBytes: undefined, mimeType: '' });
const prettyBytes = (n?: number) => (typeof n === 'number' ? `${(n / 1024).toFixed(0)} KB` : '');

interface Props {
  initial: BusinessOnboardingData;
  onNext: (patch: Partial<BusinessOnboardingData>) => void;
  onBack: (patch: Partial<BusinessOnboardingData>) => void;
}

export function DocumentsStep({ initial, onNext, onBack }: Props) {
  const [docs, setDocs] = useState<BusinessDocument[]>(initial.documents.length ? initial.documents : [newDoc()]);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const update = (idx: number, patch: Partial<BusinessDocument>) =>
    setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));

  const remove = (idx: number) => {
    setDocs((prev) => prev.filter((_, i) => i !== idx));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const onFile = (idx: number, file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_DOCUMENT_BYTES) {
      setRowErrors((p) => ({ ...p, [idx]: `File too large (${prettyBytes(file.size)}). Max 1 MB — use a smaller file or a link.` }));
      return;
    }
    setRowErrors((p) => {
      const next = { ...p };
      delete next[idx];
      return next;
    });
    const reader = new FileReader();
    reader.onload = () => {
      update(idx, {
        fileUrl: String(reader.result || ''),
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
        title: docs[idx]?.title || file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    const valid = docs.filter((d) => d.documentType && d.title.trim() && d.fileUrl);
    onNext({ documents: valid });
  };

  return (
    <div suppressHydrationWarning>
      <CardHeader className="text-center border-b border-border/50 pb-8">
        <CardTitle className="text-2xl font-bold tracking-tight">Supporting Documents</CardTitle>
        <CardDescription>Upload incorporation, GST/IEC/VAT certificates and KYC proofs (optional but recommended).</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="space-y-4">
          {docs.map((d, idx) => {
            const attached = Boolean(d.fileUrl);
            return (
              <div key={idx} className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Document {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    {attached && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 text-primary" /> {prettyBytes(d.fileSizeBytes)}
                      </Badge>
                    )}
                    {docs.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => remove(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField label="Document Type" value={d.documentType} onChange={(v) => update(idx, { documentType: v })} options={DOCUMENT_TYPES} placeholder="Select type" />
                  <TextField label="Title" value={d.title} onChange={(v) => update(idx, { title: v })} placeholder="e.g. Certificate of Incorporation" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">File (max 1 MB)</Label>
                  <Input type="file" className="bg-background/50 cursor-pointer" onChange={(e) => onFile(idx, e.target.files?.[0])} suppressHydrationWarning />
                  {d.fileName && !rowErrors[idx] && <p className="text-[10px] text-muted-foreground">{d.fileName}</p>}
                  {rowErrors[idx] && <p className="text-[10px] text-destructive uppercase font-bold">{rowErrors[idx]}</p>}
                </div>
                <TextField label="…or paste a document link" value={d.fileUrl.startsWith('data:') ? '' : d.fileUrl} onChange={(v) => update(idx, { fileUrl: v, fileName: '', fileSizeBytes: undefined, mimeType: '' })} placeholder="https://…" />
              </div>
            );
          })}
        </div>

        <Button type="button" variant="outline" className="w-full font-bold" onClick={() => setDocs((p) => [...p, newDoc()])}>
          <Plus className="mr-1 h-4 w-4" /> Add another document
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileUp className="h-4 w-4 text-primary" />
          <span>Files are submitted with your application. Large files should be shared as a secure link.</span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="h-12 font-bold uppercase tracking-widest" onClick={() => onBack({ documents: docs.filter((d) => d.documentType && d.title.trim() && d.fileUrl) })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button type="button" className="flex-1 h-12 font-bold uppercase tracking-widest" onClick={handleContinue}>
            Review &amp; Submit <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
