'use strict';
/**
 * The roles it takes to run the company — one entry per opening, across every
 * department in departments.js.
 *
 * This is a catalogue, not a wish list: each entry is a role a company of this shape
 * genuinely staffs, written the way the posting should read. `scripts/seedRoles.js`
 * turns them into listings.
 *
 * Salary bands follow Baalvion's actual pay structure, not a generic market survey:
 *
 *   ₹12,000/month   site labour and support staff — the floor
 *   ₹15,000/month   interns
 *   ₹15,000–28,000  operators and skilled trades, monthly
 *   ₹3–5 LPA        entry, salaried
 *   ₹7–14 LPA       mid
 *   ₹14–21 LPA      senior
 *   ₹23–30 LPA      lead and head-of — the ceiling
 *
 * `period` matters: site labour, trades, operators, support staff and interns are paid
 * MONTHLY, which is how those wages are actually quoted and paid. Everything else is an
 * annual band. Quoting a ₹15,000 stipend as an annual figure misrepresents the offer.
 *
 * Overseas roles use the same four-step ladder expressed in local currency at
 * market-equivalent value — the company's structure, not a converted rupee figure.
 *
 * `level` maps to the backend's experience_level enum: entry | mid | senior | lead.
 */

// Where a function is staffed. Keeping this per-role rather than per-department means
// the same title can be open in two places with different bands.
const IN = { countryId: 'country_in', currency: 'INR' };
const US = { countryId: 'country_us', currency: 'USD' };
const GB = { countryId: 'country_gb', currency: 'GBP' };

const ROLES = [
  // ══ Engineering ════════════════════════════════════════════════════════════
  {
    title: 'Frontend Engineer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['React', 'TypeScript', 'Next.js', 'CSS'],
    description:
      'Build the candidate-facing surfaces of TalentOS: the job board, the application flow and the dashboard people track their applications from. You will own features end to end, from the API contract through to what a candidate sees on a slow connection in a train.',
    requirements: [
      'Three or more years building production React, with real opinions about component boundaries',
      'Comfortable with TypeScript as a design tool rather than a formality',
      'Have shipped something where performance and accessibility mattered, and can say what you changed',
    ],
  },
  {
    title: 'Senior Backend Engineer', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    ...IN, city: 'Pune', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'API Design'],
    description:
      'Own services in the hiring platform: applications, interviews, offers and the queues behind them. The data model is multi-tenant and the correctness bar is high — an application that goes missing is somebody’s career.',
    requirements: [
      'Five or more years on backend systems, including schema design you still stand behind',
      'Practical experience with queues, idempotency and the failure modes of both',
      'Able to reason about a slow query from the plan, not from guesswork',
    ],
  },
  {
    title: 'Staff Engineer, Platform', department: 'dept_eng_it', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [2300000, 3000000],
    skills: ['Distributed Systems', 'Node.js', 'PostgreSQL', 'Architecture'],
    description:
      'Set the technical direction across services that several teams build on: authentication, tenancy, eventing and the shared libraries everyone depends on. Most of the job is making other teams faster.',
    requirements: [
      'Ten or more years building and operating systems at scale',
      'A track record of architectural decisions you can explain the trade-offs of, including ones that went wrong',
      'Comfortable writing the document that settles an argument',
    ],
  },
  {
    title: 'Mobile Engineer (React Native)', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    ...IN, city: 'Hyderabad', region: 'Telangana', remote: true, salary: [700000, 1400000],
    skills: ['React Native', 'TypeScript', 'iOS', 'Android'],
    description:
      'Build the candidate mobile experience — applying, tracking and interviewing from a phone, which is how most of our candidates use the product.',
    requirements: [
      'Shipped and maintained a React Native app through at least one major OS upgrade',
      'Understand the native layer well enough to debug through it',
    ],
  },
  {
    title: 'Engineering Manager', department: 'dept_eng_it', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Leadership', 'Node.js', 'Hiring', 'Delivery'],
    description:
      'Lead a team of six to eight engineers across the hiring platform. You will still read code and join design reviews; you will not be the person writing most of it.',
    requirements: [
      'Two or more years managing engineers, including performance conversations you handled well',
      'A strong enough technical background to disagree usefully in a design review',
    ],
  },

  // ══ Product ════════════════════════════════════════════════════════════════
  {
    title: 'Product Manager, Candidate Experience', department: 'dept_prod', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Product Strategy', 'User Research', 'SQL', 'Roadmapping'],
    description:
      'Own everything a candidate touches, from the first job they see to the offer they accept. The hardest part of this role is deciding what not to build.',
    requirements: [
      'Three or more years in product, on something people used daily',
      'You can write a spec an engineer does not have to interpret',
      'Comfortable pulling your own numbers',
    ],
  },
  {
    title: 'Senior Product Manager, ATS', department: 'dept_prod', level: 'senior', type: 'full_time',
    ...US, city: 'Remote', region: null, remote: true, salary: [85000, 115000],
    skills: ['Product Strategy', 'B2B SaaS', 'Analytics'],
    description:
      'Own the recruiter-facing console: pipelines, interviews, offers and reporting. Your users do this job eight hours a day, and they will tell you exactly what is wrong with it.',
    requirements: [
      'Five or more years of B2B product, ideally where the user is not the buyer',
      'Experience with a workflow-heavy product where configurability fights simplicity',
    ],
  },
  {
    title: 'Technical Program Manager', department: 'dept_prod', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Program Management', 'Delivery', 'Risk Management'],
    description:
      'Run the programmes that cross more than one team: platform migrations, compliance work and launches with a date attached to them.',
    requirements: [
      'Five or more years running technical programmes across multiple teams',
      'Able to hold a schedule honestly, including when it slips',
    ],
  },

  // ══ Design ═════════════════════════════════════════════════════════════════
  {
    title: 'Product Designer', department: 'dept_design', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Figma', 'Interaction Design', 'Prototyping'],
    description:
      'Design the flows people move through under pressure: applying for work, sitting an interview, receiving an offer. Clarity matters more than novelty here.',
    requirements: [
      'A portfolio showing the reasoning, not only the final screens',
      'Comfortable designing at the level of states and edge cases, not just the happy path',
    ],
  },
  {
    title: 'Senior UX Researcher', department: 'dept_design', level: 'senior', type: 'full_time',
    ...GB, city: 'London', region: 'England', remote: true, salary: [55000, 75000],
    skills: ['User Research', 'Interviewing', 'Synthesis'],
    description:
      'Talk to candidates and recruiters, and turn what they say into decisions the team actually makes. You will own the research practice, not just individual studies.',
    requirements: [
      'Five or more years of applied research in product teams',
      'Able to say what the evidence does not support, to people who wanted it to',
    ],
  },
  {
    title: 'Design Systems Engineer', department: 'dept_design', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['React', 'CSS', 'Design Systems', 'Accessibility'],
    description:
      'Own the component library both the marketing site and the product build on: tokens, accessibility, documentation and the migration path when something changes.',
    requirements: [
      'Have built and maintained a component library other teams consumed',
      'Fluent in WCAG in practice, not just in principle',
    ],
  },

  // ══ Data ═══════════════════════════════════════════════════════════════════
  {
    title: 'Data Engineer', department: 'dept_data', level: 'mid', type: 'full_time',
    ...IN, city: 'Pune', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Python', 'SQL', 'Airflow', 'PostgreSQL'],
    description:
      'Build the pipelines behind hiring analytics — funnel conversion, time to hire, source quality — and be the person who can say whether a number is trustworthy.',
    requirements: [
      'Three or more years building batch pipelines that other people depended on',
      'Strong SQL, and the instinct to check a number before publishing it',
    ],
  },
  {
    title: 'Senior Data Scientist', department: 'dept_data', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Python', 'Machine Learning', 'Statistics', 'NLP'],
    description:
      'Work on candidate–role matching and resume understanding. Models here affect who gets seen, so evaluating for bias is part of the work rather than a review step at the end.',
    requirements: [
      'Five or more years applying ML to a product, including the parts that did not work',
      'Able to explain a model’s failure modes to someone who will act on the answer',
    ],
  },
  {
    title: 'Analytics Engineer', department: 'dept_data', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['SQL', 'dbt', 'Data Modelling'],
    description:
      'Own the semantic layer between raw tables and the dashboards the business runs on, so that two teams asking the same question get the same answer.',
    requirements: ['Three or more years in analytics engineering or a very SQL-heavy analyst role'],
  },
  {
    title: 'Business Intelligence Analyst', department: 'dept_data', level: 'entry', type: 'full_time',
    ...IN, city: 'Hyderabad', region: 'Telangana', remote: false, salary: [300000, 500000],
    skills: ['SQL', 'Excel', 'Dashboards'],
    description:
      'Build and maintain the reporting the commercial and people teams use weekly, and answer the questions those reports raise.',
    requirements: ['One or more years with SQL and a BI tool', 'Careful with definitions — you will be the one asked what a metric means'],
  },

  // ══ Quality ════════════════════════════════════════════════════════════════
  {
    title: 'QA Automation Engineer', department: 'dept_qa', level: 'mid', type: 'full_time',
    ...IN, city: 'Chennai', region: 'Tamil Nadu', remote: true, salary: [700000, 1400000],
    skills: ['Playwright', 'TypeScript', 'CI/CD'],
    description:
      'Own the end-to-end suite across the candidate and recruiter journeys, and keep it fast and trusted enough that people do not merge around it.',
    requirements: ['Three or more years automating browser tests', 'Have dealt with flakiness properly rather than by retrying'],
  },
  {
    title: 'QA Lead', department: 'dept_qa', level: 'lead', type: 'full_time',
    ...IN, city: 'Chennai', region: 'Tamil Nadu', remote: false, salary: [2300000, 3000000],
    skills: ['Test Strategy', 'Automation', 'Leadership'],
    description:
      'Set how quality works across the engineering group: what gets automated, what gets tested by hand, and what ships without either.',
    requirements: ['Seven or more years in quality engineering, some of it leading'],
  },

  // ══ Infrastructure ═════════════════════════════════════════════════════════
  {
    title: 'DevOps Engineer', department: 'dept_devops', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Docker', 'Kubernetes', 'Terraform', 'AWS'],
    description:
      'Own the delivery path from commit to production, and the observability that tells us when it went wrong before a customer does.',
    requirements: ['Three or more years running containerised workloads in production', 'Infrastructure as code by default'],
  },
  {
    title: 'Site Reliability Engineer', department: 'dept_devops', level: 'senior', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [1400000, 2100000],
    skills: ['Kubernetes', 'Observability', 'Incident Response', 'Go'],
    description:
      'Own availability across the platform: SLOs, on-call, capacity, and the postmortems that stop the same incident happening twice.',
    requirements: ['Five or more years in SRE or a comparable operations role', 'Have led an incident and written the review afterwards'],
  },
  {
    title: 'Cloud Infrastructure Architect', department: 'dept_devops', level: 'lead', type: 'full_time',
    ...US, city: 'Remote', region: null, remote: true, salary: [115000, 150000],
    skills: ['AWS', 'Terraform', 'Networking', 'Cost Optimisation'],
    description:
      'Own the shape of the cloud estate across regions — network, isolation, disaster recovery, and the bill.',
    requirements: ['Ten or more years in infrastructure, including a multi-region production estate'],
  },

  // ══ Security ═══════════════════════════════════════════════════════════════
  {
    title: 'Security Engineer', department: 'dept_security', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['AppSec', 'Threat Modelling', 'Cryptography'],
    description:
      'Work alongside engineering on the security of a platform holding identity documents and salary data: reviews, threat models, and the tooling that catches the rest.',
    requirements: ['Three or more years in application security', 'Can read the code, not only the scanner output'],
  },
  {
    title: 'Governance, Risk & Compliance Analyst', department: 'dept_security', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['ISO 27001', 'SOC 2', 'Risk Assessment'],
    description:
      'Run the certification calendar and the evidence behind it, and keep controls something the company does rather than something it documents.',
    requirements: ['Three or more years in GRC', 'Have been through at least one full audit cycle'],
  },
  {
    title: 'Head of Information Security', department: 'dept_security', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Security Strategy', 'Leadership', 'Compliance'],
    description:
      'Own security across the company: the programme, the team, the customer conversations and the decisions nobody else can sign off.',
    requirements: ['Twelve or more years in security, with several leading a function'],
  },

  // ══ IT & Workplace Technology ══════════════════════════════════════════════
  {
    title: 'IT Support Specialist', department: 'dept_it_support', level: 'entry', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [300000, 500000],
    skills: ['Endpoint Management', 'Troubleshooting', 'macOS', 'Windows'],
    description:
      'Keep the company working day to day: laptops, access, the meeting room that will not connect, and the joiner starting on Monday.',
    requirements: ['One or more years in IT support', 'Patient with people who are having a bad morning'],
  },
  {
    title: 'IT Systems Administrator', department: 'dept_it_support', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Identity Management', 'SaaS Administration', 'Automation'],
    description:
      'Own the internal systems estate: identity, device management, SaaS administration, and the joiner-mover-leaver process that keeps access correct.',
    requirements: ['Three or more years administering identity and device fleets'],
  },

  // ══ R&D ════════════════════════════════════════════════════════════════════
  {
    title: 'Applied Research Engineer', department: 'dept_rd', level: 'senior', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [1400000, 2100000],
    skills: ['Machine Learning', 'Python', 'Research'],
    description:
      'Take promising approaches in matching and language understanding from paper to something that survives production traffic.',
    requirements: ['Five or more years applying research to shipped products'],
  },

  // ══ Sales ══════════════════════════════════════════════════════════════════
  {
    title: 'Enterprise Account Executive', department: 'dept_sales', level: 'senior', type: 'full_time',
    ...US, city: 'Remote', region: null, remote: true, salary: [85000, 115000],
    skills: ['Enterprise Sales', 'Negotiation', 'Pipeline Management'],
    description:
      'Own new enterprise business end to end, from first conversation to signature, selling to talent leaders who have been sold to a great deal.',
    requirements: ['Five or more years closing enterprise SaaS', 'Have carried and hit a seven-figure number'],
  },
  {
    title: 'Account Executive, Mid-Market', department: 'dept_sales', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['B2B Sales', 'CRM', 'Discovery'],
    description:
      'Run the full cycle for mid-market accounts across India: prospecting, discovery, demo and close.',
    requirements: ['Three or more years in B2B sales with a full-cycle quota'],
  },
  {
    title: 'Sales Development Representative', department: 'dept_sales', level: 'entry', type: 'full_time',
    ...IN, city: 'Pune', region: 'Maharashtra', remote: false, salary: [300000, 500000],
    skills: ['Prospecting', 'Communication', 'CRM'],
    description:
      'Open conversations with talent leaders and hand the good ones to an account executive. It is the first rung, and we treat it as one.',
    requirements: ['Nothing formal — clear written English and persistence matter more than a CV'],
  },
  {
    title: 'Head of Sales, India', department: 'dept_sales', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Sales Leadership', 'Forecasting', 'Hiring'],
    description:
      'Own the India number and the team that carries it: territory, forecast, hiring and the operating rhythm underneath.',
    requirements: ['Ten or more years in sales, several leading a quota-carrying team'],
  },

  // ══ Solutions ══════════════════════════════════════════════════════════════
  {
    title: 'Solutions Engineer', department: 'dept_sales_eng', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Pre-Sales', 'APIs', 'Integrations', 'Demos'],
    description:
      'Be the technical half of the sales conversation: demos that survive scrutiny, integration questions answered honestly, and pilots that actually work.',
    requirements: ['Three or more years in pre-sales or a customer-facing engineering role'],
  },

  // ══ Marketing ══════════════════════════════════════════════════════════════
  {
    title: 'Content Marketing Manager', department: 'dept_mktg', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Content Strategy', 'SEO', 'Writing'],
    description:
      'Own the writing that brings people to us — research-led pieces about hiring that a talent leader would actually forward to a colleague.',
    requirements: ['Three or more years in content marketing', 'Writing samples you are willing to be judged on'],
  },
  {
    title: 'SEO & Growth Manager', department: 'dept_mktg', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['SEO', 'Analytics', 'Technical SEO', 'Experimentation'],
    description:
      'Own organic growth across a site with tens of thousands of location and role pages: technical health, internal linking, and the experiments that tell us what is working.',
    requirements: ['Three or more years in SEO on a large site', 'Comfortable in a log file and a spreadsheet'],
  },
  {
    title: 'Brand & Communications Lead', department: 'dept_mktg', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Brand Strategy', 'PR', 'Copywriting'],
    description:
      'Own how the company sounds and looks in public, and the press relationships behind it.',
    requirements: ['Six or more years across brand and communications'],
  },
  {
    title: 'Marketing Design Intern', department: 'dept_mktg', level: 'entry', type: 'internship', period: 'month',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [15000, 25000],
    skills: ['Figma', 'Visual Design'],
    description:
      'Six months on the marketing team designing campaigns, site pages and social work that goes out under your name.',
    requirements: ['A portfolio, in any form', 'Available for six months'],
  },

  // ══ Partnerships ═══════════════════════════════════════════════════════════
  {
    title: 'Partnerships Manager', department: 'dept_partnerships', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Business Development', 'Negotiation', 'Account Management'],
    description:
      'Build the relationships that put us in front of more employers and more candidates: job boards, ATS vendors, universities and industry bodies.',
    requirements: ['Four or more years in partnerships or business development'],
  },

  // ══ Customer Success ═══════════════════════════════════════════════════════
  {
    title: 'Customer Success Manager', department: 'dept_support', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Account Management', 'Onboarding', 'Retention'],
    description:
      'Own a book of employer accounts: get them live, keep them successful, and know before they do when something is going wrong.',
    requirements: ['Three or more years in customer success at a B2B product company'],
  },
  {
    title: 'Technical Support Engineer', department: 'dept_support', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Troubleshooting', 'SQL', 'APIs'],
    description:
      'Handle the escalations that need someone who can read a log and reproduce a bug, and write the fix up well enough for engineering to act on.',
    requirements: ['Two or more years in technical support', 'Comfortable in an API client and a database console'],
  },
  {
    title: 'Support Specialist', department: 'dept_support', level: 'entry', type: 'full_time',
    ...IN, city: 'Hyderabad', region: 'Telangana', remote: false, salary: [300000, 500000],
    skills: ['Communication', 'Empathy', 'Ticketing'],
    description:
      'First response for candidates and recruiters. Most of what you deal with is someone anxious about an application, so how you write matters.',
    requirements: ['Clear, kind written English', 'No prior support experience required'],
  },

  // ══ Implementation ═════════════════════════════════════════════════════════
  {
    title: 'Implementation Consultant', department: 'dept_impl', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Onboarding', 'Data Migration', 'Project Management'],
    description:
      'Take a new employer from signature to live: configuration, data migration, training and the first month of hand-holding.',
    requirements: ['Three or more years implementing B2B software for customers'],
  },

  // ══ Business Operations ════════════════════════════════════════════════════
  {
    title: 'Business Operations Analyst', department: 'dept_ops', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['SQL', 'Excel', 'Process Design'],
    description:
      'Find where the company loses time and fix it — usually with a better process, occasionally with a spreadsheet, sometimes by talking two teams into agreeing.',
    requirements: ['Two or more years in business operations, consulting or a similar analytical role'],
  },
  {
    title: 'Revenue Operations Manager', department: 'dept_ops', level: 'senior', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [1400000, 2100000],
    skills: ['CRM', 'Forecasting', 'Reporting'],
    description:
      'Own the systems and definitions behind the commercial number: CRM hygiene, territory, forecasting and the reporting leadership makes decisions on.',
    requirements: ['Five or more years in revenue or sales operations'],
  },

  // ══ Supply Chain ═══════════════════════════════════════════════════════════
  {
    title: 'Logistics Coordinator', department: 'dept_supply', level: 'entry', type: 'full_time',
    countryId: 'country_in', currency: 'INR', city: 'Bhiwandi', region: 'Maharashtra', remote: false, salary: [300000, 500000],
    skills: ['Coordination', 'Vendor Management', 'Excel'],
    description:
      'Coordinate equipment and asset movement across offices and remote staff — laptops out, laptops back, and a record that matches reality.',
    requirements: ['One or more years in logistics or operations coordination'],
  },
  {
    title: 'Supply Chain Manager', department: 'dept_supply', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Supply Chain', 'Vendor Management', 'Forecasting'],
    description:
      'Own hardware supply end to end: forecasting, vendors, customs and the lead times that decide whether a new joiner has a laptop on day one.',
    requirements: ['Six or more years in supply chain, including international shipping'],
  },

  // ══ Procurement ════════════════════════════════════════════════════════════
  {
    title: 'Procurement Specialist', department: 'dept_procurement', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Vendor Management', 'Negotiation', 'Contracts'],
    description:
      'Run the buying process — software, services and hardware — and hold vendors to what they agreed.',
    requirements: ['Three or more years in procurement or vendor management'],
  },

  // ══ Facilities ═════════════════════════════════════════════════════════════
  {
    title: 'Workplace & Facilities Manager', department: 'dept_facilities', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Facilities Management', 'Vendor Management', 'Health & Safety'],
    description:
      'Run the office as somewhere people actually want to come in to: space, services, safety and the vendors behind all three.',
    requirements: ['Four or more years managing a workplace or facility'],
  },

  // ══ Finance ════════════════════════════════════════════════════════════════
  {
    title: 'Financial Analyst', department: 'dept_finance', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Financial Modelling', 'Excel', 'Forecasting'],
    description:
      'Own the models behind planning and reporting, and be the person who can explain why this month differs from the forecast.',
    requirements: ['Two or more years in FP&A or a similar analytical finance role'],
  },
  {
    title: 'Accountant', department: 'dept_finance', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Accounting', 'GST', 'Reconciliation'],
    description:
      'Run the books: close, reconciliation, statutory filings and the audit trail behind them.',
    requirements: ['CA Inter or equivalent, with three or more years in a similar role'],
  },
  {
    title: 'Payroll Specialist', department: 'dept_finance', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Payroll', 'Compliance', 'Attention to Detail'],
    description:
      'Run payroll across the countries we employ in, correctly and on time. There is very little tolerance for error in this one.',
    requirements: ['Three or more years running payroll, ideally in more than one jurisdiction'],
  },
  {
    title: 'Finance Controller', department: 'dept_finance', level: 'lead', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [2300000, 3000000],
    skills: ['Financial Control', 'Audit', 'Leadership'],
    description:
      'Own the finance function’s integrity: controls, audit, statutory compliance and the team that delivers all three.',
    requirements: ['Chartered Accountant with ten or more years, including a controller or equivalent role'],
  },

  // ══ Legal ══════════════════════════════════════════════════════════════════
  {
    title: 'Corporate Counsel', department: 'dept_legal', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [1400000, 2100000],
    skills: ['Commercial Contracts', 'Data Protection', 'Negotiation'],
    description:
      'Handle commercial contracts, data protection and the questions that arrive from sales at five o’clock on a Friday.',
    requirements: ['Qualified lawyer with six or more years, including in-house or technology clients'],
  },
  {
    title: 'Data Privacy Officer', department: 'dept_legal', level: 'senior', type: 'full_time',
    ...GB, city: 'London', region: 'England', remote: true, salary: [55000, 75000],
    skills: ['GDPR', 'Privacy', 'Compliance'],
    description:
      'Own privacy across a platform handling candidate data in many jurisdictions: assessments, subject requests, retention and the decisions behind them.',
    requirements: ['Five or more years in privacy, with recognised certification'],
  },

  // ══ Strategy ═══════════════════════════════════════════════════════════════
  {
    title: 'Strategy Manager', department: 'dept_strategy', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [1400000, 2100000],
    skills: ['Strategy', 'Market Analysis', 'Financial Modelling'],
    description:
      'Work on the questions above the roadmap: which markets, which segments, build or buy, and what the numbers say about each.',
    requirements: ['Five or more years in strategy, consulting or corporate development'],
  },

  // ══ Executive ══════════════════════════════════════════════════════════════
  {
    title: 'Chief of Staff', department: 'dept_exec', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Operations', 'Communication', 'Program Management'],
    description:
      'Work directly with the executive team on whatever most needs a decision: the operating rhythm, the board pack, and the projects nobody else owns yet.',
    requirements: ['Seven or more years across operations, strategy or consulting'],
  },
  {
    title: 'Executive Assistant', department: 'dept_exec', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Calendar Management', 'Travel', 'Discretion'],
    description:
      'Support the executive team: calendars across time zones, travel, and the confidences that come with the seat.',
    requirements: ['Four or more years supporting senior leaders'],
  },

  // ══ People ═════════════════════════════════════════════════════════════════
  {
    title: 'HR Business Partner', department: 'dept_hr', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [1400000, 2100000],
    skills: ['HR Business Partnering', 'Employee Relations', 'Coaching'],
    description:
      'Partner with two or three functions on everything people-related: performance, progression, restructures and the difficult conversations.',
    requirements: ['Six or more years in HR, including business partnering'],
  },
  {
    title: 'People Operations Specialist', department: 'dept_hr', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['HRIS', 'Onboarding', 'Process'],
    description:
      'Own the mechanics of employment: onboarding, records, benefits administration and the systems holding all of it.',
    requirements: ['Three or more years in people operations'],
  },
  {
    title: 'Compensation & Benefits Analyst', department: 'dept_hr', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Compensation', 'Benchmarking', 'Excel'],
    description:
      'Own the salary bands and benefits across the countries we employ in, and the benchmarking that keeps them defensible.',
    requirements: ['Three or more years in compensation and benefits'],
  },

  // ══ Talent Acquisition ═════════════════════════════════════════════════════
  {
    title: 'Technical Recruiter', department: 'dept_ta', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Sourcing', 'Interviewing', 'ATS'],
    description:
      'Hire engineers into a company that sells hiring software — the bar for how candidates are treated is correspondingly high.',
    requirements: ['Three or more years recruiting technical roles'],
  },
  {
    title: 'Campus Recruitment Lead', department: 'dept_ta', level: 'senior', type: 'full_time',
    ...IN, city: 'Pune', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Campus Hiring', 'Stakeholder Management', 'Events'],
    description:
      'Own campus hiring across our partner institutions: the calendar, the assessment, and the conversion from intern to full-time.',
    requirements: ['Five or more years in campus or early-careers recruitment'],
  },
  {
    title: 'Recruitment Coordinator', department: 'dept_ta', level: 'entry', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [300000, 500000],
    skills: ['Scheduling', 'Communication', 'ATS'],
    description:
      'Keep the hiring process moving: scheduling, candidate communication, and being the person who notices when someone has been waiting too long.',
    requirements: ['Organised, and a good writer — the rest is teachable'],
  },

  // ══ Learning & Development ═════════════════════════════════════════════════
  {
    title: 'Learning & Development Manager', department: 'dept_l_and_d', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Instructional Design', 'Facilitation', 'Programme Design'],
    description:
      'Build how people grow here: onboarding, management training, and the technical progression framework engineering is asking for.',
    requirements: ['Five or more years in L&D, including programmes you designed yourself'],
  },


  // ══ Media & Creative Production ════════════════════════════════════════════
  {
    title: 'Videographer', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Cinematography', 'Camera Operation', 'Lighting', 'Premiere Pro'],
    description:
      'Shoot everything the company puts out: campus events, candidate and employee stories, product films and whatever the founders are doing that week. You own the shoot end to end — kit, lighting, sound and the rushes handed over clean and labelled.',
    requirements: [
      'Two or more years shooting professionally, with a reel we can watch',
      'Confident running a shoot alone: your own lighting, your own audio, no crew to fall back on',
      'Own or know your way around mirrorless bodies, gimbals and lav kits',
    ],
  },
  {
    title: 'Senior Videographer / Director of Photography', department: 'dept_media', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Cinematography', 'Lighting Design', 'Colour', 'Direction'],
    description:
      'Set the visual language for everything we shoot and lead on the pieces that matter most. You will direct small crews, make the lighting and lens calls, and be the person who says when a shot is not good enough yet.',
    requirements: [
      'Six or more years behind a camera, including narrative or documentary work',
      'A reel that shows range — a corporate film and something with actual feeling in it',
      'Comfortable directing people who are not performers and are nervous on camera',
    ],
  },
  {
    title: 'Photographer', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Photography', 'Lighting', 'Lightroom', 'Retouching'],
    description:
      'Portraits, events, office and product. A large part of this job is making people who hate being photographed look like themselves, which is harder than it sounds and is the actual skill we are hiring for.',
    requirements: [
      'Two or more years shooting professionally, with a portfolio',
      'Strong with strobes and modifiers, not only available light',
      'You cull and deliver on time — the shoot is not the whole job',
    ],
  },
  {
    title: 'Video Editor', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Premiere Pro', 'DaVinci Resolve', 'Sound Editing', 'Colour Grading'],
    description:
      'Cut long-form films, short social edits and everything between, from footage you did not shoot and briefs that change. Pace and sound are what separate a good edit from a passable one here.',
    requirements: [
      'Two or more years editing professionally, in Premiere or Resolve',
      'You can grade and mix to a decent standard, not just assemble',
      'Organised with media — projects someone else can open in six months',
    ],
  },
  {
    title: 'Senior Video Editor', department: 'dept_media', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['DaVinci Resolve', 'Premiere Pro', 'Colour Grading', 'Post Workflow'],
    description:
      'Own post: the workflow, the house look, the delivery specs, and the edits nobody else can rescue. You will also be the person who decides what the junior editors get to cut.',
    requirements: [
      'Six or more years in post, including work you finished and graded yourself',
      'Have designed a post workflow for a team, including storage and proxies',
    ],
  },
  {
    title: 'Motion Graphics Designer', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['After Effects', 'Motion Design', 'Illustrator', 'Typography'],
    description:
      'Titles, lower thirds, explainers and the animated pieces that carry an idea a static frame cannot. You will build templates the rest of the team can use without breaking them.',
    requirements: [
      'Three or more years in motion design, with a reel',
      'Strong typographically — most motion work fails on type, not animation',
    ],
  },
  {
    title: 'Live Streaming Operator (OBS)', department: 'dept_media', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [15000, 26000],
    skills: ['OBS Studio', 'Live Production', 'Audio Mixing', 'Streaming'],
    description:
      'Run our live output: campus sessions, town halls, hiring events and product streams. You build the OBS scenes, run the switch live, watch the audio, and keep it going when the venue Wi-Fi does what venue Wi-Fi does.',
    requirements: [
      'Two or more years running live streams, in OBS or vMix',
      'Comfortable with capture cards, NDI, audio interfaces and the cabling behind them',
      'Calm when something fails on air, because it will',
    ],
  },
  {
    title: 'Broadcast Engineer', department: 'dept_media', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Broadcast Systems', 'Video Engineering', 'Networking', 'Audio'],
    description:
      'Own the technical side of the studio and every live event: signal paths, encoders, redundancy, and the fault-finding when a feed drops two minutes before going live.',
    requirements: [
      'Five or more years in broadcast or live event engineering',
      'Know SDI, NDI and IP video properly, and can read a signal flow diagram',
    ],
  },
  {
    title: 'Studio Manager', department: 'dept_media', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Production Management', 'Scheduling', 'Kit Management', 'Budgeting'],
    description:
      'Run the studio as a working facility: the shoot calendar, the kit register, freelancers, budgets, and making sure two teams never book the same camera on the same morning.',
    requirements: [
      'Four or more years managing a studio or production schedule',
      'Rigorous about kit tracking — cameras walk otherwise',
    ],
  },
  {
    title: 'Content Producer', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Production', 'Storytelling', 'Scripting', 'Project Management'],
    description:
      'Take a piece from idea to published: the story, the script, the people, the shoot day and the edit review. You are the one holding the whole thing, not any single craft in it.',
    requirements: [
      'Three or more years producing video content',
      'Can write a script that sounds like a person talking',
    ],
  },
  {
    title: 'Media Monitoring Analyst', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Media Monitoring', 'Reporting', 'Research', 'Analysis'],
    description:
      'Watch what is said about us and about hiring generally — press, broadcast, social and industry press — and turn it into a brief leadership actually reads. You are the early warning when something is turning.',
    requirements: [
      'Two or more years in media monitoring, PR or research',
      'You can tell a story that matters from noise, and say so in a paragraph',
    ],
  },
  {
    title: 'Audio Engineer', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Audio Engineering', 'Sound Design', 'Mixing', 'Field Recording'],
    description:
      'Own sound across shoots, live events and post. Most of what makes our output feel professional is audio, and most of what makes it feel amateur is also audio.',
    requirements: [
      'Three or more years in audio for video or live',
      'Confident with field recording, mixing and repair work on bad source',
    ],
  },
  {
    title: 'Photo Editor & Retoucher', department: 'dept_media', level: 'entry', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [300000, 500000],
    skills: ['Lightroom', 'Photoshop', 'Retouching', 'Colour'],
    description:
      'Cull, correct and retouch everything the photography team shoots, to a consistent look across thousands of frames a month.',
    requirements: [
      'One or more years retouching professionally',
      'A light hand — people should still look like themselves',
    ],
  },
  {
    title: 'Media Librarian & Archivist', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Digital Asset Management', 'Metadata', 'Archiving'],
    description:
      'Own the media library: naming, metadata, rights, retention and backups. The measure of the job is whether someone can find a two-year-old shot in under a minute.',
    requirements: [
      'Two or more years in digital asset management or archiving',
      'Genuinely enjoy taxonomy, because that is most of this',
    ],
  },
  {
    title: 'Creative Director', department: 'dept_media', level: 'lead', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [2300000, 3000000],
    skills: ['Creative Direction', 'Brand', 'Leadership', 'Storytelling'],
    description:
      'Own what the company looks and sounds like across everything we make, and lead the team that makes it. The job is judgement — knowing which idea is worth the budget and which is merely nice.',
    requirements: [
      'Ten or more years in creative work, several leading a team',
      'A body of work you can walk us through, including the compromises',
    ],
  },

  // ══ Social Media & Community ═══════════════════════════════════════════════
  {
    title: 'Social Media Manager', department: 'dept_social', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Social Media Strategy', 'Content Planning', 'Analytics', 'Copywriting'],
    description:
      'Own every channel end to end: the calendar, the posts, the replies, the numbers and the calls about what we do and do not say. You will work alongside the video team rather than waiting on them.',
    requirements: [
      'Three or more years running social for a brand, with accounts we can look at',
      'You write well and quickly, and know the difference between the two',
      'Comfortable reading analytics and changing your mind because of them',
    ],
  },
  {
    title: 'Social Media Executive', department: 'dept_social', level: 'entry', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [300000, 500000],
    skills: ['Social Media', 'Copywriting', 'Scheduling'],
    description:
      'Day-to-day publishing across channels: scheduling, community replies, basic edits and keeping the calendar honest. It is the way into the team and we treat it as one.',
    requirements: [
      'Online and fluent in how these platforms actually work',
      'Careful with spelling — you are the company in public',
    ],
  },
  {
    title: 'Content Creator (Short-Form Video)', department: 'dept_social', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Short-Form Video', 'Editing', 'On-Camera', 'Trends'],
    description:
      'Concept, shoot and cut vertical video for Reels, Shorts and TikTok — often alone, on a phone, on the day. Volume and instinct matter more here than polish.',
    requirements: [
      'A body of short-form work that performed, and an honest read on why',
      'Comfortable on camera, or good at getting others to be',
    ],
  },
  {
    title: 'Community Manager', department: 'dept_social', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Community Management', 'Moderation', 'Communication'],
    description:
      'Look after the candidate and recruiter communities: answer, moderate, escalate, and know the regulars by name. A lot of this is people at an anxious moment in their career, so tone carries the job.',
    requirements: [
      'Two or more years running an online community',
      'Steady under provocation — you will meet some',
    ],
  },
  {
    title: 'Influencer & Creator Partnerships Manager', department: 'dept_social', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['Influencer Marketing', 'Negotiation', 'Campaign Management'],
    description:
      'Build the creator programme: who we work with, on what terms, and whether it did anything. Disclosure and honesty are non-negotiable — we are in hiring, and trust is the product.',
    requirements: [
      'Four or more years in influencer or creator marketing',
      'Have run campaigns you measured properly, including the ones that failed',
    ],
  },
  {
    title: 'Social Media Analyst', department: 'dept_social', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Analytics', 'Reporting', 'Social Listening', 'Excel'],
    description:
      'Measure what the social and media teams do, and be the person willing to say a campaign did not work. Also owns social listening and the competitive read.',
    requirements: [
      'Two or more years in marketing analytics or social listening',
      'Sceptical about vanity metrics',
    ],
  },
  {
    title: 'Social Copywriter', department: 'dept_social', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Copywriting', 'Social Media', 'Editing'],
    description:
      'Write the words on everything short: posts, captions, hooks, scripts for vertical video and the occasional apology. Constraint is the whole craft here.',
    requirements: [
      'Two or more years writing for social, with work you will stand behind',
      'You can write in a voice that is not your own',
    ],
  },

  // ══ AI & Machine Learning ══════════════════════════════════════════════════
  {
    title: 'AI Software Engineer', department: 'dept_ai', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Python', 'LLMs', 'APIs', 'TypeScript'],
    description:
      'Build the AI features inside the product: resume understanding, candidate–role matching, and the assistive tooling recruiters use. This is engineering with models in it, not research — evaluation and latency matter as much as accuracy.',
    requirements: [
      'Three or more years as a software engineer, with production LLM or ML work',
      'You evaluate before you ship, and can show how',
      'Clear-eyed about where a model should not be making the decision',
    ],
  },
  {
    title: 'Machine Learning Engineer', department: 'dept_ai', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Python', 'PyTorch', 'Machine Learning', 'MLOps'],
    description:
      'Train, evaluate and ship the models behind matching and ranking. Because these affect who gets seen by a recruiter, measuring for bias is part of the work rather than a review gate at the end.',
    requirements: [
      'Three or more years building ML systems that reached production',
      'Strong on evaluation design — the part most people skip',
    ],
  },
  {
    title: 'Senior Machine Learning Engineer', department: 'dept_ai', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Python', 'PyTorch', 'Distributed Training', 'Evaluation'],
    description:
      'Own a model surface end to end: the data, the training, the evaluation harness and what happens when it degrades in production six months later.',
    requirements: [
      'Six or more years in applied ML, including models you maintained after launch',
      'Able to explain a failure mode to someone who will act on the answer',
    ],
  },
  {
    title: 'MLOps Engineer', department: 'dept_ai', level: 'senior', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [1400000, 2100000],
    skills: ['MLOps', 'Kubernetes', 'Python', 'Model Serving'],
    description:
      'Own the path from a trained model to a served one: pipelines, registries, serving, monitoring and rollback. The goal is that shipping a model is as boring as shipping a service.',
    requirements: [
      'Four or more years across ML and infrastructure',
      'Have operated model serving in production, including an incident',
    ],
  },
  {
    title: 'NLP Engineer', department: 'dept_ai', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['NLP', 'Python', 'Transformers', 'Information Extraction'],
    description:
      'Work on the language side of the product: parsing CVs written in every format a human can invent, extracting skills and dates, and matching text that never uses the same words twice.',
    requirements: [
      'Four or more years in NLP, with production information-extraction work',
      'Realistic about multilingual and code-mixed text, which is most of our input',
    ],
  },
  {
    title: 'Computer Vision Engineer', department: 'dept_ai', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Computer Vision', 'Python', 'PyTorch', 'OCR'],
    description:
      'Own document understanding: reading scanned certificates and IDs reliably enough to verify them, on photographs taken in bad light at an angle.',
    requirements: [
      'Four or more years in computer vision, including OCR or document AI',
      'Careful with the privacy implications — this is identity data',
    ],
  },
  {
    title: 'Applied AI Engineer', department: 'dept_ai', level: 'senior', type: 'full_time',
    ...US, city: 'Remote', region: null, remote: true, salary: [85000, 115000],
    skills: ['LLMs', 'Python', 'Evaluation', 'Product Engineering'],
    description:
      'Sit between product and models: prototype quickly, evaluate honestly, and turn the promising third into something that holds up in front of customers.',
    requirements: [
      'Five or more years engineering, with substantial LLM application work',
      'Have killed your own prototype because the evaluation said so',
    ],
  },
  {
    title: 'AI Research Scientist', department: 'dept_ai', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [2300000, 3000000],
    skills: ['Machine Learning', 'Research', 'Publication', 'Python'],
    description:
      'Work on the harder matching and fairness problems that have no off-the-shelf answer, and publish where the work stands up to it.',
    requirements: [
      'PhD or equivalent research record in ML, IR or NLP',
      'Publications, and code behind them',
    ],
  },
  {
    title: 'Data Annotation Lead', department: 'dept_ai', level: 'mid', type: 'full_time',
    ...IN, city: 'Hyderabad', region: 'Telangana', remote: false, salary: [700000, 1400000],
    skills: ['Annotation', 'Quality Assurance', 'Guidelines', 'Team Management'],
    description:
      'Run the labelling that everything upstream depends on: guidelines, a team of annotators, inter-annotator agreement and the honest conversation about where the labels are weak.',
    requirements: [
      'Three or more years running annotation or data quality work',
      'Have written guidelines that two people applied the same way',
    ],
  },

  // ══ Engineering (additional) ═══════════════════════════════════════════════
  {
    title: 'Full-Stack Engineer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    description:
      'Own features across the stack, from the migration to the interface. Most of our teams work this way, so this is the most common shape of engineer here.',
    requirements: [
      'Three or more years shipping across frontend and backend',
      'Opinions about where the boundary between them should sit',
    ],
  },
  {
    title: 'Software Engineer (Graduate)', department: 'dept_eng_it', level: 'entry', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [300000, 500000],
    skills: ['JavaScript', 'Data Structures', 'Git'],
    description:
      'A first engineering job with a mentor, a real codebase and code review that is meant to teach. You will be shipping to production inside your first month.',
    requirements: [
      'Graduating or graduated within the last year',
      'Something you built outside coursework that you can talk about',
    ],
  },
  {
    title: 'Integration Engineer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    ...IN, city: 'Pune', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['APIs', 'Webhooks', 'Node.js', 'Debugging'],
    description:
      'Build and maintain the connections to customers\' other systems — ATS platforms, HRIS, job boards and assessment tools. Half the job is other people\'s APIs behaving unlike their documentation.',
    requirements: [
      'Three or more years integrating third-party systems',
      'Patient debugger — the bug is usually not on our side, and you still have to find it',
    ],
  },

  // ══ Administration & Support Services ══════════════════════════════════════
  {
    title: 'Driver', department: 'dept_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [12000, 20000],
    skills: ['Driving', 'Route Planning', 'Vehicle Maintenance'],
    description:
      'Drive for the office: staff and guest transfers, airport runs and equipment moves between our sites and shoot locations. Regular hours, with occasional early starts for a flight or a shoot call.',
    requirements: [
      'Valid commercial driving licence with a clean record',
      'Three or more years driving professionally in city traffic',
      'Know the city, and know when to leave to make the time',
    ],
  },
  {
    title: 'Fleet Coordinator', department: 'dept_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Fleet Management', 'Scheduling', 'Compliance', 'Vendor Management'],
    description:
      'Run the vehicles and the drivers: rosters, servicing, insurance, fuel and the paperwork that keeps all of it legal.',
    requirements: [
      'Two or more years coordinating a vehicle fleet or transport desk',
      'Organised with compliance dates — expiry is not a surprise',
    ],
  },
  {
    title: 'Front Desk Executive', department: 'dept_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [12000, 20000],
    skills: ['Reception', 'Communication', 'Scheduling'],
    description:
      'The first person anyone meets here — candidates arriving for interviews, visitors, couriers and calls. Candidates in particular arrive nervous, and how they are greeted sets the tone for their whole day.',
    requirements: [
      'Warm and unflappable with people',
      'Comfortable in English and the local language',
    ],
  },
  {
    title: 'Office Assistant', department: 'dept_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [12000, 20000],
    skills: ['Office Support', 'Organisation'],
    description:
      'Keep the office running through the day: stores, pantry, deliveries, meeting rooms and the hundred small things nobody notices until they stop happening.',
    requirements: ['Reliable and organised', 'No formal qualification required'],
  },
  {
    title: 'Administration Executive', department: 'dept_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Administration', 'Vendor Coordination', 'Record Keeping'],
    description:
      'Own office administration: vendors, travel bookings, statutory registers, and the coordination between facilities, IT and people ops when someone joins or leaves.',
    requirements: ['Three or more years in office administration'],
  },
  {
    title: 'Security Supervisor', department: 'dept_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Security Operations', 'Access Control', 'Incident Reporting'],
    description:
      'Supervise site security across shifts: access control, visitor management, the guard roster and the incident log.',
    requirements: [
      'Three or more years in a security supervisory role',
      'Clear incident reporting — writing it down properly is most of the job',
    ],
  },
  {
    title: 'Housekeeping Supervisor', department: 'dept_admin', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [12000, 18000],
    skills: ['Housekeeping', 'Team Supervision', 'Vendor Management'],
    description:
      'Run housekeeping across the office: the team, the schedule, supplies and standards, including the studio and meeting spaces before a shoot or a client visit.',
    requirements: ['Three or more years supervising a housekeeping team'],
  },

  // ══ R&D (brand and product research) ═══════════════════════════════════════
  {
    title: 'Brand Researcher', department: 'dept_rd', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Market Research', 'Brand Research', 'Survey Design', 'Analysis'],
    description:
      'Find out what people actually think of us — candidates, recruiters and the market — through surveys, interviews and tracking, and report it without softening the parts that sting.',
    requirements: [
      'Three or more years in brand or market research',
      'Can design a survey that does not lead the answer',
    ],
  },


  // ══ Engineering (ladder and specialisms) ═══════════════════════════════════
  {
    title: 'Android Engineer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Kotlin', 'Android', 'Jetpack Compose'],
    description:
      'Build the native Android app. Most of our candidates apply from a mid-range phone on patchy data, so offline behaviour and cold-start time are product decisions here, not polish.',
    requirements: [
      'Four or more years of native Android in Kotlin',
      'Have shipped through a Play Store review that went badly at least once',
    ],
  },
  {
    title: 'iOS Engineer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Swift', 'iOS', 'SwiftUI'],
    description:
      'Own the iOS app end to end — recruiters live in it during a hiring week, so responsiveness and background sync matter more than surface.',
    requirements: [
      'Four or more years of native iOS in Swift',
      'Comfortable with concurrency and the memory graph, not just the view layer',
    ],
  },
  {
    title: 'Principal Engineer', department: 'dept_eng_it', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [2300000, 3000000],
    skills: ['Architecture', 'Distributed Systems', 'Technical Leadership'],
    description:
      'The most senior individual contributor here. You take on the problems that span the whole company and have no obvious owner, and you are expected to change minds with a document rather than a title.',
    requirements: [
      'Fifteen or more years, with systems still running that you designed',
      'A record of raising the standard of engineers around you',
    ],
  },
  {
    title: 'Director of Engineering', department: 'dept_eng_it', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Engineering Leadership', 'Org Design', 'Delivery', 'Hiring'],
    description:
      'Lead several engineering teams through their managers: headcount, structure, delivery and the technical bets. You will be judged on whether the teams under you get better, not on what you personally shipped.',
    requirements: [
      'Twelve or more years, including managing managers',
      'Have restructured a team without breaking it',
    ],
  },
  {
    title: 'Database Engineer', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    ...IN, city: 'Pune', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['PostgreSQL', 'Query Optimisation', 'Replication', 'Schema Design'],
    description:
      'Own the databases behind a multi-tenant platform: schema evolution, indexing, replication, and the migrations that must run on a live table without locking it.',
    requirements: [
      'Five or more years deep in PostgreSQL',
      'Have done an online migration on a large table and can describe how',
    ],
  },
  {
    title: 'Search Engineer', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Elasticsearch', 'Information Retrieval', 'Ranking', 'Python'],
    description:
      'Own job search: indexing, query understanding, ranking and the location logic that decides whether someone in Virar sees the role in Andheri. Relevance here is somebody finding work.',
    requirements: [
      'Four or more years on search or recommendation systems',
      'You measure relevance rather than arguing about it',
    ],
  },
  {
    title: 'Accessibility Engineer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Accessibility', 'WCAG', 'React', 'Screen Readers'],
    description:
      'Make the whole product usable with a keyboard and a screen reader. On a hiring platform this is not a compliance exercise — an inaccessible application form excludes people from work.',
    requirements: [
      'Three or more years of accessibility work in a real codebase',
      'You test with actual assistive technology, not only an automated scanner',
    ],
  },
  {
    title: 'Technical Writer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Technical Writing', 'API Documentation', 'Editing'],
    description:
      'Write the API reference, the integration guides and the internal runbooks. The test is whether an engineer at a customer can integrate without emailing us.',
    requirements: [
      'Three or more years documenting software',
      'You read the code rather than only interviewing the engineer',
    ],
  },
  {
    title: 'Developer Advocate', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Developer Relations', 'Public Speaking', 'Writing', 'APIs'],
    description:
      'Represent the platform to the engineers who integrate with it: samples, talks, workshops, and bringing their complaints back here with enough force that we act on them.',
    requirements: [
      'Five or more years split between engineering and communicating about it',
      'You have built the thing you are talking about',
    ],
  },

  // ══ Product (ladder) ═══════════════════════════════════════════════════════
  {
    title: 'Associate Product Manager', department: 'dept_prod', level: 'entry', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [300000, 500000],
    skills: ['Product', 'Analysis', 'Communication'],
    description:
      'A first product job with a mentor and a real surface of your own within a few months. Expect to spend the first weeks in support tickets and on customer calls, which is the fastest way to learn the product.',
    requirements: ['Graduating or within two years of graduating', 'Evidence you can write clearly'],
  },
  {
    title: 'Group Product Manager', department: 'dept_prod', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Product Leadership', 'Strategy', 'Coaching'],
    description:
      'Lead a group of product managers across a whole area of the platform, owning the strategy above their individual roadmaps and the quality of their thinking.',
    requirements: ['Eight or more years in product, including managing PMs'],
  },
  {
    title: 'Product Operations Manager', department: 'dept_prod', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Product Operations', 'Process', 'Analytics'],
    description:
      'Own the machinery around product: research operations, the feedback pipeline, launch process and the instrumentation that tells us whether a launch worked.',
    requirements: ['Three or more years in product or business operations'],
  },

  // ══ Design (ladder and craft) ══════════════════════════════════════════════
  {
    title: 'Senior Product Designer', department: 'dept_design', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Product Design', 'Figma', 'Systems Thinking', 'Prototyping'],
    description:
      'Lead design on a major surface, and set the bar for the designers around you. The recruiter console is dense, configurable and used all day — designing it is a systems problem, not a screens problem.',
    requirements: [
      'Six or more years in product design, on complex tools rather than marketing sites',
      'A portfolio that shows the problem you were given and what you changed about it',
    ],
  },
  {
    title: 'UX Writer', department: 'dept_design', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['UX Writing', 'Content Design', 'Editing'],
    description:
      'Write the words inside the product — buttons, empty states, errors and the rejection email. A lot of what we write reaches someone on a bad day, and the wording is the whole experience.',
    requirements: [
      'Three or more years of UX or content writing',
      'You can cut a sentence in half without losing it',
    ],
  },
  {
    title: 'Brand Designer', department: 'dept_design', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Brand Design', 'Typography', 'Illustration', 'Figma'],
    description:
      'Own how the brand looks away from the product: campaigns, the site, decks, print and the event stand. You will work close to the media team rather than downstream of it.',
    requirements: ['Four or more years in brand or campaign design, with a portfolio'],
  },
  {
    title: 'Graphic Designer', department: 'dept_design', level: 'entry', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [300000, 500000],
    skills: ['Figma', 'Illustrator', 'Layout', 'Typography'],
    description:
      'Produce the day-to-day design work: social assets, decks, one-pagers, event collateral and job-post graphics, at volume and on brand.',
    requirements: ['One or more years designing professionally, with a portfolio'],
  },
  {
    title: 'Design Manager', department: 'dept_design', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Design Leadership', 'Coaching', 'Critique', 'Hiring'],
    description:
      'Lead the product design team: craft, critique, hiring and growth. You will still design occasionally, but the output you are measured on is the team\'s.',
    requirements: ['Eight or more years in design, including two managing designers'],
  },

  // ══ Data & Quality ═════════════════════════════════════════════════════════
  {
    title: 'Data Analyst', department: 'dept_data', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['SQL', 'Analysis', 'Visualisation', 'Statistics'],
    description:
      'Answer the questions the business keeps asking, and build the reporting that stops them being asked a fourth time. Funnel conversion, source quality, time to hire.',
    requirements: ['Two or more years in an analyst role', 'Strong SQL and a healthy suspicion of your own first answer'],
  },
  {
    title: 'Head of Data', department: 'dept_data', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Data Strategy', 'Leadership', 'Governance', 'Analytics'],
    description:
      'Own data across the company: the platform, the team, the definitions everyone argues about, and whether leadership can trust the number in front of them.',
    requirements: ['Twelve or more years in data, several leading a function'],
  },
  {
    title: 'Data Governance Analyst', department: 'dept_data', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Data Governance', 'Cataloguing', 'Privacy', 'Documentation'],
    description:
      'Own what data we hold, where it lives, who may see it and how long we keep it — on a platform holding CVs and identity documents across several jurisdictions.',
    requirements: ['Three or more years in data governance or privacy operations'],
  },
  {
    title: 'QA Engineer (Manual)', department: 'dept_qa', level: 'entry', type: 'full_time',
    ...IN, city: 'Chennai', region: 'Tamil Nadu', remote: false, salary: [300000, 500000],
    skills: ['Test Design', 'Exploratory Testing', 'Bug Reporting'],
    description:
      'Test the things automation cannot: the application flow on a real low-end phone, the edge cases nobody specified, and whether a change actually feels right.',
    requirements: ['One or more years testing software', 'Write a bug report an engineer can act on without asking you anything'],
  },
  {
    title: 'Performance Test Engineer', department: 'dept_qa', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Load Testing', 'k6', 'Profiling', 'SQL'],
    description:
      'Find where the platform breaks before a campus drive does. Our traffic is spiky by nature — a placement season concentrates a year of applications into a fortnight.',
    requirements: ['Three or more years in performance testing', 'Comfortable reading a flame graph and a query plan'],
  },

  // ══ Infrastructure, Security, IT ═══════════════════════════════════════════
  {
    title: 'Network Engineer', department: 'dept_devops', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Networking', 'Firewalls', 'VPN', 'Troubleshooting'],
    description:
      'Own the office and studio networks and the connectivity behind live events, where an unstable uplink is visible to everyone watching.',
    requirements: ['Four or more years in network engineering', 'Can find a fault from the packet capture'],
  },
  {
    title: 'Database Reliability Engineer', department: 'dept_devops', level: 'senior', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [1400000, 2100000],
    skills: ['PostgreSQL', 'Replication', 'Backups', 'Performance'],
    description:
      'Keep the databases available and recoverable: replication, failover, backups you have actually restored from, and the capacity planning nobody does until it is late.',
    requirements: ['Six or more years operating production databases', 'Have run a real restore under pressure'],
  },
  {
    title: 'Security Operations Analyst', department: 'dept_security', level: 'entry', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [300000, 500000],
    skills: ['SIEM', 'Incident Response', 'Log Analysis'],
    description:
      'Watch the alerts, triage what matters and escalate what is real. Most of this job is deciding quickly which of thirty alerts is worth waking someone up for.',
    requirements: ['One or more years in a SOC or security operations role', 'Methodical under time pressure'],
  },
  {
    title: 'Penetration Tester', department: 'dept_security', level: 'senior', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [1400000, 2100000],
    skills: ['Penetration Testing', 'Web Security', 'Reporting'],
    description:
      'Attack our own platform before anyone else does, and write it up so engineering can fix it rather than argue with it. Internal, authorised, and scoped in writing.',
    requirements: [
      'Four or more years of hands-on offensive security',
      'Reports that a developer can act on, not a scanner dump',
    ],
  },
  {
    title: 'Identity & Access Management Engineer', department: 'dept_security', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['IAM', 'OAuth', 'SSO', 'RBAC'],
    description:
      'Own identity across the platform and the company: single sign-on, roles, session handling and the joiner-mover-leaver flow that keeps access correct as people change teams.',
    requirements: ['Five or more years in IAM', 'Know OAuth and OIDC well enough to spot a bad implementation'],
  },
  {
    title: 'IT Manager', department: 'dept_it_support', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [1400000, 2100000],
    skills: ['IT Management', 'Vendor Management', 'Budgeting', 'Security'],
    description:
      'Run internal IT: the team, the estate, the vendors and the budget, across offices and a largely remote workforce.',
    requirements: ['Seven or more years in IT, including managing a team'],
  },

  // ══ AI (applied and responsible) ═══════════════════════════════════════════
  {
    title: 'Prompt & AI Interaction Engineer', department: 'dept_ai', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['LLMs', 'Evaluation', 'Python', 'Writing'],
    description:
      'Design how the product talks to models and how models talk back: prompts, tool definitions, guardrails and the evaluation sets that prove a change was an improvement rather than a vibe.',
    requirements: [
      'Two or more years working directly with LLMs in a product',
      'You write well — most of this job is writing precisely',
      'You build the eval before you tune the prompt',
    ],
  },
  {
    title: 'Responsible AI Lead', department: 'dept_ai', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [2300000, 3000000],
    skills: ['AI Ethics', 'Fairness', 'Policy', 'Evaluation'],
    description:
      'Own fairness and accountability in systems that influence who gets hired. That means bias testing with teeth, documented model behaviour, and the standing authority to stop a launch.',
    requirements: [
      'Eight or more years across ML and policy or governance',
      'Have blocked something, and can describe the argument',
    ],
  },
  {
    title: 'Speech & Audio ML Engineer', department: 'dept_ai', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Speech Recognition', 'Python', 'PyTorch', 'Audio'],
    description:
      'Work on interview transcription and audio understanding across Indian-accented English and code-mixed speech, where off-the-shelf models do noticeably worse.',
    requirements: ['Four or more years in speech or audio ML', 'Realistic about word error rate on real recordings'],
  },

  // ══ Media (production crew) ════════════════════════════════════════════════
  {
    title: 'Production Assistant', department: 'dept_media', level: 'entry', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [300000, 500000],
    skills: ['Production Support', 'Organisation', 'Kit Handling'],
    description:
      'Support shoots: kit in and out, batteries and cards, releases signed, people where they need to be. It is how most people get into production, and you will learn every department from it.',
    requirements: ['Willing to carry things and start early', 'No formal experience required'],
  },
  {
    title: 'Scriptwriter', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Scriptwriting', 'Storytelling', 'Research', 'Editing'],
    description:
      'Write scripts for films, explainers and vertical video — including the ones people have to deliver to camera without sounding like they are reading.',
    requirements: ['Two or more years writing for video, with scripts we can read'],
  },
  {
    title: 'Podcast Producer', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Podcast Production', 'Audio Editing', 'Interviewing', 'Booking'],
    description:
      'Own the hiring podcast end to end: guests, research, recording, edit and publishing. The interviews are with talent leaders, so the preparation is most of the quality.',
    requirements: ['Two or more years producing a podcast with an audience'],
  },
  {
    title: 'Event Production Manager', department: 'dept_media', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Event Production', 'Vendor Management', 'AV', 'Logistics'],
    description:
      'Run hiring events and campus drives as productions: venue, AV, stream, crew and run of show, at campuses where you get the hall two hours before it starts.',
    requirements: ['Four or more years producing live events', 'Calm when the venue is not what was promised'],
  },

  // ══ Sales (full ladder) ════════════════════════════════════════════════════
  {
    title: 'Business Development Manager', department: 'dept_sales', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Business Development', 'Prospecting', 'Negotiation'],
    description:
      'Open new segments and geographies for the platform, working ahead of the account executives on markets we have not sold into yet.',
    requirements: ['Four or more years in business development', 'Comfortable being early and unsupported in a market'],
  },
  {
    title: 'Inside Sales Representative', department: 'dept_sales', level: 'entry', type: 'full_time',
    ...IN, city: 'Pune', region: 'Maharashtra', remote: false, salary: [300000, 500000],
    skills: ['Inside Sales', 'CRM', 'Communication'],
    description:
      'Run the smaller end of the funnel entirely over calls and video: qualify, demo, close. Volume is high and the cycle is short.',
    requirements: ['One or more years in a phone-based sales role', 'Resilient — most calls end in no'],
  },
  {
    title: 'Key Account Manager', department: 'dept_sales', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Account Management', 'Upselling', 'Relationship Building'],
    description:
      'Own our largest accounts after they sign: growth, renewal, escalations and the executive relationship that keeps us in the room.',
    requirements: ['Six or more years managing enterprise accounts'],
  },
  {
    title: 'Channel Sales Manager', department: 'dept_sales', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Channel Sales', 'Partner Management', 'Enablement'],
    description:
      'Sell through partners rather than around them: recruit resellers and consultancies, enable them properly, and manage the conflict when a deal is claimed twice.',
    requirements: ['Five or more years in channel or partner sales'],
  },
  {
    title: 'VP of Sales', department: 'dept_sales', level: 'lead', type: 'full_time',
    ...US, city: 'Remote', region: null, remote: true, salary: [115000, 150000],
    skills: ['Sales Leadership', 'Forecasting', 'Go-to-Market', 'Hiring'],
    description:
      'Own global revenue and the organisation behind it: segmentation, coverage, forecast discipline and the leaders who carry each region.',
    requirements: ['Fifteen or more years in sales, including leading second-line managers'],
  },
  {
    title: 'Sales Operations Analyst', department: 'dept_sales', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['CRM', 'Reporting', 'Excel', 'Process'],
    description:
      'Keep the commercial machine honest: pipeline hygiene, quota and territory administration, commission calculations and the weekly forecast pack.',
    requirements: ['Two or more years in sales operations', 'Precise — commission errors are remembered'],
  },

  // ══ Marketing (full function) ══════════════════════════════════════════════
  {
    title: 'Performance Marketing Manager', department: 'dept_mktg', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Paid Media', 'Google Ads', 'Meta Ads', 'Analytics'],
    description:
      'Own paid acquisition across search and social, on both sides of the marketplace — employers and candidates behave nothing alike and need separate strategies.',
    requirements: [
      'Three or more years running paid budgets you were accountable for',
      'You know your true cost per hire, not just cost per click',
    ],
  },
  {
    title: 'Lifecycle Marketing Manager', department: 'dept_mktg', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Email Marketing', 'Automation', 'Segmentation', 'Copywriting'],
    description:
      'Own email and in-product lifecycle messaging: job alerts, nudges, re-engagement. The bar is that a candidate should never feel spammed by a platform they trusted with their CV.',
    requirements: ['Three or more years in lifecycle or CRM marketing', 'You care about unsubscribe rate as much as open rate'],
  },
  {
    title: 'Product Marketing Manager', department: 'dept_mktg', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Product Marketing', 'Positioning', 'Competitive Analysis', 'Enablement'],
    description:
      'Own positioning, launches and the sales narrative. You will be the one arguing for the plainer sentence when everybody wants the impressive one.',
    requirements: ['Five or more years in product marketing for a B2B product'],
  },
  {
    title: 'Event Marketing Manager', department: 'dept_mktg', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Event Marketing', 'Sponsorship', 'Logistics', 'Budgeting'],
    description:
      'Own our presence at conferences and run our own events: stand, speakers, budget and the follow-up that decides whether any of it was worth doing.',
    requirements: ['Three or more years running B2B events'],
  },
  {
    title: 'Marketing Operations Manager', department: 'dept_mktg', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Marketing Automation', 'Attribution', 'CRM', 'Reporting'],
    description:
      'Own the marketing stack and the attribution behind it — the systems, the data hygiene, and the honest answer about which channel actually produced a customer.',
    requirements: ['Four or more years in marketing operations'],
  },
  {
    title: 'Public Relations Manager', department: 'dept_mktg', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Public Relations', 'Media Relations', 'Crisis Communications'],
    description:
      'Own press relationships and what we say publicly, including when the news is bad. Works closely with the media monitoring analyst, who will usually see it coming first.',
    requirements: ['Five or more years in PR, with journalists who take your calls'],
  },
  {
    title: 'Alliances Director', department: 'dept_partnerships', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [2300000, 3000000],
    skills: ['Strategic Alliances', 'Negotiation', 'Partner Strategy'],
    description:
      'Own the strategic relationships that change our reach: ATS platforms, universities, industry bodies and the integrations that follow from them.',
    requirements: ['Ten or more years in partnerships or business development'],
  },

  // ══ Trust & Safety ═════════════════════════════════════════════════════════
  {
    title: 'Trust & Safety Analyst', department: 'dept_trust', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Investigation', 'Fraud Detection', 'Analysis', 'Policy'],
    description:
      'Investigate what should not be on the platform: fake employers, advance-fee job scams, forged certificates and stolen identities. Every case you catch is somebody not losing money they do not have.',
    requirements: [
      'Two or more years in trust and safety, fraud or investigations',
      'Sceptical by instinct, and able to write up why you concluded what you did',
    ],
  },
  {
    title: 'Fraud Investigator', department: 'dept_trust', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [1400000, 2100000],
    skills: ['Fraud Investigation', 'SQL', 'Pattern Analysis', 'Evidence Handling'],
    description:
      'Work the harder cases: coordinated fake-recruiter networks, document forgery rings and payment fraud. You will query the data yourself and hand evidence to legal in a state they can use.',
    requirements: [
      'Four or more years investigating fraud, ideally on a platform',
      'Comfortable in SQL — the pattern is usually in the data before it is in a report',
    ],
  },
  {
    title: 'Content Moderator', department: 'dept_trust', level: 'entry', type: 'full_time',
    ...IN, city: 'Hyderabad', region: 'Telangana', remote: false, salary: [300000, 500000],
    skills: ['Moderation', 'Policy Application', 'Attention to Detail'],
    description:
      'Review job postings, profiles and messages against our policies, and act on what breaches them. The work is repetitive by design and occasionally unpleasant; support and rotation are built into the role.',
    requirements: [
      'Careful reader who applies a rule consistently on the four-hundredth item',
      'No prior moderation experience required — the policy is taught',
    ],
  },
  {
    title: 'Trust & Safety Manager', department: 'dept_trust', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Trust & Safety', 'Leadership', 'Policy', 'Escalation Management'],
    description:
      'Lead the function: the moderation team, the investigation queue, the escalation path to legal and law enforcement, and the wellbeing of people who look at the worst of it all day.',
    requirements: ['Seven or more years in trust and safety, including leading a team'],
  },
  {
    title: 'Policy Manager', department: 'dept_trust', level: 'senior', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [1400000, 2100000],
    skills: ['Policy Writing', 'Regulation', 'Stakeholder Management'],
    description:
      'Write the rules the platform runs on — who may post, what may be asked of a candidate, what happens when someone breaks it — and keep them defensible as employment regulation changes.',
    requirements: ['Five or more years in policy, regulatory affairs or a related legal role'],
  },

  // ══ Localisation ═══════════════════════════════════════════════════════════
  {
    title: 'Localisation Manager', department: 'dept_loc', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Localisation', 'Vendor Management', 'Process', 'Quality'],
    description:
      'Own the platform in every language we serve: the translation pipeline, the vendors, the glossary and the quality bar. Hiring vocabulary is full of terms that must not be translated loosely.',
    requirements: ['Four or more years running localisation', 'Have built a glossary and enforced it'],
  },
  {
    title: 'Linguist — Indian Languages', department: 'dept_loc', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Translation', 'Hindi', 'Tamil', 'Proofreading'],
    description:
      'Translate and review the product, job postings and candidate communication into Indian languages, keeping the register right — formal enough to be trusted, plain enough to be understood.',
    requirements: [
      'Professional translation experience into at least two Indian languages',
      'Native-level fluency in the languages you claim',
    ],
  },
  {
    title: 'Localisation Engineer', department: 'dept_loc', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['i18n', 'React', 'Tooling', 'Automation'],
    description:
      'Own the engineering side of language support: string extraction, pluralisation, right-to-left layout, date and currency formatting, and catching the hardcoded string before it ships.',
    requirements: ['Three or more years of internationalisation work in a real product'],
  },

  // ══ Customer (ladder) ══════════════════════════════════════════════════════
  {
    title: 'Support Team Lead', department: 'dept_support', level: 'senior', type: 'full_time',
    ...IN, city: 'Hyderabad', region: 'Telangana', remote: false, salary: [1400000, 2100000],
    skills: ['Team Leadership', 'Support Operations', 'Quality', 'Coaching'],
    description:
      'Lead a support shift: the queue, the quality bar, coaching, and the escalations that need a decision rather than a reply.',
    requirements: ['Four or more years in support, including leading a team'],
  },
  {
    title: 'Customer Success Director', department: 'dept_support', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Customer Success Leadership', 'Retention', 'Executive Relationships'],
    description:
      'Own retention and expansion across the customer base, and lead the CSMs who deliver it. You will personally hold the relationships that matter most.',
    requirements: ['Ten or more years in customer success, several leading a team'],
  },
  {
    title: 'Renewals Manager', department: 'dept_support', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Renewals', 'Negotiation', 'Forecasting'],
    description:
      'Own the renewal book: forecast it accurately, negotiate it, and raise the alarm early enough that a save is still possible.',
    requirements: ['Three or more years in renewals or account management'],
  },

  // ══ Operations ═════════════════════════════════════════════════════════════
  {
    title: 'Operations Manager', department: 'dept_ops', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [1400000, 2100000],
    skills: ['Operations Management', 'Process Design', 'Team Leadership'],
    description:
      'Run the operational side of the business day to day, and lead the people doing it. Most of the value is in noticing which manual step has quietly become load-bearing.',
    requirements: ['Six or more years in operations, including managing a team'],
  },
  {
    title: 'Program Coordinator', department: 'dept_ops', level: 'entry', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [300000, 500000],
    skills: ['Coordination', 'Scheduling', 'Documentation'],
    description:
      'Keep programmes moving: schedules, notes, actions and the chasing that turns a decision into a done thing.',
    requirements: ['One or more years coordinating projects or programmes'],
  },
  {
    title: 'Warehouse Supervisor', department: 'dept_supply', level: 'mid', type: 'full_time',
    ...IN, city: 'Bhiwandi', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Warehouse Operations', 'Inventory', 'Team Supervision'],
    description:
      'Run the equipment store: receiving, stock accuracy, dispatch to offices and remote staff, and the count that has to reconcile at month end.',
    requirements: ['Three or more years supervising a warehouse or store'],
  },
  {
    title: 'Inventory Analyst', department: 'dept_supply', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Inventory Management', 'Excel', 'Forecasting'],
    description:
      'Know what hardware we own, where it is and what we will need next quarter, so nobody starts without a laptop and nothing sits in a cupboard depreciating.',
    requirements: ['Two or more years in inventory or supply analysis'],
  },
  {
    title: 'Category Manager', department: 'dept_procurement', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Category Management', 'Sourcing', 'Negotiation', 'Analysis'],
    description:
      'Own a spend category end to end — software, hardware or professional services: the strategy, the vendors, the negotiation and the savings you can actually evidence.',
    requirements: ['Five or more years in strategic sourcing or category management'],
  },
  {
    title: 'Contracts Administrator', department: 'dept_procurement', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Contract Administration', 'Record Keeping', 'Compliance'],
    description:
      'Keep every contract findable and current: the repository, renewal dates, obligations and the escalation before an auto-renewal we did not want.',
    requirements: ['Two or more years administering commercial contracts'],
  },
  {
    title: 'Maintenance Technician', department: 'dept_facilities', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [16000, 28000],
    skills: ['Electrical', 'Plumbing', 'HVAC', 'Repairs'],
    description:
      'Keep the building working: electrical, plumbing, air conditioning and the general repairs, including the studio where a failure stops a shoot.',
    requirements: ['ITI qualification or equivalent, with two or more years on the tools'],
  },
  {
    title: 'Health & Safety Officer', department: 'dept_facilities', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Health & Safety', 'Risk Assessment', 'Compliance', 'Training'],
    description:
      'Own workplace safety across offices, the studio and event locations: risk assessments, drills, incident investigation and the statutory record.',
    requirements: ['Three or more years in EHS with a recognised safety qualification'],
  },
  {
    title: 'Dispatch Executive', department: 'dept_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [12000, 20000],
    skills: ['Dispatch', 'Record Keeping', 'Coordination'],
    description:
      'Handle inbound and outbound courier and document movement, including the offer letters and verification packets that must be tracked and must not go missing.',
    requirements: ['Organised with paperwork', 'One or more years in a dispatch or mailroom role'],
  },

  // ══ Finance (full function) ════════════════════════════════════════════════
  {
    title: 'Accounts Payable Executive', department: 'dept_finance', level: 'entry', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [300000, 500000],
    skills: ['Accounts Payable', 'Reconciliation', 'ERP'],
    description:
      'Process supplier invoices, match them to purchase orders and get them paid on time. Vendors who are paid on time answer the phone when we need something urgently.',
    requirements: ['Commerce graduate with one or more years in accounts payable'],
  },
  {
    title: 'Accounts Receivable Executive', department: 'dept_finance', level: 'entry', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [300000, 500000],
    skills: ['Accounts Receivable', 'Collections', 'Reconciliation'],
    description:
      'Raise invoices, chase what is overdue and reconcile receipts — while staying on good terms with a customer the sales team is trying to renew.',
    requirements: ['Commerce graduate with one or more years in receivables or collections'],
  },
  {
    title: 'Billing Specialist', department: 'dept_finance', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Billing', 'Subscription Management', 'Excel'],
    description:
      'Own subscription billing: usage, proration, credits and the disputes that follow. An incorrect invoice costs more in trust than in money.',
    requirements: ['Two or more years in billing for a subscription business'],
  },
  {
    title: 'Tax Manager', department: 'dept_finance', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Direct Tax', 'GST', 'Transfer Pricing', 'Compliance'],
    description:
      'Own tax across the jurisdictions we operate in: direct and indirect, transfer pricing between entities, filings and assessments.',
    requirements: ['Chartered Accountant with six or more years in tax, including cross-border work'],
  },
  {
    title: 'Treasury Analyst', department: 'dept_finance', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Treasury', 'Cash Flow', 'Banking', 'FX'],
    description:
      'Manage cash across entities and currencies: forecasting, banking relationships and the FX exposure that comes from earning in one currency and paying salaries in another.',
    requirements: ['Three or more years in treasury or corporate banking'],
  },
  {
    title: 'Internal Auditor', department: 'dept_finance', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['Internal Audit', 'Controls', 'Risk', 'Reporting'],
    description:
      'Test whether the controls we say we have are the ones we actually operate, and report it plainly. The role only works if you are willing to be unpopular occasionally.',
    requirements: ['Chartered Accountant or equivalent with four or more years in audit'],
  },
  {
    title: 'VP Finance', department: 'dept_finance', level: 'lead', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [2300000, 3000000],
    skills: ['Financial Leadership', 'Planning', 'Fundraising', 'Governance'],
    description:
      'Own finance as a whole: planning, reporting, controls, the board pack and the funding conversations. Reports to the founders and works closely with the controller.',
    requirements: ['Fifteen or more years in finance, including a senior leadership role at a growing company'],
  },

  // ══ Legal ══════════════════════════════════════════════════════════════════
  {
    title: 'Contracts Manager', department: 'dept_legal', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Contract Drafting', 'Negotiation', 'Commercial Law'],
    description:
      'Own the contract lifecycle for commercial deals: templates, redlines, playbooks and the escalation to counsel when a term genuinely matters.',
    requirements: ['Five or more years managing commercial contracts', 'Know which battles are worth fighting on a redline'],
  },
  {
    title: 'Company Secretary', department: 'dept_legal', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Corporate Secretarial', 'Companies Act', 'Board Governance', 'ROC Filings'],
    description:
      'Own statutory compliance and governance for the Indian entity: board and shareholder meetings, minutes, registers and ROC filings.',
    requirements: ['Qualified Company Secretary with four or more years post-qualification'],
  },
  {
    title: 'Paralegal', department: 'dept_legal', level: 'entry', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [300000, 500000],
    skills: ['Legal Research', 'Document Management', 'Drafting Support'],
    description:
      'Support the legal team: research, first drafts, the contract repository and keeping the diary of everything with a deadline attached to it.',
    requirements: ['Law graduate with one or more years in a legal support role'],
  },

  // ══ Strategy & Corporate ═══════════════════════════════════════════════════
  {
    title: 'Corporate Development Analyst', department: 'dept_strategy', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['M&A', 'Financial Modelling', 'Due Diligence', 'Research'],
    description:
      'Work on acquisitions and investments: market maps, models, diligence and the memo that argues for or against a deal.',
    requirements: ['Three or more years in investment banking, private equity or corporate development'],
  },
  {
    title: 'Business Analyst', department: 'dept_strategy', level: 'entry', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [300000, 500000],
    skills: ['Analysis', 'Excel', 'SQL', 'Presentation'],
    description:
      'Take a question from leadership — a market, a segment, a pricing change — and come back with an answer that has numbers behind it.',
    requirements: ['One or more years in analysis or consulting', 'Comfortable presenting to people more senior than you'],
  },
  {
    title: 'VP Engineering', department: 'dept_exec', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Engineering Leadership', 'Strategy', 'Org Design', 'Delivery'],
    description:
      'Own engineering across the company: the organisation, the architecture direction, delivery and the technical relationship with the rest of the leadership team.',
    requirements: ['Eighteen or more years, including running an engineering organisation through significant growth'],
  },

  // ══ People (full function) ═════════════════════════════════════════════════
  {
    title: 'HR Generalist', department: 'dept_hr', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['HR Operations', 'Employee Relations', 'Compliance'],
    description:
      'Handle the day-to-day of employment for a group of teams: queries, documentation, leave, and the first conversation when something is going wrong.',
    requirements: ['Three or more years as an HR generalist'],
  },
  {
    title: 'Employee Relations Manager', department: 'dept_hr', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [1400000, 2100000],
    skills: ['Employee Relations', 'Investigation', 'Employment Law', 'Mediation'],
    description:
      'Own grievances, investigations and disciplinary matters. The work is confidential, often unpleasant, and judged on whether both sides felt fairly heard.',
    requirements: [
      'Six or more years in employee relations, including formal investigations',
      'Working knowledge of Indian employment law',
    ],
  },
  {
    title: 'HRIS Analyst', department: 'dept_hr', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['HRIS', 'Data Management', 'Reporting', 'Integrations'],
    description:
      'Own the people systems: configuration, data quality, integrations with payroll and this very ATS, and the reporting the leadership team relies on.',
    requirements: ['Three or more years administering an HRIS'],
  },
  {
    title: 'Diversity & Inclusion Manager', department: 'dept_hr', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['DEI Strategy', 'Analytics', 'Programme Design', 'Facilitation'],
    description:
      'Own inclusion here and in the product — we sell hiring software, so representation in our own funnel and bias in our own tooling are both your remit. Measured, not declared.',
    requirements: [
      'Five or more years in DEI with programmes you can evidence',
      'Comfortable presenting numbers that do not flatter us',
    ],
  },
  {
    title: 'HR Director', department: 'dept_hr', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['HR Leadership', 'Org Design', 'Compensation', 'Change Management'],
    description:
      'Own the people function: structure, compensation philosophy, performance, and the culture the company actually has rather than the one on the wall.',
    requirements: ['Fifteen or more years in HR, including leading the function at a growing company'],
  },
  {
    title: 'Sourcing Specialist', department: 'dept_ta', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Sourcing', 'Boolean Search', 'Outreach', 'Market Mapping'],
    description:
      'Find the people who are not applying: mapping, outreach and the first conversation. Response rate is the whole measure, and it comes from the quality of the message.',
    requirements: ['Two or more years sourcing, with an outreach rate you are proud of'],
  },
  {
    title: 'Recruitment Marketing Manager', department: 'dept_ta', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Employer Branding', 'Content', 'Campaigns', 'Analytics'],
    description:
      'Own how we look to candidates: the careers site, the employer brand and the campaigns behind each hiring push — for a company whose product is hiring, this is also a shop window.',
    requirements: ['Four or more years across recruitment marketing or employer branding'],
  },
  {
    title: 'Head of Talent Acquisition', department: 'dept_ta', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['TA Leadership', 'Workforce Planning', 'Process', 'Analytics'],
    description:
      'Own hiring across the company: the plan, the team, the process and the candidate experience — which we are contractually obliged to be good at, since we sell it.',
    requirements: ['Twelve or more years in talent acquisition, several leading a team'],
  },
  {
    title: 'Instructional Designer', department: 'dept_l_and_d', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Instructional Design', 'Curriculum', 'E-Learning', 'Assessment'],
    description:
      'Design learning that changes what people do: onboarding paths, manager training and the product certification our customers take.',
    requirements: ['Three or more years in instructional design, with courses people completed'],
  },
  {
    title: 'Technical Trainer', department: 'dept_l_and_d', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Training Delivery', 'Facilitation', 'Technical Communication'],
    description:
      'Train customers and internal teams on the platform — live sessions, workshops and the certification programme, for rooms that range from expert to entirely new.',
    requirements: ['Three or more years training on a technical product', 'Genuinely comfortable in front of a room'],
  },


  // ══ Mine Operations ════════════════════════════════════════════════════════
  // Statutory posts under the Mines Act 1952 and the Metalliferous Mines / Coal Mines
  // Regulations. Where a certificate of competency is legally required, the posting
  // says so plainly rather than burying it — an applicant without the ticket cannot
  // hold the post, and finding that out at interview wastes everyone's time.
  {
    title: 'Mine Manager', department: 'dept_mine_ops', level: 'lead', type: 'full_time',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [2300000, 3000000],
    skills: ['Mine Management', 'Statutory Compliance', 'Production Planning', 'Leadership'],
    description:
      'Hold statutory charge of the mine. You are the person named to the DGMS, accountable for production, for every person underground or in the pit, and for the decisions that stop work when conditions are not right.',
    requirements: [
      'First Class Manager\'s Certificate of Competency (Metalliferous or Coal, as applicable)',
      'Twelve or more years in mining, including as Assistant Manager',
      'Complete command of the Mines Act, the Regulations and the DGMS circulars',
    ],
  },
  {
    title: 'Assistant Mine Manager', department: 'dept_mine_ops', level: 'senior', type: 'full_time',
    ...IN, city: 'Joda', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Mine Operations', 'Statutory Compliance', 'Supervision'],
    description:
      'Hold statutory charge of a section or a shift under the Mine Manager: the production plan, the workforce on it, and the compliance record for your area.',
    requirements: [
      'Second Class Manager\'s Certificate of Competency, at minimum',
      'Six or more years in mine operations',
    ],
  },
  {
    title: 'Mining Engineer', department: 'dept_mine_ops', level: 'mid', type: 'full_time',
    ...IN, city: 'Sandur', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Mine Planning', 'Drilling & Blasting', 'Surpac', 'Production'],
    description:
      'Plan and run the day-to-day working: bench design, drill patterns, blast design, equipment deployment and the production numbers that come out of it.',
    requirements: [
      'B.Tech in Mining Engineering',
      'Three or more years at an operating mine',
      'Working knowledge of a mine planning package — Surpac, Datamine or MineSched',
    ],
  },
  {
    title: 'Graduate Mining Engineer', department: 'dept_mine_ops', level: 'entry', type: 'full_time',
    ...IN, city: 'Kirandul', region: 'Chhattisgarh', remote: false, salary: [300000, 500000],
    skills: ['Mining Engineering', 'Surveying', 'Safety'],
    description:
      'A first job at a working mine, rotating through operations, planning, survey and safety over the first year. You will be on the bench in the morning, not in an office.',
    requirements: [
      'B.Tech in Mining Engineering, graduating or graduated within a year',
      'Willing to live at site and work rotating shifts',
    ],
  },
  {
    title: 'Mine Planning Engineer', department: 'dept_mine_ops', level: 'senior', type: 'full_time',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Mine Planning', 'Surpac', 'Scheduling', 'Reserve Estimation'],
    description:
      'Own the short and medium-term plan: sequencing, waste-to-ore ratios, equipment requirements and the schedule the site is measured against.',
    requirements: [
      'B.Tech in Mining Engineering with five or more years in planning',
      'Strong in mine planning software and in defending a schedule to operations',
    ],
  },
  {
    title: 'Overman', department: 'dept_mine_ops', level: 'senior', type: 'full_time',
    ...IN, city: 'Jharia', region: 'Jharkhand', remote: false, salary: [1400000, 2100000],
    skills: ['Supervision', 'Mine Safety', 'Production'],
    description:
      'Supervise the shift at the face: the work, the people, the ground conditions and the statutory inspections and reports that must be made before work begins.',
    requirements: [
      'Overman\'s Certificate of Competency',
      'Valid gas testing certificate and first aid certificate',
      'Five or more years underground or in an opencast working',
    ],
  },
  {
    title: 'Mining Mate', department: 'dept_mine_ops', level: 'mid', type: 'full_time',
    ...IN, city: 'Gevra', region: 'Chhattisgarh', remote: false, salary: [700000, 1400000],
    skills: ['Supervision', 'Safety Inspection', 'Team Leadership'],
    description:
      'Supervise a working place directly: inspect it before the shift starts, keep the crew safe through it, and report what you found honestly at the end.',
    requirements: [
      'Mining Mate\'s Certificate of Competency',
      'Gas testing and first aid certificates',
      'Three or more years working at the face',
    ],
  },
  {
    title: 'Blaster / Shot Firer', department: 'dept_mine_ops', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Bailadila', region: 'Chhattisgarh', remote: false, salary: [16000, 28000],
    skills: ['Blasting', 'Explosives Handling', 'Safety'],
    description:
      'Charge and fire blasts to the approved design: explosives from magazine to hole, the connection, the clearance of the area, and the count that says everyone is back.',
    requirements: [
      'Valid Blaster\'s Certificate and PESO licence to handle explosives',
      'Three or more years of blasting at an operating mine',
      'Unimpeachable discipline about the clearance procedure',
    ],
  },
  {
    title: 'Drill Operator', department: 'dept_mine_ops', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Donimalai', region: 'Karnataka', remote: false, salary: [15000, 26000],
    skills: ['Drilling', 'Machine Operation', 'Maintenance'],
    description:
      'Operate the production drill to the marked pattern — depth, angle and spacing as designed, because the blast is only as good as the holes it goes into.',
    requirements: ['Two or more years operating drills at a mine', 'Able to do first-line maintenance on the rig'],
  },
  {
    title: 'Excavator Operator', department: 'dept_mine_ops', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [15000, 26000],
    skills: ['Excavator Operation', 'HEMM', 'Loading'],
    description:
      'Operate the hydraulic excavator or shovel on the loading face: keep the trucks moving, keep the face safe, and keep the machine in good order across a twelve-hour shift.',
    requirements: [
      'Three or more years operating excavators or shovels at a mine',
      'Valid HEMM operator certification',
    ],
  },
  {
    title: 'Dumper / Haul Truck Driver', department: 'dept_mine_ops', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Kusmunda', region: 'Chhattisgarh', remote: false, salary: [12000, 20000],
    skills: ['Heavy Vehicle Driving', 'Haulage', 'Safety'],
    description:
      'Drive the haul truck between the face and the tip or crusher, on haul roads in monsoon and in dust, in a shift pattern that covers the mine around the clock.',
    requirements: [
      'Valid heavy vehicle licence and two or more years driving dumpers at a mine',
      'Understand right-of-way at a loading face — this is where people get hurt',
    ],
  },
  {
    title: 'Dozer Operator', department: 'dept_mine_ops', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Jayant', region: 'Madhya Pradesh', remote: false, salary: [15000, 26000],
    skills: ['Dozer Operation', 'HEMM', 'Grading'],
    description:
      'Push, level and maintain the working benches, dumps and haul roads, and clear up after a blast so the excavators can get in.',
    requirements: ['Three or more years on dozers at a mine or large earthworks site'],
  },
  {
    title: 'Motor Grader Operator', department: 'dept_mine_ops', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Bolani', region: 'Odisha', remote: false, salary: [15000, 26000],
    skills: ['Grader Operation', 'Haul Road Maintenance'],
    description:
      'Keep the haul roads graded and drained. Tyre life, fuel burn and the safety of every truck on the road all come back to how well this is done.',
    requirements: ['Three or more years operating a motor grader'],
  },
  {
    title: 'Wheel Loader Operator', department: 'dept_mine_ops', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Hospet', region: 'Karnataka', remote: false, salary: [15000, 26000],
    skills: ['Loader Operation', 'HEMM'],
    description:
      'Load trucks at the stockyard and feed the crusher, keeping the pile tidy and the grade consistent.',
    requirements: ['Two or more years operating a wheel loader'],
  },
  {
    title: 'Crane Operator', department: 'dept_mine_ops', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Joda', region: 'Odisha', remote: false, salary: [15000, 26000],
    skills: ['Crane Operation', 'Rigging', 'Lifting Plans'],
    description:
      'Operate mobile cranes for maintenance lifts and plant work, to a lifting plan, with a banksman you trust and a load chart you check.',
    requirements: ['Valid crane operator certification and three or more years of lifting experience'],
  },
  {
    title: 'Tipper Driver', department: 'dept_mine_ops', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Sandur', region: 'Karnataka', remote: false, salary: [12000, 20000],
    skills: ['Heavy Vehicle Driving', 'Transport'],
    description:
      'Move material between the mine, the stockyard, the plant and the railway siding, on public roads as well as haul roads.',
    requirements: ['Valid heavy vehicle licence with one or more years driving tippers'],
  },
  {
    title: 'Mine Helper', department: 'dept_mine_ops', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [12000, 18000],
    skills: ['Manual Work', 'Safety Awareness', 'Teamwork'],
    description:
      'General work across the site: assisting operators and fitters, housekeeping around the working areas, cleaning spillage from conveyors, and helping wherever the shift needs hands. Full safety training and PPE are provided, and this is the usual route into an operator or trade job here.',
    requirements: [
      'No formal qualification required',
      'Physically fit and able to work shifts at site',
      'Willing to complete the statutory vocational training before starting',
    ],
  },
  {
    title: 'Pit Supervisor', department: 'dept_mine_ops', level: 'senior', type: 'full_time',
    ...IN, city: 'Kirandul', region: 'Chhattisgarh', remote: false, salary: [1400000, 2100000],
    skills: ['Supervision', 'Production', 'HEMM Deployment'],
    description:
      'Run the pit through the shift: where each machine works, how the trucks are matched to the loaders, and what happens when one of them goes down mid-shift.',
    requirements: ['Five or more years in opencast operations, including supervising a crew'],
  },
  {
    title: 'Winding Engine Driver', department: 'dept_mine_ops', level: 'senior', type: 'full_time', period: 'month',
    ...IN, city: 'Jharia', region: 'Jharkhand', remote: false, salary: [12000, 20000],
    skills: ['Winding Operation', 'Signals', 'Safety'],
    description:
      'Operate the winding engine that raises and lowers people and material in the shaft. It is the most tightly regulated post on the site, and rightly so.',
    requirements: [
      'Winding Engine Driver\'s Certificate of Competency',
      'Medical fitness certificate, renewed as required',
      'Three or more years in the role or as an understudy',
    ],
  },
  {
    title: 'Ventilation Officer', department: 'dept_mine_ops', level: 'senior', type: 'full_time',
    ...IN, city: 'Jharia', region: 'Jharkhand', remote: false, salary: [1400000, 2100000],
    skills: ['Mine Ventilation', 'Gas Monitoring', 'Survey'],
    description:
      'Own the ventilation of the underground workings: the survey, the fans, the airflow at every district and the gas readings that decide whether a place is fit to work.',
    requirements: [
      'B.Tech in Mining Engineering with ventilation experience',
      'Gas testing certificate',
      'Five or more years underground',
    ],
  },

  // ══ Geology & Mine Survey ══════════════════════════════════════════════════
  {
    title: 'Mine Surveyor', department: 'dept_mine_geo', level: 'senior', type: 'full_time',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Mine Surveying', 'Total Station', 'AutoCAD', 'Volumetrics'],
    description:
      'Hold statutory charge of survey: the mine plans and sections that must be maintained by law, monthly volumetrics, boundary control and the pegs the excavators work to.',
    requirements: [
      'Mine Surveyor\'s Certificate of Competency from the DGMS',
      'Four or more years surveying at an operating mine',
      'Total station and drone survey, with AutoCAD or Surpac for the drawing',
    ],
  },
  {
    title: 'Assistant Surveyor', department: 'dept_mine_geo', level: 'mid', type: 'full_time',
    ...IN, city: 'Sandur', region: 'Karnataka', remote: false, salary: [700000, 1400000],
    skills: ['Surveying', 'Total Station', 'AutoCAD'],
    description:
      'Support the surveyor in the field and on the drawing: pick-ups, setting out, stockpile volumes and keeping the plans current.',
    requirements: ['Diploma in mining or civil engineering with two or more years of survey work'],
  },
  {
    title: 'Geologist', department: 'dept_mine_geo', level: 'mid', type: 'full_time',
    ...IN, city: 'Joda', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Geology', 'Core Logging', 'Grade Control', 'Sampling'],
    description:
      'Own grade control at the mine: logging, sampling, the block model against actual production, and telling operations when the ore is not where the model said it would be.',
    requirements: [
      'M.Sc or M.Tech in Geology or Applied Geology',
      'Three or more years of grade control or exploration at an operating mine',
    ],
  },
  {
    title: 'Senior Exploration Geologist', department: 'dept_mine_geo', level: 'senior', type: 'full_time',
    ...IN, city: 'Zawar', region: 'Rajasthan', remote: false, salary: [1400000, 2100000],
    skills: ['Exploration', 'Resource Estimation', 'Structural Geology', 'Datamine'],
    description:
      'Lead exploration around the lease: programme design, drilling, interpretation and the resource estimate that eventually turns into a reserve.',
    requirements: [
      'Eight or more years in exploration geology',
      'Experience taking a resource estimate through a competent-person review',
    ],
  },
  {
    title: 'Sampler', department: 'dept_mine_geo', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Bolani', region: 'Odisha', remote: false, salary: [12000, 18000],
    skills: ['Sampling', 'Record Keeping'],
    description:
      'Take face, pit and stockpile samples to the prescribed method, label and log them, and get them to the laboratory. Every grade decision downstream rests on whether this was done properly.',
    requirements: ['Tenth or twelfth standard pass', 'Careful and methodical — training is given'],
  },

  // ══ Mine Maintenance & HEMM ════════════════════════════════════════════════
  {
    title: 'HEMM Maintenance Engineer', department: 'dept_mine_maint', level: 'senior', type: 'full_time',
    ...IN, city: 'Kusmunda', region: 'Chhattisgarh', remote: false, salary: [1400000, 2100000],
    skills: ['HEMM Maintenance', 'Hydraulics', 'Preventive Maintenance', 'Reliability'],
    description:
      'Own availability of the heavy fleet — excavators, dumpers, dozers and drills. Availability is the number the whole site is judged on, and it is won through planned maintenance rather than heroic repairs.',
    requirements: [
      'B.Tech in Mechanical Engineering with five or more years on HEMM',
      'Fluent in hydraulic and powertrain fault-finding on large machines',
    ],
  },
  {
    title: 'Workshop Supervisor', department: 'dept_mine_maint', level: 'senior', type: 'full_time',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Workshop Management', 'Scheduling', 'Team Supervision', 'Safety'],
    description:
      'Run the workshop: the job queue, the fitters on it, spares availability and the isolation and lock-out discipline that keeps people safe around machines under repair.',
    requirements: ['Diploma in mechanical engineering with six or more years in a heavy workshop'],
  },
  {
    title: 'Mechanical Fitter', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Joda', region: 'Odisha', remote: false, salary: [16000, 28000],
    skills: ['Fitting', 'Hydraulics', 'Welding', 'Assembly'],
    description:
      'Maintain and repair the fleet and the plant: scheduled servicing, component change-outs, hydraulic repairs and the breakdowns that happen at two in the morning.',
    requirements: ['ITI in Fitter trade with three or more years on heavy equipment'],
  },
  {
    title: 'Diesel Mechanic', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Gevra', region: 'Chhattisgarh', remote: false, salary: [16000, 28000],
    skills: ['Diesel Engines', 'Fault Diagnosis', 'Maintenance'],
    description:
      'Look after the diesel engines across the fleet: servicing, injector and turbo work, and diagnosis when a machine is down and the shift is waiting on it.',
    requirements: ['ITI in Diesel Mechanic trade with three or more years on heavy vehicles'],
  },
  {
    title: 'Auto Electrician', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Kirandul', region: 'Chhattisgarh', remote: false, salary: [16000, 28000],
    skills: ['Auto Electrical', 'Wiring', 'Diagnostics'],
    description:
      'Maintain the electrical systems on the heavy fleet: starting, charging, lighting, sensors and the wiring looms that dust and vibration destroy.',
    requirements: ['ITI in Electrician or Auto Electrician trade with three or more years on HEMM'],
  },
  {
    title: 'Mine Electrician', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Jharia', region: 'Jharkhand', remote: false, salary: [16000, 28000],
    skills: ['Electrical Maintenance', 'HT/LT Systems', 'Safety'],
    description:
      'Maintain the mine\'s electrical distribution: substations, HT and LT lines, motors, starters and the flameproof equipment where the regulations require it.',
    requirements: [
      'ITI in Electrician trade with a valid electrical supervisor licence',
      'Three or more years in industrial or mine electrical work',
    ],
  },
  {
    title: 'Welder', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Sandur', region: 'Karnataka', remote: false, salary: [16000, 28000],
    skills: ['Welding', 'Fabrication', 'Cutting'],
    description:
      'Weld and fabricate across the site: bucket and body repairs, chute and liner work, structural repairs in the plant, and hard-facing on wear parts.',
    requirements: ['ITI in Welder trade with three or more years of heavy fabrication or repair'],
  },
  {
    title: 'Hydraulic Technician', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [16000, 28000],
    skills: ['Hydraulics', 'Seal Replacement', 'Pressure Testing'],
    description:
      'Specialise in the hydraulics that move every large machine here: cylinders, pumps, valves and hoses, on the machine and on the bench.',
    requirements: ['ITI with three or more years specialising in mobile hydraulics'],
  },
  {
    title: 'Tyre Technician', department: 'dept_mine_maint', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Kusmunda', region: 'Chhattisgarh', remote: false, salary: [16000, 28000],
    skills: ['Tyre Management', 'Safety', 'Inspection'],
    description:
      'Manage the tyres on the haul fleet: pressures, rotation, repair and change-outs. Giant OTR tyres are among the most dangerous things on a mine site and the procedure exists for good reason.',
    requirements: ['Two or more years in OTR tyre work', 'Absolute discipline about the cage and the deflation procedure'],
  },
  {
    title: 'Instrumentation Technician', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Hospet', region: 'Karnataka', remote: false, salary: [16000, 28000],
    skills: ['Instrumentation', 'PLC', 'Calibration', 'Sensors'],
    description:
      'Maintain the instrumentation across the plant: weightometers, level and flow sensors, PLC I/O and the calibration records behind every one of them.',
    requirements: ['Diploma in instrumentation with three or more years in a process plant'],
  },

  // ══ Mineral Processing & Quality ═══════════════════════════════════════════
  {
    title: 'Plant Manager — Beneficiation', department: 'dept_mine_proc', level: 'lead', type: 'full_time',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [2300000, 3000000],
    skills: ['Plant Management', 'Mineral Processing', 'Leadership', 'Production'],
    description:
      'Run the beneficiation plant: throughput, recovery, product grade, the maintenance shutdowns and the team across all shifts.',
    requirements: [
      'B.Tech in Mineral Processing, Metallurgy or Chemical Engineering',
      'Ten or more years in processing, including running a plant',
    ],
  },
  {
    title: 'Mineral Processing Engineer', department: 'dept_mine_proc', level: 'mid', type: 'full_time',
    ...IN, city: 'Joda', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Mineral Processing', 'Metallurgical Accounting', 'Optimisation'],
    description:
      'Improve what the plant recovers: circuit balances, reagent and screen optimisation, and the test work that decides whether a change is worth making.',
    requirements: ['B.Tech in Mineral Processing or Metallurgy with three or more years in a plant'],
  },
  {
    title: 'Metallurgist', department: 'dept_mine_proc', level: 'senior', type: 'full_time',
    ...IN, city: 'Zawar', region: 'Rajasthan', remote: false, salary: [1400000, 2100000],
    skills: ['Metallurgy', 'Test Work', 'Recovery', 'Analysis'],
    description:
      'Own metallurgical performance: daily accounting, recovery against the model, and the investigation when the numbers drift and nobody can say why.',
    requirements: ['B.Tech in Metallurgy with five or more years at an operating plant'],
  },
  {
    title: 'Plant Operator', department: 'dept_mine_proc', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Bolani', region: 'Odisha', remote: false, salary: [15000, 26000],
    skills: ['Plant Operation', 'Control Room', 'Monitoring'],
    description:
      'Run the processing circuit through your shift from the control room and the floor: feed rates, screens, pumps, and the walk-round that catches a problem before it becomes a stoppage.',
    requirements: ['ITI or twelfth standard pass', 'One or more years in a process plant, or willingness to be trained'],
  },
  {
    title: 'Crusher Operator', department: 'dept_mine_proc', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Sandur', region: 'Karnataka', remote: false, salary: [15000, 26000],
    skills: ['Crusher Operation', 'Monitoring', 'Housekeeping'],
    description:
      'Operate the crushing circuit: feed control, clearing blockages safely, and keeping the area clear of the spillage that makes it dangerous.',
    requirements: ['One or more years around crushing plant', 'Full training provided'],
  },
  {
    title: 'Conveyor Attendant', department: 'dept_mine_proc', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Kusmunda', region: 'Chhattisgarh', remote: false, salary: [12000, 18000],
    skills: ['Conveyor Systems', 'Inspection', 'Housekeeping'],
    description:
      'Patrol the conveyor runs: idlers, belt tracking, spillage and the pull-cords. Every guard stays on, and nothing is cleared while the belt is running.',
    requirements: ['No formal qualification required', 'Trained on conveyor safety before starting'],
  },
  {
    title: 'Laboratory Chemist / Assayer', department: 'dept_mine_proc', level: 'mid', type: 'full_time',
    ...IN, city: 'Joda', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Chemical Analysis', 'XRF', 'Titration', 'QA/QC'],
    description:
      'Assay ore and product samples and stand behind the numbers: preparation, analysis, standards and the QA/QC that makes a certificate mean something to a customer.',
    requirements: ['B.Sc in Chemistry with two or more years in a mineral laboratory'],
  },
  {
    title: 'Laboratory Technician', department: 'dept_mine_proc', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Hospet', region: 'Karnataka', remote: false, salary: [16000, 28000],
    skills: ['Sample Preparation', 'Laboratory Work'],
    description:
      'Prepare samples for assay — crushing, pulverising, splitting — and keep the laboratory clean enough that one sample does not contaminate the next.',
    requirements: ['Twelfth standard with science, or a diploma', 'Methodical; training provided'],
  },
  {
    title: 'Quality Control Inspector', department: 'dept_mine_proc', level: 'mid', type: 'full_time',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Quality Control', 'Sampling', 'Documentation'],
    description:
      'Check product quality before dispatch: sampling at the loading point, moisture and size checks, and the certificate that travels with the rake.',
    requirements: ['Diploma in a science or engineering discipline with two or more years in QC'],
  },

  // ══ Mine Safety, Health & Environment ══════════════════════════════════════
  {
    title: 'Safety Officer (Mines)', department: 'dept_mine_hse', level: 'senior', type: 'full_time',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Mine Safety', 'Risk Assessment', 'Statutory Compliance', 'Training'],
    description:
      'Hold the statutory safety post at the mine: inspections, risk assessment, incident investigation, the safety committee and the standing authority to stop a job. The role only works if you use that authority.',
    requirements: [
      'B.Tech in Mining or a Safety qualification recognised under the Mines Rules',
      'Five or more years in mine safety',
      'Willing to be unpopular on a production day',
    ],
  },
  {
    title: 'Safety Supervisor', department: 'dept_mine_hse', level: 'mid', type: 'full_time',
    ...IN, city: 'Gevra', region: 'Chhattisgarh', remote: false, salary: [700000, 1400000],
    skills: ['Safety Supervision', 'Toolbox Talks', 'PPE', 'Inspection'],
    description:
      'Be the safety presence on the shift: toolbox talks, workplace inspections, PPE compliance and stopping the shortcut before it becomes an incident report.',
    requirements: ['Diploma with a safety certification and three or more years at a mine site'],
  },
  {
    title: 'Mines Rescue Trained Person', department: 'dept_mine_hse', level: 'mid', type: 'full_time',
    ...IN, city: 'Jharia', region: 'Jharkhand', remote: false, salary: [700000, 1400000],
    skills: ['Mine Rescue', 'Breathing Apparatus', 'First Aid', 'Fitness'],
    description:
      'Serve on the rescue team alongside your regular trade: training, equipment readiness, drills, and the callout nobody wants but everybody needs to be ready for.',
    requirements: [
      'Mines rescue training certificate, current',
      'Medical fitness for breathing apparatus, maintained',
      'An existing mining trade — this is held in addition to it',
    ],
  },
  {
    title: 'Environment Officer', department: 'dept_mine_hse', level: 'senior', type: 'full_time',
    ...IN, city: 'Sandur', region: 'Karnataka', remote: false, salary: [1400000, 2100000],
    skills: ['Environmental Compliance', 'Monitoring', 'Reporting', 'Reclamation'],
    description:
      'Own environmental compliance at site: air, water and noise monitoring, consent conditions, the environmental clearance commitments and the reclamation plan we are held to.',
    requirements: [
      'M.Sc or M.Tech in Environmental Science or Engineering',
      'Four or more years at a mine or heavy industrial site',
      'Fluent in EC and CTO conditions and what the board actually inspects',
    ],
  },
  {
    title: 'Occupational Health Nurse', department: 'dept_mine_hse', level: 'mid', type: 'full_time',
    ...IN, city: 'Kirandul', region: 'Chhattisgarh', remote: false, salary: [700000, 1400000],
    skills: ['Occupational Health', 'First Aid', 'Health Records', 'Emergency Response'],
    description:
      'Run the site health centre: initial and periodical medical examinations, first response to injuries, and the health records the regulations require us to keep.',
    requirements: ['GNM or B.Sc Nursing with valid registration', 'Two or more years in occupational or emergency care'],
  },
  {
    title: 'First Aid Attendant', department: 'dept_mine_hse', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Bolani', region: 'Odisha', remote: false, salary: [12000, 18000],
    skills: ['First Aid', 'Emergency Response', 'Record Keeping'],
    description:
      'Provide first response at the working areas and staff the ambulance point through the shift.',
    requirements: ['Valid first aid certificate', 'Twelfth standard pass'],
  },

  // ══ Mine Administration & Community ════════════════════════════════════════
  {
    title: 'Mine Store Keeper', department: 'dept_mine_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Stores Management', 'Inventory', 'ERP', 'Record Keeping'],
    description:
      'Run the mine stores: receiving, issue against indent, stock accuracy and making sure the critical spare is on the shelf when a machine is down at midnight.',
    requirements: ['Two or more years in industrial stores', 'Comfortable in an ERP and rigorous with physical stock'],
  },
  {
    title: 'Explosive Magazine In-charge', department: 'dept_mine_admin', level: 'senior', type: 'full_time',
    ...IN, city: 'Bailadila', region: 'Chhattisgarh', remote: false, salary: [1400000, 2100000],
    skills: ['Explosives Management', 'PESO Compliance', 'Security', 'Record Keeping'],
    description:
      'Hold charge of the explosives magazine: receipt, storage, issue and the daily reconciliation. Every stick is accounted for, and the register is a legal document.',
    requirements: [
      'PESO-approved magazine in-charge licence',
      'Five or more years handling explosives at a mine',
      'Meticulous with records — this one is not negotiable',
    ],
  },
  {
    title: 'Weighbridge Operator', department: 'dept_mine_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Hospet', region: 'Karnataka', remote: false, salary: [15000, 26000],
    skills: ['Weighbridge Operation', 'Documentation', 'Data Entry'],
    description:
      'Weigh every vehicle in and out and issue the slip. The dispatch record, the royalty return and the customer invoice all begin at your desk, so it has to be right and it has to be honest.',
    requirements: ['Twelfth standard pass with basic computer skills', 'Firm with drivers who want a favour'],
  },
  {
    title: 'Dispatch Supervisor', department: 'dept_mine_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Joda', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Dispatch', 'Logistics', 'Documentation', 'Coordination'],
    description:
      'Run dispatch from the stockyard: loading sequence, rake and truck coordination, e-way bills and transit permits, and the queue outside the gate.',
    requirements: ['Three or more years in mine or plant dispatch'],
  },
  {
    title: 'Time Office Clerk', department: 'dept_mine_admin', level: 'entry', type: 'full_time',
    ...IN, city: 'Gevra', region: 'Chhattisgarh', remote: false, salary: [300000, 500000],
    skills: ['Attendance', 'Record Keeping', 'Payroll Input'],
    description:
      'Maintain attendance, shift rosters and the statutory registers, and get the muster right — people are paid from what you record.',
    requirements: ['Twelfth standard pass with one or more years in a time office or HR administration'],
  },
  {
    title: 'Mine Security Guard', department: 'dept_mine_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Sandur', region: 'Karnataka', remote: false, salary: [12000, 20000],
    skills: ['Security', 'Access Control', 'Patrolling'],
    description:
      'Guard the gate, the stockyard and the magazine approach: vehicle checks, access control, patrols and the log.',
    requirements: ['Physically fit, with security training or ex-services background preferred'],
  },
  {
    title: 'Fuel Station Attendant', department: 'dept_mine_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Kusmunda', region: 'Chhattisgarh', remote: false, salary: [12000, 18000],
    skills: ['Fuel Handling', 'Record Keeping', 'Safety'],
    description:
      'Run the site fuel point: dispensing to the fleet, meter readings, stock reconciliation and the spill and fire precautions that go with it.',
    requirements: ['Tenth standard pass', 'Trained on fuel handling before starting'],
  },
  {
    title: 'Mine Canteen Supervisor', department: 'dept_mine_admin', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [12000, 20000],
    skills: ['Canteen Management', 'Hygiene', 'Vendor Management'],
    description:
      'Run the site canteen across shifts: menu, hygiene, the contractor and feeding a night shift properly, which matters more to morale than most things on this list.',
    requirements: ['Three or more years running an industrial canteen', 'Food safety training'],
  },
  {
    title: 'Community Relations Officer', department: 'dept_mine_admin', level: 'senior', type: 'full_time',
    ...IN, city: 'Kirandul', region: 'Chhattisgarh', remote: false, salary: [1400000, 2100000],
    skills: ['Community Engagement', 'CSR', 'Local Languages', 'Negotiation'],
    description:
      'Be the mine\'s relationship with the villages around it: grievances, local employment, the CSR programme and the meetings where people tell us what we have got wrong.',
    requirements: [
      'Five or more years in community relations or rural development',
      'Fluent in the local language of the district',
      'Able to carry bad news in both directions',
    ],
  },
  {
    title: 'Land & Liaison Officer', department: 'dept_mine_admin', level: 'senior', type: 'full_time',
    ...IN, city: 'Keonjhar', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Land Records', 'Government Liaison', 'Documentation', 'Negotiation'],
    description:
      'Handle land records, lease documentation and the day-to-day dealings with the district administration, the mining department and the pollution control board.',
    requirements: [
      'Five or more years in land acquisition or government liaison for an industrial project',
      'Know your way around revenue records and the district office',
    ],
  },
  {
    title: 'Mine HR Officer', department: 'dept_mine_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Joda', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Industrial Relations', 'Contract Labour', 'Compliance', 'Local Recruitment'],
    description:
      'Own people matters at site: contract labour compliance, union and worker committee relations, local recruitment, and the statutory registers a mine must keep.',
    requirements: [
      'MBA or PG diploma in HR or Industrial Relations',
      'Three or more years at an industrial site with contract labour',
      'Working knowledge of the Contract Labour Act and the Mines Act on employment',
    ],
  },
  {
    title: 'Mining Statutory Compliance Officer', department: 'dept_mine_admin', level: 'senior', type: 'full_time',
    ...IN, city: 'Barbil', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Statutory Compliance', 'DGMS', 'IBM Returns', 'Audit'],
    description:
      'Keep every return, permission and renewal current: DGMS filings, IBM monthly and annual returns, consent renewals and the audit trail behind all of it.',
    requirements: [
      'Five or more years in mining regulatory compliance',
      'Have handled a DGMS or IBM inspection as the responsible person',
    ],
  },


  // ══ Koraput belt — bauxite mine, alumina refinery and the towns around them ═
  // Damanjodi, Semiliguda, Sunabeda and Jeypore are working towns hours from the
  // nearest city. Roles here are staffed locally wherever possible, and several
  // deliberately require the local language rather than only English.

  // ── Bauxite mining, Panchpatmali ───────────────────────────────────────────
  {
    title: 'Mine Manager — Bauxite', department: 'dept_mine_ops', level: 'lead', type: 'full_time',
    ...IN, city: 'Panchpatmali', region: 'Odisha', remote: false, salary: [2300000, 3000000],
    skills: ['Mine Management', 'Opencast Mining', 'Statutory Compliance', 'Leadership'],
    description:
      'Hold statutory charge of the bauxite mine on the plateau. The working is opencast on a hilltop, the ore goes down to the refinery by conveyor, and the monsoon here decides half your year.',
    requirements: [
      'First Class Manager\'s Certificate of Competency (Metalliferous)',
      'Twelve or more years in opencast metalliferous mining',
      'Have run a hilltop or plateau working through a full monsoon',
    ],
  },
  {
    title: 'Mining Engineer — Bauxite', department: 'dept_mine_ops', level: 'mid', type: 'full_time',
    ...IN, city: 'Panchpatmali', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Mine Planning', 'Drilling & Blasting', 'Grade Control', 'Surpac'],
    description:
      'Plan and run the daily working on the plateau: bench layout, blast design, deployment, and keeping the feed to the conveyor at the grade the refinery needs.',
    requirements: [
      'B.Tech in Mining Engineering with three or more years at an opencast mine',
      'Willing to live in Damanjodi or Semiliguda',
    ],
  },
  {
    title: 'Mining Mate — Bauxite', department: 'dept_mine_ops', level: 'mid', type: 'full_time',
    ...IN, city: 'Panchpatmali', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Supervision', 'Safety Inspection', 'Odia'],
    description:
      'Supervise a working place on the plateau: the pre-shift inspection, the crew through the shift, and the report at the end of it.',
    requirements: [
      'Mining Mate\'s Certificate of Competency with gas testing and first aid certificates',
      'Three or more years at the face',
      'Fluent in Odia — most of your crew works in it',
    ],
  },
  {
    title: 'Excavator Operator — Bauxite', department: 'dept_mine_ops', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Panchpatmali', region: 'Odisha', remote: false, salary: [15000, 26000],
    skills: ['Excavator Operation', 'HEMM', 'Loading'],
    description:
      'Load at the bauxite face on the plateau, in a place where the cloud comes down and visibility goes with it. Shift transport runs from Damanjodi and Semiliguda.',
    requirements: ['Three or more years operating excavators at a mine', 'Valid HEMM operator certification'],
  },
  {
    title: 'Dumper Driver — Bauxite', department: 'dept_mine_ops', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Panchpatmali', region: 'Odisha', remote: false, salary: [12000, 20000],
    skills: ['Heavy Vehicle Driving', 'Haulage', 'Ghat Driving'],
    description:
      'Haul from the face to the crusher on the plateau. The roads are steep and wet for months of the year, and how you drive them is most of the job.',
    requirements: [
      'Valid heavy vehicle licence with two or more years driving dumpers',
      'Experience on ghat or hill roads',
    ],
  },
  {
    title: 'Mine Helper — Damanjodi', department: 'dept_mine_ops', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [12000, 18000],
    skills: ['Manual Work', 'Safety Awareness', 'Teamwork'],
    description:
      'General work across the mine and conveyor route: assisting operators and fitters, clearing spillage, housekeeping around the working areas. Full training and PPE are provided, and this is how most of our operators here started.',
    requirements: [
      'No formal qualification required',
      'Local candidates from Koraput district are particularly encouraged to apply',
      'Physically fit; statutory vocational training completed before you start',
    ],
  },
  {
    title: 'Conveyor Maintenance Attendant', department: 'dept_mine_ops', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Semiliguda', region: 'Odisha', remote: false, salary: [12000, 18000],
    skills: ['Conveyor Systems', 'Inspection', 'Maintenance Support'],
    description:
      'Patrol and maintain the long conveyor that brings ore down from the plateau: idlers, belt tracking, spillage and the pull-cords. Nothing is cleared while the belt is running.',
    requirements: ['ITI preferred but not required', 'Trained on conveyor safety before starting'],
  },

  // ── Alumina refinery, Damanjodi ────────────────────────────────────────────
  {
    title: 'Refinery Shift Engineer', department: 'dept_mine_proc', level: 'senior', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Process Engineering', 'Bayer Process', 'Shift Operations', 'Troubleshooting'],
    description:
      'Take charge of the refinery on your shift: digestion, clarification, precipitation and calcination running to plan, and the calls when something upsets at three in the morning.',
    requirements: [
      'B.Tech in Chemical or Metallurgical Engineering',
      'Five or more years in an alumina refinery or comparable continuous process plant',
    ],
  },
  {
    title: 'Process Engineer — Alumina', department: 'dept_mine_proc', level: 'mid', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Process Engineering', 'Bayer Process', 'Optimisation', 'Mass Balance'],
    description:
      'Improve recovery and energy use across the Bayer circuit: liquor productivity, caustic consumption, scale management and the test work behind each proposed change.',
    requirements: ['B.Tech in Chemical Engineering with three or more years in alumina or a similar hydrometallurgical plant'],
  },
  {
    title: 'Refinery Process Operator', department: 'dept_mine_proc', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [15000, 26000],
    skills: ['Plant Operation', 'Control Room', 'DCS', 'Monitoring'],
    description:
      'Run a section of the refinery through your shift, from the control room and on the floor. Continuous plant, rotating shifts, and the walk-round that catches a problem before the DCS does.',
    requirements: [
      'ITI or diploma in chemical, mechanical or electrical trade',
      'One or more years in a process plant, or willingness to be trained',
    ],
  },
  {
    title: 'Boiler Operator', department: 'dept_mine_proc', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [15000, 26000],
    skills: ['Boiler Operation', 'Steam Systems', 'Safety'],
    description:
      'Operate and attend the boilers supplying steam to the refinery, to the logs and the routine the Boiler Act requires.',
    requirements: [
      'Valid Boiler Attendant or Boiler Operation Engineer certificate',
      'Three or more years on industrial boilers',
    ],
  },
  {
    title: 'Calcination Plant Supervisor', department: 'dept_mine_proc', level: 'senior', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Plant Supervision', 'Kiln Operation', 'Production', 'Safety'],
    description:
      'Supervise calcination across the shift: kiln or fluid-bed operation, product quality, fuel consumption and the crew running it.',
    requirements: ['Diploma in chemical or mechanical engineering with six or more years in a calcination or kiln plant'],
  },
  {
    title: 'Refinery Laboratory Chemist', department: 'dept_mine_proc', level: 'mid', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Chemical Analysis', 'Titration', 'XRF', 'QA/QC'],
    description:
      'Analyse liquor, hydrate and alumina samples through the shift, and give operations numbers they can act on within the hour.',
    requirements: ['B.Sc in Chemistry with two or more years in an industrial laboratory'],
  },
  {
    title: 'Red Mud & Tailings Supervisor', department: 'dept_mine_hse', level: 'senior', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Tailings Management', 'Environmental Monitoring', 'Dam Safety'],
    description:
      'Own the residue disposal area day to day: deposition, decant, freeboard, seepage monitoring and the inspection record. Get this wrong slowly and it becomes a catastrophe quickly.',
    requirements: [
      'B.Tech in Civil, Mining or Environmental Engineering',
      'Four or more years in tailings or ash-pond management',
      'Rigorous about the daily inspection even when nothing has changed for a year',
    ],
  },

  // ── Maintenance across mine and refinery ───────────────────────────────────
  {
    title: 'Maintenance Engineer — Refinery', department: 'dept_mine_maint', level: 'senior', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Rotating Equipment', 'Preventive Maintenance', 'Shutdown Planning', 'Reliability'],
    description:
      'Own reliability of the refinery\'s rotating and static equipment: pumps, agitators, heat exchangers and the annual shutdown that has to finish on the day it said it would.',
    requirements: ['B.Tech in Mechanical Engineering with five or more years in a continuous process plant'],
  },
  {
    title: 'Mechanical Fitter — Damanjodi', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [16000, 28000],
    skills: ['Fitting', 'Pumps', 'Alignment', 'Maintenance'],
    description:
      'Maintain and repair refinery equipment: pump overhauls, alignments, valve and gland work, and the breakdown jobs that come in mid-shift.',
    requirements: ['ITI in Fitter trade with three or more years in a process plant'],
  },
  {
    title: 'Plant Electrician — Damanjodi', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [16000, 28000],
    skills: ['Electrical Maintenance', 'HT/LT Systems', 'Motors', 'Safety'],
    description:
      'Maintain the refinery\'s electrical systems: substations, HT and LT distribution, motors and starters, and the isolation discipline that keeps the fitters safe.',
    requirements: [
      'ITI in Electrician trade with a valid electrical supervisor licence',
      'Three or more years in industrial electrical maintenance',
    ],
  },
  {
    title: 'Welder — Damanjodi', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [16000, 28000],
    skills: ['Welding', 'Fabrication', 'Pipe Work'],
    description:
      'Weld and fabricate across the refinery and conveyor route: pipe repairs, structural work, chute and liner replacement, much of it in hot and caustic-service areas.',
    requirements: ['ITI in Welder trade with three or more years in a process plant'],
  },
  {
    title: 'HEMM Fitter — Semiliguda', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Semiliguda', region: 'Odisha', remote: false, salary: [16000, 28000],
    skills: ['HEMM Maintenance', 'Hydraulics', 'Diesel Engines'],
    description:
      'Maintain the heavy fleet from the Semiliguda workshop: servicing, component change-outs and the field repairs on the plateau road.',
    requirements: ['ITI in Fitter or Diesel Mechanic trade with three or more years on heavy equipment'],
  },
  {
    title: 'Instrumentation Technician — Damanjodi', department: 'dept_mine_maint', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [16000, 28000],
    skills: ['Instrumentation', 'DCS', 'Calibration', 'Control Loops'],
    description:
      'Keep the refinery\'s instrumentation honest: transmitters, control valves, analysers, loop checks and the calibration records behind every reading operations trusts.',
    requirements: ['Diploma in Instrumentation with three or more years in a process plant'],
  },

  // ── Safety, environment and health ─────────────────────────────────────────
  {
    title: 'Safety Officer — Damanjodi', department: 'dept_mine_hse', level: 'senior', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Industrial Safety', 'Risk Assessment', 'Permit to Work', 'Training'],
    description:
      'Own safety across the refinery and the conveyor corridor: permit to work, confined space and hot work control, incident investigation, and the authority to stop a job that you are expected to use.',
    requirements: [
      'Diploma in Industrial Safety recognised by the state factory inspectorate',
      'Five or more years in a process plant or mine',
    ],
  },
  {
    title: 'Environment Officer — Koraput', department: 'dept_mine_hse', level: 'senior', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Environmental Compliance', 'Monitoring', 'Reclamation', 'Reporting'],
    description:
      'Own environmental compliance across the mine and refinery: ambient monitoring, effluent, the plateau reclamation commitments and the consent conditions the board inspects against.',
    requirements: [
      'M.Sc or M.Tech in Environmental Science or Engineering',
      'Four or more years at a mine or heavy industrial site',
    ],
  },
  {
    title: 'Occupational Health Nurse — Damanjodi', department: 'dept_mine_hse', level: 'mid', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Occupational Health', 'First Aid', 'Emergency Response', 'Odia'],
    description:
      'Run the site health centre across the mine and refinery: periodical examinations, first response, and the health records the regulations require.',
    requirements: [
      'GNM or B.Sc Nursing with valid registration',
      'Two or more years in occupational or emergency care',
      'Odia speaker preferred — most patients are more comfortable in it',
    ],
  },
  {
    title: 'Fire & Emergency Officer', department: 'dept_mine_hse', level: 'mid', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Fire Safety', 'Emergency Response', 'Drills', 'Equipment Maintenance'],
    description:
      'Run fire and emergency response for the site: the tender and crew, hydrant and extinguisher readiness, drills, and the on-site emergency plan we are held to.',
    requirements: ['Sub-Officer course from a recognised fire service college, with three or more years in industrial fire safety'],
  },

  // ── Site administration, logistics and community ───────────────────────────
  {
    title: 'Store Keeper — Damanjodi', department: 'dept_mine_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Stores Management', 'Inventory', 'ERP'],
    description:
      'Run the site stores for mine and refinery: receiving, issue against indent, stock accuracy, and the critical spare that must be on the shelf because the nearest supplier is a day away.',
    requirements: ['Two or more years in industrial stores', 'Comfortable in an ERP'],
  },
  {
    title: 'Weighbridge Operator — Semiliguda', department: 'dept_mine_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Semiliguda', region: 'Odisha', remote: false, salary: [15000, 26000],
    skills: ['Weighbridge Operation', 'Documentation', 'Data Entry'],
    description:
      'Weigh vehicles in and out and issue the slip. The dispatch record, the royalty return and the invoice all start here, so it has to be right and it has to be honest.',
    requirements: ['Twelfth standard pass with basic computer skills', 'Firm with drivers who want a favour'],
  },
  {
    title: 'Dispatch Supervisor — Jeypore', department: 'dept_mine_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Jeypore', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Dispatch', 'Rail Logistics', 'Documentation', 'Coordination'],
    description:
      'Coordinate outbound movement by road and rail from the Jeypore side: rake placement, loading sequence, e-way bills and the transporters waiting at the gate.',
    requirements: ['Three or more years in plant or mine dispatch, ideally including rail rakes'],
  },
  {
    title: 'Light Vehicle Driver — Damanjodi', department: 'dept_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [12000, 20000],
    skills: ['Driving', 'Ghat Roads', 'Vehicle Care'],
    description:
      'Drive staff and visitors between the township, the refinery, Semiliguda and the plateau, on ghat roads in every weather the season brings.',
    requirements: [
      'Valid light and heavy vehicle licence with a clean record',
      'Three or more years driving in this terrain',
      'Know the road in fog and in monsoon',
    ],
  },
  {
    title: 'Bus Driver — Employee Transport', department: 'dept_admin', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Semiliguda', region: 'Odisha', remote: false, salary: [12000, 20000],
    skills: ['Heavy Vehicle Driving', 'Passenger Transport', 'Safety'],
    description:
      'Drive the shift buses between Semiliguda, Damanjodi, Sunabeda and the site gates. You carry a full bus of people up and down a ghat road three times a day.',
    requirements: [
      'Valid heavy passenger vehicle licence with five or more years driving buses',
      'Clean record — this is non-negotiable for passenger transport',
    ],
  },
  {
    title: 'Township Facilities Supervisor', department: 'dept_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Facilities Management', 'Maintenance Coordination', 'Vendor Management'],
    description:
      'Look after the residential township: quarters allocation, water and power complaints, maintenance contractors, and the guest house when visitors come.',
    requirements: ['Three or more years in facilities or estate management'],
  },
  {
    title: 'Site HR Officer — Koraput', department: 'dept_mine_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Industrial Relations', 'Contract Labour', 'Local Recruitment', 'Odia'],
    description:
      'Own people matters across the Koraput operations: contract labour compliance, worker committee relations, local recruitment from the surrounding blocks, and the statutory registers.',
    requirements: [
      'MBA or PG diploma in HR or Industrial Relations',
      'Three or more years at an industrial site with contract labour',
      'Fluent in Odia',
    ],
  },
  {
    title: 'Community Relations Officer — Koraput', department: 'dept_mine_admin', level: 'senior', type: 'full_time',
    ...IN, city: 'Semiliguda', region: 'Odisha', remote: false, salary: [1400000, 2100000],
    skills: ['Community Engagement', 'CSR', 'Odia', 'Tribal Affairs'],
    description:
      'Be our relationship with the villages of Semiliguda, Pottangi and the blocks around the plateau: grievances, local employment, the CSR programme, and the gram sabha meetings where people tell us what we have got wrong.',
    requirements: [
      'Five or more years in community relations or rural development, ideally in a scheduled area',
      'Fluent in Odia; Desia or Kui an advantage',
      'Able to carry bad news in both directions without flinching',
    ],
  },
  {
    title: 'CSR & Skilling Coordinator', department: 'dept_mine_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Koraput', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['CSR', 'Training Coordination', 'Reporting', 'Odia'],
    description:
      'Run the skilling and education programmes in the district: partner ITIs, the trainees coming through them, and the reporting that shows whether any of it led to a job.',
    requirements: ['Three or more years in CSR or skill development programmes', 'Fluent in Odia'],
  },
  {
    title: 'IT Support Executive — Damanjodi', department: 'dept_it_support', level: 'entry', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [300000, 500000],
    skills: ['IT Support', 'Networking', 'Troubleshooting'],
    description:
      'Support the site: office and plant computers, the network across the township and the refinery, and the connectivity that everything else depends on when the nearest engineer is 500 kilometres away.',
    requirements: ['Diploma or degree in IT with one or more years in support', 'Willing to be based at site'],
  },
  {
    title: 'Site Accountant — Koraput', department: 'dept_finance', level: 'mid', type: 'full_time',
    ...IN, city: 'Damanjodi', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Accounting', 'GST', 'Contractor Bills', 'Reconciliation'],
    description:
      'Run site accounts: contractor bill certification, statutory deductions, stores and consumption reconciliation, and the monthly submission to head office.',
    requirements: ['B.Com with three or more years in site or plant accounting'],
  },
  {
    title: 'Security Supervisor — Sunabeda', department: 'dept_admin', level: 'mid', type: 'full_time',
    ...IN, city: 'Sunabeda', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Security Operations', 'Access Control', 'Patrolling', 'Incident Reporting'],
    description:
      'Supervise security at the Sunabeda office and stores: access control, the guard roster across shifts, patrols and the incident log.',
    requirements: ['Three or more years in a security supervisory role; ex-services background welcome'],
  },
  {
    title: 'Field Recruiter — Koraput', department: 'dept_ta', level: 'mid', type: 'full_time',
    ...IN, city: 'Jeypore', region: 'Odisha', remote: false, salary: [700000, 1400000],
    skills: ['Recruitment', 'Local Sourcing', 'Odia', 'Assessment'],
    description:
      'Hire for the Koraput operations from the district itself: ITIs, employment exchanges, village meetings and walk-in drives at Jeypore and Semiliguda. Most of our operators and helpers come through this route.',
    requirements: [
      'Three or more years in blue-collar or industrial recruitment',
      'Fluent in Odia and able to run a walk-in drive alone',
    ],
  },


  // ══ Production crew — the people behind the camera ═════════════════════════
  {
    title: 'Gaffer / Lighting Technician', department: 'dept_media', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [16000, 28000],
    skills: ['Lighting', 'Electrical Safety', 'Rigging', 'Grip Equipment'],
    description:
      'Light the shoot to what the DoP asks for: the plan, the rig, the power and the safety of every stand and cable on the floor. On a small crew you will also be the one telling people where not to walk.',
    requirements: [
      'Three or more years lighting film or video sets',
      'Comfortable with distribution, generators and load calculation',
      'Rig safely under time pressure, because that is when it goes wrong',
    ],
  },
  {
    title: 'Key Grip', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Grip Equipment', 'Rigging', 'Camera Support', 'Safety'],
    description:
      'Own everything the camera sits on and everything that shapes the light: dollies, sliders, jibs, flags and the rigging that has to hold in a wind.',
    requirements: ['Three or more years as a grip on professional sets'],
  },
  {
    title: 'Camera Assistant / Focus Puller', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Focus Pulling', 'Camera Prep', 'Lens Handling'],
    description:
      'Prep and run the camera: build, lenses, focus on the take, cards and batteries. Focus is either invisible or the reason the take is unusable.',
    requirements: ['Two or more years as a first or second AC', 'Meticulous with kit and with the camera report'],
  },
  {
    title: 'Sound Recordist', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Location Sound', 'Boom Operation', 'Mixing', 'Radio Mics'],
    description:
      'Record location sound on shoots that are rarely in quiet places: campuses, offices, plants and mine sites. You will be the one asking for the air conditioning to be switched off.',
    requirements: [
      'Three or more years recording location sound',
      'Own or know mixers, radio mics and boom technique properly',
    ],
  },
  {
    title: 'Digital Imaging Technician', department: 'dept_media', level: 'mid', type: 'full_time', period: 'month',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [16000, 28000],
    skills: ['Data Management', 'Colour', 'On-Set Workflow', 'Backup'],
    description:
      'Own the footage from the moment the card comes out of the camera: offload, checksum, redundant backup, on-set look and the handover to post. Nothing is ever formatted on your watch without two verified copies.',
    requirements: ['Two or more years as a DIT or data wrangler', 'Paranoid about backups, in the way this job requires'],
  },
  {
    title: 'Production Coordinator', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Production Coordination', 'Scheduling', 'Logistics', 'Call Sheets'],
    description:
      'Hold the shoot together off camera: call sheets, permissions, travel, crew, catering and the twenty phone calls a day that mean the shoot happens at all.',
    requirements: ['Two or more years coordinating shoots', 'Unflappable, and good on the phone'],
  },
  {
    title: 'Line Producer', department: 'dept_media', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Budgeting', 'Scheduling', 'Crew Management', 'Negotiation'],
    description:
      'Own the budget and the schedule of every production: what it costs, who is on it, and the honest conversation when the creative ambition and the number do not meet.',
    requirements: ['Six or more years line producing, with budgets you delivered against'],
  },
  {
    title: 'Casting Coordinator', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Casting', 'Coordination', 'Talent Management', 'Contracts'],
    description:
      'Run casting for brand films and campaigns: briefs, auditions, callbacks, releases and rates. We never charge anyone to audition, and part of this job is making sure nobody ever thinks we do.',
    requirements: [
      'Two or more years in casting or talent coordination',
      'Straight with people about outcomes, including a no',
    ],
  },
  {
    title: 'Art Director — Production', department: 'dept_media', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Art Direction', 'Set Design', 'Props', 'Budgeting'],
    description:
      'Design and dress what is in frame: sets, props, locations and the look of a space that has to read as an office, a campus or a site without being any of them.',
    requirements: ['Four or more years in art direction for film or advertising, with a portfolio'],
  },
  {
    title: 'Wardrobe & Styling Assistant', department: 'dept_media', level: 'entry', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [300000, 500000],
    skills: ['Styling', 'Wardrobe', 'Continuity'],
    description:
      'Source, prepare and manage wardrobe on set, including continuity across a two-day shoot and the steamer nobody else remembers to bring.',
    requirements: ['One or more years in styling or wardrobe on shoots'],
  },
  {
    title: 'Makeup & Hair Artist', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Makeup', 'Hair', 'Continuity', 'HD Grooming'],
    description:
      'Do makeup and hair for shoots and live streams, mostly on employees and candidates rather than performers — people who are nervous and have never been on camera.',
    requirements: [
      'Two or more years doing makeup professionally for camera',
      'Work across a full range of skin tones and hair types as a matter of course',
    ],
  },
  {
    title: 'Colourist', department: 'dept_media', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['Colour Grading', 'DaVinci Resolve', 'Colour Management'],
    description:
      'Grade everything we finish, and own the house look and the colour pipeline from camera to delivery.',
    requirements: ['Four or more years grading professionally in Resolve, with a reel'],
  },
  {
    title: 'VFX & Compositing Artist', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['After Effects', 'Nuke', 'Compositing', 'Rotoscoping'],
    description:
      'Clean-ups, screen replacements, tracking and the composites that make a modest shoot look considered. Most of this work should be invisible.',
    requirements: ['Three or more years compositing, with a reel'],
  },
  {
    title: '3D Artist', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Blender', 'Cinema 4D', 'Modelling', 'Rendering'],
    description:
      'Model, light and render the 3D used in product films, explainers and title sequences — including animating things that are hard to film, like a mine site or a data flow.',
    requirements: ['Three or more years in 3D for motion, with a reel'],
  },
  {
    title: 'Storyboard Artist', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Storyboarding', 'Illustration', 'Visual Storytelling'],
    description:
      'Board films before they are shot, so the director, the client and the crew are all arguing about the same thing before anyone hires a camera.',
    requirements: ['Two or more years boarding for film or advertising'],
  },
  {
    title: 'Sound Designer & Composer', department: 'dept_media', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['Sound Design', 'Composition', 'Mixing', 'Music Licensing'],
    description:
      'Score and sound-design our films, and own the music library and its licensing — which we keep clean, because a takedown on a hiring campaign is an expensive kind of embarrassment.',
    requirements: ['Four or more years in sound design or composition for picture, with a reel'],
  },
  {
    title: 'Subtitler & Captioner', department: 'dept_media', level: 'entry', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [300000, 500000],
    skills: ['Subtitling', 'Transcription', 'Timing', 'Indian Languages'],
    description:
      'Caption and subtitle everything we publish, in English and Indian languages. Captions are not optional here — a video without them excludes people from information about work.',
    requirements: [
      'One or more years subtitling professionally',
      'Fluent in English and at least one Indian language',
      'Know why reading speed and line breaks matter',
    ],
  },
  {
    title: 'Teleprompter Operator', department: 'dept_media', level: 'entry', type: 'full_time', period: 'month',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [15000, 26000],
    skills: ['Teleprompter', 'Live Production', 'Script Handling'],
    description:
      'Run prompt for studio shoots and live events, matching the pace of whoever is reading and handling the script changes that arrive two minutes before recording.',
    requirements: ['One or more years operating a prompter', 'Fast, accurate typist'],
  },

  // ══ On camera and voice ════════════════════════════════════════════════════
  // Baalvion never charges a fee to audition, to register, or to be considered — for
  // any role, on camera or otherwise. Anyone asking you for money in our name is not us.
  {
    title: 'Video Presenter / Anchor', department: 'dept_media', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Presenting', 'Scripted Delivery', 'Improvisation', 'Interviewing'],
    description:
      'Front our videos and live streams: explainers, campus sessions, product walkthroughs and interviews. Scripted and unscripted, often with an audience watching live.',
    requirements: [
      'Two or more years presenting on camera, with a showreel',
      'Comfortable in English and Hindi; a third Indian language is an advantage',
      'Can hold a live segment when the plan changes mid-stream',
    ],
  },
  {
    title: 'Actor — Brand Films', department: 'dept_media', level: 'mid', type: 'contract',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [3000, 12000], period: 'day',
    skills: ['Acting', 'Screen Performance', 'Improvisation'],
    description:
      'Perform in brand films, product scenarios and training content. Engaged per shoot day, on a written contract with the rate, usage and duration agreed before you arrive on set. We never charge an audition fee.',
    requirements: [
      'Professional screen acting experience, with a showreel',
      'Comfortable with dialogue in English and Hindi',
      'Available for day shoots in and around Mumbai',
    ],
  },
  {
    title: 'Voice-Over Artist — Indian Languages', department: 'dept_media', level: 'mid', type: 'contract',
    ...IN, city: 'Remote', region: null, remote: true, salary: [3000, 12000], period: 'day',
    skills: ['Voice Acting', 'Narration', 'Home Studio', 'Indian Languages'],
    description:
      'Voice narration for films, explainers and the product\'s spoken content, in Hindi, Odia, Tamil, Telugu, Bengali, Marathi or Kannada. Engaged per session, remote, on a written contract.',
    requirements: [
      'Professional voice work with samples in the languages you offer',
      'A treated home studio capable of broadcast-quality delivery',
      'Native-level fluency in every language you claim',
    ],
  },
  {
    title: 'Event Host / Emcee', department: 'dept_media', level: 'mid', type: 'contract',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [3000, 12000], period: 'day',
    skills: ['Hosting', 'Public Speaking', 'Improvisation', 'Audience Handling'],
    description:
      'Host hiring events, campus drives and conference sessions — keeping a room of a few hundred students engaged through a schedule that will slip.',
    requirements: [
      'Two or more years hosting professionally, with video of you doing it',
      'Comfortable improvising when a speaker does not turn up',
    ],
  },
  {
    title: 'Sign Language Interpreter', department: 'dept_media', level: 'mid', type: 'contract',
    ...IN, city: 'Remote', region: null, remote: true, salary: [3000, 12000], period: 'day',
    skills: ['Indian Sign Language', 'Interpretation', 'Live Events'],
    description:
      'Interpret our live sessions and recorded content into Indian Sign Language. We hire for this because a hiring event that deaf candidates cannot follow is not open to them.',
    requirements: [
      'Certified Indian Sign Language interpreter',
      'Experience interpreting live events or broadcast',
    ],
  },
  {
    title: 'Regional Content Creator — Odia', department: 'dept_social', level: 'mid', type: 'full_time',
    ...IN, city: 'Bhubaneswar', region: 'Odisha', remote: true, salary: [700000, 1400000],
    skills: ['Content Creation', 'Odia', 'Short-Form Video', 'Scripting'],
    description:
      'Make content in Odia for candidates across the state — including the mining and industrial districts, where the roles are and where English-first content simply does not land.',
    requirements: [
      'Native Odia with a body of published work',
      'Can shoot and cut your own vertical video',
    ],
  },
  {
    title: 'Regional Content Creator — Tamil', department: 'dept_social', level: 'mid', type: 'full_time',
    ...IN, city: 'Chennai', region: 'Tamil Nadu', remote: true, salary: [700000, 1400000],
    skills: ['Content Creation', 'Tamil', 'Short-Form Video', 'Scripting'],
    description:
      'Make content in Tamil for candidates across Tamil Nadu — the same job, in the language the audience actually watches in.',
    requirements: ['Native Tamil with published work', 'Can shoot and cut your own vertical video'],
  },
  {
    title: 'Regional Content Creator — Hindi', department: 'dept_social', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Content Creation', 'Hindi', 'Short-Form Video', 'Scripting'],
    description:
      'Make Hindi content for the largest candidate audience we have, across job seekers from every kind of background and level.',
    requirements: ['Native Hindi with published work', 'Can shoot and cut your own vertical video'],
  },
  {
    title: 'Campus Content Ambassador', department: 'dept_social', level: 'entry', type: 'part_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [300000, 500000],
    skills: ['Content Creation', 'Campus Community', 'Social Media'],
    description:
      'Represent us on your own campus: make content about placements and early careers, run small sessions, and tell us honestly what students there actually think of us. Part-time, around your studies.',
    requirements: [
      'Currently enrolled at a college in India',
      'Already making content of some kind — the platform matters less than the habit',
    ],
  },
  {
    title: 'Blog Writer', department: 'dept_mktg', level: 'entry', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [300000, 500000],
    skills: ['Writing', 'Research', 'SEO', 'Editing'],
    description:
      'Write the long-form pieces: hiring guides, salary explainers, city and industry guides. Research-led, and specific enough to be worth the reader\'s time.',
    requirements: ['One or more years writing professionally', 'Published work you will stand behind'],
  },
  {
    title: 'Newsletter Editor', department: 'dept_mktg', level: 'mid', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [700000, 1400000],
    skills: ['Editing', 'Writing', 'Curation', 'Audience Growth'],
    description:
      'Own the hiring newsletter end to end: what goes in, how it reads, and whether anyone opens the next one. It should be worth reading even to someone not hiring this month.',
    requirements: ['Three or more years editing a publication or newsletter with a real audience'],
  },

  // ══ Deep engineering — the senior individual-contributor ladder ════════════
  // The senior individual-contributor track. These sit at the top of Baalvion's ladder
  // (₹23–30 LPA) — the same band as a Director or a Mine Manager, because the company
  // pays the level rather than the job title.
  {
    title: 'Senior Staff Software Engineer', department: 'dept_eng_it', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [2300000, 3000000],
    skills: ['Distributed Systems', 'Architecture', 'Technical Leadership', 'Go'],
    description:
      'Own a technical domain across several teams and set its direction for the next two years. At this level the work is mostly leverage: the design that removes a class of bugs, the interface that lets four teams stop coordinating.',
    requirements: [
      'Twelve or more years, with systems you designed still running at scale',
      'A record of technical decisions whose consequences you saw through',
      'You write the document that ends the argument',
    ],
  },
  {
    title: 'Distinguished Engineer', department: 'dept_eng_it', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [2300000, 3000000],
    skills: ['Systems Architecture', 'Technical Strategy', 'Distributed Systems', 'Mentorship'],
    description:
      'The most senior technical role here. You set the engineering direction of the company alongside the executive team, and you are expected to be personally deep in the hardest problem we have at any given time.',
    requirements: [
      'Twenty or more years at the front of the field',
      'Significant systems, papers or open source that the industry knows',
      'Able to be the dissenting voice in a room that has already decided',
    ],
  },
  {
    title: 'Staff Software Engineer', department: 'dept_eng_it', level: 'lead', type: 'full_time',
    ...US, city: 'Remote', region: null, remote: true, salary: [115000, 150000],
    skills: ['Distributed Systems', 'Architecture', 'Go', 'Kubernetes'],
    description:
      'Lead the design of systems several teams depend on, and stay close enough to the code that your designs survive contact with it.',
    requirements: [
      'Ten or more years building large-scale distributed systems',
      'Have owned something through an outage and the postmortem after it',
    ],
  },
  {
    title: 'Chief Architect', department: 'dept_eng_it', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['Enterprise Architecture', 'Systems Design', 'Strategy', 'Governance'],
    description:
      'Own how the whole platform fits together: service boundaries, data ownership, the multi-tenancy model and the migrations that take three years. Works with the VP Engineering, not under them.',
    requirements: [
      'Eighteen or more years, including architecting a platform through an order-of-magnitude growth',
      'Can hold an architecture together across teams that would each rather do their own thing',
    ],
  },
  {
    title: 'Distributed Systems Engineer', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Distributed Systems', 'Consensus', 'Go', 'Concurrency'],
    description:
      'Work on the parts of the platform where correctness is genuinely hard: consistency across regions, idempotent processing, exactly-once semantics that actually hold up under partition.',
    requirements: [
      'Seven or more years on distributed systems',
      'Comfortable reasoning about failure modes rather than only the happy path',
      'Have read the papers and can say where they do and do not apply',
    ],
  },
  {
    title: 'Performance Engineer', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Performance Engineering', 'Profiling', 'JVM/V8 Internals', 'Benchmarking'],
    description:
      'Find where the platform is slow and prove why: profiling, flame graphs, allocation and query analysis, and the benchmark that stops the regression coming back.',
    requirements: [
      'Six or more years in performance work',
      'You measure before you optimise, and you can show the before and after',
    ],
  },
  {
    title: 'Systems Engineer — Kernel & Runtime', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Linux Internals', 'C', 'eBPF', 'Systems Programming'],
    description:
      'Work below the application layer: container runtime behaviour, kernel-level observability with eBPF, and the resource isolation that stops one tenant\'s load from becoming everyone\'s problem.',
    requirements: [
      'Seven or more years in systems programming',
      'Genuinely comfortable in C and in the kernel documentation',
    ],
  },
  {
    title: 'Compiler & Language Tooling Engineer', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Compilers', 'AST', 'Static Analysis', 'TypeScript'],
    description:
      'Build the tooling that keeps a large codebase workable: codemods, static analysis, custom lint rules and the build performance work that gives every engineer their afternoon back.',
    requirements: [
      'Five or more years in compilers, static analysis or developer tooling',
      'Have shipped a tool other engineers chose to use',
    ],
  },
  {
    title: 'Developer Infrastructure Engineer', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [1400000, 2100000],
    skills: ['CI/CD', 'Build Systems', 'Testing Infrastructure', 'Developer Experience'],
    description:
      'Own the inner loop: build times, test reliability, CI throughput and local environments. Success is measured in how long an engineer waits, and in how often they trust a red build.',
    requirements: ['Six or more years on developer infrastructure or build systems'],
  },
  {
    title: 'Security Research Engineer', department: 'dept_security', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Security Research', 'Reverse Engineering', 'Exploit Analysis', 'Cryptography'],
    description:
      'Research threats specific to a hiring platform: document forgery techniques, account takeover patterns, automated abuse at scale — and build the detections before the attack is common.',
    requirements: [
      'Six or more years in security research',
      'Published work, CVEs or a body of internal research you can describe',
    ],
  },
  {
    title: 'Site Reliability Engineering Manager', department: 'dept_devops', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['SRE Leadership', 'Reliability', 'Incident Management', 'Hiring'],
    description:
      'Lead the SRE team and own reliability as a discipline: error budgets, a humane on-call rotation, the incident review process and the standing to spend engineering time on reliability.',
    requirements: [
      'Twelve or more years in infrastructure, including managing an SRE or platform team',
      'Have built an on-call people did not burn out on',
    ],
  },
  {
    title: 'Principal Data Scientist', department: 'dept_data', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [2300000, 3000000],
    skills: ['Machine Learning', 'Causal Inference', 'Experimentation', 'Python'],
    description:
      'Own the hardest measurement problems: what our matching actually does to outcomes, whether an intervention helped, and how to know when the observational data is lying.',
    requirements: [
      'Twelve or more years in applied data science',
      'Strong on causal inference and experiment design, not only prediction',
    ],
  },
  {
    title: 'Research Engineer — Ranking', department: 'dept_ai', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Learning to Rank', 'Information Retrieval', 'Python', 'Evaluation'],
    description:
      'Own how jobs are ranked for a candidate and candidates for a role — the single most consequential model in the product, and the one where a fairness failure is a person not getting seen.',
    requirements: [
      'Six or more years in ranking or recommendation systems',
      'Rigorous about offline-to-online evaluation and its gaps',
    ],
  },
  {
    title: 'Head of AI', department: 'dept_ai', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['AI Leadership', 'Strategy', 'Research Management', 'Responsible AI'],
    description:
      'Own AI across the company: what we build, what we refuse to build, the team, and the public position we take on automated decisions in hiring — an area regulators are moving on.',
    requirements: [
      'Fifteen or more years across ML research and engineering, including leading a team',
      'A considered, defensible view on automation in hiring decisions',
    ],
  },


  // ══ Trade Finance & Insurance ══════════════════════════════════════════════
  {
    title: 'Trade Credit Insurance Manager', department: 'dept_trade_fin', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Trade Credit Insurance', 'Underwriting', 'Risk Assessment', 'Claims'],
    description:
      'Own the credit insurance that lets a seller ship to a buyer they have never met. You will place and manage cover with underwriters, set the limits we extend against it, and be the person who says no when a counterparty does not stand up.',
    requirements: [
      'Six or more years in trade credit insurance, at an insurer, broker or a corporate credit function',
      'Fluent in policy wordings, non-payment triggers and what actually gets a claim declined',
      'Comfortable telling a commercial team that a deal they want is not insurable',
    ],
  },
  {
    title: 'Marine Cargo Insurance Specialist', department: 'dept_trade_fin', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Marine Insurance', 'Institute Cargo Clauses', 'Claims', 'Survey'],
    description:
      'Place and administer cargo cover across our shipments — open policies, declarations, certificates — and run the claims when a container is short-landed, wet or simply never arrives.',
    requirements: [
      'Three or more years in marine cargo insurance',
      'Know Institute Cargo Clauses A/B/C properly, not just by name',
      'Have handled a general average or a total loss claim end to end',
    ],
  },
  {
    title: 'Trade Finance Manager', department: 'dept_trade_fin', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Letters of Credit', 'UCP 600', 'Bank Guarantees', 'Structured Trade'],
    description:
      'Own the instruments that move money against documents: letters of credit, bank guarantees, standbys and the discounting behind them. Most of the job is making sure a document set will not be rejected on a technicality nobody spotted.',
    requirements: [
      'Seven or more years in trade finance at a bank or a large trading house',
      'Command of UCP 600, ISBP and URDG — you can settle a discrepancy argument from the text',
      'CDCS certification an advantage',
    ],
  },
  {
    title: 'Letters of Credit Specialist', department: 'dept_trade_fin', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Letters of Credit', 'UCP 600', 'Document Checking', 'SWIFT'],
    description:
      'Check document sets against the credit before they go to the bank. A misplaced comma on a bill of lading can hold up payment for weeks, and catching it is the entire value of this role.',
    requirements: [
      'Three or more years checking LC documents',
      'Detail obsessive in the way this work demands',
      'Familiar with MT700 series SWIFT messages',
    ],
  },
  {
    title: 'Trade Credit Underwriter', department: 'dept_trade_fin', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['Underwriting', 'Credit Analysis', 'Financial Statements', 'Country Risk'],
    description:
      'Set the credit limits we extend to buyers: financials, payment behaviour, sector and country risk, and a decision you can defend six months later when it goes wrong.',
    requirements: [
      'Five or more years underwriting credit, ideally cross-border',
      'Can read a set of accounts from an unfamiliar jurisdiction and know what is missing',
    ],
  },
  {
    title: 'Cargo Claims Manager', department: 'dept_trade_fin', level: 'mid', type: 'full_time',
    ...IN, city: 'Nhava Sheva', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Claims Management', 'Surveys', 'Recovery', 'Negotiation'],
    description:
      'Run cargo claims from first notice to recovery: surveyors, carriers, insurers and the subrogation against whoever actually caused the damage.',
    requirements: [
      'Four or more years in cargo or marine claims',
      'Have pursued a recovery against a carrier and know the time bars',
    ],
  },
  {
    title: 'Counterparty Risk Analyst', department: 'dept_trade_fin', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Credit Risk', 'SQL', 'Financial Analysis', 'Modelling'],
    description:
      'Build the view of who we are exposed to and by how much, across buyers, sellers and carriers — the data, the scoring, and the alert before a concentration becomes a problem.',
    requirements: [
      'Three or more years in credit or counterparty risk',
      'Strong SQL — the exposure is in the data before it is in a report',
    ],
  },

  // ══ Payments & Gateway Engineering ═════════════════════════════════════════
  {
    title: 'Payment Gateway Engineer', department: 'dept_payments', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Payments', 'API Integration', 'PCI DSS', 'Node.js'],
    description:
      'Build and run the gateway that moves money across the platform: acquirer and PSP integrations, tokenisation, 3-D Secure, retries and the idempotency that stops a network blip becoming a double charge.',
    requirements: [
      'Five or more years building payment systems in production',
      'Have integrated more than one acquirer or PSP and know how differently they behave',
      'Understand idempotency and reconciliation as design problems, not afterthoughts',
    ],
  },
  {
    title: 'Senior Payments Engineer — Cross-Border', department: 'dept_payments', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Cross-Border Payments', 'SWIFT', 'FX', 'API Design'],
    description:
      'Own cross-border settlement: correspondent rails, SWIFT messaging, FX at the point of quote, and the compliance screening every leg has to pass before value moves.',
    requirements: [
      'Six or more years in payments, including cross-border',
      'Know what an MT103 contains and why a payment gets returned',
      'Realistic about cut-offs, value dates and the days money simply does not move',
    ],
  },
  {
    title: 'Payments Integration Specialist', department: 'dept_payments', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['API Integration', 'Payments', 'Debugging', 'Documentation'],
    description:
      'Take a buyer or seller from signed to transacting: gateway integration, sandbox testing, going live, and the fault-finding when a webhook stops arriving on a Friday evening.',
    requirements: [
      'Three or more years integrating payment APIs for customers',
      'Patient debugger — the problem is usually at the far end and you still have to prove it',
    ],
  },
  {
    title: 'Settlement & Reconciliation Engineer', department: 'dept_payments', level: 'senior', type: 'full_time',
    ...IN, city: 'Remote', region: null, remote: true, salary: [1400000, 2100000],
    skills: ['Reconciliation', 'SQL', 'Ledgers', 'Automation'],
    description:
      'Own the ledger and the daily reconciliation across gateways, banks and our own records. Every break is either a bug or somebody\'s money, and the job is knowing which within the hour.',
    requirements: [
      'Five or more years on financial systems or reconciliation engineering',
      'Double-entry thinking, and a low tolerance for a break that "usually clears itself"',
    ],
  },
  {
    title: 'PCI DSS Compliance Lead', department: 'dept_payments', level: 'lead', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: false, salary: [2300000, 3000000],
    skills: ['PCI DSS', 'Compliance', 'Audit', 'Security'],
    description:
      'Own PCI DSS across the platform: scope, segmentation, evidence, the QSA relationship and the annual assessment we have to pass to keep processing at all.',
    requirements: [
      'Seven or more years in payment security or compliance',
      'Have carried an organisation through a full PCI assessment as the responsible person',
    ],
  },
  {
    title: 'Fraud & Chargeback Analyst', department: 'dept_payments', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Fraud Analysis', 'Chargebacks', 'SQL', 'Rules Engines'],
    description:
      'Watch the transaction flow for what should not be there, tune the rules, and fight the chargebacks worth fighting. Too tight and honest trade stops; too loose and we fund the fraud.',
    requirements: [
      'Three or more years in payment fraud or disputes',
      'Comfortable in SQL and unafraid to argue a representment',
    ],
  },
  {
    title: 'Escrow Operations Manager', department: 'dept_payments', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Escrow', 'Trade Settlement', 'Banking Operations', 'Compliance'],
    description:
      'Run escrow for trades where neither side will move first: the account structure, the release conditions tied to shipping documents, and the disputes when a condition is arguably met.',
    requirements: [
      'Five or more years in escrow, trade settlement or banking operations',
      'Precise about release conditions — this is where the money is actually at risk',
    ],
  },
  {
    title: 'Payments Product Manager', department: 'dept_payments', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Product Management', 'Payments', 'Regulation', 'Pricing'],
    description:
      'Own the payments product: which rails we support, what we charge, how settlement timing works commercially, and the regulatory constraints that decide what is even possible in each market.',
    requirements: [
      'Five or more years in payments product, ideally cross-border or B2B',
      'Know the RBI and equivalent constraints well enough to design within them',
    ],
  },

  // ══ Shipping, Freight & Customs ════════════════════════════════════════════
  {
    title: 'Freight Forwarding Manager', department: 'dept_shipping', level: 'senior', type: 'full_time',
    ...IN, city: 'Nhava Sheva', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Freight Forwarding', 'Ocean Freight', 'Rate Negotiation', 'Carrier Management'],
    description:
      'Own how our cargo moves: carrier and NVOCC relationships, rate negotiation, routing, and the call on which of three bad options to take when a vessel is omitted.',
    requirements: [
      'Six or more years in freight forwarding, with your own carrier relationships',
      'Know the difference a routing decision makes to landed cost, and can explain it to a seller',
    ],
  },
  {
    title: 'Ocean Freight Operations Executive', department: 'dept_shipping', level: 'mid', type: 'full_time',
    ...IN, city: 'Nhava Sheva', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Ocean Freight', 'Booking', 'Documentation', 'Coordination'],
    description:
      'Run bookings end to end: space, containers, cut-offs, gate-in, and chasing the shipping line when the booking confirmation still has not come through and the cut-off is tomorrow.',
    requirements: [
      'Two or more years in ocean freight operations',
      'Calm on the phone with a shipping line that is not calling you back',
    ],
  },
  {
    title: 'Air Freight Coordinator', department: 'dept_shipping', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [700000, 1400000],
    skills: ['Air Freight', 'AWB', 'Dangerous Goods', 'Coordination'],
    description:
      'Move the urgent and the high-value by air: airline bookings, air waybills, build-up, and the special handling that dangerous or temperature-controlled cargo needs.',
    requirements: [
      'Two or more years in air freight',
      'IATA dangerous goods certification an advantage',
    ],
  },
  {
    title: 'Shipping Documentation Executive', department: 'dept_shipping', level: 'entry', type: 'full_time',
    ...IN, city: 'Gandhidham', region: 'Gujarat', remote: false, salary: [300000, 500000],
    skills: ['Shipping Documents', 'Bill of Lading', 'Data Entry', 'Attention to Detail'],
    description:
      'Prepare and check the documents a shipment cannot move without: bills of lading, packing lists, invoices, certificates of origin. One wrong container number holds a consignment at the port.',
    requirements: [
      'One or more years in shipping documentation, or a commerce degree and real care with detail',
      'Fast, accurate typing — most of the errors in this work are typing errors',
    ],
  },
  {
    title: 'Customs Broker / Clearing Agent', department: 'dept_shipping', level: 'senior', type: 'full_time',
    ...IN, city: 'Nhava Sheva', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Customs Clearance', 'ICEGATE', 'HS Classification', 'Duty Assessment'],
    description:
      'Clear our consignments through customs: bills of entry and shipping bills on ICEGATE, classification, duty, examination and the queries that hold a container in the yard accruing demurrage.',
    requirements: [
      'Customs Broker licence, or five or more years working under one',
      'Fluent in HS classification and confident defending it to an appraiser',
    ],
  },
  {
    title: 'EXIM Documentation Specialist', department: 'dept_shipping', level: 'mid', type: 'full_time',
    ...IN, city: 'Mundra', region: 'Gujarat', remote: false, salary: [700000, 1400000],
    skills: ['EXIM', 'DGFT', 'Export Incentives', 'Compliance'],
    description:
      'Own export and import documentation and the incentive schemes attached to it: IEC, licences, RoDTEP and drawback claims, and the DGFT filings behind each.',
    requirements: [
      'Three or more years in EXIM documentation',
      'Know the current scheme rules rather than last year\'s',
    ],
  },
  {
    title: 'Port Operations Executive', department: 'dept_shipping', level: 'mid', type: 'full_time',
    ...IN, city: 'Mundra', region: 'Gujarat', remote: false, salary: [700000, 1400000],
    skills: ['Port Operations', 'CFS', 'Yard Management', 'Coordination'],
    description:
      'Be our presence at the port: CFS coordination, stuffing and de-stuffing supervision, examination attendance and getting a container released the same day rather than the next.',
    requirements: ['Two or more years working at a port or container freight station'],
  },
  {
    title: 'Chartering Manager', department: 'dept_shipping', level: 'lead', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [2300000, 3000000],
    skills: ['Chartering', 'Voyage Estimation', 'Charter Parties', 'Laytime'],
    description:
      'Fix vessels for bulk cargo: voyage estimates, negotiation through brokers, charter party terms, and the laytime and demurrage calculations that decide whether a voyage made money.',
    requirements: [
      'Eight or more years in dry bulk chartering',
      'Can build a voyage estimate that survives contact with the actual voyage',
      'Command of standard charter party forms and laytime rules',
    ],
  },
  {
    title: 'Vessel Operations Manager', department: 'dept_shipping', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Vessel Operations', 'Port Agency', 'Bunkers', 'Statement of Facts'],
    description:
      'Run vessels once fixed: agents, bunkers, port calls, the statement of facts and the laytime that follows from it. You are the one awake when a vessel berths at three in the morning.',
    requirements: ['Five or more years in vessel operations at an owner, operator or charterer'],
  },
  {
    title: 'Container Fleet Coordinator', department: 'dept_shipping', level: 'mid', type: 'full_time',
    ...IN, city: 'Gandhidham', region: 'Gujarat', remote: false, salary: [700000, 1400000],
    skills: ['Container Management', 'Repositioning', 'Detention', 'Tracking'],
    description:
      'Know where every container is and what it is costing us: availability, repositioning, detention and demurrage exposure, and the return that should have happened last week.',
    requirements: ['Two or more years in container or equipment control'],
  },
  {
    title: 'Trade Compliance Officer — Sanctions', department: 'dept_shipping', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['Sanctions Screening', 'AML', 'Dual-Use Goods', 'Compliance'],
    description:
      'Keep our trade lawful across jurisdictions: sanctions and denied-party screening, dual-use classification, end-use checks, and stopping a shipment when the answer is not clean.',
    requirements: [
      'Five or more years in trade compliance or sanctions',
      'Current on OFAC, EU and UN regimes and how they interact',
      'Willing to stop a shipment that commercial very much wants to move',
    ],
  },

  // ══ Trade Operations & Documentation ═══════════════════════════════════════
  {
    title: 'Trade Operations Manager', department: 'dept_trade_ops', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: false, salary: [1400000, 2100000],
    skills: ['Trade Operations', 'Order Management', 'Process Design', 'Team Leadership'],
    description:
      'Own a trade from purchase order to final settlement: documents, shipment, payment and the exceptions that need a person. You will lead the team doing it and design the process they follow.',
    requirements: [
      'Six or more years in trade or export operations, including managing a team',
      'Have seen enough go wrong to build a process that assumes it will',
    ],
  },
  {
    title: 'Purchase Order Management Executive', department: 'dept_trade_ops', level: 'entry', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [300000, 500000],
    skills: ['Order Management', 'ERP', 'Coordination', 'Documentation'],
    description:
      'Keep orders moving: raise and track POs, confirm acknowledgements, chase readiness dates, and flag the delay before the buyer discovers it themselves.',
    requirements: ['One or more years in order management or trade support'],
  },
  {
    title: 'Supplier Onboarding Specialist', department: 'dept_trade_ops', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Vendor Onboarding', 'KYB', 'Due Diligence', 'Documentation'],
    description:
      'Take a new supplier from introduction to transacting: company verification, ownership, certifications, bank details and the checks that stop us paying a fraudster in a real supplier\'s name.',
    requirements: [
      'Three or more years in vendor onboarding or KYB',
      'Sceptical about documents that arrive slightly too easily',
    ],
  },
  {
    title: 'Pre-Shipment Quality Inspector', department: 'dept_trade_ops', level: 'mid', type: 'full_time',
    ...IN, city: 'Mundra', region: 'Gujarat', remote: false, salary: [700000, 1400000],
    skills: ['Quality Inspection', 'Sampling', 'Reporting', 'Standards'],
    description:
      'Inspect goods before they ship: sampling to plan, specification checks, photographs and a report the buyer can rely on. You are the reason a container is opened here rather than argued about there.',
    requirements: [
      'Three or more years in third-party or in-house pre-shipment inspection',
      'Willing to fail a lot that the factory insists is fine',
    ],
  },

  // ══ Marketplace & Buyer-Seller Platform ════════════════════════════════════
  {
    title: 'Marketplace Product Manager', department: 'dept_marketplace', level: 'senior', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [1400000, 2100000],
    skills: ['Marketplace Product', 'Two-Sided Markets', 'Analytics', 'Strategy'],
    description:
      'Own the buyer-seller platform: discovery, quoting, negotiation, order and the trust mechanisms that let two strangers in different countries transact. Two-sided, so every change helps one side and costs the other.',
    requirements: [
      'Five or more years of marketplace or B2B platform product',
      'Have worked on liquidity and matching, not only features',
    ],
  },
  {
    title: 'Seller Onboarding Manager', department: 'dept_marketplace', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Onboarding', 'Account Management', 'KYB', 'Training'],
    description:
      'Get sellers live and trading: verification, catalogue setup, pricing, and enough training that the first order does not go wrong.',
    requirements: ['Three or more years onboarding sellers or vendors onto a platform'],
  },
  {
    title: 'Buyer Success Manager', department: 'dept_marketplace', level: 'mid', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [700000, 1400000],
    skills: ['Account Management', 'Sourcing', 'Negotiation', 'Retention'],
    description:
      'Own a book of buyers: understand what they source, find them the right sellers, and be the first call when a shipment is late or a quality dispute opens.',
    requirements: ['Four or more years in account management, ideally in trade or sourcing'],
  },
  {
    title: 'Catalogue Operations Lead', department: 'dept_marketplace', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Catalogue Management', 'Taxonomy', 'Data Quality', 'HS Codes'],
    description:
      'Own the product catalogue: taxonomy, attributes, HS code mapping and the data quality that decides whether a buyer can find anything at all.',
    requirements: [
      'Three or more years in catalogue or master data management',
      'Genuinely enjoy taxonomy, because that is most of this',
    ],
  },
  {
    title: 'Marketplace Trust & Verification Manager', department: 'dept_marketplace', level: 'senior', type: 'full_time',
    ...IN, city: 'Mumbai', region: 'Maharashtra', remote: true, salary: [1400000, 2100000],
    skills: ['KYB', 'Fraud Prevention', 'Verification', 'Policy'],
    description:
      'Decide who is allowed to trade here: business verification, ownership checks, document authenticity and the pattern-spotting that catches a seller who has been shut down under another name.',
    requirements: [
      'Five or more years in KYB, onboarding risk or platform trust',
      'Have caught something a checklist would have passed',
    ],
  },
  {
    title: 'Commercial Pricing Analyst', department: 'dept_marketplace', level: 'mid', type: 'full_time',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [700000, 1400000],
    skills: ['Pricing', 'Analysis', 'SQL', 'Commercial Strategy'],
    description:
      'Work out what we charge and what it does to volume: take rates, financing spreads, FX margin, and the honest answer about which lines actually make money.',
    requirements: ['Three or more years in pricing or commercial analysis', 'Strong SQL and stronger scepticism'],
  },


  // ══ Canada ═════════════════════════════════════════════════════════════════
  // Overseas bands are in each country's own currency, on the same four-step ladder as
  // the Indian roles — entry, mid, senior, lead — at values that make sense in that
  // market rather than a straight rupee conversion.
  {
    title: 'Senior Software Engineer', department: 'dept_eng_it', level: 'senior', type: 'full_time',
    countryId: 'country_ca', currency: 'CAD', city: 'Toronto', region: 'Ontario', remote: true, salary: [78000, 105000],
    skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
    description:
      'Own services in the hiring platform from our Toronto team, working closely with the engineering group in Bengaluru across a large time difference. Written communication carries more weight here than it would in a co-located team.',
    requirements: [
      'Six or more years building production backend systems',
      'Comfortable working asynchronously with a team eleven hours ahead',
      'Eligible to work in Canada',
    ],
  },
  {
    title: 'Customer Success Manager — North America', department: 'dept_support', level: 'mid', type: 'full_time',
    countryId: 'country_ca', currency: 'CAD', city: 'Toronto', region: 'Ontario', remote: true, salary: [52000, 78000],
    skills: ['Customer Success', 'Onboarding', 'Retention', 'B2B SaaS'],
    description:
      'Own a book of North American employer accounts: get them live, keep them successful, and know before they do when something is going wrong.',
    requirements: ['Four or more years in customer success at a B2B software company', 'Eligible to work in Canada'],
  },
  {
    title: 'Business Operations Manager — Americas', department: 'dept_ops', level: 'senior', type: 'full_time',
    countryId: 'country_ca', currency: 'CAD', city: 'Toronto', region: 'Ontario', remote: false, salary: [78000, 105000],
    skills: ['Operations', 'Process Design', 'Analytics', 'Vendor Management'],
    description:
      'Run the operational side of the Americas business — the processes, the vendors, and the reporting the region is managed on.',
    requirements: ['Six or more years in business operations', 'Eligible to work in Canada'],
  },

  // ══ Poland ═════════════════════════════════════════════════════════════════
  {
    title: 'Backend Engineer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    countryId: 'country_pl', currency: 'PLN', city: 'Kraków', region: 'Lesser Poland', remote: true, salary: [108000, 168000],
    skills: ['Node.js', 'PostgreSQL', 'Docker', 'API Design'],
    description:
      'Build and run backend services from our Kraków engineering team — applications, interviews, offers and the queues behind them.',
    requirements: [
      'Four or more years on backend systems',
      'Working English; Polish is useful but not required',
      'Eligible to work in Poland',
    ],
  },
  {
    title: 'DevOps Engineer', department: 'dept_devops', level: 'senior', type: 'full_time',
    countryId: 'country_pl', currency: 'PLN', city: 'Warsaw', region: 'Mazovia', remote: true, salary: [168000, 228000],
    skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD'],
    description:
      'Own the European side of our infrastructure: deployment, observability, and the data-residency constraints that come with operating in the EU.',
    requirements: ['Five or more years running containerised workloads in production', 'Eligible to work in Poland'],
  },
  {
    title: 'Data Engineer', department: 'dept_data', level: 'mid', type: 'full_time',
    countryId: 'country_pl', currency: 'PLN', city: 'Kraków', region: 'Lesser Poland', remote: true, salary: [108000, 168000],
    skills: ['Python', 'SQL', 'Airflow', 'dbt'],
    description:
      'Build the pipelines behind hiring analytics, and be the person who can say whether a number is trustworthy.',
    requirements: ['Three or more years building batch pipelines', 'Eligible to work in Poland'],
  },
  {
    title: 'Financial Analyst — EMEA', department: 'dept_finance', level: 'mid', type: 'full_time',
    countryId: 'country_pl', currency: 'PLN', city: 'Warsaw', region: 'Mazovia', remote: false, salary: [108000, 168000],
    skills: ['Financial Analysis', 'Excel', 'Reporting', 'Forecasting'],
    description:
      'Own planning and reporting for the European entities, including the statutory reporting each jurisdiction requires.',
    requirements: ['Three or more years in FP&A', 'Eligible to work in Poland'],
  },

  // ══ Australia ══════════════════════════════════════════════════════════════
  {
    title: 'Account Executive — APAC', department: 'dept_sales', level: 'senior', type: 'full_time',
    countryId: 'country_au', currency: 'AUD', city: 'Sydney', region: 'New South Wales', remote: false, salary: [92000, 118000],
    skills: ['Enterprise Sales', 'B2B SaaS', 'Negotiation', 'Pipeline Management'],
    description:
      'Own new business across Australia and New Zealand, selling to talent leaders who have been sold to a great deal.',
    requirements: [
      'Five or more years closing B2B software, with a number you carried and hit',
      'Eligible to work in Australia',
    ],
  },
  {
    title: 'Customer Success Manager — APAC', department: 'dept_support', level: 'mid', type: 'full_time',
    countryId: 'country_au', currency: 'AUD', city: 'Melbourne', region: 'Victoria', remote: true, salary: [68000, 92000],
    skills: ['Customer Success', 'Onboarding', 'Account Management'],
    description:
      'Look after employer accounts across the region, from onboarding through to renewal.',
    requirements: ['Four or more years in customer success', 'Eligible to work in Australia'],
  },
  {
    title: 'Operations Manager — APAC', department: 'dept_ops', level: 'senior', type: 'full_time',
    countryId: 'country_au', currency: 'AUD', city: 'Sydney', region: 'New South Wales', remote: false, salary: [92000, 118000],
    skills: ['Operations Management', 'Process', 'Compliance', 'Team Leadership'],
    description:
      'Run regional operations across Australia and New Zealand, including the employment compliance each market requires.',
    requirements: ['Six or more years in operations, including managing a team', 'Eligible to work in Australia'],
  },

  // ══ Vietnam ════════════════════════════════════════════════════════════════
  {
    title: 'Software Engineer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    countryId: 'country_vn', currency: 'VND', city: 'Ho Chi Minh City', region: 'Ho Chi Minh', remote: true, salary: [216000000, 360000000],
    skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
    description:
      'Build product features from our Ho Chi Minh City team, working across the stack on the candidate and recruiter surfaces.',
    requirements: [
      'Three or more years building web applications',
      'Working English for written communication with the wider team',
      'Eligible to work in Vietnam',
    ],
  },
  {
    title: 'QA Automation Engineer', department: 'dept_qa', level: 'mid', type: 'full_time',
    countryId: 'country_vn', currency: 'VND', city: 'Ho Chi Minh City', region: 'Ho Chi Minh', remote: true, salary: [216000000, 360000000],
    skills: ['Playwright', 'TypeScript', 'Test Design', 'CI/CD'],
    description:
      'Own the end-to-end suite across the candidate and recruiter journeys, and keep it fast enough that people trust a red build.',
    requirements: ['Three or more years automating browser tests', 'Eligible to work in Vietnam'],
  },
  {
    title: 'Technical Support Engineer — APAC', department: 'dept_support', level: 'mid', type: 'full_time',
    countryId: 'country_vn', currency: 'VND', city: 'Da Nang', region: 'Da Nang', remote: true, salary: [216000000, 360000000],
    skills: ['Troubleshooting', 'SQL', 'APIs', 'Customer Communication'],
    description:
      'Handle the escalations that need someone who can read a log and reproduce a bug, covering the APAC working day.',
    requirements: ['Two or more years in technical support', 'Eligible to work in Vietnam'],
  },

  // ══ Philippines ════════════════════════════════════════════════════════════
  {
    title: 'Support Specialist', department: 'dept_support', level: 'entry', type: 'full_time',
    countryId: 'country_ph', currency: 'PHP', city: 'Manila', region: 'Metro Manila', remote: false, salary: [240000, 340000],
    skills: ['Customer Support', 'Communication', 'Empathy', 'Ticketing'],
    description:
      'First response for candidates and recruiters across the region. Most of what you deal with is someone anxious about an application, so how you write matters more than how fast you type.',
    requirements: [
      'Clear, kind written English',
      'No prior support experience required — the product is taught',
      'Eligible to work in the Philippines',
    ],
  },
  {
    title: 'Support Team Lead', department: 'dept_support', level: 'senior', type: 'full_time',
    countryId: 'country_ph', currency: 'PHP', city: 'Manila', region: 'Metro Manila', remote: false, salary: [660000, 900000],
    skills: ['Team Leadership', 'Support Operations', 'Coaching', 'Quality'],
    description:
      'Lead a support shift: the queue, the quality bar, coaching, and the escalations that need a decision rather than a reply.',
    requirements: ['Four or more years in support including leading a team', 'Eligible to work in the Philippines'],
  },
  {
    title: 'Implementation Consultant — APAC', department: 'dept_impl', level: 'mid', type: 'full_time',
    countryId: 'country_ph', currency: 'PHP', city: 'Cebu', region: 'Cebu', remote: true, salary: [420000, 660000],
    skills: ['Onboarding', 'Data Migration', 'Project Management', 'Training'],
    description:
      'Take a new employer from signature to live: configuration, data migration, training and the first month of hand-holding.',
    requirements: ['Three or more years implementing B2B software', 'Eligible to work in the Philippines'],
  },
  {
    title: 'Accounts Payable Specialist', department: 'dept_finance', level: 'entry', type: 'full_time',
    countryId: 'country_ph', currency: 'PHP', city: 'Manila', region: 'Metro Manila', remote: false, salary: [240000, 340000],
    skills: ['Accounts Payable', 'Reconciliation', 'ERP'],
    description:
      'Process supplier invoices for the group, match them to purchase orders and get them paid on time.',
    requirements: ['One or more years in accounts payable', 'Eligible to work in the Philippines'],
  },

  // ══ Ukraine ════════════════════════════════════════════════════════════════
  {
    title: 'Frontend Engineer', department: 'dept_eng_it', level: 'mid', type: 'full_time',
    countryId: 'country_ua', currency: 'UAH', city: 'Lviv', region: 'Lviv', remote: true, salary: [420000, 680000],
    skills: ['React', 'TypeScript', 'CSS', 'Accessibility'],
    description:
      'Build the candidate-facing surfaces from our Lviv team — the job board, the application flow and the dashboard people track their applications from.',
    requirements: [
      'Three or more years building production React',
      'Working English',
      'Eligible to work in Ukraine',
    ],
  },
  {
    title: 'Product Designer', department: 'dept_design', level: 'mid', type: 'full_time',
    countryId: 'country_ua', currency: 'UAH', city: 'Kyiv', region: 'Kyiv', remote: true, salary: [420000, 680000],
    skills: ['Figma', 'Product Design', 'Prototyping', 'Interaction Design'],
    description:
      'Design the flows people move through under pressure. Clarity matters more than novelty on this product.',
    requirements: ['Three or more years in product design, with a portfolio', 'Eligible to work in Ukraine'],
  },
  {
    title: 'Applied Research Engineer', department: 'dept_rd', level: 'senior', type: 'full_time',
    countryId: 'country_ua', currency: 'UAH', city: 'Kyiv', region: 'Kyiv', remote: true, salary: [680000, 950000],
    skills: ['Machine Learning', 'Python', 'Research', 'Evaluation'],
    description:
      'Take promising approaches in matching and language understanding from paper to something that survives production traffic.',
    requirements: ['Five or more years applying research to shipped products', 'Eligible to work in Ukraine'],
  },

  // ══ United Arab Emirates — trade corridor ══════════════════════════════════
  {
    title: 'Trade Finance Manager — MENA', department: 'dept_trade_fin', level: 'senior', type: 'full_time',
    countryId: 'country_ae', currency: 'AED', city: 'Dubai', region: 'Dubai', remote: false, salary: [156000, 216000],
    skills: ['Letters of Credit', 'UCP 600', 'Structured Trade', 'Islamic Finance'],
    description:
      'Own trade finance across the MENA corridor from Dubai: letters of credit, guarantees, and the structures regional banks and counterparties actually use.',
    requirements: [
      'Seven or more years in trade finance, with Gulf market experience',
      'Familiar with Islamic trade finance structures',
      'Eligible to work in the UAE',
    ],
  },
  {
    title: 'Freight Forwarding Manager — Jebel Ali', department: 'dept_shipping', level: 'senior', type: 'full_time',
    countryId: 'country_ae', currency: 'AED', city: 'Jebel Ali', region: 'Dubai', remote: false, salary: [156000, 216000],
    skills: ['Freight Forwarding', 'Transhipment', 'Free Zone', 'Carrier Management'],
    description:
      'Run our Jebel Ali operation: transhipment, free zone movement, carrier relationships and the re-export flows the corridor exists for.',
    requirements: [
      'Six or more years in freight forwarding with Jebel Ali or comparable hub experience',
      'Eligible to work in the UAE',
    ],
  },
  {
    title: 'Regional Trade Operations Manager', department: 'dept_trade_ops', level: 'senior', type: 'full_time',
    countryId: 'country_ae', currency: 'AED', city: 'Dubai', region: 'Dubai', remote: false, salary: [156000, 216000],
    skills: ['Trade Operations', 'Documentation', 'Team Leadership', 'Compliance'],
    description:
      'Own trades through the Gulf corridor end to end, and lead the operations team handling them.',
    requirements: ['Six or more years in trade operations', 'Eligible to work in the UAE'],
  },

  // ══ Singapore — trade and payments corridor ════════════════════════════════
  {
    title: 'Payments Engineer — APAC', department: 'dept_payments', level: 'senior', type: 'full_time',
    countryId: 'country_sg', currency: 'SGD', city: 'Singapore', region: 'Singapore', remote: true, salary: [76000, 100000],
    skills: ['Payments', 'Cross-Border', 'API Design', 'Compliance'],
    description:
      'Own the APAC payment rails: local schemes, cross-border settlement, and the regulatory constraints each market places on how money moves.',
    requirements: [
      'Five or more years building payment systems',
      'Familiar with MAS requirements and regional payment schemes',
      'Eligible to work in Singapore',
    ],
  },
  {
    title: 'Trade Credit Underwriter — APAC', department: 'dept_trade_fin', level: 'senior', type: 'full_time',
    countryId: 'country_sg', currency: 'SGD', city: 'Singapore', region: 'Singapore', remote: false, salary: [76000, 100000],
    skills: ['Underwriting', 'Credit Analysis', 'Country Risk', 'Trade Finance'],
    description:
      'Set credit limits across Asian counterparties: financials, payment behaviour, sector and country risk, and a decision you can defend later.',
    requirements: [
      'Six or more years underwriting trade credit in Asian markets',
      'Eligible to work in Singapore',
    ],
  },

  // ══ Netherlands — European trade gateway ═══════════════════════════════════
  {
    title: 'European Logistics Manager', department: 'dept_shipping', level: 'senior', type: 'full_time',
    countryId: 'country_nl', currency: 'EUR', city: 'Rotterdam', region: 'South Holland', remote: false, salary: [56000, 74000],
    skills: ['Logistics', 'Customs', 'EU Trade', 'Carrier Management'],
    description:
      'Run European inbound and distribution from Rotterdam: carriers, customs into the EU, bonded movement and onward delivery across the union.',
    requirements: [
      'Six or more years in European logistics, with EU customs experience',
      'Eligible to work in the Netherlands',
    ],
  },
  {
    title: 'EU Customs Compliance Specialist', department: 'dept_shipping', level: 'mid', type: 'full_time',
    countryId: 'country_nl', currency: 'EUR', city: 'Rotterdam', region: 'South Holland', remote: true, salary: [40000, 56000],
    skills: ['EU Customs', 'AEO', 'Tariff Classification', 'Compliance'],
    description:
      'Own EU customs compliance: classification, origin, AEO obligations and the declarations behind every consignment entering the union.',
    requirements: [
      'Four or more years in EU customs compliance',
      'Eligible to work in the Netherlands',
    ],
  },

  // ══ Internships ════════════════════════════════════════════════════════════
  {
    title: 'Software Engineering Intern', department: 'dept_eng_it', level: 'entry', type: 'internship', period: 'month',
    ...IN, city: 'Remote', region: null, remote: true, salary: [15000, 25000],
    skills: ['JavaScript', 'React', 'Node.js'],
    description:
      'Six months on a product team shipping real features to real users, with a mentor and a review cycle. Strong interns are offered full-time roles.',
    requirements: ['Final-year student or recent graduate', 'Something you have built that you can talk about'],
  },
  {
    title: 'Data Science Intern', department: 'dept_data', level: 'entry', type: 'internship', period: 'month',
    ...IN, city: 'Bengaluru', region: 'Karnataka', remote: true, salary: [15000, 25000],
    skills: ['Python', 'Statistics', 'Machine Learning'],
    description:
      'Six months with the data team on matching and analytics, working on a question that matters rather than a toy dataset.',
    requirements: ['Final-year student or recent graduate in a quantitative field'],
  },
];

// What the job involves comes from roleResponsibilities.js, keyed by title, so the
// catalogue stays readable and the same role opening in two cities describes the same
// work. A title without an entry simply posts without that section rather than getting
// a generic one — an honest short page beats a padded one.
const RESPONSIBILITIES = require('./roleResponsibilities');
const REQUIREMENTS = require('./roleRequirements');

module.exports = ROLES.map((role) => {
    const extra = REQUIREMENTS[role.title];
    return {
        ...role,
        responsibilities: RESPONSIBILITIES[role.title] || [],
        // The catalogue's own `requirements` are the headline two or three — the things
        // that decide whether to apply at all — so they lead, and the fuller skills list
        // follows without repeating them.
        requirements: dedupe([...(role.requirements || []), ...((extra && extra.required) || [])]),
        preferred: (extra && extra.preferred) || [],
    };
});

// Two lists written separately will occasionally say the same thing twice.
function dedupe(items) {
    const seen = new Set();
    return items.filter((item) => {
        const key = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
