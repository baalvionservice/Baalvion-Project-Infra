import { PremiumSubscription } from "@/components/elite/PremiumSubscription";
import MainLayout from "@/components/layout/MainLayout";
import { Crown } from "lucide-react";

const ElitePremium = () => {
  const subscriptionTiers = [
    {
      name: "Verified Member",
      price: 0,
      benefits: [
        "Access to all standard forums",
        "Create threads & replies",
        "Upvote, bookmark, follow",
        "Basic analytics dashboard",
      ],
    },
    {
      name: "Founder Tier",
      price: 299,
      currency: "USD",
      benefits: [
        "All Verified Member benefits",
        "Access to private circles",
        "Create confidential threads",
        "Priority AI recommendations",
        "Direct invites to elite events",
        "Founder badge on profile",
      ],
    },
    {
      name: "Investor/Partner Tier",
      price: 499,
      currency: "USD",
      benefits: [
        "All Founder Tier benefits",
        "1:1 introductions with other Founders",
        "Advanced analytics & trend reports",
        "Sponsor opportunities",
        "Early access to new features",
        "Investor badge on profile",
        "Priority support",
      ],
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Elite Membership Plans</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the plan that best fits your needs and unlock exclusive
              features, connections, and insights.
            </p>
          </div>

          <PremiumSubscription tiers={subscriptionTiers} />
        </div>
      </div>
    </MainLayout>
  );
};

export default ElitePremium;
