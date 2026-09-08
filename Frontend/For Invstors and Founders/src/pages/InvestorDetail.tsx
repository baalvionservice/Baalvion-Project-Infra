import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
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
  ArrowLeft, BadgeCheck, MapPin, Globe, Linkedin, ChevronRight, FileText, Twitter, Instagram, Facebook, Wallet, Briefcase, Mail, Phone, Building2, Landmark, ExternalLink, TrendingUp, Newspaper, Users, Link2, ShieldCheck,
  Lock, Clock, CheckCircle2, XCircle, Send,
} from "lucide-react";
import { Investor, money, initials, placeLabel } from "@/lib/investor";
import { getPublicInvestor, type InvestorFund, type InvestorPerson } from "@/lib/publicApi";
import { investorPath, placePath } from "@/lib/directory-url";
import { irBusinessOnboardingUrl } from "@/lib/ir";
import ClaimProfileDialog from "@/components/directory/ClaimProfileDialog";
import PageSeo from "@/components/seo/PageSeo";

type Social = { id: string; platform: string; url: string; handle: string | null; followers: number | null; source: string | null };
type Investment = { id: string; target_company: string; round: string | null; amount_usd: number | null; invested_on: string | null; source_url: string | null; source_name: string | null };
type News = { id: string; url: string | null; headline: string; summary: string | null; source: string | null; sentiment: string | null; published_at: string | null };

const PLATFORM_ICON: Record<string, any> = { twitter: Twitter, linkedin: Linkedin, instagram: Instagram, facebook: Facebook, website: Globe, angellist: Link2 };
const SENTIMENT: Record<string, string> = {
  positive: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  neutral: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  negative: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};
// Form D encodes "indefinite offering" as a zero target rather than a blank.
const INDEFINITE = 0;
const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");
const fmtFollowers = (n: number | null) => (n == null ? null : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

export default function InvestorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inv, setInv] = useState<Investor | null>(null);
  const [socials, setSocials] = useState<Social[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [funds, setFunds] = useState<InvestorFund[]>([]);
  const [people, setPeople] = useState<InvestorPerson[]>([]);
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
        const pub = await getPublicInvestor(String(id));
        if (!pub) { toast.error("Investor not found"); navigate("/investors"); return; }
        setInv(pub as unknown as Investor);
        setInvestments((pub.recent_investments as unknown as Investment[]) || []);
        setNews((pub.news as unknown as News[]) || []);
        setFunds(pub.funds || []);
        setPeople(pub.people || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id, navigate]);

  // Signed-in extras: the contact channels the public payload withholds (website, linkedin,
  // socials — email/phone stay behind an accepted intro), plus this user's request and deals.
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const [{ data: full }, { data: s }, { data: req }, { data: deals }] = await Promise.all([
        supabase.from("investors" as any).select("*").eq("id", id).maybeSingle(),
        supabase.from("investor_socials" as any).select("*").eq("investor_id", id),
        supabase.from("connection_requests" as any).select("id, status").eq("investor_id", id).maybeSingle(),
        supabase.from("deals" as any).select("id, title").eq("founder_id", user.id),
      ]);
      if (full) setInv((prev) => ({ ...(prev as Investor), ...(full as Investor) }));
      setSocials((s as Social[]) || []);
      setMyRequest((req as any) || null);
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

  // Compiled from a public filing rather than claimed by its owner: no member relationship exists,
  // so the intro flow must not be offered for it.
  const isListedOnly = inv?.source === "sec_form_d";

  // Home > Investors > Country > State > City > Name — each place crumb is a real listing page.
  const placeCrumbs: { label: string; to?: string }[] = inv ? [
    { label: "Home", to: "/" },
    { label: "Investors", to: "/investors" },
    ...(inv.country_slug ? [{ label: inv.country as string, to: placePath("investors", { country: inv.country_slug }) }] : []),
    ...(inv.country_slug && inv.state_slug ? [{ label: inv.state as string, to: placePath("investors", { country: inv.country_slug, state: inv.state_slug }) }] : []),
    ...(inv.country_slug && inv.city_slug ? [{ label: inv.city as string, to: placePath("investors", { country: inv.country_slug, state: inv.state_slug || undefined, city: inv.city_slug }) }] : []),
    { label: inv.name },
  ] : [];

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
      <PageSeo
        title={`${inv.name}${inv.firm ? ` — ${inv.firm}` : ""} | Investor Profile | Baalvion`}
        description={
          inv.thesis ||
          `${inv.name} is a ${(inv.firm_type || "investment").toLowerCase()} firm based in ${placeLabel(inv)}` +
          `${inv.fund_count ? ` with ${inv.fund_count} fund${inv.fund_count === 1 ? "" : "s"} on record` : ""}` +
          `${inv.total_raised_usd ? `, ${money(inv.total_raised_usd)} raised across them` : ""}` +
          `${inv.last_filing_date ? `. Last SEC filing ${fmtDate(inv.last_filing_date)}.` : "."}`
        }
        path={investorPath(inv)}
        image={inv.avatar_url || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: inv.name,
          jobTitle: inv.title || undefined,
          description: inv.thesis || undefined,
          image: inv.avatar_url || undefined,
          worksFor: inv.firm ? { "@type": "Organization", name: inv.firm } : undefined,
          address: inv.headquarters || inv.location || undefined,
          knowsAbout: (inv.focus_sectors || []).length ? inv.focus_sectors : undefined,
        }}
      />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/investors")}><ArrowLeft className="w-4 h-4 mr-1" />All investors</Button>

        {/* Header — left-aligned, with the place crumbs linking back into the geography so a
            profile is a route into the directory rather than a dead end. */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-xs text-muted-foreground mb-5">
          {placeCrumbs.map((c, idx) => (
            <span key={`${c.label}-${idx}`} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
              {c.to ? <Link to={c.to} className="hover:text-primary hover:underline">{c.label}</Link> : <span className="text-foreground">{c.label}</span>}
            </span>
          ))}
        </nav>

        <div className="flex flex-col sm:flex-row items-start gap-6 pb-8 border-b border-foreground/80">
          {inv.avatar_url
            ? <img src={inv.avatar_url} alt={inv.name} className="w-20 h-20 rounded object-cover border border-border" />
            : <div className="w-20 h-20 rounded bg-secondary text-muted-foreground text-xl font-semibold flex items-center justify-center">{initials(inv.name)}</div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl lg:text-4xl font-semibold">{inv.name}</h1>
              {inv.is_verified && <BadgeCheck className="w-6 h-6 text-primary" aria-label="Verified" />}
            </div>
            <p className="text-base mt-1.5">
              {[inv.title, inv.firm === inv.name ? null : inv.firm].filter(Boolean).join(" · ")}
              {inv.firm_type && <span className="text-muted-foreground"> · {inv.firm_type}</span>}
            </p>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />{placeLabel(inv)}
            </p>

            <div className="flex flex-wrap gap-3 mt-5">
              {!user ? (
                <Button asChild>
                  <Link to={`/auth?redirect=${investorPath(inv)}`}><Mail className="w-4 h-4 mr-2" />Create a free account to request an intro</Link>
                </Button>
              ) : myRequest ? (
                myRequest.status === "accepted" ? (
                  <Button variant="outline" className="border-emerald-600/40 text-emerald-700 pointer-events-none"><CheckCircle2 className="w-4 h-4 mr-2" />Intro accepted</Button>
                ) : myRequest.status === "declined" ? (
                  <Button variant="outline" className="border-destructive/40 text-destructive pointer-events-none"><XCircle className="w-4 h-4 mr-2" />Request declined</Button>
                ) : (
                  <Button variant="outline" className="pointer-events-none"><Clock className="w-4 h-4 mr-2" />Intro requested · pending</Button>
                )
              ) : (
                <Button onClick={() => setDlgOpen(true)}><Mail className="w-4 h-4 mr-2" />Request intro</Button>
              )}
              {isListedOnly && !inv.claimed_at && (
                <ClaimProfileDialog entityType="investor" entityId={inv.id} entityName={inv.name} />
              )}
              {inv.website && <Button variant="outline" asChild><a href={inv.website} target="_blank" rel="noreferrer"><Globe className="w-4 h-4 mr-2" />Website</a></Button>}
              {inv.linkedin_url && <Button variant="outline" asChild><a href={inv.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="w-4 h-4 mr-2" />LinkedIn</a></Button>}
            </div>
          </div>
        </div>

        {/* Facts */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 py-7 border-b border-border mb-8">
          {[
            { label: "Capital raised", value: money(inv.total_raised_usd ?? inv.aum_usd) },
            { label: "Funds on record", value: String(inv.fund_count ?? funds.length) },
            { label: "Last filing", value: fmtDate(inv.last_filing_date) },
            { label: "People named", value: String(people.length) },
          ].map((f) => (
            <div key={f.label}>
              <dt className="label-eyebrow">{f.label}</dt>
              <dd className="text-xl font-semibold mt-1 tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="inline-flex mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="filings">Filings <span className="ml-1 text-xs opacity-60">{funds.length}</span></TabsTrigger>
            <TabsTrigger value="people">People <span className="ml-1 text-xs opacity-60">{people.length}</span></TabsTrigger>
            {investments.length > 0 && <TabsTrigger value="investments">Investments <span className="ml-1 text-xs opacity-60">{investments.length}</span></TabsTrigger>}
            {news.length > 0 && <TabsTrigger value="news">News <span className="ml-1 text-xs opacity-60">{news.length}</span></TabsTrigger>}
            <TabsTrigger value="social">Links</TabsTrigger>
          </TabsList>

          {/* Filings — the primary records every figure on this page is drawn from. */}
          <TabsContent value="filings" className="mt-0">
            {funds.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No filings on record.</p>
            ) : (
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border bg-secondary/60">
                      <th className="py-2.5 px-3 font-medium">Fund</th>
                      <th className="py-2.5 px-3 font-medium">Type</th>
                      <th className="py-2.5 px-3 font-medium text-right">Sold</th>
                      <th className="py-2.5 px-3 font-medium text-right">Target</th>
                      <th className="py-2.5 px-3 font-medium text-right">Min</th>
                      <th className="py-2.5 px-3 font-medium text-right">Investors</th>
                      <th className="py-2.5 px-3 font-medium">First sale</th>
                      <th className="py-2.5 px-3 font-medium">Filed</th>
                      <th className="py-2.5 px-3 font-medium">Filing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funds.map((f) => (
                      <tr key={f.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40 align-top">
                        <td className="py-2.5 px-3">
                          <div className="font-medium">{f.fund_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {[f.entity_type, f.jurisdiction && `${f.jurisdiction} entity`, f.year_of_inc && `formed ${f.year_of_inc}`].filter(Boolean).join(" · ")}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{f.fund_type || "—"}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium">{money(f.total_sold_usd)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{f.total_offering_usd === INDEFINITE ? "Indefinite" : money(f.total_offering_usd)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{f.min_investment_usd ? money(f.min_investment_usd) : "—"}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{f.investor_count ?? "—"}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(f.first_sale_date)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(f.filing_date)}{f.is_amendment && <span className="ml-1 text-[10px] uppercase tracking-wide">amd</span>}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {f.source_url
                            ? <a href={f.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">SEC<ExternalLink className="w-3 h-3" /></a>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              "Sold" is the amount reported sold at the time of each filing, not a running total. "Target" is the
              offering amount; funds that file an indefinite offering show no figure.
            </p>
          </TabsContent>

          {/* People named on the filings. Roles are as filed, not as marketed. */}
          <TabsContent value="people" className="mt-0">
            {people.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No individuals are named on this firm's filings — some firms file through a management entity instead.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
                {people.map((p) => (
                  <div key={p.id} className="py-3 border-b border-border">
                    <div className="font-medium">{p.full_name}</div>
                    <div className="text-sm text-muted-foreground">{(p.relationships || []).join(", ") || "—"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {[p.city, p.state_or_country].filter(Boolean).join(", ")}
                      {p.filings_count > 1 && <span> · on {p.filings_count} filings</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Overview */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* What the record says, stated as a record — not as a marketing profile the firm
                    never wrote. Fields Form D does not report are shown as not disclosed rather
                    than filled with a guess. */}
                <Card className="border-border"><CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">On the public record</h2>
                  <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      ["Type", inv.firm_type],
                      ["Legal form", inv.entity_type],
                      ["Formed", inv.year_founded ? String(inv.year_founded) : null],
                      ["Based", placeLabel(inv)],
                      ["Funds on record", inv.fund_count ? String(inv.fund_count) : null],
                      ["Capital raised across funds", money(inv.total_raised_usd)],
                      ["First filing", fmtDate(inv.first_filing_date)],
                      ["Most recent filing", fmtDate(inv.last_filing_date)],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="label-eyebrow">{label}</dt>
                        <dd className="text-sm font-medium mt-0.5">{(value as string) || <span className="text-muted-foreground font-normal">Not disclosed</span>}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent></Card>
                {inv.thesis && (
                  <Card className="border-border"><CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-2">Investment thesis</h2>
                    <p className="text-muted-foreground leading-relaxed">{inv.thesis}</p>
                  </CardContent></Card>
                )}
                {((inv.focus_sectors || []).length > 0 || (inv.stages || []).length > 0 || (inv.portfolio || []).length > 0) && (
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Card className="border-border"><CardContent className="p-6">
                      <h2 className="text-base font-semibold mb-3">Focus sectors</h2>
                      <div className="flex flex-wrap gap-2">
                        {(inv.focus_sectors || []).length === 0 ? <span className="text-sm text-muted-foreground">Not disclosed</span>
                          : (inv.focus_sectors || []).map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}
                      </div>
                      <h2 className="text-base font-semibold mb-3 mt-5">Stages</h2>
                      <div className="flex flex-wrap gap-2">
                        {(inv.stages || []).length === 0 ? <span className="text-sm text-muted-foreground">Not disclosed</span>
                          : (inv.stages || []).map((x) => <Badge key={x} variant="outline" className="border-primary/40 text-primary">{x}</Badge>)}
                      </div>
                    </CardContent></Card>
                    <Card className="border-border"><CardContent className="p-6">
                      <h2 className="text-base font-semibold mb-3">Notable portfolio</h2>
                      <div className="flex flex-wrap gap-2">
                        {(inv.portfolio || []).length === 0 ? <span className="text-sm text-muted-foreground">Not disclosed</span>
                          : (inv.portfolio || []).map((x) => <span key={x} className="px-3 py-1.5 rounded bg-secondary text-sm font-medium">{x}</span>)}
                      </div>
                    </CardContent></Card>
                  </div>
                )}
              </div>
              {/* Contact + provenance */}
              <div className="space-y-6">
                <Card className="border-border"><CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" />Contact & links</h2>
                  {isListedOnly ? (
                    (inv.street || inv.phone) ? (
                      <>
                        <ContactRow icon={MapPin} label="Address" value={[inv.street, placeLabel(inv), inv.postal_code].filter(Boolean).join(", ")} />
                        <ContactRow icon={Phone} label="Telephone" value={inv.phone} href={inv.phone ? `tel:${String(inv.phone).replace(/[^0-9+]/g, "")}` : undefined} />
                        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                          The business address and telephone this firm gave the SEC on its most recent filing.
                          It is a regulatory contact, not an invitation — expect a cold approach to be treated as one.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2 leading-relaxed">
                        No contact details on this firm's filings.
                      </p>
                    )
                  ) : !user ? (
                    <Link
                      to={`/auth?redirect=${investorPath(inv)}`}
                      className="w-full flex items-center gap-2 py-3 px-3 my-2 rounded-lg bg-secondary/50 border border-dashed border-border text-sm text-left text-muted-foreground hover:border-primary/40 transition-colors"
                    >
                      <Lock className="w-4 h-4 shrink-0 text-primary" />
                      <span>Create a free account to see this investor's website, LinkedIn and social profiles.</span>
                    </Link>
                  ) : myRequest?.status === "accepted" ? (
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

                {/* Where this came from. A directory that states figures without saying where they
                    came from is asking to be trusted; this one can be checked. */}
                {inv.source === "sec_form_d" && (
                  <Card className="border-border"><CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Source</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Compiled from this firm's <strong className="font-medium text-foreground">SEC Form D</strong> filings —
                      the notice a US private fund files when it raises capital. Figures are as filed.
                    </p>
                    <dl className="mt-4 space-y-2.5">
                      <div className="flex justify-between gap-3 text-sm">
                        <dt className="text-muted-foreground">Filings used</dt>
                        <dd className="font-medium tabular-nums">{funds.length}</dd>
                      </div>
                      <div className="flex justify-between gap-3 text-sm">
                        <dt className="text-muted-foreground">Record updated</dt>
                        <dd className="font-medium">{fmtDate(inv.last_verified_at)}</dd>
                      </div>
                    </dl>
                    {inv.source_url && (
                      <a href={inv.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        Latest filing on SEC EDGAR<ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                      A filing means this firm raised capital, not that Baalvion has vetted it or that it is
                      open to new approaches.
                    </p>
                  </CardContent></Card>
                )}
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
              {isListedOnly ? (
                <Card className="sm:col-span-2"><CardContent className="py-10 text-center">
                  <p className="text-muted-foreground">
                    No links are on file. This record is compiled from SEC filings, which do not carry a
                    website or social profiles.
                  </p>
                </CardContent></Card>
              ) : !user ? (
                <Card className="sm:col-span-2 border-dashed"><CardContent className="py-10 text-center space-y-3">
                  <Lock className="w-5 h-5 text-primary mx-auto" />
                  <p className="text-muted-foreground">Social profiles are available to signed-in members.</p>
                  <Button variant="premium" asChild><Link to={`/auth?redirect=${investorPath(inv)}`}>Create a free account</Link></Button>
                </CardContent></Card>
              ) : socials.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">No social profiles found.</CardContent></Card>
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
          Are you raising?{" "}
          <a href={irBusinessOnboardingUrl("investor-profile")} target="_blank" rel="noreferrer" className="text-primary hover:underline underline-offset-2">
            Submit your company
          </a>{" "}
          on Baalvion IR — it goes through KYC review, not into a public listing.
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
