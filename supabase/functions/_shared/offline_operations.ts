import {
  defaultHiddenStudentProvisionPersistence,
  normalizeStudentIdentity,
  provisionHiddenStudentForClass,
  type NormalizedStudentIdentity,
} from "./hidden_student_provision.ts";

export const MAX_OFFLINE_SYNC_BATCH = 50;

export const OFFLINE_OPERATION_TYPES = [
  "class.create",
  "class.rename",
  "class.ensure",
  "class.addStudents",
  "class.removeStudent",
  "assignment.create",
  "assignment.update",
  "assignment.delete",
  "assignmentQuiz.start",
  "assignmentQuiz.checkpoint",
  "assignmentQuiz.complete",
  "attempt.submit",
  "post.create",
  "freePlay.start",
  "freePlay.checkpoint",
  "freePlay.complete",
] as const;

export type OfflineOperationType = (typeof OFFLINE_OPERATION_TYPES)[number];

export type OfflineOperation = {
  operationId: string;
  deviceId: string;
  actorId: string;
  type: OfflineOperationType;
  entityId: string;
  payload: Record<string, unknown>;
  dependencies: string[];
  createdAt: string;
  baseRevision?: number;
  localEntityId?: string;
};

export type OfflineOperationValidation =
  | { valid: true; operation: OfflineOperation }
  | { valid: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validateOfflineOperation(
  value: unknown,
  expectedDeviceId: string,
  expectedActorId: string,
): OfflineOperationValidation {
  if (!isRecord(value)) return { valid: false, error: "Operation must be an object." };
  const operation = value as Partial<OfflineOperation>;
  if (typeof operation.operationId !== "string" || operation.operationId.length === 0) {
    return { valid: false, error: "Operation ID is required." };
  }
  if (operation.deviceId !== expectedDeviceId) {
    return { valid: false, error: "Operation device does not match the sync device." };
  }
  if (operation.actorId !== expectedActorId) {
    return { valid: false, error: "Operation actor does not match the signed-in teacher." };
  }
  if (!OFFLINE_OPERATION_TYPES.includes(operation.type as OfflineOperationType)) {
    return { valid: false, error: "Operation type is not supported." };
  }
  if (typeof operation.entityId !== "string" || operation.entityId.length === 0) {
    return { valid: false, error: "Operation entity ID is required." };
  }
  if (!isRecord(operation.payload)) return { valid: false, error: "Operation payload must be an object." };
  if (!Array.isArray(operation.dependencies) || operation.dependencies.some((id) => typeof id !== "string")) {
    return { valid: false, error: "Operation dependencies must be string IDs." };
  }
  if (typeof operation.createdAt !== "string" || Number.isNaN(Date.parse(operation.createdAt))) {
    return { valid: false, error: "Operation createdAt must be an ISO date." };
  }
  return { valid: true, operation: operation as OfflineOperation };
}

export type OfflineOperationExecution =
  | {
    status: "accepted";
    result?: unknown;
    error?: string;
  }
  | {
    status: "rejected";
    result?: unknown;
    error?: string;
  }
  | {
    status: "conflict";
    result?: unknown;
    error?: string;
  }
  | {
    status: "retryable";
    result?: unknown;
    error?: string;
  };

export type AssignmentOperationInput = {
  id: string;
  lessonId: string;
  name: string;
  classId: string | null;
  studentId: string | null;
  assignedBy: string;
  dueAt: string | null;
};

const LESSON_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function lessonLookupCandidates(lessonId: string): Array<{ column: "slug" | "id"; value: string }> {
  const candidates: Array<{ column: "slug" | "id"; value: string }> = [
    { column: "slug", value: lessonId },
  ];
  if (LESSON_UUID_PATTERN.test(lessonId)) candidates.push({ column: "id", value: lessonId });
  return candidates;
}

export type AssignmentOperationPersistence = {
  isTeacherForClass(classId: string, teacherId: string): Promise<boolean>;
  lessonExists(lessonId: string): Promise<boolean>;
  insertAssignment(input: AssignmentOperationInput): Promise<Record<string, unknown>>;
  readAssignment(assignmentId: string): Promise<Record<string, unknown> | null>;
  updateAssignment(
    assignmentId: string,
    input: { name: string; dueAt: string | null },
  ): Promise<Record<string, unknown> | null>;
  deleteAssignment(assignmentId: string): Promise<boolean>;
};

function payloadString(payload: Record<string, unknown>, key: string): string {
  return typeof payload[key] === "string" ? String(payload[key]).trim() : "";
}

function payloadNullableString(payload: Record<string, unknown>, key: string): string | null {
  if (payload[key] === null || payload[key] === undefined || payload[key] === "") return null;
  return typeof payload[key] === "string" ? payload[key] as string : null;
}

async function teacherOwnsAssignment(
  persistence: AssignmentOperationPersistence,
  assignment: Record<string, unknown>,
  teacherId: string,
): Promise<boolean> {
  if (assignment.assigned_by === teacherId) return true;
  return typeof assignment.class_id === "string"
    && await persistence.isTeacherForClass(assignment.class_id, teacherId);
}

function revisionOf(row: Record<string, unknown>): number | null {
  const value = row.server_revision ?? row.serverRevision ?? row.revision;
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

export function createAssignmentOperationApplier(
  persistence: AssignmentOperationPersistence,
): (teacherId: string, operation: OfflineOperation) => Promise<OfflineOperationExecution> {
  return async (teacherId, operation) => {
    const payload = operation.payload;
    if (operation.type === "assignment.create") {
      const lessonId = payloadString(payload, "lessonId");
      const classId = payloadString(payload, "classId") || null;
      const studentId = payloadString(payload, "studentId") || null;
      const name = payloadString(payload, "name") || lessonId;
      const dueAt = payloadNullableString(payload, "dueAt");
      if (!lessonId) return { status: "rejected", error: "lessonId is required." };
      if ((classId ? 1 : 0) + (studentId ? 1 : 0) !== 1) {
        return { status: "rejected", error: "Provide exactly one assignment target." };
      }
      if (!await persistence.lessonExists(lessonId)) {
        return { status: "rejected", error: "The lesson does not exist." };
      }
      if (classId && !await persistence.isTeacherForClass(classId, teacherId)) {
        return { status: "rejected", error: "The teacher does not own the target class." };
      }
      if (name.length > 120) return { status: "rejected", error: "Assignment name is too long." };
      const assignment = await persistence.insertAssignment({
        id: operation.entityId,
        lessonId,
        name,
        classId,
        studentId,
        assignedBy: teacherId,
        dueAt,
      });
      return { status: "accepted", result: { assignment } };
    }

    const assignmentId = operation.entityId;
    const existing = await persistence.readAssignment(assignmentId);
    if (!existing || !await teacherOwnsAssignment(persistence, existing, teacherId)) {
      return { status: "rejected", error: "Assignment not found or forbidden." };
    }
    if (operation.type === "assignment.update") {
      const expectedRevision = typeof operation.baseRevision === "number"
        ? operation.baseRevision
        : typeof payload.baseRevision === "number" ? payload.baseRevision : null;
      const serverRevision = revisionOf(existing);
      if (expectedRevision !== null && expectedRevision > 0 && serverRevision !== null && expectedRevision !== serverRevision) {
        return {
          status: "conflict",
          error: "Assignment changed on the server.",
          result: { conflict: true, local: payload, server: existing, serverRevision },
        };
      }
      const expectedCreatedAt = payload.createdAt;
      if (typeof expectedCreatedAt === "string" && expectedCreatedAt !== existing.created_at) {
        return {
          status: "conflict",
          error: "Assignment changed on the server.",
          result: { conflict: true, local: payload, server: existing, serverRevision },
        };
      }
      const name = payloadString(payload, "name") || String(existing.name ?? existing.lesson_id ?? "Assignment");
      const dueAt = payloadNullableString(payload, "dueAt");
      const assignment = await persistence.updateAssignment(assignmentId, { name, dueAt });
      return assignment
        ? { status: "accepted", result: { assignment } }
        : { status: "rejected", error: "Assignment not found or forbidden." };
    }
    if (operation.type === "assignment.delete") {
      const deleted = await persistence.deleteAssignment(assignmentId);
      return deleted
        ? { status: "accepted", result: { deleted: true, id: assignmentId } }
        : { status: "rejected", error: "Assignment not found or forbidden." };
    }
    return { status: "retryable", error: "Operation is not an assignment mutation." };
  };
}

export type AssignmentQuizContext = {
  lessonId: string;
  classId: string | null;
  studentId: string | null;
};

export type AssignmentQuizAttemptRecord = {
  id: string;
  student_id: string;
  assignment_id: string;
  lesson_id: string;
  status: "in_progress" | "completed";
  current_game_order: number;
  score: number;
  max_score: number;
  [key: string]: unknown;
};

export type AssignmentQuizGameResultRecord = {
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  completedAt?: string;
};

export type AssignmentQuizOperationPersistence = {
  getAssignmentContext(assignmentId: string): Promise<AssignmentQuizContext | null>;
  isStudentEnrolledInClass(studentId: string, classId: string): Promise<boolean>;
  getAttempt(studentId: string, assignmentId: string): Promise<AssignmentQuizAttemptRecord | null>;
  createAttempt(input: {
    id: string;
    studentId: string;
    assignmentId: string;
    lessonId: string;
    classId: string | null;
  }): Promise<AssignmentQuizAttemptRecord>;
  updateAttempt(
    studentId: string,
    attemptId: string,
    input: Record<string, unknown>,
  ): Promise<AssignmentQuizAttemptRecord>;
  listGameResults(attemptId: string): Promise<AssignmentQuizGameResultRecord[]>;
  upsertGameResult(input: AssignmentQuizGameResultRecord & { attemptId: string; studentId: string }): Promise<void>;
};

function quizState(
  assignmentId: string,
  lessonId: string,
  attempt: AssignmentQuizAttemptRecord | null,
  gameResults: AssignmentQuizGameResultRecord[],
) {
  return {
    status: attempt?.status ?? "not_started",
    assignmentId,
    lessonId,
    attemptId: attempt?.id ?? null,
    currentGameOrder: attempt?.current_game_order ?? 0,
    score: attempt?.score ?? 0,
    maxScore: attempt?.max_score ?? 0,
    gameResults,
    completedAt: attempt?.completed_at ?? null,
  };
}

function validGameResult(value: unknown, lessonId: string): value is AssignmentQuizGameResultRecord {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<AssignmentQuizGameResultRecord>;
  return result.topicId === lessonId
    && typeof result.gameId === "string"
    && result.gameId === `${lessonId}:${result.gameOrder}`
    && Number.isInteger(result.gameOrder)
    && (result.gameOrder as number) >= 0
    && Number.isFinite(result.score)
    && Number.isFinite(result.maxScore)
    && (result.maxScore as number) > 0
    && (result.score as number) >= 0
    && (result.score as number) <= (result.maxScore as number);
}

function numericPayload(payload: Record<string, unknown>, key: string): number | null {
  const value = Number(payload[key]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function createAssignmentQuizOperationApplier(
  persistence: AssignmentQuizOperationPersistence,
): (studentId: string, operation: OfflineOperation) => Promise<OfflineOperationExecution> {
  return async (studentId, operation) => {
    const payload = operation.payload;
    const assignmentId = payloadString(payload, "assignmentId");
    const lessonId = payloadString(payload, "lessonId");
    if (!assignmentId || !lessonId) return { status: "rejected", error: "assignmentId and lessonId are required." };
    const context = await persistence.getAssignmentContext(assignmentId);
    if (!context) return { status: "rejected", error: "Assignment not found." };
    if (context.lessonId !== lessonId) return { status: "rejected", error: "lessonId does not match the assignment." };
    if (context.studentId && context.studentId !== studentId) {
      return { status: "rejected", error: "That assignment is not available to this student." };
    }
    if (context.classId && !await persistence.isStudentEnrolledInClass(studentId, context.classId)) {
      return { status: "rejected", error: "That assignment is not available to this student." };
    }

    let attempt = await persistence.getAttempt(studentId, assignmentId);
    let gameResults = attempt ? await persistence.listGameResults(attempt.id) : [];
    if (operation.type === "assignmentQuiz.start") {
      if (!attempt) {
        attempt = await persistence.createAttempt({
          id: operation.entityId,
          studentId,
          assignmentId,
          lessonId,
          classId: context.classId,
        });
        gameResults = [];
      }
      return { status: "accepted", result: { state: quizState(assignmentId, lessonId, attempt, gameResults) } };
    }
    if (!attempt) return { status: "rejected", error: "Start the assignment quiz before submitting progress." };
    if (attempt.status === "completed") {
      return { status: "accepted", result: { state: quizState(assignmentId, lessonId, attempt, gameResults) } };
    }

    const result = payload.gameResult;
    if (operation.type === "assignmentQuiz.checkpoint") {
      if (!validGameResult(result, lessonId)) return { status: "rejected", error: "gameResult is invalid." };
      if ((result as AssignmentQuizGameResultRecord).gameOrder < attempt.current_game_order) {
        const wasSaved = gameResults.some((row) => row.gameId === (result as AssignmentQuizGameResultRecord).gameId);
        if (wasSaved) return { status: "accepted", result: { duplicate: true, attemptId: attempt.id } };
      }
      if ((result as AssignmentQuizGameResultRecord).gameOrder !== attempt.current_game_order) {
        return { status: "rejected", error: "Checkpoint is out of order." };
      }
      const score = numericPayload(payload, "score");
      if (score === null) return { status: "rejected", error: "score must be a valid number." };
      const game = result as AssignmentQuizGameResultRecord;
      await persistence.upsertGameResult({ ...game, attemptId: attempt.id, studentId });
      attempt = await persistence.updateAttempt(studentId, attempt.id, {
        current_game_order: game.gameOrder + 1,
        score,
      });
      gameResults = await persistence.listGameResults(attempt.id);
      return { status: "accepted", result: { state: quizState(assignmentId, lessonId, attempt, gameResults) } };
    }

    if (operation.type === "assignmentQuiz.complete") {
      const score = numericPayload(payload, "score");
      const maxScore = numericPayload(payload, "maxScore");
      if (score === null || maxScore === null || maxScore <= 0 || score > maxScore) {
        return { status: "rejected", error: "score and maxScore must be valid numbers." };
      }
      const submitted = Array.isArray(payload.gameResults) ? payload.gameResults : [];
      const parsed = submitted.filter((value): value is AssignmentQuizGameResultRecord => validGameResult(value, lessonId));
      if (parsed.length !== submitted.length) return { status: "rejected", error: "gameResults contains an invalid result." };
      if (parsed.some((game) => game.gameOrder > attempt!.current_game_order)) {
        return { status: "rejected", error: "Cannot complete games out of order." };
      }
      const currentSubmitted = [...gameResults, ...parsed].some((game) => game.gameOrder === attempt!.current_game_order);
      if (!currentSubmitted) return { status: "rejected", error: "Complete the current game before submitting the quiz." };
      for (const game of parsed) await persistence.upsertGameResult({ ...game, attemptId: attempt.id, studentId });
      attempt = await persistence.updateAttempt(studentId, attempt.id, {
        status: "completed",
        current_game_order: Math.max(attempt.current_game_order, ...parsed.map((game) => game.gameOrder + 1)),
        score,
        max_score: maxScore,
        completed_at: typeof payload.completedAt === "string" ? payload.completedAt : new Date().toISOString(),
      });
      gameResults = await persistence.listGameResults(attempt.id);
      return { status: "accepted", result: { state: quizState(assignmentId, lessonId, attempt, gameResults) } };
    }
    return { status: "retryable", error: "Operation is not an assignment quiz mutation." };
  };
}

export type AttemptSubmitOperationInput = {
  id: string;
  studentId: string;
  lessonId: string;
  assignmentId: string | null;
  classId: string | null;
  score: number;
  maxScore: number;
  durationSeconds: number | null;
};

export type AttemptGameResultOperationInput = {
  attemptId: string;
  studentId: string;
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  scorePct: number;
  passed: boolean;
  completedAt: string;
};

export type ActivityOperationPersistence = {
  resolveAttemptClassId(input: {
    studentId: string;
    assignmentId: string | null;
    requestedClassId: string | null;
  }): Promise<string | null>;
  insertAttempt(input: AttemptSubmitOperationInput): Promise<Record<string, unknown>>;
  readAttempt?: (attemptId: string, studentId: string) => Promise<Record<string, unknown> | null>;
  insertAttemptGameResults(rows: AttemptGameResultOperationInput[]): Promise<void>;
  isTeacherForClass(classId: string, teacherId: string): Promise<boolean>;
  insertPost(input: {
    id: string;
    classId: string;
    authorId: string;
    content: string;
  }): Promise<Record<string, unknown>>;
};

export type RosterOperationPersistence = {
  getTeacherClassroom(teacherId: string, classId: string): Promise<{ id: string; teacherId: string; name: string } | null>;
  hasStudentWithNormalizedName(normalizedLastName: string, normalizedFirstName: string): Promise<boolean>;
  provisionStudentForClass(input: {
    classId: string;
    identity: NormalizedStudentIdentity;
  }): Promise<{ studentId: string; email: string }>;
  removeMembership(input: { classId: string; studentId: string }): Promise<void>;
};

export type ClassOperationPersistence = {
  createClass(input: { id: string; teacherId: string; name: string }): Promise<Record<string, unknown>>;
  getTeacherClass(teacherId: string, classId: string): Promise<Record<string, unknown> | null>;
  renameClass(classId: string, name: string): Promise<Record<string, unknown> | null>;
};

export function createClassOperationApplier(
  persistence: ClassOperationPersistence,
): (teacherId: string, operation: OfflineOperation) => Promise<OfflineOperationExecution> {
  return async (teacherId, operation) => {
    const classId = payloadString(operation.payload, "classId") || operation.entityId;
    if (!classId) return { status: "rejected", error: "classId is required." };
    const name = payloadString(operation.payload, "name");
    if (!name) return { status: "rejected", error: "Classroom name is required." };
    if (name.length > 120) return { status: "rejected", error: "Classroom name is too long." };

    if (operation.type === "class.create") {
      const existing = await persistence.getTeacherClass(teacherId, classId);
      if (existing) return { status: "accepted", result: { classroom: existing, duplicate: true } };
      const classroom = await persistence.createClass({ id: classId, teacherId, name });
      return { status: "accepted", result: { classroom } };
    }

    const existing = await persistence.getTeacherClass(teacherId, classId);
    if (!existing) return { status: "rejected", error: "Classroom not found." };
    const classroom = await persistence.renameClass(classId, name);
    return classroom
      ? { status: "accepted", result: { classroom } }
      : { status: "rejected", error: "Classroom not found." };
  };
}

function rosterNameKey(identity: NormalizedStudentIdentity): string {
  return `${identity.normalizedLastName}:${identity.normalizedFirstName}`;
}

export function createRosterOperationApplier(
  persistence: RosterOperationPersistence,
): (teacherId: string, operation: OfflineOperation) => Promise<OfflineOperationExecution> {
  return async (teacherId, operation) => {
    const classId = operation.type === "class.ensure"
      ? payloadString(operation.payload, "classId") || operation.entityId
      : payloadString(operation.payload, "classId");
    if (!classId) return { status: "rejected", error: "classId is required." };
    const classroom = await persistence.getTeacherClassroom(teacherId, classId);
    if (!classroom) return { status: "rejected", error: "Classroom not found." };
    if (operation.type === "class.ensure") {
      return { status: "accepted", result: { classroom } };
    }
    if (operation.type === "class.addStudents") {
      if (!Array.isArray(operation.payload.students) || operation.payload.students.length === 0) {
        return { status: "rejected", error: "At least one student is required." };
      }
      const identities: NormalizedStudentIdentity[] = [];
      for (const value of operation.payload.students) {
        const student = value && typeof value === "object" ? value as Record<string, unknown> : {};
        const identity = normalizeStudentIdentity({
          lastName: typeof student.lastName === "string" ? student.lastName : "",
          firstName: typeof student.firstName === "string" ? student.firstName : "",
        });
        if (!identity) return { status: "rejected", error: "Every student row needs both Last Name and First Name." };
        identities.push(identity);
      }
      const seen = new Set<string>();
      for (const identity of identities) {
        const key = rosterNameKey(identity);
        if (seen.has(key)) return { status: "rejected", error: "Each student name can appear only once per batch." };
        seen.add(key);
        if (await persistence.hasStudentWithNormalizedName(identity.normalizedLastName, identity.normalizedFirstName)) {
          return { status: "rejected", error: `A student named ${identity.fullName} already exists.` };
        }
      }
      const students: Array<Record<string, unknown>> = [];
      for (const [index, identity] of identities.entries()) {
        const created = await persistence.provisionStudentForClass({ classId: classroom.id, identity });
        const requested = operation.payload.students[index];
        const localStudentId = requested && typeof requested === "object" && typeof (requested as Record<string, unknown>).localId === "string"
          ? (requested as Record<string, unknown>).localId as string
          : `${operation.entityId}:${index}`;
        students.push({ localStudentId, studentId: created.studentId, email: created.email, fullName: identity.fullName });
      }
      return {
        status: "accepted",
        result: {
          students,
          mappings: students.map((student) => ({
            entityType: "student",
            localId: student.localStudentId,
            serverId: student.studentId,
          })),
        },
      };
    }
    if (operation.type === "class.removeStudent") {
      const studentId = payloadString(operation.payload, "studentId") || operation.entityId;
      if (!studentId) return { status: "rejected", error: "studentId is required." };
      await persistence.removeMembership({ classId: classroom.id, studentId });
      return { status: "accepted", result: { removed: true, studentId } };
    }
    return { status: "retryable", error: "Operation is not a roster mutation." };
  };
}

function validDetailedGameResult(value: unknown): value is {
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  completedAt?: string;
} {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.topicId === "string"
    && typeof result.gameId === "string"
    && result.gameId.length > 0
    && Number.isInteger(result.gameOrder)
    && Number.isFinite(result.score)
    && Number.isFinite(result.maxScore)
    && (result.maxScore as number) > 0
    && (result.score as number) >= 0
    && (result.score as number) <= (result.maxScore as number);
}

export function createActivityOperationApplier(
  persistence: ActivityOperationPersistence,
): (actorId: string, operation: OfflineOperation) => Promise<OfflineOperationExecution> {
  return async (actorId, operation) => {
    const payload = operation.payload;
    if (operation.type === "attempt.submit") {
      const lessonId = payloadString(payload, "lessonId");
      const score = Number(payload.score);
      const maxScore = Number(payload.maxScore);
      if (!lessonId) return { status: "rejected", error: "lessonId is required." };
      if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0 || score < 0 || score > maxScore) {
        return { status: "rejected", error: "score and maxScore must be valid numbers." };
      }
      if (payload.assignmentId) return { status: "rejected", error: "Use the assignment quiz flow for assigned work." };
      const duplicate = await persistence.readAttempt?.(operation.entityId, actorId);
      if (duplicate) return { status: "accepted", result: { duplicate: true, attempt: duplicate } };
      const gameResults = Array.isArray(payload.gameResults) ? payload.gameResults : [];
      if (!gameResults.every(validDetailedGameResult)) {
        return { status: "rejected", error: "gameResults must contain valid detailed game rows." };
      }
      const completedAt = typeof payload.completedAt === "string" ? payload.completedAt : new Date().toISOString();
      const durationSeconds = payload.durationSeconds == null ? null : Number(payload.durationSeconds);
      if (durationSeconds !== null && (!Number.isFinite(durationSeconds) || durationSeconds < 0)) {
        return { status: "rejected", error: "durationSeconds must be a valid number." };
      }
      const classId = await persistence.resolveAttemptClassId({
        studentId: actorId,
        assignmentId: null,
        requestedClassId: payloadString(payload, "classId") || null,
      });
      const attempt = await persistence.insertAttempt({
        id: operation.entityId,
        studentId: actorId,
        lessonId,
        assignmentId: null,
        classId,
        score,
        maxScore,
        durationSeconds,
      });
      await persistence.insertAttemptGameResults(gameResults.map((value) => {
        const row = value as typeof value & { completedAt?: string };
        return {
          attemptId: operation.entityId,
          studentId: actorId,
          topicId: row.topicId,
          gameId: row.gameId,
          gameOrder: row.gameOrder,
          score: row.score,
          maxScore: row.maxScore,
          scorePct: Math.round((row.score / row.maxScore) * 100),
          passed: row.score / row.maxScore >= 0.6,
          completedAt: row.completedAt ?? completedAt,
        };
      }));
      return { status: "accepted", result: { attempt } };
    }

    if (operation.type === "post.create") {
      const classId = payloadString(payload, "classId");
      const content = payloadString(payload, "content");
      if (!classId || !content) return { status: "rejected", error: "classId and content are required." };
      if (!await persistence.isTeacherForClass(classId, actorId)) {
        return { status: "rejected", error: "The teacher does not own the target class." };
      }
      const post = await persistence.insertPost({ id: operation.entityId, classId, authorId: actorId, content });
      return { status: "accepted", result: { post } };
    }
    return { status: "retryable", error: "Operation is not an activity mutation." };
  };
}

export async function applyOfflineOperation(
  teacherId: string,
  operation: OfflineOperation,
): Promise<OfflineOperationExecution> {
  if (operation.type === "class.create" || operation.type === "class.rename") {
    const { adminClient } = await import("./client.ts");
    const persistence: ClassOperationPersistence = {
      async createClass(input) {
        const { data, error } = await adminClient.from("classes").insert({
          id: input.id,
          teacher_id: input.teacherId,
          name: input.name,
        }).select("id, teacher_id, name, created_at, archived_at").single();
        if (error || !data) throw error ?? new Error("Failed to create classroom");
        return data;
      },
      async getTeacherClass(ownerId, classId) {
        const { data, error } = await adminClient.from("classes")
          .select("id, teacher_id, name, created_at, archived_at")
          .eq("id", classId).eq("teacher_id", ownerId).maybeSingle();
        if (error) throw error;
        return data;
      },
      async renameClass(classId, name) {
        const { data, error } = await adminClient.from("classes")
          .update({ name })
          .eq("id", classId)
          .select("id, teacher_id, name, created_at, archived_at")
          .maybeSingle();
        if (error) throw error;
        return data;
      },
    };
    return createClassOperationApplier(persistence)(teacherId, operation);
  }
  if (operation.type === "assignment.create" || operation.type === "assignment.update" || operation.type === "assignment.delete") {
    const { adminClient } = await import("./client.ts");
    const persistence: AssignmentOperationPersistence = {
      async isTeacherForClass(classId, ownerId) {
        const { data, error } = await adminClient
          .from("classes")
          .select("id")
          .eq("id", classId)
          .eq("teacher_id", ownerId)
          .maybeSingle();
        if (error) throw error;
        return Boolean(data);
      },
      async lessonExists(lessonId) {
        for (const candidate of lessonLookupCandidates(lessonId)) {
          const { data, error } = await adminClient
            .from("lessons")
            .select("id")
            .eq(candidate.column, candidate.value)
            .maybeSingle();
          if (error) throw error;
          if (data) return true;
        }
        return false;
      },
      async insertAssignment(input) {
        const { data, error } = await adminClient.from("assignments").insert({
          id: input.id,
          lesson_id: input.lessonId,
          name: input.name,
          class_id: input.classId,
          student_id: input.studentId,
          assigned_by: input.assignedBy,
          due_at: input.dueAt,
        }).select("id, name, lesson_id, class_id, student_id, assigned_by, due_at, created_at").single();
        if (error || !data) throw error ?? new Error("Failed to create assignment");
        return data;
      },
      async readAssignment(assignmentId) {
        const { data, error } = await adminClient.from("assignments")
          .select("id, name, lesson_id, class_id, student_id, assigned_by, due_at, created_at")
          .eq("id", assignmentId).maybeSingle();
        if (error) throw error;
        return data;
      },
      async updateAssignment(assignmentId, input) {
        const { data, error } = await adminClient.from("assignments")
          .update({ name: input.name, due_at: input.dueAt })
          .eq("id", assignmentId)
          .select("id, name, lesson_id, class_id, student_id, assigned_by, due_at, created_at")
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async deleteAssignment(assignmentId) {
        const { data, error } = await adminClient.from("assignments")
          .delete().eq("id", assignmentId).select("id");
        if (error) throw error;
        return Boolean(data?.length);
      },
    };
    return createAssignmentOperationApplier(persistence)(teacherId, operation);
  }
  if (
    operation.type === "assignmentQuiz.start"
    || operation.type === "assignmentQuiz.checkpoint"
    || operation.type === "assignmentQuiz.complete"
  ) {
    const { adminClient } = await import("./client.ts");
    const persistence: AssignmentQuizOperationPersistence = {
      async getAssignmentContext(assignmentId) {
        const { data, error } = await adminClient.from("assignments")
          .select("lesson_id, class_id, student_id").eq("id", assignmentId).maybeSingle();
        if (error) throw error;
        return data
          ? { lessonId: data.lesson_id, classId: data.class_id ?? null, studentId: data.student_id ?? null }
          : null;
      },
      async isStudentEnrolledInClass(studentId, classId) {
        const { data, error } = await adminClient.from("class_students")
          .select("class_id").eq("student_id", studentId).eq("class_id", classId).maybeSingle();
        if (error) throw error;
        return Boolean(data);
      },
      async getAttempt(studentId, assignmentId) {
        const { data, error } = await adminClient.from("attempts")
          .select("id, student_id, assignment_id, lesson_id, status, current_game_order, score, max_score, completed_at")
          .eq("student_id", studentId).eq("assignment_id", assignmentId)
          .order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (error) throw error;
        return data as AssignmentQuizAttemptRecord | null;
      },
      async createAttempt(input) {
        const { data, error } = await adminClient.from("attempts").insert({
          id: input.id,
          student_id: input.studentId,
          assignment_id: input.assignmentId,
          lesson_id: input.lessonId,
          class_id: input.classId,
          status: "in_progress",
          quiz_mode: true,
          current_game_order: 0,
          score: 0,
          max_score: 0,
          duration_seconds: null,
        }).select("id, student_id, assignment_id, lesson_id, status, current_game_order, score, max_score, completed_at").single();
        if (error || !data) throw error ?? new Error("Failed to start assignment quiz");
        return data as AssignmentQuizAttemptRecord;
      },
      async updateAttempt(studentId, attemptId, input) {
        const update: Record<string, unknown> = {};
        if (input.status !== undefined) update.status = input.status;
        if (input.current_game_order !== undefined) update.current_game_order = input.current_game_order;
        if (input.score !== undefined) update.score = input.score;
        if (input.max_score !== undefined) update.max_score = input.max_score;
        if (input.completed_at !== undefined) update.completed_at = input.completed_at;
        const { data, error } = await adminClient.from("attempts").update(update)
          .eq("id", attemptId).eq("student_id", studentId)
          .select("id, student_id, assignment_id, lesson_id, status, current_game_order, score, max_score, completed_at")
          .single();
        if (error || !data) throw error ?? new Error("Failed to update assignment quiz");
        return data as AssignmentQuizAttemptRecord;
      },
      async listGameResults(attemptId) {
        const { data, error } = await adminClient.from("attempt_game_results")
          .select("topic_id, game_id, game_order, score, max_score, completed_at")
          .eq("attempt_id", attemptId).order("game_order", { ascending: true });
        if (error) throw error;
        return (data ?? []).map((row: Record<string, unknown>) => ({
          topicId: row.topic_id as string,
          gameId: row.game_id as string,
          gameOrder: row.game_order as number,
          score: row.score as number,
          maxScore: row.max_score as number,
          completedAt: row.completed_at as string | undefined,
        }));
      },
      async upsertGameResult(input) {
        const { error } = await adminClient.from("attempt_game_results").upsert({
          attempt_id: input.attemptId,
          student_id: input.studentId,
          topic_id: input.topicId,
          game_id: input.gameId,
          game_order: input.gameOrder,
          score: input.score,
          max_score: input.maxScore,
          score_pct: Math.round((input.score / input.maxScore) * 100),
          passed: input.score / input.maxScore >= 0.6,
          completed_at: input.completedAt ?? new Date().toISOString(),
        }, { onConflict: "attempt_id,game_id" });
        if (error) throw error;
      },
    };
    return createAssignmentQuizOperationApplier(persistence)(operation.actorId, operation);
  }
  if (operation.type === "attempt.submit" || operation.type === "post.create") {
    const { adminClient } = await import("./client.ts");
    const persistence: ActivityOperationPersistence = {
      async resolveAttemptClassId(input) {
        if (input.requestedClassId) {
          const { data, error } = await adminClient.from("class_students").select("class_id")
            .eq("student_id", input.studentId).eq("class_id", input.requestedClassId).maybeSingle();
          if (error) throw error;
          if (!data) throw new Error("The student is not enrolled in the requested class.");
          return input.requestedClassId;
        }
        const { data, error } = await adminClient.from("class_students").select("class_id")
          .eq("student_id", input.studentId).order("joined_at", { ascending: false }).limit(1).maybeSingle();
        if (error) throw error;
        return (data?.class_id as string | undefined) ?? null;
      },
      async insertAttempt(input) {
        const { data, error } = await adminClient.from("attempts").insert({
          id: input.id,
          student_id: input.studentId,
          lesson_id: input.lessonId,
          assignment_id: input.assignmentId,
          class_id: input.classId,
          score: input.score,
          max_score: input.maxScore,
          duration_seconds: input.durationSeconds,
        }).select("id, lesson_id, score, max_score, completed_at").single();
        if (error || !data) throw error ?? new Error("Failed to insert attempt");
        return data;
      },
      async readAttempt(attemptId, studentId) {
        const { data, error } = await adminClient.from("attempts")
          .select("id, student_id, lesson_id, assignment_id, class_id, score, max_score, duration_seconds, completed_at")
          .eq("id", attemptId).eq("student_id", studentId).maybeSingle();
        if (error) throw error;
        return data;
      },
      async insertAttemptGameResults(rows) {
        if (!rows.length) return;
        const { error } = await adminClient.from("attempt_game_results").upsert(rows.map((row) => ({
          attempt_id: row.attemptId,
          student_id: row.studentId,
          topic_id: row.topicId,
          game_id: row.gameId,
          game_order: row.gameOrder,
          score: row.score,
          max_score: row.maxScore,
          score_pct: row.scorePct,
          passed: row.passed,
          completed_at: row.completedAt,
        })), { onConflict: "attempt_id,game_id" });
        if (error) throw error;
      },
      async isTeacherForClass(classId, ownerId) {
        const { data, error } = await adminClient.from("classes").select("id")
          .eq("id", classId).eq("teacher_id", ownerId).maybeSingle();
        if (error) throw error;
        return Boolean(data);
      },
      async insertPost(input) {
        const { data, error } = await adminClient.from("class_posts").insert({
          id: input.id,
          class_id: input.classId,
          author_id: input.authorId,
          content: input.content,
        }).select("id, class_id, author_id, content, created_at").single();
        if (error || !data) throw error ?? new Error("Failed to create post");
        return data;
      },
    };
    return createActivityOperationApplier(persistence)(operation.actorId, operation);
  }
  if (operation.type === "freePlay.start" || operation.type === "freePlay.checkpoint" || operation.type === "freePlay.complete") {
    const { adminClient } = await import("./client.ts");
    const gameId = payloadString(operation.payload, "gameId");
    if (!gameId) return { status: "rejected", error: "gameId is required." };
    const profileId = operation.actorId;
    if (operation.type === "freePlay.start") {
      const startedAt = typeof operation.payload.startedAt === "string" ? operation.payload.startedAt : operation.createdAt;
      const { data, error } = await adminClient.from("free_play_sessions").upsert({
        id: operation.entityId,
        profile_id: profileId,
        game_id: gameId,
        started_at: startedAt,
        data: operation.payload,
        updated_at: startedAt,
      }, { onConflict: "id" }).select("id, profile_id, game_id, started_at, completed_at, score, max_score, data, created_at, updated_at").single();
      if (error || !data) throw error ?? new Error("Failed to start Free Play session");
      return { status: "accepted", result: { session: data } };
    }
    const sessionId = payloadString(operation.payload, "sessionId") || operation.entityId;
    const score = Number(operation.payload.score);
    const maxScore = Number(operation.payload.maxScore);
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0 || score < 0 || score > maxScore) {
      return { status: "rejected", error: "score and maxScore must be valid numbers." };
    }
    if (operation.type === "freePlay.checkpoint") {
      const { data, error } = await adminClient.from("free_play_sessions")
        .update({ score, max_score: maxScore, data: operation.payload, updated_at: operation.createdAt })
        .eq("id", sessionId).eq("profile_id", profileId)
        .select("id, profile_id, game_id, started_at, completed_at, score, max_score, data, created_at, updated_at").maybeSingle();
      if (error) throw error;
      if (!data) return { status: "rejected", error: "Free Play session was not found." };
      return { status: "accepted", result: { session: data } };
    }
    const completedAt = typeof operation.payload.completedAt === "string" ? operation.payload.completedAt : operation.createdAt;
    const sessionUpdate = await adminClient.from("free_play_sessions")
      .update({ score, max_score: maxScore, completed_at: completedAt, data: operation.payload, updated_at: completedAt })
      .eq("id", sessionId).eq("profile_id", profileId);
    if (sessionUpdate.error) throw sessionUpdate.error;
    const existingProgressResult = await adminClient.from("free_play_progress")
      .select("id, best_score, best_max_score, play_count")
      .eq("profile_id", profileId).eq("game_id", gameId).maybeSingle();
    if (existingProgressResult.error) throw existingProgressResult.error;
    const existingProgress = existingProgressResult.data as Record<string, unknown> | null;
    const { data, error } = await adminClient.from("free_play_progress").upsert({
      id: typeof existingProgress?.id === "string" ? existingProgress.id : operation.entityId,
      profile_id: profileId,
      game_id: gameId,
      best_score: Math.max(score, Number(existingProgress?.best_score ?? 0)),
      best_max_score: Math.max(maxScore, Number(existingProgress?.best_max_score ?? 0)),
      play_count: Number(existingProgress?.play_count ?? 0) + 1,
      last_played_at: completedAt,
      data: operation.payload,
      updated_at: completedAt,
    }, { onConflict: "profile_id,game_id" })
      .select("id, profile_id, game_id, best_score, best_max_score, play_count, last_played_at, data, created_at, updated_at")
      .single();
    if (error || !data) throw error ?? new Error("Failed to save Free Play progress");
    return { status: "accepted", result: { progress: data } };
  }
  if (operation.type === "class.ensure" || operation.type === "class.addStudents" || operation.type === "class.removeStudent") {
    const { adminClient } = await import("./client.ts");
    const persistence: RosterOperationPersistence = {
      async getTeacherClassroom(ownerId, classId) {
        const { data, error } = await adminClient.from("classes")
          .select("id, teacher_id, name").eq("id", classId).eq("teacher_id", ownerId).maybeSingle();
        if (error) throw error;
        return data ? { id: data.id, teacherId: data.teacher_id, name: data.name } : null;
      },
      async hasStudentWithNormalizedName(normalizedLastName, normalizedFirstName) {
        const { data, error } = await adminClient.from("profiles").select("id")
          .eq("role", "student").eq("normalized_last_name", normalizedLastName)
          .eq("normalized_first_name", normalizedFirstName).limit(1);
        if (error) throw error;
        return Boolean(data?.length);
      },
      async provisionStudentForClass(input) {
        return provisionHiddenStudentForClass(defaultHiddenStudentProvisionPersistence, input);
      },
      async removeMembership(input) {
        const { error } = await adminClient.from("class_students").delete()
          .eq("class_id", input.classId).eq("student_id", input.studentId);
        if (error) throw error;
      },
    };
    return createRosterOperationApplier(persistence)(teacherId, operation);
  }
  return {
    status: "retryable",
    error: `Operation ${operation.type} is not available on this server yet.`,
  };
}
