import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';
import {
  createOfflineAssignment,
  createOfflineClass,
  createOfflinePost,
  renameOfflineClass,
} from '../../../../../src/lib/offline/classroom/mutations.ts';

Deno.test('offline assignment mutation returns a local ID and pending sync state', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  const result = await createOfflineAssignment(repository, 'teacher-1', {
    lessonId: 'lesson-1',
    name: 'Offline colors',
    classId: 'class-1',
  }, () => 'assignment-local-1');

  assertEquals(result, {
    id: 'assignment-local-1',
    syncState: 'pending',
  });
  assertEquals((await repository.readCollection('assignments'))[0].name, 'Offline colors');
});

Deno.test('offline posts are saved locally for later sync', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  const result = await createOfflinePost(repository, 'teacher-1', {
    classId: 'class-1',
    content: 'Remember to practice offline.',
  }, () => 'post-local-1');

  assertEquals(result, { id: 'post-local-1', syncState: 'pending' });
  assertEquals((await repository.readCollection('posts'))[0], {
    id: 'post-local-1',
    classId: 'class-1',
    content: 'Remember to practice offline.',
    authorId: 'teacher-1',
  });
});

Deno.test('offline class creation is immediately visible and queued', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  const result = await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');

  assertEquals(result, { id: 'class-local-1', syncState: 'pending' });
  const row = await repository.readByKey('classrooms', 'class-local-1');
  assertEquals(row?.id, 'class-local-1');
  assertEquals(row?.teacher_id, 'teacher-1');
  assertEquals(row?.name, 'Year 5');
  assertEquals(row?.archived_at, null);
  assertEquals(typeof row?.created_at, 'string');
  assertEquals((await repository.getOutbox())[0]?.type, 'class.create');
});

Deno.test('offline class rename preserves the local row and depends on pending create', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');
  await renameOfflineClass(repository, 'teacher-1', 'class-local-1', 'Year 5 - Blue');

  const row = await repository.readByKey('classrooms', 'class-local-1');
  assertEquals(row, {
    id: 'class-local-1',
    teacher_id: 'teacher-1',
    name: 'Year 5 - Blue',
    created_at: row?.created_at,
    archived_at: null,
  });
  const operations = await repository.getOutbox();
  assertEquals(operations.map((operation) => operation.type), ['class.create', 'class.rename']);
  assertEquals(operations[1]?.dependencies, [operations[0]?.operationId]);
});

Deno.test('SQLite keeps offline class creation and rename visible with durable outbox rows', async () => {
  const database = await createMemorySqlite();
  const repository = createOfflineRepository(database);

  await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');
  await renameOfflineClass(repository, 'teacher-1', 'class-local-1', 'Year 5 - Blue');

  assertEquals((await repository.readByKey('classrooms', 'class-local-1'))?.name, 'Year 5 - Blue');
  assertEquals((await repository.getOutbox()).map((operation) => operation.type), ['class.create', 'class.rename']);
  assertEquals((await database.query('select operation_id from sync_outbox')).length, 2);
});
