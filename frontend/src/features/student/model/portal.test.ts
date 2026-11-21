import { describe, expect, it } from 'vitest';
import {
  buildPortalTopicEntries,
  buildStudentLessonHref,
  summarizePortalRail,
} from './portal';

describe('student portal model', () => {
  it('builds stable lesson URLs with assignment, class, and return context', () => {
    expect(buildStudentLessonHref({
      lessonId: 'colors',
      assignmentId: 'assignment-1',
      classId: 'class-1',
      returnTo: 'class',
    })).toBe('/student/lessons/colors?assignmentId=assignment-1&classId=class-1&returnTo=class');
  });

  it('derives assigned topic entries and recent score percentages', () => {
    const entries = buildPortalTopicEntries({
      assignments: [{
        id: 'assignment-1',
        lessonId: 'colors',
        classId: 'class-1',
        dueAt: null,
        currentGameOrder: 1,
        completed: true,
      }],
      recentAttempts: [{ lessonId: 'colors', score: 8, maxScore: 10 }],
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: 'colors',
      href: '/student/lessons/colors?assignmentId=assignment-1&classId=class-1',
      isAssigned: true,
      isCompleted: true,
      recentScorePct: 80,
      gameTitle: 'Balloon Finding Game',
    });
  });

  it('identifies the current assigned game for the student menu', () => {
    const entries = buildPortalTopicEntries({
      assignments: [{
        id: 'assignment-1',
        lessonId: 'sequencing',
        dueAt: null,
        currentGameOrder: 2,
        completed: false,
      }],
      recentAttempts: [],
    });

    expect(entries[0].gameTitle).toBe('Size Sorter');
  });

  it('selects the earliest pending assignment for the rail', () => {
    const summary = summarizePortalRail({
      assignments: [
        { id: 'later', lessonId: 'shapes', dueAt: '2026-12-01', completed: false },
        { id: 'first', lessonId: 'colors', dueAt: '2026-11-01', completed: false },
      ],
      classroom: null,
      dashboard: { completedLessons: 2, streakDays: 3, recentAttempts: [] },
    });

    expect(summary.nextAction).toEqual({
      kind: 'assignment',
      lessonId: 'colors',
      href: '/student/lessons/colors?assignmentId=first',
      dueAt: '2026-11-01',
    });
  });
});
