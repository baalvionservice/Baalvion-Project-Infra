
import { GovernmentDashboard } from "./government-dashboard";

const governmentProgramsData = {
  programs: [
    { "name": "National Skills Initiative", "type": "National", "location": "India", "candidates": 20000, "pain_points": ["Large-scale assessments", "Secure verification"] },
    { "name": "Tech Training Regional Program", "type": "Regional", "location": "Bangalore, India", "candidates": 5000, "pain_points": ["Compliance reporting", "Audit accountability"] },
    { "name": "Digital Workforce Fund", "type": "National", "location": "USA", "candidates": 15000, "pain_points": ["Fraud prevention", "Outcome tracking"] },
    { "name": "State of Bavaria IT Upskilling", "type": "Regional", "location": "Munich, Germany", "candidates": 7500, "pain_points": ["Standardization", "Grading consistency"] },
    { "name": "UK National Cyber Security Program", "type": "National", "location": "UK", "candidates": 10000, "pain_points": ["Secure environments", "Performance metrics"] },
    { "name": "Ontario Works Tech Program", "type": "Regional", "location": "Toronto, Canada", "candidates": 3000, "pain_points": ["Batch management", "Reporting overhead"] },
    { "name": "Australia Digital Taskforce", "type": "National", "location": "Australia", "candidates": 18000, "pain_points": ["Large-scale assessments", "Audit trails"] },
    { "name": "Singapore Smart Nation Scholarship", "type": "National", "location": "Singapore", "candidates": 2000, "pain_points": ["Elite talent identification", "Secure verification"] },
    { "name": "Western Cape Skills Fund", "type": "Regional", "location": "Cape Town, South Africa", "candidates": 4000, "pain_points": ["Compliance reporting", "Fraud prevention"] },
    { "name": "Nordic Digital Skills Partnership", "type": "Regional", "location": "Scandinavia", "candidates": 12000, "pain_points": ["Cross-border standards", "Secure verification"] }
  ],
  dashboard_stats: {
    total_programs: 10,
    total_candidates: 96500,
    pending_assessments: 1250,
    compliance_flags: 15
  },
  alerts: [
    "National Skills Initiative has 1500 assessments pending review.",
    "Quarterly compliance report for Tech Training Regional Program is due in 3 days.",
    "Suspicious activity flagged in 15 assessments for the UK Cyber Security Program."
  ]
};

export default function GovernmentTargetDemoPage() {
  return (
    <div className="flex-1 space-y-6 bg-muted/20 p-8 pt-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          The Challenge of Scaling National Skill Programs
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Government and public-sector initiatives face unique hurdles in managing large-scale assessments, ensuring compliance, and verifying skills securely. This dashboard highlights these critical pain points across various programs.
        </p>
      </div>
      <GovernmentDashboard data={governmentProgramsData} />
    </div>
  );
}
