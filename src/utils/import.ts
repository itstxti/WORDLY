import * as mammoth from 'mammoth';

export const importDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        reject(new Error("No se pudo leer el archivo"));
        return;
      }

      try {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        resolve(result.value); // HTML generado a partir del DOCX
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
