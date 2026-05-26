'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Loader2,
  Globe,
  TrendingUp,
  Zap,
  Check,
  PlusCircle,
  Star,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SOCIAL_PLATFORMS } from '@/constants';
import { cn } from '@/lib/utils';

interface AddPortfolioItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPortfolioItemDialog({ open, onOpenChange }: AddPortfolioItemDialogProps) {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'Instagram',
    campaignType: 'Sponsored Content',
    results: '',
    isPublic: true,
    isFeatured: false
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      return toast({ variant: 'destructive', title: 'File too large', description: 'Max file size is 100MB' });
    }

    const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    setMediaType(type);

    const id = Math.random().toString(36).substring(7);
    const storageRef = ref(storage!, `portfolios/${currentUser?.id}/${id}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      },
      (err) => {
        console.error(err);
        toast({ variant: 'destructive', title: 'Upload failed' });
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setMediaUrl(url);
        toast({ title: 'Media uploaded successfully' });
      }
    );
  };

  const handleSubmit = async () => {
    if (!mediaUrl || !formData.title) return;
    setIsSubmitting(true);

    const itemData = {
      userId: currentUser?.id,
      title: formData.title,
      description: formData.description,
      mediaUrl,
      mediaType,
      platform: formData.platform,
      campaignType: formData.campaignType,
      results: formData.results,
      isPublic: formData.isPublic,
      isFeatured: formData.isFeatured,
      order: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db!, 'portfolioItems'), itemData);
      toast({ title: "Sample added!", description: "It's now visible on your profile." });
      resetAndClose();
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: '/portfolioItems',
        operation: 'create',
        requestResourceData: itemData
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setMediaUrl('');
    setUploadProgress(0);
    setFormData({
      title: '',
      description: '',
      platform: 'Instagram',
      campaignType: 'Sponsored Content',
      results: '',
      isPublic: true,
      isFeatured: false
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">

          {/* Left: Preview & Upload */}
          <div className="md:w-2/5 bg-slate-50/50 p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r">
            <div className="aspect-[4/5] rounded-3xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center relative overflow-hidden group">
              {mediaUrl ? (
                <>
                  <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button size="icon" variant="secondary" className="rounded-full h-10 w-10" onClick={() => setMediaUrl('')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Upload Media</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Image or Video up to 100MB</p>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} accept="image/*,video/*" />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-[10px] font-black text-primary uppercase">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}
          </div>

          {/* Right: Metadata Form */}
          <div className="md:w-3/5 p-8 overflow-y-auto">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-black">Sample Details</DialogTitle>
              <DialogDescription>Add context to your work to show brands the value you delivered.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold">Collaboration Title</Label>
                <Input
                  placeholder="e.g. Lumina Hub AI Review"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Platform</Label>
                  <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_PLATFORMS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Type</Label>
                  <Input
                    placeholder="e.g. Unboxing Reel"
                    value={formData.campaignType}
                    onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Label className="font-bold">Results Achieved</Label>
                  <Badge className="bg-emerald-100 text-emerald-600 border-none text-[8px] px-1.5 h-4 font-black">HIGH IMPACT</Badge>
                </div>
                <Input
                  placeholder="e.g. 2.4M Views, 15k Shares, 12% Conversion"
                  value={formData.results}
                  onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                  className="rounded-xl h-11 border-emerald-100 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Brief Description</Label>
                <Textarea
                  placeholder="What was the goal of this collaboration and how did you execute it?"
                  className="rounded-xl min-h-[100px] resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Star className={cn("h-5 w-5", formData.isFeatured ? "text-orange-500 fill-orange-500" : "text-slate-300")} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Featured Sample</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Pin to top of portfolio</p>
                  </div>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(v) => setFormData({ ...formData, isFeatured: v })}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={resetAndClose}>Cancel</Button>
              <Button
                disabled={isSubmitting || !mediaUrl || !formData.title}
                className="flex-2 px-10 rounded-xl h-12 font-bold shadow-xl shadow-primary/20"
                onClick={handleSubmit}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Save to Portfolio
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}