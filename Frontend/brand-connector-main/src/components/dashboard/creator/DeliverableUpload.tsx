'use client';

import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  X, 
  CheckCircle2, 
  Loader2, 
  Plus,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface UploadedAsset {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'URL';
  name: string;
  url: string;
  progress: number;
  status: 'UPLOADING' | 'COMPLETED' | 'ERROR';
  deliverableType: string;
}

interface DeliverableUploadProps {
  campaignId: string;
  deliverableTypes: string[];
  onAssetsChange?: (assets: UploadedAsset[]) => void;
}

export function DeliverableUpload({ campaignId, deliverableTypes, onAssetsChange }: DeliverableUploadProps) {
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [selectedType, setSelectedType] = useState(deliverableTypes[0] || 'Uncategorized');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storage = useStorage();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => startUpload(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startUpload = (file: File) => {
    const id = Math.random().toString(36).substring(7);
    let type: UploadedAsset['type'] = 'DOCUMENT';
    if (file.type.startsWith('image/')) type = 'IMAGE';
    if (file.type.startsWith('video/')) type = 'VIDEO';

    // Size limits
    if (type === 'IMAGE' && file.size > 50 * 1024 * 1024) return toast({ variant: 'destructive', title: 'File too large', description: 'Images must be under 50MB' });
    if (type === 'VIDEO' && file.size > 500 * 1024 * 1024) return toast({ variant: 'destructive', title: 'File too large', description: 'Videos must be under 500MB' });

    const newAsset: UploadedAsset = {
      id,
      type,
      name: file.name,
      url: '',
      progress: 0,
      status: 'UPLOADING',
      deliverableType: selectedType
    };

    setAssets(prev => [...prev, newAsset]);

    const storageRef = ref(storage!, `campaigns/${campaignId}/deliverables/${id}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        updateAsset(id, { progress });
      }, 
      (error) => {
        console.error(error);
        updateAsset(id, { status: 'ERROR' });
        toast({ variant: 'destructive', title: 'Upload failed', description: `Could not upload ${file.name}` });
      }, 
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        updateAsset(id, { status: 'COMPLETED', url, progress: 100 });
      }
    );
  };

  const addUrlAsset = () => {
    if (!urlInput.startsWith('http')) return toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please provide a valid link' });
    
    const id = Math.random().toString(36).substring(7);
    const newAsset: UploadedAsset = {
      id,
      type: 'URL',
      name: urlInput,
      url: urlInput,
      progress: 100,
      status: 'COMPLETED',
      deliverableType: selectedType
    };

    const updated = [...assets, newAsset];
    setAssets(updated);
    onAssetsChange?.(updated);
    setUrlInput('');
    setIsUrlMode(false);
  };

  const updateAsset = (id: string, updates: Partial<UploadedAsset>) => {
    setAssets(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...updates } : a);
      onAssetsChange?.(next);
      return next;
    });
  };

  const removeAsset = (id: string) => {
    const next = assets.filter(a => a.id !== id);
    setAssets(next);
    onAssetsChange?.(next);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Deliverable</label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-xl min-w-[200px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {deliverableTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none rounded-xl font-bold bg-white border-slate-200 h-10"
            onClick={() => setIsUrlMode(!isUrlMode)}
          >
            <LinkIcon className="mr-2 h-4 w-4 text-primary" />
            Add Link
          </Button>
          <Button 
            className="flex-1 sm:flex-none rounded-xl font-bold h-10"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
          <input 
            type="file" 
            multiple 
            hidden 
            ref={fileInputRef} 
            onChange={handleFileSelect}
            accept="image/*,video/mp4,video/quicktime,application/pdf"
          />
        </div>
      </div>

      {/* URL Input Area */}
      {isUrlMode && (
        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex gap-2 animate-in fade-in slide-in-from-top-2">
          <Input 
            placeholder="Paste live URL (Instagram, YouTube, etc.)" 
            className="bg-white rounded-xl border-slate-200 h-11"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <Button onClick={addUrlAsset} className="rounded-xl px-6 h-11 font-bold">Add</Button>
        </div>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 gap-3">
        {assets.length === 0 && !isUrlMode && (
          <div className="aspect-[21/9] border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center bg-slate-50/50 group hover:border-primary transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
              <FileUp className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors" />
            </div>
            <p className="font-bold text-slate-400 group-hover:text-slate-600">Drag and drop your work here</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">MP4, JPG, PNG or PDF</p>
          </div>
        )}

        {assets.map((asset) => (
          <div key={asset.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-50 hover:border-primary/10 transition-all group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {asset.type === 'IMAGE' && <ImageIcon className="h-6 w-6 text-pink-500" />}
                {asset.type === 'VIDEO' && <Video className="h-6 w-6 text-blue-500" />}
                {asset.type === 'DOCUMENT' && <FileText className="h-6 w-6 text-indigo-500" />}
                {asset.type === 'URL' && <LinkIcon className="h-6 w-6 text-emerald-500" />}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-slate-900 truncate">{asset.name}</p>
                  <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 h-4 border-slate-200 bg-slate-50/50 text-slate-400">
                    {asset.deliverableType}
                  </Badge>
                </div>
                {asset.status === 'UPLOADING' ? (
                  <div className="flex items-center gap-3">
                    <Progress value={asset.progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-black text-primary w-8">{Math.round(asset.progress)}%</span>
                  </div>
                ) : asset.status === 'COMPLETED' ? (
                  <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Ready for review
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-red-500">Upload failed</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {asset.url && (
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" asChild>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </a>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeAsset(asset.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
