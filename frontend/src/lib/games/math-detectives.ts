export type MathDetectiveGroup = 'A' | 'B';
export type MathDetectiveRelation = 'more' | 'less' | 'equal';

export type MathDetectiveQuestion = {
  leftCount: number;
  rightCount: number;
  item: string;
  itemName: string;
  group: MathDetectiveGroup;
  relation: MathDetectiveRelation;
};

/**
 * The source game is intentionally fixed rather than randomized. Keep this
 * order stable so the activity remains faithful to the downloaded version.
 */
export const MATH_DETECTIVE_QUESTIONS = [
  { leftCount: 5, rightCount: 3, item: '\u{1F34E}', itemName: 'mansanas', group: 'A', relation: 'more' },
  { leftCount: 2, rightCount: 6, item: '\u{1F41F}', itemName: 'isda', group: 'A', relation: 'more' },
  { leftCount: 4, rightCount: 4, item: '\u{2B50}', itemName: 'bituin', group: 'A', relation: 'equal' },
  { leftCount: 7, rightCount: 3, item: '\u{1F98B}', itemName: 'paruparo', group: 'B', relation: 'more' },
  { leftCount: 2, rightCount: 5, item: '\u{1F34C}', itemName: 'saging', group: 'A', relation: 'less' },
] as const satisfies readonly MathDetectiveQuestion[];

export function isMathDetectiveAnswerCorrect(
  question: MathDetectiveQuestion,
  answer: boolean,
): boolean {
  const selectedCount = question.group === 'A' ? question.leftCount : question.rightCount;
  const otherCount = question.group === 'A' ? question.rightCount : question.leftCount;

  const truth = question.relation === 'equal'
    ? selectedCount === otherCount
    : question.relation === 'more'
      ? selectedCount > otherCount
      : selectedCount < otherCount;

  return answer === truth;
}

export function getMathDetectiveStatement(question: MathDetectiveQuestion): string {
  const otherGroup = question.group === 'A' ? 'B' : 'A';

  if (question.relation === 'equal') {
    return `Magkapareho ang dami ng ${question.itemName} sa Pangkat A at Pangkat B.`;
  }

  const comparison = question.relation === 'more' ? 'marami' : 'kaunti';
  return `Mas ${comparison} ang ${question.itemName} sa Pangkat ${question.group} kaysa sa Pangkat ${otherGroup}.`;
}
