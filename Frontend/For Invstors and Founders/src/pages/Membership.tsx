import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMembership } from "@/hooks/useMembership";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Crown, Wallet, Briefcase, Users, ShieldCheck, Sparkles } from "lucide-react";
import { fetchTiers, startMembershipCheckout, awaitMembership } from "@/lib/gatewayCheckout";

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
  // The price is whatever the server will actually charge. This page used to hardcode "$199"
  // while the tier catalogue charged $299 — a figure no one would notice was wrong until a
  // customer's card was debited for the larger amount.
  const [price, setPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchTiers()
      .then((t) => { if (!cancelled) setPrice(t.tiers.find((x) => x.key === "founder")?.quote?.amount ?? null); })
      .catch(() => { if (!cancelled) setPriceError(true); });
    return () => { cancelled = true; };
  }, []);

  const pay = async () => {
    setPaying(true);
    try {
      const outcome = await startMembershipCheckout("founder");
      if (outcome.status === "cancelled") return;
      if (outcome.status === "failed") { toast.error(outcome.message); return; }
      if (outcome.status === "redirecting") return; // the browser is leaving for the hosted page
      if (outcome.status === "awaiting_transfer") {
        toast.info("Send the transfer shown to complete your membership — it activates automatically once it confirms on-chain.");
        return;
      }
      // Submitted, not yet paid: the membership is granted by the provider's webhook, so ask the
      // server rather than assuming. Never announce success the browser cannot actually know.
      toast.info("Payment submitted — confirming with your bank…");
      const confirmed = await awaitMembership("founder");
      await refresh();
      if (confirmed) {
        toast.success("Payment confirmed — welcome aboard. Investor & deal access unlocked.");
        navigate("/investors");
      } else {
        toast.info("Payment received. Your membership will activate as soon as it clears — this page updates automatically.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment could not be started");
    } finally {
      setPaying(false);
    }
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
                {price === null
                  ? <Skeleton className="h-12 w-32" />
                  : <><span className="text-5xl font-bold">${price}</span><span className="text-muted-foreground">/year</span></>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Full access the moment your payment clears.</p>
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
              <Button variant="premium" size="lg" className="w-full" onClick={pay} disabled={paying || price === null}>
                <Sparkles className="w-4 h-4 mr-2" />
                {paying ? "Processing payment…" : price === null ? "Loading price…" : `Continue to payment — $${price}`}
              </Button>
              {priceError && (
                <p className="text-center text-xs text-destructive mt-3">
                  Pricing is unavailable right now. Please refresh — checkout is disabled rather than showing a price we cannot honour.
                </p>
              )}
              <p className="text-center text-xs text-muted-foreground mt-3">
                Secure hosted checkout. Card details are entered on the payment provider's page — never here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
