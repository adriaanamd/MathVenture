import { getGameCatalogEntry } from "@/lib/games/catalog";

export type PortalTopicId =
  | "colors"
  | "shapes"
  | "sequencing"
  | "addition"
  | "subtraction"
  | "numbers"
  | "measurement"
  | "comparison"
  | "clock";

export type PortalAssignment = {
  id: string;
  lessonId: string;
  classId?: string | null;
  dueAt: string | null;
  createdAt?: string | null;
  currentGameOrder?: number;
  completed: boolean;
};

export type PortalRecentAttempt = {
  lessonId: string;
  score: number;
  maxScore: number;
  completedAt?: string;
};

export type PortalClass = {
  id: string;
  name: string;
  teacherName: string;
};

export type PortalDashboardSummary = {
  completedLessons: number;
  streakDays: number;
  recentAttempts: PortalRecentAttempt[];
};

export type PortalTopicEntry = {
  id: PortalTopicId;
  lessonNumber: number;
  fallbackLabel: string;
  assetSrc: string;
  href: string;
  isAssigned: boolean;
  isCompleted: boolean;
  recentScorePct: number | null;
  gameTitle?: string;
};

export type PortalRailSummary = {
  nextAction:
    | { kind: "assignment"; lessonId: PortalTopicId; href: string; dueAt: string | null; gameTitle?: string }
    | { kind: "free-play"; href: string };
  classroom: PortalClass | null;
  completedLessons: number;
  streakDays: number;
  recentLessonId: PortalTopicId | null;
  recentScorePct: number | null;
  showClassroomPrompt: boolean;
};

export const LEGACY_TOPIC_META: ReadonlyArray<{
  id: PortalTopicId;
  lessonNumber: number;
  fallbackLabel: string;
  assetSrc: string;
}> = [
  { id: "colors", lessonNumber: 1, fallbackLabel: "Colors", assetSrc: "/assets/images/1col.png" },
  { id: "shapes", lessonNumber: 2, fallbackLabel: "Shapes", assetSrc: "/assets/images/1sha.png" },
  { id: "sequencing", lessonNumber: 3, fallbackLabel: "Sequencing", assetSrc: "/assets/images/1seq.png" },
  { id: "addition", lessonNumber: 4, fallbackLabel: "Addition", assetSrc: "/assets/images/1add.png" },
  { id: "subtraction", lessonNumber: 5, fallbackLabel: "Subtraction", assetSrc: "/assets/images/1SUB.png" },
  { id: "numbers", lessonNumber: 6, fallbackLabel: "Numbers", assetSrc: "/assets/images/1NUM.png" },
  { id: "measurement", lessonNumber: 7, fallbackLabel: "Measurement", assetSrc: "/assets/images/1MEA.png" },
  { id: "comparison", lessonNumber: 8, fallbackLabel: "Comparison", assetSrc: "/assets/images/1COM.png" },
  { id: "clock", lessonNumber: 9, fallbackLabel: "Clock", assetSrc: "/assets/images/1CLO.png" },
] as const;

export type StudentLessonReturnTo = "dashboard" | "class";

function toPortalTopicId(value: string): PortalTopicId | null {
  return LEGACY_TOPIC_META.find((topic) => topic.id === value)?.id ?? null;
}

function compareNullableDate(left: string | null | undefined, right: string | null | undefined) {
  if (left && right) return left.localeCompare(right);
  if (left) return -1;
  if (right) return 1;
  return 0;
}

function lessonOrder(lessonId: string) {
  const topicId = toPortalTopicId(lessonId);
  if (!topicId) return Number.MAX_SAFE_INTEGER;
  return LEGACY_TOPIC_META.findIndex((topic) => topic.id === topicId);
}

function sortPendingAssignments(assignments: PortalAssignment[]) {
  return [...assignments]
    .filter((assignment) => !assignment.completed)
    .sort((left, right) => {
      const dueCompare = compareNullableDate(left.dueAt, right.dueAt);
      if (dueCompare !== 0) return dueCompare;

      const createdCompare = compareNullableDate(left.createdAt, right.createdAt);
      if (createdCompare !== 0) return createdCompare;

      return lessonOrder(left.lessonId) - lessonOrder(right.lessonId);
    });
}

function sortVisibleAssignments(assignments: PortalAssignment[]) {
  return [...assignments]
    .filter((assignment) => toPortalTopicId(assignment.lessonId) !== null)
    .sort((left, right) => {
      if (left.completed !== right.completed) return left.completed ? 1 : -1;
      if (!left.completed && !right.completed) {
        const dueCompare = compareNullableDate(left.dueAt, right.dueAt);
        if (dueCompare !== 0) return dueCompare;

        const createdCompare = compareNullableDate(left.createdAt, right.createdAt);
        if (createdCompare !== 0) return createdCompare;
      } else {
        const createdCompare = compareNullableDate(right.createdAt, left.createdAt);
        if (createdCompare !== 0) return createdCompare;
      }

      return lessonOrder(left.lessonId) - lessonOrder(right.lessonId);
    });
}

function toScorePct(score: number, maxScore: number) {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : null;
}

function getSingleClassId(classes: PortalClass[]) {
  return classes.length === 1 ? classes[0].id : null;
}

function getAssignedGameTitle(lessonId: string, gameOrder?: number) {
  if (typeof gameOrder !== "number") return undefined;
  const topicId = toPortalTopicId(lessonId);
  return topicId ? getGameCatalogEntry(topicId, gameOrder)?.title : undefined;
}

export function buildStudentLessonHref(input: {
  lessonId: PortalTopicId;
  assignmentId?: string | null;
  classId?: string | null;
  returnTo?: StudentLessonReturnTo | null;
}): string {
  const params = new URLSearchParams();
  if (input.assignmentId) params.set("assignmentId", input.assignmentId);
  if (input.classId) params.set("classId", input.classId);
  if (input.returnTo === "class") params.set("returnTo", input.returnTo);

  const query = params.toString();
  return query ? `/student/lessons/${input.lessonId}?${query}` : `/student/lessons/${input.lessonId}`;
}

export function buildStudentLessonExitHref(input: {
  classId?: string | null;
  returnTo?: string | null;
}): string {
  if (input.returnTo === "class") return "/student/classroom";
  return "/student";
}

export function buildPortalTopicEntries(input: {
  assignments: PortalAssignment[];
  classes?: PortalClass[];
  recentAttempts: PortalRecentAttempt[];
}): PortalTopicEntry[] {
  const assignmentByLesson = new Map<PortalTopicId, PortalAssignment>();
  for (const assignment of sortVisibleAssignments(input.assignments)) {
    const topicId = toPortalTopicId(assignment.lessonId);
    if (topicId && !assignmentByLesson.has(topicId)) assignmentByLesson.set(topicId, assignment);
  }

  const attemptsByLesson = new Map(
    input.recentAttempts.flatMap((attempt) => {
      const topicId = toPortalTopicId(attempt.lessonId);
      return topicId ? [[topicId, attempt] as const] : [];
    }),
  );
  const singleClassId = getSingleClassId(input.classes ?? []);

  return LEGACY_TOPIC_META.flatMap((topic) => {
    const assignment = assignmentByLesson.get(topic.id);
    if (!assignment) return [];

    const attempt = attemptsByLesson.get(topic.id) ?? null;
    const gameTitle = getAssignedGameTitle(topic.id, assignment.currentGameOrder);
    return [{
      ...topic,
      href: buildStudentLessonHref({
        lessonId: topic.id,
        assignmentId: assignment.id,
        classId: assignment.classId ?? singleClassId,
      }),
      isAssigned: Boolean(assignment),
      isCompleted: assignment.completed,
      recentScorePct: attempt ? toScorePct(attempt.score, attempt.maxScore) : null,
      ...(gameTitle ? { gameTitle } : {}),
    }];
  });
}

export function summarizePortalRail(input: {
  assignments: PortalAssignment[];
  classroom: PortalClass | null;
  dashboard: PortalDashboardSummary;
}): PortalRailSummary {
  const nextAssignment = sortPendingAssignments(input.assignments).find((assignment) => {
    return !assignment.completed && toPortalTopicId(assignment.lessonId) !== null;
  }) ?? null;

  const nextLessonId = nextAssignment ? toPortalTopicId(nextAssignment.lessonId) : null;
  const nextGameTitle = nextAssignment && nextLessonId
    ? getAssignedGameTitle(nextLessonId, nextAssignment.currentGameOrder)
    : undefined;
  const recentAttempt = input.dashboard.recentAttempts[0] ?? null;
  const recentLessonId = recentAttempt ? toPortalTopicId(recentAttempt.lessonId) : null;

  return {
    nextAction: nextAssignment && nextLessonId
      ? {
          kind: "assignment",
          lessonId: nextLessonId,
          href: buildStudentLessonHref({
            lessonId: nextLessonId,
            assignmentId: nextAssignment.id,
            classId: nextAssignment.classId ?? null,
          }),
          dueAt: nextAssignment.dueAt,
          ...(nextGameTitle ? { gameTitle: nextGameTitle } : {}),
        }
      : { kind: "free-play", href: "/student" },
    classroom: input.classroom,
    completedLessons: input.dashboard.completedLessons,
    streakDays: input.dashboard.streakDays,
    recentLessonId,
    recentScorePct: recentAttempt ? toScorePct(recentAttempt.score, recentAttempt.maxScore) : null,
    showClassroomPrompt: false,
  };
}
