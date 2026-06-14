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
const PW    = process.env.SUPERADMIN_PASSWORD || 'Sup3rAdmin!2026';

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

// ── People (mirrors Frontend/IR-Baalvion-main/src/lib/data.ts) ──────────────────
const leadershipTeam = [
  { name: 'Deepak Kumar Kuldeep', title: 'Founder & Chief Visionary Officer', imageId: 'founder-photo', bio: "Deepak is the driving force behind Baalvion, bringing over two decades of experience in global trade and technology. His vision is to build a transparent and efficient ecosystem for B2B commerce worldwide." },
  { name: 'Tamanna shaikh', title: 'Chief Executive Officer', imageId: 'tamanna-photo', bio: "Tamanna leads Baalvion's strategic execution and day-to-day operations. With a background in corporate strategy and finance, she is focused on scaling the company and delivering value to our stakeholders." },
  { name: 'Dilip Kumar Kuldeep', title: 'Director', imageId: 'dilip-photo', bio: "Dilip Kumar Kuldeep leads Baalvion's strategic execution and day-to-day operations. With a background in corporate strategy and finance, he is focused on scaling the company and delivering value to our stakeholders." },
  { name: 'Adarsh Patra', title: 'Chief Executive Officer', imageId: 'executive-1-photo', bio: "Adarsh leads Baalvion's strategic execution and day-to-day operations. With a background in corporate strategy and finance, he is focused on scaling the company and delivering value to our stakeholders." },
];
const globalLeaders = [
  { name: 'Parthamesh Pawer', title: 'Co-Head of the Global Partners Office', imageId: 'prathamesh-photo', bio: "Prathamesh Pawer leads Baalvion's strategic execution and day-to-day operations. With a background in corporate strategy and finance, he is focused on scaling the company and delivering value to our stakeholders." },
  { name: 'Laxman Singh Champia', title: 'Co-Head of Aladdin Product Engineering', imageId: 'laxman-photo', bio: "Laxman Singh Champia oversees the development of Baalvion's core technology platform. With extensive experience in software engineering and product management, he ensures our solutions are innovative, reliable, and scalable." },
  { name: 'Rashmika Singh', title: 'Co-Head of Aladdin Product Engineering', imageId: 'rashmika-photo', bio: "Rashmika Singh oversees the development of Baalvion's core technology platform. With extensive experience in software engineering and product management, she ensures our solutions are innovative, reliable, and scalable." },
  { name: 'Preeti snigdha Mallick', title: 'Deputy General Counsel', imageId: 'preeti-photo', bio: "Preeti Snigdha Mallick leads Baalvion's legal strategy and compliance efforts. With a strong background in corporate law and regulatory affairs, she ensures our operations adhere to the highest standards of integrity and governance." },
  { name: 'Susan Chan', title: 'Head of Asia Pacific', bio: "Susan Chan's leadership and deep knowledge of the Asia Pacific markets are critical to our expansion and operational success in this key growth region." },
  { name: 'Tarek Chouman', title: 'Global Head of Aladdin Client Business', bio: "Tarek Chouman leads Baalvion's client engagement and business development efforts. With a focus on building strong relationships and delivering tailored solutions, he drives our global growth and market penetration strategies." },
  { name: 'Alex Claringbull', title: 'Global Head of Index Investments', bio: "Alex Claringbull oversees Baalvion's index investment strategies and product offerings. With deep expertise in financial markets and quantitative analysis, he ensures our clients have access to innovative and effective investment solutions." },
  { name: 'Samara Cohen', title: 'Global Head of Market Development', bio: "Samara Cohen leads Baalvion's market development initiatives, identifying new opportunities and fostering partnerships to expand our global footprint. Her strategic vision and industry insights are key to our continued growth and success." },
];
const vicePresidents = [
  { name: 'Sasmita Gemel', title: 'Vice President', position: 'Marketing Communications', imageId: 'sasmita-photo', bio: "Sasmita Gemel leads Baalvion's marketing communications strategy, crafting compelling narratives that resonate with our global audience. With a background in brand management and digital marketing, she drives our efforts to build a strong and recognizable brand in the global trade ecosystem." },
  { name: 'Vishal Kumar Pingua', title: 'Vice President', position: 'Corporate Development', imageId: 'bishal-photo', bio: "Vishal Kumar Pingua heads Baalvion's corporate development initiatives, focusing on strategic partnerships, mergers and acquisitions, and growth opportunities. With extensive experience in business strategy and financial analysis, he plays a critical role in shaping our company's future trajectory." },
  { name: 'Biswajeet Patra', title: 'Vice President', position: 'Corporate Counsel', imageId: 'biswajeet-photo', bio: "Biswajeet Patra leads Baalvion's legal affairs, ensuring compliance with global regulations and managing legal risks. With a strong background in corporate law and international business, he provides essential guidance to support our global operations and strategic initiatives." },
  { name: 'Jaid Alam', title: 'Vice President', position: 'Worldwide Sales', imageId: 'jaid-photo', bio: "Jaid Alam oversees Baalvion's worldwide sales operations, driving revenue growth and client acquisition across global markets. With a proven track record in sales leadership and a deep understanding of the B2B commerce landscape, he is instrumental in expanding our customer base and strengthening our market position." },
  { name: 'Joe DeVico', title: 'Vice President', position: 'Marketing Communications', bio: "Joe DeVico leads Baalvion's marketing communications strategy, crafting compelling narratives that resonate with our global audience. With a background in brand management and digital marketing, he drives our efforts to build a strong and recognizable brand in the global trade ecosystem." },
];
const boardOfDirectors = [
  { name: 'Laurence D. Fink', title: 'Chairman and CEO of BlackRock', imageId: 'bod-1', bio: "Mr. Fink is founder, Chairman and Chief Executive Officer of BlackRock. He also leads the firm's Global Executive Committee. He is responsible for senior leadership development and succession planning, defining and reinforcing BlackRock's vision and culture, and engaging relationships with key strategic clients, industry leaders, regulators and policy makers." },
  { name: 'Pamela Daley', title: 'Former Senior Vice President of Corporate Business Development of General Electric Company', imageId: 'bod-2', bio: "Pamela Daley brings a wealth of experience in corporate governance and strategic transactions. Her expertise guides our approach to long-term value creation and sustainable business practices. She has served on multiple public company boards." },
  { name: 'Gregory J. Fleming', title: 'President and CEO of Rockefeller Capital Management', imageId: 'bod-3', bio: "Gregory J. Fleming has a distinguished career in the financial services industry. His leadership in wealth and asset management provides invaluable insight into our strategic growth and client service initiatives." },
  { name: 'William E. Ford', title: 'Chairman and CEO of General Atlantic', imageId: 'bod-4', bio: "As a leader in global growth equity, William E. Ford offers deep expertise in identifying and nurturing high-potential companies. His perspective is crucial for our technology and market expansion strategies." },
  { name: 'Fabrizio Freda', title: 'Former President and CEO of the Estee Lauder Companies Inc', imageId: 'bod-5', bio: "Fabrizio Freda's extensive background in global brand management and consumer markets provides critical insights into our customer-centric strategies and international growth ambitions." },
  { name: 'Murry S. Gerber', title: 'LEAD INDEPENDENT DIRECTOR, Former Chairman and CEO of EQT', imageId: 'bod-6', bio: "As Lead Independent Director, Murry S. Gerber ensures robust governance and board oversight. His experience in the energy sector and as a public company CEO provides strong leadership for the board." },
  { name: 'Margaret "Peggy" L. Johnson', title: 'CEO of Agility Robotics', imageId: 'bod-7', bio: "Margaret L. Johnson is at the forefront of technological innovation in robotics and AI. Her expertise helps steer our strategy in acquiring and integrating cutting-edge technologies into our platform." },
  { name: 'Robert S. Kapito', title: 'President of BlackRock', imageId: 'bod-8', bio: "Robert S. Kapito's deep understanding of global markets and risk management is fundamental to our firm's strategy. He plays a key role in our client relationships and operational excellence." },
  { name: 'Bader M. Al-Saad', title: 'Director General and Chairman of the Board of Arab Fund for Economic and Social Development', imageId: 'bod-9', bio: "Bader M. Al-Saad's international experience in economic development and investment provides a global perspective on our market strategies and partnerships, particularly in emerging economies." },
  { name: 'Mathis Cabiallavetta', title: 'Former Vice Chairman of Swiss Re Ltd.', imageId: 'bod-10', bio: "Mathis Cabiallavetta's extensive experience in the insurance and risk management industries is invaluable to our comprehensive risk assessment and mitigation frameworks." },
  { name: 'Susan Chan', title: 'Head of Asia Pacific', imageId: 'bod-11', bio: "Susan Chan's leadership and deep knowledge of the Asia Pacific markets are critical to our expansion and operational success in this key growth region." },
  { name: 'William C. Dudley', title: 'Former President and CEO of the Federal Reserve Bank of New York', imageId: 'bod-12', bio: "William C. Dudley offers unparalleled expertise in economic policy and financial stability. His guidance helps us navigate complex regulatory and macroeconomic landscapes." },
  { name: 'Kristin C. Peck', title: 'CEO of Zoetis Inc.', imageId: 'bod-13', bio: "Kristin C. Peck's leadership in the global animal health industry brings a unique perspective on supply chains and international business operations." },
  { name: 'Charles H. Robbins', title: 'Chairman and CEO of Cisco Systems, Inc.', imageId: 'bod-14', bio: "Charles H. Robbins is a leader in digital transformation and networking technology. His insights are vital to building our secure and scalable global trade platform." },
  { name: 'Hans E. Vestberg', title: 'Chairman and CEO of Verizon Communications Inc.', imageId: 'bod-15', bio: "Hans E. Vestberg's expertise in telecommunications and technology infrastructure is crucial for developing the robust, connected ecosystem that underpins Baalvion's vision." },
  { name: 'Susan Wagner', title: 'Co-founder of BlackRock, Inc.', imageId: 'bod-16', bio: "As a co-founder of a leading global investment firm, Susan Wagner's entrepreneurial and strategic vision is a cornerstone of our board's advisory strength." },
  { name: 'Mark Wilson', title: 'Former CEO of Aviva plc', imageId: 'bod-17', bio: "Mark Wilson's experience leading a multinational insurance company provides deep insights into risk management, capital allocation, and international financial services." },
  { name: 'Jessica Uhl', title: 'Former CFO of Shell plc', imageId: 'bod-18', bio: "Jessica Uhl's background as CFO of a global energy company brings rigorous financial discipline and strategic capital management expertise to our board." },
  { name: 'John S. Weinberg', title: 'Chairman and CEO of Evercore Inc.', imageId: 'bod-19', bio: "John S. Weinberg's extensive career in investment banking provides expert guidance on our M&A strategy, capital markets activities, and long-term financial planning." },
];

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
