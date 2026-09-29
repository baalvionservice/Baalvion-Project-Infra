import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { MousePointer } from 'lucide-react';

export interface ButtonBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

function ButtonBlockView({ node, updateAttributes }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className="my-2 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      <MousePointer className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        contentEditable={false}
        className="w-36 shrink-0 rounded border bg-background px-2 py-1 text-sm focus:outline-none"
        placeholder="Button text"
        value={(node.attrs.text as string) || ''}
        onChange={(e) => updateAttributes({ text: e.target.value })}
      />
      <input
        contentEditable={false}
        className="flex-1 border-0 bg-transparent text-sm focus:outline-none"
        placeholder="URL"
        value={(node.attrs.href as string) || ''}
        onChange={(e) => updateAttributes({ href: e.target.value })}
      />
    </NodeViewWrapper>
  );
}

export const ButtonBlockNode = Node.create<ButtonBlockOptions>({
  name: 'buttonBlock',
  group: 'block',
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      text: {
        default: 'Click me',
        parseHTML: (el) => el.getAttribute('data-text') || 'Click me',
        renderHTML: (attrs) => ({ 'data-text': attrs.text }),
      },
      href: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-href') || '',
        renderHTML: (attrs) => ({ 'data-href': attrs.href }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="button-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'button-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonBlockView);
  },
});
