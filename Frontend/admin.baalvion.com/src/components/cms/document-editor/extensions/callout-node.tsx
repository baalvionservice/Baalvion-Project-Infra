import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type ReactNodeViewProps } from '@tiptap/react';
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { variant?: string }) => ReturnType;
    };
  }
}

const VARIANT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
};

const VARIANT_CLASS: Record<string, string> = {
  info: 'border-blue-300 bg-blue-50 text-blue-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  error: 'border-red-300 bg-red-50 text-red-900',
};

function CalloutView({ node, updateAttributes }: ReactNodeViewProps) {
  const variant = (node.attrs.variant as string) || 'info';
  const Icon = VARIANT_ICON[variant] ?? Info;

  return (
    <NodeViewWrapper className={`my-2 flex gap-2 rounded-lg border px-3 py-2.5 ${VARIANT_CLASS[variant] ?? VARIANT_CLASS.info}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <select
          contentEditable={false}
          className="mb-1 rounded border-0 bg-white/60 px-1.5 py-0.5 text-[11px] font-medium capitalize focus:outline-none"
          value={variant}
          onChange={(e) => updateAttributes({ variant: e.target.value })}
        >
          {['info', 'warning', 'success', 'error'].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <NodeViewContent className="text-sm leading-relaxed [&_p]:m-0" as="div" />
      </div>
    </NodeViewWrapper>
  );
}

export const CalloutNode = Node.create<CalloutOptions>({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,
  isolating: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (el) => el.getAttribute('data-variant') || 'info',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'callout' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) =>
          commands.wrapIn(this.name, attrs),
    };
  },
});
