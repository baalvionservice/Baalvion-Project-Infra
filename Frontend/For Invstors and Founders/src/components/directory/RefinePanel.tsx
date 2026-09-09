import { ChevronDown } from "lucide-react";

export type Facet<T> = {
  key: string;
  label: string;
  options: string[];
  match: (row: T, value: string) => boolean;
};

export type Selection = Record<string, string[]>;

// Counts are computed against everything EXCEPT this facet's own selection, so a group always
// shows what each option would add rather than collapsing to the current result set.
export function facetCounts<T>(rows: T[], facets: Facet<T>[], sel: Selection, facet: Facet<T>, textMatch: (r: T) => boolean) {
  const base = rows.filter((r) => textMatch(r) && facets.every((f) =>
    f.key === facet.key || !sel[f.key]?.length || sel[f.key].some((v) => f.match(r, v))));
  const out: Record<string, number> = {};
  for (const o of facet.options) out[o] = base.filter((r) => facet.match(r, o)).length;
  return out;
}

export default function RefinePanel<T>({ facets, rows, selection, onChange, textMatch, onClear }: {
  facets: Facet<T>[];
  rows: T[];
  selection: Selection;
  onChange: (key: string, value: string) => void;
  textMatch: (r: T) => boolean;
  onClear: () => void;
}) {
  const activeCount = Object.values(selection).reduce((n, v) => n + (v?.length || 0), 0);

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="flex items-baseline justify-between pb-3 border-b border-foreground/80">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Refine</h2>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs text-primary hover:underline">Clear all ({activeCount})</button>
        )}
      </div>

      {facets.map((f) => {
        const counts = facetCounts(rows, facets, selection, f, textMatch);
        const options = f.options.filter((o) => counts[o] > 0 || selection[f.key]?.includes(o));
        if (!options.length) return null;
        return (
          <details key={f.key} open className="group border-b border-border py-3">
            <summary className="flex items-center justify-between cursor-pointer list-none select-none">
              <span className="text-sm font-medium">{f.label}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-2.5 space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {options.map((o) => {
                const checked = !!selection[f.key]?.includes(o);
                return (
                  <li key={o}>
                    <label className="flex items-center gap-2.5 text-sm cursor-pointer group/opt">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onChange(f.key, o)}
                        className="w-4 h-4 rounded-sm border-input accent-primary cursor-pointer"
                      />
                      <span className={`flex-1 ${checked ? "font-medium" : "text-foreground/85"} group-hover/opt:text-primary`}>{o}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{counts[o] ?? 0}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </aside>
  );
}
