'use client';

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import DOMPurify from 'isomorphic-dompurify';
import type { ContentBlock } from '@/lib/types/cms-content.types';
import { documentEditorExtensions } from './extensions';
import { blocksToTiptapContent, tiptapContentToBlocks } from './converters';
import BubbleMenuBar from './BubbleMenuBar';
import { mediaApi } from '@/lib/api/media';

interface Props {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

const AUTOSAVE_DEBOUNCE_MS = 400;

// Sanitizes pasted HTML (ChatGPT/Word/Google Docs paste garbage) via DOMPurify — strips
// dangerous tags/attributes plus inline styles, foreign classes, and data-* cruft that bring
// invisible text colors and junk markup. Unwraps span/font (keeps their text, drops the tag).
// A hand-rolled regex-strip loop previously did this and was flagged by CodeQL as an
// incomplete sanitizer (crafted input could survive the strip and still contain `<script`) —
// DOMPurify is the battle-tested tool for this, not a bigger regex.
function sanitizePastedHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['font', 'span'],
    FORBID_ATTR: ['style', 'class', 'lang', 'dir', 'align', 'id'],
  });
}

export default function DocumentEditor({ blocks, onChange }: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const editor = useEditor({
    extensions: documentEditorExtensions,
    content: blocksToTiptapContent(blocks),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[300px] text-sm leading-relaxed focus:outline-none ' +
          '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 ' +
          '[&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:text-xl [&_h2]:font-bold ' +
          '[&_h3]:mt-2 [&_h3]:text-lg [&_h3]:font-semibold [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline ' +
          '[&_p]:mb-2 [&_pre]:my-2 [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs ' +
          '[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-muted [&_th]:p-2',
      },
      transformPastedHTML: sanitizePastedHtml,
      handleDrop: (view, event) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from;
        void uploadAndInsertImage(file, pos);
        return true;
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
        if (!file) return false;
        event.preventDefault();
        void uploadAndInsertImage(file);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onChangeRef.current(tiptapContentToBlocks(ed));
      }, AUTOSAVE_DEBOUNCE_MS);
    },
  });

  const uploadAndInsertImage = async (file: File, pos?: number) => {
    if (!editor) return;
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await mediaApi.files.upload(form);
      const url = res.data.data.url;
      const chain = editor.chain().focus();
      if (pos !== undefined) chain.insertContentAt(pos, { type: 'image', attrs: { src: url } });
      else chain.insertContent({ type: 'image', attrs: { src: url } });
      chain.run();
    } catch {
      /* surfaced by the global toast layer */
    }
  };

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  if (!editor) return null;

  return (
    <div className="document-editor">
      <BubbleMenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
