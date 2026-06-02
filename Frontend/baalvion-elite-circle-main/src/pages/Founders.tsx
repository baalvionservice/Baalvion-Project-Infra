import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Layers, Globe, Rocket, ChevronRight, Building2 } from "lucide-react";
import { useActivityTracking } from "@/hooks/useActivityTracking";

export type Founder = {
  id: string; username: string; full_name: string | null; avatar_url: string | null;
  company_name: string | null; company_about: string | null; idea: string | null;
  region: string | null; sector: string | null; stage: string | null;
};

const initials = (n = "?") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const StatChip = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
    <div><div className="text-xl font-bold leading-none">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
  </div>
);

export default function Founders() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [sector, setSector] = useState("all");
  const { trackPageView } = useActivityTracking();

  useEffect(() => { trackPageView("Founders"); }, [trackPageView]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("id, username, full_name, avatar_url, company_name, company_about, idea, region, sector, stage").eq("role", "founder");
      // Show founders who have set up a company profile.
      setFounders(((data as Founder[]) || []).filter((f) => f.company_name));
      setLoading(false);
    })();
  }, []);

  const regions = useMemo(() => ["all", ...[...new Set(founders.map((f) => f.region).filter(Boolean) as string[])].sort()], [founders]);
  const sectors = useMemo(() => ["all", ...[...new Set(founders.map((f) => f.sector).filter(Boolean) as string[])].sort()], [founders]);

  const filtered = useMemo(() => founders.filter((f) => {
    const q = search.toLowerCase();
    const matchQ = !q || (f.company_name || "").toLowerCase().includes(q) || (f.full_name || "").toLowerCase().includes(q) || (f.idea || "").toLowerCase().includes(q);
    return matchQ && (region === "all" || f.region === region) && (sector === "all" || f.sector === sector);
  }), [founders, search, region, sector]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 mb-6">
          <Badge className="mb-3 bg-primary/15 text-primary hover:bg-primary/15">Founder Network</Badge>
          <h1 className="text-4xl font-bold tracking-tight">Founders</h1>
          <p className="text-muted-foreground text-lg mt-1">Discover and connect with founders building across sectors and regions.</p>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <StatChip icon={Users} label="Founders" value={founders.length} />
            <StatChip icon={Layers} label="Sectors" value={sectors.length - 1} />
            <StatChip icon={Globe} label="Regions" value={regions.length - 1} />
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search founders, companies, ideas…" className="pl-12 h-12 text-base" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {regions.map((r) => <button key={r} onClick={() => setRegion(r)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${region === r ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}>{r === "all" ? "All regions" : r}</button>)}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {sectors.map((s) => <button key={s} onClick={() => setSector(s)} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${sector === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}>{s === "all" ? "All sectors" : s}</button>)}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No founders match your filters.</CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((f) => (
              <Link key={f.id} to={`/founders/${f.id}`} className="block group">
                <Card className="h-full border-border transition-all hover:border-primary/40 hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {f.avatar_url
                        ? <img src={f.avatar_url} alt={f.full_name || ""} loading="lazy" decoding="async" className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 shrink-0" />
                        : <div className="w-14 h-14 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0">{initials(f.full_name || f.username)}</div>}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">{f.full_name || f.username}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 truncate"><Building2 className="w-3.5 h-3.5" />{f.company_name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {f.sector && <Badge variant="secondary">{f.sector}</Badge>}
                          {f.stage && <Badge variant="outline" className="border-primary/40 text-primary">{f.stage}</Badge>}
                          {f.region && <Badge variant="outline" className="text-muted-foreground"><Globe className="w-3 h-3 mr-1" />{f.region}</Badge>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-3">{f.company_about || f.idea}</p>
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
