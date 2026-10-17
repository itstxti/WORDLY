import { useEffect, useMemo, useState, useRef } from 'react';
import { useEditorStore } from './store/useEditorStore';
import { db, WordDocument } from './db/database';
import { EditorA4 } from './components/editor/EditorA4';
import { FileText, Plus, Trash2, Upload, Search, X } from 'lucide-react';
import { importDocx } from './utils/import';

const greeting = () => {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
};

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

type Block = { tag: 'h1' | 'h2' | 'h3' | 'p'; text: string };

/** Extrae unos pocos bloques de texto del HTML para pintar una miniatura (sin insertar HTML ajeno en la página). */
const previewBlocks = (html: string): Block[] => {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out: Block[] = [];
  doc.body.querySelectorAll('h1, h2, h3, p, li, blockquote').forEach((el) => {
    const text = el.textContent?.trim();
    if (!text || out.length >= 14) return;
    const tag = el.tagName.toLowerCase();
    out.push({ tag: tag === 'h1' || tag === 'h2' || tag === 'h3' ? tag : 'p', text });
  });
  return out;
};

/** Miniatura de hoja A4 con el principio del documento. */
const Thumbnail = ({ html }: { html: string }) => {
  const blocks = useMemo(() => previewBlocks(html), [html]);
  return (
    <div className="relative w-full aspect-[210/260] bg-white overflow-hidden px-[11%] pt-[12%]" aria-hidden>
      {blocks.length === 0 ? (
        <div className="space-y-1.5 opacity-60">
          {[90, 100, 70, 95, 55].map((w, i) => (
            <div key={i} className="h-[3px] rounded-full bg-[#dfe3ea]" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : (
        blocks.map((b, i) =>
          b.tag === 'p' ? (
            <p key={i} className="text-[5.5px] leading-[1.5] text-[#6b7078] mb-[3px] line-clamp-2 break-words">{b.text}</p>
          ) : (
            <p
              key={i}
              className="font-semibold leading-tight mb-[3px] mt-[5px] truncate"
              style={{
                fontSize: b.tag === 'h1' ? 11 : b.tag === 'h2' ? 8.5 : 7,
                color: b.tag === 'h1' ? '#0f6cbd' : b.tag === 'h2' ? '#0c5699' : '#094074',
              }}
            >
              {b.text}
            </p>
          )
        )
      )}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};

function App() {
  const { activeDoc, setActiveDoc, createNewDoc } = useEditorStore();
  const [documents, setDocuments] = useState<WordDocument[]>([]);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeDoc) {
      loadDocuments();
    }
  }, [activeDoc]);

  const loadDocuments = async () => {
    const docs = await db.documents.orderBy('updatedAt').reverse().toArray();
    setDocuments(docs);
  };

  const deleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este documento?')) {
      await db.documents.delete(id);
      loadDocuments();
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const htmlContent = await importDocx(file);
      const newDoc: WordDocument = {
        id: crypto.randomUUID(),
        title: file.name.replace('.docx', ''),
        content: htmlContent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        wordCount: 0
      };
      await db.documents.add(newDoc);
      setActiveDoc(newDoc);
    } catch (error) {
      alert("Error al importar el archivo DOCX");
      console.error(error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredDocs = documents.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase()));

  if (activeDoc) {
    return <EditorA4 />;
  }

  return (
    <div className="h-screen overflow-y-auto bg-white font-sans">
      {/* Barra superior: logotipo + buscador en píldora (estilo Google Docs) */}
      <header className="sticky top-0 z-10 bg-[var(--chrome)]/95 backdrop-blur flex items-center gap-4 px-4 h-16 border-b border-transparent">
        <div className="flex items-center gap-2.5 w-52 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#0f6cbd] text-white grid place-items-center">
            <FileText size={20} />
          </div>
          <span className="text-[22px] text-[#444746] tracking-tight">Wordly</span>
        </div>

        <label className="flex-1 max-w-[720px] mx-auto h-12 rounded-full bg-[#e9eef6] focus-within:bg-white focus-within:shadow-[0_1px_3px_rgba(60,64,67,0.3),0_2px_8px_2px_rgba(60,64,67,0.15)] flex items-center gap-3 px-5 transition-all cursor-text">
          <Search size={20} className="text-[#444746] shrink-0" />
          <input
            type="text"
            placeholder="Buscar"
            aria-label="Buscar documentos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[16px] text-[#1f1f1f] placeholder-[#5f6368] focus:outline-none min-w-0"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Borrar búsqueda" className="text-[#5f6368] hover:text-[#1f1f1f]">
              <X size={18} />
            </button>
          )}
        </label>

        <div className="w-52 shrink-0 flex justify-end">
          <div className="w-9 h-9 rounded-full grid place-items-center text-white text-[14px] font-semibold bg-gradient-to-br from-[#0f6cbd] to-[#5b3fd0]">W</div>
        </div>
      </header>

      <main>
        {/* Iniciar un documento nuevo */}
        <section className="bg-[#f1f3f4]">
          <div className="max-w-[1000px] mx-auto px-6 py-6">
            <h1 className="text-[28px] font-light text-[#1f1f1f] leading-tight">{greeting()}</h1>
            <p className="text-[13px] text-[#5f6368] mt-1 mb-5">Iniciar un documento nuevo</p>
            <div className="flex flex-wrap gap-6">
              {[
                { label: 'Documento en blanco', icon: <Plus size={44} strokeWidth={1.5} />, onClick: createNewDoc },
                { label: 'Importar DOCX', icon: <Upload size={34} strokeWidth={1.5} />, onClick: () => fileInputRef.current?.click() },
              ].map((c) => (
                <button key={c.label} onClick={c.onClick} className="group w-[148px] text-left" aria-label={c.label}>
                  <div className="w-[148px] h-[190px] rounded-lg bg-white border border-[#dadce0] group-hover:border-[#0f6cbd] group-hover:shadow-md grid place-items-center text-[#0f6cbd] transition-all">
                    {c.icon}
                  </div>
                  <div className="mt-2 text-[13px] font-medium text-[#1f1f1f]">{c.label}</div>
                </button>
              ))}
              <input type="file" accept=".docx" className="hidden" ref={fileInputRef} onChange={handleImport} />
            </div>
          </div>
        </section>

        {/* Documentos recientes */}
        <section className="max-w-[1000px] mx-auto px-6 py-6">
          <h2 className="text-[16px] font-medium text-[#1f1f1f] mb-4">Documentos recientes</h2>

          {filteredDocs.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center text-[#5f6368]">
              <div className="w-16 h-16 rounded-full bg-[#f1f3f4] grid place-items-center mb-4">
                <FileText size={30} className="text-[#9aa0a6]" />
              </div>
              <p className="text-[16px] font-medium text-[#1f1f1f]">
                {documents.length === 0 ? 'Aún no tienes documentos' : 'No se encontraron documentos'}
              </p>
              <p className="text-[13px] mt-1">
                {documents.length === 0 ? 'Crea uno en blanco o importa un archivo DOCX para empezar.' : 'Prueba con otro nombre.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className="group rounded-lg border border-[#dadce0] hover:border-[#0f6cbd] hover:shadow-md bg-white overflow-hidden cursor-pointer transition-all"
                >
                  <div className="relative border-b border-[#eceff1] bg-[#f8f9fa]">
                    <Thumbnail html={doc.content} />
                    <button
                      onClick={(e) => deleteDoc(doc.id, e)}
                      title="Eliminar"
                      aria-label={`Eliminar ${doc.title}`}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 shadow-[0_1px_3px_rgba(60,64,67,0.35)] grid place-items-center text-[#5f6368] hover:bg-[#fce8e6] hover:text-[#b3261e] opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex items-start gap-2 p-3">
                    <div className="w-5 h-5 mt-0.5 rounded bg-[#0f6cbd] text-white grid place-items-center shrink-0">
                      <FileText size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-medium text-[#1f1f1f] truncate" title={doc.title}>{doc.title || 'Documento sin título'}</div>
                      <div className="text-[12px] text-[#5f6368] mt-0.5">{formatDate(doc.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
