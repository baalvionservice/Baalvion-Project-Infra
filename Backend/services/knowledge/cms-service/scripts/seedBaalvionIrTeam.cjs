'use strict';
/**
 * Seeds the LEADERSHIP & GOVERNANCE people for Baalvion Investor Relations
 * (ir.baalvion.com) into the central CMS so every co-founder / executive / board
 * member is editable + publishable from the admin-platform console.
 *
 * Model (so it is fully console-editable — the editor saves title/slug/excerpt/
 * blocks/seo, NOT customFields):
 *   - a parent category "Leadership & Governance" with 4 sub-categories (tiers)
 *   - one `post` content item per person:
 *       title   = name
 *       excerpt = role (and VP function, when present)
 *       blocks  = [ image(photo), paragraph(bio) ]
 *       category = the tier sub-category
 *       customFields.kind = 'leadership' (+ tier/role/position/imageId for the
 *                           public site's data mappers)
 *
 * Idempotent: skips content whose slug already exists (409). Publishing is done
 * here inline (workflow transition) and can be re-run via publishWebsite.cjs.
 *
 *   CMS_URL=http://localhost:3011/api/v1 node scripts/seedBaalvionIrTeam.cjs
 */
const fs = require('fs');
const path = require('path');

const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS  = process.env.CMS_URL  || 'http://localhost:3011/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW    = process.env.SUPERADMIN_PASSWORD;

const WEBSITE_ID = process.env.IR_WEBSITE_ID || '7bced69e-a861-4530-9660-e0ddb955d72b';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

// ── Resolve imageId -> imageUrl from the IR frontend placeholder map (best effort) ──
const PLACEHOLDER_JSON = path.join(
  __dirname,
  '../../../../../Frontend/IR-Baalvion-main/src/lib/placeholder-images.json'
);
let IMG = {};
try {
  const raw = JSON.parse(fs.readFileSync(PLACEHOLDER_JSON, 'utf8'));
  for (const p of raw.placeholderImages || []) IMG[p.id] = p.imageUrl;
} catch (e) {
  console.warn('placeholder-images.json not readable, photos will rely on imageId only:', e.message);
}

// ── Categories: parent + 4 tier sub-categories ──────────────────────────────────
const PARENT = { name: 'Leadership & Governance', slug: 'leadership-governance' };
const TIERS = [
  { key: 'executive-committee', name: 'Executive Committee' },
  { key: 'functional-leadership', name: 'Functional Leadership' },
  { key: 'vice-presidents', name: 'Vice Presidents' },
  { key: 'board-of-directors', name: 'Board of Directors' },
];

/**
 * Real Baalvion people only.
 *
 * This file previously seeded BlackRock's board of directors verbatim as Baalvion's own —
 * Laurence D. Fink, Robert S. Kapito, Susan Wagner, Hans E. Vestberg, Jessica Uhl,
 * William C. Dudley, Charles H. Robbins, Kristin C. Peck and ten more, each with their real
 * title at their real company. Four BlackRock operating executives (Susan Chan, Tarek
 * Chouman, Alex Claringbull, Samara Cohen) sat in functional leadership alongside them.
 *
 * The versions published to the CMS are renamed copies of exactly these entries — the
 * credentials were kept and the names changed, so "Chairman and CEO of Verizon
 * Communications Inc." is Hans E. Vestberg's role and "Former CFO of Shell plc" is
 * Jessica Uhl's. Removing them here stops a re-run from restoring what
 * purgeBaalvionIrFiction.cjs deletes.
 *
 * boardOfDirectors is deliberately empty. Board composition is a statutory fact and a
 * representation to investors; it is entered from the company's filings or not at all.
 *
 * "Aladdin" is BlackRock's platform and has been dropped from the two engineering titles
 * that carried it.
 */
const leadershipTeam = [
  { name: 'Deepak Kumar Kuldeep', title: 'Founder & Chief Visionary Officer', imageId: 'founder-photo' },
  { name: 'Tamanna shaikh', title: 'Chief Executive Officer', imageId: 'tamanna-photo' },
  { name: 'Dilip Kumar Kuldeep', title: 'Director', imageId: 'dilip-photo' },
  { name: 'Adarsh Patra', title: 'Chief Technology Officer', imageId: 'executive-1-photo' },
];
const globalLeaders = [
  { name: 'Parthamesh Pawer', title: 'Co-Head of the Global Partners Office', imageId: 'prathamesh-photo' },
  { name: 'Laxman Singh Champia', title: 'Co-Head of Product Engineering', imageId: 'laxman-photo' },
  { name: 'Rashmika Singh', title: 'Co-Head of Product Engineering', imageId: 'rashmika-photo' },
  { name: 'Preeti snigdha Mallick', title: 'Deputy General Counsel', imageId: 'preeti-photo' },
];
const vicePresidents = [
  { name: 'Sasmita Gemel', title: 'Vice President', position: 'Marketing Communications', imageId: 'sasmita-photo' },
  { name: 'Vishal Kumar Pingua', title: 'Vice President', position: 'Corporate Development', imageId: 'bishal-photo' },
  { name: 'Biswajeet Patra', title: 'Vice President', position: 'Corporate Counsel', imageId: 'biswajeet-photo' },
  { name: 'Jaid Alam', title: 'Vice President', position: 'Worldwide Sales', imageId: 'jaid-photo' },
];
const boardOfDirectors = [];

const GROUPS = [
  { tier: 'executive-committee', people: leadershipTeam },
  { tier: 'functional-leadership', people: globalLeaders },
  { tier: 'vice-presidents', people: vicePresidents },
  { tier: 'board-of-directors', people: boardOfDirectors },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugify = (s) =>
  String(s).toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

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

async function fetchCategories(token) {
  // taxonomy list comes back as a tree; flatten to slug -> id
  const res = await req('GET', `${BASE}/categories?limit=500`, token);
  const map = {};
  const walk = (nodes) => {
    for (const c of nodes || []) {
      map[c.slug] = c.id;
      if (c.children) walk(c.children);
    }
  };
  walk(res.data?.data || []);
  return map;
}

async function main() {
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));

  // 1) Parent category
  let catMap = await fetchCategories(token);
  if (!catMap[PARENT.slug]) {
    const r = await req('POST', `${BASE}/categories`, token, { name: PARENT.name, slug: PARENT.slug });
    if (r.status !== 201 && r.status !== 200 && r.status !== 409) console.error(`parent cat -> ${r.status}`, JSON.stringify(r.data).slice(0, 160));
    catMap = await fetchCategories(token);
  }
  const parentId = catMap[PARENT.slug];

  // 2) Tier sub-categories
  let catsCreated = 0;
  for (let i = 0; i < TIERS.length; i++) {
    const t = TIERS[i];
    if (catMap[t.key]) continue;
    const r = await req('POST', `${BASE}/categories`, token, { name: t.name, slug: t.key, parentId, sortOrder: i });
    if (r.status === 201 || r.status === 200) catsCreated++;
    else if (r.status !== 409) console.error(`cat ${t.key} -> ${r.status}`, JSON.stringify(r.data).slice(0, 160));
  }
  catMap = await fetchCategories(token);

  // 3) People as posts
  const usedSlugs = new Set();
  const createdIds = [];
  let created = 0, skipped = 0;
  for (const g of GROUPS) {
    for (let idx = 0; idx < g.people.length; idx++) {
      const p = g.people[idx];
      let base = slugify(p.name);
      let slug = base;
      let n = 2;
      while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
      usedSlugs.add(slug);

      const imageUrl = p.imageId ? IMG[p.imageId] : undefined;
      const blocks = [];
      if (imageUrl) blocks.push({ id: 'blk-img', type: 'image', order: 0, content: { src: imageUrl, alt: p.name } });
      blocks.push({ id: 'blk-bio', type: 'paragraph', order: blocks.length, content: { text: p.bio } });

      const role = p.position ? `${p.title} — ${p.position}` : p.title;
      const payload = {
        title: p.name,
        slug,
        contentType: 'post',
        excerpt: role,
        categoryId: catMap[g.tier] || undefined,
        contentBlocks: blocks,
        customFields: {
          kind: 'leadership',
          tier: g.tier,
          role: p.title,
          position: p.position || undefined,
          imageId: p.imageId || undefined,
          imageUrl: imageUrl || undefined,
          order: idx,
        },
        seoMetadata: { title: p.name.slice(0, 200), description: (p.bio || '').slice(0, 300) },
      };
      const res = await req('POST', `${BASE}/content`, token, payload);
      if (res.status === 201 || res.status === 200) { created++; const id = res.data?.data?.id; if (id) createdIds.push(id); }
      else if (res.status === 409) skipped++;
      else console.error(`content ${slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
    }
  }

  // 4) Publish everything just created (draft -> published)
  let published = 0, pubFailed = 0;
  for (const id of createdIds) {
    const r = await req('POST', `${BASE}/content/${id}/workflow/transition`, token, { action: 'publish' });
    if (r.status === 200 || r.status === 201) published++;
    else { pubFailed++; console.error(`  publish ${id} -> ${r.status}`, JSON.stringify(r.data).slice(0, 160)); }
  }

  console.log(JSON.stringify({ ok: true, website: WEBSITE_ID, categories: catsCreated, content: { created, skipped }, published, pubFailed }, null, 2));
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
