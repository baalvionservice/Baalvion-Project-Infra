import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { Video } from 'lucide-react';

export interface VideoOptions {
  HTMLAttributes: Record<string, unknown>;
}

function VideoView({ node, updateAttributes }: ReactNodeViewProps) {
  const src = (node.attrs.src as string) || '';
  return (
    <NodeViewWrapper className="my-2 space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          contentEditable={false}
          className="flex-1 border-0 bg-transparent text-sm focus:outline-none"
          placeholder="Video URL"
          value={src}
          onChange={(e) => updateAttributes({ src: e.target.value })}
        />
      </div>
      {src && <video src={src} controls contentEditable={false} className="max-h-64 rounded" />}
    </NodeViewWrapper>
  );
}

export const VideoNode = Node.create<VideoOptions>({
  name: 'video',
  group: 'block',
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-src') || '',
        renderHTML: (attrs) => ({ 'data-src': attrs.src }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'video-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoView);
  },
});
