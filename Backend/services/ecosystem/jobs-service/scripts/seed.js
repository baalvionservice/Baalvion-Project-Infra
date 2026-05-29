'use strict';
/**
 * Demo data seeder for the Baalvion Jobs Service (TalentOS).
 *
 *   node scripts/seed.js
 *
 * Idempotent: truncates the `jobs` schema (demo-only) and re-inserts a coherent,
 * interconnected dataset. All org-scoped rows are created under SEED_ORG_ID so the
 * demo admin user (jobs-admin@baalvion.test) sees them in the admin ATS.
 *
 * Env:
 *   SEED_ORG_ID  — org UUID to scope data under (default = demo admin's org)
 *   SEED_USER_ID — bigint user id used for created_by / interviewer_id (default 56)
 */
require('dotenv').config();
const db = require('../models');

const ORG_ID = process.env.SEED_ORG_ID || '9d421643-e0fa-42c4-abe9-34509a64387a';
const USER_ID = Number(process.env.SEED_USER_ID || 56);

const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const daysAhead = (n) => new Date(Date.now() + n * 864e5);
const pick = (arr, i) => arr[i % arr.length];

async function seed() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS jobs');
  await db.sequelize.sync({ alter: false });

  console.log('[seed] Truncating jobs schema…');
  await db.sequelize.query(
    `TRUNCATE jobs.interviews, jobs.applications, jobs.job_skills, jobs.candidates,
              jobs.job_listings, jobs.skills, jobs.placements, jobs.students,
              jobs.colleges, jobs.job_stages, jobs.offers, jobs.system_users,
              jobs.organizations, jobs.payments, jobs.notifications, jobs.documents,
              jobs.notes, jobs.audit_logs, jobs.milestones, jobs.projects
     RESTART IDENTITY CASCADE`,
  );

  // ── Skills ──────────────────────────────────────────────────────────────────
  const skillNames = [
    ['React', 'Frontend'], ['TypeScript', 'Frontend'], ['Node.js', 'Backend'],
    ['PostgreSQL', 'Database'], ['Python', 'Backend'], ['AWS', 'Cloud'],
    ['Docker', 'DevOps'], ['Kubernetes', 'DevOps'], ['GraphQL', 'Backend'],
    ['Figma', 'Design'], ['Product Strategy', 'Product'], ['Go', 'Backend'],
    ['Machine Learning', 'Data'], ['SQL', 'Database'], ['Java', 'Backend'],
    ['Communication', 'Soft Skills'], ['Leadership', 'Soft Skills'], ['Next.js', 'Frontend'],
  ];
  const skills = await db.Skill.bulkCreate(
    skillNames.map(([name, category]) => ({ name, category })),
    { returning: true },
  );
  const skillId = (name) => skills.find((s) => s.name === name)?.id;
  console.log(`[seed] ${skills.length} skills`);

  // ── Job listings ──────────────────────────────────────────────────────────────
  const jobDefs = [
    {
      title: 'Senior Full-Stack Engineer', location: 'Bengaluru, India', job_type: 'full_time',
      experience_level: 'senior', salary_min: 2800000, salary_max: 4200000, remote_allowed: true,
      status: 'published', description: 'Build and scale the Baalvion TalentOS platform end-to-end.',
      requirements: '6+ years building production web apps. Strong React + Node.js.',
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    },
    {
      title: 'Product Designer', location: 'Remote', job_type: 'full_time',
      experience_level: 'mid', salary_min: 1800000, salary_max: 2600000, remote_allowed: true,
      status: 'published', description: 'Own the end-to-end design of recruiter and candidate experiences.',
      requirements: '4+ years product design. Strong portfolio.', skills: ['Figma', 'Communication'],
    },
    {
      title: 'DevOps Engineer', location: 'Hyderabad, India', job_type: 'full_time',
      experience_level: 'senior', salary_min: 2500000, salary_max: 3800000, remote_allowed: false,
      status: 'published', description: 'Run our Kubernetes platform and CI/CD pipelines.',
      requirements: 'Deep AWS + Kubernetes experience.', skills: ['AWS', 'Docker', 'Kubernetes'],
    },
    {
      title: 'Backend Engineer (Go)', location: 'Pune, India', job_type: 'full_time',
      experience_level: 'mid', salary_min: 2000000, salary_max: 3200000, remote_allowed: true,
      status: 'published', description: 'Design high-throughput services for the matching engine.',
      requirements: '3+ years backend. Go or strong systems background.', skills: ['Go', 'PostgreSQL', 'GraphQL'],
    },
    {
      title: 'Data Scientist', location: 'Bengaluru, India', job_type: 'full_time',
      experience_level: 'senior', salary_min: 3000000, salary_max: 4500000, remote_allowed: true,
      status: 'published', description: 'Build the AI candidate-matching and scoring models.',
      requirements: 'Strong ML fundamentals + Python.', skills: ['Python', 'Machine Learning', 'SQL'],
    },
    {
      title: 'Frontend Engineering Intern', location: 'Remote', job_type: 'internship',
      experience_level: 'entry', salary_min: 40000, salary_max: 60000, remote_allowed: true,
      status: 'published', description: 'Work alongside our frontend team for a 6-month internship.',
      requirements: 'Final-year CS students. React basics.', skills: ['React', 'Next.js'],
    },
    {
      title: 'Engineering Manager', location: 'Bengaluru, India', job_type: 'full_time',
      experience_level: 'lead', salary_min: 5000000, salary_max: 7000000, remote_allowed: false,
      status: 'published', description: 'Lead a team of 8 engineers across platform squads.',
      requirements: '8+ years, 2+ managing teams.', skills: ['Leadership', 'Communication'],
    },
    {
      title: 'QA Automation Engineer (Contract)', location: 'Remote', job_type: 'contract',
      experience_level: 'mid', salary_min: 1500000, salary_max: 2200000, remote_allowed: true,
      status: 'draft', description: '6-month contract to build the E2E test suite.',
      requirements: 'Playwright/Cypress experience.', skills: ['TypeScript'],
    },
  ];

  const jobs = [];
  for (const def of jobDefs) {
    const { skills: jobSkills, ...jobData } = def;
    const job = await db.JobListing.create({
      ...jobData,
      org_id: ORG_ID,
      created_by: USER_ID,
      country_id: 'country_in',
      department_id: 'dept_eng_it',
      currency: 'INR',
      salary_currency: 'INR',
      published_at: jobData.status === 'published' ? daysAgo(20) : null,
      deadline: daysAhead(30),
      views_count: Math.floor(Math.random() * 400) + 50,
    });
    const sk = skills.filter((s) => jobSkills.includes(s.name));
    await job.setSkills(sk);
    jobs.push(job);
  }
  console.log(`[seed] ${jobs.length} job listings`);

  // ── Candidates ──────────────────────────────────────────────────────────────
  const candidateDefs = [
    ['Aarav Sharma', 'aarav.sharma@example.com', 'Bengaluru, India', 7, ['React', 'TypeScript', 'Node.js'], 'linkedin'],
    ['Diya Patel', 'diya.patel@example.com', 'Remote', 5, ['Figma', 'Communication'], 'direct'],
    ['Rohan Mehta', 'rohan.mehta@example.com', 'Hyderabad, India', 8, ['AWS', 'Kubernetes', 'Docker'], 'referral'],
    ['Ananya Iyer', 'ananya.iyer@example.com', 'Pune, India', 4, ['Go', 'PostgreSQL'], 'job_board'],
    ['Vivaan Reddy', 'vivaan.reddy@example.com', 'Bengaluru, India', 6, ['Python', 'Machine Learning'], 'linkedin'],
    ['Ishita Nair', 'ishita.nair@example.com', 'Remote', 2, ['React', 'Next.js'], 'direct'],
    ['Kabir Singh', 'kabir.singh@example.com', 'Bengaluru, India', 10, ['Leadership', 'Communication'], 'referral'],
    ['Saanvi Gupta', 'saanvi.gupta@example.com', 'Chennai, India', 3, ['TypeScript', 'React'], 'job_board'],
    ['Arjun Kumar', 'arjun.kumar@example.com', 'Mumbai, India', 9, ['Node.js', 'GraphQL', 'PostgreSQL'], 'linkedin'],
    ['Myra Joshi', 'myra.joshi@example.com', 'Remote', 5, ['Python', 'SQL'], 'direct'],
    ['Aditya Rao', 'aditya.rao@example.com', 'Hyderabad, India', 6, ['Java', 'AWS'], 'referral'],
    ['Kiara Menon', 'kiara.menon@example.com', 'Bengaluru, India', 4, ['Figma', 'Product Strategy'], 'job_board'],
  ];
  const candidates = await db.Candidate.bulkCreate(
    candidateDefs.map(([full_name, email, location, yoe, sk, source], i) => ({
      org_id: ORG_ID, full_name, email,
      phone: `+9198${String(10000000 + i * 137).slice(0, 8)}`,
      location, years_of_experience: yoe, skills: sk, source, status: 'active',
      headline: `${sk[0]} specialist`,
      linkedin_url: `https://linkedin.com/in/${full_name.toLowerCase().replace(/\s+/g, '-')}`,
    })),
    { returning: true },
  );
  console.log(`[seed] ${candidates.length} candidates`);

  // ── Applications ──────────────────────────────────────────────────────────────
  const statuses = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
  const publishedJobs = jobs.filter((j) => j.status === 'published');
  const applications = [];
  let ci = 0;
  for (const job of publishedJobs) {
    // 3 applicants per published job, spread across stages
    for (let k = 0; k < 3; k++) {
      const cand = pick(candidates, ci++);
      const status = pick(statuses, ci + k);
      const app = await db.Application.create({
        job_id: job.id, candidate_id: cand.id, org_id: ORG_ID, status,
        source: cand.source,
        expected_salary: (job.salary_max || 2000000) - 100000,
        current_salary: (job.salary_min || 1500000) - 200000,
        notice_period_days: pick([30, 60, 90], k),
        score: Math.floor(Math.random() * 40) + 60,
        cover_letter: `I am excited to apply for ${job.title}.`,
        hired_at: status === 'hired' ? daysAgo(3) : null,
        offered_salary: ['offer', 'hired'].includes(status) ? job.salary_max : null,
      });
      await job.increment('applications_count');
      applications.push({ app, job, cand, status });
    }
  }
  console.log(`[seed] ${applications.length} applications`);

  // ── Interviews ──────────────────────────────────────────────────────────────
  let interviewCount = 0;
  for (const { app, status } of applications) {
    if (!['interview', 'offer', 'hired'].includes(status)) continue;
    const completed = ['offer', 'hired'].includes(status);
    await db.Interview.create({
      application_id: app.id, org_id: ORG_ID, interviewer_id: USER_ID,
      scheduled_at: completed ? daysAgo(5) : daysAhead(3),
      duration_minutes: 60, type: pick(['video', 'technical', 'phone'], interviewCount),
      status: completed ? 'completed' : 'scheduled',
      meeting_url: 'https://meet.baalvion.com/' + Math.random().toString(36).slice(2, 9),
      feedback: completed ? 'Strong technical depth and good communication.' : null,
      rating: completed ? pick([4, 5, 3], interviewCount) : null,
      recommendation: completed ? pick(['yes', 'strong_yes', 'neutral'], interviewCount) : null,
    }).catch((e) => { /* meeting_url column may not exist */ if (!/meeting_url/.test(e.message)) throw e; });
    interviewCount++;
  }
  console.log(`[seed] ${interviewCount} interviews`);

  // ── Job stages (default pipeline) ─────────────────────────────────────────────
  const stageDefs = [
    ['Applied', '#6366f1', 0], ['Screening', '#0ea5e9', 1], ['Interview', '#f59e0b', 2],
    ['Offer', '#10b981', 3], ['Hired', '#22c55e', 4], ['Rejected', '#ef4444', 5],
  ];
  await db.JobStage.bulkCreate(
    stageDefs.map(([name, color, order_index]) => ({
      org_id: ORG_ID, name, color, order_index, is_default: order_index === 0,
    })),
  );
  console.log(`[seed] ${stageDefs.length} job stages`);

  // ── Colleges ──────────────────────────────────────────────────────────────────
  const collegeDefs = [
    ['IIT Bombay', 'Mumbai', 'Maharashtra', 'A++'],
    ['NIT Trichy', 'Tiruchirappalli', 'Tamil Nadu', 'A+'],
    ['BITS Pilani', 'Pilani', 'Rajasthan', 'A++'],
    ['VIT Vellore', 'Vellore', 'Tamil Nadu', 'A'],
    ['IIIT Hyderabad', 'Hyderabad', 'Telangana', 'A+'],
  ];
  const colleges = await db.College.bulkCreate(
    collegeDefs.map(([name, city, state, accreditation], i) => ({
      name, city, state, country: 'India', accreditation,
      website: `https://${name.toLowerCase().replace(/\s+/g, '')}.ac.in`,
      contact_email: `placements@${name.toLowerCase().replace(/\s+/g, '')}.ac.in`,
      contact_phone: `+9180${String(20000000 + i * 311).slice(0, 8)}`,
      is_active: true,
    })),
    { returning: true },
  );
  console.log(`[seed] ${colleges.length} colleges`);

  // ── Students ──────────────────────────────────────────────────────────────────
  const courses = ['B.Tech CSE', 'B.Tech ECE', 'B.Tech IT', 'MCA', 'M.Tech CSE'];
  const firstNames = ['Aarush', 'Anvi', 'Reyansh', 'Aadhya', 'Vihaan', 'Pari', 'Shaurya', 'Anika', 'Atharv', 'Navya', 'Dhruv', 'Sara', 'Krish', 'Ira', 'Veer'];
  const students = await db.Student.bulkCreate(
    firstNames.map((fn, i) => {
      const college = pick(colleges, i);
      const placed = i % 3 === 0;
      return {
        college_id: college.id, name: `${fn} ${pick(['Verma', 'Shah', 'Das', 'Pillai'], i)}`,
        email: `${fn.toLowerCase()}.${i}@student.example.com`,
        phone: `+9197${String(30000000 + i * 271).slice(0, 8)}`,
        course: pick(courses, i), degree: 'Bachelor', graduation_year: 2025 + (i % 2),
        cgpa: (7 + (i % 30) / 10).toFixed(2),
        is_placed: placed, status: i % 4 === 0 ? 'pending' : 'approved',
        ai_score: (60 + (i * 7) % 40).toFixed(2), verified: i % 2 === 0,
        company: placed ? pick(['Baalvion', 'Acme Corp', 'Globex'], i) : null,
        role: placed ? 'Software Engineer' : null,
        skills: pick([['React', 'Node'], ['Python', 'ML'], ['Java', 'AWS']], i),
      };
    }),
    { returning: true },
  );
  console.log(`[seed] ${students.length} students`);

  // ── Placements ──────────────────────────────────────────────────────────────
  const placedStudents = students.filter((s) => s.is_placed);
  const placements = await db.Placement.bulkCreate(
    placedStudents.map((s, i) => ({
      student_id: s.id, college_id: s.college_id,
      company_name: s.company || 'Baalvion', role: s.role || 'Software Engineer',
      package_lpa: (8 + i * 1.5).toFixed(2),
      joining_date: daysAhead(60 + i * 5).toISOString().slice(0, 10),
      approved: i % 2 === 0, verified_by_admin_id: i % 2 === 0 ? USER_ID : null,
    })),
    { returning: true },
  );
  console.log(`[seed] ${placements.length} placements`);

  // ── Organization ──────────────────────────────────────────────────────────────
  await db.Organization.create({ id: ORG_ID, name: 'Baalvion TalentOS', slug: 'baalvion-talentos', plan: 'ENTERPRISE' });
  console.log('[seed] 1 organization');

  // ── System users (ATS team) ───────────────────────────────────────────────────
  // NOTE: the first two emails MUST be real auth-service login accounts — portal role
  // resolution keys staff off these emails. (jobs-admin + jobs-recruiter are created in auth.)
  const teamDefs = [
    ['Jobs Admin', 'jobs-admin@baalvion.test', 'SUPER_ADMIN'],
    ['Jobs Recruiter', 'jobs-recruiter@baalvion.test', 'RECRUITER'],
    ['Neha Kapoor', 'neha.hm@baalvion.com', 'ADMIN'],
    ['Sameer Khan', 'sameer.interviewer@baalvion.com', 'INTERVIEWER'],
    ['Anita Desai', 'anita.finance@baalvion.com', 'FINANCE'],
  ];
  const team = await db.SystemUser.bulkCreate(
    teamDefs.map(([name, email, role], i) => ({
      org_id: ORG_ID, name, email, role, auth_user_id: i === 0 ? USER_ID : null,
      phone: `+9180${String(40000000 + i * 191).slice(0, 8)}`,
    })),
    { returning: true },
  );
  console.log(`[seed] ${team.length} system users`);

  // ── Offers (for offer/hired applications) ──────────────────────────────────────
  const offerApps = applications.filter((a) => ['offer', 'hired'].includes(a.status));
  let offerCount = 0;
  for (const { app, job, status } of offerApps) {
    await db.Offer.create({
      org_id: ORG_ID, application_id: app.id, candidate_id: app.candidate_id,
      base_salary: job.salary_max || 2500000, equity_value: 500000, bonus: 200000, currency: 'INR',
      status: status === 'hired' ? 'ACCEPTED' : 'SENT',
      valid_until: daysAhead(14).toISOString().slice(0, 10), created_by: USER_ID,
      approvals: [{ approverId: String(USER_ID), approverName: 'Priya Sharma', status: 'Approved', timestamp: daysAgo(2) }],
    });
    offerCount++;
  }
  console.log(`[seed] ${offerCount} offers`);

  // ── Payments ──────────────────────────────────────────────────────────────────
  const payments = await db.Payment.bulkCreate(
    candidates.slice(0, 5).map((c, i) => ({
      org_id: ORG_ID, candidate_id: c.id, candidate_name: c.full_name,
      amount: (1500 + i * 700).toFixed(2), currency: pick(['USD', 'EUR', 'INR'], i),
      method: pick(['SWIFT', 'PAYPAL', 'STRIPE', 'BANK'], i),
      status: pick(['PENDING_APPROVAL', 'APPROVED', 'PAID'], i),
      payment_date: daysAgo(i * 4).toISOString().slice(0, 10),
      reference: `PAY-${1000 + i}`,
    })),
    { returning: true },
  );
  console.log(`[seed] ${payments.length} payments`);

  // ── Notifications ──────────────────────────────────────────────────────────────
  const notifDefs = [
    ['New Candidate Applied', 'Aarav Sharma applied for Senior Full-Stack Engineer.', 'INFO', '/candidates/1'],
    ['Interview Feedback Submitted', 'Feedback submitted for a technical interview.', 'SUCCESS', '/interviews/1'],
    ['Offer Accepted', 'A candidate accepted their offer.', 'SUCCESS', '/offers'],
    ['Document Pending Review', 'A candidate uploaded a document for verification.', 'WARNING', '/documents'],
    ['Interview Scheduled', 'An interview was scheduled for tomorrow.', 'INFO', '/interviews'],
  ];
  const notifications = await db.Notification.bulkCreate(
    Array.from({ length: 12 }).map((_, i) => {
      const [title, message, type, link] = pick(notifDefs, i);
      return { org_id: ORG_ID, title, message, type, link, read: i > 4, user_id: USER_ID };
    }),
    { returning: true },
  );
  console.log(`[seed] ${notifications.length} notifications`);

  // ── Documents ──────────────────────────────────────────────────────────────────
  const docTypes = ['RESUME', 'ID_PROOF', 'DEGREE_CERTIFICATE', 'OFFER_LETTER', 'EXPERIENCE_LETTER'];
  const documents = await db.Document.bulkCreate(
    candidates.slice(0, 8).flatMap((c, i) => ([
      {
        org_id: ORG_ID, candidate_id: c.id, document_type: pick(docTypes, i),
        file_name: `${c.full_name.replace(/\s+/g, '_')}_resume.pdf`,
        file_url: `https://files.baalvion.com/docs/${c.id}/resume.pdf`,
        country: 'India', status: pick(['PENDING', 'VERIFIED', 'REJECTED'], i),
        uploaded_by: USER_ID,
      },
    ])),
    { returning: true },
  );
  console.log(`[seed] ${documents.length} documents`);

  // ── Notes ──────────────────────────────────────────────────────────────────────
  const noteContents = [
    'Strong initial screening call — great communication.',
    'Technical assessment was excellent. Deep React knowledge.',
    'Salary expectations align with the band.',
    'Available to start within 30 days.',
  ];
  const notes = await db.Note.bulkCreate(
    candidates.slice(0, 6).map((c, i) => ({
      org_id: ORG_ID, candidate_id: c.id, content: pick(noteContents, i),
      author_id: USER_ID, author_name: pick(team, i).name,
    })),
    { returning: true },
  );
  console.log(`[seed] ${notes.length} notes`);

  // ── Audit logs ──────────────────────────────────────────────────────────────────
  const auditDefs = [
    ['candidate.created', 'Candidate', 'Created a new candidate profile'],
    ['application.status_changed', 'Application', 'Moved application to interview'],
    ['offer.sent', 'Offer', 'Sent an offer to a candidate'],
    ['interview.scheduled', 'Interview', 'Scheduled a technical interview'],
    ['document.verified', 'Document', 'Verified a candidate document'],
    ['user.login', 'Session', 'User signed in'],
  ];
  const auditLogs = await db.AuditLog.bulkCreate(
    Array.from({ length: 15 }).map((_, i) => {
      const [action, entity_type, desc] = pick(auditDefs, i);
      return {
        org_id: ORG_ID, actor_id: USER_ID, actor_name: pick(team, i).name,
        action, entity_type, entity_id: String(i + 1), details: { description: desc }, ip: '127.0.0.1',
      };
    }),
    { returning: true },
  );
  console.log(`[seed] ${auditLogs.length} audit logs`);

  // ── Projects + milestones (contractor/client dashboards) ───────────────────────
  const projectDefs = [
    { title: 'AI Resume Parser', category: 'AI/ML', status: 'ACTIVE', skills: ['Python', 'Machine Learning'], budget: 1000000, client: 'client-1', contractor: 'contractor-1' },
    { title: 'Campus Placement Portal', category: 'Web', status: 'OPEN', skills: ['React', 'Node.js'], budget: 800000, client: 'client-2', contractor: null },
    { title: 'Job Matching Engine', category: 'AI/ML', status: 'ACTIVE', skills: ['Go', 'PostgreSQL'], budget: 1500000, client: 'client-1', contractor: 'contractor-2' },
    { title: 'Recruiter Mobile App', category: 'Mobile', status: 'COMPLETED', skills: ['React Native'], budget: 1200000, client: 'client-3', contractor: 'contractor-1' },
  ];
  let msCount = 0;
  for (const def of projectDefs) {
    const proj = await db.Project.create({
      org_id: ORG_ID, title: def.title, description: `${def.title} — built for the Baalvion talent ecosystem.`,
      category: def.category, status: def.status, required_skills: def.skills, budget: def.budget,
      currency: 'INR', country: 'Global', owner: 'Baalvion Labs',
      client_id: def.client, contractor_id: def.contractor,
      start_date: daysAgo(40).toISOString().slice(0, 10), end_date: daysAhead(50).toISOString().slice(0, 10),
      max_team_size: 5, roles: [],
    });
    const milestoneNames = ['Discovery & Design', 'MVP Build', 'Testing & QA', 'Launch'];
    for (let m = 0; m < milestoneNames.length; m++) {
      await db.Milestone.create({
        org_id: ORG_ID, project_id: proj.id, title: milestoneNames[m],
        description: `${milestoneNames[m]} phase`,
        status: pick(['completed', 'in_progress', 'pending', 'pending'], m),
        amount: Math.round(def.budget / 4), due_date: daysAhead(10 + m * 14).toISOString().slice(0, 10), order_index: m,
      });
      msCount++;
    }
  }
  console.log(`[seed] ${projectDefs.length} projects, ${msCount} milestones`);

  console.log('\n[seed] ✅ Done. Org:', ORG_ID);
  await db.sequelize.close();
}

seed().catch((err) => {
  console.error('[seed] FAILED:', err);
  process.exit(1);
});
