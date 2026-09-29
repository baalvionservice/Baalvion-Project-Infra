import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import SlashCommandMenu, { type SlashCommandMenuRef } from '../SlashCommandMenu';
import { filterSlashCommands, type SlashCommandItem } from './slash-command-items';

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        items: ({ query }) => filterSlashCommands(query),
        command: ({ editor, range, props }) => props.execute(editor, range),
        render: () => {
          let component: ReactRenderer<SlashCommandMenuRef>;
          let unmount: (() => void) | undefined;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props: { items: props.items, editor: props.editor, range: props.range, command: props.command },
                editor: props.editor,
              });
              unmount = props.mount(component.element as HTMLElement);
            },
            onUpdate: (props) => {
              component.updateProps({ items: props.items, editor: props.editor, range: props.range, command: props.command });
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                unmount?.();
                return true;
              }
              return component.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              unmount?.();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
