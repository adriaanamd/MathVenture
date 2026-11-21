import { assertEquals } from "jsr:@std/assert";
import { getTeacherWorkspaceNavItems, TEACHER_NAV_ITEMS, isTeacherNavActive } from "../../../../src/features/teacher/model/navigation.ts";

Deno.test("teacher nav exposes one canonical route per feature", () => {
  assertEquals(TEACHER_NAV_ITEMS, [
    { href: "/teacher", labelKey: "teacher.classes" },
    { href: "/teacher/settings", labelKey: "teacher.settings" },
  ]);
  assertEquals(getTeacherWorkspaceNavItems('class-1'), [
    { href: "/teacher/classes/class-1", labelKey: "teacher.today" },
    { href: "/teacher/classes/class-1/students", labelKey: "teacher.students" },
    { href: "/teacher/classes/class-1/assignments", labelKey: "teacher.assignments" },
    { href: "/teacher/classes/class-1/reports", labelKey: "teacher.reports" },
    { href: "/teacher/classes/class-1/settings", labelKey: "teacher.settings" },
  ]);
});

Deno.test("teacher nav keeps class workspaces inside their selected class", () => {
  assertEquals(isTeacherNavActive("/teacher", "/teacher"), true);
  assertEquals(isTeacherNavActive("/teacher/classes/class-1", "/teacher/classes/class-1"), true);
  assertEquals(isTeacherNavActive("/teacher/classes/class-1/reports?window=30d", "/teacher/classes/class-1/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/classes/class-2/reports", "/teacher/classes/class-1/reports"), false);
  assertEquals(isTeacherNavActive("/teacher/settings", "/teacher/reports"), false);
});
