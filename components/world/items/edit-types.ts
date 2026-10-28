/** Typing in place on one text field. */
export type TextEdit = { typing: boolean; onType: (v: string) => void; onDone: () => void };
