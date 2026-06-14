'use client';

import type { ContentBlock } from '@/lib/types/cms-content.types';

// Renders content blocks the way the public site does, with real typography — so authors
// can see fonts, bold, lists and inline images before publishing. Paragraph/HTML blocks
// render their stored HTML; everything else gets a styled equivalent.
const proseChild =
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1.5 ' +
  '[&_strong]:font-semibold [&_em]:italic [&_a]:text-primary [&_a]:underline ' +
  '[&_img]:my-4 [&_img]:rounded-xl [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:mb-4';

function Block({ block }: { block: ContentBlock }) {
  const c = block.content as Record<string, unknown>;
  switch (block.type) {
    case 'paragraph':
      return <div className={`leading-[1.8] text-[15px] text-gray-800 ${proseChild}`} dangerouslySetInnerHTML={{ __html: (c.text as string) || '' }} />;
    case 'heading': {
      const lvl = Math.min(6, Math.max(1, Number(c.level) || 2));
      const Tag = (`h${lvl}` as keyof JSX.IntrinsicElements);
      const size = lvl <= 1 ? 'text-3xl' : lvl === 2 ? 'text-2xl' : lvl === 3 ? 'text-xl' : 'text-lg';
      return <Tag className={`mt-6 mb-2 font-bold tracking-tight ${size}`}>{(c.text as string) || ''}</Tag>;
    }
    case 'image':
      return (
        <figure className="my-6">
          {(c.src as string) && <img src={c.src as string} alt={(c.alt as string) || ''} className="w-full rounded-xl object-cover" />}
          {(c.caption as string) && <figcaption className="mt-2 text-center text-xs text-gray-500">{c.caption as string}</figcaption>}
        </figure>
      );
    case 'quote':
      return (
        <blockquote className="my-6 border-l-4 border-primary pl-5 text-lg italic text-gray-700">
          {(c.text as string) || ''}
          {(c.cite as string) && <footer className="mt-2 text-sm not-italic text-gray-500">— {c.cite as string}</footer>}
        </blockquote>
      );
    case 'callout': {
      const variant = (c.variant as string) || 'info';
      const styles: Record<string, string> = {
        info: 'border-blue-200 bg-blue-50 text-blue-900',
        warning: 'border-amber-200 bg-amber-50 text-amber-900',
        success: 'border-green-200 bg-green-50 text-green-900',
        error: 'border-rose-200 bg-rose-50 text-rose-900',
      };
      return <div className={`my-5 rounded-lg border px-4 py-3 text-sm ${styles[variant] ?? styles.info}`}>{(c.text as string) || ''}</div>;
    }
    case 'code':
      return <pre className="my-5 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100"><code>{(c.code as string) || ''}</code></pre>;
    case 'divider':
      return <hr className="my-8 border-gray-200" />;
    case 'button':
      return (
        <div className="my-4">
          <span className="inline-flex items-center rounded-md bg-black px-5 py-2.5 text-sm font-semibold text-white">{(c.text as string) || 'Button'}</span>
        </div>
      );
    case 'html':
      return <div className={proseChild} dangerouslySetInnerHTML={{ __html: (c.html as string) || '' }} />;
    case 'video':
    case 'embed': {
      const url = (c.src as string) || (c.url as string);
      return url ? <div className="my-5 text-sm"><a href={url} className="text-primary underline" target="_blank" rel="noopener noreferrer">{url}</a></div> : null;
    }
    default:
      return null;
  }
}

export default function ContentPreview({ title, blocks }: { title: string; blocks: ContentBlock[] }) {
  return (
    <article className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-8 text-4xl font-bold tracking-tight text-gray-900">{title || 'Untitled'}</h1>
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to preview yet — add some content.</p>
      ) : (
        [...blocks].sort((a, b) => a.order - b.order).map((b) => <Block key={b.id} block={b} />)
      )}
    </article>
  );
}
