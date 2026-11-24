export type PatternPair = {
  a: string;
  b: string;
};

export type PatternTrio = {
  a: string;
  b: string;
  c: string;
};

export type PatternSessions = {
  pairs: PatternPair[];
  trios: PatternTrio[];
  hard: PatternTrio[];
};

export type PatternRound = {
  sequence: string[];
  expectedSequence: string[];
  oddIndex: number;
  oddItem: string;
  difficulty: 'ab' | 'abc' | 'abb';
};

function choose<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function replaceAt(items: string[], index: number, value: string): string[] {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

export function buildPatternRound(
  level: number,
  sessions: PatternSessions,
  random: () => number = Math.random,
): PatternRound {
  let expectedSequence: string[];
  let difficulty: PatternRound['difficulty'];

  if (level <= 5) {
    const pair = sessions.pairs[(level - 1) % sessions.pairs.length];
    expectedSequence = [pair.a, pair.b, pair.a, pair.b, pair.a, pair.b];
    difficulty = 'ab';
  } else if (level <= 8) {
    const trio = sessions.trios[(level - 6) % sessions.trios.length];
    expectedSequence = [trio.a, trio.b, trio.c, trio.a, trio.b, trio.c];
    difficulty = 'abc';
  } else {
    const trio = sessions.hard[(level - 9) % sessions.hard.length];
    expectedSequence = [trio.a, trio.b, trio.b, trio.a, trio.b, trio.b];
    difficulty = 'abb';
  }

  // Keep the intruder away from the locomotive and final carriage so the
  // learner has to inspect the sequence rather than rely on an edge clue.
  const oddIndex = 1 + Math.floor(random() * 4);
  const expectedItem = expectedSequence[oddIndex];
  const alternatives = Array.from(new Set(expectedSequence)).filter((item) => item !== expectedItem);
  const oddItem = choose(alternatives, random);

  return {
    sequence: replaceAt(expectedSequence, oddIndex, oddItem),
    expectedSequence,
    oddIndex,
    oddItem,
    difficulty,
  };
}
