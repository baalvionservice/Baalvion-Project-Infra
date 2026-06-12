/**
 * PaymentForms — controlled, presentational payment-method forms for checkout.
 *
 * SECURITY (NON-NEGOTIABLE): the card number / CVV inputs below are CLIENT-SIDE
 * ONLY, for UX and inline validation. Raw PAN/CVV are NEVER sent to our backend.
 * The actual charge runs through `startGatewayCheckout()` which hands off to the
 * provider's tokenized / hosted flow (Stripe Elements / Razorpay Checkout). In
 * production these number/CVV <Input>s are REPLACED by the provider's hosted
 * fields — only the cardholder name is forwarded (as the customer name).
 *
 * This component is purely presentational: it renders `value`, emits the next
 * state via `onChange`, and shows per-field messages from `errors`.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Check, Building2, Landmark, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectBrand, cvvLength, formatCardNumber, formatExpiry } from "@/lib/payment/cards";

export type PaymentMethod = "card" | "wallet" | "bank" | "wire";
export type WalletKind = "paypal" | "googlepay" | "applepay" | "amazonpay" | "";

export interface PaymentState {
  method: PaymentMethod;
  card: {
    name: string;
    number: string;
    expiry: string;
    cvv: string;
    country: string;
    postal: string;
  };
  wallet: WalletKind;
  bank: {
    remitterName: string;
    remitterBank: string;
    remitterCountry: string;
  };
  wire: {
    company: string;
    contactEmail: string;
    estVolume: string;
    terms: "net30" | "net60";
  };
  companyName: string;
  vatNumber: string;
}

export const emptyPayment: PaymentState = {
  method: "card",
  card: { name: "", number: "", expiry: "", cvv: "", country: "", postal: "" },
  wallet: "",
  bank: { remitterName: "", remitterBank: "", remitterCountry: "" },
  wire: { company: "", contactEmail: "", estVolume: "", terms: "net30" },
  companyName: "",
  vatNumber: "",
};

const BRAND_LABEL: Record<ReturnType<typeof detectBrand>, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  rupay: "RuPay",
  unknown: "",
};

const WALLETS: { kind: Exclude<WalletKind, "">; label: string }[] = [
  { kind: "paypal", label: "PayPal" },
  { kind: "googlepay", label: "Google Pay" },
  { kind: "applepay", label: "Apple Pay" },
  { kind: "amazonpay", label: "Amazon Pay" },
];

interface PaymentFormsProps {
  value: PaymentState;
  onChange: (next: PaymentState) => void;
  errors: Record<string, string>;
}

/** Small inline field-error line, rendered only when present. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" /> {message}
    </p>
  );
}

export function PaymentForms({ value, onChange, errors }: PaymentFormsProps) {
  const brand = detectBrand(value.card.number);
  const brandLabel = BRAND_LABEL[brand];
  const maxCvv = cvvLength(brand);

  const setMethod = (method: PaymentMethod) => onChange({ ...value, method });
  const setCard = (patch: Partial<PaymentState["card"]>) =>
    onChange({ ...value, card: { ...value.card, ...patch } });
  const setBank = (patch: Partial<PaymentState["bank"]>) =>
    onChange({ ...value, bank: { ...value.bank, ...patch } });
  const setWire = (patch: Partial<PaymentState["wire"]>) =>
    onChange({ ...value, wire: { ...value.wire, ...patch } });

  return (
    <Tabs value={value.method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
      <TabsList className="w-full">
        <TabsTrigger value="card" className="flex-1">Card</TabsTrigger>
        <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
        <TabsTrigger value="bank" className="flex-1">Bank</TabsTrigger>
        <TabsTrigger value="wire" className="flex-1">Wire</TabsTrigger>
      </TabsList>

      {/* ───────────── CARD ───────────── */}
      <TabsContent value="card" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="cc-name">Cardholder name</Label>
          <Input
            id="cc-name"
            placeholder="Jane Doe"
            autoComplete="cc-name"
            value={value.card.name}
            onChange={(e) => setCard({ name: e.target.value })}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cc-number">Card number</Label>
          <div className="relative">
            <Input
              id="cc-number"
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
              value={value.card.number}
              onChange={(e) => setCard({ number: formatCardNumber(e.target.value) })}
              className="pr-20"
            />
            {brandLabel && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                {brandLabel}
              </span>
            )}
          </div>
          <FieldError message={errors.number} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cc-exp">Expiry (MM/YY)</Label>
            <Input
              id="cc-exp"
              placeholder="08/29"
              inputMode="numeric"
              autoComplete="cc-exp"
              value={value.card.expiry}
              onChange={(e) => setCard({ expiry: formatExpiry(e.target.value) })}
            />
            <FieldError message={errors.expiry} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cc-csc">CVV</Label>
            <Input
              id="cc-csc"
              placeholder={maxCvv === 4 ? "1234" : "123"}
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={maxCvv}
              value={value.card.cvv}
              onChange={(e) => setCard({ cvv: e.target.value.replace(/\D/g, "").slice(0, maxCvv) })}
            />
            <FieldError message={errors.cvv} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cc-country">Billing country</Label>
            <Input
              id="cc-country"
              placeholder="United States"
              autoComplete="country-name"
              value={value.card.country}
              onChange={(e) => setCard({ country: e.target.value })}
            />
            <FieldError message={errors.country} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cc-postal">Postal code</Label>
            <Input
              id="cc-postal"
              placeholder="94107"
              autoComplete="postal-code"
              value={value.card.postal}
              onChange={(e) => setCard({ postal: e.target.value })}
            />
            <FieldError message={errors.postal} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cc-company">Company (optional)</Label>
            <Input
              id="cc-company"
              placeholder="Acme Corp"
              autoComplete="organization"
              value={value.companyName}
              onChange={(e) => onChange({ ...value, companyName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cc-vat">VAT number (optional)</Label>
            <Input
              id="cc-vat"
              placeholder="EU123456789"
              value={value.vatNumber}
              onChange={(e) => onChange({ ...value, vatNumber: e.target.value })}
            />
          </div>
        </div>

        {/*
          PRODUCTION NOTE: the card number / CVV inputs above are placeholders for
          the provider's hosted fields (Stripe Elements / Razorpay Checkout). They
          exist only for local UX + validation — raw PAN/CVV never leave the browser.
        */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">
            Your payment is encrypted and tokenized by our PCI-DSS provider. Baalvion
            never stores your full card number or CVV — at checkout these fields are
            replaced by the provider's hosted, tokenized inputs.
          </p>
        </div>
      </TabsContent>

      {/* ───────────── WALLET ───────────── */}
      <TabsContent value="wallet" className="space-y-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Choose a digital wallet — you'll confirm payment in the provider's secure window.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {WALLETS.map((w) => {
            const selected = value.wallet === w.kind;
            return (
              <button
                key={w.kind}
                type="button"
                onClick={() => onChange({ ...value, wallet: w.kind })}
                aria-pressed={selected}
                className={cn(
                  "relative flex h-16 items-center justify-center rounded-lg border-2 text-base font-medium transition-all",
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {w.label}
                {selected && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <FieldError message={errors.wallet} />
      </TabsContent>

      {/* ───────────── BANK ───────────── */}
      <TabsContent value="bank" className="space-y-4 pt-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            We'll email you a pro-forma invoice with Baalvion's receiving bank details
            and your unique payment reference. Your subscription activates once funds are
            confirmed — typically 1-2 business days.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank-name">Account holder name</Label>
          <Input
            id="bank-name"
            placeholder="Jane Doe / Acme Corp"
            value={value.bank.remitterName}
            onChange={(e) => setBank({ remitterName: e.target.value })}
          />
          <FieldError message={errors.remitterName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank-institution">Your bank</Label>
          <Input
            id="bank-institution"
            placeholder="Chase, HSBC, ..."
            value={value.bank.remitterBank}
            onChange={(e) => setBank({ remitterBank: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank-country">Country</Label>
          <Input
            id="bank-country"
            placeholder="United States"
            autoComplete="country-name"
            value={value.bank.remitterCountry}
            onChange={(e) => setBank({ remitterCountry: e.target.value })}
          />
          <FieldError message={errors.remitterCountry} />
        </div>
      </TabsContent>

      {/* ───────────── WIRE ───────────── */}
      <TabsContent value="wire" className="space-y-4 pt-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <Badge className="mb-1">Enterprise</Badge>
            <p className="text-xs text-muted-foreground">
              Request invoicing on Net 30 / Net 60 terms. Our enterprise team will
              contact you to set up your wire transfer and billing agreement.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wire-company">Company</Label>
          <Input
            id="wire-company"
            placeholder="Acme Corp"
            autoComplete="organization"
            value={value.wire.company}
            onChange={(e) => setWire({ company: e.target.value })}
          />
          <FieldError message={errors.company} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wire-email">Billing contact email</Label>
          <Input
            id="wire-email"
            type="email"
            placeholder="billing@acme.com"
            autoComplete="email"
            value={value.wire.contactEmail}
            onChange={(e) => setWire({ contactEmail: e.target.value })}
          />
          <FieldError message={errors.contactEmail} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wire-volume">Estimated monthly volume</Label>
          <Input
            id="wire-volume"
            placeholder="e.g. 5,000 GB / $10,000"
            value={value.wire.estVolume}
            onChange={(e) => setWire({ estVolume: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Preferred terms</Label>
          <div className="flex gap-3">
            {(["net30", "net60"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={value.wire.terms === t ? "default" : "outline"}
                size="sm"
                onClick={() => setWire({ terms: t })}
              >
                {t === "net30" ? "Net 30" : "Net 60"}
              </Button>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
