import { describe, expect, it } from 'vitest';
import {
  mapStudentAssignments,
  mapStudentClassroom,
  mapStudentDashboard,
} from './dto';

describe('student DTO mapping', () => {
  it('maps assignment API fields to the portal model', () => {
    expect(mapStudentAssignments([{
      id: 'assignment-1',
      name: 'Colors',
      lessonId: 'colors',
      classId: 'class-1',
      dueAt: null,
      createdAt: '2026-01-01',
      status: 'completed',
      currentGameOrder: 1,
      score: 10,
      maxScore: 10,
      completed: true,
    }])).toEqual([{
      id: 'assignment-1',
      lessonId: 'colors',
      classId: 'class-1',
      dueAt: null,
      createdAt: '2026-01-01',
      currentGameOrder: 1,
      completed: true,
    }]);
  });

  it('maps classroom and nullable dashboard responses without changing defaults', () => {
    expect(mapStudentClassroom({ id: 'class-1', teacherName: 'Teacher', joinedAt: '2026-01-01' }))
      .toEqual({ id: 'class-1', name: 'Classroom', teacherName: 'Teacher' });
    expect(mapStudentClassroom(null)).toBeNull();
    expect(mapStudentDashboard(null)).toEqual({ completedLessons: 0, streakDays: 0, recentAttempts: [] });
  });
});
