"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { lawyerApi } from "@/lib/api/client";

interface Suggestion {
  id: number | string;
  name: string;
  specializations?: string[];
  city?: string;
  country?: string;
  rating?: number | string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * Typeahead for the global lawyer directory. Debounced trigram + full-text
 * suggestions from /lawyers/autocomplete; click a suggestion to open the profile,
 * or press Enter to run the full directory search (parent's onSubmit).
 */
export default function LawyerAutocomplete({ value, onChange, onSubmit, placeholder, className }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced fetch as the user types (>= 2 chars).
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = value.trim();
    if (q.length < 2) { setItems([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await lawyerApi.autocomplete(q);
        const data: Suggestion[] = res.data?.data || res.data || [];
        setItems(data);
        setOpen(true);
        setActive(-1);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (s: Suggestion) => {
    setOpen(false);
    router.push(`/lawyer/${s.id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !items.length) {
      if (e.key === "Enter") onSubmit();
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") {
      if (active >= 0 && items[active]) { e.preventDefault(); go(items[active]); }
      else { setOpen(false); onSubmit(); }
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative flex-1 group">
      <Search className="absolute left-4 top-3 h-5 w-5 text-blue-600 opacity-50 group-focus-within:opacity-100 transition-opacity z-10" />
      <Input
        placeholder={placeholder || "Search by practitioner name or expertise..."}
        className={className || "pl-12 h-12 border-slate-200 text-lg bg-slate-50 focus:bg-white transition-all"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => items.length && setOpen(true)}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {loading && <Loader2 className="absolute right-4 top-3.5 h-4 w-4 animate-spin text-blue-500" />}

      {open && items.length > 0 && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(s)}
                  className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${i === active ? "bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-xs font-bold text-white">
                    {s.name?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {(s.specializations || []).slice(0, 2).join(", ")}
                      {(s.city || s.country) && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-slate-400">
                          <MapPin className="h-3 w-3" /> {[s.city, s.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => { setOpen(false); onSubmit(); }}
            className="block w-full border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50"
          >
            See all results for “{value}”
          </button>
        </div>
      )}
    </div>
  );
}
