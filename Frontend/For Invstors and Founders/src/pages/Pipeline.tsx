import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bookmark, KanbanSquare } from "lucide-react";

const STAGES = ["sourced", "reviewing", "meeting", "diligence", "term_sheet", "passed"];
const LABEL: Record<string, string> = { sourced: "Sourced", reviewing: "Reviewing", meeting: "Meeting", diligence: "Diligence", term_sheet: "Term Sheet", passed: "Passed" };
const initials = (n = "?") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export default function Pipeline() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("investor_pipeline" as any).select("id, stage, note, founder:profiles!investor_pipeline_founder_id_fkey(id, full_name, company_name, sector, avatar_url, profile_score)"),
      supabase.from("saved_startups" as any).select("id, founder:profiles!saved_startups_founder_id_fkey(id, full_name, company_name, sector)"),
    ]);
    setRows((p as any[]) || []);
    setSaved((s as any[]) || []);
    setLoading(false);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const move = async (id: string, stage: string) => {
    setRows((r) => r.map((x) => x.id === id ? { ...x, stage } : x));
    await supabase.from("investor_pipeline" as any).update({ stage }).eq("id", id);
    toast.success(`Moved to ${LABEL[stage]}`);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><KanbanSquare className="w-7 h-7 text-primary" />Pipeline</h1>
          <p className="text-muted-foreground mt-1">Your investment pipeline across {rows.length} startups.</p>
        </div>

        {loading ? <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">{STAGES.map((s) => <Skeleton key={s} className="h-64 rounded-xl" />)}</div> : (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
            {STAGES.map((stage) => {
              const items = rows.filter((r) => r.stage === stage);
              return (
                <div key={stage} className="min-w-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{LABEL[stage]}</span>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[100px] rounded-xl bg-secondary/30 p-2">
                    {items.map((r) => (
                      <Card key={r.id} className="border-border">
                        <CardContent className="p-3">
                          <Link to={`/founders/${r.founder?.id}`} className="block">
                            <div className="flex items-center gap-2">
                              {r.founder?.avatar_url ? <img src={r.founder.avatar_url} alt={r.founder?.company_name || r.founder?.full_name || "Founder"} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center">{initials(r.founder?.company_name || r.founder?.full_name)}</div>}
                              <div className="min-w-0"><div className="text-sm font-medium truncate hover:text-primary">{r.founder?.company_name || r.founder?.full_name}</div><div className="text-[11px] text-muted-foreground truncate">{r.founder?.sector}</div></div>
                            </div>
                          </Link>
                          {r.note && <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{r.note}</p>}
                          <Select value={r.stage} onValueChange={(v) => move(r.id, v)}>
                            <SelectTrigger className="h-7 text-xs mt-2"><SelectValue /></SelectTrigger>
                            <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s} className="text-xs">{LABEL[s]}</SelectItem>)}</SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Bookmark className="w-5 h-5 text-primary" />Watchlist</h2>
        {saved.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No saved startups yet. <Link to="/founders" className="text-primary hover:underline">Browse founders →</Link></CardContent></Card> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {saved.map((s) => (
              <Link key={s.id} to={`/founders/${s.founder?.id}`}>
                <Card className="border-border hover:border-primary/40 transition-colors"><CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">{initials(s.founder?.company_name || s.founder?.full_name)}</div>
                  <div className="min-w-0"><div className="font-medium truncate">{s.founder?.company_name || s.founder?.full_name}</div><Badge variant="secondary" className="text-[10px] mt-0.5">{s.founder?.sector}</Badge></div>
                </CardContent></Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
