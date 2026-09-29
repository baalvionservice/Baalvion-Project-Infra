import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react/menus';
import { Bold, Italic, Underline, Link2, Heading2, Heading3 } from 'lucide-react';

interface Props {
  editor: Editor;
}

function Btn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export default function BubbleMenuBar({ editor }: Props) {
  const addLink = () => {
    const url = window.prompt('Link URL (https://…)', editor.getAttributes('link').href ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state }) => !state.selection.empty}
      className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-md"
    >
      <Btn active={editor.isActive('bold')} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-3.5 w-3.5" />
      </Btn>
      <Btn active={editor.isActive('italic')} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-3.5 w-3.5" />
      </Btn>
      <Btn active={editor.isActive('underline')} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="h-3.5 w-3.5" />
      </Btn>
      <span className="mx-1 h-4 w-px bg-border" />
      <Btn active={editor.isActive('heading', { level: 2 })} title="Heading" onClick={() => editor.chain().focus().toggleNode('heading', 'paragraph', { level: 2 }).run()}>
        <Heading2 className="h-3.5 w-3.5" />
      </Btn>
      <Btn active={editor.isActive('heading', { level: 3 })} title="Subheading" onClick={() => editor.chain().focus().toggleNode('heading', 'paragraph', { level: 3 }).run()}>
        <Heading3 className="h-3.5 w-3.5" />
      </Btn>
      <span className="mx-1 h-4 w-px bg-border" />
      <Btn active={editor.isActive('link')} title="Link" onClick={addLink}>
        <Link2 className="h-3.5 w-3.5" />
      </Btn>
    </BubbleMenu>
  );
}
