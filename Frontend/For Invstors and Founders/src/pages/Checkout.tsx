import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ban, Loader2, ShieldCheck, Lock } from "lucide-react";
import { startGatewayCheckout, type CheckoutResult } from "@/lib/gatewayCheckout";

/**
 * Baalvion Elite Circle checkout. No payment logic here — it calls the
 * insiders-service BFF (`/billing/checkout`), which calls the SDK-native
 * payment-service; the provider's hosted checkout collects the card. Mock mode
 * simulates the step locally; the same flow opens the real widget once hosted+live.
 */
const TIERS = [
  { id: "elite-monthly", name: "Elite — Monthly", amount: 2000, currency: "USD", blurb: "Full Elite Circle access, billed monthly" },
  { id: "elite-annual", name: "Elite — Annual", amount: 20000, currency: "USD", blurb: "Full access — two months free" },
] as const;

export default function Checkout() {
  const [selected, setSelected] = useState<(typeof TIERS)[number]>(TIERS[0]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckoutResult["status"] | null>(null);
  const [message, setMessage] = useState("");

  const pay = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const res = await startGatewayCheckout({
        amount: selected.amount,
        currency: selected.currency,
        idempotencyKey: `${selected.id}-${Date.now()}`,
        receipt: selected.id,
      });
      setResult(res.status);
      if (res.status === "failed") setMessage(res.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not start checkout");
      setResult("failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Elite Circle Membership</h1>
        <p className="text-muted-foreground">Choose a plan and complete payment securely.</p>
      </div>

      {result === "success" ? (
        <Card className="text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Payment Successful</h2>
            <p className="text-muted-foreground">Your {selected.name} membership is being activated.</p>
            <Badge>Paid</Badge>
          </CardContent>
        </Card>
      ) : result === "failed" ? (
        <Card className="text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <Ban className="w-14 h-14 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Payment Failed</h2>
            <p className="text-muted-foreground">{message || "Unable to process your payment."}</p>
            <Button onClick={() => setResult(null)}>Try Again</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            {TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t)}
                className={`text-left p-4 rounded-lg border transition-all ${selected.id === t.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}
              >
                <div className="font-semibold">{t.name}</div>
                <div className="text-2xl font-bold mt-1">${(t.amount / 100).toFixed(2)}<span className="text-sm font-normal text-muted-foreground"> {t.currency}</span></div>
                <p className="text-xs text-muted-foreground mt-1">{t.blurb}</p>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Secure checkout</CardTitle>
              <CardDescription className="flex items-center gap-2"><Lock className="w-4 h-4" /> Card details are entered on the provider's PCI-compliant page — this site never sees your card.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={pay} disabled={processing}>
                {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : <>Pay ${(selected.amount / 100).toFixed(2)} {selected.currency}</>}
              </Button>
              {result === "cancelled" && <p className="text-sm text-muted-foreground mt-3 text-center">Checkout cancelled — you can try again.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
