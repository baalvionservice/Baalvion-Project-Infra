'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlignLeft,
  Heading,
  Image,
  Video,
  Code2,
  Quote,
  Minus,
  Globe,
  Table,
  Info,
  Columns,
  LayoutGrid,
  MousePointer,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { BLOCK_REGISTRY } from '@/lib/types/cms-content.types';
import type { ContentBlock, BlockType } from '@/lib/types/cms-content.types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AlignLeft, Heading, Image, Video, Code2, Quote, Minus, Globe, Table, Info, Columns, LayoutGrid,
  MousePointer, Code,
};

function BlockIcon({ icon }: { icon: string }) {
  const Comp = ICONS[icon] ?? AlignLeft;
  return <Comp className="h-4 w-4" />;
}

function BlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
  const update = (content: Record<string, unknown>) => onChange({ ...block, content });

  switch (block.type) {
    case 'paragraph':
      return (
        <textarea
          className="w-full resize-none rounded border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0 min-h-[60px]"
          placeholder="Write something..."
          value={(block.content.text as string) ?? ''}
          onChange={(e) => update({ text: e.target.value })}
        />
      );

    case 'heading':
      return (
        <div className="flex gap-2 items-start">
          <select
            className="rounded border bg-muted px-2 py-1 text-xs shrink-0"
            value={(block.content.level as number) ?? 2}
            onChange={(e) => update({ ...block.content, level: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <option key={l} value={l}>H{l}</option>
            ))}
          </select>
          <input
            className="flex-1 border-0 bg-transparent text-sm font-semibold focus:outline-none"
            placeholder="Heading text..."
            value={(block.content.text as string) ?? ''}
            onChange={(e) => update({ ...block.content, text: e.target.value })}
          />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-2">
          <Input
            className="h-8 text-xs"
            placeholder="Image URL"
            value={(block.content.src as string) ?? ''}
            onChange={(e) => update({ ...block.content, src: e.target.value })}
          />
          <Input
            className="h-8 text-xs"
            placeholder="Alt text"
            value={(block.content.alt as string) ?? ''}
            onChange={(e) => update({ ...block.content, alt: e.target.value })}
          />
          <Input
            className="h-8 text-xs"
            placeholder="Caption (optional)"
            value={(block.content.caption as string) ?? ''}
            onChange={(e) => update({ ...block.content, caption: e.target.value })}
          />
          {(block.content.src as string) && (
            <img
              src={block.content.src as string}
              alt={(block.content.alt as string) ?? ''}
              className="max-h-48 rounded border object-cover"
            />
          )}
        </div>
      );

    case 'quote':
      return (
        <div className="border-l-4 border-primary pl-4 space-y-2">
          <textarea
            className="w-full resize-none rounded border-0 bg-transparent text-sm italic focus:outline-none min-h-[60px]"
            placeholder="Quote text..."
            value={(block.content.text as string) ?? ''}
            onChange={(e) => update({ ...block.content, text: e.target.value })}
          />
          <Input
            className="h-7 text-xs border-0 bg-transparent"
            placeholder="— Attribution"
            value={(block.content.cite as string) ?? ''}
            onChange={(e) => update({ ...block.content, cite: e.target.value })}
          />
        </div>
      );

    case 'code':
      return (
        <div className="space-y-2">
          <select
            className="rounded border bg-muted px-2 py-1 text-xs"
            value={(block.content.language as string) ?? 'javascript'}
            onChange={(e) => update({ ...block.content, language: e.target.value })}
          >
            {['javascript', 'typescript', 'python', 'rust', 'go', 'css', 'html', 'sql', 'bash', 'json'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <textarea
            className="w-full resize-none rounded border bg-muted p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]"
            placeholder="// Code here..."
            value={(block.content.code as string) ?? ''}
            onChange={(e) => update({ ...block.content, code: e.target.value })}
          />
        </div>
      );

    case 'callout':
      return (
        <div className="space-y-2">
          <select
            className="rounded border bg-muted px-2 py-1 text-xs"
            value={(block.content.variant as string) ?? 'info'}
            onChange={(e) => update({ ...block.content, variant: e.target.value })}
          >
            {['info', 'warning', 'success', 'error'].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <textarea
            className="w-full resize-none rounded border-0 bg-transparent text-sm focus:outline-none min-h-[60px]"
            placeholder="Callout text..."
            value={(block.content.text as string) ?? ''}
            onChange={(e) => update({ ...block.content, text: e.target.value })}
          />
        </div>
      );

    case 'html':
      return (
        <textarea
          className="w-full resize-none rounded border bg-muted p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
          placeholder="<p>Raw HTML...</p>"
          value={(block.content.html as string) ?? ''}
          onChange={(e) => update({ html: e.target.value })}
        />
      );

    case 'embed':
      return (
        <Input
          className="h-8 text-xs"
          placeholder="Embed URL (YouTube, Twitter, etc.)"
          value={(block.content.url as string) ?? ''}
          onChange={(e) => update({ url: e.target.value })}
        />
      );

    case 'button':
      return (
        <div className="flex gap-2">
          <Input
            className="h-8 text-xs"
            placeholder="Button text"
            value={(block.content.text as string) ?? ''}
            onChange={(e) => update({ ...block.content, text: e.target.value })}
          />
          <Input
            className="h-8 text-xs flex-1"
            placeholder="URL"
            value={(block.content.href as string) ?? ''}
            onChange={(e) => update({ ...block.content, href: e.target.value })}
          />
        </div>
      );

    case 'divider':
      return <hr className="border-border" />;

    case 'video':
      return (
        <Input
          className="h-8 text-xs"
          placeholder="Video URL"
          value={(block.content.src as string) ?? ''}
          onChange={(e) => update({ src: e.target.value, type: 'url' })}
        />
      );

    default:
      return (
        <p className="text-xs text-muted-foreground">
          Block type <code>{block.type}</code> — editor coming soon.
        </p>
      );
  }
}

const GROUPS = ['text', 'media', 'layout', 'embed'] as const;

interface Props {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export default function BlockBuilder({ blocks, onChange }: Props) {
  const addBlock = useCallback(
    (type: BlockType) => {
      const reg = BLOCK_REGISTRY.find((r) => r.type === type)!;
      const newBlock: ContentBlock = {
        id: crypto.randomUUID(),
        type,
        order: blocks.length,
        content: { ...reg.defaultContent },
      };
      onChange([...blocks, newBlock]);
    },
    [blocks, onChange]
  );

  const updateBlock = useCallback(
    (updated: ContentBlock) =>
      onChange(blocks.map((b) => (b.id === updated.id ? updated : b))),
    [blocks, onChange]
  );

  const removeBlock = useCallback(
    (id: string) =>
      onChange(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i }))),
    [blocks, onChange]
  );

  const moveBlock = useCallback(
    (id: string, dir: 'up' | 'down') => {
      const idx = blocks.findIndex((b) => b.id === id);
      if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === blocks.length - 1)) return;
      const arr = [...blocks];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      onChange(arr.map((b, i) => ({ ...b, order: i })));
    },
    [blocks, onChange]
  );

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">Start building your content</p>
          <AddBlockButton onAdd={addBlock} />
        </div>
      )}

      {blocks.map((block, idx) => {
        const reg = BLOCK_REGISTRY.find((r) => r.type === block.type);
        return (
          <div key={block.id} className="group relative rounded-lg border bg-card p-4">
            <div className="absolute left-2 top-3 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            </div>

            <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveBlock(block.id, 'up')}
                disabled={idx === 0}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveBlock(block.id, 'down')}
                disabled={idx === blocks.length - 1}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => removeBlock(block.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {reg && <BlockIcon icon={reg.icon} />}
              <span className="text-xs font-medium text-muted-foreground capitalize">
                {reg?.label ?? block.type}
              </span>
            </div>

            <BlockEditor block={block} onChange={updateBlock} />
          </div>
        );
      })}

      {blocks.length > 0 && (
        <div className="flex justify-center">
          <AddBlockButton onAdd={addBlock} />
        </div>
      )}
    </div>
  );
}

function AddBlockButton({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const GROUPS_WITH_ITEMS = ['text', 'media', 'layout', 'embed'] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        {GROUPS_WITH_ITEMS.map((group) => (
          <div key={group}>
            <DropdownMenuLabel className="text-xs capitalize">{group}</DropdownMenuLabel>
            {BLOCK_REGISTRY.filter((r) => r.group === group).map((r) => (
              <DropdownMenuItem
                key={r.type}
                onClick={() => onAdd(r.type)}
                className="gap-2 text-sm"
              >
                <BlockIcon icon={r.icon} />
                {r.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
