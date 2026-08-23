'use strict';
/*
 * Replaces the placeholder body (2 blocks: one heading, one 2-sentence
 * paragraph) on "Corporate Compliance: A Practical Framework" with a full,
 * researched guide. This was one of six articles a 2026-06-28 bulk-seed run
 * left as a stub -- category and author were already fixed by
 * rotate-law-elite-article-authors.cjs; this fixes the actual content.
 *
 * Sources cited are real, verifiable frameworks (US Sentencing Guidelines
 * Ch. 8, DOJ's Evaluation of Corporate Compliance Programs, UK Bribery Act
 * 2010 guidance, ISO 37301, OECD guidance) -- URLs included only where
 * confident they're stable and correct; omitted rather than guessed
 * otherwise, matching this site's standing no-fabrication rule.
 *
 * USAGE
 *   CMS_TOKEN=<bearer> node scripts/fix-corporate-compliance-content.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/fix-corporate-compliance-content.cjs
 */

const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';
const ARTICLE_ID = '0fe363c2-4b17-4c14-90e1-2cd83a36b65e';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const TOKEN = process.env.CMS_TOKEN || null;

function h(level, text) { return { type: 'heading', content: { text, level } }; }
function p(html) { return { type: 'html', content: { html: `<p>${html}</p>` } }; }
function ul(items) { return { type: 'html', content: { html: `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` } }; }

const RAW_BLOCKS = [
  p('Corporate compliance is often treated as a paperwork exercise -- a policy binder produced once and revisited only after something goes wrong. Regulators, courts, and increasingly boards of directors judge it differently: an effective program is <strong>operational</strong>, tested continuously, and demonstrably shapes how decisions actually get made. This guide sets out the components that distinguish a compliance program regulators respect from one that exists only on paper.'),

  h(2, 'Why an Effective Program Matters'),
  p('The consequences of a weak program go beyond the cost of a single violation. In the United States, whether an organization had -- and actively followed -- an effective compliance program is a formal factor courts weigh at sentencing under the Federal Sentencing Guidelines, and prosecutors weigh the same question when deciding whether and how to charge a company at all. Regulators in other jurisdictions apply comparable logic: a genuine, well-documented program can reduce penalties or even provide a defense, while a program that exists only on paper offers little protection and can itself become evidence that misconduct was foreseeable and preventable.'),

  h(2, 'The Core Elements of an Effective Program'),
  p('There is no single legally mandated template, but enforcement guidance across jurisdictions converges on the same building blocks.'),

  h(3, 'Risk Assessment'),
  p('Every effective program starts with an honest assessment of where the organization is actually exposed -- by industry, geography, business model, and history of prior incidents -- rather than a generic, one-size-fits-all policy set. A compliance function that has not mapped its real risk areas is usually building controls for the wrong problems.'),

  h(3, 'Written Standards and Controls'),
  p('Codes of conduct and policies need to translate into concrete controls: approval workflows, spending limits, segregation of duties, and vendor due diligence steps that make the prohibited conduct genuinely harder to do, not just formally forbidden.'),

  h(3, 'Oversight and Resources'),
  p('A program needs a senior individual or committee with real authority and a direct line to the board or top management -- and a budget and staff that make the mandate credible rather than symbolic. Enforcement guidance in multiple jurisdictions specifically asks whether the compliance function is adequately resourced relative to the size and risk profile of the business.'),

  h(3, 'Training and Communication'),
  p('Training that is role-specific and scenario-based -- built around the situations a given team actually encounters -- is far more effective than a single annual module delivered to everyone regardless of function. Communication should also run upward: employees need to understand not just the rules but why they exist.'),

  h(3, 'Confidential Reporting Channels'),
  p("A working speak-up channel -- a hotline, web portal, or equivalent -- that employees actually trust is one of the strongest predictors of whether misconduct surfaces internally before it becomes a regulatory problem. Retaliation protection has to be real and visibly enforced, or the channel will go unused."),

  h(3, 'Consistent Enforcement and Discipline'),
  p('A policy applied selectively -- rigorously against junior staff but overlooked for senior revenue-generators -- undermines the credibility of the entire program and is one of the first things investigators probe. Consistency across levels of seniority is treated as a strong signal of whether a program is real.'),

  h(3, 'Monitoring, Auditing, and Continuous Improvement'),
  p('Programs need periodic testing -- audits, transaction monitoring, and post-incident root-cause review -- and evidence that findings actually change the program going forward. A compliance function that never updates its own controls in response to what it learns is not really monitoring anything.'),

  h(2, 'How Expectations Vary by Jurisdiction'),
  ul([
    '<strong>United States:</strong> The U.S. Sentencing Guidelines (Chapter 8) set out seven hallmarks of an effective program, and the Department of Justice\'s "Evaluation of Corporate Compliance Programs" guidance is the framework prosecutors use to assess whether a program was well designed, applied in good faith, and actually working in practice.',
    '<strong>United Kingdom:</strong> Under the Bribery Act 2010, having "adequate procedures" is a defense to the corporate offense of failing to prevent bribery. The Ministry of Justice\'s guidance sets out six principles -- proportionate procedures, top-level commitment, risk assessment, due diligence, communication and training, and monitoring and review.',
    '<strong>International standard:</strong> ISO 37301, <em>Compliance management systems -- Requirements with guidance for use</em>, gives organizations a certifiable, jurisdiction-neutral framework built on the same risk-based, leadership-driven structure.',
    'Because expectations and enforcement priorities differ by regulator and sector, a program built only around one jurisdiction\'s checklist can leave real gaps for a business operating internationally.',
  ]),

  h(2, 'Common Pitfalls'),
  ul([
    'Treating the code of conduct as the program itself, rather than as the top layer of a much deeper set of controls.',
    'Copying a competitor\'s policy without a genuine risk assessment behind it.',
    'Under-resourcing the compliance function relative to the size and complexity of the business.',
    'Training that is generic, infrequent, or disconnected from the actual risks a given team faces.',
    'Enforcing standards inconsistently across seniority levels.',
    'Never revisiting the program after an audit finding or a near-miss.',
  ]),

  h(2, 'Frequently Asked Questions'),
  h(3, 'Does a small or mid-sized company need a formal compliance program?'),
  p('Regulators generally expect the program to be proportionate to the size, complexity, and risk profile of the organization -- a small company does not need the same infrastructure as a multinational, but the same core elements (risk assessment, clear standards, a reporting channel, and some oversight) scale down rather than disappear.'),
  h(3, 'Who should own the compliance function?'),
  p('Practice varies, but enforcement guidance consistently looks for a person or committee with real authority, direct access to the board or senior leadership, and independence from the business units it oversees -- a compliance role that reports through, and can be overruled by, the function it is meant to police is a recognized weakness.'),
  h(3, 'How often should a compliance program be reviewed?'),
  p('At minimum annually, and additionally whenever the business changes materially -- a new jurisdiction, product line, acquisition, or a compliance incident are all standard triggers for an off-cycle review.'),
  h(3, 'Can having a compliance program prevent a company from being prosecuted?'),
  p('No program eliminates liability outright, but a genuine, well-documented, and actively used program is a recognized factor that can reduce charges, penalties, or sentencing exposure in several jurisdictions -- the emphasis throughout enforcement guidance is on whether the program was real and effective, not merely on its existence.'),

  h(2, 'Practical Next Steps'),
  p("Start with a documented risk assessment specific to your business, not a generic template. Map that assessment to concrete controls and a code of conduct, secure a resourced and empowered compliance owner, stand up a confidential reporting channel employees actually trust, and build a training and audit cycle that feeds back into the program rather than running in a loop that never changes it. Because expectations differ by jurisdiction and sector, have the resulting program reviewed by counsel or a compliance professional familiar with the regulatory regimes your business actually operates under."),

  p('<em>This article is general legal and business information, not legal advice. Compliance requirements differ by jurisdiction, industry, and company size, and change over time -- consult a qualified lawyer or compliance professional before relying on this as a complete framework for your organization.</em>'),
];

const CONTENT_BLOCKS = RAW_BLOCKS.map((b, i) => ({ id: `blk-${i}`, order: i, ...b }));

const CITATIONS = [
  { title: 'United States Sentencing Guidelines Manual, Chapter 8 (Sentencing of Organizations)', url: 'https://www.ussc.gov/guidelines' },
  { title: 'U.S. Department of Justice, Criminal Division — Evaluation of Corporate Compliance Programs' },
  { title: 'UK Ministry of Justice — Bribery Act 2010: Guidance about procedures for commercial organisations', url: 'https://www.gov.uk/government/publications/bribery-act-2010-guidance' },
  { title: 'ISO 37301:2021 — Compliance management systems: Requirements with guidance for use' },
  { title: 'OECD — Good Practice Guidance on Internal Controls, Ethics, and Compliance' },
];

async function api(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE.replace(/\/+$/, '')}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) throw new Error(`${method} ${urlPath} -> ${res.status} ${(json && (json.error?.message || json.message)) || text}`);
  return json;
}

async function main() {
  console.log('Corporate Compliance article content fix');
  console.log(`  mode : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}\n`);
  if (!TOKEN) throw new Error('No CMS_TOKEN set.');

  const current = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content/${ARTICLE_ID}`);
  const article = current?.data;
  if (!article) throw new Error('Article not found');
  console.log(`  found: "${article.title}" (currently ${article.contentBlocks?.length ?? 0} block(s))`);
  console.log(`  will write: ${CONTENT_BLOCKS.length} block(s) + ${CITATIONS.length} citation(s)\n`);

  if (DRY_RUN) {
    console.log('[dry-run] would PATCH contentBlocks + customFields.citations. No changes made.');
    return;
  }

  const currentCustomFields = article.customFields || {};
  await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${ARTICLE_ID}`, {
    contentBlocks: CONTENT_BLOCKS,
    readingTimeMinutes: 7,
    customFields: { ...currentCustomFields, citations: CITATIONS },
  });
  console.log('Done. Article content updated.');
}

main().catch((err) => { console.error('FAILED:', err.message); process.exit(1); });
