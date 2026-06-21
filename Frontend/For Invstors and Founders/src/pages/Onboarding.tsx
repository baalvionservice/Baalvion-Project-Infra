import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, User, Building2, Lightbulb, Target,
  TrendingUp, Users, Banknote, PartyPopper,
} from "lucide-react";

const REGIONS = ["North America", "Europe", "Asia", "Middle East", "Africa", "South America", "Oceania"];
const SECTORS = ["Fintech", "AI", "ClimateTech", "SaaS", "Consumer", "HealthTech", "Real Estate", "Energy", "Hardware", "Marketplaces", "Developer Tools", "Other"];
const STAGES = ["Idea", "Pre-Seed", "Seed", "Series A", "Series B", "Growth"];
const ROUNDS = ["Pre-Seed", "Seed", "Series A", "Series B", "Bridge"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [f, setF] = useState<any>({});
  const [metrics, setMetrics] = useState<{ metric_key: string; value: string; unit: string }[]>([]);
  const [team, setTeam] = useState<{ name: string; title: string; member_role: string }[]>([]);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setF(data);
      setStep((data as any)?.onboarding_step || 0);
      setLoading(false);
    })();
  }, [user]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const saveProfile = useCallback(async (patch: any) => {
    if (!user) return;
    await supabase.from("profiles").update(patch).eq("id", user.id);
  }, [user]);

  const STEPS = [
    { icon: User, title: "Identity", fields: [
      { k: "full_name", label: "Full name", req: true },
      { k: "headline", label: "Headline", placeholder: "Building the underwriting OS for distributed energy", help: "One line — what you build, not your title." },
      { k: "region", label: "Region", type: "select", options: REGIONS },
      { k: "bio", label: "Short bio", type: "area" },
    ] },
    { icon: Building2, title: "Startup", fields: [
      { k: "company_name", label: "Company name", req: true },
      { k: "company_about", label: "What does it do? (one-liner)", req: true, placeholder: "Stablecoin rails for SMBs so cross-border invoices settle at 1%." },
      { k: "sector", label: "Sector", type: "select", options: SECTORS, req: true },
      { k: "stage", label: "Stage", type: "select", options: STAGES, req: true },
      { k: "website", label: "Website", placeholder: "https://…" },
    ] },
    { icon: Target, title: "Problem & Solution", fields: [
      { k: "problem", label: "The problem", type: "area", req: true },
      { k: "solution", label: "Your solution", type: "area", req: true },
      { k: "why_now", label: "Why now?", type: "area", help: "What changed in the last 12 months? This question kills most rounds." },
      { k: "differentiation", label: "Differentiation / moat", type: "area" },
      { k: "market_tam", label: "Market size (TAM)", placeholder: "$40B, growing 18% YoY (source)" },
    ] },
    { icon: Lightbulb, title: "Your idea", fields: [
      { k: "idea", label: "Describe your idea in depth", type: "bigarea", help: "Up to ~3000 words. Problem, solution, market, traction, why you." },
    ] },
    { icon: TrendingUp, title: "Traction", custom: "traction" },
    { icon: Users, title: "Team", custom: "team" },
    { icon: Banknote, title: "Fundraising", custom: "raise" },
    { icon: PartyPopper, title: "Review", custom: "review" },
  ];
  const current = STEPS[step];
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  const next = async () => {
    setSaving(true);
    // Persist the simple fields on this step.
    if (current.fields) {
      const patch: any = { onboarding_step: Math.max(step + 1, f.onboarding_step || 0) };
      current.fields.forEach((fl: any) => { patch[fl.k] = f[fl.k] ?? null; });
      await saveProfile(patch);
    } else {
      await saveProfile({ onboarding_step: Math.max(step + 1, f.onboarding_step || 0) });
    }
    // Step-specific side effects.
    if (current.custom === "traction" && metrics.length) {
      for (const m of metrics.filter((x) => x.metric_key && x.value)) {
        await supabase.from("traction_metrics" as any).insert({ founder_id: user!.id, metric_key: m.metric_key, label: m.metric_key.toUpperCase(), value: Number(m.value), unit: m.unit || null, as_of: new Date().toISOString().slice(0, 10), source: "self" });
      }
      setMetrics([]); toast.success("Metrics saved");
    }
    if (current.custom === "team" && team.length) {
      for (const t of team.filter((x) => x.name)) {
        await supabase.from("company_members" as any).insert({ founder_id: user!.id, name: t.name, title: t.title || null, member_role: t.member_role || "team" });
      }
      setTeam([]); toast.success("Team saved");
    }
    if (current.custom === "raise") await saveProfile({ raising: !!f.raising, round_type: f.round_type || null, raise_amount: f.raise_amount || null, valuation: f.valuation || null, instrument: f.instrument || null, use_of_funds: f.use_of_funds || null });
    setSaving(false);

    if (step === STEPS.length - 1) return;
    if (step === STEPS.length - 2) {
      // Entering Review → compute score.
      await saveProfile({ onboarding_complete: true });
      const { data } = await supabase.functions.invoke("profile-score", { body: {} });
      setResult(data);
    }
    setStep((s) => s + 1);
  };

  if (loading) return <MainLayout><div className="container mx-auto px-4 py-10 max-w-2xl space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-64 rounded-xl" /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium flex items-center gap-2"><current.icon className="w-4 h-4 text-primary" />Step {step + 1} of {STEPS.length} · {current.title}</span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          <div className="hidden sm:flex gap-1 mt-3">
            {STEPS.map((s, i) => (
              <button key={i} onClick={() => i <= (f.onboarding_step || step) && setStep(i)} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`} title={s.title} />
            ))}
          </div>
        </div>

        <Card className="border-border">
          <CardContent className="p-6 space-y-5">
            {/* Generic field steps */}
            {current.fields && (
              <>
                <h1 className="text-2xl font-bold">{current.title}</h1>
                {current.fields.map((fl: any) => (
                  <div key={fl.k} className="space-y-1.5">
                    <Label>{fl.label}{fl.req && <span className="text-primary"> *</span>}</Label>
                    {fl.type === "select" ? (
                      <Select value={f[fl.k] || ""} onValueChange={(v) => set(fl.k, v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{fl.options.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : fl.type === "bigarea" ? (
                      <>
                        <Textarea rows={12} value={f[fl.k] || ""} onChange={(e) => set(fl.k, e.target.value)} placeholder={fl.placeholder} />
                        <p className="text-xs text-muted-foreground">{(f[fl.k] || "").trim() ? (f[fl.k] || "").trim().split(/\s+/).length : 0} words</p>
                      </>
                    ) : fl.type === "area" ? (
                      <Textarea rows={3} value={f[fl.k] || ""} onChange={(e) => set(fl.k, e.target.value)} placeholder={fl.placeholder} />
                    ) : (
                      <Input value={f[fl.k] || ""} onChange={(e) => set(fl.k, e.target.value)} placeholder={fl.placeholder} />
                    )}
                    {fl.help && <p className="text-xs text-muted-foreground">{fl.help}</p>}
                  </div>
                ))}
              </>
            )}

            {/* Traction */}
            {current.custom === "traction" && (
              <>
                <h1 className="text-2xl font-bold">Traction</h1>
                <p className="text-sm text-muted-foreground">Add a few current metrics. The slope matters more than the number.</p>
                {metrics.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Select value={m.metric_key} onValueChange={(v) => setMetrics((arr) => arr.map((x, idx) => idx === i ? { ...x, metric_key: v } : x))}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Metric" /></SelectTrigger>
                      <SelectContent>{["mrr", "arr", "users", "gmv", "growth", "runway"].map((k) => <SelectItem key={k} value={k}>{k.toUpperCase()}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="flex-1" type="number" placeholder="Value" value={m.value} onChange={(e) => setMetrics((arr) => arr.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} />
                    <Input className="w-24" placeholder="$ / % / users" value={m.unit} onChange={(e) => setMetrics((arr) => arr.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} />
                    <Button variant="ghost" size="icon" onClick={() => setMetrics((arr) => arr.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setMetrics((a) => [...a, { metric_key: "mrr", value: "", unit: "$" }])}><Plus className="w-4 h-4 mr-1" />Add metric</Button>
              </>
            )}

            {/* Team */}
            {current.custom === "team" && (
              <>
                <h1 className="text-2xl font-bold">Team</h1>
                <p className="text-sm text-muted-foreground">Add cofounders and key team members.</p>
                {team.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <Input className="flex-1" placeholder="Name" value={t.name} onChange={(e) => setTeam((arr) => arr.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                    <Input className="flex-1" placeholder="Title" value={t.title} onChange={(e) => setTeam((arr) => arr.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} />
                    <Select value={t.member_role} onValueChange={(v) => setTeam((arr) => arr.map((x, idx) => idx === i ? { ...x, member_role: v } : x))}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{["cofounder", "team", "advisor", "contractor"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => setTeam((arr) => arr.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setTeam((a) => [...a, { name: "", title: "", member_role: "cofounder" }])}><Plus className="w-4 h-4 mr-1" />Add member</Button>
              </>
            )}

            {/* Fundraising */}
            {current.custom === "raise" && (
              <>
                <h1 className="text-2xl font-bold">Fundraising</h1>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.raising} onChange={(e) => set("raising", e.target.checked)} /> I'm actively raising</label>
                {f.raising && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Round</Label><Select value={f.round_type || ""} onValueChange={(v) => set("round_type", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{ROUNDS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Amount raising ($)</Label><Input type="number" value={f.raise_amount || ""} onChange={(e) => set("raise_amount", e.target.value)} /></div>
                    <div><Label>Valuation / cap ($)</Label><Input type="number" value={f.valuation || ""} onChange={(e) => set("valuation", e.target.value)} /></div>
                    <div><Label>Instrument</Label><Select value={f.instrument || ""} onValueChange={(v) => set("instrument", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["SAFE", "Priced equity", "Convertible note"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
                    <div className="sm:col-span-2"><Label>Use of funds</Label><Textarea rows={2} value={f.use_of_funds || ""} onChange={(e) => set("use_of_funds", e.target.value)} /></div>
                  </div>
                )}
              </>
            )}

            {/* Review */}
            {current.custom === "review" && (
              <div className="text-center space-y-4">
                <PartyPopper className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-2xl font-bold">Your profile is ready</h1>
                {result ? (
                  <>
                    <div className="flex justify-center gap-8">
                      <div><div className="text-4xl font-bold text-primary">{result.profile_score}</div><div className="text-xs text-muted-foreground">Profile score</div></div>
                      <div><div className="text-4xl font-bold text-primary">{result.readiness_score}</div><div className="text-xs text-muted-foreground">Investor-readiness</div></div>
                    </div>
                    {result.flags?.length > 0 && (
                      <div className="text-left max-w-md mx-auto rounded-lg border border-border p-4">
                        <p className="text-sm font-medium mb-2">To strengthen your profile:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">{result.flags.map((fl: string, i: number) => <li key={i}>• {fl}</li>)}</ul>
                      </div>
                    )}
                  </>
                ) : <Skeleton className="h-20 w-48 mx-auto" />}
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="premium" onClick={() => navigate(`/founders/${user?.id}`)}>View my profile</Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
                </div>
              </div>
            )}

            {/* Nav */}
            {current.custom !== "review" && (
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                <Button variant="premium" onClick={next} disabled={saving}>{saving ? "Saving…" : step === STEPS.length - 2 ? "Finish" : "Next"}<ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
