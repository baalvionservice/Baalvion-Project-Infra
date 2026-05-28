import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Apply() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", role: "investor",
    company: "", bio: "", reason: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { navigate("/auth"); return; }
      setUser(u);
      setForm((f) => ({ ...f, email: u.email || "" }));
      const { data } = await (supabase.from("member_applications" as any) as any)
        .select("*").eq("user_id", u.id).maybeSingle();
      setExisting(data);
      setLoading(false);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.reason) { toast.error("Please complete required fields"); return; }
    setSubmitting(true);
    const { data, error } = await (supabase.from("member_applications" as any) as any)
      .insert({ ...form, user_id: user.id }).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setExisting(data);
    toast.success("Application submitted");
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  if (existing) {
    const status = existing.status;
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <Card className="max-w-md w-full border-primary/30">
          <CardContent className="p-8 text-center space-y-4">
            {status === "approved" ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-2xl font-bold">You're in</h1>
                <p className="text-muted-foreground">Welcome to Baalvion Insiders.</p>
                <Button variant="premium" onClick={() => navigate("/dashboard")}>Enter platform</Button>
              </>
            ) : status === "rejected" ? (
              <>
                <h1 className="text-2xl font-bold">Application not approved</h1>
                <p className="text-muted-foreground">{existing.reviewer_note || "Thank you for your interest."}</p>
              </>
            ) : (
              <>
                <Clock className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-2xl font-bold">Under review</h1>
                <p className="text-muted-foreground">Your application is being reviewed by our team. You'll be notified by email.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-background">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
          <h1 className="text-3xl font-bold">Apply to join</h1>
          <p className="text-muted-foreground mt-1">A private network for founders, investors and operators.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <F label="Full name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></F>
              <F label="Email *"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></F>
              <F label="Role *">
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></F>
              <F label="Short bio"><Textarea rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></F>
              <F label="Reason for joining *"><Textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></F>
              <Button type="submit" variant="premium" className="w-full" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const F = ({ label, children }: any) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    {children}
  </div>
);
