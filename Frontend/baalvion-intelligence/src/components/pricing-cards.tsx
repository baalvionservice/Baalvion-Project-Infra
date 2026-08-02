"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useAuthSDK } from "@baalvion/auth-sdk/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { plans, type Plan } from "@/lib/plans";
import { useRazorpayCheckout } from "@/lib/billing/use-razorpay-checkout";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthSDK();
  const { checkout, isProcessing, error } = useRazorpayCheckout({
    onSuccess: () => router.push("/dashboard/billing?upgraded=1"),
  });
  const visiblePlans = compact ? plans.filter((plan) => plan.name !== "Enterprise") : plans;

  return (
    <div className="space-y-4">
      {error && <p className="text-center text-sm text-signal-negative">{error}</p>}
      <div className={cn("grid gap-6", compact ? "md:grid-cols-4" : "md:grid-cols-3 xl:grid-cols-5")}>
        {visiblePlans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "flex flex-col",
              plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : "glow-card"
            )}
          >
            <CardHeader>
              {plan.highlighted && (
                <span className="eyebrow mb-2 w-fit rounded-full border border-primary/40 px-2 py-0.5">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="flex items-baseline gap-1 pt-2">
                <span className="metric text-3xl font-semibold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.billingNote}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <PlanCta plan={plan} isAuthenticated={isAuthenticated} isProcessing={isProcessing} onCheckout={checkout} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PlanCta({
  plan,
  isAuthenticated,
  isProcessing,
  onCheckout,
}: {
  plan: Plan;
  isAuthenticated: boolean;
  isProcessing: boolean;
  onCheckout: (slug: NonNullable<Plan["slug"]>) => void;
}) {
  const variant = plan.highlighted ? "default" : "outline";

  if (plan.name === "Enterprise") {
    return (
      <Button className="w-full" variant={variant} asChild>
        <Link href="/company/contact">{plan.cta}</Link>
      </Button>
    );
  }
  if (!plan.slug) {
    return (
      <Button className="w-full" variant={variant} asChild>
        <Link href="/signup">{plan.cta}</Link>
      </Button>
    );
  }
  if (!isAuthenticated) {
    return (
      <Button className="w-full" variant={variant} asChild>
        <Link href={`/signup?plan=${plan.slug}`}>{plan.cta}</Link>
      </Button>
    );
  }
  return (
    <Button className="w-full" variant={variant} disabled={isProcessing} onClick={() => onCheckout(plan.slug!)}>
      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {plan.cta}
    </Button>
  );
}
