import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft, BadgeCheck, MapPin, Globe, Linkedin, Twitter, Instagram, Facebook, Wallet, Briefcase, Mail, Phone, Building2, Landmark, ExternalLink, TrendingUp, Newspaper, Users, Link2, ShieldCheck,
  Lock, Clock, CheckCircle2, XCircle, Send,
} from "lucide-react";
import { Investor, money, checkRange } from "./Investors";

type Social = { id: string; platform: string; url: string; handle: string | null; followers: number | null; source: string | null };
type Investment = { id: string; target_company: string; round: string | null; amount_usd: number | null; invested_on: string | null; source_url: string | null; source_name: string | null };
type News = { id: string; url: string | null; headline: string; summary: string | null; source: string | null; sentiment: string | null; published_at: string | null };

const initials = (n = "?") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const PLATFORM_ICON: Record<string, any> = { twitter: Twitter, linkedin: Linkedin, instagram: Instagram, facebook: Facebook, website: Globe, angellist: Link2 };
const SENTIMENT: Record<string, string> = {
  positive: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  neutral: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  negative: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");
const fmtFollowers = (n: number | null) => (n == null ? null : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

export default function InvestorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inv, setInv] = useState<Investor | null>(null);
  const [socials, setSocials] = useState<Social[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  // founder -> investor intro request
  const [myRequest, setMyRequest] = useState<{ id: string; status: string } | null>(null);
  const [myDeals, setMyDeals] = useState<{ id: string; title: string }[]>([]);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [reqMsg, setReqMsg] = useState("");
  const [reqDeal, setReqDeal] = useState("none");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("investors" as any).select("*").eq("id", id).maybeSingle();
        if (!data) { toast.error("Investor not found"); navigate("/investors"); return; }
        setInv(data as Investor);
        const [{ data: s }, { data: iv }, { data: n }] = await Promise.all([
          supabase.from("investor_socials" as any).select("*").eq("investor_id", id),
          supabase.from("investments" as any).select("*").eq("investor_id", id).order("invested_on", { ascending: false }),
          supabase.from("investor_news" as any).select("*").eq("investor_id", id).order("published_at", { ascending: false }),
        ]);
        setSocials((s as Social[]) || []);
        setInvestments((iv as Investment[]) || []);
        setNews((n as News[]) || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id, navigate]);

  // Load the current user's existing request for this investor + their deals.
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data: req } = await supabase.from("connection_requests" as any).select("id, status").eq("investor_id", id).maybeSingle();
      setMyRequest((req as any) || null);
      const { data: deals } = await supabase.from("deals" as any).select("id, title").eq("founder_id", user.id);
      setMyDeals((deals as any) || []);
    })();
  }, [user, id]);

  const submitRequest = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("connection_requests" as any).insert({
      investor_id: id, from_user_id: user.id, message: reqMsg || null, deal_id: reqDeal !== "none" ? reqDeal : null,
    }).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message || "Could not send request"); return; }
    setMyRequest(data as any);
    setDlgOpen(false);
    toast.success(`Intro request sent to ${inv?.name}. Our team will broker the connection.`);
  };

  if (loading) return <MainLayout><div className="container mx-auto px-4 py-8 max-w-5xl"><Skeleton className="h-64 w-full rounded-2xl" /></div></MainLayout>;
  if (!inv) return null;

  const totalInvested = investments.reduce((s, i) => s + (Number(i.amount_usd) || 0), 0);

  const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <Card className="border-border"><CardContent className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
      <div className="min-w-0"><div className="font-semibold leading-tight truncate">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
    </CardContent></Card>
  );
  const ContactRow = ({ icon: Icon, label, value, href }: { icon: any; label: string; value: string | null; href?: string }) => {
    if (!value) return null;
    const inner = <span className="truncate">{value}</span>;
    return (
      <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
        {href ? <a href={href} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate">{value}</a> : <span className="text-sm truncate">{inner}</span>}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/investors")}><ArrowLeft className="w-4 h-4 mr-1" />All investors</Button>

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {inv.avatar_url
              ? <img src={inv.avatar_url} alt={inv.name} className="w-24 h-24 rounded-2xl object-cover ring-2 ring-primary/30" />
              : <div className="w-24 h-24 rounded-2xl bg-primary/15 text-primary text-2xl font-bold flex items-center justify-center">{initials(inv.name)}</div>}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold">{inv.name}</h1>
                {inv.is_verified && <BadgeCheck className="w-6 h-6 text-primary" />}
                {inv.firm_type && <Badge variant="outline" className="border-primary/40 text-primary">{inv.firm_type}</Badge>}
              </div>
              <p className="text-lg text-muted-foreground flex items-center gap-2 mt-1"><Building2 className="w-4 h-4" />{inv.title}{inv.firm ? ` · ${inv.firm}` : ""}</p>
              <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {inv.headquarters && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{inv.headquarters}</span>}
                {inv.region && <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{inv.region}</span>}
                {inv.enrichment_confidence && <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" />{inv.enrichment_confidence} confidence</span>}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {myRequest ? (
                  myRequest.status === "accepted" ? (
                    <Button variant="outline" className="border-emerald-500/40 text-emerald-400 pointer-events-none"><CheckCircle2 className="w-4 h-4 mr-2" />Intro accepted</Button>
                  ) : myRequest.status === "declined" ? (
                    <Button variant="outline" className="border-rose-500/40 text-rose-400 pointer-events-none"><XCircle className="w-4 h-4 mr-2" />Request declined</Button>
                  ) : (
                    <Button variant="outline" className="pointer-events-none"><Clock className="w-4 h-4 mr-2" />Intro requested · pending</Button>
                  )
                ) : (
                  <Button variant="premium" onClick={() => setDlgOpen(true)}><Mail className="w-4 h-4 mr-2" />Request intro</Button>
                )}
                {inv.website && <Button variant="outline" asChild><a href={inv.website} target="_blank" rel="noreferrer"><Globe className="w-4 h-4 mr-2" />Website</a></Button>}
                {inv.linkedin_url && <Button variant="outline" asChild><a href={inv.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="w-4 h-4 mr-2" />LinkedIn</a></Button>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat icon={Landmark} label="Assets under mgmt" value={money(inv.aum_usd)} />
          <Stat icon={Wallet} label="Typical check" value={checkRange(inv)} />
          <Stat icon={Briefcase} label="Deals backed" value={String(inv.deals_backed)} />
          <Stat icon={TrendingUp} label="Tracked investments" value={String(investments.length)} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-xl mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="investments">Investments <span className="ml-1 text-xs opacity-60">{investments.length}</span></TabsTrigger>
            <TabsTrigger value="news">News <span className="ml-1 text-xs opacity-60">{news.length}</span></TabsTrigger>
            <TabsTrigger value="social">Social <span className="ml-1 text-xs opacity-60">{socials.length}</span></TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border"><CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-2">Investment thesis</h2>
                  <p className="text-muted-foreground leading-relaxed">{inv.thesis}</p>
                </CardContent></Card>
                <div className="grid sm:grid-cols-2 gap-6">
                  <Card className="border-border"><CardContent className="p-6">
                    <h2 className="text-base font-semibold mb-3">Focus sectors</h2>
                    <div className="flex flex-wrap gap-2">{(inv.focus_sectors || []).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
                    <h2 className="text-base font-semibold mb-3 mt-5">Stages</h2>
                    <div className="flex flex-wrap gap-2">{(inv.stages || []).map((s) => <Badge key={s} variant="outline" className="border-primary/40 text-primary">{s}</Badge>)}</div>
                  </CardContent></Card>
                  <Card className="border-border"><CardContent className="p-6">
                    <h2 className="text-base font-semibold mb-3">Notable portfolio</h2>
                    <div className="flex flex-wrap gap-2">
                      {(inv.portfolio || []).length === 0 ? <span className="text-sm text-muted-foreground">Not disclosed</span>
                        : (inv.portfolio || []).map((p) => <span key={p} className="px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium">{p}</span>)}
                    </div>
                  </CardContent></Card>
                </div>
              </div>
              {/* Contact card */}
              <div>
                <Card className="border-border"><CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" />Contact & links</h2>
                  {myRequest?.status === "accepted" ? (
                    <>
                      <ContactRow icon={Mail} label="Email" value={inv.email} href={inv.email ? `mailto:${inv.email}` : undefined} />
                      <ContactRow icon={Phone} label="Phone" value={inv.phone} href={inv.phone ? `tel:${inv.phone.replace(/[^0-9+]/g, "")}` : undefined} />
                    </>
                  ) : (
                    <button
                      onClick={() => !myRequest && setDlgOpen(true)}
                      className="w-full flex items-center gap-2 py-3 px-3 my-2 rounded-lg bg-secondary/50 border border-dashed border-border text-sm text-left text-muted-foreground hover:border-primary/40 transition-colors"
                    >
                      <Lock className="w-4 h-4 shrink-0 text-primary" />
                      <span>{myRequest ? "Direct email & phone unlock once your intro is accepted." : "Request an intro to unlock direct email & phone."}</span>
                    </button>
                  )}
                  <ContactRow icon={Globe} label="Website" value={inv.website} href={inv.website || undefined} />
                  <ContactRow icon={MapPin} label="Location" value={inv.location} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {socials.map((s) => {
                      const Icon = PLATFORM_ICON[s.platform] || Link2;
                      return <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors" title={s.handle || s.platform}><Icon className="w-4 h-4" /></a>;
                    })}
                  </div>
                </CardContent></Card>
              </div>
            </div>
          </TabsContent>

          {/* Investments */}
          <TabsContent value="investments" className="mt-0">
            <Card className="border-border"><CardContent className="p-2 sm:p-4">
              {investments.length === 0 ? <p className="p-6 text-center text-muted-foreground">No tracked investments yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-3 px-3 font-medium">Company</th><th className="py-3 px-3 font-medium">Round</th>
                      <th className="py-3 px-3 font-medium">Amount</th><th className="py-3 px-3 font-medium">Date</th><th className="py-3 px-3 font-medium">Source</th>
                    </tr></thead>
                    <tbody>
                      {investments.map((iv) => (
                        <tr key={iv.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                          <td className="py-3 px-3 font-medium">{iv.target_company}</td>
                          <td className="py-3 px-3"><Badge variant="outline" className="border-primary/40 text-primary">{iv.round || "—"}</Badge></td>
                          <td className="py-3 px-3 font-semibold text-primary">{money(iv.amount_usd)}</td>
                          <td className="py-3 px-3 text-muted-foreground">{fmtDate(iv.invested_on)}</td>
                          <td className="py-3 px-3">{iv.source_url ? <a href={iv.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">{iv.source_name}<ExternalLink className="w-3 h-3" /></a> : <span className="text-muted-foreground">{iv.source_name || "—"}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {investments.length > 0 && (
                <div className="flex justify-end gap-6 px-3 py-3 text-sm border-t border-border mt-1">
                  <span className="text-muted-foreground">Total tracked: <span className="font-semibold text-foreground">{money(totalInvested)}</span></span>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* News */}
          <TabsContent value="news" className="mt-0 space-y-3">
            {news.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">No recent news.</CardContent></Card>
              : news.map((n) => (
                <Card key={n.id} className="border-border hover:border-primary/40 transition-colors"><CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0"><Newspaper className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">{n.source}</span>
                        <span className="text-xs text-muted-foreground">· {fmtDate(n.published_at)}</span>
                        {n.sentiment && <Badge variant="outline" className={`text-[10px] ${SENTIMENT[n.sentiment] || ""}`}>{n.sentiment}</Badge>}
                      </div>
                      <h3 className="font-semibold leading-snug">{n.url ? <a href={n.url} target="_blank" rel="noreferrer" className="hover:text-primary">{n.headline}</a> : n.headline}</h3>
                      {n.summary && <p className="text-sm text-muted-foreground mt-1">{n.summary}</p>}
                    </div>
                  </div>
                </CardContent></Card>
              ))}
          </TabsContent>

          {/* Social */}
          <TabsContent value="social" className="mt-0">
            <div className="grid sm:grid-cols-2 gap-3">
              {socials.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">No social profiles found.</CardContent></Card>
                : socials.map((s) => {
                  const Icon = PLATFORM_ICON[s.platform] || Link2;
                  return (
                    <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
                      <Card className="border-border hover:border-primary/40 transition-colors"><CardContent className="p-4 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium capitalize">{s.platform}</div>
                          <div className="text-sm text-muted-foreground truncate">{s.handle}</div>
                        </div>
                        {fmtFollowers(s.followers) && <div className="text-right"><div className="font-semibold flex items-center gap-1"><Users className="w-3.5 h-3.5" />{fmtFollowers(s.followers)}</div><div className="text-[10px] text-muted-foreground">followers</div></div>}
                        <ExternalLink className="w-4 h-4 text-muted-foreground/50" />
                      </CardContent></Card>
                    </a>
                  );
                })}
            </div>
            {socials.some((s) => s.source) && <p className="text-xs text-muted-foreground mt-3">Handles verified from official sources (firm website, Crunchbase, AngelList).</p>}
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Are you raising? <Link to="/deals/new" className="text-primary hover:underline underline-offset-2">Post your deal</Link> to get on investors' radar.
        </p>
      </div>

      {/* Request-intro dialog */}
      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request an intro to {inv.name}</DialogTitle>
            <DialogDescription>
              Our team brokers warm introductions. Tell {inv.name?.split(" ")[0]} who you are and why now — and optionally attach a deal you're raising.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="msg">Your message</Label>
              <Textarea id="msg" rows={4} placeholder="Hi — I'm raising a $1.5M seed for…" value={reqMsg} onChange={(e) => setReqMsg(e.target.value)} />
            </div>
            {myDeals.length > 0 && (
              <div className="space-y-2">
                <Label>Attach a deal (optional)</Label>
                <Select value={reqDeal} onValueChange={setReqDeal}>
                  <SelectTrigger><SelectValue placeholder="No deal attached" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No deal attached</SelectItem>
                    {myDeals.map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDlgOpen(false)}>Cancel</Button>
            <Button variant="premium" onClick={submitRequest} disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />{submitting ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
