import { Extension } from '@tiptap/core';

const FALLBACKS: Record<string, string> = {
  Cambria: 'serif',
  Georgia: 'serif',
  'Times New Roman': 'serif',
  'Courier New': 'monospace',
};

/**
 * Amplía la marca `textStyle` con familia tipográfica, tamaño y resaltado,
 * y añade interlineado a párrafos y títulos. Sin dependencias extra.
 * Uso:  editor.chain().focus().setMark('textStyle', { fontSize: '14pt' }).run()
 */
export const TextStyleExtras = Extension.create({
  name: 'textStyleExtras',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (el: HTMLElement) =>
              el.style.fontFamily?.split(',')[0].replace(/['"]/g, '').trim() || null,
            renderHTML: (attrs: Record<string, any>) =>
              attrs.fontFamily
                ? { style: `font-family: "${attrs.fontFamily}", ${FALLBACKS[attrs.fontFamily] ?? 'sans-serif'}` }
                : {},
          },
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.fontSize || null,
            renderHTML: (attrs: Record<string, any>) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
          backgroundColor: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
            renderHTML: (attrs: Record<string, any>) =>
              attrs.backgroundColor ? { style: `background-color: ${attrs.backgroundColor}` } : {},
          },
        },
      },
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.lineHeight || null,
            renderHTML: (attrs: Record<string, any>) =>
              attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
          },
        },
      },
    ];
  },
});
