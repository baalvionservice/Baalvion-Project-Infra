import Link from 'next/link';
import type { ReactNode } from 'react';
import type { RichBlock } from '@/lib/cms';

/**
 * Renders CMS rich blocks (headings / paragraphs / lists / html / quotes) as
 * semantic, well-styled HTML. Supports inline markdown links `[text](/href)`
 * and `**bold**` so internal links inside prose are real, crawlable anchors.
 * Server component — no client JS.
 */

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  // First split on links; bold is applied to non-link text segments.
  LINK_RE.lastIndex = 0;
  let n = 0;
  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderBold(text.slice(lastIndex, match.index), `${keyBase}-t${n}`));
    }
    const [, label, href] = match;
    const isInternal = href.startsWith('/');
    const isExternal = /^https?:\/\//.test(href);
    if (isInternal) {
      nodes.push(
        <Link key={`${keyBase}-l${n}`} href={href} className="text-[#007185] font-medium hover:underline underline-offset-2">
          {label}
        </Link>
      );
    } else if (isExternal) {
      nodes.push(
        <a key={`${keyBase}-l${n}`} href={href} target="_blank" rel="noopener noreferrer" className="text-[#007185] font-medium hover:underline underline-offset-2">
          {label}
        </a>
      );
    } else {
      nodes.push(label);
    }
    lastIndex = match.index + match[0].length;
    n += 1;
  }
  if (lastIndex < text.length) {
    nodes.push(...renderBold(text.slice(lastIndex), `${keyBase}-tend`));
  }
  return nodes;
}

function renderBold(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  BOLD_RE.lastIndex = 0;
  let n = 0;
  while ((match = BOLD_RE.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <strong key={`${keyBase}-b${n}`} className="font-semibold text-gray-900">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
    n += 1;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function RichContent({ blocks }: { blocks: RichBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        const key = `b-${i}`;
        if (b.type === 'heading') {
          const level = b.level || 2;
          const cls =
            level <= 2
              ? 'text-2xl md:text-3xl font-bold text-[#111111] tracking-tight mt-12 mb-2'
              : 'text-xl md:text-2xl font-bold text-[#111111] tracking-tight mt-8 mb-2';
          if (level >= 4) return <h4 key={key} className={cls}>{renderInline(b.text || '', key)}</h4>;
          if (level === 3) return <h3 key={key} className={cls}>{renderInline(b.text || '', key)}</h3>;
          return <h2 key={key} className={cls}>{renderInline(b.text || '', key)}</h2>;
        }
        if (b.type === 'list') {
          const items = b.items || [];
          if (b.ordered) {
            return (
              <ol key={key} className="list-decimal pl-6 space-y-2 text-lg text-gray-700 leading-relaxed">
                {items.map((it, j) => (
                  <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={key} className="list-disc pl-6 space-y-2 text-lg text-gray-700 leading-relaxed">
              {items.map((it, j) => (
                <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={key} className="border-l-4 border-primary pl-6 py-1 text-lg italic text-gray-600">
              {renderInline(b.text || '', key)}
            </blockquote>
          );
        }
        if (b.type === 'html' && b.html) {
          return <div key={key} className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: b.html }} />;
        }
        return (
          <p key={key} className="text-lg text-gray-700 leading-relaxed">
            {renderInline(b.text || '', key)}
          </p>
        );
      })}
    </div>
  );
}
