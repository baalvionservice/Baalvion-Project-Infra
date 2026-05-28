import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, TrendingUp, Briefcase, Banknote, Flame, ChevronRight } from "lucide-react";

const money = (n: number | null) => {
  if (n == null) return "—";
  if (n >= 1e6) return `$${n / 1e6 % 1 === 0 ? n / 1e6 : (n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${n}`;
};

const StatChip = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
    <div><div className="text-xl font-bold leading-none">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
  </div>
);

export default function Deals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("deals" as any) as any)
        .select("*").eq("status", "active").order("created_at", { ascending: false });
      setDeals(data || []);
      const { data: ints } = await (supabase.from("deal_interests" as any) as any).select("deal_id");
      const c: Record<string, number> = {};
      (ints || []).forEach((i: any) => { c[i.deal_id] = (c[i.deal_id] || 0) + 1; });
      setCounts(c);
      setLoading(false);
    })();
  }, []);

  const totalRaise = deals.reduce((s, d) => s + (Number(d.funding_required) || 0), 0);
  const totalInterest = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Badge className="mb-3 bg-primary/15 text-primary hover:bg-primary/15">Live Deal Flow</Badge>
              <h1 className="text-4xl font-bold tracking-tight">Deals</h1>
              <p className="text-muted-foreground text-lg mt-1">Curated opportunities from verified founders.</p>
            </div>
            <Button asChild variant="premium" size="lg"><Link to="/deals/new"><Plus className="w-5 h-5 mr-2" />Post a deal</Link></Button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <StatChip icon={Briefcase} label="Open deals" value={deals.length} />
            <StatChip icon={Banknote} label="Total raising" value={money(totalRaise)} />
            <StatChip icon={Users} label="Investor interests" value={totalInterest} />
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
        ) : deals.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No deals yet. Be the first to post.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deals.map((d) => {
              const hot = (counts[d.id] || 0) >= 1;
              return (
                <Link key={d.id} to={`/deals/${d.id}`} className="block group">
                  <Card className="h-full border-border transition-all hover:border-primary/40 hover:shadow-lg">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-3">
                        {d.stage && <Badge variant="outline" className="border-primary/40 text-primary">{d.stage}</Badge>}
                        {d.category && <Badge variant="secondary">{d.category}</Badge>}
                        {hot && <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 ml-auto"><Flame className="w-3 h-3 mr-1" />Hot</Badge>}
                      </div>
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{d.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{d.pitch}</p>
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/50 text-sm">
                        <div><div className="font-semibold text-primary">{money(Number(d.funding_required))}</div><div className="text-xs text-muted-foreground">Raising</div></div>
                        <div><div className="font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{d.expected_return || "—"}</div><div className="text-xs text-muted-foreground">Target</div></div>
                        <div><div className="font-semibold flex items-center gap-1"><Users className="w-3.5 h-3.5" />{counts[d.id] || 0}</div><div className="text-xs text-muted-foreground">Interested</div></div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
