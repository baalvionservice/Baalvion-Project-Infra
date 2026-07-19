'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

interface Props {
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}

type Row = { key: string; value: unknown };

const toRows = (v: Record<string, unknown>): Row[] =>
  Object.entries(v || {}).map(([k, val]) => ({ key: k, value: val }));

// Preserve types so readers that check `typeof x === 'number'` (e.g. leadership `order`)
// keep working: "1" → 1, "true" → true, everything else stays a string.
const coercePrimitive = (v: string): unknown => {
  const t = v.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t !== '' && /^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return v;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isArrayOfObjects = (v: unknown): v is Record<string, unknown>[] =>
  Array.isArray(v) && v.length > 0 && v.every(isPlainObject);

const isArrayOfPrimitives = (v: unknown): v is (string | number | boolean)[] =>
  Array.isArray(v) && v.every((x) => x === null || typeof x !== 'object');

/** One editable value of any shape a CMS document actually uses in this codebase:
 * primitive, plain object (nested key/value), or array-of-objects (the common shape for
 * lists like benefits/steps/columns/testimonials). Recurses for nested objects/arrays. */
function FieldValueEditor({
  value,
  onChange,
  depth,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  depth: number;
}) {
  if (isArrayOfObjects(value)) {
    return <ArrayOfObjectsEditor items={value} onChange={onChange} depth={depth} />;
  }
  if (isPlainObject(value)) {
    return <ObjectEditor obj={value} onChange={onChange} depth={depth} />;
  }
  if (isArrayOfPrimitives(value) && value.length > 0) {
    return (
      <Input
        className="h-8 flex-1 text-xs"
        placeholder="comma, separated, values"
        defaultValue={value.join(', ')}
        onBlur={(e) =>
          onChange(
            e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .map(coercePrimitive)
          )
        }
      />
    );
  }
  // Primitive, empty array, or null — plain text input (existing behavior).
  const display = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return (
    <Input
      className="h-8 flex-1 text-xs"
      placeholder="value"
      defaultValue={display}
      onBlur={(e) => onChange(coercePrimitive(e.target.value))}
    />
  );
}

/** Nested plain-object editor — same add/remove/key/value row UI as the top level, one
 * level deeper (e.g. footer's `trustBadge: {eyebrow,title,description}`). */
function ObjectEditor({
  obj,
  onChange,
  depth,
}: {
  obj: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(true);
  const rows = toRows(obj);

  const emit = (next: Row[]) => {
    const result: Record<string, unknown> = {};
    next.forEach((r) => {
      const k = r.key.trim();
      if (k) result[k] = r.value;
    });
    onChange(result);
  };

  return (
    <div className={cn('flex-1 rounded-md border bg-muted/30', depth > 2 && 'border-dashed')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {rows.length} field{rows.length === 1 ? '' : 's'}
      </button>
      {open && (
        <div className="space-y-1.5 p-2 pt-0">
          {rows.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Input
                className="h-8 w-28 shrink-0 text-xs"
                placeholder="field"
                defaultValue={r.key}
                onBlur={(e) => emit(rows.map((row, idx) => (idx === i ? { ...row, key: e.target.value } : row)))}
              />
              <FieldValueEditor
                value={r.value}
                onChange={(v) => emit(rows.map((row, idx) => (idx === i ? { ...row, value: v } : row)))}
                depth={depth + 1}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => emit(rows.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => emit([...rows, { key: '', value: '' }])}>
            <Plus className="mr-1 h-3 w-3" /> Add field
          </Button>
        </div>
      )}
    </div>
  );
}

/** Array-of-objects editor — the common shape for things like `benefits`, `steps`,
 * `appointmentTypes`, `columns`, `testimonials`. Each item gets its own card with an
 * ObjectEditor; item shape is inferred from the FIRST existing item (or left empty for a
 * genuinely new array), so unrelated content types never need bespoke UI here. */
function ArrayOfObjectsEditor({
  items,
  onChange,
  depth,
}: {
  items: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  depth: number;
}) {
  const addItem = () => {
    const template = items[0] ? Object.fromEntries(Object.keys(items[0]).map((k) => [k, ''])) : {};
    onChange([...items, template]);
  };
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, next: Record<string, unknown>) =>
    onChange(items.map((it, idx) => (idx === i ? next : it)));

  return (
    <div className="flex-1 space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <span className="mt-2 shrink-0 text-[10px] font-mono text-muted-foreground w-4">{i + 1}.</span>
          <ObjectEditor obj={item} onChange={(v) => updateItem(i, v)} depth={depth + 1} />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(i)} title="Remove item">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addItem}>
        <Plus className="mr-1 h-3 w-3" /> Add item
      </Button>
    </div>
  );
}

export default function CustomFieldsPanel({ value, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>(toRows(value));

  const emit = (next: Row[]) => {
    setRows(next);
    const obj: Record<string, unknown> = {};
    next.forEach((r) => {
      const k = r.key.trim();
      if (k) obj[k] = r.value;
    });
    onChange(obj);
  };

  const setRowKey = (i: number, key: string) => emit(rows.map((r, idx) => (idx === i ? { ...r, key } : r)));
  const setRowValue = (i: number, val: unknown) => emit(rows.map((r, idx) => (idx === i ? { ...r, value: val } : r)));
  const add = () => emit([...rows, { key: '', value: '' }]);
  const remove = (i: number) => emit(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3 p-4">
      <div>
        <Label className="text-sm font-medium">Custom fields</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Extra structured data. Lists (like a set of benefits or steps) get an "Add item"
          row editor; nested groups get their own field list — nothing needs hand-typed JSON.
        </p>
      </div>

      <div className="space-y-2">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">No custom fields yet.</p>}
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <Input
              className="h-8 w-28 shrink-0 text-xs"
              placeholder="field"
              value={r.key}
              onChange={(e) => setRowKey(i, e.target.value)}
            />
            <FieldValueEditor value={r.value} onChange={(v) => setRowValue(i, v)} depth={0} />
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
