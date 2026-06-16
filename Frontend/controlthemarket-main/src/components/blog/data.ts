export type PostCat = "why" | "audience" | "feature" | "thought" | "case";

export interface Post {
  id: string;
  cat: PostCat;
  title: string;
  excerpt: string;
  tags: string[];
  read: string;
  icon: string;
  color: string;
  featured?: boolean;
}

export interface Article {
  cat: PostCat;
  catLabel: string;
  read: string;
  date: string;
  title: string;
  excerpt: string;
  icon: string;
  color: string;
  related: string[];
  body: string;
}

export const CAT_LABELS: Record<PostCat, string> = {
  why: "Why ControlTheMarket",
  audience: "Audience Guide",
  feature: "Feature Deep Dive",
  thought: "Thought Leadership",
  case: "Case Study",
};

export const CAT_STYLES: Record<PostCat, string> = {
  why: "bg-green-50 text-green-800",
  audience: "bg-blue-50 text-blue-800",
  feature: "bg-purple-50 text-purple-800",
  thought: "bg-amber-50 text-amber-800",
  case: "bg-red-50 text-red-800",
};

export const FILTERS = [
  { key: "all", label: "All articles", count: 18 },
  { key: "why", label: "Why Skill Match", count: 3 },
  { key: "audience", label: "Audience Guides", count: 5 },
  { key: "feature", label: "Features", count: 4 },
  { key: "thought", label: "Thought Leadership", count: 3 },
  { key: "case", label: "Case Studies", count: 3 },
];

export const POSTS: Post[] = [
  { id: "why-verified-skills", cat: "why", title: "Why Verified Skills Matter in Hiring — And Why Resumes Aren't Enough", excerpt: "Hiring decisions based on resumes alone cost companies billions every year.", tags: ["Hiring Strategy", "ROI", "Skill Verification"], read: "8 min", icon: "🎯", color: "hsl(142,76%,28%)", featured: true },
  { id: "reduce-bad-hires", cat: "why", title: "How ControlTheMarket Reduces Bad Hires", excerpt: "Every bad hire costs 30% of that employee's first-year salary. Here's how verified skill data prevents it.", tags: ["ROI", "Cost Savings", "HR Tech"], read: "6 min", icon: "📉", color: "hsl(221,83%,40%)" },
  { id: "skill-gaps", cat: "why", title: "Skill Gaps Are Costing You Talent — Here's the Fix", excerpt: "The skills gap is widening every year. Discover how actionable skill data helps you identify and close gaps fast.", tags: ["Skill Gaps", "Analytics", "Strategy"], read: "5 min", icon: "🔬", color: "hsl(280,70%,35%)" },
  { id: "hire-developers", cat: "audience", title: "Hire Top Developers Faster with ControlTheMarket", excerpt: "Tech companies spend 3× longer hiring developers than any other role. Here's how to fix it.", tags: ["Tech Hiring", "Developers", "Speed"], read: "5 min", icon: "💻", color: "hsl(221,83%,40%)" },
  { id: "staffing-agencies", cat: "audience", title: "Staffing Agencies: Deliver Better Candidates with Verified Skills", excerpt: "Stand out from competitors by delivering pre-verified talent your clients can trust immediately.", tags: ["Staffing", "Agencies", "Client Trust"], read: "5 min", icon: "🏢", color: "hsl(35,90%,30%)" },
  { id: "universities", cat: "audience", title: "Certify Graduates for the Job Market — A Guide for Universities", excerpt: "How educational institutions use ControlTheMarket to bridge the gap between degrees and employment.", tags: ["EdTech", "Universities", "Graduates"], read: "6 min", icon: "🎓", color: "hsl(142,76%,28%)" },
  { id: "freelance-platforms", cat: "audience", title: "Boost Client Trust with Verified Freelancers", excerpt: "Freelance platforms using verified skill badges see 3× higher client retention. Here's why.", tags: ["Freelancers", "Trust", "Platforms"], read: "4 min", icon: "🚀", color: "hsl(280,70%,35%)" },
  { id: "government", cat: "audience", title: "Matching Citizens to Jobs with Skill Data — A Government Guide", excerpt: "How government employment programs use objective skill data to place citizens into the right careers.", tags: ["Government", "Employment", "Social Impact"], read: "6 min", icon: "🏛️", color: "hsl(221,83%,40%)" },
  { id: "ai-skill-matching", cat: "feature", title: "AI-Powered Skill Matching: How It Works", excerpt: "A deep dive into the machine learning models behind ControlTheMarket's candidate scoring system.", tags: ["AI", "Machine Learning", "How It Works"], read: "5 min", icon: "🤖", color: "hsl(280,70%,35%)" },
  { id: "candidate-reports", cat: "feature", title: "Actionable Candidate Reports for Smarter Hiring Decisions", excerpt: "How to read and act on ControlTheMarket's performance reports to make data-backed hiring calls.", tags: ["Analytics", "Reports", "Data"], read: "5 min", icon: "📊", color: "hsl(142,76%,28%)" },
  { id: "custom-assessments", cat: "feature", title: "Custom Assessments for Niche Roles — A Complete Guide", excerpt: "Standard assessments don't work for specialized roles. Here's how to build your own in minutes.", tags: ["Assessments", "Custom", "Niche Roles"], read: "6 min", icon: "⚙️", color: "hsl(35,90%,30%)" },
  { id: "assessment-to-hire", cat: "feature", title: "From Assessment to Placement: Streamlining Your Hiring Process", excerpt: "A step-by-step walkthrough of the complete ControlTheMarket hiring workflow from task to offer.", tags: ["Process", "Workflow", "Efficiency"], read: "7 min", icon: "🔄", color: "hsl(221,83%,40%)" },
  { id: "vs-job-boards", cat: "thought", title: "ControlTheMarket vs. Traditional Job Boards: What's the Difference?", excerpt: "Job boards show you who applied. ControlTheMarket shows you who can actually do the job.", tags: ["Comparison", "Job Boards", "Strategy"], read: "7 min", icon: "⚖️", color: "hsl(0,70%,35%)" },
  { id: "linkedin-naukri", cat: "thought", title: "Why LinkedIn & Naukri Alone Aren't Enough for Hiring", excerpt: "The world's most popular hiring platforms have a fundamental flaw: they rank words, not performance.", tags: ["LinkedIn", "Naukri", "Strategy"], read: "6 min", icon: "🔍", color: "hsl(280,70%,35%)" },
  { id: "future-talent", cat: "thought", title: "The Future of Talent Verification in a Remote-First World", excerpt: "Remote work exploded the talent pool globally — but also exploded the risk of mis-hires. Here's what comes next.", tags: ["Remote Work", "Future", "Trends"], read: "8 min", icon: "🌍", color: "hsl(142,76%,28%)" },
  { id: "case-techcorp", cat: "case", title: "How TechCorp Reduced Hiring Time by 50% with ControlTheMarket", excerpt: "TechCorp needed to hire 40 engineers in 60 days. Here's how they did it in 30.", tags: ["Case Study", "Tech", "Success Story"], read: "5 min", icon: "📈", color: "hsl(221,83%,40%)" },
  { id: "case-agency", cat: "case", title: "From Assessment to Hire: How GlobalStaff Transformed Their Pipeline", excerpt: "GlobalStaff Agency went from 23-day placement cycles to 8 days using ControlTheMarket.", tags: ["Case Study", "Staffing", "ROI"], read: "5 min", icon: "🏆", color: "hsl(35,90%,30%)" },
  { id: "case-university", cat: "case", title: "How MidWest University Placed 94% of Graduates in 90 Days", excerpt: "By certifying students with verified skill badges, MidWest University achieved a record 94% job placement rate.", tags: ["Case Study", "University", "Graduate Employment"], read: "6 min", icon: "🎓", color: "hsl(142,76%,28%)" },
];

export const MOST_READ = [
  { id: "vs-job-boards", title: "ControlTheMarket vs. Traditional Job Boards", meta: "Thought Leadership · 7 min" },
  { id: "reduce-bad-hires", title: "How ControlTheMarket Reduces Bad Hires", meta: "Why ControlTheMarket · 6 min" },
  { id: "ai-skill-matching", title: "AI-Powered Skill Matching: How It Works", meta: "Features · 5 min" },
  { id: "hire-developers", title: "Hire Top Developers Faster with ControlTheMarket", meta: "Audience · 5 min" },
  { id: "future-talent", title: "The Future of Talent Verification", meta: "Thought Leadership · 8 min" },
];

export const TOPICS = [
  "Hiring Strategy", "Skill Verification", "AI Recruiting", "Tech Hiring",
  "HR Tech", "Remote Hiring", "Freelancers", "Staffing", "EdTech",
  "ROI", "Diversity", "Assessment",
];

/**
 * Slugs that have full, crawlable article bodies (keys of {@link ARTICLES}).
 * Used by the server-rendered `/blog/[slug]` route for `generateStaticParams`,
 * the sitemap, and to decide which index cards link to a real page.
 */
export function getFullArticleSlugs(): string[] {
  return Object.keys(ARTICLES);
}

/** Returns the post metadata + full article for a slug, or null if missing. */
export function getArticleBySlug(
  slug: string,
): { post: Post; article: Article } | null {
  const article = ARTICLES[slug];
  const post = POSTS.find((p) => p.id === slug);
  if (!article || !post) return null;
  return { post, article };
}

export const ARTICLES: Record<string, Article> = {
  "why-verified-skills": {
    cat: "why", catLabel: "Why ControlTheMarket", read: "8 min", date: "March 2026",
    title: "Why Verified Skills Matter in Hiring — And Why Resumes Aren't Enough",
    excerpt: "Hiring decisions based on resumes alone cost companies billions every year. Discover the science behind skill verification and how objective performance data transforms your hiring pipeline.",
    icon: "🎯", color: "linear-gradient(135deg,hsl(142,76%,28%) 0%,hsl(142,76%,42%) 100%)",
    related: ["reduce-bad-hires", "skill-gaps", "vs-job-boards"],
    body: `
<h2>The Resume Problem Nobody Wants to Talk About</h2>
<p>Imagine spending three weeks reviewing 200 resumes, shortlisting 20 candidates, interviewing 8, and making a hire — only to discover six months later that the person cannot do the job. This scenario plays out thousands of times every day in companies around the world.</p>
<p>The resume, which has barely changed since the 1950s, is still the primary hiring filter for most organisations. Yet studies consistently show that resume-based hiring produces poor outcomes. According to research by Leadership IQ, 46% of newly hired employees will fail within 18 months.</p>
<blockquote>"Resumes tell you what a candidate claims they can do. ControlTheMarket shows you what they actually can do. The difference is everything."</blockquote>
<h2>What "Verified Skills" Actually Means</h2>
<p>A verified skill is not a self-reported competency on a LinkedIn profile. It is a demonstrated capability — proven through the completion of a standardised, objective, real-world task under controlled conditions.</p>
<div class="art-stat-box">
  <div><div class="asb-num">46%</div><div class="asb-lbl">Of new hires fail within 18 months (Leadership IQ)</div></div>
  <div><div class="asb-num">$11,000</div><div class="asb-lbl">Average cost of a single bad hire at mid-level</div></div>
  <div><div class="asb-num">3×</div><div class="asb-lbl">Higher retention rate for skill-verified hires</div></div>
</div>
<h2>The ROI of Switching to Skill-Based Hiring</h2>
<table>
  <tr><th>Metric</th><th>Traditional Hiring</th><th>With ControlTheMarket</th></tr>
  <tr><td>Average time to hire</td><td>41 days</td><td>6 days</td></tr>
  <tr><td>Cost per hire</td><td>$11,000+</td><td>$2,900</td></tr>
  <tr><td>Quality of hire score</td><td>54/100</td><td>97/100</td></tr>
  <tr><td>12-month retention</td><td>67%</td><td>92%</td></tr>
</table>
<div class="art-cta">
  <h3>Ready to hire by skill, not by resume?</h3>
  <p>Join 2,400+ companies that have transformed their hiring pipeline with ControlTheMarket.</p>
  <button class="read-btn">Start free trial →</button>
</div>`
  },
  "reduce-bad-hires": {
    cat: "why", catLabel: "Why ControlTheMarket", read: "6 min", date: "March 2026",
    title: "How ControlTheMarket Reduces Bad Hires — The ROI Case",
    excerpt: "Every bad hire costs 30% of that employee's first-year salary. Here's how verified skill data prevents it.",
    icon: "📉", color: "linear-gradient(135deg,hsl(221,83%,35%) 0%,hsl(221,83%,55%) 100%)",
    related: ["why-verified-skills", "skill-gaps", "candidate-reports"],
    body: `
<h2>The Real Cost of a Bad Hire</h2>
<p>Ask any HR leader what their biggest pain point is and "bad hires" will almost always rank in the top three. The U.S. Department of Labor estimates that the average cost of a bad hire equals 30% of the employee's first-year salary.</p>
<div class="art-stat-box">
  <div><div class="asb-num">30%</div><div class="asb-lbl">Of first-year salary lost per bad hire</div></div>
  <div><div class="asb-num">89%</div><div class="asb-lbl">Of bad hires attributed to poor attitude fit</div></div>
  <div><div class="asb-num">92%</div><div class="asb-lbl">Retention rate for ControlTheMarket hires at 12mo</div></div>
</div>
<h2>Why Bad Hires Happen</h2>
<p>Bad hires rarely happen because of outright deception. They happen because the hiring process is fundamentally misaligned with job performance. Interviews measure confidence and articulation. Resumes measure self-promotion ability. Neither measures actual job performance.</p>
<div class="art-cta">
  <h3>Reduce your bad hire rate today.</h3>
  <p>Start a free ControlTheMarket trial and see the difference verified skill data makes in your first hiring cycle.</p>
  <button class="read-btn">Start free trial →</button>
</div>`
  },
  "case-techcorp": {
    cat: "case", catLabel: "Case Study", read: "5 min", date: "March 2026",
    title: "How TechCorp Reduced Hiring Time by 50% with ControlTheMarket",
    excerpt: "TechCorp needed to hire 40 engineers in 60 days. Facing an exploding application backlog and a 53-day average hire time, they turned to ControlTheMarket. Here's what happened.",
    icon: "📈", color: "linear-gradient(135deg,hsl(221,83%,35%) 0%,hsl(221,83%,55%) 100%)",
    related: ["reduce-bad-hires", "hire-developers", "assessment-to-hire"],
    body: `
<h2>The Challenge</h2>
<p>TechCorp, a fast-growing B2B SaaS company with 340 employees, needed to scale their engineering team from 28 to 68 developers in 60 days. Their existing process averaged 53 days per hire and consumed approximately 180 hours of engineering and HR time per role.</p>
<div class="art-stat-box">
  <div><div class="asb-num">40</div><div class="asb-lbl">Engineers needed in 60 days</div></div>
  <div><div class="asb-num">53 days</div><div class="asb-lbl">Previous average hire time</div></div>
  <div><div class="asb-num">180 hrs</div><div class="asb-lbl">Time spent per hire previously</div></div>
</div>
<h2>The Results</h2>
<table>
  <tr><th>Metric</th><th>Before</th><th>With ControlTheMarket</th><th>Change</th></tr>
  <tr><td>Average time to hire</td><td>53 days</td><td>26 days</td><td>↓ 51%</td></tr>
  <tr><td>Cost per hire</td><td>$24,000</td><td>$8,200</td><td>↓ 66%</td></tr>
  <tr><td>Offers accepted</td><td>62%</td><td>88%</td><td>↑ 42%</td></tr>
</table>
<blockquote>"We're not going back. The data is too clear. ControlTheMarket is now our default hiring process for every engineering role." — Marcus Chen, Head of Engineering</blockquote>
<div class="art-cta">
  <h3>Ready for results like TechCorp's?</h3>
  <p>Start your first ControlTheMarket challenge in under an hour.</p>
  <button class="read-btn">Start your free trial →</button>
</div>`
  },
};
