import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../../src/components/student/LegacyLessonMenu.tsx", import.meta.url));

Deno.test("lesson menu keeps the bilingual header artwork in order", () => {
  const englishHeaderIndex = source.indexOf('key: "let"');
  const filipinoHeaderIndex = source.indexOf('key: "lets"');

  assertEquals(englishHeaderIndex >= 0, true);
  assertEquals(filipinoHeaderIndex > englishHeaderIndex, true);
  assertEquals(source.includes('src: "/assets/images/1let.png"'), true);
  assertEquals(source.includes('src: "/assets/images/1lets.png"'), true);
});

Deno.test("lesson menu exposes written completion status", () => {
  assertEquals(source.includes("useLanguage"), true);
  assertEquals(source.includes('student.status.finished'), true);
  assertEquals(source.includes('student.status.assigned'), true);
  assertEquals(source.includes("min-h-[72px]"), true);
});

Deno.test("lesson menu can hide assignment status for public Free Play", () => {
  assertEquals(source.includes("showStatus = true"), true);
  assertEquals(source.includes("showStatus &&"), true);
});

Deno.test("lesson menu only shows fallback label when image is broken and game title when assigned", () => {
  assertEquals(source.includes("topic.isBroken ? ("), true);
  assertEquals(source.includes("{topic.gameTitle && ("), true);
  assertEquals(source.includes('topic.gameTitle ?? "Classroom quiz"'), false);
});
