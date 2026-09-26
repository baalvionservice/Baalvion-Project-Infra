'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ListColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'url' | 'select';
  width?: string;
  /** Required when type is 'select' -- the choices, e.g. every known court for a timeline row's "which court" column. */
  options?: { value: string; label: string }[];
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
            c.type === 'select' ? (
              <select
                key={c.key}
                className={`h-9 rounded-md border border-input bg-background px-3 text-sm ${c.width ?? 'flex-1'}`}
                aria-label={`${label} ${c.label} ${i + 1}`}
                value={(row[c.key] as string | undefined) ?? ''}
                onChange={(e) => set(i, c.key, e.target.value)}
              >
                <option value="">{c.label}</option>
                {c.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <Input
                key={c.key}
                className={c.width ?? 'flex-1'}
                type={c.type === 'number' ? 'number' : 'text'}
                placeholder={c.label}
                aria-label={`${label} ${c.label} ${i + 1}`}
                value={(row[c.key] as string | number | undefined) ?? ''}
                onChange={(e) => set(i, c.key, e.target.value, c.type)}
              />
            )
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
