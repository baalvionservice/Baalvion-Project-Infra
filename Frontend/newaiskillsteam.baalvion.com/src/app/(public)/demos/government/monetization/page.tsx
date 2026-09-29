
import { GovernmentMonetizationDashboard } from "./monetization-dashboard";

const monetizationData = {
  subscription_plans: [
    { plan: "Pilot", candidates: 500, features: ["Assessment engine", "Reports"], price: 2000, billing: ["Annual"] },
    { plan: "Program", candidates: 5000, features: ["All Pilot", "Live sessions", "Analytics", "Dashboards"], price: 15000, billing: ["Annual"] },
    { plan: "National", candidates: "20,000+", features: ["All Program", "API integration", "Dedicated support", "Custom features"], price: "Custom", billing: ["Multi-Year"] }
  ],
  current_subscription: {
    program: "National Skills Initiative",
    current_plan: "Program",
    active_candidates: 4500,
    features_enabled: ["All Pilot", "Live sessions", "Analytics", "Dashboards"],
    billing_cycle: "Annual",
    next_renewal: "2026-07-01"
  },
  alerts: [
    "Your Program plan is scheduled for renewal on July 1, 2026.",
    "You have used 90% of your active candidate seats.",
    "A new 'Advanced Compliance' module is available for National plans."
  ]
};

export default function GovernmentMonetizationDemoPage() {
  return (
    <div className="flex-1 space-y-6 bg-muted/20 p-8 pt-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          Plans for Public Sector Scale
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Transparent, scalable pricing designed for government skill development programs. From regional pilots to national initiatives, find a plan that meets your compliance and reporting needs.
        </p>
      </div>

       <GovernmentMonetizationDashboard data={monetizationData} />
    </div>
  );
}
