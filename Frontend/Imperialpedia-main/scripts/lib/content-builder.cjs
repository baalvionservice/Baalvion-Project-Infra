'use strict';
/**
 * Shared content builder — single source of truth for converting an article/page
 * "spec" (content/personal-finance/**.json) into CMS contentBlocks + the content
 * document. Used by BOTH:
 *   - seed-personal-finance.cjs       → seeds/updates the live CMS
 *   - generate-static-content.cjs     → bakes a static snapshot into the repo
 * so the snapshot the site renders offline is identical to what the CMS serves.
 */

const AUTHOR = {
  name: 'Allen Krewzz',
  title: 'Personal Finance Researcher & Business Analyst',
  site: 'ImperialPedia.com',
  bio:
    'Allen Krewzz is a finance researcher, business analyst, and digital entrepreneur focused on ' +
    'personal finance, wealth creation, financial planning, investing, and business growth. His work ' +
    'simplifies complex financial concepts into practical strategies that help readers make smarter ' +
    'money decisions and build long-term financial security.',
};

// ── Canonical anchor titles for every article slug (internal-link labels) ────
const SLUG_TITLE = {
  'how-to-create-a-monthly-budget': 'How to Create a Monthly Budget',
  '50-30-20-budget-rule-explained': '50/30/20 Budget Rule Explained',
  'emergency-fund-guide': 'Emergency Fund Guide',
  'how-much-savings-should-you-have': 'How Much Savings Should You Have?',
  'best-money-habits-of-millionaires': 'Best Money Habits of Millionaires',
  'how-inflation-affects-your-savings': 'How Inflation Affects Your Savings',
  'financial-independence-guide': 'Financial Independence Guide',
  'debt-snowball-vs-debt-avalanche': 'Debt Snowball vs Debt Avalanche',
  'how-to-improve-financial-discipline': 'How to Improve Financial Discipline',
  'best-personal-finance-apps': 'Best Personal Finance Apps',
  'how-to-track-expenses': 'How to Track Expenses',
  'common-money-mistakes': 'Common Money Mistakes',
  'family-financial-planning': 'Family Financial Planning',
  'smart-spending-habits': 'Smart Spending Habits',
  'financial-goals-framework': 'Financial Goals Framework',
  'how-to-build-wealth-from-scratch': 'How to Build Wealth From Scratch',
  'passive-income-ideas': 'Passive Income Ideas',
  'side-hustles-for-beginners': 'Side Hustles for Beginners',
  'personal-net-worth-calculator-guide': 'Personal Net Worth Calculator Guide',
  'money-management-for-students': 'Money Management for Students',
};

// ── Curated cross-link graph: each article → 5 topically-relevant siblings. ───
// Hand-tuned so every article has strong inbound AND outbound links (no orphans)
// and topic clusters interlink (budgeting ↔ tracking ↔ discipline, etc.).
const RELATED = {
  'how-to-create-a-monthly-budget': ['50-30-20-budget-rule-explained', 'how-to-track-expenses', 'emergency-fund-guide', 'smart-spending-habits', 'how-to-improve-financial-discipline'],
  '50-30-20-budget-rule-explained': ['how-to-create-a-monthly-budget', 'how-to-track-expenses', 'emergency-fund-guide', 'financial-goals-framework', 'smart-spending-habits'],
  'emergency-fund-guide': ['how-much-savings-should-you-have', 'family-financial-planning', 'how-inflation-affects-your-savings', 'financial-goals-framework', 'common-money-mistakes'],
  'how-much-savings-should-you-have': ['emergency-fund-guide', 'financial-goals-framework', 'family-financial-planning', 'personal-net-worth-calculator-guide', 'how-inflation-affects-your-savings'],
  'best-money-habits-of-millionaires': ['how-to-build-wealth-from-scratch', 'financial-independence-guide', 'smart-spending-habits', 'how-to-improve-financial-discipline', 'passive-income-ideas'],
  'how-inflation-affects-your-savings': ['emergency-fund-guide', 'how-much-savings-should-you-have', 'how-to-build-wealth-from-scratch', 'passive-income-ideas', 'financial-goals-framework'],
  'financial-independence-guide': ['how-to-build-wealth-from-scratch', 'passive-income-ideas', 'best-money-habits-of-millionaires', 'personal-net-worth-calculator-guide', 'financial-goals-framework'],
  'debt-snowball-vs-debt-avalanche': ['common-money-mistakes', 'how-to-create-a-monthly-budget', 'emergency-fund-guide', 'how-to-improve-financial-discipline', 'financial-goals-framework'],
  'how-to-improve-financial-discipline': ['smart-spending-habits', 'how-to-track-expenses', 'financial-goals-framework', 'common-money-mistakes', 'how-to-create-a-monthly-budget'],
  'best-personal-finance-apps': ['how-to-track-expenses', 'how-to-create-a-monthly-budget', 'personal-net-worth-calculator-guide', 'smart-spending-habits', 'debt-snowball-vs-debt-avalanche'],
  'how-to-track-expenses': ['how-to-create-a-monthly-budget', 'best-personal-finance-apps', 'smart-spending-habits', '50-30-20-budget-rule-explained', 'how-to-improve-financial-discipline'],
  'common-money-mistakes': ['emergency-fund-guide', 'debt-snowball-vs-debt-avalanche', 'smart-spending-habits', 'how-to-improve-financial-discipline', 'how-to-create-a-monthly-budget'],
  'family-financial-planning': ['how-to-create-a-monthly-budget', 'emergency-fund-guide', 'financial-goals-framework', 'how-much-savings-should-you-have', 'how-to-build-wealth-from-scratch'],
  'smart-spending-habits': ['how-to-improve-financial-discipline', 'how-to-track-expenses', 'common-money-mistakes', 'how-to-create-a-monthly-budget', '50-30-20-budget-rule-explained'],
  'financial-goals-framework': ['how-much-savings-should-you-have', 'emergency-fund-guide', 'how-to-build-wealth-from-scratch', 'family-financial-planning', 'how-to-improve-financial-discipline'],
  'how-to-build-wealth-from-scratch': ['financial-independence-guide', 'passive-income-ideas', 'best-money-habits-of-millionaires', 'personal-net-worth-calculator-guide', 'how-much-savings-should-you-have'],
  'passive-income-ideas': ['side-hustles-for-beginners', 'how-to-build-wealth-from-scratch', 'financial-independence-guide', 'best-money-habits-of-millionaires', 'how-inflation-affects-your-savings'],
  'side-hustles-for-beginners': ['passive-income-ideas', 'how-to-build-wealth-from-scratch', 'money-management-for-students', 'financial-goals-framework', 'smart-spending-habits'],
  'personal-net-worth-calculator-guide': ['how-much-savings-should-you-have', 'how-to-build-wealth-from-scratch', 'financial-goals-framework', 'financial-independence-guide', 'best-personal-finance-apps'],
  'money-management-for-students': ['how-to-create-a-monthly-budget', 'how-to-track-expenses', 'side-hustles-for-beginners', 'emergency-fund-guide', 'how-to-improve-financial-discipline'],
};

// ── HTML helpers (mirror cms-public.ts: paragraph/heading escape, html passes through) ──
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Escape, then re-enable a tiny, safe inline subset authored in the prose:
//   **bold**            → <strong>bold</strong>
//   [anchor](/slug)     → <a href="/slug">anchor</a>   (internal or http(s) only)
function inline(text) {
  let s = esc(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(
    /\[([^\]]+)\]\((\/[A-Za-z0-9\-/_#?=&.]+|https?:\/\/[^\s)]+)\)/g,
    '<a href="$2">$1</a>',
  );
  return s;
}

// ── block factory ──────────────────────────────────────────────────────────
function makeBlocks(spec, { appendAuthor }) {
  const blocks = [];
  let order = 0;
  const push = (type, content) => blocks.push({ id: `blk-${order}`, type, order: order++, content });
  const htmlBlock = (html) => push('html', { html });
  const paras = (arr) => (arr || []).forEach((p) => p && p.trim() && htmlBlock(`<p>${inline(p)}</p>`));

  // Intro (\n\n-separated paragraphs)
  if (spec.intro) paras(String(spec.intro).split(/\n{2,}/));

  // Table of contents
  if (Array.isArray(spec.tableOfContents) && spec.tableOfContents.length) {
    const items = spec.tableOfContents.map((t) => `<li>${esc(t)}</li>`).join('');
    htmlBlock(`<div class="toc"><p class="toc-title"><strong>Table of contents</strong></p><ol>${items}</ol></div>`);
  }

  // Sections
  for (const sec of spec.sections || []) {
    if (sec.heading) push('heading', { level: 2, text: sec.heading });
    paras(sec.paragraphs);
    if (sec.table && Array.isArray(sec.table.headers)) {
      if (sec.table.caption) htmlBlock(`<p class="table-caption"><em>${esc(sec.table.caption)}</em></p>`);
      push('table', { headers: sec.table.headers, rows: sec.table.rows || [] });
    }
    if (sec.callout && sec.callout.text) {
      const t = sec.callout.title ? `${sec.callout.title}: ${sec.callout.text}` : sec.callout.text;
      push('callout', { variant: 'info', text: t });
    }
    if (sec.quote && sec.quote.text) push('quote', { text: sec.quote.text, cite: sec.quote.cite || '' });
    for (const sub of sec.subsections || []) {
      if (sub.heading) push('heading', { level: 3, text: sub.heading });
      paras(sub.paragraphs);
    }
  }

  // Key takeaways
  if (Array.isArray(spec.keyTakeaways) && spec.keyTakeaways.length) {
    push('heading', { level: 2, text: 'Key Takeaways' });
    htmlBlock(`<ul class="key-takeaways">${spec.keyTakeaways.map((k) => `<li>${inline(k)}</li>`).join('')}</ul>`);
  }

  // FAQ
  if (Array.isArray(spec.faq) && spec.faq.length) {
    push('heading', { level: 2, text: 'Frequently Asked Questions' });
    for (const f of spec.faq) {
      if (!f || !f.question) continue;
      push('heading', { level: 3, text: f.question });
      htmlBlock(`<p>${inline(f.answer || '')}</p>`);
    }
  }

  // Conclusion
  if (spec.conclusion) {
    push('heading', { level: 2, text: 'Conclusion' });
    paras(String(spec.conclusion).split(/\n{2,}/));
  }

  // Related guides — prefer the curated cross-link map (articles), fall back to
  // the spec's own internalLinks (pages). Guarantees balanced internal linking.
  const curated = RELATED[spec.slug];
  let related;
  if (curated) {
    related = curated
      .filter((s) => s !== spec.slug && SLUG_TITLE[s])
      .map((s) => ({ slug: s, anchor: SLUG_TITLE[s] }));
  } else {
    related = (spec.internalLinks || []).filter((l) => l && l.slug && l.anchor);
  }
  if (related.length) {
    push('heading', { level: 2, text: 'Related Imperialpedia Guides' });
    const items = related
      .map((l) => `<li><a href="/articles/${esc(l.slug)}">${esc(l.anchor)}</a></li>`)
      .join('');
    // Article related-lists also link back to the Personal Finance hub for SEO.
    const hub = curated ? '<li><a href="/personal-finance">Explore all Personal Finance guides &rarr;</a></li>' : '';
    htmlBlock(`<ul class="related-guides">${items}${hub}</ul>`);
  }

  // Author box
  if (appendAuthor) {
    push('divider', {});
    htmlBlock(
      `<div class="author-bio">` +
        `<p><strong>Written by ${esc(AUTHOR.name)}</strong><br/>${esc(AUTHOR.title)}<br/>${esc(AUTHOR.site)}</p>` +
        `<p>${esc(AUTHOR.bio)}</p>` +
        `</div>`,
    );
  }

  return blocks;
}

// Rough body word count for the length guardrail.
function wordCount(spec) {
  const parts = [];
  if (spec.intro) parts.push(spec.intro);
  for (const s of spec.sections || []) {
    parts.push(...(s.paragraphs || []));
    for (const sub of s.subsections || []) parts.push(...(sub.paragraphs || []));
  }
  for (const f of spec.faq || []) parts.push(f.answer || '');
  if (spec.conclusion) parts.push(spec.conclusion);
  return parts.join(' ').split(/\s+/).filter(Boolean).length;
}

function buildContentDoc(spec, { contentType, categoryId, appendAuthor }) {
  const seo = spec.seo || {};
  const keywords = [seo.focusKeyword, ...(seo.secondaryKeywords || [])].filter(Boolean).slice(0, 15);
  const doc = {
    title: String(spec.title).slice(0, 500),
    slug: spec.slug,
    contentType,
    excerpt: (spec.excerpt || seo.metaDescription || '').slice(0, 2000),
    contentBlocks: makeBlocks(spec, { appendAuthor }),
    seoMetadata: {
      title: (seo.seoTitle || spec.title || '').slice(0, 200),
      description: (seo.metaDescription || spec.excerpt || '').slice(0, 500),
      keywords,
    },
    visibility: 'public',
    customFields: {
      focusKeyword: seo.focusKeyword || null,
      secondaryKeywords: seo.secondaryKeywords || [],
      searchIntent: seo.searchIntent || null,
      schemaRecommendation: seo.schemaRecommendation || null,
      internalLinks: spec.internalLinks || [],
      externalSources: spec.externalSources || [],
      keyTakeaways: spec.keyTakeaways || [],
      faq: spec.faq || [],
      author: { name: AUTHOR.name, title: AUTHOR.title, site: AUTHOR.site },
      wordCount: wordCount(spec),
    },
  };
  if (categoryId) doc.categoryId = categoryId;
  return doc;
}

module.exports = { AUTHOR, SLUG_TITLE, RELATED, esc, inline, makeBlocks, wordCount, buildContentDoc };
