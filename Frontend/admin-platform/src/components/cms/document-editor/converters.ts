import { generateJSON, getHTMLFromFragment, type Editor, type JSONContent } from '@tiptap/core';
import { Fragment, type Node as PMNode } from '@tiptap/pm/model';
import type { ContentBlock, BlockType } from '@/lib/types/cms-content.types';
import { documentEditorExtensions } from './extensions';

// ─── ContentBlock[] → Tiptap doc (seeding the editor) ───────────────────────

export function blocksToTiptapContent(blocks: ContentBlock[]): JSONContent {
  const content = [...blocks]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .flatMap(blockToNodes);
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

function textNode(text?: unknown): JSONContent[] {
  return typeof text === 'string' && text ? [{ type: 'text', text }] : [];
}

function clampLevel(level: unknown): number {
  return Math.min(Math.max(Number(level) || 2, 1), 6);
}

// Arbitrary author HTML (paragraph / legacy html blocks) is parsed against the real editor
// schema, so hand-written `<p>`/`<ul><li>`/`<h2>` markup upgrades into real, editable rich-text
// nodes on load — not just an inert HTML blob. Anything the parser can't place falls back to
// the RawHtml escape hatch untouched, so nothing is ever silently lost.
function htmlToNodes(html: unknown): JSONContent[] {
  if (typeof html !== 'string' || !html.trim()) return [];
  try {
    const doc = generateJSON(html, documentEditorExtensions);
    const nodes = (doc.content as JSONContent[] | undefined) ?? [];
    if (nodes.length) return nodes;
  } catch {
    /* fall through to raw passthrough below */
  }
  return [{ type: 'rawHtml', attrs: { html } }];
}

function unsupportedNotice(type: string): string {
  return `<p>This "${type}" block isn't editable here yet — it's preserved unchanged. Editing this text replaces it with plain HTML instead.</p>`;
}

function tableToNode(c: Record<string, unknown>): JSONContent {
  const headers = Array.isArray(c.headers) ? (c.headers as unknown[]) : [];
  const rows = Array.isArray(c.rows) ? (c.rows as unknown[][]) : [];
  const cell = (type: 'tableCell' | 'tableHeader', value: unknown): JSONContent => ({
    type,
    content: [{ type: 'paragraph', content: textNode(String(value ?? '')) }],
  });
  const tableRows: JSONContent[] = [];
  if (headers.length) tableRows.push({ type: 'tableRow', content: headers.map((h) => cell('tableHeader', h)) });
  for (const row of rows) {
    tableRows.push({ type: 'tableRow', content: (Array.isArray(row) ? row : []).map((c2) => cell('tableCell', c2)) });
  }
  if (!tableRows.length) tableRows.push({ type: 'tableRow', content: [cell('tableHeader', ''), cell('tableHeader', '')] });
  return { type: 'table', content: tableRows };
}

function blockToNodes(block: ContentBlock): JSONContent[] {
  const c = (block.content ?? {}) as Record<string, unknown>;
  switch (block.type) {
    case 'paragraph':
      return htmlToNodes(c.text);
    case 'heading':
      return [{ type: 'heading', attrs: { level: clampLevel(c.level) }, content: textNode(c.text) }];
    case 'quote':
      return [{
        type: 'blockquote',
        attrs: { cite: typeof c.cite === 'string' ? c.cite : '' },
        content: [{ type: 'paragraph', content: textNode(c.text) }],
      }];
    case 'code':
      return [{ type: 'codeBlock', attrs: { language: (c.language as string) || 'javascript' }, content: textNode(c.code) }];
    case 'callout':
      return [{ type: 'callout', attrs: { variant: (c.variant as string) || 'info' }, content: textNode(c.text) }];
    case 'divider':
      return [{ type: 'horizontalRule' }];
    case 'image':
      return [{ type: 'image', attrs: { src: (c.src as string) || '', alt: (c.alt as string) || '', caption: (c.caption as string) || '' } }];
    case 'video':
      return [{ type: 'video', attrs: { src: (c.src as string) || '' } }];
    case 'embed':
      return [{ type: 'embed', attrs: { url: (c.url as string) || '' } }];
    case 'button':
      return [{ type: 'buttonBlock', attrs: { text: (c.text as string) || 'Click me', href: (c.href as string) || '' } }];
    case 'table':
      return [tableToNode(c)];
    case 'html':
      return htmlToNodes(c.html);
    default:
      // gallery, columns — no dedicated editor UI yet; preserve exactly as-is.
      return [{
        type: 'rawHtml',
        attrs: { html: unsupportedNotice(block.type), originalBlock: JSON.stringify({ id: block.id, type: block.type, content: block.content }) },
      }];
  }
}

// ─── Tiptap doc → ContentBlock[] (every autosave) ───────────────────────────

function tableNodeToContent(tableNode: PMNode): Record<string, unknown> {
  const headers: string[] = [];
  const rows: string[][] = [];
  tableNode.forEach((rowNode) => {
    const cells: string[] = [];
    let allHeaderCells = true;
    rowNode.forEach((cellNode) => {
      cells.push(cellNode.textContent);
      if (cellNode.type.name !== 'tableHeader') allHeaderCells = false;
    });
    if (allHeaderCells && !headers.length && !rows.length) headers.push(...cells);
    else rows.push(cells);
  });
  return { headers, rows };
}

function safeParseOriginal(json: string): { id?: string; type: BlockType; content: Record<string, unknown> } | null {
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed.type === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function nodeToBlock(node: PMNode, editor: Editor): Omit<ContentBlock, 'id' | 'order'> | null {
  const html = () => getHTMLFromFragment(node.content, editor.schema);
  switch (node.type.name) {
    case 'paragraph':
      return { type: 'paragraph', content: { text: html() } };
    case 'heading':
      return { type: 'heading', content: { text: html(), level: node.attrs.level } };
    case 'blockquote': {
      const inner = node.content.firstChild;
      return { type: 'quote', content: { text: inner ? getHTMLFromFragment(inner.content, editor.schema) : '', cite: node.attrs.cite || '' } };
    }
    case 'codeBlock':
      return { type: 'code', content: { code: node.textContent, language: node.attrs.language || 'javascript' } };
    case 'callout':
      return { type: 'callout', content: { text: html(), variant: node.attrs.variant || 'info' } };
    case 'horizontalRule':
      return { type: 'divider', content: {} };
    case 'image':
      return node.attrs.src ? { type: 'image', content: { src: node.attrs.src, alt: node.attrs.alt || '', caption: node.attrs.caption || '' } } : null;
    case 'video':
      return node.attrs.src ? { type: 'video', content: { src: node.attrs.src, type: 'url' } } : null;
    case 'embed':
      return node.attrs.url ? { type: 'embed', content: { url: node.attrs.url } } : null;
    case 'buttonBlock':
      return { type: 'button', content: { text: node.attrs.text || 'Click me', href: node.attrs.href || '', variant: 'default' } };
    case 'table':
      return { type: 'table', content: tableNodeToContent(node) };
    case 'rawHtml': {
      const original = node.attrs.originalBlock ? safeParseOriginal(node.attrs.originalBlock) : null;
      if (original && node.attrs.html === unsupportedNotice(original.type)) {
        return { type: original.type, content: original.content };
      }
      return { type: 'html', content: { html: node.attrs.html || '' } };
    }
    default:
      // Any other native node (bullet/ordered lists, etc.) — serialize as trusted HTML rather
      // than force it through the plain-paragraph shape, which would mis-wrap block markup.
      return { type: 'html', content: { html: getHTMLFromFragment(Fragment.from(node), editor.schema) } };
  }
}

export function tiptapContentToBlocks(editor: Editor): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let order = 0;
  editor.state.doc.forEach((node) => {
    const block = nodeToBlock(node, editor);
    if (block) blocks.push({ id: crypto.randomUUID(), order: order++, ...block });
  });
  return blocks;
}
