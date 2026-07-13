import Blockquote from '@tiptap/extension-blockquote';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type ReactNodeViewProps } from '@tiptap/react';

function QuoteView({ node, updateAttributes }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className="my-2 border-l-4 border-primary pl-4">
      <NodeViewContent className="text-sm italic leading-relaxed [&_p]:m-0" as="div" />
      <input
        contentEditable={false}
        className="mt-1 w-full border-0 bg-transparent text-xs text-muted-foreground focus:outline-none"
        placeholder="— Attribution"
        value={node.attrs.cite || ''}
        onChange={(e) => updateAttributes({ cite: e.target.value })}
      />
    </NodeViewWrapper>
  );
}

// Extends the stock Blockquote node with a `cite` attribution field, editable inline below
// the quote body, so the block round-trips with the existing `{text, cite}` quote block shape.
export const QuoteNode = Blockquote.extend({
  addAttributes() {
    return {
      cite: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-cite') || '',
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-cite': attrs.cite }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(QuoteView);
  },
});
