'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}

type Row = { key: string; value: string };

const toRows = (v: Record<string, unknown>): Row[] =>
  Object.entries(v || {}).map(([k, val]) => ({
    key: k,
    value: val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val),
  }));

// Preserve types so readers that check `typeof x === 'number'` (e.g. leadership `order`)
// keep working: "1" → 1, "true" → true, everything else stays a string.
const coerce = (v: string): unknown => {
  const t = v.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t !== '' && /^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return v;
};

export default function CustomFieldsPanel({ value, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>(toRows(value));

  const emit = (next: Row[]) => {
    setRows(next);
    const obj: Record<string, unknown> = {};
    next.forEach((r) => {
      const k = r.key.trim();
      if (k) obj[k] = coerce(r.value);
    });
    onChange(obj);
  };

  const setRow = (i: number, patch: Partial<Row>) => emit(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => emit([...rows, { key: '', value: '' }]);
  const remove = (i: number) => emit(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3 p-4">
      <div>
        <Label className="text-sm font-medium">Custom fields</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Extra structured data. For leadership profiles: <code>role</code> (job title),
          <code> position</code>, <code>tier</code> (executive-committee / functional-leadership /
          vice-presidents / board-of-directors), <code>order</code>, <code>kind</code>.
        </p>
      </div>

      <div className="space-y-2">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">No custom fields yet.</p>}
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              className="h-8 flex-1 text-xs"
              placeholder="field"
              value={r.key}
              onChange={(e) => setRow(i, { key: e.target.value })}
            />
            <Input
              className="h-8 flex-1 text-xs"
              placeholder="value"
              value={r.value}
              onChange={(e) => setRow(i, { value: e.target.value })}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(i)} title="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={add}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add field
      </Button>
    </div>
  );
}
