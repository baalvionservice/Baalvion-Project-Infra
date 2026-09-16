import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  fetchTiers, startMembershipCheckout, awaitMembership,
  type MembershipTier, type TierRow, type MembershipRow,
} from "@/lib/gatewayCheckout";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Crown, Check, ShieldCheck, ArrowUp, Sparkles, type LucideIcon } from "lucide-react";

const FEATURES: Record<string, string[]> = {
  founder: ["Full investor directory access", "Browse & post deals", "Founder profile + AI analysis", "Founders network & connections", "Warm-intro requests"],
  investor_partner: ["Everything in Founder", "Investor pipeline CRM (Kanban)", "Saved lists & startup comparison", "Priority warm intros & data-room access", "AI investor matching & deal flow"],
};

export default function ElitePremium() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [membership, setMembership] = useState<MembershipRow | null>(null);
  const [grace, setGrace] = useState(5);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await fetchTiers();
      setTiers(data.tiers || []);
      setMembership(data.membership || null);
      setGrace(data.grace_days || 5);
    } catch {
      setTiers([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // The browser names a TIER and nothing else: the price is quoted server-side and the provider is
  // resolved by payment-service from the vault. The membership itself is granted only by the
  // provider's verified webhook, so nothing here may announce success on its own.
  const pay = async (tier: MembershipTier) => {
    setPaying(tier);
    try {
      const outcome = await startMembershipCheckout(tier);
      if (outcome.status === "cancelled") return;
      if (outcome.status === "failed") { toast.error(outcome.message); return; }
      if (outcome.status === "redirecting") return;
      if (outcome.status === "awaiting_transfer") {
        toast.info("Send the transfer shown to complete your membership — it activates once it confirms on-chain.");
        return;
      }
      toast.info("Payment submitted — confirming with your bank…");
      const confirmed = await awaitMembership(tier);
      await load();
      if (confirmed) {
        toast.success(`Payment confirmed — you're now ${tier === "investor_partner" ? "an Investor Partner" : "a Founder member"}.`);
        navigate("/investors");
      } else {
        toast.info("Payment received. Your membership activates as soon as it clears.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start payment");
    } finally {
      setPaying("");
    }
  };

  const ICONS: Record<string, LucideIcon> = { founder: Crown, investor_partner: ShieldCheck };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3"><Crown className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-primary">Membership</span></div>
          <h1 className="text-4xl font-bold tracking-tight">Choose your tier</h1>
          <p className="text-muted-foreground text-lg mt-2">Upgrade within {grace} days and pay only the difference.</p>
        </div>

        {loading ? <div className="grid md:grid-cols-2 gap-6">{[0, 1].map((i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}</div> : (
          <div className="grid md:grid-cols-2 gap-6">
            {tiers.map((t) => {
              const Icon = ICONS[t.key] || Crown;
              const isCurrent = t.current;
              const isUpgrade = !isCurrent && membership?.status === "active" && (membership.plan !== t.key);
              const due = t.quote?.amount ?? t.price;
              const featured = t.key === "investor_partner";
              return (
                <Card key={t.key} className={`relative overflow-hidden border-border ${featured ? "ring-2 ring-primary/40" : ""}`}>
                  {featured && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">Top tier</div>}
                  <CardContent className="p-7">
                    <div className="flex items-center gap-2 mb-1"><Icon className="w-6 h-6 text-primary" /><h2 className="text-xl font-bold">{t.label}</h2></div>
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="text-4xl font-bold">${due}</span>
                      <span className="text-muted-foreground">{isUpgrade && t.quote?.proration ? "to upgrade" : "/year"}</span>
                    </div>
                    {isUpgrade && t.quote?.proration && <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><ArrowUp className="w-3 h-3" />Prorated — full price ${t.price}, you save ${t.price - due}</p>}
                    {isUpgrade && !t.quote?.proration && <p className="text-xs text-amber-400 mt-1">{t.quote?.note}</p>}

                    <ul className="space-y-2 mt-5 mb-6">
                      {(FEATURES[t.key] || []).map((feat) => <li key={feat} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />{feat}</li>)}
                    </ul>

                    {isCurrent ? (
                      <Button variant="outline" className="w-full pointer-events-none"><Check className="w-4 h-4 mr-2" />Current plan</Button>
                    ) : (
                      <Button variant={featured ? "premium" : "default"} className="w-full" onClick={() => pay(t.key)} disabled={!!paying}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {paying === t.key ? "Starting checkout…" : isUpgrade ? `Upgrade — $${due}` : `Get ${t.label} — $${due}`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Secure hosted checkout — card details are entered on the payment provider's page, never here.
        </p>
      </div>

    </MainLayout>
  );
}
