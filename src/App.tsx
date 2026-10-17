import { useEffect, useState, useRef } from 'react';
import { useEditorStore } from './store/useEditorStore';
import { db, WordDocument } from './db/database';
import { EditorA4 } from './components/editor/EditorA4';
import { FileText, Plus, Trash2, Upload, File, Clock, Search } from 'lucide-react';
import { importDocx } from './utils/import';

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
    if(confirm('¿Estás seguro de eliminar este documento?')) {
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
    <div className="h-screen overflow-y-auto bg-[#faf9f8] flex flex-col font-sans">
      <div className="bg-[#0f6cbd] text-white p-3 shadow-md flex items-center justify-between sticky top-0 z-10 shrink-0">
         <div className="flex items-center space-x-3 pl-2">
           <div className="bg-white p-1 rounded-sm">
             <FileText size={22} className="text-[#0f6cbd]" />
           </div>
           <span className="text-xl font-semibold tracking-wide">Wordly</span>
         </div>
      </div>
      
      <div className="max-w-5xl mx-auto w-full p-6 md:p-10 mt-4">
        <h1 className="text-4xl font-light text-[#201f1e] mb-10">Buenas tardes</h1>
        
        <div className="mb-14">
          <div className="flex flex-wrap gap-6">
            <div onClick={createNewDoc} className="w-52 h-64 bg-white border border-[#e1dfdd] hover:border-[#0f6cbd] hover:shadow-lg cursor-pointer flex flex-col items-center justify-center rounded-lg transition-all duration-200 group">
              <div className="w-16 h-16 rounded-full bg-[#f3f2f1] flex items-center justify-center mb-6 text-[#0f6cbd] group-hover:bg-[#e1f0fe] transition-colors">
                <Plus size={32} />
              </div>
              <span className="text-[#323130] font-medium text-lg">Documento en blanco</span>
            </div>

            <div onClick={() => fileInputRef.current?.click()} className="w-52 h-64 bg-white border border-[#e1dfdd] hover:border-[#0f6cbd] hover:shadow-lg cursor-pointer flex flex-col items-center justify-center rounded-lg transition-all duration-200 group">
              <div className="w-16 h-16 rounded-full bg-[#f3f2f1] flex items-center justify-center mb-6 text-[#0f6cbd] group-hover:bg-[#e1f0fe] transition-colors">
                <Upload size={32} />
              </div>
              <span className="text-[#323130] font-medium text-lg">Importar DOCX</span>
              <input type="file" accept=".docx" className="hidden" ref={fileInputRef} onChange={handleImport} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-[#201f1e]">Documentos recientes</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar documento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 border border-[#e1dfdd] rounded-md focus:outline-none focus:border-[#0f6cbd] focus:ring-1 focus:ring-[#0f6cbd] text-sm w-64 bg-white" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#e1dfdd] overflow-hidden">
            {filteredDocs.length === 0 ? (
              <div className="p-12 flex flex-col items-center text-center text-[#605e5c]">
                <File size={48} className="mb-4 text-[#c8c6c4]" />
                <p className="text-lg font-medium">No se encontraron documentos</p>
                <p className="text-sm mt-1">Crea uno nuevo o importa un archivo DOCX para empezar.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-[#e1dfdd] text-[#605e5c] text-sm bg-[#faf9f8]">
                    <th className="font-semibold p-4 w-[50%]">Nombre</th>
                    <th className="font-semibold p-4 w-[30%]">Modificado</th>
                    <th className="font-semibold p-4 w-[20%] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} onClick={() => setActiveDoc(doc)} className="border-b border-[#f3f2f1] hover:bg-[#f3f2f1] cursor-pointer group transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-4">
                          <FileText size={20} className="text-[#0f6cbd] flex-shrink-0" />
                          <span className="font-medium text-[#323130] truncate">{doc.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-[#605e5c]">
                        <div className="flex items-center space-x-2">
                          <Clock size={14} className="flex-shrink-0" />
                          <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <button onClick={(e) => deleteDoc(doc.id, e)} className="p-2 text-[#a4262c] hover:bg-[#fde7e9] rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100 transition-all" title="Eliminar">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
