import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// Para una exportación básica extrayendo solo el texto plano:
export const exportToDocxBasic = async (title: string, rawText: string) => {
  const paragraphs = rawText.split('\n').map(text => 
    new Paragraph({
      children: [new TextRun(text)],
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}.docx`);
};
