import { assertEquals, assertStringIncludes } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherWorkspaceBoard.tsx", import.meta.url));
const sidebarSource = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherSidebar.tsx", import.meta.url));

Deno.test("teacher shell exposes a single semantic main region", () => {
  assertStringIncludes(source, "teacher-shell");
  assertStringIncludes(source, "<main");
  assertStringIncludes(source, "TeacherSidebar");
  assertEquals((source.match(/<main/g) ?? []).length, 1);
});

Deno.test("teacher sidebar owns labeled navigation and mobile drawer state", () => {
  assertStringIncludes(sidebarSource, "<aside");
  assertStringIncludes(sidebarSource, "TEACHER_NAV_ITEMS");
  assertStringIncludes(sidebarSource, "Teacher navigation");
  assertStringIncludes(sidebarSource, "aria-expanded");
  assertStringIncludes(sidebarSource, "aria-controls");
  assertStringIncludes(sidebarSource, "teacher-mobile-nav");
  assertStringIncludes(sidebarSource, "fixed inset-x-0 bottom-0 top-16 z-50 lg:hidden");
  assertStringIncludes(sidebarSource, "mobileOpen && 'hidden'");
});

Deno.test("teacher workspace board exposes return to class list control", () => {
  assertStringIncludes(source, "classId");
  assertStringIncludes(source, 'href="/teacher"');
  assertStringIncludes(source, "teacher.returnToClasses");
});
