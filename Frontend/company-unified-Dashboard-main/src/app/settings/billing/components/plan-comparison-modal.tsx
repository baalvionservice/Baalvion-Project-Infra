"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PlanComparisonModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentPlan: string;
}

const pricingPlans = [
  {
    name: "Starter",
    price: 99,
    features: [
      "1 Business",
      "Up to 5 users",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: 299,
    features: [
      "Up to 5 Businesses",
      "25 users",
      "AI predictions",
      "Priority support",
      "Multi-currency",
    ],
  },
  {
    name: "Enterprise",
    price: 999,
    features: [
      "Unlimited businesses",
      "Unlimited users",
      "White-label",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];

export default function PlanComparisonModal({
  isOpen,
  onOpenChange,
  currentPlan,
}: PlanComparisonModalProps) {
  const { toast } = useToast();
  const [confirmingPlan, setConfirmingPlan] = useState<string | null>(null);

  const handleSelectPlan = (planName: string) => {
    if (planName === "Enterprise") {
      toast({
        title: "Contacting Sales",
        description: "Our sales team will be in touch with you shortly.",
      });
      onOpenChange(false);
    } else {
      setConfirmingPlan(planName);
    }
  };

  const handleConfirmChange = () => {
    toast({
      title: "Plan Updated!",
      description: `You have successfully changed to the ${confirmingPlan} plan.`,
    });
    setConfirmingPlan(null);
    onOpenChange(false);
  };

  const newPlanDetails = confirmingPlan
    ? pricingPlans.find((p) => p.name === confirmingPlan)
    : null;
  const currentPlanDetails = pricingPlans.find((p) => p.name === currentPlan);

  let proratedAmount = 0;
  if (newPlanDetails && currentPlanDetails) {
    const priceDifference = newPlanDetails.price - currentPlanDetails.price;
    // Assuming 15 days remaining in a 30 day month for simplicity
    const daysRemaining = 15;
    proratedAmount = (daysRemaining / 30) * priceDifference;
  }

  return (
    <>
      <Dialog open={isOpen && !confirmingPlan} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Your Plan</DialogTitle>
            <DialogDescription>
              Choose the plan that fits your growing needs.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "flex flex-col relative",
                  plan.name === currentPlan &&
                    "border-primary ring-2 ring-primary"
                )}
              >
                {plan.name === currentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Current Plan
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div>
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={plan.name === currentPlan}
                    onClick={() => handleSelectPlan(plan.name)}
                  >
                    {plan.name === "Enterprise"
                      ? "Contact Sales"
                      : `Switch to ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmingPlan}
        onOpenChange={() => setConfirmingPlan(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Plan Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to switch to the{" "}
              <strong>{newPlanDetails?.name}</strong> plan for{" "}
              <strong>${newPlanDetails?.price}/month</strong>.
              <br />
              <br />
              Your new plan will be effective immediately. A prorated amount of{" "}
              <strong>${proratedAmount.toFixed(2)}</strong> will be charged to
              your card on file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmingPlan(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
