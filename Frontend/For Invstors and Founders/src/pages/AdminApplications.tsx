import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AdminApplications() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const admin = (roles || []).some((r: any) => r.role === "admin");
      setIsAdmin(admin);
      if (!admin) { setLoading(false); return; }
      const { data } = await (supabase.from("member_applications" as any) as any)
        .select("*").order("created_at", { ascending: false });
      setApps(data || []);
      setLoading(false);
    })();
  }, []);

  const decide = async (app: any, status: "approved" | "rejected") => {
    const { error } = await (supabase.from("member_applications" as any) as any)
      .update({ status, reviewer_note: notes[app.id] || null })
      .eq("id", app.id);
    if (error) { toast.error(error.message); return; }
    if (status === "approved") {
      // Optionally assign role
      const role = ["founder", "investor", "operator"].includes(app.role) ? "user" : "user";
      await supabase.from("user_roles").upsert({ user_id: app.user_id, role: role as any }, { onConflict: "user_id,role" });
    }
    setApps(apps.map((a) => a.id === app.id ? { ...a, status } : a));
    toast.success(status === "approved" ? "Approved" : "Rejected");
  };

  if (loading) return <MainLayout><div className="p-10">Loading…</div></MainLayout>;
  if (!isAdmin) return <MainLayout><div className="p-10 text-center text-muted-foreground">Admin access required.</div></MainLayout>;

  const filt = (s: string) => apps.filter((a) => a.status === s);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Member Applications</h1>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({filt("pending").length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({filt("approved").length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({filt("rejected").length})</TabsTrigger>
          </TabsList>
          {["pending", "approved", "rejected"].map((s) => (
            <TabsContent key={s} value={s} className="space-y-3 mt-4">
              {filt(s).length === 0 && <p className="text-muted-foreground text-center py-8">No applications.</p>}
              {filt(s).map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{a.full_name}</h3>
                          <Badge variant="outline" className="capitalize">{a.role}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{a.email} · {a.company || "—"} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
                      </div>
                      <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "outline"} className="capitalize">{a.status}</Badge>
                    </div>
                    {a.bio && <p className="text-sm"><span className="text-muted-foreground">Bio: </span>{a.bio}</p>}
                    <p className="text-sm"><span className="text-muted-foreground">Reason: </span>{a.reason}</p>
                    {a.status === "pending" && (
                      <div className="space-y-2 pt-2 border-t">
                        <Textarea placeholder="Optional note (sent on rejection)" value={notes[a.id] || ""}
                          onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" variant="premium" onClick={() => decide(a, "approved")}><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="ghost" onClick={() => decide(a, "rejected")}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                        </div>
                      </div>
                    )}
                    {a.reviewer_note && <p className="text-xs text-muted-foreground italic">Note: {a.reviewer_note}</p>}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
