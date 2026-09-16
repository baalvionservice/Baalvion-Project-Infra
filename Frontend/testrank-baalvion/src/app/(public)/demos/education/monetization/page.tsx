
import { EducationMonetizationDashboard } from "./monetization-dashboard";

const monetizationData = {
  subscription_plans: [
    { plan: "Basic", students: 100, features: ["Assessment engine", "Reporting dashboard"], price: 300, billing: ["Semester", "Monthly"] },
    { plan: "Pro", students: 500, features: ["All Basic", "Live assessment", "Analytics", "Batch reports"], price: 1000, billing: ["Semester", "Monthly"] },
    { plan: "Enterprise", students: "500+", features: ["All Pro", "API integration", "Multi-campus access", "Custom reporting"], price: "Custom", billing: ["Annual"] }
  ],
  current_subscription: {
    institution: "Global Tech University",
    current_plan: "Pro",
    active_students: 350,
    features_enabled: ["All Basic", "Live assessment", "Analytics", "Batch reports"],
    billing_cycle: "Semester",
    next_renewal: "2026-06-01"
  },
  alerts: [
    "Your Pro plan is scheduled for renewal on June 1, 2026.",
    "You have used 70% of your active student seats.",
    "New feature 'AI Proctoring' is now available in the Enterprise plan."
  ]
};

export default function EducationMonetizationDemoPage() {
  return (
    <div className="flex-1 space-y-6 bg-muted/20 p-8 pt-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          Plans Built for Education
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Flexible, scalable subscription plans designed for educational institutions of all sizes. From individual bootcamps to multi-campus universities, find the right fit to empower your students and streamline your assessments.
        </p>
      </div>

       <EducationMonetizationDashboard data={monetizationData} />
    </div>
  );
}
