import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle2, Rocket, Wallet, Handshake } from "lucide-react";

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—");
const STATUS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  inactive: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  cancelled: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function AdminMembers() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");
  const [rows, setRows] = useState<any[]>([]);
  const [counts, setCounts] = useState({ founders: 0, requests: 0, connections: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: members }, { data: profiles }, { count: founders }, { count: requests }, { count: connections }] = await Promise.all([
        supabase.from("memberships" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, username, full_name, company_name, region, sector"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "founder"),
        supabase.from("connection_requests" as any).select("id", { count: "exact", head: true }),
        supabase.from("member_connections" as any).select("id", { count: "exact", head: true }),
      ]);
      const pById = new Map(((profiles as any[]) || []).map((p) => [p.id, p]));
      setRows(((members as any[]) || []).map((m) => ({ ...m, profile: pById.get(m.user_id) })));
      setCounts({ founders: founders || 0, requests: requests || 0, connections: connections || 0 });
      setLoading(false);
    })();
  }, [isAdmin]);

  if (user && !isAdmin) return <Navigate to="/dashboard" replace />;

  const activeCount = rows.filter((r) => r.status === "active").length;
  const Stat = ({ icon: Icon, label, value }: any) => (
    <Card className="border-border"><CardContent className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
      <div><div className="text-xl font-bold leading-none">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
    </CardContent></Card>
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Members</h1>
            <p className="text-muted-foreground">Everyone who paid, plus founder & connection activity.</p>
          </div>
          <Link to="/connections" className="text-sm text-primary hover:underline">Intro queue →</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat icon={Wallet} label="Active members" value={activeCount} />
          <Stat icon={Rocket} label="Founders" value={counts.founders} />
          <Stat icon={Handshake} label="Intro requests" value={counts.requests} />
          <Stat icon={Users} label="Member connections" value={counts.connections} />
        </div>

        <Card className="border-border"><CardContent className="p-2 sm:p-4">
          {loading ? <div className="space-y-2 p-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : rows.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-3 px-3 font-medium">Member</th><th className="py-3 px-3 font-medium">Company</th>
                  <th className="py-3 px-3 font-medium">Plan</th><th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-3 font-medium">Amount</th><th className="py-3 px-3 font-medium">Joined</th>
                </tr></thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                      <td className="py-3 px-3 font-medium">{m.profile?.full_name || m.profile?.username || "—"}</td>
                      <td className="py-3 px-3 text-muted-foreground">{m.profile?.company_name || "—"}</td>
                      <td className="py-3 px-3 capitalize">{m.plan}</td>
                      <td className="py-3 px-3"><Badge variant="outline" className={STATUS[m.status] || ""}>{m.status}</Badge></td>
                      <td className="py-3 px-3">{m.amount_usd ? `$${Number(m.amount_usd).toLocaleString()}` : "—"}</td>
                      <td className="py-3 px-3 text-muted-foreground">{fmtDate(m.started_at || m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent></Card>
      </div>
    </MainLayout>
  );
}
