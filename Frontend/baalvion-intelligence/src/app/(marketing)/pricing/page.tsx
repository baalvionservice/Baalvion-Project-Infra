import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";

import { PricingCards } from "@/components/pricing-cards";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { comparisonFeatures, plans } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for the Baalvion Intelligence news API — from Free to Enterprise.",
};

export default function PricingPage() {
  return (
    <div className="section-container section-y">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <span className="eyebrow mx-auto w-fit justify-center">Pricing</span>
        <h1>Simple pricing that scales with you</h1>
        <p>Start free. Upgrade when your agents, dashboards, or analysts need more signal.</p>
      </div>

      <PricingCards />

      <div className="mt-20">
        <h2 className="text-center">Compare plans</h2>
        <div className="glow-card mt-8 rounded-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                {plans.map((plan) => (
                  <TableHead key={plan.name}>{plan.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonFeatures.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium text-foreground">{row.label}</TableCell>
                  {plans.map((plan) => {
                    const value = row.plans[plan.name];
                    return (
                      <TableCell key={plan.name}>
                        {value === true ? (
                          <Check className="h-4 w-4 text-signal-positive" aria-hidden />
                        ) : value === false ? (
                          <Minus className="h-4 w-4 text-muted-foreground" aria-hidden />
                        ) : (
                          <span className="text-sm text-foreground">{value}</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
