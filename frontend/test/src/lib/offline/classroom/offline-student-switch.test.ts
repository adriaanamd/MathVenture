import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';

Deno.env.set('VITE_SUPABASE_URL', 'https://example.supabase.co');
Deno.env.set('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const { readOfflineStudentProfile, readOfflineViewingStudent, viewStudentAccount } = await import('../../../../../src/lib/auth/auth.ts');

Deno.test('cached student switching returns the selected roster profile', async () => {
  const store = createMemoryStore();
  await store.put('profiles', {
    key: 'student-1',
    value: { id: 'student-1', role: 'student', full_name: 'Ana Santos' },
  });
  assertEquals(await readOfflineStudentProfile('student-1', store), {
    id: 'student-1', role: 'student', full_name: 'Ana Santos',
  });
});

Deno.test('student account view falls back to the cached profile when the Edge Function is unreachable', async () => {
  const store = createMemoryStore();
  const cachedProfile = { id: 'student-1', role: 'student' as const, full_name: 'Ana Santos' };
  await store.put('profiles', { key: 'student-1', value: cachedProfile });

  const profile = await viewStudentAccount('student-1', {
    store,
    isOffline: () => false,
    invokeTeacher: async () => {
      throw new Error('Failed to send a request to the Edge Function');
    },
  });

  assertEquals(profile, cachedProfile);
  assertEquals(await readOfflineViewingStudent(store), cachedProfile);
});
