/**
 * Regole di scoring per tipo di domanda (vedi docs/04-sistema-quiz.md §4.4).
 * Lo scoring avviene sempre server-side: il client non riceve mai la risposta corretta.
 */
type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'OPEN_TEXT'
  | 'FILL_BLANK'
  | 'DRAG_DROP'
  | 'ORDERING'
  | 'IMAGE_CHOICE';

export function stripCorrectAnswer(type: QuestionType, payload: any) {
  const clone = structuredClone(payload);
  switch (type) {
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE':
    case 'IMAGE_CHOICE':
      delete clone.correct;
      break;
    case 'FILL_BLANK':
      delete clone.blanks;
      break;
    case 'DRAG_DROP':
      delete clone.correctMap;
      break;
    case 'ORDERING':
      delete clone.correctOrder;
      break;
    case 'OPEN_TEXT':
      delete clone.keywords;
      break;
  }
  return clone;
}

export function isAnswerCorrect(type: QuestionType, payload: any, answer: any): boolean {
  switch (type) {
    case 'MULTIPLE_CHOICE':
    case 'IMAGE_CHOICE':
      return (
        Array.isArray(answer) &&
        Array.isArray(payload.correct) &&
        answer.length === payload.correct.length &&
        answer.every((a: string) => payload.correct.includes(a))
      );
    case 'TRUE_FALSE':
      return answer === payload.correct;
    case 'FILL_BLANK':
      return Object.entries(payload.blanks ?? {}).every(
        ([key, value]) =>
          String(answer?.[key] ?? '').trim().toLowerCase() ===
          String(value).trim().toLowerCase(),
      );
    case 'DRAG_DROP':
      return Object.entries(payload.correctMap ?? {}).every(
        ([itemId, targetId]) => answer?.[itemId] === targetId,
      );
    case 'ORDERING':
      return (
        Array.isArray(answer) &&
        JSON.stringify(answer) === JSON.stringify(payload.correctOrder)
      );
    case 'OPEN_TEXT': {
      const text = String(answer ?? '').toLowerCase();
      const keywords: string[] = payload.keywords ?? [];
      return keywords.length === 0 || keywords.some((k) => text.includes(k.toLowerCase()));
    }
    default:
      return false;
  }
}
