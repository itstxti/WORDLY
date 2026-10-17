import { ReactNode, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import clsx from 'clsx';
import {
  Undo2, Redo2, ClipboardPaste, Scissors, Copy,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter, Baseline, RemoveFormatting,
  List, ListOrdered, Indent, Outdent, AlignLeft, AlignCenter, AlignRight, AlignJustify, ArrowUpDown,
  ChevronDown, Table2, ImagePlus, Link2, Minus, Quote, SeparatorHorizontal,
  FileDown, FileText, Share2, Cloud, Home, ZoomIn, ZoomOut, Maximize2,
  BetweenHorizontalStart, BetweenHorizontalEnd, BetweenVerticalStart, BetweenVerticalEnd,
  Merge, Split, Trash2, Check,
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { exportToPdf } from '../../utils/pdf';
import { exportToDocxBasic } from '../../utils/export';

type Tab = 'Archivo' | 'Inicio' | 'Insertar' | 'Vista' | 'Tabla';
const TABS: Tab[] = ['Archivo', 'Inicio', 'Insertar', 'Vista'];

const FONTS = ['Calibri', 'Arial', 'Cambria', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS', 'Courier New'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
// Equivalencias con Word: el interlineado por defecto de Calibri (1,08) equivale a ~1,32 en CSS
const LINE_SPACINGS = [
  { label: '1,0', value: '1.22' },
  { label: '1,15', value: '1.4' },
  { label: '1,5', value: '1.83' },
  { label: '2,0', value: '2.44' },
  { label: '2,5', value: '3.05' },
  { label: '3,0', value: '3.66' },
];

/* ---------- Paletas ---------- */
const toRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (hex: string, to: number, t: number) =>
  '#' + toRgb(hex).map((c) => Math.round(c + (to - c) * t).toString(16).padStart(2, '0')).join('');
const isDark = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
};

const GRAYS = ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff'];
const HUES = ['#980000', '#ff0000', '#ff9900', '#ffff00', '#00a651', '#00b7c3', '#4a86e8', '#0f6cbd', '#9900ff', '#e91e8c'];
const TEXT_PALETTE = [
  GRAYS,
  HUES,
  HUES.map((c) => mix(c, 255, 0.8)),
  HUES.map((c) => mix(c, 255, 0.55)),
  HUES.map((c) => mix(c, 255, 0.3)),
  HUES.map((c) => mix(c, 0, 0.3)),
];
const HIGHLIGHTS = ['#fff475', '#ccff90', '#a7ffeb', '#cbf0f8', '#aecbfa', '#d7aefb', '#fdcfe8', '#f6aea9', '#e8eaed', '#fbbc04'];

/* ---------- Piezas reutilizables ---------- */

/** Menú desplegable con posición fija (la cinta tiene overflow, un absolute se recortaría). */
const Dropdown = ({
  button,
  children,
}: {
  button: (open: boolean, toggle: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 272)) });
    }
    setOpen((o) => !o);
  };

  return (
    // preventDefault evita que el editor pierda la selección al pulsar
    <div ref={ref} onMouseDown={(e) => e.preventDefault()} className="relative">
      {button(open, toggle)}
      {open && (
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
          className="z-50 rounded-xl border border-[#dadce0] bg-white shadow-[0_4px_16px_rgba(60,64,67,0.28)]"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

const Btn = ({
  icon, title, onClick, active, disabled,
}: {
  icon: ReactNode; title: string; onClick: () => void; active?: boolean; disabled?: boolean;
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={clsx(
      'w-7 h-7 shrink-0 rounded-md grid place-items-center transition-colors',
      active ? 'bg-[#cfe4fa] text-[#0f6cbd]' : 'text-[#3c4043] hover:bg-black/[0.07]',
      disabled && 'opacity-35 pointer-events-none'
    )}
  >
    {icon}
  </button>
);

const TextBtn = ({
  icon, label, onClick, disabled,
}: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={clsx(
      'h-7 px-2 rounded-md flex items-center gap-1.5 text-[12px] text-[#3c4043] hover:bg-black/[0.07] transition-colors whitespace-nowrap',
      disabled && 'opacity-35 pointer-events-none'
    )}
  >
    {icon}
    {label}
  </button>
);

const LargeBtn = ({
  icon, label, onClick, active, disabled, danger, caret,
}: {
  icon: ReactNode; label: string; onClick: () => void; active?: boolean; disabled?: boolean; danger?: boolean; caret?: boolean;
}) => (
  <button
    type="button"
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={clsx(
      'h-full min-w-[56px] px-2 rounded-lg flex flex-col items-center justify-center gap-1 text-[11px] leading-none transition-colors',
      active ? 'bg-[#cfe4fa] text-[#0f6cbd]' : danger ? 'text-[#b3261e] hover:bg-[#b3261e]/10' : 'text-[#3c4043] hover:bg-black/[0.07]',
      disabled && 'opacity-35 pointer-events-none'
    )}
  >
    <span className="h-6 grid place-items-center">{icon}</span>
    <span className="flex items-center gap-0.5 whitespace-nowrap">
      {label}
      {caret && <ChevronDown size={10} />}
    </span>
  </button>
);

const Group = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="relative flex flex-col shrink-0 px-2 after:absolute after:right-0 after:top-2 after:bottom-3 after:w-px after:bg-[#c9d3e3] last:after:hidden">
    <div className="flex-1 flex items-center gap-1 min-h-0">{children}</div>
    <div className="text-[10.5px] text-[#5f6368] text-center leading-4">{label}</div>
  </div>
);

const Sep = () => <span className="w-px h-4 bg-[#c9d3e3] mx-1 shrink-0" />;

const Select = ({
  value, onChange, options, width, title,
}: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string; font?: string }[]; width: number; title: string;
}) => (
  <div className="relative shrink-0" style={{ width }}>
    <select
      title={title}
      aria-label={title}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none w-full h-7 rounded-md bg-white border border-[#d3dae6] hover:border-[#8fa6c6] pl-2 pr-6 text-[12px] text-[#1f1f1f] focus:outline-none focus:border-[#0f6cbd] cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={o.font ? { fontFamily: o.font } : undefined}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown size={13} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5f6368]" />
  </div>
);

const Swatches = ({ rows, onPick, current }: { rows: string[][]; onPick: (c: string) => void; current?: string | null }) => (
  <div className="p-2 grid gap-[3px]">
    {rows.map((row, i) => (
      <div key={i} className="flex gap-[3px]">
        {row.map((col) => (
          <button
            key={col}
            title={col}
            aria-label={col}
            onClick={() => onPick(col)}
            style={{ background: col }}
            className="w-5 h-5 rounded-[4px] border border-black/15 hover:scale-110 transition-transform grid place-items-center"
          >
            {current?.toLowerCase() === col.toLowerCase() && (
              <Check size={12} className={isDark(col) ? 'text-white' : 'text-black'} />
            )}
          </button>
        ))}
      </div>
    ))}
  </div>
);

const MenuItem = ({ children, onClick, checked }: { children: ReactNode; onClick: () => void; checked?: boolean }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[#1f1f1f] hover:bg-[#f1f3f4] text-left"
  >
    <span className="w-4 grid place-items-center">{checked && <Check size={14} className="text-[#0f6cbd]" />}</span>
    {children}
  </button>
);

/** Selector de tabla por cuadrícula, como en Word. */
const TableGrid = ({ onPick }: { onPick: (rows: number, cols: number) => void }) => {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  return (
    <div className="p-3">
      <div className="text-[12px] text-[#5f6368] mb-2 h-4">{hover.r ? `Tabla de ${hover.c} × ${hover.r}` : 'Insertar tabla'}</div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(8, 20px)' }} onMouseLeave={() => setHover({ r: 0, c: 0 })}>
        {Array.from({ length: 48 }).map((_, i) => {
          const r = Math.floor(i / 8) + 1;
          const c = (i % 8) + 1;
          const on = r <= hover.r && c <= hover.c;
          return (
            <button
              key={i}
              aria-label={`${r} filas, ${c} columnas`}
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => onPick(r, c)}
              className={clsx('w-5 h-5 rounded-[3px] border', on ? 'bg-[#cfe4fa] border-[#0f6cbd]' : 'bg-white border-[#c4c7c5]')}
            />
          );
        })}
      </div>
    </div>
  );
};

/** Muestra de estilo con vista previa, como la galería de estilos de Word. */
const StyleTile = ({
  label, active, onClick, previewStyle,
}: { label: string; active: boolean; onClick: () => void; previewStyle: React.CSSProperties }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={label}
    className={clsx(
      'w-[68px] h-full rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-colors shrink-0',
      active ? 'bg-white border-[#0f6cbd] shadow-sm' : 'bg-white/60 border-transparent hover:bg-white hover:border-[#c4d2e6]'
    )}
  >
    <span className="leading-none" style={previewStyle}>AaBbCc</span>
    <span className="text-[10.5px] leading-none text-[#5f6368]">{label}</span>
  </button>
);

/* ---------- Cinta ---------- */
export const Ribbon = ({ editor }: { editor: Editor | null }) => {
  const {
    activeDoc, updateTitle, setActiveDoc, saveStatus,
    toggleSidebar, showSidebar, showRuler, toggleRuler, zoomLevel, setZoomLevel,
  } = useEditorStore();
  const [tab, setTab] = useState<Tab>('Inicio');
  const fileRef = useRef<HTMLInputElement>(null);
  const inTable = !!editor?.isActive('table');

  useEffect(() => {
    if (!inTable && tab === 'Tabla') setTab('Inicio');
  }, [inTable, tab]);

  if (!editor || !activeDoc) return null;

  const c = () => editor.chain().focus();
  const tabs: Tab[] = inTable ? [...TABS, 'Tabla'] : TABS;

  /* Estado actual de la selección */
  const textStyle = editor.getAttributes('textStyle');
  const headingLevel = [1, 2, 3].find((l) => editor.isActive('heading', { level: l }));
  const defaultSize = headingLevel === 1 ? 20 : headingLevel === 2 ? 16 : headingLevel === 3 ? 13 : 11;
  const currentSize = parseFloat(textStyle.fontSize) || defaultSize;
  const currentFont: string = textStyle.fontFamily || 'Calibri';
  const sizeOptions = SIZES.includes(currentSize) ? SIZES : [...SIZES, currentSize].sort((a, b) => a - b);
  const fontOptions = FONTS.includes(currentFont) ? FONTS : [...FONTS, currentFont];
  const currentLH: string | null =
    editor.getAttributes('paragraph').lineHeight ?? editor.getAttributes('heading').lineHeight ?? null;

  const setSize = (n: number) => c().setMark('textStyle', { fontSize: `${n}pt` }).run();
  const stepSize = (dir: 1 | -1) => {
    const next = dir === 1 ? sizeOptions.find((s) => s > currentSize) : [...sizeOptions].reverse().find((s) => s < currentSize);
    if (next) setSize(next);
  };
  const setLineHeight = (v: string) =>
    c().updateAttributes('paragraph', { lineHeight: v }).updateAttributes('heading', { lineHeight: v }).run();

  const doCopy = () => { c().run(); document.execCommand('copy'); };
  const doCut = () => { c().run(); document.execCommand('cut'); };
  const doPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const lines = text.split(/\r?\n/);
      if (lines.length === 1) c().insertContent({ type: 'text', text }).run();
      else
        c().insertContent(
          lines.map((l) => ({ type: 'paragraph', content: l ? [{ type: 'text', text: l }] : [] }))
        ).run();
    } catch {
      /* El navegador denegó el acceso al portapapeles: Ctrl+V sigue funcionando */
    }
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => c().setImage({ src: String(reader.result) }).run();
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const addImageUrl = () => {
    const url = window.prompt('URL de la imagen:');
    if (url) c().setImage({ src: url }).run();
  };

  const fitWidth = () => {
    const w = document.getElementById('canvas-scroll')?.clientWidth ?? 0;
    if (w) setZoomLevel(Math.max(25, Math.min(200, Math.floor(((w - 72) / 793.7) * 100))));
  };

  const hasSelection = !editor.state.selection.empty;

  return (
    <div className="shrink-0 bg-[var(--chrome)] relative z-20 select-none">
      {/* ===== Barra de título (estilo Google Docs) ===== */}
      <div className="flex items-center gap-3 pl-3 pr-4 pt-2.5 pb-1">
        <button
          title="Volver a Inicio"
          aria-label="Volver a Inicio"
          onClick={() => setActiveDoc(null)}
          className="w-9 h-9 shrink-0 rounded-lg bg-[#0f6cbd] text-white grid place-items-center hover:bg-[#0c5699] transition-colors"
        >
          <FileText size={20} />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <input
            value={activeDoc.title}
            onChange={(e) => updateTitle(e.target.value)}
            spellCheck={false}
            aria-label="Nombre del documento"
            placeholder="Documento sin título"
            style={{ width: `${Math.min(Math.max(activeDoc.title.length, 12) + 2, 46)}ch` }}
            className="min-w-0 max-w-[44vw] text-[18px] leading-7 text-[#1f1f1f] bg-transparent rounded-md px-2 border border-transparent hover:border-[#c4c7c5] focus:border-[#0f6cbd] focus:bg-white focus:outline-none truncate"
          />
          <span
            className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#5f6368] shrink-0"
            title={saveStatus === 'Guardado' ? 'Todos los cambios se han guardado en este dispositivo' : 'Guardando…'}
          >
            <Cloud size={16} className={saveStatus === 'Guardado' ? '' : 'animate-pulse text-[#0f6cbd]'} />
            {saveStatus}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-0.5 pl-3 ml-1 border-l border-[#d7dce5]">
          <Btn icon={<Undo2 size={17} />} title="Deshacer (Ctrl+Z)" onClick={() => c().undo().run()} disabled={!editor.can().undo()} />
          <Btn icon={<Redo2 size={17} />} title="Rehacer (Ctrl+Y)" onClick={() => c().redo().run()} disabled={!editor.can().redo()} />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="flex items-center gap-2 h-9 pl-4 pr-5 rounded-full bg-[#c2e7ff] text-[#001d35] text-[14px] font-medium hover:shadow-md transition-shadow">
            <Share2 size={16} />
            <span className="hidden sm:inline">Compartir</span>
          </button>
          <div
            className="w-9 h-9 rounded-full grid place-items-center text-white text-[14px] font-semibold bg-gradient-to-br from-[#0f6cbd] to-[#5b3fd0]"
            title="Wordly"
          >
            W
          </div>
        </div>
      </div>

      {/* ===== Pestañas ===== */}
      <div role="tablist" className="flex items-end gap-0.5 px-3 text-[13px] overflow-x-auto">
        {tabs.map((t) => {
          const active = tab === t;
          const contextual = t === 'Tabla';
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={clsx(
                'relative px-3.5 py-1.5 rounded-t-lg transition-colors shrink-0',
                active ? 'font-semibold' : 'hover:bg-black/[0.05]',
                contextual ? 'text-[#0b7a6f]' : active ? 'text-[#0f6cbd]' : 'text-[#444746]'
              )}
            >
              {contextual ? 'Diseño de tabla' : t}
              {active && (
                <span className={clsx('absolute left-2.5 right-2.5 bottom-0 h-[3px] rounded-full', contextual ? 'bg-[#0b7a6f]' : 'bg-[#0f6cbd]')} />
              )}
            </button>
          );
        })}
      </div>

      {/* ===== Panel de herramientas ===== */}
      <div
        className="mx-3 mt-1 mb-2 rounded-2xl bg-[var(--ribbon)] h-[94px] px-1.5 py-1.5 flex items-stretch overflow-x-auto overflow-y-hidden custom-scrollbar-thin"
        role="tabpanel"
      >
        {tab === 'Inicio' && (
          <>
            <Group label="Portapapeles">
              <LargeBtn icon={<ClipboardPaste size={22} />} label="Pegar" onClick={doPaste} />
              <div className="flex flex-col justify-center gap-0.5">
                <TextBtn icon={<Scissors size={14} />} label="Cortar" onClick={doCut} disabled={!hasSelection} />
                <TextBtn icon={<Copy size={14} />} label="Copiar" onClick={doCopy} disabled={!hasSelection} />
              </div>
            </Group>

            <Group label="Fuente">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                  <Select
                    title="Fuente"
                    width={140}
                    value={currentFont}
                    onChange={(v) => c().setMark('textStyle', { fontFamily: v }).run()}
                    options={fontOptions.map((f) => ({ value: f, label: f, font: f }))}
                  />
                  <Select
                    title="Tamaño de fuente"
                    width={62}
                    value={String(currentSize)}
                    onChange={(v) => setSize(Number(v))}
                    options={sizeOptions.map((s) => ({ value: String(s), label: String(s) }))}
                  />
                  <Btn icon={<span className="text-[14px] font-semibold leading-none">A<sup className="text-[8px]">+</sup></span>} title="Aumentar tamaño" onClick={() => stepSize(1)} />
                  <Btn icon={<span className="text-[11px] font-semibold leading-none">A<sup className="text-[8px]">−</sup></span>} title="Reducir tamaño" onClick={() => stepSize(-1)} />
                  <Btn icon={<RemoveFormatting size={15} />} title="Borrar formato" onClick={() => c().unsetAllMarks().clearNodes().run()} />
                </div>
                <div className="flex items-center gap-0.5">
                  <Btn icon={<Bold size={15} />} title="Negrita (Ctrl+B)" active={editor.isActive('bold')} onClick={() => c().toggleBold().run()} />
                  <Btn icon={<Italic size={15} />} title="Cursiva (Ctrl+I)" active={editor.isActive('italic')} onClick={() => c().toggleItalic().run()} />
                  <Btn icon={<UnderlineIcon size={15} />} title="Subrayado (Ctrl+U)" active={editor.isActive('underline')} onClick={() => c().toggleUnderline().run()} />
                  <Btn icon={<Strikethrough size={15} />} title="Tachado" active={editor.isActive('strike')} onClick={() => c().toggleStrike().run()} />
                  <Sep />
                  <Dropdown
                    button={(open, toggle) => (
                      <button
                        type="button"
                        title="Color de fuente"
                        aria-label="Color de fuente"
                        onClick={toggle}
                        className={clsx('relative w-9 h-7 rounded-md flex flex-col items-center justify-center hover:bg-black/[0.07]', open && 'bg-black/[0.07]')}
                      >
                        <Baseline size={15} className="text-[#3c4043]" />
                        <span className="mt-px h-[3px] w-4 rounded-full border border-black/10" style={{ background: textStyle.color || '#1f1f1f' }} />
                        <ChevronDown size={9} className="absolute right-1 bottom-1.5 text-[#5f6368]" />
                      </button>
                    )}
                  >
                    {(close) => (
                      <div className="w-[236px]">
                        <MenuItem onClick={() => { c().unsetColor().run(); close(); }}>Automático</MenuItem>
                        <Swatches rows={TEXT_PALETTE} current={textStyle.color} onPick={(col) => { c().setColor(col).run(); close(); }} />
                      </div>
                    )}
                  </Dropdown>
                  <Dropdown
                    button={(open, toggle) => (
                      <button
                        type="button"
                        title="Color de resaltado"
                        aria-label="Color de resaltado"
                        onClick={toggle}
                        className={clsx('relative w-9 h-7 rounded-md flex flex-col items-center justify-center hover:bg-black/[0.07]', open && 'bg-black/[0.07]')}
                      >
                        <Highlighter size={15} className="text-[#3c4043]" />
                        <span className="mt-px h-[3px] w-4 rounded-full border border-black/10" style={{ background: textStyle.backgroundColor || '#fff475' }} />
                        <ChevronDown size={9} className="absolute right-1 bottom-1.5 text-[#5f6368]" />
                      </button>
                    )}
                  >
                    {(close) => (
                      <div className="w-[236px]">
                        <MenuItem onClick={() => { c().setMark('textStyle', { backgroundColor: null }).run(); close(); }}>Sin resaltado</MenuItem>
                        <Swatches rows={[HIGHLIGHTS]} current={textStyle.backgroundColor} onPick={(col) => { c().setMark('textStyle', { backgroundColor: col }).run(); close(); }} />
                      </div>
                    )}
                  </Dropdown>
                </div>
              </div>
            </Group>

            <Group label="Párrafo">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-0.5">
                  <Btn icon={<List size={16} />} title="Viñetas" active={editor.isActive('bulletList')} onClick={() => c().toggleBulletList().run()} />
                  <Btn icon={<ListOrdered size={16} />} title="Numeración" active={editor.isActive('orderedList')} onClick={() => c().toggleOrderedList().run()} />
                  <Btn icon={<Outdent size={16} />} title="Disminuir sangría" disabled={!editor.can().liftListItem('listItem')} onClick={() => c().liftListItem('listItem').run()} />
                  <Btn icon={<Indent size={16} />} title="Aumentar sangría" disabled={!editor.can().sinkListItem('listItem')} onClick={() => c().sinkListItem('listItem').run()} />
                  <Sep />
                  <Dropdown
                    button={(open, toggle) => (
                      <button
                        type="button"
                        title="Interlineado"
                        aria-label="Interlineado"
                        onClick={toggle}
                        className={clsx('h-7 pl-1.5 pr-1 rounded-md flex items-center gap-0.5 text-[#3c4043] hover:bg-black/[0.07]', open && 'bg-black/[0.07]')}
                      >
                        <ArrowUpDown size={15} />
                        <ChevronDown size={10} className="text-[#5f6368]" />
                      </button>
                    )}
                  >
                    {(close) => (
                      <div className="py-1 w-40">
                        <div className="px-3 py-1 text-[11px] text-[#5f6368]">Interlineado</div>
                        {LINE_SPACINGS.map((o) => (
                          <MenuItem key={o.value} checked={currentLH === o.value} onClick={() => { setLineHeight(o.value); close(); }}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </div>
                    )}
                  </Dropdown>
                </div>
                <div className="flex items-center gap-0.5">
                  <Btn icon={<AlignLeft size={16} />} title="Alinear a la izquierda" active={editor.isActive({ textAlign: 'left' })} onClick={() => c().setTextAlign('left').run()} />
                  <Btn icon={<AlignCenter size={16} />} title="Centrar" active={editor.isActive({ textAlign: 'center' })} onClick={() => c().setTextAlign('center').run()} />
                  <Btn icon={<AlignRight size={16} />} title="Alinear a la derecha" active={editor.isActive({ textAlign: 'right' })} onClick={() => c().setTextAlign('right').run()} />
                  <Btn icon={<AlignJustify size={16} />} title="Justificar" active={editor.isActive({ textAlign: 'justify' })} onClick={() => c().setTextAlign('justify').run()} />
                </div>
              </div>
            </Group>

            <Group label="Estilos">
              <div className="flex gap-1 h-full py-0.5">
                <StyleTile label="Normal" previewStyle={{ fontSize: 14, color: '#1f1f1f' }} active={editor.isActive('paragraph') && !editor.isActive('blockquote')} onClick={() => c().setParagraph().run()} />
                <StyleTile label="Título 1" previewStyle={{ fontSize: 16, fontWeight: 600, color: '#0f6cbd' }} active={editor.isActive('heading', { level: 1 })} onClick={() => c().setHeading({ level: 1 }).run()} />
                <StyleTile label="Título 2" previewStyle={{ fontSize: 14.5, fontWeight: 600, color: '#0c5699' }} active={editor.isActive('heading', { level: 2 })} onClick={() => c().setHeading({ level: 2 }).run()} />
                <StyleTile label="Título 3" previewStyle={{ fontSize: 13, fontWeight: 600, color: '#094074' }} active={editor.isActive('heading', { level: 3 })} onClick={() => c().setHeading({ level: 3 }).run()} />
                <StyleTile label="Cita" previewStyle={{ fontSize: 13.5, fontStyle: 'italic', color: '#605e5c' }} active={editor.isActive('blockquote')} onClick={() => c().toggleBlockquote().run()} />
              </div>
            </Group>
          </>
        )}

        {tab === 'Insertar' && (
          <>
            <Group label="Páginas">
              <LargeBtn icon={<SeparatorHorizontal size={22} />} label="Salto de página" onClick={() => c().setPageBreak().run()} />
            </Group>
            <Group label="Tablas">
              <Dropdown button={(open, toggle) => <LargeBtn icon={<Table2 size={22} />} label="Tabla" caret active={open} onClick={toggle} />}>
                {(close) => <TableGrid onPick={(r, col) => { c().insertTable({ rows: r, cols: col, withHeaderRow: true }).run(); close(); }} />}
              </Dropdown>
            </Group>
            <Group label="Ilustraciones">
              <LargeBtn icon={<ImagePlus size={22} />} label="Imagen" onClick={() => fileRef.current?.click()} />
              <LargeBtn icon={<Link2 size={22} />} label="Imagen web" onClick={addImageUrl} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            </Group>
            <Group label="Elementos">
              <LargeBtn icon={<Minus size={22} />} label="Línea" onClick={() => c().setHorizontalRule().run()} />
              <LargeBtn icon={<Quote size={22} />} label="Cita" active={editor.isActive('blockquote')} onClick={() => c().toggleBlockquote().run()} />
            </Group>
          </>
        )}

        {tab === 'Vista' && (
          <>
            <Group label="Mostrar">
              <div className="flex flex-col justify-center gap-1.5 px-2">
                <label className="flex items-center gap-2 text-[12px] text-[#1f1f1f] cursor-pointer">
                  <input type="checkbox" className="accent-[#0f6cbd] w-3.5 h-3.5" checked={showRuler} onChange={toggleRuler} /> Regla
                </label>
                <label className="flex items-center gap-2 text-[12px] text-[#1f1f1f] cursor-pointer">
                  <input type="checkbox" className="accent-[#0f6cbd] w-3.5 h-3.5" checked={showSidebar} onChange={toggleSidebar} /> Panel de navegación
                </label>
              </div>
            </Group>
            <Group label="Zoom">
              <LargeBtn icon={<ZoomOut size={22} />} label="Alejar" onClick={() => setZoomLevel(Math.max(25, zoomLevel - 10))} />
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                title="Restablecer al 100 %"
                className="h-full min-w-[56px] rounded-lg flex flex-col items-center justify-center gap-1 text-[#3c4043] hover:bg-black/[0.07]"
              >
                <span className="h-6 grid place-items-center text-[15px] font-semibold">{zoomLevel}%</span>
                <span className="text-[11px] leading-none">100 %</span>
              </button>
              <LargeBtn icon={<ZoomIn size={22} />} label="Acercar" onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))} />
              <LargeBtn icon={<Maximize2 size={22} />} label="Ajustar ancho" onClick={fitWidth} />
            </Group>
          </>
        )}

        {tab === 'Archivo' && (
          <>
            <Group label="Exportar">
              <LargeBtn icon={<FileDown size={22} />} label="PDF" onClick={() => exportToPdf('a4-document', activeDoc.title)} />
              <LargeBtn icon={<FileText size={22} />} label="Word (.docx)" onClick={() => exportToDocxBasic(activeDoc.title, editor.getText())} />
            </Group>
            <Group label="Documento">
              <LargeBtn icon={<Home size={22} />} label="Inicio" onClick={() => setActiveDoc(null)} />
            </Group>
          </>
        )}

        {tab === 'Tabla' && inTable && (
          <>
            <Group label="Filas y columnas">
              <LargeBtn icon={<BetweenHorizontalStart size={22} />} label="Fila arriba" onClick={() => c().addRowBefore().run()} />
              <LargeBtn icon={<BetweenHorizontalEnd size={22} />} label="Fila abajo" onClick={() => c().addRowAfter().run()} />
              <LargeBtn icon={<BetweenVerticalStart size={22} />} label="Col. izquierda" onClick={() => c().addColumnBefore().run()} />
              <LargeBtn icon={<BetweenVerticalEnd size={22} />} label="Col. derecha" onClick={() => c().addColumnAfter().run()} />
            </Group>
            <Group label="Celdas">
              <LargeBtn icon={<Merge size={22} />} label="Combinar" onClick={() => c().mergeCells().run()} disabled={!editor.can().mergeCells()} />
              <LargeBtn icon={<Split size={22} />} label="Dividir" onClick={() => c().splitCell().run()} disabled={!editor.can().splitCell()} />
              <LargeBtn icon={<Table2 size={22} />} label="Encabezado" onClick={() => c().toggleHeaderRow().run()} />
            </Group>
            <Group label="Eliminar">
              <LargeBtn danger icon={<Trash2 size={22} />} label="Fila" onClick={() => c().deleteRow().run()} />
              <LargeBtn danger icon={<Trash2 size={22} />} label="Columna" onClick={() => c().deleteColumn().run()} />
              <LargeBtn danger icon={<Trash2 size={22} />} label="Tabla" onClick={() => c().deleteTable().run()} />
            </Group>
          </>
        )}
      </div>
    </div>
  );
};
