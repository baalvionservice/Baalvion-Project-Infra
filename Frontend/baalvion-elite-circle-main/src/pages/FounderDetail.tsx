import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Globe, Rocket, Mail, Phone, Lightbulb, Mic, Video, Lock,
  UserPlus, Clock, Check, X, CheckCircle2, Pencil, BadgeCheck, TrendingUp, Users, Sparkles, Bookmark, ShieldCheck,
} from "lucide-react";

const initials = (n = "?") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const money = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${n}`;
const PIPE = ["none", "sourced", "reviewing", "meeting", "diligence", "term_sheet", "passed"];

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 120, h = 32, min = Math.min(...points), max = Math.max(...points), rng = max - min || 1;
  const d = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - min) / rng) * h}`).join(" ");
  const up = points[points.length - 1] >= points[0];
  return <svg width={w} height={h}><polyline points={d} fill="none" stroke={up ? "hsl(150 70% 45%)" : "hsl(0 70% 55%)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function FounderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [f, setF] = useState<any>(null);
  const [conn, setConn] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [traction, setTraction] = useState<any[]>([]);
  const [verifs, setVerifs] = useState<string[]>([]);
  const [saved, setSaved] = useState<any>(null);
  const [pipe, setPipe] = useState<string>("none");
  const [ai, setAi] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMe = user?.id === id;

  const loadConn = useCallback(async () => {
    if (!user || !id || isMe) return;
    const { data } = await supabase.from("member_connections" as any).select("*");
    setConn(((data as any[]) || []).find((c) => (c.from_user_id === id && c.to_user_id === user.id) || (c.from_user_id === user.id && c.to_user_id === id)) || null);
    const { data: s } = await supabase.from("saved_startups" as any).select("*").eq("founder_id", id);
    setSaved((s as any[])?.[0] || null);
    const { data: pp } = await supabase.from("investor_pipeline" as any).select("*").eq("founder_id", id);
    setPipe((pp as any[])?.[0]?.stage || "none");
  }, [user, id, isMe]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (!data) { toast.error("Founder not found"); navigate("/founders"); return; }
      setF(data);
      const [{ data: t }, { data: m }, { data: v }] = await Promise.all([
        supabase.from("company_members" as any).select("*").eq("founder_id", id),
        supabase.from("traction_metrics" as any).select("*").eq("founder_id", id).order("as_of", { ascending: true }),
        supabase.from("verifications" as any).select("kind, status").eq("user_id", id),
      ]);
      setTeam((t as any[]) || []);
      setTraction((m as any[]) || []);
      setVerifs(((v as any[]) || []).filter((x) => x.status === "verified").map((x) => x.kind));
      setLoading(false);
    })();
  }, [id, navigate]);

  useEffect(() => { loadConn(); }, [loadConn]);

  const connect = async () => {
    const { error } = await supabase.from("member_connections" as any).insert({ to_user_id: id, from_user_id: user!.id });
    if (error) return toast.error(error.message || "Failed");
    toast.success("Connection request sent"); loadConn();
  };
  const respond = async (status: string) => { await supabase.from("member_connections" as any).update({ status }).eq("id", conn.id); toast.success(status === "accepted" ? "Connected!" : "Declined"); loadConn(); };
  const toggleSave = async () => {
    if (saved) { await supabase.from("saved_startups" as any).delete().eq("id", saved.id); setSaved(null); toast.success("Removed from watchlist"); }
    else { const { data } = await supabase.from("saved_startups" as any).insert({ founder_id: id, investor_user_id: user!.id }).select().single(); setSaved(data); toast.success("Saved to watchlist"); }
  };
  const setPipeline = async (stage: string) => {
    setPipe(stage);
    if (stage === "none") return;
    const { data: existing } = await supabase.from("investor_pipeline" as any).select("id").eq("founder_id", id);
    if ((existing as any[])?.[0]) await supabase.from("investor_pipeline" as any).update({ stage }).eq("id", (existing as any[])[0].id);
    else await supabase.from("investor_pipeline" as any).insert({ founder_id: id, investor_user_id: user!.id, stage });
    toast.success(`Pipeline → ${stage.replace("_", " ")}`);
  };
  const runAi = async () => { setAiLoading(true); const { data } = await supabase.functions.invoke("ai-analyze", { body: { founder_id: id } }); setAi(data); setAiLoading(false); };

  if (loading) return <MainLayout><div className="container mx-auto px-4 py-8 max-w-4xl"><Skeleton className="h-64 rounded-2xl" /></div></MainLayout>;
  if (!f) return null;

  const accepted = conn?.status === "accepted";
  const theyRequestedMe = conn?.status === "pending" && conn.to_user_id === user?.id;
  const iRequested = conn?.status === "pending" && conn.from_user_id === user?.id;
  const interview: { question: string; answer: string }[] = Array.isArray(f.interview) ? f.interview : [];
  const mrr = traction.filter((m) => m.metric_key === "mrr");
  const latest = (k: string) => { const r = traction.filter((m) => m.metric_key === k); return r[r.length - 1]; };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/founders")}><ArrowLeft className="w-4 h-4 mr-1" />All founders</Button>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {f.avatar_url ? <img src={f.avatar_url} alt={f.full_name} loading="lazy" decoding="async" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-primary/30" />
              : <div className="w-24 h-24 rounded-2xl bg-primary/15 text-primary text-2xl font-bold flex items-center justify-center">{initials(f.full_name || f.username)}</div>}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold">{f.full_name || f.username}</h1>
                {verifs.length > 0 && <BadgeCheck className="w-5 h-5 text-primary" />}
              </div>
              {f.company_name && <p className="text-lg text-muted-foreground flex items-center gap-2 mt-1"><Building2 className="w-4 h-4" />{f.company_name}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {f.sector && <Badge variant="secondary">{f.sector}</Badge>}
                {f.stage && <Badge variant="outline" className="border-primary/40 text-primary"><Rocket className="w-3 h-3 mr-1" />{f.stage}</Badge>}
                {f.region && <Badge variant="outline" className="text-muted-foreground"><Globe className="w-3 h-3 mr-1" />{f.region}</Badge>}
                {f.raising && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Raising {f.round_type}{f.raise_amount ? ` · ${money(Number(f.raise_amount))}` : ""}</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-5 mt-4">
                <span className="flex items-center gap-2"><span className="text-2xl font-bold text-primary leading-none">{f.profile_score ?? 0}</span><span className="text-[11px] text-muted-foreground leading-tight">profile<br />score</span></span>
                <span className="flex items-center gap-2"><span className="text-2xl font-bold text-primary leading-none">{f.readiness_score ?? 0}</span><span className="text-[11px] text-muted-foreground leading-tight">investor<br />ready</span></span>
                {verifs.length > 0 && <span className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="w-4 h-4 text-primary" />{verifs.join(" · ")}</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {isMe ? <Button variant="premium" asChild><Link to="/profile/edit"><Pencil className="w-4 h-4 mr-2" />Edit profile</Link></Button>
                  : accepted ? <Button variant="outline" className="border-emerald-500/40 text-emerald-400 pointer-events-none"><CheckCircle2 className="w-4 h-4 mr-2" />Connected</Button>
                  : theyRequestedMe ? <><Button variant="premium" onClick={() => respond("accepted")}><Check className="w-4 h-4 mr-2" />Accept</Button><Button variant="outline" onClick={() => respond("declined")}><X className="w-4 h-4 mr-2" />Decline</Button></>
                  : iRequested ? <Button variant="outline" className="pointer-events-none"><Clock className="w-4 h-4 mr-2" />Request sent</Button>
                  : <Button variant="premium" onClick={connect}><UserPlus className="w-4 h-4 mr-2" />Connect</Button>}
                {!isMe && <Button variant="outline" onClick={toggleSave}><Bookmark className={`w-4 h-4 mr-2 ${saved ? "fill-primary text-primary" : ""}`} />{saved ? "Saved" : "Save"}</Button>}
                {!isMe && (
                  <Select value={pipe} onValueChange={setPipeline}>
                    <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Add to pipeline" /></SelectTrigger>
                    <SelectContent>{PIPE.map((s) => <SelectItem key={s} value={s}>{s === "none" ? "Not in pipeline" : s.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        {traction.length > 0 && (
          <Card className="border-border mb-6"><CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Traction</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {mrr.length >= 2 && (
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">MRR {mrr[mrr.length - 1].verified && <BadgeCheck className="w-3 h-3 text-primary" />}</div>
                  <div className="text-2xl font-bold">{money(Number(mrr[mrr.length - 1].value))}</div>
                  <Spark points={mrr.map((m) => Number(m.value))} />
                </div>
              )}
              {["users", "growth", "runway"].map((k) => { const m = latest(k); return m ? (
                <div key={k}><div className="text-xs text-muted-foreground capitalize">{m.label || k}</div><div className="text-2xl font-bold">{Number(m.value).toLocaleString()}{m.unit === "%" ? "%" : ""}</div></div>
              ) : null; })}
            </div>
          </CardContent></Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {f.company_about && <Card className="border-border"><CardContent className="p-6"><h2 className="text-lg font-semibold mb-2">About {f.company_name}</h2><p className="text-muted-foreground leading-relaxed">{f.company_about}</p></CardContent></Card>}
            {f.idea && <Card className="border-border"><CardContent className="p-6"><h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-primary" />The idea</h2><p className="text-muted-foreground leading-relaxed whitespace-pre-line">{f.idea}</p></CardContent></Card>}

            <Card className="border-border"><CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />AI analysis</h2>
                {!ai && <Button variant="outline" size="sm" onClick={runAi} disabled={aiLoading}>{aiLoading ? "Analyzing…" : "Run analysis"}</Button>}
              </div>
              {ai ? (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{ai.summary}</p>
                  <div><p className="font-medium text-emerald-400 mb-1">Strengths</p><ul className="text-muted-foreground space-y-0.5">{(ai.strengths || []).map((s: string, i: number) => <li key={i}>+ {s}</li>)}</ul></div>
                  <div><p className="font-medium text-amber-400 mb-1">Risks / watch-outs</p><ul className="text-muted-foreground space-y-0.5">{(ai.risks || []).map((s: string, i: number) => <li key={i}>– {s}</li>)}</ul></div>
                  <p className="text-[11px] text-muted-foreground">Generated by {ai.source === "ai" ? "AI" : "heuristic analysis"}.</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">Investor-grade brief: strengths, risks, and a summary.</p>}
            </CardContent></Card>

            {interview.length > 0 && (
              <Card className="border-border"><CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Mic className="w-5 h-5 text-primary" />Founder interview</h2>
                <div className="space-y-4">{interview.map((qa, i) => <div key={i}><p className="font-medium">{qa.question}</p><p className="text-muted-foreground text-sm mt-0.5">{qa.answer}</p></div>)}</div>
              </CardContent></Card>
            )}
          </div>

          <div className="space-y-6">
            {f.video_url && <Card className="border-border"><CardContent className="p-4"><h2 className="text-base font-semibold mb-2 flex items-center gap-2"><Video className="w-4 h-4 text-primary" />Pitch video</h2><video src={f.video_url} controls className="w-full rounded-lg" /></CardContent></Card>}

            {team.length > 0 && (
              <Card className="border-border"><CardContent className="p-5">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Team</h2>
                <div className="space-y-3">
                  {team.map((t) => (
                    <div key={t.id} className="flex items-center gap-3">
                      {t.avatar_url ? <img src={t.avatar_url} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">{initials(t.name)}</div>}
                      <div className="min-w-0"><div className="text-sm font-medium truncate">{t.name}</div><div className="text-xs text-muted-foreground truncate">{t.title || t.member_role}</div></div>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            )}

            <Card className="border-border"><CardContent className="p-5">
              <h2 className="text-base font-semibold mb-3">Contact</h2>
              {isMe || accepted ? (
                <div className="space-y-2 text-sm">
                  {f.contact_email && <a href={`mailto:${f.contact_email}`} className="flex items-center gap-2 text-primary hover:underline"><Mail className="w-4 h-4" />{f.contact_email}</a>}
                  {f.contact_phone && <a href={`tel:${f.contact_phone}`} className="flex items-center gap-2 text-primary hover:underline"><Phone className="w-4 h-4" />{f.contact_phone}</a>}
                  {f.website && <a href={f.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe className="w-4 h-4" />Website</a>}
                </div>
              ) : <div className="flex items-start gap-2 text-sm text-muted-foreground"><Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Connect to view contact details.</span></div>}
            </CardContent></Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
