

import type { User, Company, Task, Submission, Evaluation, TaskTemplate, SubmissionContentType, EvaluationSchema, Activity, Notification, TestCase, GitHubRepository, Webhook, WebhookTriggerLog, Team, ApiIntegration, IntegrationLog, SystemMetric, ServiceStatus, SystemLog, LogSeverity, SystemError, SystemIncident, ServiceLoad, ScalingEvent, AutoScalingStatus, Invoice, InvoiceStatus, PlanUsage, UsageMetric, RevenueMetric, PlanDistribution, RevenueSource, Plan, Subscription, Badge } from './types';

export const mockBadges: Badge[] = [
  {
    id: 'badge-1',
    name: 'Top 10 Performer',
    description: 'Achieved a ranking in the top 10% of all candidates.',
    icon: 'Trophy',
    rarity: 'Elite',
  },
  {
    id: 'badge-2',
    name: 'Verified Talent',
    description: 'Manually verified by the SkillMatch Pro team for exceptional skill.',
    icon: 'ShieldCheck',
    rarity: 'Elite',
  },
  {
    id: 'badge-3',
    name: 'Quick Starter',
    description: 'Completed the first assigned task within 24 hours.',
    icon: 'Rocket',
    rarity: 'Rare',
  },
  {
    id: 'badge-4',
    name: 'Specialist',
    description: 'Completed 5 tasks within the same role category.',
    icon: 'Award',
    rarity: 'Rare',
  },
  {
    id: 'badge-5',
    name: 'Problem Solver',
    description: 'Achieved a score of 90+ on a task of Advanced or Expert difficulty.',
    icon: 'BrainCircuit',
    rarity: 'Common',
  },
];

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alice Candidate',
    email: 'alice@example.com',
    role: 'candidate',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    isActive: true,
    isVerified: true,
    consentAccepted: true, // User has accepted consent
    consentAcceptedAt: new Date(new Date().setDate(new Date().getDate() - 29)).toISOString(),
    candidateOnboardingCompleted: true,
    profile: {
      avatarUrl: 'https://picsum.photos/seed/avatar1/100/100',
      bio: 'Aspiring frontend developer with a passion for React.',
      location: 'San Francisco, CA',
      experienceLevel: 'Intermediate',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      githubUrl: 'https://github.com/alice-candidate',
      linkedinUrl: 'https://linkedin.com/in/alice-candidate',
      badgeIds: ['badge-1', 'badge-3', 'badge-5'],
    },
    candidatePerformance: {
      completedTasks: 2,
      averageScore: 92,
      ranking: 15,
    },
  },
  {
    id: 'user-2',
    name: 'Bob Company',
    email: 'bob@techcorp.com',
    role: 'company',
    companyRole: 'owner',
    companyId: 'company-1',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString(),
    isActive: true,
    isVerified: true,
    onboardingCompleted: true, // User has completed onboarding
    profile: {
      avatarUrl: 'https://picsum.photos/seed/avatar2/100/100',
      bio: 'Hiring manager at TechCorp.',
    },
  },
  {
    id: 'user-3',
    name: 'Charlie Admin',
    email: 'charlie@skillmatch.pro',
    role: 'admin',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 120)).toISOString(),
    isActive: true,
    isVerified: true,
    profile: {
      avatarUrl: 'https://picsum.photos/seed/avatar3/100/100',
    },
  },
  {
    id: 'user-4',
    name: 'Diana Developer',
    email: 'diana@example.com',
    role: 'candidate',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    isActive: true, // Changed for testing
    isVerified: true,
    consentAccepted: true,
    consentAcceptedAt: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(),
    candidateOnboardingCompleted: true,
    profile: {
      avatarUrl: 'https://picsum.photos/seed/avatar4/100/100',
      bio: 'Full-stack engineer with 5 years of experience.',
      location: 'New York, NY',
      experienceLevel: 'Advanced',
      skills: ['Node.js', 'Python', 'GraphQL', 'AWS'],
      githubUrl: 'https://github.com/diana-dev',
      linkedinUrl: 'https://linkedin.com/in/diana-dev',
      badgeIds: ['badge-2', 'badge-4'],
    },
    candidatePerformance: {
      completedTasks: 1,
      averageScore: 88,
      ranking: 23,
    },
  },
  {
    id: 'user-5',
    name: 'Ethan Employer',
    email: 'ethan@innovate.io',
    role: 'company',
    companyRole: 'owner',
    companyId: 'company-2',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(),
    isActive: true,
    isVerified: true,
    onboardingCompleted: false,
    profile: {
      avatarUrl: 'https://picsum.photos/seed/avatar5/100/100',
      bio: 'Lead Recruiter at Innovate Inc.',
    },
  },
  {
    id: 'user-6',
    name: 'Frank Recruiter',
    email: 'frank@techcorp.com',
    role: 'company',
    companyRole: 'admin',
    companyId: 'company-1',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    isActive: true,
    isVerified: true,
    onboardingCompleted: true,
    profile: {
      avatarUrl: 'https://picsum.photos/seed/avatar6/100/100',
    },
  },
    {
    id: 'user-7',
    name: 'Grace Engineer',
    email: 'grace@techcorp.com',
    role: 'company',
    companyRole: 'member',
    companyId: 'company-1',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString(),
    isActive: true,
    isVerified: true,
    onboardingCompleted: true,
    profile: {
      avatarUrl: 'https://picsum.photos/seed/avatar7/100/100',
    },
  },
    {
    id: 'user-8',
    name: 'Heidi HR',
    email: 'heidi@innovate.io',
    role: 'company',
    companyRole: 'member',
    companyId: 'company-2',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 18)).toISOString(),
    isActive: true,
    isVerified: true,
    onboardingCompleted: true,
    profile: {
      avatarUrl: 'https://picsum.photos/seed/avatar8/100/100',
    },
  },
  {
    id: 'user-9',
    name: 'Ivy Innovator',
    email: 'ivy@example.com',
    role: 'candidate',
    createdAt: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString(),
    isActive: true,
    isVerified: true,
    consentAccepted: true,
    candidateOnboardingCompleted: true,
    profile: {
        avatarUrl: 'https://picsum.photos/seed/avatar9/100/100',
        bio: 'Creative designer focused on user experience.',
        experienceLevel: 'Intermediate',
    }
  },
  {
    id: 'user-10',
    name: 'Baalvion Admin',
    email: 'admin@baalvion.inc',
    role: 'company',
    companyRole: 'owner',
    companyId: 'company-3',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    isActive: true,
    isVerified: true,
    onboardingCompleted: true,
    profile: {
      avatarUrl: 'https://picsum.photos/seed/avatar10/100/100',
    },
  },
];

export const mockCompanies: Company[] = [
  {
    id: 'company-1',
    name: 'TechCorp',
    description: 'A leading innovator in cloud solutions.',
    ownerId: 'user-2',
    domains: [
      { name: 'techcorp.com', verified: true, purpose: 'Primary Website' },
      { name: 'app.techcorp.com', verified: true, purpose: 'App Backend' }
    ],
    logoUrl: 'https://picsum.photos/seed/company1/100/100',
    industry: 'Technology',
    location: 'Silicon Valley, CA',
    country: 'United States',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString(),
    isActive: true,
    isVerified: true,
    verificationDocs: {
        country: 'United States',
        documents: [
            { name: 'Articles of Incorporation', url: '/mock-uploads/articles.pdf' },
            { name: 'EIN Confirmation Letter', url: '/mock-uploads/ein.pdf' },
        ]
    }
  },
  {
    id: 'company-2',
    name: 'Innovate Inc.',
    description: 'Building the future of decentralized applications.',
    ownerId: 'user-5',
    domains: [
      { name: 'innovate.io', verified: true, purpose: 'Primary Website' },
    ],
    logoUrl: 'https://picsum.photos/seed/company2/100/100',
    industry: 'FinTech',
    location: 'New York, NY',
    country: 'United States',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(),
    isActive: true,
    isVerified: false,
  },
  {
    id: 'company-3',
    name: 'Baalvion Inc.',
    description: 'A next-generation institutional Investor Relations Platform.',
    ownerId: 'user-10',
    domains: [
        { name: 'baalvion.com', verified: true, purpose: 'Primary Website' },
        { name: 'app.baalvion.com', verified: true, purpose: 'App Backend' },
        { name: 'invest.baalvion.com', verified: false, purpose: 'Investor Portal' },
    ],
    logoUrl: 'https://picsum.photos/seed/company3/100/100',
    industry: 'Financial Services',
    location: 'New York, NY',
    country: 'United States',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    isActive: true,
    isVerified: true,
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Build a Responsive Navbar Component',
    description: 'The goal of this task is to create a reusable and responsive navigation bar for a modern web application.',
    instructions: '<ol><li>Use React and Tailwind CSS.</li><li>The navbar should have a logo, navigation links, and a call-to-action button.</li><li>It must collapse into a hamburger menu on mobile screens (under 768px).</li><li>The state of the mobile menu (open/closed) should be managed within the component.</li></ol>',
    expectedOutputs: '<p>A single React component file (.tsx) containing the Navbar. The component should be self-contained and ready to be used in a Next.js project. No external state management libraries should be used.</p>',
    roleCategory: 'Engineering',
    taskTypes: ['Coding', 'Design'],
    difficulty: 'Intermediate',
    priority: 'Medium',
    deadline: '2024-08-15T23:59:59Z',
    timeLimitMinutes: 120,
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(),
    multiRound: false,
    projectFile: {
        url: '/mock-downloads/project-brief-navbar.pdf',
        name: 'Project Brief - Navbar.pdf',
        size: 1572864, // 1.5MB
    },
  },
  {
    id: 'task-2',
    title: 'Design a Database Schema for a Blog',
    description: 'This task requires you to design a normalized database schema for a typical blogging platform.',
    instructions: '<ol><li>Identify the core entities: Users, Posts, Comments, and Tags.</li><li>Define the attributes for each entity.</li><li>Establish the relationships between entities (e.g., one-to-many, many-to-many).</li><li>Provide the schema as a SQL CREATE TABLE script.</li></ol>',
    expectedOutputs: '<p>A single .sql file containing the SQL statements to create all necessary tables, columns, primary keys, and foreign keys.</p>',
    roleCategory: 'Data',
    taskTypes: ['Documentation'],
    difficulty: 'Beginner',
    priority: 'Low',
    deadline: '2024-08-20T23:59:59Z',
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-3',
    title: 'Create a Serverless API Endpoint',
    description: 'Build a serverless function that acts as a proxy to a third-party API, adding caching to reduce latency.',
    instructions: '<ol><li>Choose a serverless provider (e.g., AWS Lambda, Vercel Functions).</li><li>The function should accept a stock ticker symbol (e.g., "AAPL").</li><li>It should fetch stock data from a free API like Alpha Vantage or Financial Modeling Prep.</li><li>Cache the response for 5 minutes to avoid hitting API rate limits.</li><li>Handle potential errors from the third-party API gracefully.</li></ol>',
    expectedOutputs: '<p>A link to a GitHub repository containing your serverless function code and a brief README explaining how to deploy and test it.</p>',
    roleCategory: 'Engineering',
    taskTypes: ['Coding'],
    difficulty: 'Advanced',
    priority: 'High',
    deadline: '2024-08-25T23:59:59Z',
    companyId: 'company-2',
    createdBy: 'user-5',
    status: 'closed',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-4',
    title: 'Fullstack Project Challenge',
    description: 'A comprehensive challenge involving both frontend and backend development to build a mini-application.',
    instructions: '', // Empty for multi-round
    expectedOutputs: '', // Empty for multi-round
    roleCategory: 'Engineering',
    taskTypes: ['Coding', 'Project', 'Documentation'],
    difficulty: 'Expert',
    priority: 'High',
    deadline: '2024-09-30T23:59:59Z',
    companyId: 'company-2',
    createdBy: 'user-5',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    multiRound: true,
    rounds: [
      {
        roundNumber: 1,
        instructions: 'Design and build the backend API. It should have endpoints for creating and retrieving user data. Use Node.js and Express.',
        expectedOutputs: 'A GitHub repo with the backend code and a Postman collection.',
        timeLimitMinutes: 180,
      },
      {
        roundNumber: 2,
        instructions: 'Build the frontend interface that consumes the API from Round 1. It should have a form to create a user and a table to display users.',
        expectedOutputs: 'A responsive single-page application built with React.',
        timeLimitMinutes: 240,
      },
    ],
  },
  {
    id: 'task-5',
    title: 'Implement a Draggable Kanban Board UI',
    description: 'Create a fully functional Kanban board UI where users can drag and drop tasks between columns.',
    instructions: '<ol><li>Use React and a library like <code>react-beautiful-dnd</code> or <code>dnd-kit</code>.</li><li>Create three columns: "To Do", "In Progress", "Done".</li><li>Tasks should be represented as cards.</li><li>The state of the board should be managed within the React component.</li></ol>',
    expectedOutputs: '<p>A single React component file (.tsx) demonstrating the draggable Kanban board.</p>',
    roleCategory: 'Engineering',
    taskTypes: ['UI', 'Component', 'Feature Implementation'],
    difficulty: 'Advanced',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    imageUrl: 'https://picsum.photos/seed/kanban/600/400',
    imageHint: 'kanban board'
  },
  {
    id: 'task-6',
    title: 'Style a Login Form with Tailwind CSS',
    description: 'Given a basic HTML structure for a login form, apply styling using Tailwind CSS to make it visually appealing and responsive.',
    instructions: '<ol><li>Use the provided HTML markup.</li><li>Apply Tailwind CSS classes to style all form elements.</li><li>Ensure the form is centered on the page and looks good on both desktop and mobile devices.</li></ol>',
    expectedOutputs: '<p>An HTML file with inline Tailwind CSS classes applied.</p>',
    roleCategory: 'Engineering',
    taskTypes: ['Styling', 'UI'],
    difficulty: 'Beginner',
    priority: 'Low',
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    companyId: 'company-2',
    createdBy: 'user-5',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-7',
    title: 'Create a Reusable Button Component',
    description: 'Develop a flexible and reusable Button component in React that supports different variants, sizes, and states.',
    instructions: '<ol><li>The component should accept <code>variant</code> (primary, secondary, destructive), <code>size</code> (sm, md, lg), and <code>disabled</code> props.</li><li>Use a library like <code>class-variance-authority</code> to manage styles.</li><li>The component should render a <code>&lt;button&gt;</code> element and forward any other props to it.</li></ol>',
    expectedOutputs: '<p>A single React component file (.tsx) for the Button.</p>',
    roleCategory: 'Engineering',
    taskTypes: ['Component'],
    difficulty: 'Intermediate',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString(),
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-8',
    title: 'Implement Dark Mode Toggle Feature',
    description: "Add a dark mode toggle to a simple application. The user's preference should be saved in localStorage.",
    instructions: "<ol><li>Add a button to toggle between light and dark themes.</li><li>Use CSS variables to manage colors for both themes.</li><li>When the theme changes, add a <code>.dark</code> class to the <code>&lt;html&gt;</code> element.</li><li>Persist the selected theme in <code>localStorage</code>.</li></ol>",
    expectedOutputs: '<p>A link to a GitHub repository with the complete project.</p>',
    roleCategory: 'Engineering',
    taskTypes: ['Feature Implementation', 'Styling'],
    difficulty: 'Intermediate',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    companyId: 'company-2',
    createdBy: 'user-5',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-9',
    title: 'Refactor a Class Component to a Functional Component',
    description: 'Take an existing React class component and refactor it into a modern functional component using hooks.',
    instructions: "<ol><li>Convert all lifecycle methods (e.g., <code>componentDidMount</code>) to their <code>useEffect</code> equivalents.</li><li>Convert the component's state management from <code>this.setState</code> to the <code>useState</code> hook.</li></ol>",
    expectedOutputs: '<p>The refactored functional component file (.tsx).</p>',
    roleCategory: 'Engineering',
    taskTypes: ['Coding'],
    difficulty: 'Beginner',
    priority: 'Low',
    deadline: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'draft', // Example of a non-published task
    createdAt: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-10',
    title: 'Design a Landing Page Mockup',
    description: 'Create a high-fidelity mockup for a new SaaS product landing page.',
    instructions: '<ol><li>Design a hero section, a features section, and a pricing section.</li><li>The design should be modern, clean, and professional.</li><li>You can use any design tool you prefer (e.g., Figma, Sketch, Adobe XD).</li></ol>',
    expectedOutputs: '<p>A shareable link to your design file or a high-resolution image of the mockup.</p>',
    roleCategory: 'Design',
    taskTypes: ['Design', 'UI'],
    difficulty: 'Intermediate',
    deadline: new Date(new Date().setDate(new Date().getDate() + 8)).toISOString(),
    companyId: 'company-2',
    createdBy: 'user-5',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    imageUrl: 'https://picsum.photos/seed/landingpage/600/400',
    imageHint: 'website design',
    multiRound: false,
  },
  {
    id: 'task-11',
    title: 'Develop a Content Strategy for a Product Launch',
    description: 'Create a one-month content calendar for the launch of a new productivity app.',
    instructions: '<ol><li>Define 3 key content themes.</li><li>Outline 4 blog post ideas (titles and brief descriptions).</li><li>Propose 8 social media posts (for LinkedIn and Twitter).</li><li>Create one concept for a launch-day newsletter.</li></ol>',
    expectedOutputs: '<p>A PDF or Google Doc containing the content strategy and calendar.</p>',
    roleCategory: 'Marketing',
    taskTypes: ['Campaign Planning', 'Content Creation', 'Social Media'],
    difficulty: 'Intermediate',
    deadline: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(),
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-12',
    title: 'Write an SEO-Optimized Blog Post',
    description: 'Write a 1000-word blog post on the topic "The Future of Remote Collaboration Tools".',
    instructions: '<ol><li>Target the primary keyword "remote collaboration tools".</li><li>Include at least two secondary keywords like "virtual teamwork" and "hybrid work".</li><li>Structure the post with clear headings (H2, H3).</li><li>Include an introduction, a conclusion, and at least 3 internal links (to mock URLs).</li></ol>',
    expectedOutputs: '<p>A Google Doc or Word document with the final blog post.</p>',
    roleCategory: 'Marketing',
    taskTypes: ['Content Creation'],
    difficulty: 'Beginner',
    deadline: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString(),
    companyId: 'company-2',
    createdBy: 'user-5',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-13',
    title: 'Plan a Social Media Campaign for a Holiday Sale',
    description: 'Plan a 3-day social media campaign for a Black Friday sale.',
    instructions: '<ol><li>Define the target audience.</li><li>Create 3 distinct ad copy variations (headline and body) for Facebook/Instagram.</li><li>Mock up one visual concept for the ads (a simple description or a link to a Canva/Figma design is fine).</li><li>Outline the campaign schedule (pre-launch, launch day, final hours).</li></ol>',
    expectedOutputs: '<p>A presentation (PPT, Google Slides) outlining the campaign plan.</p>',
    roleCategory: 'Marketing',
    taskTypes: ['Campaign Planning', 'Ads', 'Social Media'],
    difficulty: 'Intermediate',
    deadline: new Date(new Date().setDate(new Date().getDate() + 9)).toISOString(),
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-14',
    title: 'Go-to-Market Strategy Presentation',
    description: 'Develop a 10-slide presentation outlining the go-to-market strategy for a new B2B SaaS product targeting small businesses.',
    instructions: '<ol><li>Define the Ideal Customer Profile (ICP).</li><li>Outline the pricing strategy.</li><li>Detail the marketing and sales channels.</li><li>Set key performance indicators (KPIs) for the first six months.</li></ol>',
    expectedOutputs: '<p>A PDF or PPTX file of the presentation.</p>',
    roleCategory: 'Business',
    taskTypes: ['Strategy Planning', 'Presentation', 'Market Analysis'],
    difficulty: 'Advanced',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    multiRound: false,
    imageUrl: 'https://picsum.photos/seed/business/600/400',
    imageHint: 'business strategy',
    projectFile: {
        url: '/mock-downloads/gtm-strategy-template.pdf',
        name: 'GTM Strategy Template.pdf',
        size: 839201,
    }
  },
  {
    id: 'task-15',
    title: 'Financial Model for New Product Line',
    description: 'Create a 3-year financial projection for a new product line. The model should include revenue forecasts, cost of goods sold (COGS), and operational expenses.',
    instructions: '<ol><li>Use the provided assumptions for market size and growth rate.</li><li>Create a P&L statement forecast.</li><li>Calculate the break-even point.</li><li>The model should be clear, well-structured, and easy to understand.</li></ol>',
    expectedOutputs: '<p>An Excel file (.xlsx) or Google Sheets link containing the financial model.</p>',
    roleCategory: 'Business',
    taskTypes: ['Financial Modeling'],
    difficulty: 'Expert',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
    companyId: 'company-2',
    createdBy: 'user-5',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    multiRound: false,
  },
  {
    id: 'task-16',
    title: 'Analyze Sales Data and Create Dashboard',
    description: 'Analyze a provided sales dataset to identify trends and create a visualization dashboard.',
    instructions: '<ol><li>Clean the provided CSV data.</li><li>Analyze monthly revenue and top-selling products.</li><li>Create a dashboard with at least 3 charts (e.g., bar, line, pie) to visualize your findings.</li><li>Provide a summary of your key insights.</li></ol>',
    expectedOutputs: '<p>A shareable link to a public dashboard (e.g., Tableau Public, Looker Studio) or a Jupyter Notebook file.</p>',
    roleCategory: 'Data',
    taskTypes: ['Data Cleaning', 'Visualization', 'Reporting'],
    difficulty: 'Intermediate',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'published',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    multiRound: false,
    imageUrl: 'https://picsum.photos/seed/dataviz/600/400',
    imageHint: 'data dashboard'
  },
  {
    id: 'task-17',
    title: 'Build a Secure Backend Module for an Investor Platform (Baalvion)',
    description: "As a senior backend developer, you are tasked with building the core security and onboarding module for 'Baalvion', a next-generation institutional Investor Relations Platform. This is a critical first module that will handle all user authentication, role management, and the initial investor verification process. Your work will be the foundation for the entire platform's security and data integrity.",
    instructions: `<h3>Project Goal</h3>
<p>Your primary objective is to build a robust and secure backend module that handles user authentication, role-based access, and a mock investor onboarding workflow. This module will serve as the gateway to the Baalvion platform, making security and reliability paramount.</p>

<h3>Core Architectural & Security Requirements</h3>
<ul>
  <li><strong>Project Structure</strong>: Organize your code in a clean, modular fashion (e.g., controllers, services, routes, middleware, models).</li>
  <li><strong>API Response</strong>: All endpoints must return a standardized JSON object: <code>{ success: boolean, data: any, error: string | null }</code>.</li>
  <li><strong>Authentication</strong>: All protected routes must validate a JWT or session token. Create middleware for this.</li>
  <li><strong>Role-Based Access Control (RBAC)</strong>: Implement middleware to restrict access based on user roles (Public, Investor, Admin).</li>
  <li><strong>Input Validation</strong>: Sanitize and validate all incoming data from API requests.</li>
  <li><strong>Security Best Practices</strong>: Passwords must be hashed using a strong algorithm like bcrypt. Never store plaintext secrets; use environment variables.</li>
  <li><strong>Error Handling</strong>: Implement comprehensive error handling to prevent crashes and provide meaningful error messages.</li>
  <li><strong>Logging</strong>: Log critical events such as user logins, KYC submissions, and NDA acceptances.</li>
</ul>

<h3>Features to Implement</h3>
<h4>1. Authentication Service:</h4>
<ul>
  <li><strong>User Registration</strong>: Allow new users to sign up with an email and password. New users should default to the 'Investor' role.</li>
  <li><strong>User Login</strong>: Authenticate users and return a token and their role upon success.</li>
  <li><strong>User Profile</strong>: Create a protected endpoint to fetch the currently authenticated user's profile.</li>
</ul>

<h4>2. Onboarding Workflow (Mock):</h4>
<ul>
  <li><strong>KYC System</strong>: An endpoint for an authenticated 'Investor' to submit their Know-Your-Customer (KYC) details. This can be a mock submission (no file upload needed). The system should track a status: <code>pending</code>, <code>approved</code>, or <code>rejected</code>.</li>
  <li><strong>AML Screening</strong>: As part of the KYC submission, simulate an Anti-Money Laundering (AML) check. This can be a simple function that randomly flags a user for review.</li>
  <li><strong>NDA Acceptance</strong>: An endpoint that allows an authenticated 'Investor' to record their acceptance of a Non-Disclosure Agreement, capturing the timestamp.</li>
</ul>

<h3>API Endpoints to Build</h3>
<p>The following is a list of endpoints you must create:</p>
<pre><code>POST   /api/auth/register      (Public)
POST   /api/auth/login         (Public)
GET    /api/auth/me            (Protected: Investor, Admin)
POST   /api/kyc/submit         (Protected: Investor)
GET    /api/kyc/status         (Protected: Investor, Admin)
POST   /api/nda/accept         (Protected: Investor)</code></pre><h3>WORKLOAD EXPECTATION & INTEGRATION REQUIREMENT</h3>
<p><strong>Estimated Effort:</strong> This task is expected to require approximately 4–6 hours of focused development work. Candidates are expected to complete the implementation within a minimum of 2 days to ensure proper code quality, testing, and documentation.</p>
<p><strong>Note:</strong> Submissions that appear rushed, incomplete, or lacking proper structure may be rejected regardless of completion.</p>

<h3>ADMIN PANEL INTEGRATION (MANDATORY)</h3>
<p>All modules must be designed to integrate with the central Admin & Compliance System.</p>
<p>Developers must ensure:</p>
<ul>
  <li>All critical actions are logged and accessible via admin APIs</li>
  <li>Data structures are compatible with admin-level review</li>
  <li>Any approval-based flow (KYC, investments, etc.) is visible to admin endpoints</li>
  <li>No isolated or standalone logic — system must be integration-ready</li>
</ul>
<p><strong>Failure to ensure admin integration compatibility may result in rejection.</strong></p>

<h3>IMPORTANT</h3>
<ul>
  <li>This is not an isolated task — it is part of a larger system</li>
  <li>Code must be modular, scalable, and integration-ready</li>
  <li>Final system ownership and integration will be handled centrally</li>
</ul>
`,
    expectedOutputs: '<p>A public GitHub repository containing the complete, runnable Node.js application. The repository must include a <code>README.md</code> with clear, step-by-step instructions for local setup, environment configuration (<code>.env.example</code>), and how to run the server. The application should start without errors and all endpoints should be functional as per the requirements.</p>',
    roleCategory: 'Backend',
    taskTypes: ['Backend Development', 'API Design', 'System Architecture', 'Security Analysis'],
    difficulty: 'Expert',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString(),
    companyId: 'company-3',
    createdBy: 'user-10',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    multiRound: false,
    imageUrl: 'https://picsum.photos/seed/backend/600/400',
    imageHint: 'server code'
  },
  {
    id: 'task-18',
    title: 'Build a Role-Based Task Assignment System',
    description: "You are building a core platform feature for SkillMatch Pro. The goal is to create a secure backend system where companies can create tasks and assign them to specific developers, ensuring only assigned developers can access and submit their work.",
    instructions: `<h3>Objective</h3>
<p>Build a backend system where a company can create a job/task, assign it to specific developers, and only those assigned developers can view the task and submit their work. The system must include robust access control and activity logging.</p>

<h3>Core Features to Implement</h3>
<ul>
  <li><strong>Task Creation:</strong> Companies can create tasks with a title, description, difficulty, deadline, and required role.</li>
  <li><strong>Task Assignment:</strong> Companies can assign a task to a specific list of developer user IDs.</li>
  <li><strong>Task Access Control:</strong> Ensure only assigned developers or company/admin users can view a task's full details.</li>
  <li><strong>Submission System:</strong> Assigned developers can submit a GitHub repository link and notes for a task.</li>
  <li><strong>Task Status Management:</strong> Implement a status system for tasks (e.g., pending, in-progress, submitted, reviewed, approved/rejected).</li>
  <li><strong>Activity Logging:</strong> Track key events like task creation, assignment, submission, and status updates.</li>
</ul>

<h3>User Roles & RBAC</h3>
<p>Implement Role-Based Access Control with the following roles:</p>
<ul>
    <li><strong>Company:</strong> Can create and assign tasks.</li>
    <li><strong>Developer:</strong> Can only work on tasks specifically assigned to them.</li>
    <li><strong>Admin:</strong> Has full access to all tasks and submissions.</li>
</ul>

<h3>API Endpoints to Build</h3>
<p>All protected routes must validate a JWT and use RBAC middleware.</p>
<pre><code>POST   /api/tasks/create              (Company)
POST   /api/tasks/assign              (Company)
GET    /api/tasks                     (Role-based filtered list)
GET    /api/tasks/:id                 (Only assigned users)
POST   /api/tasks/submit              (Developer)
POST   /api/tasks/status/update       (Company, Admin)

GET    /api/tasks/logs                (Admin, Company)</code></pre>

<h3>System Requirements</h3>
<ul>
    <li><strong>Technology:</strong> Node.js + Express OR Firebase Functions.</li>
    <li><strong>Architecture:</strong> Follow a modular structure (controllers, services, routes, middleware, models).</li>
    <li><strong>API Response:</strong> All endpoints must return a standard JSON format: <code>{ success: boolean, data: any, error: string | null }</code>.</li>
    <li><strong>Security:</strong> Implement JWT authentication, RBAC middleware, and proper input validation/sanitization.</li>
    <li><strong>Database:</strong> Use mock/in-memory storage, but design it to be ready for future integration with Firestore or PostgreSQL.</li>
</ul>
`,
    expectedOutputs: '<p>A complete backend implementation in a public GitHub repository. Your repository must include a detailed README.md file with instructions for local setup, environment configuration, and how to run and test all the API endpoints.</p>',
    roleCategory: 'Backend',
    taskTypes: ['Backend Development', 'API Design', 'System Architecture', 'Security Analysis'],
    difficulty: 'Expert',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    companyId: 'company-1',
    createdBy: 'user-2',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    multiRound: false,
    imageUrl: 'https://picsum.photos/seed/rbac/600/400',
    imageHint: 'database schema',
  },
  {
    id: 'task-19',
    title: 'Build a Secure Data Room Module for an Investor Platform (Baalvion)',
    description: "As a senior backend developer, you are tasked with building the secure Data Room module for 'Baalvion', a next-generation institutional Investor Relations Platform. This module is responsible for providing controlled access to sensitive investor documents such as financial reports, legal files, and governance records. It must ensure strict access control and full audit tracking of all document interactions.",
    instructions: `<h3>Project Goal</h3>
<p>Your primary objective is to build a secure backend module that enables role-based document access and tracks every document interaction. This module will ensure that only authorized investors and admins can view or download specific documents, maintaining full transparency and auditability.</p>
<h3>Core Architectural & Security Requirements</h3>
<ul>
  <li><strong>Project Structure</strong>: Organize your code in a clean, modular fashion (e.g., controllers, services, routes, middleware, models).</li>
  <li><strong>API Response</strong>: All endpoints must return a standardized JSON object: <code>{ success: boolean, data: any, error: string | null }</code>.</li>
  <li><strong>Authentication</strong>: All protected routes must validate a JWT or session token using middleware.</li>
  <li><strong>Role-Based Access Control (RBAC)</strong>: Implement middleware to restrict access based on user roles (Public, Investor, Admin).</li>
  <li><strong>Input Validation</strong>: Sanitize and validate all incoming data from API requests.</li>
  <li><strong>Security Best Practices</strong>: Ensure secure document handling. Validate file access permissions before serving any document.</li>
  <li><strong>Error Handling</strong>: Implement comprehensive error handling to prevent crashes and provide meaningful error messages.</li>
  <li><strong>Logging</strong>: Log all document-related actions including viewing and downloading with user ID, document ID, and timestamp.</li>
</ul>
<h3>Features to Implement</h3>
<h4>1. Data Room Document System:</h4>
<ul>
  <li><strong>Document Listing</strong>: Create an endpoint that returns a list of available documents filtered based on the user’s role.</li>
  <li><strong>Role-Based Access</strong>: Each document must define which roles can access it (Investor/Admin).</li>
  <li><strong>Secure Access</strong>: Ensure unauthorized users cannot access restricted documents.</li>
</ul>
<h4>2. Document Download System:</h4>
<ul>
  <li><strong>Secure Download</strong>: Allow authorized users to download documents via a protected endpoint.</li>
  <li><strong>Access Validation</strong>: Before download, validate user role and permissions.</li>
</ul>
<h4>3. Audit Logging System:</h4>
<ul>
  <li>Track every document interaction including:
    <ul>
        <li>Document viewed</li>
        <li>Document downloaded</li>
        <li>User performing the action</li>
        <li>Timestamp</li>
    </ul>
  </li>
</ul>
<h4>4. Mock Data Handling:</h4>
<ul>
  <li>Use mock data for documents (no real file storage required).</li>
  <li>Simulate document metadata such as: id, title, description, allowedRoles, createdAt</li>
</ul>
<h3>API Endpoints to Build</h3>
<p>The following is a list of endpoints you must create:</p>
<pre><code>GET    /api/data-room/documents        (Protected: Investor, Admin)
GET    /api/data-room/download/:id     (Protected: Investor, Admin)
GET    /api/audit/logs                 (Protected: Admin)</code></pre><h3>WORKLOAD EXPECTATION & INTEGRATION REQUIREMENT</h3>
<p><strong>Estimated Effort:</strong> This task is expected to require approximately 4–6 hours of focused development work. Candidates are expected to complete the implementation within a minimum of 2 days to ensure proper code quality, testing, and documentation.</p>
<p><strong>Note:</strong> Submissions that appear rushed, incomplete, or lacking proper structure may be rejected regardless of completion.</p>

<h3>ADMIN PANEL INTEGRATION (MANDATORY)</h3>
<p>All modules must be designed to integrate with the central Admin & Compliance System.</p>
<p>Developers must ensure:</p>
<ul>
  <li>All critical actions are logged and accessible via admin APIs</li>
  <li>Data structures are compatible with admin-level review</li>
  <li>Any approval-based flow (KYC, investments, etc.) is visible to admin endpoints</li>
  <li>No isolated or standalone logic — system must be integration-ready</li>
</ul>
<p><strong>Failure to ensure admin integration compatibility may result in rejection.</strong></p>

<h3>IMPORTANT</h3>
<ul>
  <li>This is not an isolated task — it is part of a larger system</li>
  <li>Code must be modular, scalable, and integration-ready</li>
  <li>Final system ownership and integration will be handled centrally</li>
</ul>
`,
    expectedOutputs: '<p>A public GitHub repository containing the complete, runnable Node.js backend module. The repository must include a README.md with clear setup instructions, environment configuration (.env.example), and steps to run the server. All endpoints must be functional, secure, and follow the required architecture. The system should run without errors and demonstrate proper role-based access and audit logging.</p>',
    roleCategory: 'Backend',
    taskTypes: ['Backend Development', 'API Design', 'System Architecture', 'Security Analysis'],
    difficulty: 'Expert',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString(),
    companyId: 'company-3',
    createdBy: 'user-10',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    multiRound: false,
    imageUrl: 'https://picsum.photos/seed/dataroom/600/400',
    imageHint: 'data vault',
  },
  {
    id: 'task-20',
    title: 'Build an Investment Execution Engine (Baalvion)',
    description: "As a senior backend developer, you are tasked with building the Investment Execution Engine for 'Baalvion', a next-generation institutional Investor Relations Platform. This module is responsible for managing the full lifecycle of an investment, from term sheet generation to capital confirmation and admin verification. It ensures a structured, secure, and auditable investment process.",
    instructions: `<h3>Project Goal</h3>
<p>Your primary objective is to build a backend system that manages the investment lifecycle in a state-driven flow: term sheet creation, execution, capital submission, and admin verification.</p>
<h3>Core Architectural & Security Requirements</h3>
<ul>
  <li><strong>Project Structure:</strong> Organize your code in a clean, modular fashion (controllers, services, routes, middleware, models).</li>
  <li><strong>API Response:</strong> All endpoints must return { success: boolean, data: any, error: string | null }.</li>
  <li><strong>Authentication:</strong> All protected routes must validate JWT/session.</li>
  <li><strong>RBAC:</strong> Restrict access (Investor, Admin).</li>
  <li><strong>Input Validation:</strong> Validate all incoming data.</li>
  <li><strong>Error Handling:</strong> Prevent crashes and return meaningful errors.</li>
  <li><strong>Logging:</strong> Log all investment lifecycle actions.</li>
</ul>
<h3>Features to Implement</h3>
<h4>1. Investment Lifecycle:</h4>
<ul>
  <li>Term sheet generation (mock)</li>
  <li>Investment execution tracking</li>
  <li>Capital submission logging</li>
  <li>Admin verification system</li>
</ul>
<h4>2. State Management:</h4>
<p>Track states:</p>
<ul>
  <li>initiated</li>
  <li>signed</li>
  <li>funds_submitted</li>
  <li>verified</li>
</ul>
<h3>API Endpoints to Build</h3>
<pre><code>POST   /api/investment/term-sheet     (Investor)
POST   /api/investment/execute        (Investor)
GET    /api/investment/status         (Investor, Admin)
POST   /api/investment/verify         (Admin)</code></pre><h3>WORKLOAD EXPECTATION & INTEGRATION REQUIREMENT</h3>
<p><strong>Estimated Effort:</strong> This task is expected to require approximately 4–6 hours of focused development work. Candidates are expected to complete the implementation within a minimum of 2 days to ensure proper code quality, testing, and documentation.</p>
<p><strong>Note:</strong> Submissions that appear rushed, incomplete, or lacking proper structure may be rejected regardless of completion.</p>

<h3>ADMIN PANEL INTEGRATION (MANDATORY)</h3>
<p>All modules must be designed to integrate with the central Admin & Compliance System.</p>
<p>Developers must ensure:</p>
<ul>
  <li>All critical actions are logged and accessible via admin APIs</li>
  <li>Data structures are compatible with admin-level review</li>
  <li>Any approval-based flow (KYC, investments, etc.) is visible to admin endpoints</li>
  <li>No isolated or standalone logic — system must be integration-ready</li>
</ul>
<p><strong>Failure to ensure admin integration compatibility may result in rejection.</strong></p>

<h3>IMPORTANT</h3>
<ul>
  <li>This is not an isolated task — it is part of a larger system</li>
  <li>Code must be modular, scalable, and integration-ready</li>
  <li>Final system ownership and integration will be handled centrally</li>
</ul>
`,
    expectedOutputs: '<p>Complete backend module with working APIs, clean structure, and lifecycle tracking. Must run without errors.</p>',
    roleCategory: 'Backend',
    taskTypes: ['Backend Development', 'API Design', 'System Architecture'],
    difficulty: 'Expert',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(),
    companyId: 'company-3',
    createdBy: 'user-10',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    multiRound: false,
    imageUrl: 'https://picsum.photos/seed/investment/600/400',
    imageHint: 'financial chart'
  },
  {
    id: 'task-21',
    title: 'Build an SPV Management & Profit System (Baalvion)',
    description: "As a senior backend developer, you are tasked with building the SPV (Special Purpose Vehicle) Management System for 'Baalvion'. This module will manage deal-level investment structures, including investor allocation, capital tracking, and profit distribution logic.",
    instructions: `<h3>Project Goal</h3>
<p>Build a backend module that enables creation and management of SPVs, tracks investor allocations, and calculates profit distribution in a structured and auditable way.</p>
<h3>Core Architectural & Security Requirements</h3>
<ul>
  <li><strong>Project Structure:</strong> Modular architecture required.</li>
  <li><strong>API Response:</strong> Standard response format.</li>
  <li><strong>Authentication:</strong> JWT/session validation required.</li>
  <li><strong>RBAC:</strong> Restrict access (Investor, Admin).</li>
  <li><strong>Input Validation:</strong> Validate all data.</li>
  <li><strong>Error Handling:</strong> Robust error management.</li>
  <li><strong>Logging:</strong> Log all financial operations.</li>
</ul>
<h3>Features to Implement</h3>
<h4>1. SPV System:</h4>
<ul>
  <li>Create SPV entity</li>
  <li>Assign investors to SPV</li>
  <li>Track capital contributions</li>
</ul>
<h4>2. Profit System:</h4>
<ul>
  <li>Mock profit calculation</li>
  <li>Distribution tracking</li>
</ul>
<h3>API Endpoints to Build</h3>
<pre><code>POST   /api/spv/create        (Admin)
GET    /api/spv/:id           (Investor, Admin)
POST   /api/spv/allocate      (Admin)
GET    /api/spv/profit        (Investor, Admin)</code></pre><h3>WORKLOAD EXPECTATION & INTEGRATION REQUIREMENT</h3>
<p><strong>Estimated Effort:</strong> This task is expected to require approximately 4–6 hours of focused development work. Candidates are expected to complete the implementation within a minimum of 2 days to ensure proper code quality, testing, and documentation.</p>
<p><strong>Note:</strong> Submissions that appear rushed, incomplete, or lacking proper structure may be rejected regardless of completion.</p>

<h3>ADMIN PANEL INTEGRATION (MANDATORY)</h3>
<p>All modules must be designed to integrate with the central Admin & Compliance System.</p>
<p>Developers must ensure:</p>
<ul>
  <li>All critical actions are logged and accessible via admin APIs</li>
  <li>Data structures are compatible with admin-level review</li>
  <li>Any approval-based flow (KYC, investments, etc.) is visible to admin endpoints</li>
  <li>No isolated or standalone logic — system must be integration-ready</li>
</ul>
<p><strong>Failure to ensure admin integration compatibility may result in rejection.</strong></p>

<h3>IMPORTANT</h3>
<ul>
  <li>This is not an isolated task — it is part of a larger system</li>
  <li>Code must be modular, scalable, and integration-ready</li>
  <li>Final system ownership and integration will be handled centrally</li>
</ul>
`,
    expectedOutputs: '<p>Fully functional SPV module with capital tracking and profit logic. Clean and scalable code.</p>',
    roleCategory: 'Backend',
    taskTypes: ['Backend Development', 'API Design', 'Financial Modeling'],
    difficulty: 'Expert',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(),
    companyId: 'company-3',
    createdBy: 'user-10',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    multiRound: false,
    imageUrl: 'https://picsum.photos/seed/spv/600/400',
    imageHint: 'corporate structure'
  },
  {
    id: 'task-22',
    title: 'Build an Equity Engine & Cap Table System (Baalvion)',
    description: "As a senior backend developer, you are tasked with building the Equity Engine for 'Baalvion'. This module manages equity grants, vesting schedules, and cap table tracking for strategic operators.",
    instructions: `<h3>Project Goal</h3>
<p>Build a backend system that manages equity allocation, tracks vesting schedules, and maintains a structured cap table.</p>
<h3>Core Architectural & Security Requirements</h3>
<ul>
  <li><strong>Project Structure:</strong> Modular design required.</li>
  <li><strong>API Response:</strong> Standard format required.</li>
  <li><strong>Authentication:</strong> JWT/session validation required.</li>
  <li><strong>RBAC:</strong> Admin-controlled actions.</li>
  <li><strong>Input Validation:</strong> Strict validation required.</li>
  <li><strong>Error Handling:</strong> Must handle all failure cases.</li>
  <li><strong>Logging:</strong> Log all equity-related actions.</li>
</ul>
<h3>Features to Implement</h3>
<h4>1. Equity Management:</h4>
<ul>
  <li>Grant equity to users</li>
  <li>Track equity pool</li>
</ul>
<h4>2. Vesting System:</h4>
<ul>
  <li>Time-based vesting logic</li>
  <li>Milestone-ready structure</li>
</ul>
<h4>3. Cap Table:</h4>
<ul>
  <li>View ownership structure</li>
  <li>Update records via API</li>
</ul>
<h3>API Endpoints to Build</h3>
<pre><code>POST   /api/equity/grant      (Admin)
GET    /api/equity/vesting    (Admin, Investor)
GET    /api/cap-table         (Admin)</code></pre><h3>WORKLOAD EXPECTATION & INTEGRATION REQUIREMENT</h3>
<p><strong>Estimated Effort:</strong> This task is expected to require approximately 4–6 hours of focused development work. Candidates are expected to complete the implementation within a minimum of 2 days to ensure proper code quality, testing, and documentation.</p>
<p><strong>Note:</strong> Submissions that appear rushed, incomplete, or lacking proper structure may be rejected regardless of completion.</p>

<h3>ADMIN PANEL INTEGRATION (MANDATORY)</h3>
<p>All modules must be designed to integrate with the central Admin & Compliance System.</p>
<p>Developers must ensure:</p>
<ul>
  <li>All critical actions are logged and accessible via admin APIs</li>
  <li>Data structures are compatible with admin-level review</li>
  <li>Any approval-based flow (KYC, investments, etc.) is visible to admin endpoints</li>
  <li>No isolated or standalone logic — system must be integration-ready</li>
</ul>
<p><strong>Failure to ensure admin integration compatibility may result in rejection.</strong></p>

<h3>IMPORTANT</h3>
<ul>
  <li>This is not an isolated task — it is part of a larger system</li>
  <li>Code must be modular, scalable, and integration-ready</li>
  <li>Final system ownership and integration will be handled centrally</li>
</ul>
`,
    expectedOutputs: '<p>Complete equity management system with vesting logic and cap table tracking. Must be audit-ready.</p>',
    roleCategory: 'Backend',
    taskTypes: ['Backend Development', 'API Design', 'Financial Modeling'],
    difficulty: 'Expert',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 28)).toISOString(),
    companyId: 'company-3',
    createdBy: 'user-10',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    multiRound: false,
    imageUrl: 'https://picsum.photos/seed/equity/600/400',
    imageHint: 'pie chart'
  },
  {
    id: 'task-23',
    title: 'Build an Admin Panel & Compliance System (Baalvion)',
    description: "As a senior backend developer, you are tasked with building the Admin & Compliance System for 'Baalvion'. This module provides full administrative control over the platform, including investor approvals, compliance tracking, notifications, and audit logs.",
    instructions: `<h3>Project Goal</h3>
<p>Build a backend module that allows admins to manage the entire system, review investor actions, and maintain compliance through logging and monitoring.</p>
<h3>Core Architectural & Security Requirements</h3>
<ul>
  <li><strong>Project Structure:</strong> Clean modular architecture.</li>
  <li><strong>API Response:</strong> Standard format required.</li>
  <li><strong>Authentication:</strong> JWT/session validation required.</li>
  <li><strong>RBAC:</strong> Strict admin-only access where required.</li>
  <li><strong>Input Validation:</strong> Validate all inputs.</li>
  <li><strong>Error Handling:</strong> Prevent system failures.</li>
  <li><strong>Logging:</strong> Full audit trail required.</li>
</ul>
<h3>Features to Implement</h3>
<h4>1. Approval System:</h4>
<ul>
  <li>Investor approval/rejection</li>
  <li>KYC review queue</li>
</ul>
<h4>2. Notification System:</h4>
<ul>
  <li>Send notifications (mock event-based)</li>
</ul>
<h4>3. Audit System:</h4>
<ul>
  <li>Track all system actions</li>
</ul>
<h3>API Endpoints to Build</h3>
<pre><code>GET    /api/admin/approvals       (Admin)
POST   /api/admin/approve         (Admin)
GET    /api/admin/audit           (Admin)
POST   /api/notifications/send    (Admin)</code></pre><h3>WORKLOAD EXPECTATION & INTEGRATION REQUIREMENT</h3>
<p><strong>Estimated Effort:</strong> This task is expected to require approximately 4–6 hours of focused development work. Candidates are expected to complete the implementation within a minimum of 2 days to ensure proper code quality, testing, and documentation.</p>
<p><strong>Note:</strong> Submissions that appear rushed, incomplete, or lacking proper structure may be rejected regardless of completion.</p>

<h3>ADMIN PANEL INTEGRATION (MANDATORY)</h3>
<p>All modules must be designed to integrate with the central Admin & Compliance System.</p>
<p>Developers must ensure:</p>
<ul>
  <li>All critical actions are logged and accessible via admin APIs</li>
  <li>Data structures are compatible with admin-level review</li>
  <li>Any approval-based flow (KYC, investments, etc.) is visible to admin endpoints</li>
  <li>No isolated or standalone logic — system must be integration-ready</li>
</ul>
<p><strong>Failure to ensure admin integration compatibility may result in rejection.</strong></p>

<h3>IMPORTANT</h3>
<ul>
  <li>This is not an isolated task — it is part of a larger system</li>
  <li>Code must be modular, scalable, and integration-ready</li>
  <li>Final system ownership and integration will be handled centrally</li>
</ul>
`,
    expectedOutputs: '<p>Fully functional admin backend module with approval system, notifications, and audit tracking. Must be secure and scalable.</p>',
    roleCategory: 'Backend',
    taskTypes: ['Backend Development', 'API Design', 'System Architecture', 'Security Analysis'],
    difficulty: 'Expert',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 28)).toISOString(),
    companyId: 'company-3',
    createdBy: 'user-10',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    multiRound: false,
    imageUrl: 'https://picsum.photos/seed/adminpanel/600/400',
    imageHint: 'control panel'
  },
];

export const mockTemplates: TaskTemplate[] = [
  {
    templateId: 'TPL-ENG-001',
    title: 'Frontend Responsive Component',
    description: 'A standard task to create a reusable and responsive component for a modern web application.',
    instructions: '1. Use React and Tailwind CSS.\\n2. Component should have standard elements like a header, content, and footer.\\n3. It must be responsive across mobile, tablet, and desktop breakpoints.\\n4. Manage state internally without external libraries.',
    expectedOutputs: 'A single React component file (.tsx) that is self-contained and ready for use.',
    roleCategory: 'Engineering',
    taskTypes: ['Coding', 'Design'],
    difficulty: 'Intermediate',
    timeLimitMinutes: 120,
    createdBy: 'company-1',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 40)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 40)).toISOString(),
    multiRound: false,
  },
  {
    templateId: 'TPL-DATA-001',
    title: 'Blog Database Schema Design',
    description: 'This task requires designing a normalized database schema for a typical blogging platform.',
    instructions: '1. Identify the core entities: Users, Posts, Comments, and Tags.\\n2. Define attributes for each entity.\\n3. Establish relationships (one-to-many, many-to-many).\\n4. Provide the schema as a SQL CREATE TABLE script.',
    expectedOutputs: 'A single .sql file with SQL statements for tables, columns, PKs, and FKs.',
    roleCategory: 'Data',
    taskTypes: ['Documentation'],
    difficulty: 'Beginner',
    timeLimitMinutes: 60,
    createdBy: 'company-1',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 35)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 35)).toISOString(),
    multiRound: false,
  },
  {
    templateId: 'TPL-ENG-002',
    title: 'Fullstack Mini-App (2 Rounds)',
    description: 'A comprehensive challenge involving both frontend and backend development to build a mini-application.',
    instructions: '',
    expectedOutputs: '',
    roleCategory: 'Engineering',
    taskTypes: ['Coding', 'Project'],
    difficulty: 'Expert',
    createdBy: 'company-2',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    multiRound: true,
    rounds: [
      { roundNumber: 1, instructions: 'Build the REST API for CRUD operations on a "notes" resource.', expectedOutputs: 'A GitHub repo with the backend code and a Postman collection.', timeLimitMinutes: 120 },
      { roundNumber: 2, instructions: 'Build a React frontend to consume the "notes" API.', expectedOutputs: 'A deployed frontend application link.', timeLimitMinutes: 180 },
    ],
  }
];

export const mockSubmissions: Submission[] = [
  {
    id: 'sub-1',
    taskId: 'task-1',
    userId: 'user-1',
    companyId: 'company-1',
    content: {
      type: 'link',
      value: 'https://github.com/alice-candidate/responsive-navbar',
    },
    status: 'shortlisted',
    validationStatus: 'Valid',
    testCaseStatus: 'Passed',
    autoScoringStatus: 'Completed',
    autoScore: 88,
    sandboxStatus: 'Completed',
    liveSessionStatus: 'Completed',
    plagiarismRisk: 'Low',
    recordingStatus: 'Completed',
    assignedAt: '2024-08-09T10:00:00Z',
    submittedAt: '2024-08-10T10:00:00Z',
    lastUpdated: '2024-08-12T09:00:00Z',
    timeSpentMinutes: 115,
    skillMatchResult: {
      result: 'pass',
      skillBadge: 'Frontend Pro'
    }
  },
  {
    id: 'sub-2',
    taskId: 'task-1',
    userId: 'user-4',
    companyId: 'company-1',
    content: {
      type: 'link',
      value: 'https://github.com/diana-developer/navbar-project',
    },
    status: 'rejected',
    validationStatus: 'Invalid',
    testCaseStatus: 'Failed',
    autoScoringStatus: 'Completed',
    autoScore: 62,
    sandboxStatus: 'Completed',
    liveSessionStatus: 'Not Started',
    plagiarismRisk: 'High',
    recordingStatus: 'Completed',
    assignedAt: '2024-08-10T11:00:00Z',
    submittedAt: '2024-08-11T14:30:00Z',
    lastUpdated: '2024-08-12T11:00:00Z',
    timeSpentMinutes: 130,
    skillMatchResult: {
      result: 'fail',
      skillBadge: 'Needs Improvement'
    }
  },
  {
    id: 'sub-3',
    taskId: 'task-2',
    userId: 'user-1',
    companyId: 'company-1',
    status: 'resubmitted',
    validationStatus: 'Warning',
    testCaseStatus: 'Warning',
    autoScoringStatus: 'Pending',
    sandboxStatus: 'Idle',
    liveSessionStatus: 'Scheduled',
    plagiarismRisk: 'Low',
    recordingStatus: 'Recording',
    assignedAt: '2024-08-11T09:00:00Z',
    submittedAt: '2024-08-12T09:00:00Z',
    resubmittedAt: '2024-08-13T11:00:00Z',
    lastUpdated: '2024-08-13T11:00:00Z',
    content: {
        type: 'file',
        value: '/mock-uploads/alice-schema.sql',
        fileName: 'alice-schema-v2.sql',
    },
  },
  {
    id: 'sub-4',
    taskId: 'task-4',
    userId: 'user-1',
    companyId: 'company-2',
    status: 'in-progress',
    validationStatus: 'Pending',
    testCaseStatus: 'Pending',
    autoScoringStatus: 'Pending',
    sandboxStatus: 'Active',
    liveSessionStatus: 'Active',
    plagiarismRisk: 'None',
    recordingStatus: 'Recording',
    assignedAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    lastUpdated: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    currentRound: 1,
    attemptsCount: 1,
  },
   {
    id: 'sub-5',
    taskId: 'task-3',
    userId: 'user-1',
    companyId: 'company-2',
    status: 'assigned',
    validationStatus: 'Pending',
    testCaseStatus: 'Pending',
    autoScoringStatus: 'Pending',
    sandboxStatus: 'Not Started',
    liveSessionStatus: 'Cancelled',
    plagiarismRisk: 'None',
    recordingStatus: 'Not Started',
    assignedAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    lastUpdated: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    attemptsCount: 0,
  },
  {
    id: 'sub-6',
    taskId: 'task-2',
    userId: 'user-4',
    companyId: 'company-1',
    content: {
      type: 'file',
      value: '/mock-uploads/diana-schema.sql',
      fileName: 'diana-schema.sql',
      fileSize: 1536, // 1.5 KB
    },
    status: 'pending',
    validationStatus: 'Valid',
    testCaseStatus: 'Passed',
    autoScoringStatus: 'Completed',
    autoScore: 78,
    sandboxStatus: 'Error',
    liveSessionStatus: 'Not Started',
    plagiarismRisk: 'Medium',
    recordingStatus: 'Completed',
    assignedAt: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
    submittedAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    lastUpdated: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    timeSpentMinutes: 50,
  },
  {
    id: 'sub-7',
    taskId: 'task-10',
    userId: 'user-1',
    companyId: 'company-2',
    content: {
      type: 'externalLink',
      value: 'https://www.figma.com/proto/your-prototype-link',
    },
    status: 'evaluated',
    validationStatus: 'Warning',
    testCaseStatus: 'Warning',
    autoScoringStatus: 'Completed',
    autoScore: 91,
    sandboxStatus: 'Completed',
    liveSessionStatus: 'Completed',
    plagiarismRisk: 'Low',
    recordingStatus: 'Paused',
    assignedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    submittedAt: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
    lastUpdated: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
  },
];

export const mockEvaluations: Evaluation[] = [
  {
    id: 'eval-1',
    submissionId: 'sub-1',
    score: 84,
    criteriaScores: {
      'Proficiency': 9,
      'Best Practices': 8,
      'Clarity': 9,
      'Documentation': 7,
      'Analysis': 8,
      'Solution Quality': 9,
      'Innovation': 8,
      'Polish & Initiative': 9,
      'Collaboration': 8,
      'Proactiveness': 9,
    },
    criteriaComments: {
        'Proficiency': 'Great command of React hooks and state management.',
        'Best Practices': 'Code is clean and follows conventions. Could add more tests.',
        'Clarity': 'The video explanation was clear and concise.',
        'Documentation': 'The README was good, but could be more detailed.',
        'Analysis': 'Good breakdown of the problem.',
        'Solution Quality': 'The solution is robust and handles edge cases.',
        'Innovation': 'Nice use of a custom hook to abstract logic.',
        'Polish & Initiative': 'The UI is polished and looks great.',
        'Collaboration': 'Seems like they would be a great team player.',
        'Proactiveness': 'Showed initiative by adding a dark mode toggle.',
    },
    feedback:
      'Excellent work! The component is well-structured and fully responsive. Great use of Tailwind CSS variants. Consider adding ARIA attributes for better accessibility.',
    evaluatedBy: 'user-2',
    evaluatedAt: '2024-08-11T18:00:00Z',
  },
  {
    id: 'eval-2',
    submissionId: 'sub-3',
    score: 75,
    criteriaScores: {
        'Proficiency': 7,
        'Best Practices': 8,
        'Clarity': 9,
        'Documentation': 6,
        'Analysis': 9,
        'Solution Quality': 7,
        'Innovation': 6,
        'Polish & Initiative': 7,
        'Collaboration': 8,
        'Proactiveness': 8,
    },
    criteriaComments: {
        'Proficiency': 'Good understanding of SQL basics.',
        'Best Practices': 'The schema is normalized, which is good.',
        'Clarity': 'The explanation was easy to follow.',
        'Documentation': 'Could use more comments in the SQL file.',
        'Analysis': 'Correctly identified the main entities.',
        'Solution Quality': 'The main issue was the many-to-many relationship handling.',
        'Innovation': 'Standard approach, which is fine for this task.',
        'Polish & Initiative': 'The submission was clean and to the point.',
        'Collaboration': 'N/A',
        'Proactiveness': 'N/A',
    },
    feedback:
      'The SQL script is mostly correct, but the relationship between Posts and Tags should be many-to-many, requiring a join table. The schema is otherwise well-defined.',
    evaluatedBy: 'user-2',
    evaluatedAt: '2024-08-12T15:00:00Z',
  },
  {
    id: 'eval-3',
    submissionId: 'sub-2',
    score: 65,
    criteriaScores: {
      'Proficiency': 7,
      'Best Practices': 6,
      'Clarity': 8,
      'Documentation': 5,
      'Analysis': 7,
      'Solution Quality': 6,
      'Innovation': 5,
      'Polish & Initiative': 7,
      'Collaboration': 8,
      'Proactiveness': 6,
    },
    criteriaComments: {},
    feedback:
      'The submission was okay, but did not meet all requirements. The mobile view was not fully responsive.',
    evaluatedBy: 'user-2',
    evaluatedAt: '2024-08-12T10:00:00Z',
  },
    {
    id: 'eval-4',
    submissionId: 'sub-7',
    score: 92,
    criteriaScores: {
      'Proficiency': 9,
      'Best Practices': 9,
      'Clarity': 10,
      'Documentation': 8,
      'Analysis': 9,
      'Solution Quality': 9,
      'Innovation': 9,
      'Polish & Initiative': 10,
      'Collaboration': 9,
      'Proactiveness': 9,
    },
    feedback: 'Outstanding design work. The mockup is pixel-perfect and the user flow is intuitive and well-thought-out.',
    evaluatedBy: 'user-5',
    evaluatedAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
  },
];

export const mockTestCases: (TestCase & { submissionId: string })[] = [
    {
        submissionId: 'sub-1',
        id: 'tc-1-1',
        name: 'GET /api/items Endpoint',
        description: 'Checks if the endpoint returns a 200 OK status.',
        expectedOutcome: 'Status 200 with a JSON array of items.',
        actualOutcome: 'Status 200 with a JSON array of items.',
        status: 'Passed'
    },
    {
        submissionId: 'sub-1',
        id: 'tc-1-2',
        name: 'POST /api/items Endpoint',
        description: 'Checks if a new item can be created successfully.',
        expectedOutcome: 'Status 201 Created with the new item in the response body.',
        actualOutcome: 'Status 201 Created with the new item in the response body.',
        status: 'Passed'
    },
    {
        submissionId: 'sub-1',
        id: 'tc-1-3',
        name: 'Authentication Middleware',
        description: 'Ensures that protected endpoints return 401 Unauthorized for unauthenticated requests.',
        expectedOutcome: 'Status 401 Unauthorized.',
        actualOutcome: 'Status 401 Unauthorized.',
        status: 'Passed'
    },
    {
        submissionId: 'sub-2',
        id: 'tc-2-1',
        name: 'GET /api/items/{id} Endpoint',
        description: 'Checks if a specific item can be retrieved.',
        expectedOutcome: 'Status 200 with the correct item.',
        actualOutcome: 'Status 200 with the correct item.',
        status: 'Passed'
    },
    {
        submissionId: 'sub-2',
        id: 'tc-2-2',
        name: 'GET /api/items/not-found',
        description: 'Checks for correct 404 handling for a non-existent item.',
        expectedOutcome: 'Status 404 Not Found.',
        actualOutcome: 'Status 500 Internal Server Error.',
        status: 'Failed'
    },
     {
        submissionId: 'sub-3',
        id: 'tc-3-1',
        name: 'Database Connection',
        description: 'Checks if the application successfully connects to the database on startup.',
        expectedOutcome: 'Successful database connection log.',
        actualOutcome: 'Connection timed out after 3 retries.',
        status: 'Failed'
    },
    {
        submissionId: 'sub-3',
        id: 'tc-3-2',
        name: 'Data Validation: Email Field',
        description: 'Checks if the API correctly validates email formats on user creation.',
        expectedOutcome: 'Status 400 Bad Request for invalid email format.',
        actualOutcome: 'Status 400 Bad Request for invalid email format.',
        status: 'Passed'
    },
];

export const mockEvaluationSchemas: EvaluationSchema[] = [
  {
    id: 'schema-1',
    name: 'Standard Technical Evaluation',
    description: 'A balanced schema for evaluating core technical roles.',
    isActive: true,
    criteria: [
      { id: 'crit-1-1', name: 'Technical Skills', description: 'Assesses mastery of required technologies and tools.', maxPoints: 10, weight: 0.3 },
      { id: 'crit-1-2', name: 'Problem Solving', description: 'Evaluates the ability to analyze problems and devise effective solutions.', maxPoints: 10, weight: 0.3 },
      { id: 'crit-1-3', name: 'Code Quality', description: 'Reviews code for readability, structure, and best practices.', maxPoints: 10, weight: 0.2 },
      { id: 'crit-1-4', name: 'Communication', description: 'Judges the clarity of explanations and thought process.', maxPoints: 10, weight: 0.2 },
    ],
  },
  {
    id: 'schema-2',
    name: 'Frontend Specialist Evaluation',
    description: 'A schema focused on frontend-specific skills and user experience.',
    isActive: false,
    criteria: [
      { id: 'crit-2-1', name: 'React Proficiency', description: 'Correct use of hooks, components, and state management.', maxPoints: 10, weight: 0.4 },
      { id: 'crit-2-2', name: 'UI/UX Implementation', description: 'Attention to detail in implementing the design.', maxPoints: 10, weight: 0.3 },
      { id: 'crit-2-3', name: 'Responsiveness', description: 'How well the solution adapts to different screen sizes.', maxPoints: 10, weight: 0.2 },
      { id: 'crit-2-4', name: 'Performance', description: 'Efficiency of the code and awareness of rendering performance.', maxPoints: 10, weight: 0.1 },
    ],
  },
  {
    id: 'schema-3',
    name: 'Soft Skills Assessment',
    description: 'Focuses on non-technical aspects like communication and teamwork.',
    isActive: true,
    criteria: [
      { id: 'crit-3-1', name: 'Clarity of Communication', description: 'How clearly ideas are presented.', maxPoints: 10, weight: 0.5 },
      { id: 'crit-3-2', name: 'Proactiveness', description: 'Did the candidate ask clarifying questions or suggest improvements?', maxPoints: 10, weight: 0.3 },
      { id: 'crit-3-3', name: 'Presentation', description: 'The overall quality and polish of the submission.', maxPoints: 10, weight: 0.2 },
    ],
  },
];

export const mockActivityLogs: Activity[] = [
  {
    id: 'log-1',
    performerId: 'user-1',
    actionType: 'submission',
    timestamp: '2024-08-10T10:00:00Z',
    targetEntity: { type: 'Submission', id: 'sub-1', name: 'Responsive Navbar' },
    status: 'Success',
    description: 'Alice Candidate submitted work for "Build a Responsive Navbar Component".'
  },
  {
    id: 'log-2',
    performerId: 'user-2',
    actionType: 'status_change',
    timestamp: '2024-08-12T09:00:00Z',
    targetEntity: { type: 'Submission', id: 'sub-1', name: 'Responsive Navbar' },
    status: 'Success',
    description: 'Bob Company changed status to Shortlisted for submission sub-1.'
  },
  {
    id: 'log-3',
    performerId: 'user-3',
    actionType: 'override',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
    targetEntity: { type: 'Submission', id: 'sub-2', name: 'Navbar Project' },
    status: 'Success',
    description: 'Charlie Admin overrode the score for submission sub-2.'
  },
  {
    id: 'log-4',
    performerId: 'user-5',
    actionType: 'task_update',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    targetEntity: { type: 'Task', id: 'task-4', name: 'Fullstack Project Challenge' },
    status: 'Success',
    description: 'Ethan Employer created a new task "Fullstack Project Challenge".'
  },
  {
    id: 'log-5',
    performerId: 'user-4',
    actionType: 'login',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
    targetEntity: { type: 'User', id: 'user-4', name: 'Diana Developer' },
    status: 'Success',
    description: 'Diana Developer logged in.'
  },
  {
    id: 'log-6',
    performerId: 'user-2',
    actionType: 'login',
    timestamp: new Date().toISOString(),
    targetEntity: { type: 'User', id: 'user-2', name: 'Bob Company' },
    status: 'Failed',
    description: 'Bob Company failed to log in (invalid password).'
  },
    {
    id: 'log-7',
    performerId: 'user-3',
    actionType: 'user_created',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    targetEntity: { type: 'User', id: 'user-4', name: 'Diana Developer' },
    status: 'Success',
    description: 'Admin created a new candidate user: Diana Developer.'
  },
  {
    id: 'log-8',
    performerId: 'user-3',
    actionType: 'company_created',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(),
    targetEntity: { type: 'Company', id: 'company-2', name: 'Innovate Inc.' },
    status: 'Success',
    description: 'Admin created a new company profile: Innovate Inc.'
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'alert-1',
    type: 'task_deadline',
    priority: 'High',
    status: 'Unread',
    timestamp: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    title: 'Task Deadline Approaching',
    description: 'Task "Build a Responsive Navbar Component" is due in less than 24 hours.',
    relatedEntity: { type: 'Task', id: 'task-1', name: 'Build a Responsive Navbar Component' },
  },
  {
    id: 'alert-2',
    type: 'new_submission',
    priority: 'Medium',
    status: 'Unread',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
    title: 'New Submission Received',
    description: 'A new submission was received from Diana Developer for "Database Schema Design".',
    relatedEntity: { type: 'Submission', id: 'sub-6' },
  },
  {
    id: 'alert-3',
    type: 'user_signup',
    priority: 'Low',
    status: 'Read',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    title: 'New Company Signed Up',
    description: 'A new company, "Innovate Inc.", has joined the platform.',
    relatedEntity: { type: 'Company', id: 'company-2', name: 'Innovate Inc.' },
  },
  {
    id: 'alert-4',
    type: 'system_warning',
    priority: 'High',
    status: 'Resolved',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    title: 'High API Error Rate',
    description: 'Third-party API for stock data is reporting a high error rate (over 5%).',
    relatedEntity: { type: 'System', id: 'api-financial-prep', name: 'Financial Modeling Prep API' },
  },
  {
    id: 'alert-5',
    type: 'flagged_submission',
    priority: 'High',
    status: 'Unread',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(),
    title: 'Submission Flagged for Review',
    description: 'Submission from a candidate was flagged for potential plagiarism.',
    relatedEntity: { type: 'Submission', id: 'sub-2', name: 'Navbar Project by Diana Developer' },
  },
  {
    id: 'alert-6',
    type: 'task_deadline',
    priority: 'Medium',
    status: 'Read',
    timestamp: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
    title: 'Task Deadline Approaching',
    description: 'Task "Create a Serverless API Endpoint" is due in 3 days.',
    relatedEntity: { type: 'Task', id: 'task-3', name: 'Create a Serverless API Endpoint' },
  },
  {
    id: 'alert-7',
    type: 'system_warning',
    priority: 'High',
    status: 'Unread',
    timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 15)).toISOString(),
    title: 'Integration Error: Jira',
    description: 'Failed to create a ticket for a flagged submission. The API returned a 401 Unauthorized error.',
    relatedEntity: { type: 'System', id: 'api-2', name: 'Jira Cloud' },
  },
  {
    id: 'alert-8',
    type: 'user_signup',
    priority: 'Low',
    status: 'Read',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString(),
    title: 'New Candidate Joined',
    description: 'A new candidate, "Ivy Innovator", has signed up.',
    relatedEntity: { type: 'User', id: 'user-9', name: 'Ivy Innovator' },
  },
  {
    id: 'alert-9',
    type: 'new_submission',
    priority: 'Medium',
    status: 'Unread',
    timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 45)).toISOString(),
    title: 'Multi-Round Task Advanced',
    description: 'Alice Candidate has advanced to Round 2 for "Fullstack Project Challenge".',
    relatedEntity: { type: 'Submission', id: 'sub-4', name: 'Fullstack Project Challenge' },
  },
];

export const mockGitHubRepositories: GitHubRepository[] = [
  {
    id: 'repo-1',
    name: 'alice-candidate/responsive-navbar',
    url: 'https://github.com/alice-candidate/responsive-navbar',
    ownerName: 'Alice Candidate',
    ownerId: 'user-1',
    status: 'Connected',
    lastSync: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
    commitCount: 15,
    branchCount: 3,
    lastCommitMessage: 'feat: add dark mode support',
  },
  {
    id: 'repo-2',
    name: 'diana-developer/navbar-project',
    url: 'https://github.com/diana-developer/navbar-project',
    ownerName: 'Diana Developer',
    ownerId: 'user-4',
    status: 'Error',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    commitCount: 8,
    branchCount: 2,
    lastCommitMessage: 'fix: resolve mobile layout bug',
  },
  {
    id: 'repo-3',
    name: 'shared-team/fullstack-challenge',
    url: 'https://github.com/shared-team/fullstack-challenge',
    ownerName: 'TechCorp Team',
    ownerId: 'company-1',
    status: 'Connected',
    lastSync: new Date().toISOString(),
    commitCount: 42,
    branchCount: 5,
    lastCommitMessage: 'refactor: update database schema',
  },
    {
    id: 'repo-4',
    name: 'innovate-inc/marketing-site',
    url: 'https://github.com/innovate-inc/marketing-site',
    ownerName: 'Innovate Inc.',
    ownerId: 'company-2',
    status: 'Pending',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    commitCount: 3,
    branchCount: 1,
    lastCommitMessage: 'Initial commit',
  },
];

export const mockWebhooks: Webhook[] = [
  {
    id: 'wh-1',
    name: 'Zapier: New Submission',
    url: 'https://hooks.zapier.com/hooks/catch/12345/abcde/',
    events: ['submission.created'],
    status: 'Active',
    lastTriggered: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
  },
  {
    id: 'wh-2',
    name: 'Slack: Evaluation Completed',
    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    events: ['submission.evaluated'],
    status: 'Active',
    lastTriggered: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
  {
    id: 'wh-3',
    name: 'Internal Analytics Service',
    url: 'https://internal-analytics.skillmatch.pro/webhook',
    events: ['submission.created', 'submission.evaluated', 'user.created'],
    status: 'Inactive',
  },
  {
    id: 'wh-4',
    name: 'External CRM Sync',
    url: 'https://crm.example.com/api/v1/webhook',
    events: ['user.created'],
    status: 'Error',
    lastTriggered: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
  },
];

export const mockWebhookTriggerLogs: WebhookTriggerLog[] = [
    { id: 'log-wh-1', webhookId: 'wh-1', timestamp: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(), status: 'Success', payload: JSON.stringify({ event: 'submission.created', submissionId: 'sub-6', candidateName: 'Diana Developer' }, null, 2) },
    { id: 'log-wh-2', webhookId: 'wh-1', timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: 'Success', payload: JSON.stringify({ event: 'submission.created', submissionId: 'sub-7', candidateName: 'Alice Candidate' }, null, 2) },
    { id: 'log-wh-3', webhookId: 'wh-2', timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: 'Success', payload: JSON.stringify({ event: 'submission.evaluated', submissionId: 'sub-1', score: 84 }, null, 2) },
    { id: 'log-wh-4', webhookId: 'wh-4', timestamp: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), status: 'Failed', payload: JSON.stringify({ event: 'user.created', userId: 'user-4', error: 'Invalid API Key' }, null, 2) },
];

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Frontend Wizards',
    companyId: 'company-1',
    memberIds: ['user-2', 'user-6'],
    leadId: 'user-2',
  },
  {
    id: 'team-2',
    name: 'API Ninjas',
    companyId: 'company-2',
    memberIds: ['user-5', 'user-8'],
    leadId: 'user-5',
  },
  {
    id: 'team-3',
    name: 'TechCorp General',
    companyId: 'company-1',
    memberIds: ['user-2', 'user-6', 'user-7'],
    leadId: 'user-2',
  },
];

export const mockApiIntegrations: ApiIntegration[] = [
  {
    id: 'api-1',
    name: 'Greenhouse',
    category: 'DevOps',
    description: 'Syncs shortlisted candidates with Greenhouse jobs.',
    status: 'Active',
    lastSync: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
    apiKey: 'GR_key_******************',
    endpointUrl: 'https://harvest.greenhouse.io/v1/candidates',
    subscribedEvents: ['submission.evaluated'],
  },
  {
    id: 'api-2',
    name: 'Jira Cloud',
    category: 'DevOps',
    description: 'Creates a Jira ticket for flagged submissions.',
    status: 'Active',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    apiKey: 'jira_pat_******************',
    endpointUrl: 'https://your-domain.atlassian.net/rest/api/3/issue',
    subscribedEvents: ['submission.evaluated'],
  },
  {
    id: 'api-3',
    name: 'Slack',
    category: 'Chat',
    description: 'Sends notifications to a Slack channel for new submissions.',
    status: 'Inactive',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    apiKey: 'xoxb-******************',
    endpointUrl: 'https://slack.com/api/chat.postMessage',
    subscribedEvents: ['submission.created'],
  },
  {
    id: 'api-4',
    name: 'Sentry',
    category: 'Monitoring',
    description: 'Reports application errors to Sentry for tracking.',
    status: 'Error',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    apiKey: 'sentry_dsn_******************',
    endpointUrl: 'https://o45040.ingest.sentry.io/api/45040/store/',
    subscribedEvents: ['user.created'],
  },
  {
    id: 'api-5',
    name: 'Google Analytics',
    category: 'Analytics',
    description: 'Tracks user engagement and platform events.',
    status: 'Active',
    lastSync: new Date(new Date().setHours(new Date().getHours() - 4)).toISOString(),
    apiKey: 'G-**********',
    endpointUrl: 'https://www.google-analytics.com/mp/collect',
    subscribedEvents: ['user.created', 'task.published'],
  },
   {
    id: 'api-6',
    name: 'Vercel',
    category: 'DevOps',
    description: 'Triggers deployments based on GitHub commits.',
    status: 'Active',
    lastSync: new Date(new Date().setMinutes(new Date().getMinutes() - 30)).toISOString(),
    apiKey: 'vercel_token_******************',
    endpointUrl: 'https://api.vercel.com/v1/deployments',
    subscribedEvents: [],
  },
  {
    id: 'api-7',
    name: 'Stripe',
    category: 'Payments',
    description: 'Connect your Stripe account to process payments for subscriptions.',
    status: 'Active',
    lastSync: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
    apiKey: 'sk_test_******************',
    endpointUrl: 'https://api.stripe.com/v1',
    subscribedEvents: ['submission.evaluated'],
  },
  {
    id: 'api-8',
    name: 'PayPal',
    category: 'Payments',
    description: 'Allow candidates and companies to pay via PayPal.',
    status: 'Inactive',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    apiKey: 'paypal_secret_******************',
    endpointUrl: 'https://api.paypal.com/v1',
    subscribedEvents: [],
  },
  {
    id: 'api-9',
    name: 'Razorpay',
    category: 'Payments',
    description: 'Integrate with Razorpay for local payment methods.',
    status: 'Error',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    apiKey: 'rzp_test_******************',
    endpointUrl: 'https://api.razorpay.com/v1',
    subscribedEvents: ['submission.created'],
  },
  {
    id: 'api-10',
    name: 'PayU',
    category: 'Payments',
    description: 'Integrate with PayU for payment gateway services, popular in India and other emerging markets.',
    status: 'Inactive',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    apiKey: 'payu_key_******************',
    endpointUrl: 'https://api.payu.in/v1',
    subscribedEvents: [],
  },
  {
    id: 'api-11',
    name: 'ACH / Bank Transfer (Plaid)',
    category: 'Payments',
    description: 'Enable direct bank transfers using Plaid for ACH payments.',
    status: 'Inactive',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    apiKey: 'plaid_secret_******************',
    endpointUrl: 'https://api.plaid.com',
    subscribedEvents: [],
  }
];

export const mockIntegrationLogs: IntegrationLog[] = [
  {
    id: 'int-log-1',
    source: 'GitHub',
    eventType: 'commit.pushed',
    status: 'Success',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
    description: 'Alice Candidate pushed a new commit to `responsive-navbar` repo.',
    relatedEntity: { type: 'Submission', id: 'sub-1', name: 'sub-1' },
  },
  {
    id: 'int-log-2',
    source: 'Webhook',
    eventType: 'submission.evaluated',
    status: 'Success',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
    description: 'Sent "submission.evaluated" event to Zapier webhook.',
    relatedEntity: { type: 'Submission', id: 'sub-1', name: 'sub-1' },
  },
  {
    id: 'int-log-3',
    source: 'Jira',
    eventType: 'ticket.created',
    status: 'Error',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(),
    description: 'Failed to create Jira ticket for flagged submission sub-2. Reason: API Authentication Failed.',
    relatedEntity: { type: 'Submission', id: 'sub-2', name: 'sub-2' },
  },
    {
    id: 'int-log-4',
    source: 'Slack',
    eventType: 'notification.sent',
    status: 'Success',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    description: 'Posted notification for new submission to #hiring channel.',
    relatedEntity: { type: 'Submission', id: 'sub-6', name: 'sub-6' },
  },
    {
    id: 'int-log-5',
    source: 'Sentry',
    eventType: 'error.reported',
    status: 'Warning',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    description: 'Reported a 500 Internal Server Error for GET /api/items/not-found.',
    relatedEntity: { type: 'System', id: 'backend-api', name: 'Backend API' },
  },
   {
    id: 'int-log-6',
    source: 'Vercel',
    eventType: 'deployment.created',
    status: 'Success',
    timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 30)).toISOString(),
    description: 'New deployment triggered from main branch commit.',
    relatedEntity: { type: 'System', id: 'frontend-app', name: 'Frontend App' },
  },
];

// Mock system metrics for the last minute (30 data points, 2 seconds apart)
export const mockSystemMetrics: SystemMetric[] = Array.from({ length: 30 }, (_, i) => {
    const timestamp = new Date(Date.now() - (30 - i) * 2000).toISOString();
    const scalingStatuses: AutoScalingStatus[] = ['Stable', 'Stable', 'Stable', 'Scaling Up', 'Stable', 'Scaling Down'];
    return {
        id: `metric-${i}`,
        activeUsers: 120 + Math.floor(Math.random() * 20) - 10,
        activeSessions: 150 + Math.floor(Math.random() * 30) - 15,
        systemLoad: 40 + Math.floor(Math.random() * 20) * (Math.sin(i / 5) + 1.5),
        apiRequestsPerMinute: 2500 + Math.floor(Math.random() * 500) - 250,
        requestsPerSecond: 40 + Math.floor(Math.random() * 20) - 10,
        autoScalingStatus: scalingStatuses[i % scalingStatuses.length],
        errorRate: 1.5 + Math.random() * (i % 10 === 0 ? 3 : 1) - 0.5,
        timestamp,
        avgApiResponseTime: 80 + Math.floor(Math.random() * 40) * (Math.cos(i / 4) + 1), // ms
        dbQueryTime: 20 + Math.floor(Math.random() * 15) * (Math.sin(i / 3) + 1), // ms
    };
});

export const mockServiceLoad: ServiceLoad[] = [
    { id: 'sl-1', name: 'Authentication', loadPercentage: 25, requestsHandled: 5000 },
    { id: 'sl-2', name: 'Database', loadPercentage: 65, requestsHandled: 12000 },
    { id: 'sl-3', name: 'API Gateway', loadPercentage: 85, requestsHandled: 25000 },
    { id: 'sl-4', name: 'Task Queue', loadPercentage: 40, requestsHandled: 8000 },
    { id: 'sl-5', name: 'AI Assistant', loadPercentage: 95, requestsHandled: 3000 },
    { id: 'sl-6', name: 'Notifications', loadPercentage: 15, requestsHandled: 15000 },
];

export const mockScalingEvents: ScalingEvent[] = [
  { id: 'se-1', timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(), change: 'up', instanceCount: 4, reason: 'High CPU Usage' },
  { id: 'se-2', timestamp: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(), change: 'down', instanceCount: 3, reason: 'Low traffic period' },
  { id: 'se-3', timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), change: 'up', instanceCount: 3, reason: 'Increased API requests' },
];

export const mockServiceStatus: ServiceStatus[] = [
    { id: 'service-1', name: 'Authentication', status: 'Running', lastChecked: new Date().toISOString(), uptimePercentage: 99.98, lastDowntime: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString() },
    { id: 'service-2', name: 'Database', status: 'Running', lastChecked: new Date().toISOString(), uptimePercentage: 100 },
    { id: 'service-3', name: 'API Gateway', status: 'Degraded', lastChecked: new Date().toISOString(), uptimePercentage: 99.5, lastDowntime: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString() },
    { id: 'service-4', name: 'Task Queue', status: 'Running', lastChecked: new Date().toISOString(), uptimePercentage: 99.99 },
    { id: 'service-5', name: 'AI Assistant', status: 'Running', lastChecked: new Date().toISOString(), uptimePercentage: 100 },
    { id: 'service-6', name: 'Notifications', status: Math.random() > 0.9 ? 'Down' : 'Running', lastChecked: new Date().toISOString(), uptimePercentage: 99.8, lastDowntime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() },
];

export const mockSystemLogs: SystemLog[] = Array.from({ length: 75 }, (_, i) => {
  const services = ['API', 'Auth', 'Database', 'TaskQueue', 'IntegrationService', 'Frontend'];
  const severities: LogSeverity[] = ['Info', 'Info', 'Info', 'Warning', 'Error'];
  const messages = {
    Info: [
      'User user-1 successfully authenticated.',
      'GET /api/tasks request completed in 25ms.',
      'New submission sub-1 processed.',
      'Task task-1 status updated to "in-review".',
      'Data cache for companies cleared.',
    ],
    Warning: [
      'Database query took longer than expected (850ms).',
      'API rate limit approaching for external service: GitHub.',
      'Unusual login pattern detected for user-4.',
      'Memory usage at 85%.',
    ],
    Error: [
      'Failed to connect to database: Connection refused.',
      'Unhandled exception in TaskQueue processor: TypeError: cannot read property "x" of undefined.',
      'Third-party API "Stripe" returned status 503.',
      'Authentication token expired for internal service communication.',
      'Failed to write submission file to storage: Permission denied.',
    ],
  };

  const severity = severities[i % severities.length];
  const messageList = messages[severity];

  return {
    id: `syslog-${i + 1}`,
    service: services[i % services.length],
    severity: severity,
    timestamp: new Date(Date.now() - i * 30 * 60 * 1000).toISOString(), // every 30 mins
    message: messageList[i % messageList.length]
  }
});


export const mockSystemErrors: SystemError[] = [
  {
    id: 'err-1',
    service: 'API',
    type: 'Unhandled Exception',
    severity: 'Critical',
    message: "TypeError: Cannot read properties of undefined (reading 'id')",
    stackTrace: 'at /app/src/services/userService.ts:42:15\nat processTicksAndRejections (node:internal/process/task_queues:95:5)',
    frequency: 125,
    lastOccurred: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
    status: 'Open',
    affectedUsers: 42,
  },
  {
    id: 'err-2',
    service: 'Database',
    type: 'Connection Error',
    severity: 'Critical',
    message: 'Failed to connect to database: Connection timed out',
    stackTrace: 'at /app/src/lib/database.ts:25:11',
    frequency: 3,
    lastOccurred: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    status: 'Resolved',
    affectedUsers: 500,
  },
  {
    id: 'err-3',
    service: 'IntegrationService',
    type: 'API Timeout',
    severity: 'Warning',
    message: 'Request to third-party API "GitHub" timed out after 10000ms.',
    stackTrace: 'at /app/src/services/githubService.ts:112:8',
    frequency: 342,
    lastOccurred: new Date(new Date().setMinutes(new Date().getMinutes() - 30)).toISOString(),
    status: 'Open',
    affectedUsers: 15,
  },
  {
    id: 'err-4',
    service: 'Frontend',
    type: 'Rendering Error',
    severity: 'Minor',
    message: 'Hydration failed because the initial UI does not match what was rendered on the server.',
    stackTrace: 'at /app/src/components/ui/SomeComponent.tsx:55:21',
    frequency: 12,
    lastOccurred: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString(),
    status: 'Ignored',
    affectedUsers: 8,
  },
    {
    id: 'err-5',
    service: 'Auth',
    type: 'Authentication Error',
    severity: 'Warning',
    message: 'Invalid JWT signature.',
    stackTrace: 'at /app/src/middleware/auth.ts:15:9',
    frequency: 250,
    lastOccurred: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    status: 'Open',
    affectedUsers: 250,
  }
];

export const mockSystemIncidents: SystemIncident[] = [
    {
        id: 'inc-1',
        serviceName: 'API Gateway',
        status: 'Ongoing',
        startTime: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
        description: 'Increased API latency and 5xx error rates.',
    },
    {
        id: 'inc-2',
        serviceName: 'Notifications',
        status: 'Resolved',
        startTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        endTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(new Date().getHours() + 1)).toISOString(),
        durationMinutes: 45,
        description: 'Notification delivery was delayed due to a queue blockage.'
    },
    {
        id: 'inc-3',
        serviceName: 'Authentication',
        status: 'Resolved',
        startTime: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
        endTime: new Date(new Date(new Date().setDate(new Date().getDate() - 3)).setMinutes(new Date().getMinutes() + 15)).toISOString(),
        durationMinutes: 15,
        description: 'Login service was unavailable for a short period.'
    },
    {
        id: 'inc-4',
        serviceName: 'Database',
        status: 'Investigating',
        startTime: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
        description: 'Investigating reports of slow database queries.'
    },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    companyId: 'company-1',
    amount: 85.32,
    date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    dueDate: new Date(new Date().setMonth(new Date().getMonth() - 1, 15)).toISOString(),
    status: 'Paid',
    planName: 'Pro Plan',
    billingPeriod: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
      end: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    },
    lineItems: [
      { id: 'item-1', description: 'Pro Plan (Monthly)', quantity: 1, unitPrice: 79.00, total: 79.00 },
    ],
    subtotal: 79.00,
    tax: 6.32,
  },
  {
    id: 'inv-002',
    companyId: 'company-1',
    amount: 79.00,
    date: new Date().toISOString(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    status: 'Due',
    planName: 'Pro Plan',
     billingPeriod: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      end: new Date().toISOString(),
    },
    lineItems: [
      { id: 'item-1', description: 'Pro Plan (Monthly)', quantity: 1, unitPrice: 79.00, total: 79.00 },
    ],
    subtotal: 79.00,
    tax: 0.00,
  },
  {
    id: 'inv-003',
    companyId: 'company-2',
    amount: 31.32,
    date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
    dueDate: new Date(new Date().setMonth(new Date().getMonth() - 2, 15)).toISOString(),
    status: 'Paid',
    planName: 'Basic Plan',
    billingPeriod: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
      end: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
    },
    lineItems: [
      { id: 'item-1', description: 'Basic Plan (Monthly)', quantity: 1, unitPrice: 29.00, total: 29.00 },
    ],
    subtotal: 29.00,
    tax: 2.32,
  },
  {
    id: 'inv-004',
    companyId: 'company-2',
    amount: 31.32,
    date: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
    dueDate: new Date(new Date().setMonth(new Date().getMonth() - 3, 15)).toISOString(),
    status: 'Overdue',
    planName: 'Basic Plan',
    billingPeriod: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 4)).toISOString(),
      end: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
    },
    lineItems: [
      { id: 'item-1', description: 'Basic Plan (Monthly)', quantity: 1, unitPrice: 29.00, total: 29.00 },
    ],
    subtotal: 29.00,
    tax: 2.32,
  },
   {
    id: 'inv-005',
    companyId: 'company-1',
    amount: 853.20,
    date: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
    dueDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1, new Date().getMonth(), 15)).toISOString(),
    status: 'Paid',
    planName: 'Pro Plan (Yearly)',
    billingPeriod: {
      start: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString(),
      end: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
    },
    lineItems: [
      { id: 'item-1', description: 'Pro Plan (Yearly)', quantity: 1, unitPrice: 790.00, total: 790.00 },
    ],
    subtotal: 790.00,
    tax: 63.20,
  },
];


export const mockPlanUsage: PlanUsage[] = [
  { feature: 'API Calls', usage: 12500, limit: 50000, unit: 'requests' },
  { feature: 'Tasks', usage: 42, limit: 50, unit: 'tasks' },
  { feature: 'Storage', usage: 15, limit: 50, unit: 'GB' },
];

export const mockUsageMetrics: UsageMetric[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(new Date().setDate(new Date().getDate() - (29 - i))).toISOString().split('T')[0],
  apiCalls: 10000 + Math.floor(Math.random() * 5000) * (Math.sin(i / 5) + 1.2),
  tasksCreated: 5 + Math.floor(Math.random() * 3),
  storageUsage: 15 + i * 0.1 + Math.random(),
})).map(d => ({...d, apiCalls: Math.round(d.apiCalls), tasksCreated: Math.round(d.tasksCreated)}));


export const mockRevenueMetrics: RevenueMetric[] = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(2023, i, 1);
  const month = date.toLocaleString('default', { month: 'short' });
  return {
    month,
    mrr: 15000 + i * 2000 + Math.random() * 1000,
    newSubscriptions: 20 + i * 2 + Math.floor(Math.random() * 5),
    churn: 5 + Math.floor(Math.random() * 3),
  };
});

export const mockPlanDistribution: PlanDistribution[] = [
    { plan: 'Basic', count: 85 },
    { plan: 'Pro', count: 150 },
    { plan: 'Enterprise', count: 25 },
];

export const mockRevenueSources: RevenueSource[] = [
    { source: 'Subscriptions', amount: 52300 },
    { source: 'Usage-based', amount: 8400 },
    { source: 'Add-ons', amount: 3200 },
];

export const mockPlans: Plan[] = [
  { id: 'plan-free', name: 'Free', priceMonthly: 0, priceYearly: 0, limits: { tasks: 1, submissions: 3, teamMembers: 1 }, features: ['1 Active Task', '3 Submissions per month', 'Basic Analytics'] },
  { id: 'plan-pro', name: 'Pro', priceMonthly: 79, priceYearly: 790, limits: { tasks: 10, submissions: -1, teamMembers: 10 }, features: ['10 Active Tasks', 'Unlimited Submissions', 'Advanced Analytics', 'AI Task Assistant'] },
  { id: 'plan-ent', name: 'Enterprise', priceMonthly: 0, priceYearly: 0, limits: { tasks: -1, submissions: -1, teamMembers: -1 }, features: ['Unlimited Everything', 'Custom Integrations', 'Dedicated Support'] },
];

export const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-comp-1',
    companyId: 'company-1',
    planId: 'plan-pro',
    status: 'ACTIVE',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    billingCycle: 'YEARLY',
    paymentProvider: 'STRIPE',
    externalSubscriptionId: 'sub_123abc',
    usage: {
        tasksCreated: 8,
        submissionsReceived: 120,
    }
  },
  {
    id: 'sub-comp-2',
    companyId: 'company-2',
    planId: 'plan-free',
    status: 'TRIAL',
    startDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
    billingCycle: 'MONTHLY',
    usage: {
        tasksCreated: 1,
        submissionsReceived: 2,
    }
  },
];
