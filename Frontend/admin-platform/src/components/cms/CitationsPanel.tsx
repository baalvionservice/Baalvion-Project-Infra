'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}

type Citation = { title: string; url: string };

const toCitations = (value: Record<string, unknown>): Citation[] => {
  const raw = value.citations;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => c as { title?: unknown; url?: unknown })
    .map((c) => ({ title: typeof c.title === 'string' ? c.title : '', url: typeof c.url === 'string' ? c.url : '' }));
};

/**
 * "Sources & References" editor — a real array (title + URL pairs) under
 * `customFields.citations`, unlike the generic CustomFieldsPanel (scalar-only, never
 * round-trips JSON on save). Powers the "Sources & References" list at the end of the
 * public article — an E-E-A-T trust signal for finance/YMYL content.
 */
export default function CitationsPanel({ value, onChange }: Props) {
  const citations = toCitations(value);

  const emit = (next: Citation[]) => {
    const cleaned = next.filter((c) => c.title.trim() || c.url.trim());
    const { citations: _drop, ...rest } = value;
    onChange(cleaned.length ? { ...rest, citations: cleaned } : rest);
  };

  const setRow = (i: number, patch: Partial<Citation>) =>
    emit(citations.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const add = () => emit([...citations, { title: '', url: '' }]);
  const remove = (i: number) => emit(citations.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3 p-4 border-t">
      <div>
        <Label className="text-sm font-medium">Sources &amp; references</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Citations shown at the end of the article — an E-E-A-T trust signal for finance content.
        </p>
      </div>

      <div className="space-y-2">
        {citations.length === 0 && <p className="text-xs text-muted-foreground">No sources cited yet.</p>}
        {citations.map((c, i) => (
          <div key={i} className="space-y-1 rounded-md border p-2">
            <div className="flex items-center gap-1.5">
              <Input
                className="h-8 flex-1 text-xs"
                placeholder="Source title, e.g. IRS Publication 550"
                value={c.title}
                onChange={(e) => setRow(i, { title: e.target.value })}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(i)} title="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input
              className="h-8 text-xs"
              placeholder="https://..."
              value={c.url}
              onChange={(e) => setRow(i, { url: e.target.value })}
            />
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={add}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add source
      </Button>
    </div>
  );
}
