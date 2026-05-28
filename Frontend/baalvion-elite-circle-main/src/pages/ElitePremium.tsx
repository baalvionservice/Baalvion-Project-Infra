import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Crown, Check, CreditCard, Bitcoin, Building2, Wallet, ShieldCheck, ArrowUp, Sparkles } from "lucide-react";

const FEATURES: Record<string, string[]> = {
  founder: ["Full investor directory access", "Browse & post deals", "Founder profile + AI analysis", "Founders network & connections", "Warm-intro requests"],
  investor_partner: ["Everything in Founder", "Investor pipeline CRM (Kanban)", "Saved lists & startup comparison", "Priority warm intros & data-room access", "AI investor matching & deal flow"],
};
const PROVIDERS = [
  { key: "razorpay", label: "Razorpay", icon: Wallet, note: "UPI, cards, netbanking" },
  { key: "payu", label: "PayU", icon: Building2, note: "Cards, UPI, wallets" },
  { key: "stripe", label: "Credit / Debit card", icon: CreditCard, note: "Visa, Mastercard, Amex" },
  { key: "crypto", label: "Crypto", icon: Bitcoin, note: "BTC, ETH, USDC" },
];

export default function ElitePremium() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<any[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [grace, setGrace] = useState(5);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<{ tier: string; quote: any } | null>(null);
  const [paying, setPaying] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.functions.invoke("payment-tiers", { body: {} });
    if (data) { setTiers(data.tiers || []); setMembership(data.membership || null); setGrace(data.grace_days || 5); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const pay = async (provider: string) => {
    if (!picker) return;
    setPaying(provider);
    const { data: order, error } = await supabase.functions.invoke("payment-order", { body: { provider, tier: picker.tier } });
    if (error || !order) { setPaying(""); return toast.error("Could not start payment"); }
    // Demo confirm. LIVE: open the provider's checkout (Razorpay modal / PayU redirect / Stripe Elements /
    // Coinbase hosted_url) and call payment-confirm with the real gateway response payload.
    const demoPayload: Record<string, any> = { payu: { status: "success" }, stripe: { status: "succeeded" }, crypto: { event: "charge:confirmed" }, razorpay: {} };
    const { data: conf, error: e2 } = await supabase.functions.invoke("payment-confirm", { body: { payment_id: order.payment_id, payload: demoPayload[provider] || {} } });
    setPaying(""); setPicker(null);
    if (e2 || !conf) return toast.error("Payment could not be confirmed");
    await load();
    toast.success(`Payment successful — you're now ${picker.tier === "investor_partner" ? "an Investor Partner" : "a Founder member"}!`);
    navigate("/investors");
  };

  const ICONS: Record<string, any> = { founder: Crown, investor_partner: ShieldCheck };

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
                      <Button variant={featured ? "premium" : "default"} className="w-full" onClick={() => setPicker({ tier: t.key, quote: t.quote })}>
                        <Sparkles className="w-4 h-4 mr-2" />{isUpgrade ? `Upgrade — $${due}` : `Get ${t.label} — $${due}`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground mt-6">Secured payments via Razorpay, PayU, card & crypto. Demo mode until live API keys are configured.</p>
      </div>

      {/* Provider chooser */}
      <Dialog open={!!picker} onOpenChange={(o) => !o && setPicker(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay ${picker?.quote?.amount ?? ""} — {picker?.tier === "investor_partner" ? "Investor Partner" : "Founder"}</DialogTitle>
            <DialogDescription>{picker?.quote?.note || "Choose a payment method."}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {PROVIDERS.map((p) => (
              <button key={p.key} onClick={() => pay(p.key)} disabled={!!paying}
                className="flex flex-col items-start gap-1 rounded-xl border border-border p-4 text-left hover:border-primary/50 hover:bg-secondary/40 transition-colors disabled:opacity-50">
                <p.icon className="w-6 h-6 text-primary" />
                <span className="font-medium text-sm">{paying === p.key ? "Processing…" : p.label}</span>
                <span className="text-xs text-muted-foreground">{p.note}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
