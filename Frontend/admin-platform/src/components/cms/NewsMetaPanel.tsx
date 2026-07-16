'use client';

import { useState } from 'react';
import { Newspaper, Radio, TrendingUp, Star, Lock, Plus, X, Image as ImageIcon, Video, Link2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/cn';
import { NEWS_LABELS, type NewsLabel } from '@/lib/types/cms-content.types';

export interface NewsMeta {
  galleryImages: string[];
  videoUrl?: string;
  readingTimeMinutes: number | null;
  isFeatured: boolean;
  isBreaking: boolean;
  isTrending: boolean;
  isEditorsPick: boolean;
  isPremium: boolean;
  newsLabels: NewsLabel[];
  externalSourceName?: string;
  externalSourceUrl?: string;
}

interface Props {
  value: NewsMeta;
  onChange: (v: NewsMeta) => void;
  autoReadingTime: number | null;
}

const FLAGS: { key: keyof NewsMeta; label: string; icon: typeof Star }[] = [
  { key: 'isFeatured', label: 'Featured', icon: Star },
  { key: 'isBreaking', label: 'Breaking News', icon: Radio },
  { key: 'isTrending', label: 'Trending', icon: TrendingUp },
  { key: 'isEditorsPick', label: "Editor's Pick", icon: Newspaper },
  { key: 'isPremium', label: 'Premium', icon: Lock },
];

export default function NewsMetaPanel({ value, onChange, autoReadingTime }: Props) {
  const [newImage, setNewImage] = useState('');

  const set = <K extends keyof NewsMeta>(key: K, v: NewsMeta[K]) => onChange({ ...value, [key]: v });

  const toggleLabel = (label: NewsLabel) => {
    set('newsLabels', value.newsLabels.includes(label)
      ? value.newsLabels.filter((l) => l !== label)
      : [...value.newsLabels, label]);
  };

  const addImage = () => {
    const url = newImage.trim();
    if (!url) return;
    set('galleryImages', [...value.galleryImages, url]);
    setNewImage('');
  };

  const removeImage = (url: string) => set('galleryImages', value.galleryImages.filter((i) => i !== url));

  return (
    <div className="space-y-5 p-4">
      {/* Editorial flags */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          Editorial Flags
        </Label>
        <div className="space-y-1.5 rounded-md border p-2">
          {FLAGS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                checked={value[key] as boolean}
                onCheckedChange={(c) => set(key, !!c as NewsMeta[typeof key])}
                className="h-3.5 w-3.5"
              />
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* News labels */}
      <div className="space-y-1.5">
        <Label className="text-xs">News Labels</Label>
        <div className="flex flex-wrap gap-1.5">
          {NEWS_LABELS.map((label) => {
            const active = value.newsLabels.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleLabel(label)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[11px] capitalize transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/60',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reading time */}
      <div className="space-y-1.5">
        <Label className="text-xs">Reading Time (minutes)</Label>
        <Input
          type="number"
          min={1}
          className="h-8 text-xs"
          placeholder={autoReadingTime ? `Auto: ${autoReadingTime}` : 'Auto-calculated on save'}
          value={value.readingTimeMinutes ?? ''}
          onChange={(e) => set('readingTimeMinutes', e.target.value ? Number(e.target.value) : null)}
        />
        <p className="text-[11px] text-muted-foreground">Leave blank to auto-calculate from the article body.</p>
      </div>

      {/* Video URL */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs">
          <Video className="h-3.5 w-3.5 text-muted-foreground" />
          Video URL
        </Label>
        <Input
          className="h-8 text-xs"
          placeholder="https://…"
          value={value.videoUrl ?? ''}
          onChange={(e) => set('videoUrl', e.target.value)}
        />
      </div>

      {/* Gallery images */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs">
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          Gallery Images
        </Label>
        <div className="space-y-1">
          {value.galleryImages.map((url) => (
            <div key={url} className="flex items-center gap-1.5 rounded border px-2 py-1">
              <span className="flex-1 truncate text-[11px]">{url}</span>
              <button type="button" onClick={() => removeImage(url)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            className="h-8 text-xs"
            placeholder="Image URL…"
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addImage();
              }
            }}
          />
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={addImage} disabled={!newImage.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* External source attribution */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs">
          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          External Source
        </Label>
        <Input
          className="h-8 text-xs"
          placeholder="Source name (e.g. Reuters)"
          value={value.externalSourceName ?? ''}
          onChange={(e) => set('externalSourceName', e.target.value)}
        />
        <Input
          className="h-8 text-xs"
          placeholder="Source URL"
          value={value.externalSourceUrl ?? ''}
          onChange={(e) => set('externalSourceUrl', e.target.value)}
        />
      </div>
    </div>
  );
}
