/**
 * Generic file-based loader for evergreen research/education sections
 * (`/insights`, `/research`). Mirrors the approach of `@/lib/guides`: Markdown
 * authored under `content-gen/<section>/*.md` is parsed at build time into the
 * shared `RichDoc` shape the `AuthorityDoc` renderer understands, so these pages
 * render identically to the CMS-backed surfaces without requiring the CMS.
 *
 * Difference from `@/lib/guides`: this parser accepts FAQ questions written
 * either as bold lines (`**Question?**`) or as `###`/`####` headings, since the
 * Batch-1 research articles use both conventions.
 *
 * Server-only by construction: reads the filesystem during static generation,
 * so it must only be imported by server components.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { RichDoc, RichBlock, FaqItem } from '@/lib/cms';

const CONTENT_ROOT = path.join(process.cwd(), 'content-gen');

// Body headings that mark editorial production notes, not reader content.
// Parsing stops at the first one; everything below is dropped from the page.
const STOP_HEADINGS = new Set([
  'internal linking recommendations',
  'cta recommendations',
  'call-to-action recommendations',
  'schema markup recommendations',
]);

interface FrontMatter {
  title?: string;
  seo_title?: string;
  meta_description?: string;
  target_keyword?: string;
  secondary_keywords?: string[];
  canonical?: string;
  category?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Inline markdown → HTML for table cells (escape, then re-introduce bold + links). */
function cellHtml(raw: string): string {
  let s = escapeHtml(raw.trim());
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => {
    const internal = href.startsWith('/');
    const rel = internal ? '' : ' target="_blank" rel="noopener noreferrer"';
    return `<a href="${href}"${rel}>${label}</a>`;
  });
  return s;
}

function parseFrontMatter(lines: string[]): { fm: FrontMatter; rest: string[] } {
  if (lines[0]?.trim() !== '---') return { fm: {}, rest: lines };
  const fm: FrontMatter = {};
  let i = 1;
  let currentListKey: keyof FrontMatter | null = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') {
      i++;
      break;
    }
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentListKey === 'secondary_keywords') {
      (fm.secondary_keywords ||= []).push(listItem[1].trim().replace(/^["']|["']$/g, ''));
      continue;
    }
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1] as keyof FrontMatter;
      const value = kv[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'secondary_keywords' && value === '') {
        fm.secondary_keywords = [];
        currentListKey = 'secondary_keywords';
      } else {
        // @ts-expect-error narrow string assignment for known keys
        fm[key] = value;
        currentListKey = null;
      }
    }
  }
  return { fm, rest: lines.slice(i) };
}

function parseBody(lines: string[]): { blocks: RichBlock[]; faqs: FaqItem[]; words: number } {
  const blocks: RichBlock[] = [];
  const faqs: FaqItem[] = [];
  let para: string[] = [];
  let quote: string[] = [];
  let mode: 'body' | 'faq' = 'body';
  let faqQ: string | null = null;
  let faqA: string[] = [];
  let words = 0;

  const countWords = (s: string) => {
    words += s.split(/\s+/).filter(Boolean).length;
  };
  const flushPara = () => {
    if (para.length) {
      const text = para.join(' ').trim();
      countWords(text);
      blocks.push({ type: 'paragraph', text });
      para = [];
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      blocks.push({ type: 'quote', text: quote.join(' ').trim() });
      quote = [];
    }
  };
  const flushFaq = () => {
    if (faqQ) {
      faqs.push({ q: faqQ, a: faqA.join(' ').trim() });
      faqQ = null;
      faqA = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Heading
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      flushQuote();
      const level = h[1].length;
      const text = h[2].trim();
      const lower = text.toLowerCase();
      // Inside an FAQ block, a level-3+ heading is a question, not a new section.
      if (mode === 'faq' && level >= 3) {
        flushFaq();
        faqQ = text;
        continue;
      }
      if (STOP_HEADINGS.has(lower)) break; // editorial notes follow — stop the body
      if (/frequently asked questions/.test(lower)) {
        flushFaq();
        mode = 'faq';
        continue;
      }
      if (mode === 'faq') {
        flushFaq();
        mode = 'body';
      }
      if (level === 1) continue; // title is shown in the hero
      blocks.push({ type: 'heading', level, text });
      continue;
    }

    // FAQ mode: bold-line question (`**question**`) then answer paragraph(s)
    if (mode === 'faq') {
      const q = trimmed.match(/^\*\*(.+?)\*\*$/);
      if (q) {
        flushFaq();
        faqQ = q[1].trim();
        continue;
      }
      if (trimmed === '') continue;
      if (faqQ) faqA.push(trimmed);
      continue;
    }

    // Code fence → <pre> html block (ASCII flow diagrams)
    if (trimmed.startsWith('```')) {
      flushPara();
      flushQuote();
      const buf: string[] = [];
      i++;
      for (; i < lines.length; i++) {
        if (lines[i].trim().startsWith('```')) break;
        buf.push(lines[i]);
      }
      blocks.push({ type: 'html', html: `<pre class="section-pre">${escapeHtml(buf.join('\n'))}</pre>` });
      continue;
    }

    // Table → <table> html block
    if (trimmed.startsWith('|') && lines[i + 1] && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushPara();
      flushQuote();
      const rows: string[][] = [];
      const toCells = (l: string) =>
        l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const header = toCells(line);
      i++; // separator row
      for (i++; i < lines.length; i++) {
        if (!lines[i].trim().startsWith('|')) {
          i--;
          break;
        }
        rows.push(toCells(lines[i]));
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${cellHtml(c)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${cellHtml(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`;
      blocks.push({ type: 'html', html: `<table class="section-table">${thead}${tbody}</table>` });
      continue;
    }

    // Blockquote
    const bq = trimmed.match(/^>\s?(.*)$/);
    if (bq) {
      flushPara();
      quote.push(bq[1]);
      continue;
    }

    // Unordered list
    const ul = trimmed.match(/^[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      flushQuote();
      const items: string[] = [];
      for (; i < lines.length; i++) {
        const m = lines[i].trim().match(/^[-*]\s+(.*)$/);
        if (!m) {
          i--;
          break;
        }
        countWords(m[1]);
        items.push(m[1]);
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    // Ordered list
    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushPara();
      flushQuote();
      const items: string[] = [];
      for (; i < lines.length; i++) {
        const m = lines[i].trim().match(/^\d+\.\s+(.*)$/);
        if (!m) {
          i--;
          break;
        }
        countWords(m[1]);
        items.push(m[1]);
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    // Horizontal rule / blank → flush
    if (trimmed === '---' || trimmed === '') {
      flushPara();
      flushQuote();
      continue;
    }

    // Default: paragraph text
    flushQuote();
    para.push(trimmed);
  }

  flushPara();
  flushQuote();
  flushFaq();
  return { blocks, faqs, words };
}

function parseDoc(slug: string, raw: string, kind: string): RichDoc {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const { fm, rest } = parseFrontMatter(lines);
  const { blocks, faqs, words } = parseBody(rest);
  const title = fm.title || slug;
  const keywords = [fm.target_keyword, ...(fm.secondary_keywords || [])].filter((k): k is string => !!k);
  const readMinutes = Math.max(1, Math.round(words / 200));
  return {
    id: slug,
    slug,
    title,
    excerpt: fm.meta_description,
    kind,
    category: fm.category || 'trade',
    author: 'Baalvion Research',
    readTime: `${readMinutes} min read`,
    blocks,
    faqs,
    custom: { kind, target_keyword: fm.target_keyword },
    seo: {
      title: fm.seo_title || title,
      description: fm.meta_description,
      keywords: keywords.length ? keywords : undefined,
      canonical: fm.canonical,
    },
    createdAt: '2026-06-16',
    updatedAt: '2026-06-16',
  };
}

const caches: Record<string, RichDoc[]> = {};

/** Load and parse all Markdown docs in `content-gen/<dirName>` as `kind`. */
export function loadSection(dirName: string, kind: string, order: string[] = []): RichDoc[] {
  const key = `${dirName}:${kind}`;
  if (caches[key]) return caches[key];
  const dir = path.join(CONTENT_ROOT, dirName);
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  } catch {
    return [];
  }
  const docs = files.map((f) => parseDoc(f.replace(/\.md$/, ''), fs.readFileSync(path.join(dir, f), 'utf8'), kind));
  docs.sort((a, b) => {
    const ia = order.indexOf(a.slug);
    const ib = order.indexOf(b.slug);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  caches[key] = docs;
  return docs;
}
