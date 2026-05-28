import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Handshake, Clock, CheckCircle2, XCircle, Check, X, Inbox, ArrowRight } from "lucide-react";

type Req = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  investor?: { id: string; name: string; firm: string | null; avatar_url: string | null } | null;
  founder?: { username?: string; full_name?: string | null } | null;
  deal?: { title?: string } | null;
};

const STATUS: Record<string, { cls: string; icon: any; label: string }> = {
  pending: { cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Clock, label: "Pending" },
  accepted: { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2, label: "Accepted" },
  declined: { cls: "bg-rose-500/15 text-rose-400 border-rose-500/30", icon: XCircle, label: "Declined" },
};
const StatusBadge = ({ s }: { s: string }) => {
  const st = STATUS[s] || STATUS.pending; const I = st.icon;
  return <Badge variant="outline" className={st.cls}><I className="w-3 h-3 mr-1" />{st.label}</Badge>;
};
const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const initials = (n = "?") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export default function Connections() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");
  const [mine, setMine] = useState<Req[]>([]);
  const [queue, setQueue] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: m } = await supabase
      .from("connection_requests" as any)
      .select("id, status, message, created_at, investor:investors(id, name, firm, avatar_url), deal:deals(title)")
      .eq("from_user_id", user.id)
      .order("created_at", { ascending: false });
    setMine((m as Req[]) || []);
    if (isAdmin) {
      const { data: q } = await supabase
        .from("connection_requests" as any)
        .select("id, status, message, created_at, investor:investors(id, name, firm), founder:profiles!connection_requests_from_user_id_fkey(username, full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      setQueue((q as Req[]) || []);
    }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, status: "accepted" | "declined") => {
    const { error } = await supabase.from("connection_requests" as any).update({ status }).eq("id", id);
    if (error) { toast.error("Could not update"); return; }
    toast.success(status === "accepted" ? "Intro accepted — the founder has been notified." : "Request declined.");
    load();
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 mb-6">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3"><Handshake className="w-8 h-8 text-primary" />Connections</h1>
          <p className="text-muted-foreground text-lg mt-1">Your investor intro requests and their status.</p>
        </div>

        {/* Admin: pending queue to broker */}
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Inbox className="w-5 h-5 text-primary" />Intro queue <Badge variant="secondary">{queue.length}</Badge></h2>
            {loading ? <Skeleton className="h-24 rounded-xl" /> : queue.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No pending intro requests. 🎉</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {queue.map((r) => (
                  <Card key={r.id} className="border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0">{initials(r.founder?.full_name || r.founder?.username || "?")}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{r.founder?.full_name || r.founder?.username} <span className="text-muted-foreground font-normal">wants an intro to</span> {r.investor?.name}</p>
                          {r.message && <p className="text-sm text-muted-foreground mt-1 italic">“{r.message}”</p>}
                          <p className="text-xs text-muted-foreground mt-1">{fmtDate(r.created_at)}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="premium" onClick={() => decide(r.id, "accepted")}><Check className="w-4 h-4 mr-1" />Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => decide(r.id, "declined")}><X className="w-4 h-4 mr-1" />Decline</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My requests */}
        <h2 className="text-xl font-semibold mb-3">My intro requests <Badge variant="secondary">{mine.length}</Badge></h2>
        {loading ? <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          : mine.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              You haven't requested any intros yet. <Link to="/investors" className="text-primary hover:underline">Browse investors →</Link>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {mine.map((r) => (
                <Card key={r.id} className="border-border hover:border-primary/40 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      {r.investor?.avatar_url
                        ? <img src={r.investor.avatar_url} alt={r.investor.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/20 shrink-0" />
                        : <div className="w-11 h-11 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0">{initials(r.investor?.name)}</div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/investors/${r.investor?.id}`} className="font-semibold hover:text-primary">{r.investor?.name}</Link>
                          <span className="text-sm text-muted-foreground">{r.investor?.firm}</span>
                          <StatusBadge s={r.status} />
                        </div>
                        {r.deal?.title && <p className="text-xs text-muted-foreground mt-1">Re: {r.deal.title}</p>}
                        {r.message && <p className="text-sm text-muted-foreground mt-1 italic">“{r.message}”</p>}
                        {r.status === "accepted" && (
                          <Link to={`/investors/${r.investor?.id}`} className="text-sm text-emerald-400 hover:underline inline-flex items-center gap-1 mt-2">
                            Contact details unlocked — view profile <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{fmtDate(r.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>
    </MainLayout>
  );
}
