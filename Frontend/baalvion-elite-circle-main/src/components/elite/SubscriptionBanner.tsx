import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionBannerProps {
  message?: string;
  ctaText?: string;
  navigateTo?: string;
}

export const SubscriptionBanner = ({
  message = "Upgrade to Founder or Investor tier to unlock private circles, confidential threads, and premium insights.",
  ctaText = "Upgrade Now",
  navigateTo = "/elite/premium",
}: SubscriptionBannerProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
              Unlock Premium Features
              <Sparkles className="h-4 w-4 text-primary" />
            </h3>
            <p className="text-muted-foreground text-sm">{message}</p>
          </div>
        </div>
        <Button onClick={() => navigate(navigateTo)} size="lg">
          {ctaText}
        </Button>
      </div>
    </Card>
  );
};
