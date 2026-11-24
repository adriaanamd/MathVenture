import { assertEquals } from "jsr:@std/assert";
import {
  getMathDetectiveStatement,
  isMathDetectiveAnswerCorrect,
  MATH_DETECTIVE_QUESTIONS,
} from "../../../../src/lib/games/math-detectives.ts";

Deno.test("Little Math Detectives keeps the downloaded five-question order", () => {
  assertEquals(MATH_DETECTIVE_QUESTIONS.map((question) => [
    question.leftCount,
    question.rightCount,
    question.itemName,
    question.group,
    question.relation,
  ]), [
    [5, 3, "mansanas", "A", "more"],
    [2, 6, "isda", "A", "more"],
    [4, 4, "bituin", "A", "equal"],
    [7, 3, "paruparo", "B", "more"],
    [2, 5, "saging", "A", "less"],
  ]);
});

Deno.test("Little Math Detectives answers the fixed statements correctly", () => {
  assertEquals(
    MATH_DETECTIVE_QUESTIONS.map((question) => isMathDetectiveAnswerCorrect(question, true)),
    [true, false, true, false, true],
  );
  assertEquals(getMathDetectiveStatement(MATH_DETECTIVE_QUESTIONS[2]), "Magkapareho ang dami ng bituin sa Pangkat A at Pangkat B.");
});
