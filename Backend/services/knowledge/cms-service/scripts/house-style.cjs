'use strict';
/*
 * Reconstructed 2026-09-04 after the original was wiped by an untracked-files clean on
 * the shared main checkout (see project memory). Rebuilt from what was read into context
 * earlier in the same session: FLOORS, measure(), shortfalls() are exact; corpusIssues(),
 * the UK/British-spelling detectors, and TERMS_OF_ART are faithful reconstructions of the
 * same behavior, not a guaranteed byte-for-byte match of the original. Same interface.
 */

const FLOORS = {
  words: 1700,
  sections: 8,
  subsections: 3,
  tables: 2,
  callouts: 2,
  leadParagraphs: 2,
  internalLinks: 3,
  externalLinks: 4,
  keyTakeaways: 6,
  faq: 5,
  citations: 4,
};

// Legitimate proper nouns / regulatory terms of art that legitimately repeat verbatim
// across a batch — exempted from the corpus phrase-collision check below rather than
// forcing a paraphrase that would make the copy less precise.
const TERMS_OF_ART = [
  'internet crime complaint center',
  'consumer sentinel network',
  'federal trade commission',
  'securities and exchange commission',
  'financial conduct authority',
  'consumer financial protection bureau',
  'financial crimes enforcement network',
  'internet crime report',
];

const UK_DATE = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
const BRITISH = /\b(organisation|colour|favourite|realise|realised|licence|defence|programme|travelled|cancelled|modelled|labelled|behaviour|centre|analyse|analysed|whilst|amongst|towards)\b/gi;

function plain(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function headings(html, tag) {
  const re = new RegExp(`<${tag}>(.*?)</${tag}>`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1].replace(/<[^>]+>/g, '').trim());
  return out;
}

function measure(entry) {
  const b = entry.body;
  const firstH2 = b.indexOf('<h2>');
  const lead = b.slice(0, firstH2 === -1 ? b.length : firstH2);
  const words = plain(b).split(' ').filter(Boolean).length;
  return {
    words,
    sections: headings(b, 'h2').length,
    subsections: headings(b, 'h3').length,
    tables: (b.match(/<table>/g) || []).length,
    callouts: (b.match(/callout callout-/g) || []).length,
    leadParagraphs: (lead.match(/<p>/g) || []).length,
    internalLinks: (b.match(/href="\//g) || []).length,
    externalLinks: (b.match(/href="http/g) || []).length,
    keyTakeaways: (entry.keyTakeaways || []).length,
    faq: (entry.faq || []).length,
    citations: (entry.citations || []).length,
    emDashesPerThousand: ((b.match(/&mdash;|—/g) || []).length / words) * 1000,
  };
}

function flatFields(entry) {
  return [entry.title, entry.seoTitle, entry.seoDescription]
    .concat(entry.keyTakeaways || [], (entry.faq || []).flatMap((f) => [f.question, f.answer]))
    .filter(Boolean)
    .join(' ');
}

function shortfalls(entry) {
  const m = measure(entry);
  const out = [];
  for (const [key, floor] of Object.entries(FLOORS)) {
    if (m[key] < floor) out.push(`${key} ${m[key]} < ${floor}`);
  }
  const h2 = headings(entry.body, 'h2');
  if (h2[h2.length - 1] !== 'The Bottom Line') out.push('last section is not "The Bottom Line"');
  if (m.emDashesPerThousand > 4) out.push(`em-dashes ${m.emDashesPerThousand.toFixed(1)} per 1,000 words > 4`);

  const ukDates = [...`${entry.body} ${flatFields(entry)}`.matchAll(UK_DATE)].map((mm) => mm[0]);
  if (ukDates.length) out.push(`UK date format: ${[...new Set(ukDates)].slice(0, 3).join('; ')}`);

  const british = [...`${entry.body} ${flatFields(entry)}`.matchAll(BRITISH)].map((mm) => mm[0]);
  if (british.length) {
    out.push(`British spelling in US content: ${[...new Set(british)].slice(0, 6).join(', ')}`);
  }

  const flat = flatFields(entry);
  if (/&[a-z]+;/i.test(flat)) out.push('HTML entity in a plain-text field (title, takeaway or FAQ)');

  return out;
}

/** Cross-article checks. Run over the whole batch, not one entry. */
function corpusIssues(entries) {
  const issues = [];

  // Repeated 6-word phrase collision across 3+ articles (a template tell).
  const phraseCounts = new Map();
  for (const e of entries) {
    const words = plain(e.body).toLowerCase().split(' ').filter(Boolean);
    const seenInThisEntry = new Set();
    for (let i = 0; i + 6 <= words.length; i++) {
      const phrase = words.slice(i, i + 6).join(' ');
      if (TERMS_OF_ART.some((t) => phrase.includes(t))) continue;
      if (seenInThisEntry.has(phrase)) continue;
      seenInThisEntry.add(phrase);
      phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
    }
  }
  for (const [phrase, count] of phraseCounts) {
    if (count >= 3) issues.push(`phrase "${phrase}" recurs in ${count} articles`);
  }

  // Paragraph rhythm: a healthy batch has some short (<25-word) paragraphs mixed in.
  let totalParas = 0, shortParas = 0;
  for (const e of entries) {
    const paras = e.body.split('</p>').map((p) => plain(p)).filter(Boolean);
    totalParas += paras.length;
    shortParas += paras.filter((p) => p.split(' ').filter(Boolean).length < 25).length;
  }
  if (totalParas > 0) {
    const pct = Math.round((100 * shortParas) / totalParas);
    if (pct < 15) issues.push(`only ${pct}% of paragraphs are under 25 words (want 15%+) — the rhythm is too even`);
  }

  return issues;
}

module.exports = { FLOORS, TERMS_OF_ART, plain, headings, measure, flatFields, shortfalls, corpusIssues };
