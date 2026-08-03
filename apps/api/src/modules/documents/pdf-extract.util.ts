/**
 * Estrazione testo da PDF (docs/03-sistema-ricerca.md §3.5), usata per indicizzare
 * i manuali nel motore di ricerca full-text. Funziona solo su PDF "testuali"
 * (con layer di testo incorporato): i documenti scansionati come immagine
 * restituiscono testo vuoto/nullo e richiederebbero un fallback OCR (Tesseract),
 * non incluso in questo scaffold — vedi criticità nel documento di progettazione.
 *
 * Legge il file via HTTP dall'URL pubblico invece che dal disco locale: funziona
 * sia con il provider di storage locale sia con Supabase Storage (vedi modules/storage),
 * senza bisogno di sapere dove il file è fisicamente salvato.
 */
export async function extractPdfText(fileUrl: string): Promise<string | null> {
  if (!fileUrl.toLowerCase().endsWith('.pdf')) return null;

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) return null;
    const data = Buffer.from(await response.arrayBuffer());

    // Import dinamico: pdf-parse carica pdf.js internamente, evitiamo il costo
    // all'avvio del processo se il modulo non serve.
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data });
    const result = await parser.getText();
    await parser.destroy();
    const text = result.text?.trim();
    return text ? text : null;
  } catch {
    return null;
  }
}
