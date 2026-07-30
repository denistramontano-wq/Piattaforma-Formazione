/**
 * Utilità NLP-lite (nessuna libreria esterna, nessuna chiamata di rete) usate dal
 * provider IA locale quando non è configurata una chiave API reale. Sono euristiche
 * deterministiche basate su frequenza delle parole, non un vero modello linguistico:
 * lo scopo è dimostrare l'intero flusso (generazione -> revisione -> approvazione)
 * senza dipendere da un servizio esterno a pagamento.
 */

const STOPWORDS = new Set(
  `il lo la i gli le un uno una di a da in con su per tra fra e o ma se non
   che chi cui come dove quando perché quale quanto questo questa questi queste
   quello quella quelli quelle è sono era erano essere stato stata suo sua suoi
   sue loro nostro nostra vostro vostra mio mia tuo tua al allo alla ai agli alle
   dal dallo dalla dai dagli dalle nel nello nella nei negli nelle sul sullo
   sulla sui sugli sulle del dello della dei degli delle si ci vi ne più anche
   ogni ogni tutti tutte tutto tutta viene vengono deve devono può possono cosa`
    .split(/\s+/)
    .filter(Boolean),
);

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ù])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function words(sentence: string): string[] {
  return (sentence.toLowerCase().match(/[a-zà-ù]+/g) ?? []).filter((w) => w.length > 3);
}

export function keywordFrequencies(text: string, limit = 12): { word: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const w of words(text)) {
    if (STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/** Punteggia le frasi in base alla presenza delle parole chiave più frequenti del testo. */
export function rankSentences(text: string): { sentence: string; score: number }[] {
  const sentences = splitSentences(text);
  const freq = new Map(keywordFrequencies(text, 30).map((k) => [k.word, k.count]));
  return sentences
    .map((sentence, index) => {
      const sentenceWords = words(sentence);
      const score =
        sentenceWords.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / Math.sqrt(sentenceWords.length || 1) -
        index * 0.05; // leggera preferenza per le frasi iniziali
      return { sentence, score };
    })
    .sort((a, b) => b.score - a.score);
}

/** Individua, in una frase, la parola "più saliente" (lunga e non banale) da usare come blank/risposta. */
export function pickSalientWord(sentence: string, exclude: Set<string> = new Set()): string | null {
  const candidates = (sentence.match(/[A-ZÀ-Ùa-zà-ù]+/g) ?? [])
    .filter((w) => w.length >= 5 && !STOPWORDS.has(w.toLowerCase()) && !exclude.has(w.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  return candidates[0] ?? null;
}
