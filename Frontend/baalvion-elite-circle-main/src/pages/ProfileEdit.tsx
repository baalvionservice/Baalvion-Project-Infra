import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Plus, Trash2, Upload, Building2, User, Lightbulb, Mic, Video, Link2 } from "lucide-react";

const REGIONS = ["North America", "Europe", "Asia", "Middle East", "Africa", "South America", "Oceania"];
const SECTORS = ["Fintech", "AI", "ClimateTech", "SaaS", "Consumer", "HealthTech", "Real Estate", "Energy", "Hardware", "Marketplaces", "Developer Tools", "Other"];
const STAGES = ["Idea", "Pre-Seed", "Seed", "Series A", "Series B", "Growth"];
const IDEA_TARGET = 3000;

type QA = { question: string; answer: string };

const Section = ({ icon: Icon, title, children }: any) => (
  <Card className="border-border"><CardContent className="p-6 space-y-4">
    <h2 className="text-lg font-semibold flex items-center gap-2"><Icon className="w-5 h-5 text-primary" />{title}</h2>
    {children}
  </CardContent></Card>
);

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState<any>({
    full_name: "", username: "", avatar_url: "", bio: "", company_name: "", company_about: "",
    contact_email: "", contact_phone: "", region: "", sector: "", stage: "", idea: "",
    interview: [] as QA[], video_url: "", linkedin_url: "", website: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setF((prev: any) => ({ ...prev, ...data, interview: Array.isArray((data as any).interview) ? (data as any).interview : [] }));
      setLoading(false);
    })();
  }, [user]);

  const set = (k: string, v: any) => setF((prev: any) => ({ ...prev, [k]: v }));
  const wordCount = (f.idea || "").trim() ? (f.idea || "").trim().split(/\s+/).length : 0;

  const setQA = (i: number, k: keyof QA, v: string) => set("interview", f.interview.map((q: QA, idx: number) => idx === i ? { ...q, [k]: v } : q));
  const addQA = () => set("interview", [...f.interview, { question: "", answer: "" }]);
  const removeQA = (i: number) => set("interview", f.interview.filter((_: QA, idx: number) => idx !== i));

  const uploadVideo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { data, error } = await supabase.storage.from("founder-media").upload(path, file);
    setUploading(false);
    if (error) { toast.error("Upload failed: " + error.message); return; }
    const { data: pub } = supabase.storage.from("founder-media").getPublicUrl((data as any).path);
    set("video_url", pub.publicUrl);
    toast.success("Video uploaded");
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      full_name: f.full_name, avatar_url: f.avatar_url || null, bio: f.bio || null,
      company_name: f.company_name || null, company_about: f.company_about || null,
      contact_email: f.contact_email || null, contact_phone: f.contact_phone || null,
      region: f.region || null, sector: f.sector || null, stage: f.stage || null,
      idea: f.idea || null, interview: (f.interview || []).filter((q: QA) => q.question || q.answer),
      video_url: f.video_url || null, linkedin_url: f.linkedin_url || null, website: f.website || null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Could not save: " + error.message); return; }
    toast.success("Profile saved");
    navigate(`/founders/${user.id}`);
  };

  if (loading) return <MainLayout><div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div></MainLayout>;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Edit your founder profile</h1>
            <p className="text-muted-foreground">This is what investors and other founders see.</p>
          </div>
          <Button variant="premium" onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving…" : "Save"}</Button>
        </div>

        <div className="space-y-5">
          <Section icon={User} title="About you">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full name</Label><Input value={f.full_name || ""} onChange={(e) => set("full_name", e.target.value)} /></div>
              <div><Label>Username</Label><Input value={f.username || ""} disabled className="opacity-60" /></div>
            </div>
            <div><Label>Avatar URL</Label><Input value={f.avatar_url || ""} onChange={(e) => set("avatar_url", e.target.value)} placeholder="https://…" /></div>
            <div><Label>Short bio</Label><Textarea rows={2} value={f.bio || ""} onChange={(e) => set("bio", e.target.value)} /></div>
          </Section>

          <Section icon={Building2} title="Company">
            <div><Label>Company name</Label><Input value={f.company_name || ""} onChange={(e) => set("company_name", e.target.value)} placeholder="Acme Inc." /></div>
            <div><Label>What does your company do?</Label><Textarea rows={3} value={f.company_about || ""} onChange={(e) => set("company_about", e.target.value)} /></div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label>Sector</Label>
                <Select value={f.sector || ""} onValueChange={(v) => set("sector", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Region</Label>
                <Select value={f.region || ""} onValueChange={(v) => set("region", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{REGIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Stage</Label>
                <Select value={f.stage || ""} onValueChange={(v) => set("stage", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </Section>

          <Section icon={Link2} title="Contact & links">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Email (Gmail)</Label><Input type="email" value={f.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} placeholder="you@gmail.com" /></div>
              <div><Label>Phone</Label><Input value={f.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+1 …" /></div>
              <div><Label>LinkedIn</Label><Input value={f.linkedin_url || ""} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" /></div>
              <div><Label>Website</Label><Input value={f.website || ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></div>
            </div>
          </Section>

          <Section icon={Lightbulb} title="Your idea">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Describe your idea in depth</Label>
                <span className={`text-xs ${wordCount > IDEA_TARGET ? "text-amber-400" : "text-muted-foreground"}`}>{wordCount} / {IDEA_TARGET} words</span>
              </div>
              <Textarea rows={14} value={f.idea || ""} onChange={(e) => set("idea", e.target.value)} placeholder="Problem, solution, market, traction, why you, what you're raising… (up to ~3000 words)" />
            </div>
          </Section>

          <Section icon={Mic} title="Founder interview">
            <p className="text-sm text-muted-foreground -mt-2">A few questions & answers investors can read.</p>
            {f.interview.map((q: QA, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={q.question} onChange={(e) => setQA(i, "question", e.target.value)} placeholder="Question" />
                  <Button variant="ghost" size="icon" onClick={() => removeQA(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <Textarea rows={2} value={q.answer} onChange={(e) => setQA(i, "answer", e.target.value)} placeholder="Answer" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addQA}><Plus className="w-4 h-4 mr-1" />Add question</Button>
          </Section>

          <Section icon={Video} title="Pitch video">
            <div><Label>Video URL</Label><Input value={f.video_url || ""} onChange={(e) => set("video_url", e.target.value)} placeholder="Paste a link, or upload below" /></div>
            <div className="flex items-center gap-3">
              <input id="vid" type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
              <Button variant="outline" asChild disabled={uploading}><label htmlFor="vid" className="cursor-pointer"><Upload className="w-4 h-4 mr-2" />{uploading ? "Uploading…" : "Upload video"}</label></Button>
              {f.video_url && <video src={f.video_url} controls className="h-24 rounded-lg border border-border" />}
            </div>
          </Section>

          <div className="flex justify-end pb-10">
            <Button variant="premium" size="lg" onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving…" : "Save profile"}</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
