import { assertEquals, assertRejects } from 'jsr:@std/assert';
import {
  loadAssignmentsOnlineFirst,
  waitForOnlineAssignmentSync,
} from '../../../../../src/features/assignments/api/online.ts';

const page = (id: string) => ({
  assignments: [{ id }],
  page: { nextCursor: null, hasMore: false },
});

Deno.test('online assignment reads use the server instead of stale local rows', async () => {
  let serverReads = 0;
  const result = await loadAssignmentsOnlineFirst({
    isOffline: false,
    readCache: async () => page('local-ghost'),
    readServer: async () => {
      serverReads += 1;
      return page('server-assignment');
    },
  });

  assertEquals(serverReads, 1);
  assertEquals(result.assignments.map((assignment) => assignment.id), ['server-assignment']);
});

Deno.test('online assignment reads use cache only when the server is unavailable', async () => {
  const result = await loadAssignmentsOnlineFirst({
    isOffline: false,
    readCache: async () => page('cached-assignment'),
    readServer: async () => { throw new Error('network down'); },
  });

  assertEquals(result.assignments.map((assignment) => assignment.id), ['cached-assignment']);
});

Deno.test('online assignment mutations wait for server acknowledgement', async () => {
  await assertRejects(
    () => waitForOnlineAssignmentSync(false, async () => ({ completed: 0, remaining: 1, failed: 0 })),
    Error,
    'not acknowledged',
  );
});

Deno.test('assignment mutations continue locally when sync reports a network error', async () => {
  const result = await waitForOnlineAssignmentSync(false, async () => ({
    completed: 0,
    remaining: 1,
    failed: 0,
    networkError: true,
  }));

  assertEquals(result?.networkError, true);
});
