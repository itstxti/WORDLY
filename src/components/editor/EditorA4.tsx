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
import { PageBreak } from '../../extensions/PageBreak';
import { useEditorStore } from '../../store/useEditorStore';
import { useEffect, useState } from 'react';
import { Ribbon } from '../ribbon/Ribbon';

export const EditorA4 = () => {
  const { activeDoc, updateContent, saveStatus, showSidebar, zoomLevel, setZoomLevel } = useEditorStore();
  const [isMounted, setIsMounted] = useState(false);
  const [headings, setHeadings] = useState<{ text: string, level: number, id: string, pos: number }[]>([]);

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
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      PageBreak,
      Strike,
      BulletList,
      OrderedList,
      ListItem
    ],
    content: activeDoc?.content || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[297mm] p-[25.4mm]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const words = editor.getText().split(/\s+/).filter(word => word.length > 0).length;
      updateContent(html, words);
      extractHeadings(editor);
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editor && activeDoc && isMounted && editor.getHTML() !== activeDoc.content) {
      if (activeDoc.content === '') {
         editor.commands.setContent('');
      }
      extractHeadings(editor);
    }
  }, [activeDoc?.id, editor, isMounted]);

  const extractHeadings = (editorInstance: any) => {
    const nodes: any[] = [];
    editorInstance.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        nodes.push({
          text: node.textContent,
          level: node.attrs.level,
          pos: pos
        });
      }
    });
    setHeadings(nodes);
  };

  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos).run();
    const domNode = editor.view.domAtPos(pos).node as HTMLElement;
    if (domNode && domNode.scrollIntoView) {
      domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!editor || !activeDoc) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--canvas)] font-sans">
      <Ribbon editor={editor} />
      
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <div className="w-72 shrink-0 bg-white border-r border-[#c8c6c4] flex flex-col z-0">
            <div className="px-5 py-4 border-b border-[#e1dfdd] font-semibold text-[#323130] bg-white">Navegación</div>
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {headings.length === 0 ? (
                <div className="text-sm text-[#605e5c] text-center mt-6">
                  Añade títulos (H1, H2) para crear el esquema.
                </div>
              ) : (
                <ul className="space-y-2">
                  {headings.map((h, i) => (
                    <li 
                      key={i} 
                      onClick={() => scrollToHeading(h.pos)}
                      className={`text-sm cursor-pointer hover:text-[#0f6cbd] truncate transition-colors text-[#323130] py-1 pr-2 rounded hover:bg-[#f3f2f1] ${h.level === 1 ? 'font-semibold' : ''}`}
                      style={{ paddingLeft: `${(h.level - 1) * 16 + 8}px` }}
                      title={h.text}
                    >
                      {h.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-[var(--canvas)]">
          <div 
            style={{ zoom: zoomLevel / 100 }}
            className="mx-auto w-fit pb-20"
          >
            <div 
              id="a4-document"
              className="bg-white shadow-[0_10px_20px_rgba(0,0,0,0.1),_0_2px_6px_rgba(0,0,0,0.08)] w-[210mm] shrink-0 min-h-[297mm] ring-1 ring-[#c8c6c4] flex flex-col"
            >
              <EditorContent editor={editor} className="flex-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="h-7 bg-[#f3f2f1] border-t border-[#c8c6c4] flex items-center px-4 text-xs text-[#605e5c] justify-between shrink-0 relative z-20">
        <div className="flex space-x-6">
          <span className="cursor-pointer hover:bg-[#e1dfdd] px-2 py-1 rounded">Página 1</span>
          <span className="cursor-pointer hover:bg-[#e1dfdd] px-2 py-1 rounded">{activeDoc.wordCount} palabras</span>
        </div>
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${saveStatus === 'Guardado' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>{saveStatus}</span>
          </span>
          <div className="flex items-center space-x-2 border-l border-[#c8c6c4] pl-4">
            <input 
              type="range" 
              min="50" max="200" step="10" 
              value={zoomLevel} 
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-28 accent-[#0f6cbd] cursor-pointer"
            />
            <span className="w-10 text-right font-medium">{zoomLevel}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
