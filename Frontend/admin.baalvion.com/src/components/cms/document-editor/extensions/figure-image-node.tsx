import { useRef, useState } from 'react';
import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';

function FigureImageView({ node, updateAttributes }: ReactNodeViewProps) {
  const src = (node.attrs.src as string) || '';
  const alt = (node.attrs.alt as string) || '';
  const caption = (node.attrs.caption as string) || '';
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await mediaApi.files.upload(form);
      updateAttributes({ src: res.data.data.url });
    } catch {
      /* surfaced by the global toast layer */
    } finally {
      setUploading(false);
    }
  };

  if (!src) {
    return (
      <NodeViewWrapper className="my-2 rounded-lg border-2 border-dashed p-6 text-center">
        <ImageIcon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <input
          contentEditable={false}
          className="mx-auto mb-2 block w-full max-w-xs rounded border bg-background px-2 py-1 text-center text-xs focus:outline-none"
          placeholder="Paste an image URL…"
          onChange={(e) => updateAttributes({ src: e.target.value })}
        />
        <button
          type="button"
          contentEditable={false}
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          className="mx-auto flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload image
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-2">
      <img src={src} alt={alt || ''} className="max-h-96 rounded-lg" contentEditable={false} />
      <input
        contentEditable={false}
        className="mt-1 w-full border-0 bg-transparent text-center text-xs text-muted-foreground focus:outline-none"
        placeholder="Caption (optional)"
        value={caption || ''}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
      />
    </NodeViewWrapper>
  );
}

// Extends the stock Image node with a `caption` attribute (rendered/edited inline below the
// image) so the block round-trips with the existing `{src, alt, caption}` image block shape.
export const FigureImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-caption') || '',
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-caption': attrs.caption }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(FigureImageView);
  },
});
