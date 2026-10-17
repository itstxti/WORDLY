import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, Download, FileText, ArrowLeft, Table, Image as ImageIcon, Trash2,
  FileUp, ListTree, ZoomIn, ZoomOut, Scissors, Clipboard, Copy, Type, Highlighter, PaintBucket,
  Strikethrough, List, ListOrdered, FilePlus, Shapes, LineChart, FileDigit, Grid3X3, Ruler,
  Brush, Search, MousePointer2, Mic, FileCheck, Smile, Box, Camera, Puzzle, MonitorPlay, 
  Link2, Bookmark, MessageSquare, Calculator, BookOpen, Globe, MoveVertical, MoveHorizontal, 
  Maximize, AppWindow, Heading1, Heading2, Heading3, SplitSquareVertical, Quote, Fingerprint, ShieldAlert,
  Share
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { exportToPdf } from '../../utils/pdf';
import { exportToDocxBasic } from '../../utils/export';

interface RibbonProps {
  editor: Editor | null;
}

type Tab = 'Archivo' | 'Inicio' | 'Insertar' | 'Vista';

export const Ribbon = ({ editor }: RibbonProps) => {
  const { activeDoc, updateTitle, setActiveDoc, toggleSidebar, showSidebar, zoomLevel, setZoomLevel } = useEditorStore();
  const [activeTab, setActiveTab] = useState<Tab>('Inicio');

  if (!editor || !activeDoc) return null;

  const addImage = () => {
    const url = window.prompt('URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addPageBreak = () => {
    editor.chain().focus().insertContent('<div class="page-break"></div>').run();
  };

  return (
    <div className="w-full bg-[#f3f2f1] border-b border-[#e1dfdd] flex flex-col shrink-0 relative z-10 font-sans shadow-sm">
      {/* Barra de título */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f6cbd] text-white gap-3">
        <div className="flex items-center space-x-3">
          <button onClick={() => setActiveDoc(null)} className="hover:bg-[#0c5699] p-1 rounded transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center space-x-2 bg-[#0c5699] px-2 py-0.5 rounded-md">
            <FileText size={14} />
            <input 
              value={activeDoc.title}
              onChange={(e) => updateTitle(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-sm w-40 sm:w-64 placeholder-blue-300"
              placeholder="Nombre del documento"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 hover:bg-[#0c5699] px-2 py-1 rounded text-sm transition-colors">
            <Share size={14} /> <span className="hidden sm:inline">Compartir</span>
          </button>
          <div className="hidden sm:block text-xs font-medium tracking-wide bg-[#0c5699] px-2 py-0.5 rounded">Wordly App</div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex px-2 pt-1.5 space-x-1 text-xs text-[#605e5c] bg-[#f3f2f1] overflow-x-auto">
        {(['Archivo', 'Inicio', 'Insertar', 'Vista'] as Tab[]).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-t-md transition-colors shrink-0 ${
              activeTab === tab 
                ? 'bg-white text-[#0f6cbd] font-semibold border-t border-l border-r border-[#e1dfdd]' 
                : 'border-t border-l border-r border-transparent hover:bg-[#e1dfdd]'
            }`}
            style={{ marginBottom: activeTab === tab ? '-1px' : '0' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Herramientas - Eliminados los flex-1 para flujo natural de izquierda a derecha */}
      <div className="flex items-stretch px-2 py-1 space-x-1 bg-white border-t border-[#e1dfdd] h-[84px] overflow-x-auto overflow-y-hidden custom-scrollbar-thin">
        
        {activeTab === 'Inicio' && (
          <>
            <RibbonGroup label="Portapapeles">
              <LargeToolbarButton onClick={() => {}} icon={<Clipboard size={18} />} label="Pegar" disabled />
              <div className="flex flex-col space-y-0.5 ml-0.5 justify-center">
                 <SmallButton icon={<Copy size={12}/>} label="Copiar" disabled />
                 <SmallButton icon={<Scissors size={12}/>} label="Cortar" disabled />
                 <SmallButton icon={<Brush size={12}/>} label="Formato" disabled />
              </div>
            </RibbonGroup>

            <RibbonGroup label="Fuente">
              <div className="flex flex-col space-y-1 w-full justify-center h-full pt-0.5">
                <div className="flex space-x-1">
                  <select className="border border-[#e1dfdd] rounded px-1 text-[11px] py-0.5 w-24 bg-[#f3f2f1] hover:border-[#0f6cbd] transition-colors" disabled><option>Calibri</option></select>
                  <select className="border border-[#e1dfdd] rounded px-1 text-[11px] py-0.5 w-10 bg-[#f3f2f1] hover:border-[#0f6cbd] transition-colors" disabled><option>11</option></select>
                  <div className="flex space-x-0.5 ml-1">
                    <ToolbarButton onClick={() => {}} icon={<span className="font-bold text-xs">A^</span>} title="Aumentar" disabled />
                    <ToolbarButton onClick={() => {}} icon={<span className="text-xs">Av</span>} title="Disminuir" disabled />
                  </div>
                </div>
                <div className="flex items-center space-x-0.5">
                  <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={<Bold size={14} />} title="Negrita" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={<Italic size={14} />} title="Cursiva" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={<UnderlineIcon size={14} />} title="Subrayado" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={<Strikethrough size={14} />} title="Tachado" />
                  <div className="w-px h-4 bg-[#e1dfdd] mx-1"></div>
                  <ToolbarButton onClick={() => {}} icon={<Highlighter size={14} className="text-yellow-500" />} title="Resaltado" disabled />
                  <ToolbarButton onClick={() => {}} icon={<Type size={14} className="text-red-600" />} title="Color de texto" disabled />
                </div>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Párrafo">
              <div className="flex flex-col space-y-1 justify-center h-full pt-0.5">
                <div className="flex items-center space-x-0.5 border-b border-transparent pb-0.5">
                  <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={<List size={14} />} title="Viñetas" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={<ListOrdered size={14} />} title="Numeración" />
                  <div className="w-px h-4 bg-[#e1dfdd] mx-1"></div>
                  <ToolbarButton onClick={() => {}} icon={<PaintBucket size={14} />} title="Sombreado" disabled />
                </div>
                <div className="flex items-center space-x-0.5">
                  <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={<AlignLeft size={14} />} />
                  <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={<AlignCenter size={14} />} />
                  <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={<AlignRight size={14} />} />
                  <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} icon={<AlignJustify size={14} />} />
                </div>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Estilos">
              <div className="flex space-x-1 bg-[#f3f2f1] p-0.5 rounded border border-[#e1dfdd] h-full items-center">
                 <StyleBox label="Normal" icon={<Type size={16} className="text-gray-600"/>} isActive={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} />
                 <StyleBox label="Título 1" icon={<Heading1 size={16} className="text-[#0f6cbd]"/>} isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
                 <StyleBox label="Título 2" icon={<Heading2 size={16} className="text-[#0c5699]"/>} isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                 <StyleBox label="Título 3" icon={<Heading3 size={16} className="text-[#094074]"/>} isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
                 <StyleBox label="Cita" icon={<Quote size={16} className="text-gray-500"/>} isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
              </div>
            </RibbonGroup>

            <RibbonGroup label="Edición">
               <div className="flex flex-col space-y-0.5 justify-center h-full">
                 <SmallButton icon={<Search size={12} className="text-[#0f6cbd]"/>} label="Buscar" disabled />
                 <SmallButton icon={<span className="text-[#0f6cbd] font-bold text-[10px]">ab-&gt;</span>} label="Reemplazar" disabled />
                 <SmallButton icon={<MousePointer2 size={12}/>} label="Seleccionar" disabled />
               </div>
            </RibbonGroup>

            <RibbonGroup label="Voz">
               <LargeToolbarButton onClick={() => {}} icon={<Mic size={18} className="text-[#0f6cbd]" />} label="Dictar" disabled />
            </RibbonGroup>

            <RibbonGroup label="Sensibilidad">
               <LargeToolbarButton onClick={() => {}} icon={<ShieldAlert size={18} className="text-[#a4262c]" />} label="Confidencial" disabled />
            </RibbonGroup>

            <RibbonGroup label="Editor">
               <LargeToolbarButton onClick={() => {}} icon={<FileCheck size={18} className="text-[#0f6cbd]" />} label="Editor" disabled />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Insertar' && (
          <>
            <RibbonGroup label="Páginas">
              <LargeToolbarButton onClick={() => {}} icon={<FilePlus size={18} />} label="Portada" disabled />
              <LargeToolbarButton onClick={addPageBreak} icon={<Scissors size={18} />} label="Salto pág." />
            </RibbonGroup>

            <RibbonGroup label="Tablas">
              <LargeToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={<Table size={18} />} label="Tabla" />
              {editor.isActive('table') && (
                <button onClick={() => editor.chain().focus().deleteTable().run()} className="flex flex-col items-center justify-center px-1 py-0.5 ml-1 text-[#a4262c] hover:bg-[#fde7e9] rounded-md text-[10px] transition-colors">
                  <Trash2 size={18} className="mb-0.5" />
                  <span>Eliminar</span>
                </button>
              )}
            </RibbonGroup>

            <RibbonGroup label="Ilustraciones">
              <div className="flex space-x-1 h-full items-center">
                <LargeToolbarButton onClick={addImage} icon={<ImageIcon size={18} className="text-[#0f6cbd]"/>} label="Imagen" />
                <LargeToolbarButton onClick={() => {}} icon={<Shapes size={18} />} label="Formas" disabled />
                <LargeToolbarButton onClick={() => {}} icon={<Smile size={18} />} label="Iconos" disabled />
                <LargeToolbarButton onClick={() => {}} icon={<Box size={18} />} label="Modelos 3D" disabled />
                <LargeToolbarButton onClick={() => {}} icon={<LineChart size={18} />} label="Gráfico" disabled />
                <LargeToolbarButton onClick={() => {}} icon={<Camera size={18} />} label="Captura" disabled />
              </div>
            </RibbonGroup>

            <RibbonGroup label="Complementos">
               <LargeToolbarButton onClick={() => {}} icon={<Puzzle size={18} className="text-[#a4262c]" />} label="Complementos" disabled />
            </RibbonGroup>

            <RibbonGroup label="Multimedia">
               <LargeToolbarButton onClick={() => {}} icon={<MonitorPlay size={18} />} label="Vídeo" disabled />
            </RibbonGroup>

            <RibbonGroup label="Vínculos">
               <LargeToolbarButton onClick={() => {}} icon={<Link2 size={18} />} label="Vínculo" disabled />
               <LargeToolbarButton onClick={() => {}} icon={<Bookmark size={18} />} label="Marcador" disabled />
            </RibbonGroup>

            <RibbonGroup label="Comentarios">
               <LargeToolbarButton onClick={() => {}} icon={<MessageSquare size={18} className="text-[#0f6cbd]" />} label="Comentario" disabled />
            </RibbonGroup>

            <RibbonGroup label="Símbolos">
               <LargeToolbarButton onClick={() => {}} icon={<Calculator size={18} />} label="Ecuación" disabled />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Vista' && (
          <>
            <RibbonGroup label="Vistas">
               <LargeToolbarButton onClick={() => {}} icon={<BookOpen size={18} />} label="Modo Lectura" disabled />
               <LargeToolbarButton onClick={() => {}} isActive={true} icon={<FileText size={18} className="text-[#0f6cbd]" />} label="Diseño Impr." />
               <LargeToolbarButton onClick={() => {}} icon={<Globe size={18} />} label="Diseño Web" disabled />
            </RibbonGroup>

            <RibbonGroup label="Movimiento">
               <LargeToolbarButton onClick={() => {}} isActive={true} icon={<MoveVertical size={18} />} label="Vertical" disabled />
               <LargeToolbarButton onClick={() => {}} icon={<MoveHorizontal size={18} />} label="En paralelo" disabled />
            </RibbonGroup>

            <RibbonGroup label="Mostrar">
              <div className="flex flex-col space-y-1.5 justify-center px-3 h-full">
                <label className="flex items-center text-[11px] text-[#323130] cursor-pointer">
                  <input type="checkbox" className="mr-2" disabled /> Regla
                </label>
                <label className="flex items-center text-[11px] text-[#323130] cursor-pointer">
                  <input type="checkbox" className="mr-2" disabled /> Líneas de cuadrícula
                </label>
                <label className="flex items-center text-[11px] text-[#323130] cursor-pointer hover:text-[#0f6cbd]" onClick={toggleSidebar}>
                  <input type="checkbox" className="mr-2 accent-[#0f6cbd]" checked={showSidebar} readOnly /> Panel de navegación
                </label>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Zoom">
              <div className="flex items-center space-x-1 px-3 h-full">
                <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1.5 hover:bg-[#e1dfdd] rounded-md text-[#323130] transition-colors"><ZoomOut size={16} /></button>
                <span className="text-[11px] font-medium text-[#323130] w-10 text-center">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} className="p-1.5 hover:bg-[#e1dfdd] rounded-md text-[#323130] transition-colors"><ZoomIn size={16} /></button>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Ventana">
               <LargeToolbarButton onClick={() => {}} icon={<AppWindow size={18} />} label="Nueva ventana" disabled />
               <LargeToolbarButton onClick={() => {}} icon={<Maximize size={18} />} label="Organizar todo" disabled />
               <LargeToolbarButton onClick={() => {}} icon={<SplitSquareVertical size={18} />} label="Dividir" disabled />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Archivo' && (
           <div className="flex space-x-4 items-center px-4 w-full h-full">
             <button onClick={() => exportToPdf('a4-document', activeDoc.title)} className="flex items-center space-x-2 px-4 py-2 bg-[#a4262c] text-white hover:bg-[#8e1f24] rounded-md shadow-sm text-xs font-medium transition-colors">
              <Download size={14} /> <span>Exportar como PDF</span>
            </button>
             <button onClick={() => exportToDocxBasic(activeDoc.title, editor.getText())} className="flex items-center space-x-2 px-4 py-2 bg-[#0f6cbd] text-white hover:bg-[#0c5699] rounded-md shadow-sm text-xs font-medium transition-colors">
              <FileUp size={14} /> <span>Exportar como DOCX</span>
            </button>
           </div>
        )}
      </div>
    </div>
  );
};

const RibbonGroup = ({ children, label, className = '' }: { children: React.ReactNode, label: string, className?: string }) => (
  <div className={`flex flex-col justify-between border-r border-[#e1dfdd] px-2 h-full shrink-0 ${className}`}>
    <div className="flex flex-1 items-center">{children}</div>
    <div className="text-[10px] text-center text-[#605e5c] mt-0.5 font-medium tracking-wide pb-0.5">{label}</div>
  </div>
);

const ToolbarButton = ({ icon, onClick, isActive, title, disabled }: { icon: React.ReactNode, onClick: () => void, isActive?: boolean, title?: string, disabled?: boolean }) => (
  <button
    onClick={disabled ? undefined : onClick}
    title={title}
    disabled={disabled}
    className={`p-1.5 rounded transition-colors ${isActive ? 'bg-[#cce8ff] text-[#0f6cbd]' : disabled ? 'text-[#c8c6c4] cursor-not-allowed' : 'text-[#323130] hover:bg-[#e1dfdd]'}`}
  >
    {icon}
  </button>
);

const LargeToolbarButton = ({ icon, label, onClick, isActive, disabled }: { icon: React.ReactNode, label: string, onClick: () => void, isActive?: boolean, disabled?: boolean }) => (
  <button 
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center px-1.5 py-0.5 rounded text-[10px] transition-colors min-w-[56px] h-full ${isActive ? 'bg-[#cce8ff] text-[#0f6cbd]' : disabled ? 'text-[#c8c6c4] cursor-not-allowed' : 'text-[#323130] hover:bg-[#e1dfdd]'}`}
  >
    <div className="mb-0.5">{icon}</div>
    <span className="leading-tight text-center whitespace-nowrap">{label}</span>
  </button>
);

const SmallButton = ({ icon, label, disabled }: { icon: React.ReactNode, label: string, disabled?: boolean }) => (
  <button className={`flex items-center space-x-1.5 px-1.5 py-0.5 rounded text-[10px] w-full text-left transition-colors ${disabled ? 'text-[#c8c6c4] cursor-not-allowed' : 'text-[#323130] hover:bg-[#e1dfdd]'}`} disabled={disabled}>
    <span className="w-3 flex justify-center">{icon}</span>
    <span className="whitespace-nowrap">{label}</span>
  </button>
);

const StyleBox = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-14 h-10 rounded border ${isActive ? 'bg-white border-[#0f6cbd] shadow-sm' : 'bg-transparent border-transparent hover:bg-[#e1dfdd]'} transition-all flex-shrink-0`}
  >
    <div className="mb-0.5">{icon}</div>
    <span className="text-[9px] font-medium text-[#323130] leading-none whitespace-nowrap">{label}</span>
  </button>
);
