'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ListColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'url';
  width?: string;
}

type Row = Record<string, unknown>;

/** Editable rows for a JSON array field (awards, education, timeline...). Blank rows are dropped by the caller on save. */
export function ListEditor({
  label, hint, columns, rows, onChange,
}: {
  label: string;
  hint?: string;
  columns: ListColumn[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
}) {
  const set = (i: number, key: string, raw: string, type?: string) => {
    const value = type === 'number' ? (raw === '' ? undefined : Number(raw)) : raw;
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          {columns.map((c) => (
            <Input
              key={c.key}
              className={c.width ?? 'flex-1'}
              type={c.type === 'number' ? 'number' : 'text'}
              placeholder={c.label}
              aria-label={`${label} ${c.label} ${i + 1}`}
              value={(row[c.key] as string | number | undefined) ?? ''}
              onChange={(e) => set(i, c.key, e.target.value, c.type)}
            />
          ))}
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label} row ${i + 1}`} onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, {}])}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}
