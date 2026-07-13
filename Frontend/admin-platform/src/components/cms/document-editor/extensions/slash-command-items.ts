import type { Editor, Range } from '@tiptap/core';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Info,
  Code2,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Globe,
  MousePointer,
  Video,
  Code,
} from 'lucide-react';

export interface SlashCommandItem {
  title: string;
  group: 'Text' | 'Media' | 'Layout' | 'Advanced';
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  execute: (editor: Editor, range: Range) => void;
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    group: 'Text',
    icon: Heading1,
    keywords: ['h1', 'heading', 'title'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    group: 'Text',
    icon: Heading2,
    keywords: ['h2', 'heading', 'subtitle'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    group: 'Text',
    icon: Heading3,
    keywords: ['h3', 'heading'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Bullet list',
    group: 'Text',
    icon: List,
    keywords: ['ul', 'bullet', 'list'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    group: 'Text',
    icon: ListOrdered,
    keywords: ['ol', 'ordered', 'numbered', 'list'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    group: 'Text',
    icon: Quote,
    keywords: ['quote', 'blockquote', 'cite'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Callout',
    group: 'Text',
    icon: Info,
    keywords: ['callout', 'note', 'info', 'warning', 'tip'],
    execute: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: 'callout', attrs: { variant: 'info' } }).run(),
  },
  {
    title: 'Code block',
    group: 'Text',
    icon: Code2,
    keywords: ['code', 'codeblock', 'snippet'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Image',
    group: 'Media',
    icon: ImageIcon,
    keywords: ['image', 'picture', 'photo', 'upload'],
    execute: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: 'image', attrs: { src: '', alt: '', caption: '' } }).run(),
  },
  {
    title: 'Video',
    group: 'Media',
    icon: Video,
    keywords: ['video', 'mp4'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).insertContent({ type: 'video' }).run(),
  },
  {
    title: 'Table',
    group: 'Layout',
    icon: TableIcon,
    keywords: ['table', 'grid', 'rows', 'columns'],
    execute: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(),
  },
  {
    title: 'Divider',
    group: 'Layout',
    icon: Minus,
    keywords: ['divider', 'separator', 'hr', 'line'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Embed',
    group: 'Media',
    icon: Globe,
    keywords: ['embed', 'youtube', 'twitter', 'iframe'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).insertContent({ type: 'embed' }).run(),
  },
  {
    title: 'Button',
    group: 'Media',
    icon: MousePointer,
    keywords: ['button', 'cta', 'link'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).insertContent({ type: 'buttonBlock' }).run(),
  },
  {
    title: 'Raw HTML',
    group: 'Advanced',
    icon: Code,
    keywords: ['html', 'raw', 'embed', 'advanced', 'code'],
    execute: (editor, range) => editor.chain().focus().deleteRange(range).insertContent({ type: 'rawHtml' }).run(),
  },
];

export function filterSlashCommands(query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (item) => item.title.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q)),
  );
}
