export type ExplorerItem =
  | 'ball'
  | 'clock'
  | 'gift'
  | 'cookie'
  | 'pizza'
  | 'flag'
  | 'sandwich'
  | 'window'
  | 'tile'
  | 'egg'
  | 'oval'
  | 'phone'
  | 'door'
  | 'book'
  | 'star'
  | 'heart';

export type LittleExplorerRound = {
  items: readonly [ExplorerItem, ExplorerItem, ExplorerItem, ExplorerItem];
  answerIndex: 0 | 1 | 2 | 3;
};

/** Fixed round order and answer key from munting_eksplorador_music.html. */
export const LITTLE_EXPLORER_ROUNDS = [
  { items: ['ball', 'clock', 'gift', 'cookie'], answerIndex: 2 },
  { items: ['pizza', 'flag', 'sandwich', 'cookie'], answerIndex: 3 },
  { items: ['window', 'clock', 'tile', 'gift'], answerIndex: 1 },
  { items: ['egg', 'ball', 'clock', 'cookie'], answerIndex: 0 },
  { items: ['phone', 'door', 'book', 'pizza'], answerIndex: 3 },
  { items: ['star', 'star', 'heart', 'star'], answerIndex: 2 },
  { items: ['cookie', 'window', 'tile', 'gift'], answerIndex: 0 },
  { items: ['pizza', 'heart', 'flag', 'sandwich'], answerIndex: 1 },
  { items: ['egg', 'oval', 'ball', 'egg'], answerIndex: 2 },
  { items: ['door', 'phone', 'book', 'star'], answerIndex: 3 },
] as const satisfies readonly LittleExplorerRound[];

export function isLittleExplorerAnswerCorrect(round: LittleExplorerRound, choiceIndex: number): boolean {
  return choiceIndex === round.answerIndex;
}
