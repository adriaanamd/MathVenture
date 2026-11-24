import { GAME_COUNT_BY_TOPIC, type TeacherTopicId } from './catalog';

export const FREE_PLAY_GAME_COUNT_BY_TOPIC = {
  ...GAME_COUNT_BY_TOPIC,
  colors: GAME_COUNT_BY_TOPIC.colors,
  shapes: GAME_COUNT_BY_TOPIC.shapes + 1,
  sequencing: GAME_COUNT_BY_TOPIC.sequencing + 1,
  addition: GAME_COUNT_BY_TOPIC.addition + 1,
  subtraction: GAME_COUNT_BY_TOPIC.subtraction + 1,
  numbers: GAME_COUNT_BY_TOPIC.numbers + 1,
  measurement: GAME_COUNT_BY_TOPIC.measurement + 1,
} as const;

export const FREE_PLAY_DRAWING_BOARD_GAME_ORDERS: Partial<Record<TeacherTopicId, number>> = {
  shapes: 8,
  sequencing: 9,
  addition: 15,
  subtraction: 9,
  numbers: 8,
  measurement: 6,
};

export function getFreePlayGameCount(topicId: string): number {
  return FREE_PLAY_GAME_COUNT_BY_TOPIC[topicId as TeacherTopicId] ?? 0;
}

export function isFreePlayDrawingBoard(topicId: string, gameOrder: number): boolean {
  return FREE_PLAY_DRAWING_BOARD_GAME_ORDERS[topicId as TeacherTopicId] === gameOrder;
}

export function isDrawingBoardAvailable(
  topicId: string,
  gameOrder: number,
  isAssignedQuiz: boolean,
): boolean {
  return !isAssignedQuiz && isFreePlayDrawingBoard(topicId, gameOrder);
}
