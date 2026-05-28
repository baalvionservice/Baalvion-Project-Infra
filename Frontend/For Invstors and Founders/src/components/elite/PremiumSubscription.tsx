import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionTier {
  name: string;
  price: number;
  currency?: string;
  benefits: string[];
}

interface PremiumSubscriptionProps {
  tiers: SubscriptionTier[];
}

export const PremiumSubscription = ({ tiers }: PremiumSubscriptionProps) => {
  const navigate = useNavigate();

  const handleSubscribe = (tierName: string) => {
    // Will integrate with Stripe later
    console.log("Subscribe to:", tierName);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {tiers.map((tier, index) => (
        <Card
          key={index}
          className={`p-6 flex flex-col ${
            index === 1 ? "border-primary shadow-lg scale-105" : ""
          }`}
        >
          <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
          <div className="mb-6">
            <span className="text-4xl font-bold">
              {tier.price === 0 ? "Free" : `$${tier.price}`}
            </span>
            {tier.price > 0 && (
              <span className="text-muted-foreground ml-2">/month</span>
            )}
          </div>
          <ul className="space-y-3 mb-6 flex-grow">
            {tier.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => handleSubscribe(tier.name)}
            variant={index === 1 ? "default" : "outline"}
            className="w-full"
          >
            {tier.price === 0 ? "Current Plan" : "Upgrade Now"}
          </Button>
        </Card>
      ))}
    </div>
  );
};
