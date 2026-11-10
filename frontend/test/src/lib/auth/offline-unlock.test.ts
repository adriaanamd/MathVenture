import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../src/lib/offline/classroom/memoryStore.ts';
import { createMemorySqlite } from '../../../../src/lib/offline/sqlite/memoryAdapter.ts';
import { ONLINE_ONLY_OFFLINE_MESSAGE } from '../../../../src/lib/offline/onlineOnly.ts';

Deno.env.set('VITE_SUPABASE_URL', 'https://example.supabase.co');
Deno.env.set('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const { enrollOfflineDevice, offlineSignIn, restoreOfflineSession } = await import('../../../../src/lib/auth/auth.ts');

Deno.test('offline sign-in requires internet when no account is enrolled', async () => {
  await assertRejects(
    () => offlineSignIn('secret', createMemoryStore()),
    Error,
    ONLINE_ONLY_OFFLINE_MESSAGE,
  );
});

Deno.test('offline sign-in returns the enrolled teacher for the correct password', async () => {
  const store = createMemoryStore();
  await enrollOfflineDevice(
    { id: 'teacher-1', role: 'teacher', full_name: 'Teacher' },
    'secret',
    store,
  );

  const profile = await offlineSignIn('secret', store);
  assertEquals(profile.id, 'teacher-1');
  assertEquals(profile.role, 'teacher');
  await assertRejects(() => offlineSignIn('wrong', store), Error, 'Incorrect offline password.');
});

Deno.test('offline session restores from SQLite without a Supabase request while the lease is valid', async () => {
  const database = await createMemorySqlite();
  await database.execute(`insert into device_enrollment (device_id, teacher_id, profile_json, verifier_json, last_online_validated_at, offline_access_until, created_at, updated_at)
    values (?, ?, ?, ?, ?, ?, ?, ?)`, [
    'device-1',
    'teacher-1',
    JSON.stringify({ id: 'teacher-1', role: 'teacher', full_name: 'Teacher' }),
    JSON.stringify({ algorithm: 'PBKDF2-SHA-256', iterations: 120000, salt: 'salt', verifier: 'verifier' }),
    '2026-10-10T12:00:00.000Z',
    '2026-10-23T12:00:00.000Z',
    '2026-10-10T12:00:00.000Z',
    '2026-10-10T12:00:00.000Z',
  ]);
  await database.execute(`insert into local_sessions (session_id, teacher_id, active_profile_json, viewing_student_json, updated_at)
    values (?, ?, ?, ?, ?)`, [
    'active',
    'teacher-1',
    JSON.stringify({ id: 'teacher-1', role: 'teacher', full_name: 'Teacher' }),
    null,
    '2026-10-10T12:00:00.000Z',
  ]);

  const session = await restoreOfflineSession({
    now: '2026-10-16T12:00:00.000Z',
    online: false,
    storage: database,
  });

  assertEquals(session?.role, 'teacher');
});

Deno.test('expired offline lease returns needs-auth and preserves pending local data', async () => {
  const database = await createMemorySqlite();
  await database.execute(`insert into device_enrollment (device_id, teacher_id, profile_json, verifier_json, last_online_validated_at, offline_access_until, created_at, updated_at)
    values (?, ?, ?, ?, ?, ?, ?, ?)`, [
    'device-1',
    'teacher-1',
    JSON.stringify({ id: 'teacher-1', role: 'teacher', full_name: 'Teacher' }),
    JSON.stringify({ algorithm: 'PBKDF2-SHA-256', iterations: 120000, salt: 'salt', verifier: 'verifier' }),
    '2026-10-10T12:00:00.000Z',
    '2026-10-17T12:00:00.000Z',
    '2026-10-10T12:00:00.000Z',
    '2026-10-10T12:00:00.000Z',
  ]);
  await database.execute(`insert into sync_outbox (operation_id, device_id, actor_id, operation_type, entity_id, payload_json, dependencies_json, base_revision, created_at, status, attempt_count, last_error, next_attempt_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    'op-1', 'device-1', 'teacher-1', 'assignment.create', 'assignment-1', '{}', '[]', 0,
    '2026-10-10T12:00:00.000Z', 'pending', 0, null, null,
  ]);

  await assertRejects(
    () => restoreOfflineSession({ now: '2026-10-24T12:00:00.000Z', online: false, storage: database }),
    Error,
    ONLINE_ONLY_OFFLINE_MESSAGE,
  );
  assertEquals((await database.query('select operation_id from sync_outbox')).map((row) => row.operation_id), ['op-1']);
});
