'use client';

import { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link2, Image as ImageIcon, Heading2, Heading3, Eraser, Loader2 } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Dependency-free rich text editor (contentEditable + execCommand). Produces HTML with
// bold/italic/underline, H2/H3, bullet & numbered lists, links and inline images. The
// editor is uncontrolled (we set innerHTML once) to avoid caret jumps on every keystroke.
export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);

  // Seed the DOM once; thereafter the contentEditable owns its own HTML.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(ref.current?.innerHTML ?? '');

  // Sanitise pasted content (from ChatGPT/Word/other sites) — strip inline styles, foreign
  // classes, data-* attributes and span/font wrappers that bring invisible text colours and
  // junk markup. Keeps clean semantic tags + text.
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    let clean: string;
    if (html) {
      // Run the structural strips to a fixpoint: removing a tag/comment can re-form a
      // new one from the surrounding text (e.g. `<sp<span>an>`), so a single pass is not
      // idempotent. Loop until the string stops changing so partial/nested matches are
      // fully removed.
      const stripStructural = (input: string): string => {
        let prev: string;
        let out = input;
        do {
          prev = out;
          out = out
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<\/?(?:html|head|body|meta|link|style|script|o:p|xml)\b[^>]*>/gi, '')
            .replace(/<\/?(?:span|font)\b[^>]*>/gi, ''); // unwrap span/font (keep their text)
        } while (out !== prev);
        return out;
      };
      clean = stripStructural(
        html
          .replace(/\s(?:style|class|lang|dir|align|id)="[^"]*"/gi, '')
          .replace(/\s(?:style|class|lang|dir|align|id)='[^']*'/gi, '')
          .replace(/\sdata-[\w-]+="[^"]*"/gi, '')
          .replace(/\sdata-[\w-]+='[^']*'/gi, ''),
      );
    } else {
      clean = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
    }
    document.execCommand('insertHTML', false, clean);
    emit();
  };

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Link URL (https://…)');
    if (url) exec('createLink', url);
  };

  const insertImageUrl = () => {
    const url = window.prompt('Image URL');
    if (url) exec('insertImage', url);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await mediaApi.files.upload(form);
      exec('insertImage', res.data.data.url);
    } catch {
      /* surfaced by the global toast layer */
    } finally {
      setUploading(false);
    }
  };

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep the selection in the editor
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-md border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1">
        <Btn title="Bold" onClick={() => exec('bold')}><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn title="Italic" onClick={() => exec('italic')}><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn title="Underline" onClick={() => exec('underline')}><Underline className="h-3.5 w-3.5" /></Btn>
        <span className="mx-1 h-4 w-px bg-border" />
        <Btn title="Heading" onClick={() => exec('formatBlock', 'H2')}><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn title="Subheading" onClick={() => exec('formatBlock', 'H3')}><Heading3 className="h-3.5 w-3.5" /></Btn>
        <span className="mx-1 h-4 w-px bg-border" />
        <Btn title="Bullet list" onClick={() => exec('insertUnorderedList')}><List className="h-3.5 w-3.5" /></Btn>
        <Btn title="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <span className="mx-1 h-4 w-px bg-border" />
        <Btn title="Link" onClick={addLink}><Link2 className="h-3.5 w-3.5" /></Btn>
        <Btn title="Insert image by URL" onClick={insertImageUrl}><ImageIcon className="h-3.5 w-3.5" /></Btn>
        <label className="flex h-7 cursor-pointer items-center gap-1 rounded px-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Upload image">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          Upload
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f); e.target.value = ''; }} />
        </label>
        <span className="mx-1 h-4 w-px bg-border" />
        <Btn title="Clear formatting" onClick={() => exec('removeFormat')}><Eraser className="h-3.5 w-3.5" /></Btn>
      </div>

      {/* Editable surface — styled so lists/bold/images render WYSIWYG while typing */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={handlePaste}
        data-placeholder={placeholder ?? 'Write something…'}
        className="min-h-[140px] px-3 py-2.5 text-sm leading-relaxed focus:outline-none
          [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1
          [&_h2]:mt-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:text-lg [&_h3]:font-semibold
          [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_img]:my-2 [&_img]:max-h-72 [&_img]:rounded-lg
          [&_p]:mb-2 empty:before:text-muted-foreground/50 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
