import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { Editor, Range } from '@tiptap/core';
import type { SuggestionKeyDownProps } from '@tiptap/suggestion';
import type { SlashCommandItem } from './extensions/slash-command-items';

export interface SlashCommandMenuRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

interface Props {
  items: SlashCommandItem[];
  editor: Editor;
  range: Range;
  command: (item: SlashCommandItem) => void;
}

const SlashCommandMenu = forwardRef<SlashCommandMenuRef, Props>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  const groups = items.reduce<Record<string, SlashCommandItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});
  // Must match the grouped render order below exactly — this is what keyboard nav indexes
  // into. Click handlers instead call command(item) directly with no index involved, so the
  // two selection paths can never disagree on which item is which (see prior bug: clicking
  // "Table" inserted an Embed because a grouped-render index was used to look up the flat,
  // ungrouped `items` array).
  const displayOrder = Object.values(groups).flat();

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!displayOrder.length) return false;
      if (event.key === 'ArrowDown') {
        setSelected((i) => (i + 1) % displayOrder.length);
        return true;
      }
      if (event.key === 'ArrowUp') {
        setSelected((i) => (i + displayOrder.length - 1) % displayOrder.length);
        return true;
      }
      if (event.key === 'Enter') {
        const item = displayOrder[selected];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="w-56 rounded-lg border bg-popover p-2 text-xs text-muted-foreground shadow-md">
        No matching blocks
      </div>
    );
  }

  let runningIndex = -1;

  return (
    <div className="max-h-80 w-56 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
      {Object.entries(groups).map(([group, groupItems]) => (
        <div key={group}>
          <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {group}
          </div>
          {groupItems.map((item) => {
            runningIndex += 1;
            const index = runningIndex;
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onMouseEnter={() => setSelected(index)}
                onClick={() => command(item)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                  index === selected ? 'bg-accent text-accent-foreground' : 'text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {item.title}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';
export default SlashCommandMenu;
