import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function DealManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [deal, setDeal] = useState<any>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: d } = await (supabase.from("deals" as any) as any).select("*").eq("id", id).single();
      if (!d || d.founder_id !== user.id) {
        toast.error("You can only manage your own deals");
        navigate(`/deals/${id}`);
        return;
      }
      setDeal(d);
      const { data: ints } = await (supabase.from("deal_interests" as any) as any)
        .select("*").eq("deal_id", id).order("created_at", { ascending: false });
      setInterests(ints || []);
      const ids = [...new Set((ints || []).map((x: any) => x.investor_id))];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("*").in("id", ids as string[]);
        const m: Record<string, any> = {};
        (profs || []).forEach((p) => (m[p.id] = p));
        setProfiles(m);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const updateStatus = async (interestId: string, status: "approved" | "rejected") => {
    const { error } = await (supabase.from("deal_interests" as any) as any)
      .update({ status }).eq("id", interestId);
    if (error) { toast.error(error.message); return; }
    setInterests(interests.map((i) => i.id === interestId ? { ...i, status } : i));
    toast.success(status === "approved" ? "Connection approved" : "Marked as rejected");
  };

  if (loading) return <MainLayout><div className="p-10">Loading…</div></MainLayout>;
  if (!deal) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/deals/${id}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to deal
        </Button>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{deal.title}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" /> {interests.length} interested investors
          </p>
        </div>

        <div className="space-y-3">
          {interests.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No interest yet.</CardContent></Card>
          )}
          {interests.map((i) => {
            const p = profiles[i.investor_id];
            return (
              <Card key={i.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                    {(p?.full_name || p?.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p?.full_name || p?.username || "Investor"}</p>
                    <p className="text-xs text-muted-foreground">@{p?.username} · {formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}</p>
                    {p?.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{p.bio}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {i.status === "pending" && (
                      <>
                        <Badge variant="outline" className="border-yellow-500/40 text-yellow-400"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
                        <Button size="sm" variant="premium" onClick={() => updateStatus(i.id, "approved")}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(i.id, "rejected")}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {i.status === "approved" && (
                      <Badge className="bg-green-500/15 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>
                    )}
                    {i.status === "rejected" && (
                      <Badge variant="outline" className="border-destructive/40 text-destructive">Rejected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
