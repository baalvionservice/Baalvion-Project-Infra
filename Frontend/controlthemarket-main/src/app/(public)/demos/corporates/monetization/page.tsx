
import { MonetizationDashboard } from "./monetization-dashboard";

const monetizationData = {
  subscription_plans: [
    { plan: "Basic", users: 10, features: ["Skill tests", "Candidate dashboard", "Limited analytics"], price: 200, billing: ["Monthly", "Annually"] },
    { plan: "Pro", users: 50, features: ["All Basic", "Live assessments", "Advanced analytics", "Candidate ranking"], price: 750, billing: ["Monthly", "Annually"] },
    { plan: "Enterprise", users: "100+", features: ["All Pro", "Custom branding", "API access", "Dedicated support"], price: "Custom", billing: ["Annual"] }
  ],
  current_subscription: {
    company: "TechNova Solutions",
    current_plan: "Pro",
    active_users: 35,
    features_enabled: ["All Basic", "Live assessments", "Advanced analytics", "Candidate ranking"],
    billing_cycle: "Monthly",
    next_renewal: "2026-04-01"
  },
  alerts: [
      "Your Pro plan is scheduled for renewal on April 1, 2026.",
      "You have used 70% of your active user seats."
  ]
};


export default function CorporatesMonetizationDemoPage() {
  return (
    <div className="flex-1 space-y-6 bg-muted/20 p-8 pt-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          Flexible Plans for Teams of All Sizes
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          This subscription panel allows corporates to view available plans, check their current usage, and upgrade or modify their plan as needed. Each plan is tailored to meet company size, assessment volume, and required analytics.
        </p>
      </div>

       <MonetizationDashboard data={monetizationData} />
    </div>
  );
}
