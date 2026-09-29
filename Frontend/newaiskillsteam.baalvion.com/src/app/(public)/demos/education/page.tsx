import { EducationDashboard } from "./education-dashboard";

const educationalInstitutionsData = {
  institutions: [
    { "name": "Global Tech University", "type": "University", "location": "Bangalore, India", "students": 1200, "pain_points": ["Remote exam integrity", "Grading delays"] },
    { "name": "CodeCamp Online", "type": "Online Learning", "location": "San Francisco, USA", "students": 500, "pain_points": ["Batch tracking", "Certification standardization"] },
    { "name": "National Business College", "type": "College", "location": "London, UK", "students": 800, "pain_points": ["Inconsistent grading", "Lack of practical skills"] },
    { "name": "Data Science Institute", "type": "Bootcamp", "location": "Toronto, Canada", "students": 300, "pain_points": ["Manual assessments", "Cheating concerns"] },
    { "name": "Innovate Design School", "type": "Online Learning", "location": "Berlin, Germany", "students": 450, "pain_points": ["Subjective grading", "Portfolio verification"] },
    { "name": "Public Service Training Academy", "type": "Government", "location": "New Delhi, India", "students": 2500, "pain_points": ["Scalability", "Compliance tracking"] },
    { "name": "Pacific Coast University", "type": "University", "location": "Sydney, Australia", "students": 1500, "pain_points": ["Manual grading", "Batch management"] },
    { "name": "SkillUp Bootcamp", "type": "Bootcamp", "location": "Remote", "students": 600, "pain_points": ["Student engagement", "Verified outcomes"] },
    { "name": "FutureMinds College", "type": "College", "location": "Singapore", "students": 1000, "pain_points": ["Exam security", "Time-consuming evaluations"] },
    { "name": "LearnSphere", "type": "Online Learning", "location": "Remote", "students": 10000, "pain_points": ["Standardization at scale", "Credential value"] }
  ],
  dashboard_stats: {
    total_institutions: 10,
    total_students: 18850,
    pending_exams: 3,
    suspicious_activity_flags: 8
  },
  alerts: [
    "8 exams flagged for suspicious activity this week.",
    "Global Tech University has 3 batches with delayed grade reports.",
    "CodeCamp Online student limit reaching 90%."
  ]
};

export default function EducationTargetDemoPage() {
  return (
    <div className="flex-1 space-y-6 bg-muted/20 p-8 pt-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          The Challenge for Modern Education
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Educational institutions face unprecedented challenges in verifying skills at scale. From ensuring academic integrity in remote exams to managing and grading thousands of students efficiently, the need for a robust, data-driven platform is critical. This dashboard visualizes these pain points across different types of institutions.
        </p>
      </div>

       <EducationDashboard data={educationalInstitutionsData} />
    </div>
  );
}
