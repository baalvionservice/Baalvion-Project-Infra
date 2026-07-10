import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { plans } from "@/lib/plans";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  const visiblePlans = compact ? plans.filter((plan) => plan.name !== "Enterprise") : plans;

  return (
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
            <Button
              className="w-full"
              variant={plan.highlighted ? "default" : "outline"}
              asChild
            >
              <Link href={plan.name === "Enterprise" ? "/company/contact" : "/signup"}>{plan.cta}</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
