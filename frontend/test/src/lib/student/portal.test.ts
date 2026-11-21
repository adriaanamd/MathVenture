import { assertEquals } from "jsr:@std/assert";
import {
  LEGACY_TOPIC_META,
  buildStudentLessonExitHref,
  buildPortalTopicEntries,
  buildStudentLessonHref,
  summarizePortalRail,
} from "../../../../src/features/student/model/portal.ts";

Deno.test("legacy topic metadata preserves the original menu order and asset paths", () => {
  assertEquals(
    LEGACY_TOPIC_META.map((topic) => topic.id),
    ["colors", "shapes", "sequencing", "addition", "subtraction", "numbers", "measurement", "comparison", "clock"],
  );

  assertEquals(LEGACY_TOPIC_META[0].assetSrc, "/assets/images/1col.png");
  assertEquals(LEGACY_TOPIC_META[8].assetSrc, "/assets/images/1CLO.png");
});

Deno.test("buildPortalTopicEntries shows assigned lessons and hides unassigned lessons", () => {
  const entries = buildPortalTopicEntries({
    assignments: [
      { id: "asg-1", lessonId: "colors", classId: "class-1", dueAt: null, completed: false },
      { id: "asg-2", lessonId: "clock", dueAt: null, completed: true },
    ],
    classes: [
      { id: "class-1", name: "Section Sunflower", teacherName: "Teacher Mia" },
    ],
    recentAttempts: [
      { lessonId: "colors", score: 4, maxScore: 5 },
      { lessonId: "numbers", score: 5, maxScore: 5 },
    ],
  });

  assertEquals(entries[0], {
    id: "colors",
    lessonNumber: 1,
    fallbackLabel: "Colors",
    assetSrc: "/assets/images/1col.png",
    href: "/student/lessons/colors?assignmentId=asg-1&classId=class-1",
    isAssigned: true,
    isCompleted: false,
    recentScorePct: 80,
  });

  assertEquals(entries.map((entry) => entry.id), ["colors", "clock"]);
  assertEquals(entries[1].href, "/student/lessons/clock?assignmentId=asg-2&classId=class-1");
  assertEquals(entries[1].isAssigned, true);
  assertEquals(entries[1].isCompleted, true);
});

Deno.test("buildPortalTopicEntries returns no classroom lesson menu entries without assignments", () => {
  const entries = buildPortalTopicEntries({
    assignments: [],
    classes: [{ id: "class-1", name: "Section Sunflower", teacherName: "Teacher Mia" }],
    recentAttempts: [{ lessonId: "numbers", score: 5, maxScore: 5 }],
  });

  assertEquals(entries, []);
});

Deno.test("buildPortalTopicEntries identifies the current assigned game", () => {
  const entries = buildPortalTopicEntries({
    assignments: [{
      id: "asg-1",
      lessonId: "sequencing",
      dueAt: null,
      currentGameOrder: 2,
      completed: false,
    }],
    recentAttempts: [],
  });

  assertEquals(entries[0].gameTitle, "Size Sorter");
});

Deno.test("buildPortalTopicEntries keeps the earliest pending assignment when a lesson has multiple entries", () => {
  const entries = buildPortalTopicEntries({
    assignments: [
      {
        id: "asg-late",
        lessonId: "colors",
        classId: "class-1",
        dueAt: "2026-07-30T00:00:00.000Z",
        createdAt: "2026-07-26T10:00:00.000Z",
        completed: false,
      },
      {
        id: "asg-early",
        lessonId: "colors",
        classId: "class-1",
        dueAt: "2026-07-29T00:00:00.000Z",
        createdAt: "2026-07-25T10:00:00.000Z",
        completed: false,
      },
    ],
    classes: [
      { id: "class-1", name: "Section Sunflower", teacherName: "Teacher Mia" },
    ],
    recentAttempts: [],
  });

  assertEquals(entries[0].href, "/student/lessons/colors?assignmentId=asg-early&classId=class-1");
});

Deno.test("buildStudentLessonHref only encodes class return targets when the lesson was launched from a class page", () => {
  assertEquals(
    buildStudentLessonHref({
      lessonId: "colors",
      assignmentId: "asg-1",
      classId: "class-1",
      returnTo: "class",
    }),
    "/student/lessons/colors?assignmentId=asg-1&classId=class-1&returnTo=class",
  );

  assertEquals(
    buildStudentLessonHref({
      lessonId: "numbers",
      classId: "class-1",
    }),
    "/student/lessons/numbers?classId=class-1",
  );
});

Deno.test("buildStudentLessonExitHref returns to basecamp by default and only uses class routes when explicitly requested", () => {
  assertEquals(buildStudentLessonExitHref({}), "/student");
  assertEquals(buildStudentLessonExitHref({ returnTo: "dashboard", classId: "class-1" }), "/student");
  assertEquals(buildStudentLessonExitHref({ returnTo: "class", classId: "class-1" }), "/student/classroom");
  assertEquals(buildStudentLessonExitHref({ returnTo: "class" }), "/student/classroom");
});

Deno.test("summarizePortalRail prefers the first pending assignment and keeps class context", () => {
  const summary = summarizePortalRail({
    assignments: [
      { id: "asg-1", lessonId: "colors", classId: "class-1", dueAt: "2026-07-29T00:00:00.000Z", completed: false },
      { id: "asg-2", lessonId: "numbers", dueAt: null, completed: false },
    ],
    classroom: { id: "class-1", name: "Classroom", teacherName: "Teacher Mia" },
    dashboard: {
      completedLessons: 4,
      streakDays: 3,
      recentAttempts: [{ lessonId: "numbers", score: 5, maxScore: 5 }],
    },
  });

  assertEquals(summary.nextAction, {
    kind: "assignment",
    lessonId: "colors",
    href: "/student/lessons/colors?assignmentId=asg-1&classId=class-1",
    dueAt: "2026-07-29T00:00:00.000Z",
  });
  assertEquals(summary.classroom?.name, "Classroom");
  assertEquals(summary.completedLessons, 4);
  assertEquals(summary.recentScorePct, 100);
});

Deno.test("summarizePortalRail picks the earliest due pending assignment regardless of input order", () => {
  const summary = summarizePortalRail({
    assignments: [
      {
        id: "asg-later",
        lessonId: "numbers",
        classId: "class-2",
        dueAt: "2026-08-02T00:00:00.000Z",
        createdAt: "2026-07-28T12:00:00.000Z",
        completed: false,
      },
      {
        id: "asg-sooner",
        lessonId: "colors",
        classId: "class-1",
        dueAt: "2026-07-29T00:00:00.000Z",
        createdAt: "2026-07-28T08:00:00.000Z",
        completed: false,
      },
    ],
    classroom: null,
    dashboard: {
      completedLessons: 0,
      streakDays: 0,
      recentAttempts: [],
    },
  });

  assertEquals(summary.nextAction, {
    kind: "assignment",
    lessonId: "colors",
    href: "/student/lessons/colors?assignmentId=asg-sooner&classId=class-1",
    dueAt: "2026-07-29T00:00:00.000Z",
  });
});

Deno.test("summarizePortalRail passes single-class context into free play launches", () => {
  const summary = summarizePortalRail({
    assignments: [],
    classroom: { id: "class-1", name: "Classroom", teacherName: "Teacher Mia" },
    dashboard: {
      completedLessons: 0,
      streakDays: 0,
      recentAttempts: [],
    },
  });

  assertEquals(summary.nextAction, {
    kind: "free-play",
    href: "/student",
  });
});

Deno.test("summarizePortalRail falls back to free play messaging and join prompt when data is sparse", () => {
  const summary = summarizePortalRail({
    assignments: [],
    classroom: null,
    dashboard: {
      completedLessons: 0,
      streakDays: 0,
      recentAttempts: [],
    },
  });

  assertEquals(summary.nextAction, {
    kind: "free-play",
    href: "/student",
  });
  assertEquals(summary.classroom, null);
  assertEquals(summary.showClassroomPrompt, false);
  assertEquals(summary.recentLessonId, null);
  assertEquals(summary.recentScorePct, null);
});

Deno.test("buildStudentLessonExitHref returns /student/classroom for classroom exits", () => {
  assertEquals(
    buildStudentLessonExitHref({ returnTo: "class" }),
    "/student/classroom",
  );
});

Deno.test("summarizePortalRail no longer exposes join prompts or multi-class counts", () => {
  const summary = summarizePortalRail({
    assignments: [],
    classroom: null,
    dashboard: {
      completedLessons: 0,
      streakDays: 0,
      recentAttempts: [],
    },
  });

  assertEquals(summary.classroom, null);
  assertEquals(summary.showClassroomPrompt, false);
});
