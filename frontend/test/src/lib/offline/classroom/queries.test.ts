import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createOfflineClass } from '../../../../../src/lib/offline/classroom/mutations.ts';
import {
  buildOfflinePage,
  hasPendingClassMutations,
  isClassroomDataReady,
  readOfflineClassroom,
  readOfflineAssignments,
  readOfflineRoster,
} from '../../../../../src/lib/offline/classroom/queries.ts';

Deno.test('cached classroom queries stay enabled for an offline enrolled profile', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  await repository.putSnapshot('assignments', [{
    id: 'assignment-1',
    name: 'Colors',
    lesson_id: 'lesson-1',
    class_id: 'class-1',
    due_at: null,
    created_at: '2026-10-07T00:00:00.000Z',
  }]);

  assertEquals(isClassroomDataReady({ isLoading: false, user: null, offlineProfile: { id: 'student-1' } }), true);
  assertEquals(await readOfflineAssignments(repository, 'student-1'), [{
    id: 'assignment-1',
    name: 'Colors',
    lessonId: 'lesson-1',
    classId: 'class-1',
    dueAt: null,
    createdAt: '2026-10-07T00:00:00.000Z',
    status: 'not_started',
    currentGameOrder: 0,
    score: 0,
    maxScore: 0,
    completed: false,
    className: null,
    studentId: null,
  }]);
  assertEquals(buildOfflinePage([{ id: 'one' }]), {
    items: [{ id: 'one' }],
    page: { nextCursor: null, hasMore: false },
  });
});

Deno.test('offline classroom and roster queries expose the cached teacher view', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  await repository.putSnapshot('classrooms', [{
    id: 'class-1',
    created_at: '2026-10-07T00:00:00.000Z',
  }]);
  await repository.putSnapshot('classStudents', [{
    id: 'membership-1',
    student_id: 'student-1',
    joined_at: '2026-10-07T01:00:00.000Z',
    profiles: { id: 'student-1', full_name: 'Ana Student', first_name: 'Ana', last_name: 'Student' },
  }]);

  assertEquals(await readOfflineClassroom(repository, 'teacher'), {
    id: 'class-1',
    name: 'Classroom',
    createdAt: '2026-10-07T00:00:00.000Z',
    archivedAt: null,
    studentCount: 1,
  });
  assertEquals(await readOfflineRoster(repository), {
    students: [{
      id: 'student-1',
      fullName: 'Ana Student',
      firstName: 'Ana',
      lastName: 'Student',
      joinedAt: '2026-10-07T01:00:00.000Z',
      appCompletionPct: null,
      lastPlayedPct: null,
      overallScore: null,
      overallMaxScore: null,
      overallScorePct: null,
      gameScores: [],
      assignments: [],
    }],
    page: { nextCursor: null, hasMore: false },
  });
});

Deno.test('class mutation status reports pending create and rename work', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  assertEquals(await hasPendingClassMutations(repository), false);

  await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');

  assertEquals(await hasPendingClassMutations(repository), true);
});
