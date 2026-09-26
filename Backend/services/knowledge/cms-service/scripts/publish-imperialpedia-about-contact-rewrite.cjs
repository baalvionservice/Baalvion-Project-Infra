'use strict';
/*
 * Replaces the live `about` and `contact` CMS pages on Imperialpedia with
 * honest, human-written copy — removing the fabricated "Allen Krewzz" author
 * persona, the Table-of-Contents/FAQ/Conclusion AI-mill padding, and (on
 * contact) a "General Contact Template" section that promised a template and
 * never delivered one. Real founder credited: Deepak Kumar Kuldeep, Founder
 * and Director of Baalvion Industries Private Limited (CIN
 * U43121OD2025PTC048479), founded as an independent project 2022-03-26,
 * legal home incorporated 2025-03-11.
 *
 * USAGE
 *   node scripts/publish-imperialpedia-about-contact-rewrite.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/publish-imperialpedia-about-contact-rewrite.cjs
 *
 * AUTH : CMS_TOKEN = prod super_admin (or writer/cms_author-on-Imperialpedia)
 *        bearer token from admin.baalvion.com — log in there, open DevTools
 *        Network tab, copy the Authorization header off any /cms/ request.
 *        This script cannot obtain that token itself; only a logged-in admin
 *        session can produce it.
 * BASE : defaults to the prod management ingress admin.baalvion.com/api-bff.
 */

const SITE = process.env.WEBSITE_SLUG || 'imperialpedia';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const TOKEN = process.env.CMS_TOKEN || null;

const html = (inner) => ({ type: 'html', content: { html: inner } });
const heading = (text, level = 2) => ({ type: 'heading', content: { text, level } });

function withOrder(blocks) {
  return blocks.map((b, i) => ({ id: `blk-${i}`, order: i, ...b }));
}

const ABOUT_BLOCKS = withOrder([
  html(
    "<p>Most people never get taught how money actually works &mdash; not in school, not at home. ImperialPedia exists to close that gap: plain-language explainers, guides, and comparisons on budgeting, saving, investing, debt, and building wealth, aimed at helping you make a better decision with the money you already have.</p>",
  ),
  heading('Who&#39;s behind it', 2),
  html(
    "<p>ImperialPedia was founded by <strong>Deepak Kumar Kuldeep</strong>, Founder and Director of Baalvion Industries Private Limited (CIN U43121OD2025PTC048479). He started it on March 26, 2022, as an independent project &mdash; before there was any company behind it, just the idea that personal finance shouldn&#39;t need a finance degree to understand. As the site grew, it needed a proper legal home: Baalvion Industries Private Limited was incorporated on March 11, 2025, and now owns and operates ImperialPedia. Deepak remains directly involved in the editorial side today, working alongside Tamanna Shaikh, our Senior Editor, and a roster of named writers, reviewers, and fact-checkers who work on the site&#39;s content.</p>",
  ),
  heading('Why this site exists', 2),
  html(
    "<p>What usually fills the gap in financial knowledge is one of two things: content too technical to act on, or content designed to sell you something &mdash; a course, a broker signup, a &#39;guru&#39;s&#39; system &mdash; dressed up as advice. ImperialPedia exists because there&#39;s real room for a third option: explanations written by people who understand the subject, checked against primary sources, with no product to push. Give someone a clear, honest answer to a real money question, and let them make their own decision with it.</p>",
  ),
  heading('What we publish', 2),
  html(
    "<p>Explainers, comparisons, and step-by-step guides across budgeting, saving, investing, debt, and building wealth &mdash; plus stock market fundamentals (how exchanges work, reading an order book, technical indicators like RSI and MACD) and a fraud-protection section covering scams that specifically target people managing their own money. We also cover the creator economy &mdash; how platform payouts, sponsorship deals, and ad revenue actually work.</p>",
  ),
  heading('How we check what we publish', 2),
  html(
    "<p>Every article is written, reviewed, and fact-checked by named people, not published anonymously. When we cite a number that can change &mdash; a rate, a contribution limit, a tax threshold &mdash; we point to the primary source (the CFPB, the Federal Reserve, the BLS, the IRS) instead of asking you to take our word for it. We don&#39;t accept payment to shape what we recommend, and we say plainly when something is a rule of thumb rather than a guarantee.</p>",
  ),
  heading('One thing we&#39;re not', 2),
  html(
    "<p>ImperialPedia provides financial education and general information &mdash; not personalized financial, investment, legal, or tax advice. Markets carry risk, and past performance doesn&#39;t predict future results. Use what we publish to build your own understanding, then talk to a qualified professional for decisions specific to your situation.</p>",
  ),
  html(
    '<p>Questions, corrections, or something you think we got wrong? Reach us through our <a href="/contact">contact page</a> &mdash; we read everything.</p>',
  ),
]);

const CONTACT_BLOCKS = withOrder([
  html(
    "<p>We&#39;d genuinely like to hear from you &mdash; a correction, a topic suggestion, a partnership idea, or anything else.</p>",
  ),
  heading('Reader questions and corrections', 2),
  html(
    "<p>Tell us which article you&#39;re referring to and what would make it clearer or more accurate. We read every message and take corrections seriously; we can&#39;t give personalized financial, investment, legal, or tax advice, but we can clarify or fix what we&#39;ve published.</p>",
  ),
  heading('Editorial requests', 2),
  html(
    "<p>Want us to cover something we haven&#39;t? Tell us what you&#39;re trying to figure out &mdash; that helps us write something that actually answers it.</p>",
  ),
  heading('Partnerships and press', 2),
  html(
    "<p>Open to partnerships that serve our readers and don&#39;t compromise editorial independence &mdash; tell us your organization, the proposal, and your timeline. Press requests: tell us your outlet and deadline and we&#39;ll prioritize accordingly.</p>",
  ),
  html(
    "<p>Email us directly, or use the form on this page &mdash; one team reads and routes every message. We aim to reply within a few business days.</p>",
  ),
]);

async function api(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE.replace(/\/+$/, '')}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || res.statusText;
    throw new Error(`${method} ${urlPath} → ${res.status} ${msg}`);
  }
  return json;
}

async function findBySlug(slug) {
  for (let page = 1; page <= 10; page++) {
    const res = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content?page=${page}&limit=100`);
    const items = res?.data ?? [];
    const found = items.find((it) => it.slug === slug);
    if (found) return found;
    const pg = res?.pagination;
    if (!pg || !pg.hasNext || items.length === 0) break;
  }
  return null;
}

async function publishOne(slug, blocks, excerpt) {
  console.log(`\n--- ${slug} ---`);
  const record = await findBySlug(slug);
  if (!record) throw new Error(`Content not found for slug: ${slug}`);
  console.log(`  found id=${record.id}, current blocks=${record.contentBlocks?.length ?? 0}`);

  if (DRY_RUN) {
    console.log(`  ~ would PATCH contentBlocks (${blocks.length} blocks) and excerpt`);
    return;
  }

  await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${record.id}`, {
    contentBlocks: blocks,
    excerpt,
  });
  console.log('  ✓ updated.');
}

async function main() {
  console.log('Imperialpedia about/contact rewrite');
  console.log(`  target : ${TARGET_BASE}`);
  console.log(`  site   : ${SITE}`);
  console.log(`  mode   : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}\n`);

  if (!DRY_RUN && !TOKEN) {
    throw new Error('No CMS_TOKEN set — provide a prod admin bearer to publish (see header comment).');
  }

  await publishOne(
    'about',
    ABOUT_BLOCKS,
    'ImperialPedia was founded by Deepak Kumar Kuldeep and is owned and operated by Baalvion Industries Private Limited. Here is who we are, why we exist, and how we check what we publish.',
  );
  await publishOne(
    'contact',
    CONTACT_BLOCKS,
    'How to reach ImperialPedia for reader questions, corrections, editorial requests, or partnership and press inquiries.',
  );

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('\n✗ FATAL:', e.message);
  process.exit(1);
});
