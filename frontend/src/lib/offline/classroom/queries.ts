import type { AssignmentForStudent, AssignmentForTeacher, AssignmentQuizStatus, TeacherClassStudent } from '../../api/client.ts';
import type { OfflineRepository } from './repository.ts';

export type OfflineProfile = { id: string } | null;

export function isClassroomDataReady(input: {
  isLoading: boolean;
  user: unknown;
  offlineProfile: OfflineProfile;
}): boolean {
  return !input.isLoading && Boolean(input.user || input.offlineProfile);
}

export function buildOfflinePage<T>(items: T[]) {
  return {
    items,
    page: { nextCursor: null, hasMore: false },
  };
}

export async function readOfflineTeacherClasses(repository: OfflineRepository) {
  const [classrooms, students] = await Promise.all([
    repository.readCollection('classrooms'),
    repository.readCollection('classStudents'),
  ]);
  return classrooms.map((classroom) => ({
    id: String(classroom.id),
    name: String(classroom.name ?? 'Classroom'),
    createdAt: String(classroom.created_at ?? classroom.createdAt ?? ''),
    archivedAt: typeof classroom.archived_at === 'string' ? classroom.archived_at : null,
    studentCount: students.filter((student) => String(student.class_id ?? student.classId ?? '') === String(classroom.id)).length,
  }));
}

export async function hasPendingClassMutations(repository: OfflineRepository): Promise<boolean> {
  const operations = await repository.getOutbox();
  return operations.some((operation) => operation.type === 'class.create' || operation.type === 'class.rename');
}

export async function readOfflineClassroom(repository: OfflineRepository, role: 'teacher' | 'student', classId?: string) {
  const classrooms = await repository.readCollection('classrooms');
  const classroom = role === 'teacher'
    ? (classId ? classrooms.find((row) => String(row.id) === classId) : classrooms.length === 1 ? classrooms[0] : undefined) ?? null
    : classrooms[0] ?? null;
  if (!classroom) return null;
  const students = await repository.readCollection('classStudents');
  if (role === 'teacher') {
    const studentClassIds = new Set(students.map((row) => String(row.class_id ?? row.classId ?? '')).filter(Boolean));
    const classStudentCount = studentClassIds.size === 0 && classrooms.length === 1
      ? students.length
      : students.filter((row) => String(row.class_id ?? row.classId ?? '') === String(classroom.id)).length;
    return {
      id: String(classroom.id),
      name: String(classroom.name ?? 'Classroom'),
      createdAt: String(classroom.created_at ?? classroom.createdAt ?? ''),
      archivedAt: typeof classroom.archived_at === 'string' ? classroom.archived_at : null,
      studentCount: classStudentCount,
    };
  }
  return {
    id: String(classroom.id),
    teacherName: String(classroom.teacher_name ?? classroom.teacherName ?? 'Teacher'),
    joinedAt: String(classroom.joined_at ?? classroom.joinedAt ?? ''),
  };
}

export async function readOfflineRoster(repository: OfflineRepository, classId?: string) {
  const rows = await repository.readCollection('classStudents');
  const classIds = new Set(rows.map((row) => String(row.class_id ?? row.classId ?? '')).filter(Boolean));
  const selectedClassId = classId ?? (classIds.size === 1 ? [...classIds][0] : null);
  if (!selectedClassId && classIds.size > 1) return { students: [], page: { nextCursor: null, hasMore: false } };
  const scopedRows = selectedClassId ? rows.filter((row) => String(row.class_id ?? row.classId ?? '') === selectedClassId) : rows;
  const students: TeacherClassStudent[] = scopedRows.map((row) => {
    const profile = row.profiles && typeof row.profiles === 'object' ? row.profiles as Record<string, unknown> : row;
    return {
      id: String(row.student_id ?? row.studentId ?? profile.id ?? row.id),
      fullName: String(profile.full_name ?? profile.fullName ?? 'Student'),
      firstName: String(profile.first_name ?? profile.firstName ?? ''),
      lastName: (profile.last_name ?? profile.lastName ?? null) as string | null,
      joinedAt: String(row.joined_at ?? row.joinedAt ?? ''),
      appCompletionPct: null,
      lastPlayedPct: null,
      overallScore: null,
      overallMaxScore: null,
      overallScorePct: null,
      gameScores: [],
      assignments: [],
    };
  });
  return { students, page: { nextCursor: null, hasMore: false } };
}

function stringValue(row: Record<string, unknown>, snake: string, camel: string): string {
  return typeof row[snake] === 'string' ? row[snake] as string : String(row[camel] ?? '');
}

function nullableStringValue(row: Record<string, unknown>, snake: string, camel: string): string | null {
  const value = row[snake] ?? row[camel];
  return typeof value === 'string' ? value : null;
}

export async function readOfflineAssignments(
  repository: OfflineRepository,
  classIdOrStudentId?: string,
  studentId?: string | null,
): Promise<(AssignmentForStudent & Partial<AssignmentForTeacher>)[]> {
  const [assignments, attempts] = await Promise.all([
    repository.readCollection('assignments'),
    repository.readCollection('attempts'),
  ]);
  const possibleClassIds = new Set((await repository.readCollection('classrooms')).map((row) => String(row.id)));
  const isClassScoped = studentId !== undefined || possibleClassIds.has(classIdOrStudentId ?? '');
  const classId = isClassScoped ? classIdOrStudentId : undefined;
  const selectedStudentId = isClassScoped ? studentId ?? undefined : classIdOrStudentId;
  return assignments
    .filter((assignment) => {
      if (classId && nullableStringValue(assignment, 'class_id', 'classId') !== classId) return false;
      if (!selectedStudentId) return true;
      const targetStudent = nullableStringValue(assignment, 'student_id', 'studentId');
      return !targetStudent || targetStudent === selectedStudentId;
    })
    .map((assignment) => {
      const id = stringValue(assignment, 'id', 'id');
      const attempt = attempts.find((candidate) => {
        return stringValue(candidate, 'assignment_id', 'assignmentId') === id
          && (!selectedStudentId || stringValue(candidate, 'student_id', 'studentId') === selectedStudentId);
      });
      const status: AssignmentQuizStatus = attempt
        ? (attempt.status === 'completed' ? 'completed' : 'in_progress')
        : 'not_started';
      return {
        id,
        name: stringValue(assignment, 'name', 'name') || stringValue(assignment, 'lesson_id', 'lessonId'),
        lessonId: stringValue(assignment, 'lesson_id', 'lessonId'),
        classId: nullableStringValue(assignment, 'class_id', 'classId'),
        dueAt: nullableStringValue(assignment, 'due_at', 'dueAt'),
        createdAt: stringValue(assignment, 'created_at', 'createdAt'),
        status,
        currentGameOrder: typeof attempt?.current_game_order === 'number' ? attempt.current_game_order : 0,
        score: typeof attempt?.score === 'number' ? attempt.score : 0,
        maxScore: typeof attempt?.max_score === 'number' ? attempt.max_score : 0,
        completed: status === 'completed',
        className: null,
        studentId: nullableStringValue(assignment, 'student_id', 'studentId'),
      };
    });
}
