'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  getCompanyEntity, suggestCompanies, type CompanyLookupEntity, type CompanySuggestion,
} from '@/services/compliance-service';

interface Props {
  value: string;
  onChange: (name: string) => void;
  /** Called with the register's details when the customer picks a suggestion. */
  onPick: (entity: CompanyLookupEntity) => void;
  /** Name of the register entry the form was filled from, if any. */
  pickedName?: string | null;
}

const DEBOUNCE_MS = 300;

/**
 * Company name field with type-ahead from the public LEI register. Picking a result
 * fills in the registration number, address and country so the customer does not
 * type them. If the register has no match (many valid companies are not in it) or
 * cannot be reached, this behaves as a plain text field.
 */
export function CompanySearch({ value, onChange, onPick, pickedName }: Props) {
  const [options, setOptions] = useState<CompanySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [filling, setFilling] = useState(false);
  const latest = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    // Once a suggestion was chosen the text equals its name; do not search again.
    if (q.length < 3 || q === pickedName) { setOptions([]); setSearching(false); return undefined; }
    const ticket = ++latest.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      const found = await suggestCompanies(q);
      if (ticket !== latest.current) return; // a newer keystroke superseded this answer
      setOptions(found);
      setSearching(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, pickedName]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function choose(s: CompanySuggestion) {
    setOpen(false);
    setOptions([]);
    onChange(s.name);
    setFilling(true);
    const entity = await getCompanyEntity(s.lei);
    setFilling(false);
    if (entity) onPick(entity);
  }

  const confirmed = !!pickedName && value.trim() === pickedName;

  return (
    <div className="relative" ref={box}>
      <div className="relative">
        <Input
          placeholder="Start typing your company's legal name"
          value={value}
          autoComplete="off"
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {(searching || filling) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {confirmed && !searching && !filling && <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Found in the public register" />}
        </div>
      </div>
      {open && options.length > 0 && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {options.map((o) => (
            <li key={o.lei}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => choose(o)}
                className={cn('w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none')}
              >
                {o.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {confirmed && (
        <p className="mt-1 text-xs text-emerald-700">Found in the public register. Details below were filled in for you — check them.</p>
      )}
    </div>
  );
}
