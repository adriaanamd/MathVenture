import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { syncOutbox } from '../../../../../src/lib/offline/classroom/sync.ts';

Deno.test('sync sends dependent operations in order and clears acknowledgements', async () => {
  let nextId = 0;
  const repository = createOfflineRepository(
    createMemoryStore(),
    () => '2026-10-07T00:00:00.000Z',
    () => `operation-${++nextId}`,
  );
  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'assignment.create',
    entityId: 'assignment-1',
    payload: { name: 'Colors' },
    dependencies: [],
  });
  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'assignment.update',
    entityId: 'assignment-1',
    payload: { name: 'Updated colors' },
    dependencies: ['operation-1'],
  });

  const sent: string[] = [];
  await syncOutbox(repository, async (operations) => {
    sent.push(...operations.map((operation) => operation.operationId));
    return operations.map((operation) => ({ operationId: operation.operationId, status: 'accepted' as const }));
  });

  assertEquals(sent, ['operation-1', 'operation-2']);
  assertEquals(await repository.getOutbox(), []);
});

Deno.test('sync keeps retryable dependent work queued and records an explicit conflict', async () => {
  let nextId = 0;
  const repository = createOfflineRepository(
    createMemoryStore(),
    () => '2026-10-16T00:00:00.000Z',
    () => `operation-${++nextId}`,
  );
  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'assignment.create',
    entityId: 'assignment-1',
    payload: { name: 'Practice' },
    dependencies: [],
  });
  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'assignment.update',
    entityId: 'assignment-1',
    payload: { name: 'Updated' },
    dependencies: ['operation-1'],
  });

  const sent: string[] = [];
  const result = await syncOutbox(repository, async (operations) => {
    sent.push(...operations.map((operation) => operation.operationId));
    if (operations[0]?.operationId === 'operation-1') {
      return [{ operationId: 'operation-1', status: 'accepted' as const }];
    }
    return [{ operationId: 'operation-2', status: 'retryable' as const, error: 'temporary' }];
  });

  assertEquals(sent, ['operation-1', 'operation-2']);
  assertEquals(result.remaining, 1);
  assertEquals((await repository.getOutbox())[0]?.status, 'pending');

  await repository.updateOutbox('operation-2', { status: 'syncing' });
  const conflict = await syncOutbox(repository, async () => [{
    operationId: 'operation-2',
    status: 'conflict' as const,
    error: 'The assignment changed online.',
    result: { conflict: true, server: { name: 'Server name' } },
  }]);

  assertEquals(conflict.failed, 1);
  assertEquals((await repository.listConflicts()).length, 1);
  assertEquals((await repository.listConflicts())[0]?.status, 'open');
});

Deno.test('network batch failures keep operations pending and mark network error', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  await repository.applyMutation({
    actorId: 'student-1',
    type: 'assignmentQuiz.start',
    entityId: 'attempt-1',
    payload: { assignmentId: 'assignment-1', lessonId: 'colors' },
    dependencies: [],
  });

  const result = await syncOutbox(repository, async () => {
    throw new TypeError('Failed to fetch');
  });

  assertEquals(result.networkError, true);
  assertEquals(result.remaining, 1);
  assertEquals((await repository.getOutbox())[0]?.status, 'pending');
});
