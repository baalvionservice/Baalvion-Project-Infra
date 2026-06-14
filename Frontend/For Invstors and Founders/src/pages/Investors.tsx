import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Briefcase, BadgeCheck, Wallet, ChevronRight, ChevronDown, Landmark, LayoutGrid, List, ArrowUpDown, X, Check } from "lucide-react";
import { useActivityTracking } from "@/hooks/useActivityTracking";

export type Investor = {
  id: string;
  name: string;
  firm: string | null;
  title: string | null;
  avatar_url: string | null;
  thesis: string | null;
  focus_sectors: string[];
  stages: string[];
  check_min: number | null;
  check_max: number | null;
  location: string | null;
  website: string | null;
  linkedin_url: string | null;
  portfolio: string[];
  deals_backed: number;
  is_verified: boolean;
  firm_type: string | null;
  region: string | null;
  headquarters: string | null;
  aum_usd: number | null;
  email: string | null;
  phone: string | null;
  enrichment_confidence: string | null;
};

export const money = (n: number | null) => {
  if (n == null) return "—";
  if (n >= 1e9) return `$${n / 1e9 % 1 === 0 ? n / 1e9 : (n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${n / 1e6 % 1 === 0 ? n / 1e6 : (n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${n}`;
};
export const checkRange = (inv: Investor) =>
  inv.check_min != null && inv.check_max != null ? `${money(inv.check_min)} – ${money(inv.check_max)}` : "Flexible";
const initials = (n = "?") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const CHECK_BANDS: Record<string, [number, number]> = { "<$250K": [0, 250000], "$250K–$1M": [250000, 1000000], "$1M–$5M": [1000000, 5000000], "$5M+": [5000000, Infinity] };
const checkMatch = (i: Investor, v: string) => { const b = CHECK_BANDS[v]; if (!b) return true; const mid = ((i.check_min || 0) + (i.check_max || i.check_min || 0)) / 2; return mid >= b[0] && mid < b[1]; };

const Avatar = ({ inv, cls = "w-11 h-11" }: { inv: Investor; cls?: string }) => (
  inv.avatar_url
    ? <img src={inv.avatar_url} alt={inv.name} className={`${cls} rounded-full object-cover ring-2 ring-primary/20 shrink-0`} />
    : <div className={`${cls} rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0`}>{initials(inv.name)}</div>
);

// A single filter that opens a dropdown listing all its options (with counts).
function FacetDropdown({ label, options, value, counts, onChange }: {
  label: string; options: string[]; value: string; counts: Record<string, number>; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== "all";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50"}`}>
          {active ? <span><span className="text-muted-foreground font-normal">{label}:</span> {value}</span> : label}
          <ChevronDown className={`w-4 h-4 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5 max-h-80 overflow-y-auto">
        {["all", ...options].map((opt) => {
          const selected = value === opt; const c = counts[opt] ?? 0;
          return (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} disabled={c === 0 && !selected}
              className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors ${selected ? "bg-primary/15 text-primary font-medium" : c === 0 ? "text-muted-foreground/40 cursor-default" : "hover:bg-secondary text-foreground"}`}>
              <span className="flex items-center gap-2 truncate">
                {selected ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
                {opt === "all" ? `All ${label.toLowerCase()}` : opt}
              </span>
              <span className="ml-2 text-xs tabular-nums opacity-60">{c}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

type FilterKey = "ftype" | "region" | "stage" | "check" | "sector";

export default function Investors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, string>>({ ftype: "all", region: "all", stage: "all", check: "all", sector: "all" });
  const [sort, setSort] = useState<"backed" | "aum" | "name">("backed");
  const [view, setView] = useState<"grid" | "list">("list");
  const { trackPageView } = useActivityTracking();

  useEffect(() => { trackPageView("Investors"); }, [trackPageView]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("investors" as any).select("*").order("deals_backed", { ascending: false });
        setInvestors((data as Investor[]) || []);
      } catch (e) { console.error("Failed to load investors:", e); }
      finally { setLoading(false); }
    })();
  }, []);

  const opts = (arr: (string | null)[]) => [...new Set(arr.filter(Boolean) as string[])].sort();
  const sectorOpts = useMemo(() => { const s = new Set<string>(); investors.forEach((i) => (i.focus_sectors || []).forEach((x) => s.add(x))); return [...s].sort(); }, [investors]);
  const stageOpts = useMemo(() => { const s = new Set<string>(); investors.forEach((i) => (i.stages || []).forEach((x) => s.add(x))); return [...s].sort(); }, [investors]);

  const FACETS = useMemo(() => ([
    { key: "region" as FilterKey, label: "Region", options: opts(investors.map((i) => i.region)), match: (i: Investor, v: string) => i.region === v },
    { key: "stage" as FilterKey, label: "Stage", options: stageOpts, match: (i: Investor, v: string) => (i.stages || []).includes(v) },
    { key: "ftype" as FilterKey, label: "Type", options: opts(investors.map((i) => i.firm_type)), match: (i: Investor, v: string) => i.firm_type === v },
    { key: "check" as FilterKey, label: "Check size", options: Object.keys(CHECK_BANDS), match: checkMatch },
    { key: "sector" as FilterKey, label: "Sector", options: sectorOpts, match: (i: Investor, v: string) => (i.focus_sectors || []).includes(v) },
  ]), [investors, sectorOpts, stageOpts]);

  const searchMatch = (i: Investor) => {
    const q = search.trim().toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || (i.firm || "").toLowerCase().includes(q) || (i.focus_sectors || []).some((s) => s.toLowerCase().includes(q));
  };
  const passes = (i: Investor, exceptKey?: FilterKey) =>
    searchMatch(i) && FACETS.every((f) => f.key === exceptKey || filters[f.key] === "all" || f.match(i, filters[f.key]));
  const countsFor = (f: typeof FACETS[number]) => {
    const base = investors.filter((i) => passes(i, f.key));
    const rec: Record<string, number> = { all: base.length };
    f.options.forEach((o) => { rec[o] = base.filter((i) => f.match(i, o)).length; });
    return rec;
  };

  const sorted = useMemo(() => {
    const out = investors.filter((i) => passes(i));
    out.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "aum" ? (b.aum_usd || 0) - (a.aum_usd || 0) : (b.deals_backed || 0) - (a.deals_backed || 0));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investors, search, filters, sort, FACETS]);

  const setFilter = (k: FilterKey, v: string) => setFilters((p) => ({ ...p, [k]: v }));
  const activeChips = FACETS.filter((f) => filters[f.key] !== "all");
  const clearAll = () => { setFilters({ ftype: "all", region: "all", stage: "all", check: "all", sector: "all" }); setSearch(""); };

  const SectorTags = ({ inv, max = 3 }: { inv: Investor; max?: number }) => (
    <div className="flex flex-wrap gap-1">{(inv.focus_sectors || []).slice(0, max).map((s) => <Badge key={s} variant="secondary" className="text-[11px] font-normal">{s}</Badge>)}</div>
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
            <p className="text-muted-foreground mt-1 text-sm">{loading ? "Loading…" : `Browse ${investors.length} investors — filter by region, stage, type, check size & sector.`}</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search name, firm, or sector…" className="pl-12 h-12 rounded-xl bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Filter dropdown bar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {FACETS.map((f) => (
            <FacetDropdown key={f.key} label={f.label} options={f.options} value={filters[f.key]} counts={countsFor(f)} onChange={(v) => setFilter(f.key, v)} />
          ))}
          {activeChips.length > 0 && (
            <button onClick={clearAll} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-2"><X className="w-4 h-4" />Clear all</button>
          )}
        </div>

        {/* Active filter pills */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {activeChips.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key, "all")} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs px-3 py-1 hover:bg-primary/20 transition-colors">
                <span className="text-muted-foreground">{f.label}:</span>{filters[f.key]}<X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{sorted.length}</span> result{sorted.length === 1 ? "" : "s"}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              {([["backed", "Most active"], ["aum", "Largest AUM"], ["name", "A–Z"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSort(k)} className={`px-2.5 py-1 rounded-md text-xs transition-colors ${sort === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
              ))}
            </div>
            <div className="flex rounded-lg border border-border p-0.5">
              <button onClick={() => setView("list")} className={`p-1.5 rounded-md ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><List className="w-4 h-4" /></button>
              <button onClick={() => setView("grid")} className={`p-1.5 rounded-md ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[68px] rounded-xl" />)}</div>
        ) : sorted.length === 0 ? (
          <Card><CardContent className="py-20 text-center text-muted-foreground">No investors match these filters. <button onClick={clearAll} className="text-primary hover:underline">Clear filters</button></CardContent></Card>
        ) : view === "list" ? (
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="hidden lg:flex items-center gap-4 px-5 py-2.5 bg-secondary/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border">
              <span className="w-11" /><span className="flex-1">Investor</span>
              <span className="w-20">Type</span><span className="w-32">Sectors</span>
              <span className="w-28 text-right">Check</span><span className="w-24 text-right">AUM</span>
              <span className="w-16 text-right">Deals</span><span className="w-5" />
            </div>
            <div className="divide-y divide-border">
              {sorted.map((inv) => (
                <Link key={inv.id} to={`/investors/${inv.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 transition-colors group">
                  <Avatar inv={inv} cls="w-11 h-11" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate group-hover:text-primary transition-colors">{inv.name}</span>
                      {inv.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                    <span className="text-sm text-muted-foreground truncate">{inv.firm}{inv.region ? ` · ${inv.region}` : ""}</span>
                  </div>
                  <div className="hidden lg:block w-20 shrink-0">{inv.firm_type && <Badge variant="outline" className="border-primary/40 text-primary text-[11px]">{inv.firm_type}</Badge>}</div>
                  <div className="hidden lg:block w-32 shrink-0"><SectorTags inv={inv} max={2} /></div>
                  <div className="hidden lg:block w-28 shrink-0 text-right text-sm font-medium">{checkRange(inv)}</div>
                  <div className="hidden lg:block w-24 shrink-0 text-right text-sm font-medium">{money(inv.aum_usd)}</div>
                  <div className="hidden lg:flex w-16 shrink-0 items-center justify-end gap-1 text-sm text-muted-foreground"><Briefcase className="w-3.5 h-3.5" />{inv.deals_backed}</div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((inv) => (
              <Link key={inv.id} to={`/investors/${inv.id}`} className="block group">
                <Card className="h-full border-border transition-all hover:border-primary/40 hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar inv={inv} cls="w-12 h-12" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{inv.name}</h3>
                          {inv.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{inv.firm}{inv.region ? ` · ${inv.region}` : ""}</p>
                        {inv.firm_type && <Badge variant="outline" className="border-primary/40 text-primary text-[10px] px-1.5 py-0 mt-1">{inv.firm_type}</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-3 min-h-[2.5rem]">{inv.thesis}</p>
                    <div className="mt-3"><SectorTags inv={inv} /></div>
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />{checkRange(inv)}</span>
                      {inv.aum_usd != null && <span className="flex items-center gap-1"><Landmark className="w-3.5 h-3.5" />{money(inv.aum_usd)}</span>}
                      <span className="flex items-center gap-1 ml-auto"><Briefcase className="w-3.5 h-3.5" />{inv.deals_backed}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
