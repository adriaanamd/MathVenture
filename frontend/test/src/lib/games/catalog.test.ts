import { assertEquals } from "jsr:@std/assert";
import { GAME_CATALOG, GAME_COUNT_BY_TOPIC, getGameCatalogEntry } from "../../../../src/lib/games/catalog.ts";

Deno.test("GAME_CATALOG exposes every playable game in stable topic order", () => {
  assertEquals(GAME_CATALOG.length, 81);
  assertEquals(GAME_CATALOG[0], {
    topicId: "colors",
    gameId: "colors:0",
    gameOrder: 0,
    title: "Color Matching Game",
    maxScore: 1,
  });
  assertEquals(GAME_CATALOG.at(-1), {
    topicId: "clock",
    gameId: "clock:6",
    gameOrder: 6,
    title: "What Time Is It?",
    maxScore: 1,
  });
  assertEquals(getGameCatalogEntry("addition", 14)?.gameId, "addition:14");
  assertEquals(getGameCatalogEntry("addition", 15), null);
  assertEquals(getGameCatalogEntry("colors", 6)?.gameId, "colors:6");
  assertEquals(getGameCatalogEntry("colors", 7), null);
  assertEquals(getGameCatalogEntry("comparison", 11)?.title, "Little Math Detectives");
  assertEquals(getGameCatalogEntry("comparison", 12), null);
  assertEquals(getGameCatalogEntry("numbers", 7)?.gameId, "numbers:7");
  assertEquals(getGameCatalogEntry("numbers", 8), null);
  assertEquals(getGameCatalogEntry("subtraction", 8)?.gameId, "subtraction:8");
  assertEquals(getGameCatalogEntry("subtraction", 9), null);
  assertEquals(getGameCatalogEntry("clock", 7), null);
});

Deno.test("quiz catalog counts exclude non-quiz drawing activities", () => {
  assertEquals(GAME_COUNT_BY_TOPIC, {
    colors: 7,
    shapes: 8,
    sequencing: 9,
    addition: 15,
    subtraction: 9,
    numbers: 8,
    measurement: 6,
    comparison: 12,
    clock: 7,
  });
});

Deno.test("GAME_CATALOG uses actual display names instead of generated topic labels", () => {
  assertEquals(GAME_CATALOG[0].title, "Color Matching Game");
  assertEquals(getGameCatalogEntry("addition", 13)?.title, "Magic Pizza Chef");
  assertEquals(GAME_CATALOG.at(-1)?.title, "What Time Is It?");
  assertEquals(
    GAME_CATALOG.some((entry) => entry.title === entry.topicId + "-" + (entry.gameOrder + 1)),
    false,
  );
});
