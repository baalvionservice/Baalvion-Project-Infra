import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ShieldCheck, Users, Clock, TrendingUp, Wallet,
  Sparkles, CheckCircle2, Lock, Mail
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Deal = any;
type Interest = any;

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [founder, setFounder] = useState<any>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [myInterest, setMyInterest] = useState<Interest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id, user?.id]);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await (supabase.from("deals" as any) as any)
        .select("*").eq("id", id).single();
      setDeal(d);
      if (d?.founder_id) {
        const { data: p } = await supabase.from("profiles")
          .select("id, username, full_name, avatar_url, bio").eq("id", d.founder_id).single();
        setFounder(p);
      }
      const { data: ints } = await (supabase.from("deal_interests" as any) as any)
        .select("*").eq("deal_id", id);
      setInterests(ints || []);
      if (user) {
        const mine = (ints || []).find((x: any) => x.investor_id === user.id);
        setMyInterest(mine || null);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInterest = async () => {
    if (!user) { navigate("/auth"); return; }
    setSubmitting(true);
    try {
      const { data, error } = await (supabase.from("deal_interests" as any) as any)
        .insert({ deal_id: id, investor_id: user.id })
        .select().single();
      if (error) throw error;
      setMyInterest(data);
      setInterests([...interests, data]);
      toast.success("Interest registered. The founder has been notified.");
    } catch (e: any) {
      toast.error(e.message || "Could not register interest");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10 max-w-4xl space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (!deal) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Deal not found.</p>
          <Button asChild variant="link"><Link to="/dashboard">Back</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const isFounder = user?.id === deal.founder_id;
  const status = myInterest?.status;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {deal.stage && <Badge variant="outline" className="border-primary/40 text-primary">{deal.stage}</Badge>}
                      {deal.category && <Badge variant="secondary">{deal.category}</Badge>}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{deal.title}</h1>
                    <p className="text-lg text-muted-foreground">{deal.pitch}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Posted {formatDistanceToNow(new Date(deal.created_at), { addSuffix: true })}</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {interests.length} interested</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {deal.description && (
                  <Section title="Overview">{deal.description}</Section>
                )}
                {deal.problem && <Section title="Problem">{deal.problem}</Section>}
                {deal.solution && <Section title="Solution">{deal.solution}</Section>}
                {deal.business_model && <Section title="Business Model">{deal.business_model}</Section>}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 space-y-4">
                <Stat icon={Wallet} label="Funding required" value={deal.funding_required ? `₹${Number(deal.funding_required).toLocaleString("en-IN")}` : "—"} />
                <Stat icon={TrendingUp} label="Expected return" value={deal.expected_return || "—"} />

                {isFounder ? (
                  <Button asChild variant="premium" className="w-full">
                    <Link to={`/deals/${deal.id}/manage`}>
                      <Sparkles className="w-4 h-4 mr-2" /> View interested investors ({interests.length})
                    </Link>
                  </Button>
                ) : status === "approved" ? (
                  <div className="space-y-2">
                    <Badge className="w-full justify-center py-2 bg-green-500/15 text-green-400 border-green-500/30">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Connection approved
                    </Badge>
                    {founder && (
                      <Button asChild variant="premium" className="w-full">
                        <a href={`mailto:?subject=Re: ${deal.title}`}><Mail className="w-4 h-4 mr-2" /> Contact {founder.full_name || founder.username}</a>
                      </Button>
                    )}
                  </div>
                ) : status === "pending" ? (
                  <Badge variant="outline" className="w-full justify-center py-2 border-yellow-500/40 text-yellow-400">
                    <Clock className="w-4 h-4 mr-1" /> Awaiting founder approval
                  </Badge>
                ) : status === "rejected" ? (
                  <Badge variant="outline" className="w-full justify-center py-2 border-destructive/40 text-destructive">
                    Not approved
                  </Badge>
                ) : (
                  <Button onClick={handleInterest} disabled={submitting} variant="premium" className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {submitting ? "Sending…" : "I'm Interested"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {founder && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Founder</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      {(founder.full_name || founder.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate flex items-center gap-1">
                        {founder.full_name || founder.username}
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </p>
                      <p className="text-xs text-muted-foreground truncate">@{founder.username}</p>
                    </div>
                  </div>
                  {founder.bio && <p className="text-sm text-muted-foreground mt-3">{founder.bio}</p>}
                </CardContent>
              </Card>
            )}

            {!user && (
              <Card className="border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5" />
                  <span>Sign in to express interest and connect with founders.</span>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-sm uppercase tracking-wider text-primary font-semibold mb-2">{title}</h3>
    <p className="text-foreground/90 whitespace-pre-line leading-relaxed">{children}</p>
  </div>
);

const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);
