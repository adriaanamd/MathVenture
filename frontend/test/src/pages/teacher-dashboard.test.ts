import { assertEquals, assertStringIncludes } from "jsr:@std/assert";

const page = (await Promise.all([
  "pages.ts",
  "today.tsx",
  "students.tsx",
  "assignments.tsx",
  "reports.tsx",
  "settings.tsx",
].map((file) => Deno.readTextFile(new URL(`../../../src/features/teacher/${file}`, import.meta.url))))).join("\n");
const app = await Deno.readTextFile(new URL("../../../src/app/routes.tsx", import.meta.url));

Deno.test("teacher pages expose one owner per feature", () => {
  for (const required of [
    "TeacherTodayPage",
    "TeacherStudentsPage",
    "TeacherAssignmentsPage",
    "TeacherReportsPage",
    "TeacherSettingsPage",
  ]) {
    assertStringIncludes(page, required);
  }

  assertEquals((page.match(/TeacherAddStudentsDialog/g) ?? []).length > 0, true);
  assertEquals((page.match(/TeacherAssignQuizDialog/g) ?? []).length > 0, true);
});

Deno.test("App routes canonical teacher destinations and legacy redirects", () => {
  for (const required of [
    'path="/teacher/students"',
    'path="/teacher/assignments"',
    'path="/teacher/reports"',
    'path="/teacher/settings"',
    'path="/teacher/classes"',
    'path="/teacher/classes/:classId"',
    'path="/teacher/classes/:classId/:section"',
  ]) {
    assertStringIncludes(app, required);
  }
});
