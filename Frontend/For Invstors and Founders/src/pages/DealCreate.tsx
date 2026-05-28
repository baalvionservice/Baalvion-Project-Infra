import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DealCreate() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", pitch: "", description: "", problem: "", solution: "",
    business_model: "", funding_required: "", expected_return: "",
    stage: "Seed", category: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/auth"); else setUser(data.user);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.pitch) { toast.error("Title and pitch are required"); return; }
    setSubmitting(true);
    const payload = {
      ...form,
      founder_id: user.id,
      funding_required: form.funding_required ? Number(form.funding_required) : null,
    };
    const { data, error } = await (supabase.from("deals" as any) as any).insert(payload).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deal posted");
    navigate(`/deals/${data.id}`);
  };

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader><CardTitle>Post a deal</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Title"><Input value={form.title} onChange={set("title")} required /></Field>
              <Field label="Short pitch"><Input value={form.pitch} onChange={set("pitch")} placeholder="One-line summary" required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Funding required (₹)"><Input type="number" value={form.funding_required} onChange={set("funding_required")} /></Field>
                <Field label="Expected return"><Input value={form.expected_return} onChange={set("expected_return")} placeholder="3x in 24 months" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stage"><Input value={form.stage} onChange={set("stage")} /></Field>
                <Field label="Category"><Input value={form.category} onChange={set("category")} placeholder="Fintech, D2C…" /></Field>
              </div>
              <Field label="Overview"><Textarea rows={3} value={form.description} onChange={set("description")} /></Field>
              <Field label="Problem"><Textarea rows={2} value={form.problem} onChange={set("problem")} /></Field>
              <Field label="Solution"><Textarea rows={2} value={form.solution} onChange={set("solution")} /></Field>
              <Field label="Business model"><Textarea rows={2} value={form.business_model} onChange={set("business_model")} /></Field>
              <Button type="submit" variant="premium" className="w-full" disabled={submitting}>
                {submitting ? "Posting…" : "Post deal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

const Field = ({ label, children }: any) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    {children}
  </div>
);
