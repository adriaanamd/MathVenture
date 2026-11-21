import type {
  AssignmentForStudent,
  StudentClassroomSummary,
  StudentDashboard,
} from '@/lib/api/client';
import type {
  PortalAssignment,
  PortalClass,
  PortalDashboardSummary,
} from './portal';

export function mapStudentAssignments(
  assignments: readonly AssignmentForStudent[],
): PortalAssignment[] {
  return assignments.map(({ id, lessonId, classId, dueAt, createdAt, currentGameOrder, completed }) => ({
    id,
    lessonId,
    classId,
    dueAt,
    createdAt,
    currentGameOrder,
    completed,
  }));
}

export function mapStudentClassroom(
  classroom: StudentClassroomSummary | null,
): PortalClass | null {
  return classroom
    ? { id: classroom.id, name: 'Classroom', teacherName: classroom.teacherName }
    : null;
}

export function mapStudentDashboard(
  dashboard: StudentDashboard | null,
): PortalDashboardSummary {
  return dashboard
    ? {
        completedLessons: dashboard.completedLessons,
        streakDays: dashboard.streakDays,
        recentAttempts: dashboard.recentAttempts ?? [],
      }
    : { completedLessons: 0, streakDays: 0, recentAttempts: [] };
}
