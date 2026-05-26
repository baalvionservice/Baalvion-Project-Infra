import { ValuePropDashboard } from "./value-prop-dashboard";

const valuePropositionData = {
  live_assessments: [
    { student: "Riya Sharma", batch: "CS-2026", assessment: "Java Fundamentals", status: "In Progress", score: 0, video_url: "https://mockvideo.com/riya1" },
    { student: "John Doe", batch: "DS-2026", assessment: "Data Analysis", status: "Completed", score: 92, video_url: "https://mockvideo.com/john1" },
    { student: "Akira Tanaka", batch: "CS-2026", assessment: "Java Fundamentals", status: "Verified", score: 95, video_url: "https://mockvideo.com/akira1" },
    { student: "Maria Lopez", batch: "DES-2025", assessment: "UX Design Principles", status: "Pending", score: 0, video_url: "https://mockvideo.com/maria1" },
    { student: "Liam Smith", batch: "CS-2026", assessment: "Cloud DevOps", status: "Completed", score: 88, video_url: "https://mockvideo.com/liam1" }
  ],
  dashboard_stats: {
    total_students: 1200,
    assessments_completed: 450,
    average_score: 87,
    pass_fail_rates: { passed: 390, failed: 60, pending: 800 },
    top_skills: { Java: 45, Python: 38, "Data Analysis": 50, "UX Design": 25, "AWS": 18 }
  },
  alerts: [
    "12 assessments flagged for high plagiarism risk.",
    "Batch CS-2026 average score dropped by 5% this month.",
    "Top 5 performers in Data Analysis assessment identified."
  ]
};

export default function EducationValuePropDemoPage() {
  return (
    <div className="flex-1 space-y-6 bg-muted/20 p-8 pt-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          The Solution for Modern Education
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          SkillMatch Pro offers a secure, scalable, and data-driven platform to manage online assessments, ensure academic integrity, and issue credible, employer-trusted skill certifications. Explore how our features address the key challenges faced by educational institutions today.
        </p>
      </div>

       <ValuePropDashboard data={valuePropositionData} />
    </div>
  );
}
