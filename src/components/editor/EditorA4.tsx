import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Strike from '@tiptap/extension-strike';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Languages, Minus, Plus, Maximize2, X } from 'lucide-react';
import { PageBreak } from '../../extensions/PageBreak';
import { TextStyleExtras } from '../../extensions/TextStyleExtras';
import { useEditorStore } from '../../store/useEditorStore';
import { useEffect, useRef, useState } from 'react';
import { Ribbon } from '../ribbon/Ribbon';
import { Ruler } from './Ruler';

type Heading = { text: string; level: number; pos: number };

export const EditorA4 = () => {
  const { activeDoc, updateContent, showSidebar, toggleSidebar, showRuler, zoomLevel, setZoomLevel } = useEditorStore();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const probeRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { HTMLAttributes: { class: 'heading-node' } },
        bulletList: false,
        orderedList: false,
        listItem: false,
        strike: false,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      // allowBase64: sin esto las imágenes insertadas desde el equipo (o importadas de un DOCX) se pierden al reabrir
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      PageBreak,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
      TextStyle,
      Color,
      TextStyleExtras,
    ],
    content: activeDoc?.content || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[297mm] p-[25.4mm]',
        spellcheck: 'true',
        lang: 'es',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const words = editor.getText().split(/\s+/).filter((word) => word.length > 0).length;
      updateContent(html, words);
      extractHeadings(editor);
    },
  });

  const extractHeadings = (ed: NonNullable<typeof editor>) => {
    const nodes: Heading[] = [];
    ed.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        nodes.push({ text: node.textContent, level: node.attrs.level, pos });
      }
    });
    setHeadings(nodes);
  };

  useEffect(() => {
    if (editor) extractHeadings(editor);
  }, [editor]);

  // En pantallas estrechas, ajusta el zoom para que la hoja quepa
  useEffect(() => {
    const el = document.getElementById('canvas-scroll');
    if (el && el.clientWidth < 880) {
      setZoomLevel(Math.max(25, Math.floor(((el.clientWidth - 72) / 793.7) * 100)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Número de páginas (alto del contenido / alto de un A4) y página del cursor.
  // Se mide contra una sonda de 297 mm dentro del mismo árbol con zoom, así el cociente no depende del zoom.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    const measure = () => {
      const probe = probeRef.current;
      const ph = probe?.getBoundingClientRect().height ?? 0;
      if (!ph) return;
      setPages(Math.max(1, Math.ceil(dom.getBoundingClientRect().height / ph - 0.003)));
    };
    const updateCurrent = () => {
      try {
        const probe = probeRef.current;
        const sheet = document.getElementById('a4-document');
        const ph = probe?.getBoundingClientRect().height ?? 0;
        if (!sheet || !ph) return;
        const top = editor.view.coordsAtPos(editor.state.selection.head).top;
        setCurrentPage(Math.max(1, Math.floor((top - sheet.getBoundingClientRect().top) / ph) + 1));
      } catch {
        /* la vista aún no está montada */
      }
    };
    measure();
    updateCurrent();
    const ro = new ResizeObserver(() => { measure(); updateCurrent(); });
    ro.observe(dom);
    editor.on('selectionUpdate', updateCurrent);
    editor.on('update', updateCurrent);
    return () => {
      ro.disconnect();
      editor.off('selectionUpdate', updateCurrent);
      editor.off('update', updateCurrent);
    };
  }, [editor, zoomLevel]);

  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos + 1).run();
    const domNode = editor.view.domAtPos(pos + 1).node as HTMLElement;
    const target = domNode.nodeType === 3 ? domNode.parentElement : domNode;
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const fitWidth = () => {
    const w = document.getElementById('canvas-scroll')?.clientWidth ?? 0;
    if (w) setZoomLevel(Math.max(25, Math.min(200, Math.floor(((w - 72) / 793.7) * 100))));
  };

  if (!editor || !activeDoc) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--chrome)] font-sans">
      <Ribbon editor={editor} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {showSidebar && (
          <aside className="w-64 shrink-0 bg-[var(--chrome)] flex flex-col pl-3 pr-1 pb-3" aria-label="Esquema del documento">
            <div className="flex items-center justify-between pl-2 pr-1 pt-2 pb-3">
              <h2 className="text-[14px] font-medium text-[#1f1f1f]">Esquema</h2>
              <button
                onClick={toggleSidebar}
                title="Cerrar esquema"
                aria-label="Cerrar esquema"
                className="w-7 h-7 rounded-full grid place-items-center text-[#5f6368] hover:bg-black/[0.07]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pl-2 pr-2 custom-scrollbar-thin">
              {headings.length === 0 ? (
                <p className="text-[12.5px] leading-5 text-[#5f6368]">
                  Los títulos que añadas (Título 1, 2 o 3) aparecerán aquí para navegar por el documento.
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {headings.map((h, i) => (
                    <li key={i}>
                      <button
                        onClick={() => scrollToHeading(h.pos)}
                        title={h.text}
                        style={{ paddingLeft: `${(h.level - 1) * 14 + 8}px` }}
                        className={`w-full text-left truncate py-1.5 pr-2 rounded-md text-[13px] hover:bg-black/[0.06] hover:text-[#0f6cbd] transition-colors ${
                          h.level === 1 ? 'font-medium text-[#1f1f1f]' : 'text-[#444746]'
                        }`}
                      >
                        {h.text || <span className="italic text-[#80868b]">Sin título</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}

        <div id="canvas-scroll" className="flex-1 overflow-auto px-8 pb-8 custom-scrollbar bg-[var(--canvas)]">
          <div style={{ zoom: zoomLevel / 100 }} className="mx-auto w-fit pb-16">
            {showRuler ? (
              <div className="sticky top-0 z-10 bg-[var(--canvas)] pt-3 pb-2 flex justify-center">
                <Ruler />
              </div>
            ) : (
              <div className="h-6" />
            )}

            <div className="relative">
              {/* Sonda invisible de 297 mm para medir páginas */}
              <div
                ref={probeRef}
                aria-hidden
                style={{ position: 'absolute', top: 0, left: 0, width: 1, height: '297mm', visibility: 'hidden', pointerEvents: 'none' }}
              />
              <div
                id="a4-document"
                style={{ minHeight: `${pages * 297}mm` }}
                className="bg-white w-[210mm] shrink-0 flex flex-col ring-1 ring-[#d7dce5] shadow-[0_1px_3px_rgba(60,64,67,0.28),0_4px_10px_3px_rgba(60,64,67,0.12)]"
              >
                <EditorContent editor={editor} className="flex-1" />
              </div>

              {/* Marcas de fin de página (fuera de #a4-document para no salir en el PDF) */}
              {Array.from({ length: pages - 1 }).map((_, i) => (
                <div key={i} aria-hidden className="absolute left-0 right-0 pointer-events-none" style={{ top: `${(i + 1) * 297}mm` }}>
                  <div className="border-t border-dashed border-[#bfc6d2]" />
                  <span className="absolute right-3 top-1 text-[10px] tracking-wide text-[#9aa0a6]">Página {i + 2}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Barra de estado ===== */}
      <div className="h-8 shrink-0 bg-[var(--chrome)] border-t border-[var(--line)] flex items-center justify-between px-3 text-[12px] text-[#444746]">
        <div className="flex items-center gap-1">
          <span className="px-2 py-1 rounded hover:bg-black/[0.05] cursor-default whitespace-nowrap">
            Página {Math.min(currentPage, pages)} de {pages}
          </span>
          <span className="hidden sm:block px-2 py-1 rounded hover:bg-black/[0.05] cursor-default whitespace-nowrap">
            {activeDoc.wordCount} {activeDoc.wordCount === 1 ? 'palabra' : 'palabras'}
          </span>
          <span className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-black/[0.05] cursor-default">
            <Languages size={13} /> Español
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            title="Alejar"
            aria-label="Alejar"
            onClick={() => setZoomLevel(Math.max(25, zoomLevel - 10))}
            className="w-6 h-6 rounded-full grid place-items-center hover:bg-black/[0.07]"
          >
            <Minus size={14} />
          </button>
          <input
            type="range"
            min={25}
            max={200}
            step={1}
            value={zoomLevel}
            aria-label="Zoom"
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="hidden sm:block w-28 accent-[#0f6cbd] cursor-pointer"
          />
          <button
            title="Acercar"
            aria-label="Acercar"
            onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
            className="w-6 h-6 rounded-full grid place-items-center hover:bg-black/[0.07]"
          >
            <Plus size={14} />
          </button>
          <button
            title="Restablecer al 100 %"
            onClick={() => setZoomLevel(100)}
            className="w-12 h-6 rounded text-center font-medium hover:bg-black/[0.07]"
          >
            {zoomLevel}%
          </button>
          <button
            title="Ajustar al ancho"
            aria-label="Ajustar al ancho"
            onClick={fitWidth}
            className="w-6 h-6 rounded-full grid place-items-center hover:bg-black/[0.07]"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
