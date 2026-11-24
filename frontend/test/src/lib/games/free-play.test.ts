import { assertEquals } from "jsr:@std/assert";
import {
  FREE_PLAY_GAME_COUNT_BY_TOPIC,
  getFreePlayGameCount,
  isFreePlayDrawingBoard,
  isDrawingBoardAvailable,
} from "../../../../src/lib/games/free-play.ts";

Deno.test("Free Play extends the six historical drawing-board topics", () => {
  assertEquals(getFreePlayGameCount("shapes"), 9);
  assertEquals(getFreePlayGameCount("sequencing"), 10);
  assertEquals(getFreePlayGameCount("addition"), 16);
  assertEquals(getFreePlayGameCount("subtraction"), 10);
  assertEquals(getFreePlayGameCount("numbers"), 9);
  assertEquals(getFreePlayGameCount("measurement"), 7);
  assertEquals(FREE_PLAY_GAME_COUNT_BY_TOPIC.colors, 7);
  assertEquals(getFreePlayGameCount("comparison"), 12);
});

Deno.test("Free Play identifies only the historical drawing-board slots", () => {
  assertEquals(isFreePlayDrawingBoard("shapes", 8), true);
  assertEquals(isFreePlayDrawingBoard("sequencing", 9), true);
  assertEquals(isFreePlayDrawingBoard("addition", 15), true);
  assertEquals(isFreePlayDrawingBoard("subtraction", 9), true);
  assertEquals(isFreePlayDrawingBoard("numbers", 8), true);
  assertEquals(isFreePlayDrawingBoard("measurement", 6), true);
  assertEquals(isFreePlayDrawingBoard("shapes", 7), false);
  assertEquals(isFreePlayDrawingBoard("clock", 6), false);
});

Deno.test("classroom quizzes never expose a Free Play drawing-board slot", () => {
  const drawingBoards = [
    ["shapes", 8],
    ["sequencing", 9],
    ["addition", 15],
    ["subtraction", 9],
    ["numbers", 8],
    ["measurement", 6],
  ] as const;

  for (const [topicId, gameOrder] of drawingBoards) {
    assertEquals(isDrawingBoardAvailable(topicId, gameOrder, false), true);
    assertEquals(isDrawingBoardAvailable(topicId, gameOrder, true), false);
  }

  assertEquals(isDrawingBoardAvailable("measurement", 5, true), false);
});
