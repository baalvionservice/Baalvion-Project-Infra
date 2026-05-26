
import { ValuePropDashboard } from "./value-prop-dashboard";

const valuePropositionData = {
  live_assessments: [
    { candidate: "Riya Sharma", program: "National Skills Initiative", assessment: "Java Basics", status: "In Progress", score: 0, video_url: "https://mockvideo.com/riya1" },
    { candidate: "John Doe", program: "Tech Training Regional Program", assessment: "Data Analysis", status: "Completed", score: 92, video_url: "https://mockvideo.com/john1" },
    { candidate: "Akira Tanaka", program: "National Skills Initiative", assessment: "Java Basics", status: "Verified", score: 95, video_url: "https://mockvideo.com/akira1" },
    { candidate: "Maria Lopez", program: "UK Cyber Security", assessment: "Network Security", status: "Pending", score: 0, video_url: "https://mockvideo.com/maria1" },
    { candidate: "Liam Smith", program: "Tech Training Regional Program", assessment: "Cloud DevOps", status: "Completed", score: 88, video_url: "https://mockvideo.com/liam1" }
  ],
  dashboard_stats: {
    total_candidates: 96500,
    assessments_completed: 75200,
    average_score: 82,
    pass_fail_rates: { passed: 65174, failed: 10026, pending: 21300 },
    top_skills: { "Java": 18000, "Python": 15000, "Data Analysis": 22000, "Cyber Security": 8000, "Cloud Computing": 11000 }
  },
  alerts: [
    "150 assessments flagged for potential fraud.",
    "Batch completion report for 'Tech Training Regional Program' is ready for download.",
    "Top 100 performers in 'National Skills Initiative' identified for job matching."
  ]
};

export default function GovernmentValuePropDemoPage() {
  return (
    <div className="flex-1 space-y-6 bg-muted/20 p-8 pt-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          The Solution for Public Sector Skill Development
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          SkillMatch Pro offers a secure, scalable, and auditable platform to manage large-scale skill assessments, ensure compliance, and deliver measurable outcomes for government initiatives.
        </p>
      </div>

       <ValuePropDashboard data={valuePropositionData} />
    </div>
  );
}
