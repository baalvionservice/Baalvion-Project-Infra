'use strict';
/**
 * Live demo seed — makes the app show REAL data end-to-end.
 *
 * 1. Ensures 3 real auth users exist (candidate/company/admin) via the gateway,
 *    capturing their real identity id (BIGINT) + orgId (UUID).
 * 2. Seeds a coherent ctm dataset tied to those ids:
 *    - primary company.id = company-user's orgId (so the frontend's companyId === orgId works)
 *    - candidate/company/admin user_profiles with the correct APP role
 *    - extra companies + candidates + tasks + submissions + evaluations + subs/invoices/templates/badges
 *      so leaderboards, directories and admin lists are populated.
 *
 * Idempotent: upserts by deterministic ids. Run:  node seed-demo.js
 */
const crypto = require('crypto');
const db = require('./models');

const GW = process.env.SEED_GATEWAY_URL || 'http://127.0.0.1:3099';
const PASSWORD = process.env.SEED_PASSWORD || 'Demo2026!ctm';

const LOGINS = {
  candidate: { email: 'candidate@ctm.live', fullName: 'Casey Candidate' },
  company:   { email: 'company@ctm.live',   fullName: 'Bree Founder', orgName: 'Acme Talent Co' },
  admin:     { email: 'admin@ctm.live',     fullName: 'Admin User' },
};

async function ensureAuthUser({ email, fullName, orgName }) {
  try {
    let res = await fetch(`${GW}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD, fullName, orgName }),
    });
    let j = await res.json().catch(() => ({}));
    if (res.ok && j.user) return j.user;
    // already exists (or rate-limited) → log in to fetch id + orgId
    res = await fetch(`${GW}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD }),
    });
    j = await res.json().catch(() => ({}));
    if (res.ok && j.user) return j.user;
    console.warn(`[seed] auth ensure failed for ${email}: ${j.error?.code || res.status}`);
    return null;
  } catch (e) {
    console.warn(`[seed] auth gateway unreachable for ${email}: ${e.message}`);
    return null;
  }
}

// Deterministic UUIDs so re-runs upsert instead of duplicating.
const uuid = (seed) => {
  const h = crypto.createHash('sha1').update('ctm-demo:' + seed).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;
};

const upsert = async (model, where, data) => {
  const [row, created] = await model.findOrCreate({ where, defaults: data });
  if (!created) { Object.assign(row, data); await row.save(); }
  return row;
};

const SKILLS = [['React','TypeScript','Next.js'],['Node.js','PostgreSQL','Docker'],['Figma','UI/UX','Prototyping'],['Python','Pandas','ML'],['SEO','Content','Analytics'],['Go','Kubernetes','gRPC']];
const LOCS = ['San Francisco, CA','Berlin, DE','Bangalore, IN','London, UK','Toronto, CA','Remote'];
const LEVELS = ['Beginner','Intermediate','Advanced','Expert'];

async function run() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS ctm');
  await db.sequelize.sync({ alter: false });

  // ── 1. Real auth users ────────────────────────────────────────────────────
  const cand = await ensureAuthUser(LOGINS.candidate);
  const comp = await ensureAuthUser(LOGINS.company);
  const adm  = await ensureAuthUser(LOGINS.admin);
  console.log('[seed] auth users:',
    { candidate: cand && cand.id, company: comp && comp.id, companyOrg: comp && comp.orgId, admin: adm && adm.id });

  const candId = cand ? Number(cand.id) : 700001;
  const compId = comp ? Number(comp.id) : 700002;
  const admId  = adm  ? Number(adm.id)  : 700009;
  // Primary company id MUST equal the company user's auth orgId so the frontend
  // (companyId = orgId) resolves it. Fall back to a deterministic UUID.
  const primaryCompanyId = (comp && comp.orgId) ? comp.orgId : uuid('primary-company');

  const plans = await db.plans.findAll({ raw: true });
  const planByName = (n) => plans.find(p => p.name.toLowerCase() === n.toLowerCase()) || plans[0];
  const badges = await db.badges.findAll({ raw: true });

  // ── 2. Companies ───────────────────────────────────────────────────────────
  const extraCompanies = [
    { key: 'nova',   name: 'Nova Systems',   owner: 700101, tier: 'enterprise', industry: 'Technology' },
    { key: 'pixel',  name: 'Pixel Forge',    owner: 700102, tier: 'pro',        industry: 'Design' },
    { key: 'datacore', name: 'DataCore Labs', owner: 700103, tier: 'starter',   industry: 'Data' },
  ];
  const primary = await upsert(db.companies, { id: primaryCompanyId }, {
    id: primaryCompanyId, owner_user_id: compId, name: 'Acme Talent Co',
    slug: 'acme-talent-co', description: 'Hiring top builders through real-world challenges.',
    website: 'https://acme.example.com', tier: 'pro', status: 'active',
  });
  const companies = [primary];
  for (const c of extraCompanies) {
    const id = uuid('company:' + c.key);
    companies.push(await upsert(db.companies, { id }, {
      id, owner_user_id: c.owner, name: c.name, slug: c.key + '-co',
      description: `${c.name} — building the future of ${c.industry}.`,
      website: `https://${c.key}.example.com`, tier: c.tier, status: 'active',
    }));
  }

  // ── 3. User profiles (3 real + extra candidates) ───────────────────────────
  await upsert(db.user_profiles, { user_id: candId }, {
    user_id: candId, name: LOGINS.candidate.fullName, email: LOGINS.candidate.email, role: 'candidate',
    bio: 'Full-stack engineer who loves shipping polished products.', location: 'San Francisco, CA',
    experience_level: 'Advanced', skills: ['React','TypeScript','Node.js','PostgreSQL'],
    github_url: 'https://github.com/casey', linkedin_url: 'https://linkedin.com/in/casey',
    is_active: true, is_verified: true, consent_accepted: true, candidate_onboarding_completed: true,
  });
  await upsert(db.user_profiles, { user_id: compId }, {
    user_id: compId, name: LOGINS.company.fullName, email: LOGINS.company.email, role: 'company',
    company_id: primaryCompanyId, is_active: true, is_verified: true, onboarding_completed: true,
  });
  await upsert(db.user_profiles, { user_id: admId }, {
    user_id: admId, name: LOGINS.admin.fullName, email: LOGINS.admin.email, role: 'admin',
    is_active: true, is_verified: true,
  });

  const candidateIds = [candId];
  const names = ['Alex Rivera','Sam Okoye','Priya Nair','Liam Chen','Maya Sato','Noah Kim','Ava Müller','Diego Santos','Zoe Park','Omar Hassan'];
  for (let i = 0; i < names.length; i++) {
    const uid = 700200 + i;
    candidateIds.push(uid);
    await upsert(db.user_profiles, { user_id: uid }, {
      user_id: uid, name: names[i], email: `cand${i+1}@demo.ctm`, role: 'candidate',
      bio: `${names[i].split(' ')[0]} is a passionate builder.`, location: LOCS[i % LOCS.length],
      experience_level: LEVELS[i % LEVELS.length], skills: SKILLS[i % SKILLS.length],
      github_url: `https://github.com/${names[i].split(' ')[0].toLowerCase()}`,
      is_active: true, is_verified: i % 3 === 0,
    });
  }

  // ── 4. Tasks ───────────────────────────────────────────────────────────────
  const taskDefs = [
    { t: 'Build a Responsive Navbar Component', d: 'medium', stack: ['React','CSS'], tags: ['Engineering','Frontend'] },
    { t: 'Design a Mobile Onboarding Flow', d: 'medium', stack: ['Figma'], tags: ['Design','UI/UX'] },
    { t: 'REST API with Node + Postgres', d: 'hard', stack: ['Node.js','PostgreSQL'], tags: ['Engineering','Backend'] },
    { t: 'Churn Prediction Model', d: 'hard', stack: ['Python','ML'], tags: ['Data'] },
    { t: 'SEO Content Strategy (1 month)', d: 'easy', stack: ['SEO'], tags: ['Marketing'] },
    { t: 'Containerize a Web App', d: 'medium', stack: ['Docker'], tags: ['Engineering','DevOps'] },
    { t: 'Landing Page High-Fi Mockup', d: 'easy', stack: ['Figma'], tags: ['Design'] },
    { t: 'Go-to-Market Strategy Deck', d: 'medium', stack: [], tags: ['Business'] },
    { t: 'Fix a Memory Leak (Node.js)', d: 'expert', stack: ['Node.js'], tags: ['Engineering','Bug Fix'] },
    { t: 'SQL Analytics Queries', d: 'medium', stack: ['SQL'], tags: ['Data'] },
  ];
  const tasks = [];
  for (let i = 0; i < taskDefs.length; i++) {
    const td = taskDefs[i];
    const co = companies[i % companies.length];
    const id = uuid('task:' + i);
    tasks.push(await upsert(db.tasks, { id }, {
      id, company_id: co.id, created_by: co.owner_user_id, title: td.t,
      description: `${td.t}. Complete the brief and submit your best work.`,
      requirements: 'Follow the brief. Clean, documented, working solution.',
      tech_stack: td.stack, difficulty: td.d, status: 'open',
      reward: [0,250,500,1000][i % 4], currency: 'USD',
      deadline: new Date(Date.now() + (7 + i) * 86400000),
      tags: td.tags, metadata: { roleCategory: td.tags[0] },
    }));
  }

  // ── 5. Submissions + evaluations (drive leaderboard) ───────────────────────
  const STATUSES = ['under_review', 'accepted', 'rejected', 'pending'];
  let subCount = 0, evalCount = 0;
  for (let i = 0; i < candidateIds.length; i++) {
    const uid = candidateIds[i];
    // each candidate submits to 2–3 tasks
    const n = 2 + (i % 2);
    for (let k = 0; k < n; k++) {
      const task = tasks[(i + k) % tasks.length];
      const id = uuid(`sub:${uid}:${task.id}`);
      const scored = k < n - 1; // most are scored
      const score = scored ? 60 + ((i * 7 + k * 13) % 40) : null;
      const status = scored ? (score >= 80 ? 'accepted' : 'under_review') : 'pending';
      await upsert(db.submissions, { id }, {
        id, task_id: task.id, user_id: uid,
        code_url: 'https://github.com/demo/solution-' + (subCount + 1),
        description: 'My submission for ' + task.title,
        status, score, feedback: scored ? 'Solid work overall.' : null,
        submitted_at: new Date(Date.now() - (i * 3 + k) * 86400000),
      });
      subCount++;
      if (scored) {
        const evId = uuid(`eval:${id}`);
        await upsert(db.evaluations, { id: evId }, {
          id: evId, submission_id: id, evaluator_id: task.created_by, score,
          feedback: score >= 80 ? 'Excellent, shortlisted.' : 'Good attempt, some gaps.',
          criteria: { correctness: Math.round(score/10), code_quality: Math.round(score/12) },
          is_final: true,
        });
        evalCount++;
      }
    }
  }

  // ── 6. Subscriptions, invoices, templates, notifications, badges ───────────
  const now = new Date();
  for (const co of companies) {
    const plan = planByName(co.tier === 'enterprise' ? 'Enterprise' : co.tier === 'pro' ? 'Pro' : 'Free');
    await upsert(db.subscriptions, { id: uuid('sub:' + co.id) }, {
      id: uuid('sub:' + co.id), company_id: co.id, plan_id: plan.id, status: 'active',
      billing_cycle: 'annual', current_period_start: now,
      current_period_end: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      amount: plan.annual_price || plan.monthly_price * 10, currency: 'USD',
    });
  }
  await upsert(db.invoices, { id: uuid('inv:primary:1') }, {
    id: uuid('inv:primary:1'), company_id: primaryCompanyId, plan_name: 'Pro',
    amount: 790, subtotal: 790, tax: 0, currency: 'USD', status: 'Paid',
    issued_at: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    due_date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
    line_items: [{ id: 'li1', description: 'Pro plan — annual', quantity: 1, unitPrice: 790, total: 790 }],
  });
  await upsert(db.task_templates, { id: uuid('tpl:1') }, {
    id: uuid('tpl:1'), company_id: primaryCompanyId, created_by: compId,
    title: 'Frontend Component Challenge', description: 'Reusable template for frontend screens.',
    role_category: 'Engineering', difficulty: 'medium', task_types: ['Coding','Component'],
    instructions: 'Build the described component.', expected_outputs: 'A working, documented component.',
  });
  for (const [uid, title, type] of [[compId,'New submission received','new_submission'],[compId,'Task deadline approaching','task_deadline'],[candId,'Your submission was evaluated','flagged_submission']]) {
    await upsert(db.notifications, { id: uuid(`notif:${uid}:${type}`) }, {
      id: uuid(`notif:${uid}:${type}`), user_id: uid, company_id: primaryCompanyId,
      type, priority: 'Medium', status: 'Unread', title, description: title + '.',
      related_entity: { type: 'System', id: '' },
    });
  }
  if (badges.length) {
    const top = candidateIds.slice(0, 5);
    for (let i = 0; i < top.length; i++) {
      const b = badges[i % badges.length];
      await upsert(db.user_badges, { id: uuid(`ub:${top[i]}:${b.id}`) }, {
        id: uuid(`ub:${top[i]}:${b.id}`), user_id: top[i], badge_id: b.id, awarded_for: 'Top performance',
      });
    }
  }

  const counts = {};
  for (const m of ['companies','user_profiles','tasks','submissions','evaluations','subscriptions','invoices','notifications','task_templates','user_badges']) {
    counts[m] = await db[m].count();
  }
  console.log('[seed] done. counts =', counts);
  console.log('[seed] LOGIN CREDS → candidate@ctm.live / company@ctm.live / admin@ctm.live  (password: ' + PASSWORD + ')');
  await db.sequelize.close();
}

run().catch((e) => { console.error('[seed] FAILED:', e); process.exit(1); });
