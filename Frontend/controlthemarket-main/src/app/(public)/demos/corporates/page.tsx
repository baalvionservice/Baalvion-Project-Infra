import { CorporateDashboard } from "./corporate-dashboard";

// Data based on PROMPT 2
const valuePropositionData = {
    live_assessments: [
        { id: 'cand-1', candidate: "Riya Sharma", task: "Java Coding Test", status: "In Progress", video_url: "https://mockvideo.com/riya1" },
        { id: 'cand-2', candidate: "John Doe", task: "Data Analysis Case", status: "Completed", video_url: "https://mockvideo.com/john1" },
        { id: 'cand-3', candidate: "Akira Tanaka", task: "Product Design Challenge", status: "Verified", video_url: "https://mockvideo.com/akira1" },
        { id: 'cand-4', candidate: "Maria Lopez", task: "UX Design Review", status: "Pending", video_url: "https://mockvideo.com/maria1" },
        { id: 'cand-5', candidate: "Liam Smith", task: "Cloud DevOps Scenario", status: "Completed", video_url: "https://mockvideo.com/liam1" }
    ],
    dashboard_stats: {
        open_positions: 12,
        pending_assessments: 5,
        top_skills: { "Java": 4, "Python": 3, "Data Analysis": 5, "React": 7, "AWS": 2 },
        candidate_rankings: [
            { name: "John Doe", score: 92 },
            { name: "Ethan Brown", score: 95 },
            { name: "Liam Smith", score: 88 }
        ]
    },
    alerts: [
        "3 candidates failed live assessment",
        "5 assessments pending review",
        "Top 2 performers identified for promotion"
    ],
    chartData: {
        assessmentResults: [
            { name: 'Completed', value: 2 },
            { name: 'Verified', value: 1 },
            { name: 'In Progress', value: 1 },
            { name: 'Pending', value: 1 },
        ],
        topSkills: [
            { name: 'Java', value: 4 },
            { name: 'Python', value: 3 },
            { name: 'Data Analysis', value: 5 },
            { name: 'React', value: 7 },
            { name: 'AWS', value: 2 },
        ],
        candidateActivity: [
            { name: 'Week 1', value: 5 },
            { name: 'Week 2', value: 8 },
            { name: 'Week 3', value: 7 },
            { name: 'Week 4', value: 10 },
        ]
    }
};

export default function CorporatesValuePropDemoPage() {
  return (
    <div className="flex-1 space-y-6 bg-muted/20 p-8 pt-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          The Solution for Modern Corporate Hiring
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Traditional hiring is slow, biased, and unreliable. ControlTheMarket solves these pain points by providing a centralized platform for real-time, verified skill assessments with data-driven insights. See how it works below.
        </p>
      </div>

       <CorporateDashboard data={valuePropositionData} />
    </div>
  );
}
