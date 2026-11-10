import { assertEquals, assertMatch } from 'jsr:@std/assert';
import { bootstrapRepository } from '../../../../../src/lib/offline/classroom/bootstrap.ts';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createOfflineClass, renameOfflineClass } from '../../../../../src/lib/offline/classroom/mutations.ts';

Deno.test('bootstrap persists the pack while retaining pending local work', async () => {
  const repository = createOfflineRepository(
    createMemoryStore(),
    () => '2026-10-07T12:00:00.000Z',
    () => 'operation-1',
  );
  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'assignment.create',
    entityId: 'local-assignment',
    payload: { name: 'Offline colors' },
    dependencies: [],
  });

  await bootstrapRepository(repository, async () => ({
    revision: 8,
    teacher: { id: 'teacher-1', role: 'teacher', fullName: 'Teacher' },
    classroom: { id: 'class-1', name: 'Math' },
    students: [],
    assignments: [{ id: 'server-assignment', name: 'Server colors' }],
    attempts: [],
    gameResults: [],
    posts: [],
    freePlaySessions: [],
    freePlayProgress: [],
  }), () => '2026-10-16T00:00:00.000Z');

  assertEquals(await repository.readMeta('revision'), 8);
  assertMatch(String(await repository.readMeta('lastSyncedAt')), /^2026-10-07T12:00:00\.000Z$/);
  assertEquals(await repository.readMeta('offlineAccessUntil'), '2026-10-23T00:00:00.000Z');
  assertEquals(
    (await repository.readCollection('assignments')).map((row) => row.id).sort(),
    ['local-assignment', 'server-assignment'],
  );
});

Deno.test('an IndexedDB-compatible classroom store survives repository recreation', async () => {
  const store = createMemoryStore();
  const firstRepository = createOfflineRepository(store, () => '2026-10-18T00:00:00.000Z', () => 'operation-1');

  await bootstrapRepository(firstRepository, async () => ({
    revision: 4,
    teacher: { id: 'teacher-1', role: 'teacher', fullName: 'Teacher' },
    classroom: { id: 'class-1', name: 'Math' },
    students: [],
    assignments: [{ id: 'assignment-1', name: 'Practice' }],
    attempts: [],
    gameResults: [],
    posts: [],
    freePlaySessions: [],
    freePlayProgress: [],
  }));

  const reloadedRepository = createOfflineRepository(store);
  assertEquals(await reloadedRepository.readMeta('revision'), 4);
  assertEquals(await reloadedRepository.readByKey('classrooms', 'class-1'), { id: 'class-1', name: 'Math' });
  assertEquals(await reloadedRepository.readByKey('assignments', 'assignment-1'), { id: 'assignment-1', name: 'Practice' });
});

Deno.test('bootstrap keeps an offline-created and renamed class ahead of the server snapshot', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');
  await renameOfflineClass(repository, 'teacher-1', 'class-local-1', 'Year 5 - Blue');

  await bootstrapRepository(repository, async () => ({
    revision: 9,
    teacher: { id: 'teacher-1', role: 'teacher', fullName: 'Teacher' },
    classrooms: [{ id: 'class-local-1', teacher_id: 'teacher-1', name: 'Year 5', created_at: '2026-11-10T00:00:00.000Z', archived_at: null }],
    students: [],
    assignments: [],
    attempts: [],
    gameResults: [],
    posts: [],
    freePlaySessions: [],
    freePlayProgress: [],
  }));

  assertEquals(await repository.readByKey('classrooms', 'class-local-1'), {
    id: 'class-local-1',
    teacher_id: 'teacher-1',
    name: 'Year 5 - Blue',
    created_at: (await repository.readByKey('classrooms', 'class-local-1'))?.created_at,
    archived_at: null,
  });
});
