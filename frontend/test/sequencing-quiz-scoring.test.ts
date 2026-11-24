import { assertEquals } from "jsr:@std/assert";
import { scoreByPosition } from "../src/lib/games/sequence-scoring.ts";
import { buildPatternRound, type PatternSessions } from "../src/lib/games/pattern-train.ts";

const GAME_FILES = [
  "AnimalVehicleBuilder.tsx",
  "ArrangeLetters.tsx",
  "ArrangeNumbers.tsx",
  "PatternTrainAcademy.tsx",
  "SandwichMaker.tsx",
  "ShortestLongest.tsx",
  "SizeSorter.tsx",
  "SmallestLargestCake.tsx",
  "SurpriseSequencing.tsx",
];

const readGameSource = (fileName: string) =>
  Deno.readTextFile(new URL(`../src/components/games/3-sequencing/${fileName}`, import.meta.url));

Deno.test("sequencing quiz games report correct items and wrong attempts", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertEquals(
      source.includes("onComplete?: (score?: number, maxScore?: number) => void"),
      true,
      `${fileName} should accept scored completion callbacks`,
    );
    assertEquals(
      source.includes("allowSkip = false"),
      true,
      `${fileName} should fail closed and require explicit opt-in for skipping`,
    );
    assertEquals(
      source.includes("const isPerfect = allowSkip || wrongAttempts === 0;"),
      true,
      `${fileName} should not show celebratory completion feedback after a wrong assigned placement`,
    );
    if (["ArrangeLetters.tsx", "ArrangeNumbers.tsx", "ShortestLongest.tsx", "SizeSorter.tsx", "SmallestLargestCake.tsx"].includes(fileName)) {
      assertEquals(
        source.includes("const handleRemovePlaced = (index: number) =>"),
        true,
        `${fileName} should allow an assigned placement to be removed before continuing`,
      );
      assertEquals(
        source.includes("setCurrentIndex(nextPlaced.length);"),
        true,
        `${fileName} should reopen the removed placement slot`,
      );
    }
    assertEquals(
      source.includes("const [correctItems, setCorrectItems] = useState(0);"),
      true,
      `${fileName} should track correct items independently of its display score`,
    );
    assertEquals(
      source.includes("const [wrongAttempts, setWrongAttempts] = useState(0);"),
      true,
      `${fileName} should track wrong interactions`,
    );
    assertEquals(
      source.includes("setCorrectItems(prev => prev + 1);"),
      true,
      `${fileName} should count each accepted item`,
    );
    assertEquals(
      source.includes("setWrongAttempts(prev => prev + 1);"),
      true,
      `${fileName} should count each wrong interaction`,
    );
    assertEquals(
      source.includes("scoreByPosition"),
      true,
      `${fileName} should use position-based scoring in quiz mode`,
    );
    assertEquals(
      source.includes("if (allowSkip === false)"),
      true,
      `${fileName} should keep positional scoring limited to quiz mode`,
    );
    assertEquals(
      source.includes("onComplete?.(correctItems + 1, correctItems + wrongAttempts + 1);"),
      false,
      `${fileName} should not auto-advance Free Play after its final item`,
    );
    assertEquals(
      source.includes("onClick={allowSkip ?"),
      true,
      `${fileName} should keep an explicit same-game Free Play replay action`,
    );
    assertEquals(
      source.includes("onComplete?.(correctItems, correctItems + wrongAttempts)"),
      true,
      `${fileName} should report its completed quiz score when the assigned-quiz Continue action is used`,
    );
    assertEquals(
      source.includes("onClick={onComplete}"),
      false,
      `${fileName} should invoke skip/navigation callbacks without DOM event arguments`,
    );
    assertEquals(
      source.includes("onClick={() => onComplete?.()}"),
      true,
      `${fileName} should preserve no-argument skip/navigation callbacks`,
    );
  }
});

Deno.test("sequencing quiz scores each placed item by its final position", () => {
  assertEquals(scoreByPosition([2, 3, 1, 4], [1, 2, 3, 4]), 1);
  assertEquals(scoreByPosition(["bread", "ham", "bread"], ["bread", "ham", "bread"]), 3);
});

Deno.test("pattern train presents one carriage that breaks the sequence", async () => {
  const source = await readGameSource("PatternTrainAcademy.tsx");

  assertEquals(
    source.includes("Which carriage breaks the pattern?") &&
      source.includes("round.oddIndex") &&
      source.includes("That carriage fits the pattern. Try another one!"),
    true,
    "Pattern Train should ask learners to find the odd carriage",
  );

  const sessions: PatternSessions = {
    pairs: [{ a: "A", b: "B" }],
    trios: [{ a: "A", b: "B", c: "C" }],
    hard: [{ a: "A", b: "B", c: "C" }],
  };
  const round = buildPatternRound(1, sessions, () => 0);

  assertEquals(round.sequence.length, 6);
  assertEquals(round.oddIndex, 1);
  assertEquals(round.sequence[round.oddIndex] !== round.expectedSequence[round.oddIndex], true);
  assertEquals(round.sequence.filter((item, index) => item !== round.expectedSequence[index]).length, 1);

  assertEquals(scoreByPosition(["🍎", "🍎"], ["🍎", "🍐"]), 1);
});

Deno.test("surprise sequencing keeps color-track clues in color", async () => {
  const source = await readGameSource("SurpriseSequencing.tsx");

  assertEquals(
    source.includes("filter grayscale"),
    false,
    "color-track clues should retain their original colors",
  );
});

Deno.test("animal parts quiz scores each selected piece by its final position", async () => {
  const source = await readGameSource("AnimalVehicleBuilder.tsx");

  assertEquals(
    /if \(allowSkip === false\)[\s\S]*const nextPlaced = \[\.\.\.placed, orderIndex\];[\s\S]*const nextLevelScore = scoreByPosition\(nextPlaced, expected\);[\s\S]*setWrongAttempts\(prev => prev - \(placed\.length - previousLevelScore\) \+ \(nextPlaced\.length - nextLevelScore\)\);/.test(source),
    true,
    "Animal parts should accept any piece in quiz mode and count incorrect positions",
  );

  assertEquals(scoreByPosition([1, 2, 0, 3], [0, 1, 2, 3]), 1);
});
