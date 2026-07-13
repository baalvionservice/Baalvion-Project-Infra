import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { FigureImage } from './figure-image-node';
import { QuoteNode } from './quote-node';
import { CalloutNode } from './callout-node';
import { EmbedNode } from './embed-node';
import { ButtonBlockNode } from './button-node';
import { VideoNode } from './video-node';
import { RawHtmlNode } from './raw-html-node';
import { SlashCommand } from './slash-command';

// The full extension set for the CMS document editor. Shared between the live `useEditor()`
// instance (DocumentEditor.tsx) and the headless converters (converters.ts), which parse/
// serialize HTML against this exact schema — keep them in sync.
export const documentEditorExtensions = [
  StarterKit.configure({
    // Replaced by QuoteNode below, which adds the `cite` attribution field.
    blockquote: false,
    link: { openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } },
  }),
  QuoteNode,
  Placeholder.configure({ placeholder: "Write something… type “/” for commands" }),
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  FigureImage,
  CalloutNode,
  EmbedNode,
  ButtonBlockNode,
  VideoNode,
  RawHtmlNode,
  SlashCommand,
];
