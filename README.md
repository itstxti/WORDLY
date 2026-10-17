# Wordly - Clon web de Microsoft Word

Aplicación web de procesamiento de textos inspirada en Microsoft Word, desarrollada con React, TypeScript, Vite y Tiptap.

## Tecnologías utilizadas
* **React + TypeScript + Vite**
* **Tailwind CSS** (Estilos y diseño)
* **Tiptap** (Motor de edición de texto enriquecido)
* **Zustand** (Gestión de estado)
* **Dexie (IndexedDB)** (Persistencia local)
* **html2pdf.js** (Exportación a PDF)
* **Lucide React** (Iconografía)

## Cómo ejecutar el proyecto

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

3. Abrir en el navegador (generalmente `http://localhost:5173`)

## Características implementadas
* ✅ Pantalla de inicio con documentos recientes.
* ✅ Persistencia de datos en IndexedDB.
* ✅ Creación, edición, renombrado y eliminación de documentos.
* ✅ Interfaz inspirada en Word (Cinta de opciones, Barra de estado).
* ✅ Edición de texto (Negrita, cursiva, subrayado, alineaciones).
* ✅ Autoguardado e indicador de estado.
* ✅ Vista de página A4 con sombras.
* ✅ Exportación a PDF conservando estilos visuales.

## Próximos pasos (Fases 3 y 4)
* Soporte nativo y visual de saltos de página (Paginación avanzada).
* Inserción y formato avanzado de tablas e imágenes.
* Exportación/Importación de DOCX nativo completo (Mammoth / docx).
* Integración con Supabase para la nube.
