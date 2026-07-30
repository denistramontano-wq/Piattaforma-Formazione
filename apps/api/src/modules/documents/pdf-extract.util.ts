import { readFile } from 'fs/promises';
import { basename, join } from 'path';
import { UPLOADS_DIR } from '../uploads/uploads.module';

/**
 * Estrazione testo da PDF (docs/03-sistema-ricerca.md §3.5), usata per indicizzare
 * i manuali nel motore di ricerca full-text. Funziona solo su PDF "testuali"
 * (con layer di testo incorporato): i documenti scansionati come immagine
 * restituiscono testo vuoto/nullo e richiederebbero un fallback OCR (Tesseract),
 * non incluso in questo scaffold — vedi criticità nel documento di progettazione.
 */
export async function extractPdfText(fileUrl: string): Promise<string | null> {
  if (!fileUrl.toLowerCase().endsWith('.pdf')) return null;

  try {
    // Import dinamico: pdf-parse carica pdf.js internamente, evitiamo il costo
    // all'avvio del processo se il modulo non serve.
    const { PDFParse } = await import('pdf-parse');
    const localPath = join(UPLOADS_DIR, basename(fileUrl));
    const data = await readFile(localPath);
    const parser = new PDFParse({ data });
    const result = await parser.getText();
    await parser.destroy();
    const text = result.text?.trim();
    return text ? text : null;
  } catch {
    return null;
  }
}
