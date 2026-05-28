import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMembership } from "@/hooks/useMembership";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Crown, Wallet, Briefcase, Users, ShieldCheck, Sparkles } from "lucide-react";

const BENEFITS = [
  { icon: Wallet, text: "Full access to the investor directory — types, sectors, regions, check sizes" },
  { icon: Briefcase, text: "Browse and post deals; request warm intros to investors" },
  { icon: Users, text: "Founders directory — connect with founders worldwide" },
  { icon: ShieldCheck, text: "Build your founder profile: company, idea, interview & pitch video" },
];

export default function Membership() {
  const navigate = useNavigate();
  const { active, membership, loading, refresh } = useMembership();
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    const { data, error } = await supabase.functions.invoke("checkout", { body: { plan: "founder" } });
    setPaying(false);
    if (error || !data) { toast.error("Payment could not be completed"); return; }
    await refresh();
    toast.success("Payment successful — welcome aboard! Investor & deal access unlocked.");
    navigate("/investors");
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Crown className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-primary">Founder Membership</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Unlock the full platform</h1>
          <p className="text-muted-foreground text-lg mt-2">Investor access, deal flow, the founders network, and your own founder profile.</p>
        </div>

        {loading ? <Skeleton className="h-80 rounded-2xl" /> : active ? (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto"><Check className="w-7 h-7 text-primary" /></div>
              <h2 className="text-2xl font-bold">You're a member 🎉</h2>
              <p className="text-muted-foreground">Your <span className="capitalize font-medium text-foreground">{membership?.plan || "founder"}</span> membership is active{membership?.expires_at ? ` until ${new Date(membership.expires_at).toLocaleDateString()}` : ""}.</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button variant="premium" onClick={() => navigate("/investors")}>Browse investors</Button>
                <Button variant="outline" onClick={() => navigate("/founders")}>Founders directory</Button>
                <Button variant="outline" onClick={() => navigate("/profile/edit")}>Complete your profile</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/30 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/15 to-card p-8 text-center">
              <Badge className="bg-primary/20 text-primary hover:bg-primary/20 mb-3">Founder plan</Badge>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">$199</span><span className="text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Cancel anytime. Full access the moment you join.</p>
            </div>
            <CardContent className="p-8">
              <ul className="space-y-3 mb-6">
                {BENEFITS.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0"><b.icon className="w-4 h-4 text-primary" /></div>
                    <span className="text-sm">{b.text}</span>
                  </li>
                ))}
              </ul>
              <Button variant="premium" size="lg" className="w-full" onClick={pay} disabled={paying}>
                <Sparkles className="w-4 h-4 mr-2" />{paying ? "Processing payment…" : "Complete payment — $199"}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Demo checkout (no card charged). Wire Stripe in <code>functions/checkout</code> for live payments.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
