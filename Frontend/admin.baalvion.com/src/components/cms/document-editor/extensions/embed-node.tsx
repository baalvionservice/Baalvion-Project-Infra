import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { Globe } from 'lucide-react';

export interface EmbedOptions {
  HTMLAttributes: Record<string, unknown>;
}

function EmbedView({ node, updateAttributes }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className="my-2 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        contentEditable={false}
        className="flex-1 border-0 bg-transparent text-sm focus:outline-none"
        placeholder="Embed URL (YouTube, Twitter, etc.)"
        value={(node.attrs.url as string) || ''}
        onChange={(e) => updateAttributes({ url: e.target.value })}
      />
    </NodeViewWrapper>
  );
}

export const EmbedNode = Node.create<EmbedOptions>({
  name: 'embed',
  group: 'block',
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      url: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-url') || '',
        renderHTML: (attrs) => ({ 'data-url': attrs.url }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'embed' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedView);
  },
});
