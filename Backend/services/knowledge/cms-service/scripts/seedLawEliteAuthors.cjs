'use strict';
/**
 * Seeds the Law Elite Network author/contributor profiles into the central CMS
 * so every byline is editable + publishable from the admin-platform console
 * (admin.baalvion.com → Website → Authors) and served on the live /author pages.
 *
 * Mirrors Frontend/Law-Elite-Network-main/src/data/authors.ts so the CMS becomes
 * the source of truth while the bundled profiles remain the offline fallback.
 *
 * Idempotent: skips an author whose slug already exists (409 / pre-check).
 *
 *   AUTH_URL=http://localhost:3001/v1/auth \
 *   CMS_URL=http://localhost:3011/api/v1 \
 *   SUPERADMIN_EMAIL=superadmin@baalvion.com SUPERADMIN_PASSWORD=*** \
 *   node scripts/seedLawEliteAuthors.cjs
 */

const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3011/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD;
const SITE = process.env.LAW_ELITE_SITE_SLUG || 'law-elite-network';
const BASE = `${CMS}/cms/websites/${encodeURIComponent(SITE)}`;

const AUTHORS = [
  { slug: 'elena-rossi', name: 'Elena Rossi', title: 'Corporate & Securities Editor', credentials: 'LL.M. Corporate Law · 12+ years covering company and securities law', expertise: ['Business & Corporate', 'Tax & Finance'], social: { linkedin: 'https://www.linkedin.com/company/law-elite-network' },
    bio: 'Elena Rossi leads Law Elite Network’s coverage of corporate structure, shareholder arrangements, and securities fundamentals. She has spent more than a decade translating dense company-law concepts — from incorporation and share classes to founder agreements and governance — into guidance that founders, directors, and investors can actually use. Her explainers focus on the questions that recur across jurisdictions: what a shareholders’ agreement should protect, how ownership and control come apart, and where standard templates quietly fail.' },
  { slug: 'marcus-hale', name: 'Marcus Hale', title: 'Technology & Data Protection Editor', credentials: 'J.D. · 10+ years in technology, IP, and privacy law', expertise: ['Technology & IP', 'Business & Corporate'], social: { x: 'https://x.com/lawelitenetwork' },
    bio: 'Marcus Hale writes Law Elite Network’s technology, intellectual-property, and data-protection coverage. His work tracks how privacy regimes such as the GDPR and CCPA, trademark and copyright systems, and platform regulation actually affect founders and product teams. Marcus is known for cutting through acronyms — explaining what “processor” versus “controller” means in practice, when a trademark beats a copyright, and how company formation choices ripple into data obligations later.' },
  { slug: 'priya-menon', name: 'Priya Menon', title: 'Startups & Venture Contributor', credentials: 'LL.B. · Startup and early-stage venture legal writer', expertise: ['Business & Corporate'], social: {},
    bio: 'Priya Menon covers the legal groundwork of building a company: entity choice, founder equity and vesting, cap tables, early fundraising, and the contracts a young business signs before it can afford counsel. She writes for the founder who needs to understand the trade-offs before talking to a lawyer, not after.' },
  { slug: 'sofia-almeida', name: 'Sofia Almeida', title: 'Family Law Editor', credentials: 'LL.M. Family Law · 14+ years writing on family and matrimonial law', expertise: ['Family & Personal'], social: { linkedin: 'https://www.linkedin.com/company/law-elite-network' },
    bio: 'Sofia Almeida heads family-law coverage at Law Elite Network, with a focus on divorce, financial settlement, and the practical mechanics of separating two lives. She writes with the understanding that readers arrive at these guides during some of the hardest weeks of their lives — explaining process and options without alarmism, and flagging when a person genuinely needs a lawyer rather than a template.' },
  { slug: 'rajesh-iyer', name: 'Rajesh Iyer', title: 'Family & Children’s Law Contributor', credentials: 'LL.B. · Family law writer focused on custody and child welfare', expertise: ['Family & Personal'], social: {},
    bio: 'Rajesh Iyer writes Law Elite Network’s coverage of child custody, parenting arrangements, and the welfare standards courts apply when families restructure. He is careful to separate what the law actually weighs — the best interests of the child — from the myths that surround custody disputes, while steering parents toward qualified local counsel for their specific situation.' },
  { slug: 'eleanor-whitfield', name: 'Eleanor Whitfield', title: 'Estate Planning & Probate Editor', credentials: 'LL.M. · 15+ years in wills, trusts, and estate planning', expertise: ['Family & Personal'], social: { linkedin: 'https://www.linkedin.com/company/law-elite-network' },
    bio: 'Eleanor Whitfield covers wills, estate planning, and probate for Law Elite Network. She has spent fifteen years writing about how people pass on what they own — and how avoidable mistakes in a will or a beneficiary form unravel decades of intentions. Her explainers cover what makes a will valid, why witnessing rules matter, and the difference between planning that survives a challenge and planning that doesn’t.' },
  { slug: 'priya-nair', name: 'Priya Nair', title: 'Senior Legal Editor', credentials: 'LL.M. · 13+ years across commercial, tax, employment, and IP law', expertise: ['Tax & Finance', 'Employment & Labor', 'Technology & IP', 'Property & Real Estate'], social: { linkedin: 'https://www.linkedin.com/company/law-elite-network', x: 'https://x.com/lawelitenetwork' },
    bio: 'Priya Nair is a senior editor at Law Elite Network whose byline spans commercial agreements, tax fundamentals, employment contracts, intellectual property, and property transactions. Her breadth comes from years on the desk where these areas overlap — a single business decision often touching all of them at once. Her role is consistency: making sure every guide holds the same standard of clarity, accuracy, and worldwide framing.' },
  { slug: 'daniel-okafor', name: 'Daniel Okafor', title: 'Criminal & Regulatory Editor', credentials: 'J.D. · 11+ years writing on criminal, tax, and regulatory law', expertise: ['Criminal Law', 'Tax & Finance', 'Property & Real Estate'], social: { x: 'https://x.com/lawelitenetwork' },
    bio: 'Daniel Okafor covers criminal procedure, white-collar and regulatory matters, tax enforcement, and property law for Law Elite Network. He focuses on the points where ordinary people meet the enforcement side of the law — bail, investigations, audits, and disputes — and explains rights and process plainly, so readers understand what is happening before they sit across from a prosecutor, an auditor, or opposing counsel.' },
  { slug: 'daniel-okoro', name: 'Daniel Okoro', title: 'Employment Law Contributor', credentials: 'LL.B. · Employment and workplace-rights writer', expertise: ['Employment & Labor'], social: {},
    bio: 'Daniel Okoro writes Law Elite Network’s employment coverage, with particular attention to dismissal, wrongful termination, and the rights employees keep when a job ends. He explains the difference between a lawful dismissal and an unlawful one, and what documentation tends to decide which is which — written for both employees and small employers trying to do it correctly.' },
  { slug: 'aisha-rahman', name: 'Aisha Rahman', title: 'Criminal Justice Contributor', credentials: 'J.D. · Criminal justice and procedure writer', expertise: ['Criminal Law'], social: {},
    bio: 'Aisha Rahman covers criminal justice for Law Elite Network, from how bail is set and challenged to how white-collar offences are investigated and charged. She writes to demystify a system that is deliberately intimidating, explaining the stages of a case and the rights that apply at each one, and always pointing serious matters toward qualified local defence counsel.' },
  { slug: 'marcus-whitfield', name: 'Marcus Whitfield', title: 'Dispute Resolution Editor', credentials: 'LL.M. Dispute Resolution · Arbitration and mediation writer', expertise: ['Dispute Resolution'], social: { linkedin: 'https://www.linkedin.com/company/law-elite-network' },
    bio: 'Marcus Whitfield covers how disputes are resolved outside — and inside — the courtroom: arbitration, mediation, negotiation, and litigation. He helps readers understand which path fits which conflict, what each costs in time and money, and where an enforceable outcome actually comes from — treating dispute resolution as a set of deliberate choices rather than an inevitable march to trial.' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, url, token, body, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json().catch(() => ({}));
      if (r.status >= 500 && i < attempts - 1) { await sleep(400 * (i + 1)); continue; }
      return { status: r.status, data };
    } catch (e) {
      lastErr = e;
      await sleep(400 * (i + 1));
    }
  }
  throw lastErr || new Error('request failed after retries');
}

async function main() {
  if (!PW) throw new Error('SUPERADMIN_PASSWORD not set');
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));

  // Pre-fetch existing slugs for idempotency.
  const existingRes = await req('GET', `${BASE}/authors`, token);
  const existing = new Set((existingRes.data?.data || []).map((a) => a.slug));

  let created = 0, skipped = 0, failed = 0;
  for (const a of AUTHORS) {
    if (existing.has(a.slug)) { skipped++; continue; }
    const payload = {
      name: a.name,
      slug: a.slug,
      title: a.title,
      credentials: a.credentials,
      bio: a.bio,
      expertise: a.expertise,
      social: a.social,
      seoMetadata: { title: `${a.name} — ${a.title}`.slice(0, 200), description: a.bio.slice(0, 300) },
    };
    const res = await req('POST', `${BASE}/authors`, token, payload);
    if (res.status === 201 || res.status === 200) created++;
    else if (res.status === 409) skipped++;
    else { failed++; console.error(`author ${a.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200)); }
    await sleep(150);
  }

  console.log(JSON.stringify({ ok: true, site: SITE, created, skipped, failed }, null, 2));
}

main().catch((e) => { console.error('author seed failed:', e.message); process.exit(1); });
