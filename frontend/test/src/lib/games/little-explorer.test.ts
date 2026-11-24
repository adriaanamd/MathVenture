import { assertEquals } from "jsr:@std/assert";
import {
  isLittleExplorerAnswerCorrect,
  LITTLE_EXPLORER_ROUNDS,
} from "../../../../src/lib/games/little-explorer.ts";

Deno.test("Munting Eksplorador preserves the downloaded ten-round answer key", () => {
  assertEquals(LITTLE_EXPLORER_ROUNDS.length, 10);
  assertEquals(LITTLE_EXPLORER_ROUNDS.map((round) => round.answerIndex), [2, 3, 1, 0, 3, 2, 0, 1, 2, 3]);
  assertEquals(LITTLE_EXPLORER_ROUNDS.every((round) => round.items.length === 4), true);
});

Deno.test("Munting Eksplorador evaluates only the selected choice index", () => {
  const round = LITTLE_EXPLORER_ROUNDS[0];

  assertEquals(isLittleExplorerAnswerCorrect(round, 2), true);
  assertEquals(isLittleExplorerAnswerCorrect(round, 1), false);
});

Deno.test("Munting Eksplorador uses recorded audio clips", async () => {
  const source = await Deno.readTextFile(new URL("../../../../src/components/games/2-shapes/MuntingEksplorador.tsx", import.meta.url));

  assertEquals(source.includes("speechSynthesis"), false);
  assertEquals(source.includes("ask.m4a"), true);
  assertEquals(source.includes("correct.m4a"), true);
  assertEquals(source.includes("wrong.m4a"), true);
});
