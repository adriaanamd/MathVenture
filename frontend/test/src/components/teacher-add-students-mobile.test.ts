import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL("../../../src/components/teacher/add-students/TeacherAddStudentsDialog.tsx", import.meta.url),
);

Deno.test("mobile add-students drawer keeps the keyboard form fixed and scrollable", () => {
  assertEquals(source.includes("<Drawer fixed"), true);
  assertEquals(source.includes("repositionInputs={false}"), true);
  assertEquals(source.includes("window.visualViewport"), true);
  assertEquals(source.includes("data-vaul-no-drag"), true);
  assertEquals(source.includes("overflow-y-auto"), true);
  assertEquals(source.includes("teacher-drawer"), true);
});
