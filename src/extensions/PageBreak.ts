import { Node, mergeAttributes } from '@tiptap/core';

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      class: { default: 'page-break' },
    };
  },

  parseHTML() {
    return [
      { tag: 'div.page-break' },
      { tag: 'hr.page-break' }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break' })];
  },

  addCommands() {
    return {
      setPageBreak: () => ({ chain }) => {
        return chain().insertContent({ type: this.name }).focus().run();
      },
    };
  },
});
