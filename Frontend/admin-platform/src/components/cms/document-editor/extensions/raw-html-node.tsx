import { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import DOMPurify from 'isomorphic-dompurify';
import { Code, Pencil, Eye } from 'lucide-react';

export interface RawHtmlOptions {
  HTMLAttributes: Record<string, unknown>;
}

function RawHtmlView({ node, updateAttributes }: ReactNodeViewProps) {
  const [editing, setEditing] = useState(!node.attrs.html);
  const html = (node.attrs.html as string) || '';
  const isUnsupported = Boolean(node.attrs.originalBlock);

  return (
    <NodeViewWrapper className="my-2 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b px-2.5 py-1">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Code className="h-3 w-3" />
          {isUnsupported ? 'Unsupported block type — preserved as-is, editing replaces it with HTML' : 'Raw HTML — advanced'}
        </span>
        <button
          type="button"
          contentEditable={false}
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {editing ? <><Eye className="h-3 w-3" /> Preview</> : <><Pencil className="h-3 w-3" /> Edit</>}
        </button>
      </div>
      {editing ? (
        <textarea
          className="w-full resize-none rounded-b-lg border-0 bg-transparent p-3 font-mono text-xs focus:outline-none min-h-[100px]"
          placeholder="<p>Raw HTML…</p>"
          value={html}
          onChange={(e) => updateAttributes({ html: e.target.value })}
        />
      ) : (
        <div className="p-3 text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
      )}
    </NodeViewWrapper>
  );
}

export const RawHtmlNode = Node.create<RawHtmlOptions>({
  name: 'rawHtml',
  group: 'block',
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-html') || '',
        renderHTML: (attrs) => ({ 'data-html': attrs.html }),
      },
      // Set only for block types this editor has no dedicated UI for yet (gallery, columns).
      // Holds the original `{id, type, content}` JSON so a save round-trips it unchanged
      // instead of flattening it into a lossy plain-html block — see converters.ts.
      originalBlock: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-original-block') || null,
        renderHTML: (attrs) => (attrs.originalBlock ? { 'data-original-block': attrs.originalBlock } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="raw-html"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'raw-html' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RawHtmlView);
  },
});
