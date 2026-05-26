import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Live Deals</h1>
            <p className="text-muted-foreground">Curated opportunities from verified founders.</p>
          </div>
          <Button asChild variant="premium"><Link to="/deals/new"><Plus className="w-4 h-4 mr-2" /> Post a deal</Link></Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : deals.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No deals yet. Be the first to post.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deals.map((d) => (
              <Link key={d.id} to={`/deals/${d.id}`} className="block group">
                <Card className="h-full border-border/60 hover:border-primary/50 transition-colors">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      {d.stage && <Badge variant="outline" className="border-primary/40 text-primary">{d.stage}</Badge>}
                      {d.category && <Badge variant="secondary">{d.category}</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{d.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{d.pitch}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/40">
                      {d.funding_required && <span>₹{Number(d.funding_required).toLocaleString("en-IN")}</span>}
                      {d.expected_return && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {d.expected_return}</span>}
                      <span className="flex items-center gap-1 ml-auto"><Users className="w-3 h-3" /> {counts[d.id] || 0}</span>
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
