export const GAME_COUNT_BY_TOPIC = {
  colors: 7,
  shapes: 8,
  sequencing: 9,
  addition: 15,
  subtraction: 9,
  numbers: 8,
  measurement: 6,
  comparison: 11,
  clock: 7,
} as const;

export type TeacherTopicId = keyof typeof GAME_COUNT_BY_TOPIC;

export type GameCatalogEntry = {
  topicId: TeacherTopicId;
  gameId: string;
  gameOrder: number;
  title: string;
  maxScore: number;
};

const GAME_TITLES: Record<TeacherTopicId, readonly string[]> = {
  colors: ["Color Matching Game", "Balloon Finding Game", "Rainbow Color Catcher", "Rainbow Color Adventure Deluxe", "Rainbow Galaxy Explorer", "Choose Which Color", "Little Color Artists"],
  shapes: ["Shape Matching", "Find the Shape", "Monster Cafe", "Shape Matcher", "Shape Hunter", "Shape Racing", "Shape Wizard", "Hungry Dinosaur"],
  sequencing: ["Arrange Numbers", "Alphabet Express", "Size Sorter", "Shortest to Longest", "Smallest to Biggest Cake", "Surprise Sequencing", "Mega Animal & Vehicle Builder", "Pattern Breaker Train", "Sandwich Maker"],
  addition: ["Addition Adventure", "Dice Addition Adventure", "Star Math", "Rainbow Addition Garden", "Addition Fun", "Count the Apples", "Fruit Pop Math", "Addition Adventure", "Addition Round 2", "Animal Safari", "Under the Sea", "Magic Carnival", "Ice Cream Shop", "Magic Pizza Chef", "Star Catcher"],
  subtraction: ["Balloon Pop Subtraction", "Fruit Subtraction", "Gentle Math Drift", "Subtraction Adventure", "Subtraction Pop", "Magical Dino Egg Hatchery", "Farmyard Hide & Seek", "Feed the Hippo", "Space Blast"],
  numbers: ["Drag the Correct Number", "Count & Match Adventure", "Animal Pop", "Feed the Hungry Monster", "Whack-a-Mole", "Deep Diver: Number Explorer", "The Magic Toy Factory", "Number Monster"],
  measurement: ["Slow & Fun Measurement", "Small & Short", "Heavy or Light?", "The Tiny Builder's Ruler", "Magic Rainbow Bridge", "Growing Inchworm"],
  comparison: ["Paghahambing ng Mahaba, Mas Mahaba, Pinakamahaba", "Pag-aayos ng Laki", "Marami o Kaunti?", "Mataas o Mababa?", "Match Big & Small Letters", "The Barnyard Balance", "The Sky Explorer", "The Mad Scientist's Liquid Lab", "Which is Longer?", "Heavy or Light?", "Catch & Measure!"],
  clock: ["Time Adventure", "Time Matcher", "Drag the Matching Clock", "Fill in the Missing Time", "Daily Routine Time", "Build the Clock", "What Time Is It?"],
};

export const GAME_CATALOG: readonly GameCatalogEntry[] = (
  Object.entries(GAME_COUNT_BY_TOPIC) as [TeacherTopicId, number][]
).flatMap(([topicId, count]) =>
  Array.from({ length: count }, (_, gameOrder) => ({
    topicId,
    gameId: `${topicId}:${gameOrder}`,
    gameOrder,
    title: GAME_TITLES[topicId][gameOrder],
    maxScore: 1,
  })),
);

export function getGameCatalogEntry(topicId: string, gameOrder: number): GameCatalogEntry | null {
  return GAME_CATALOG.find((entry) => entry.topicId === topicId && entry.gameOrder === gameOrder) ?? null;
}
