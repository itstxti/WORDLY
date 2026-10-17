import { create } from 'zustand';
import { db, WordDocument } from '../db/database';

interface EditorState {
  activeDoc: WordDocument | null;
  saveStatus: 'Guardado' | 'Guardando…' | 'Sin conexión';
  showSidebar: boolean;
  zoomLevel: number;
  setActiveDoc: (doc: WordDocument | null) => void;
  updateContent: (content: string, wordCount: number) => void;
  updateTitle: (title: string) => void;
  createNewDoc: () => void;
  toggleSidebar: () => void;
  setZoomLevel: (zoom: number) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeDoc: null,
  saveStatus: 'Guardado',
  showSidebar: false,
  zoomLevel: 100,
  
  setActiveDoc: (doc) => set({ activeDoc: doc, saveStatus: 'Guardado' }),
  
  updateContent: async (content, wordCount) => {
    const { activeDoc } = get();
    if (!activeDoc) return;
    
    set({ saveStatus: 'Guardando…' });
    const updatedDoc = { ...activeDoc, content, wordCount, updatedAt: Date.now() };
    
    await db.documents.put(updatedDoc);
    set({ activeDoc: updatedDoc, saveStatus: 'Guardado' });
  },

  updateTitle: async (title) => {
    const { activeDoc } = get();
    if (!activeDoc) return;
    
    set({ saveStatus: 'Guardando…' });
    const updatedDoc = { ...activeDoc, title, updatedAt: Date.now() };
    
    await db.documents.put(updatedDoc);
    set({ activeDoc: updatedDoc, saveStatus: 'Guardado' });
  },
  
  createNewDoc: async () => {
    const newDoc: WordDocument = {
      id: crypto.randomUUID(),
      title: 'Documento sin título',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordCount: 0
    };
    await db.documents.add(newDoc);
    set({ activeDoc: newDoc, saveStatus: 'Guardado' });
  },

  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom })
}));
