# Complete Offline Workflow Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox ( - [ ] ) syntax for tracking.

Goal: Make MathVenture fully usable after online provisioning, with durable SQLite/IndexedDB offline storage, offline class creation/renaming, immediate reconnect/login synchronization, and explicit online-only handling for registration, initial login without a cached session, teacher account changes, archive, and unarchive.

Architecture: Extend the existing local-first repository/outbox instead of adding a second offline mode. Browser SQLite/OPFS remains preferred, IndexedDB remains the browser fallback, and Tauri continues using native SQLite; all adapters expose the existing repository contract. Add first-class class.create and class.rename operations, route teacher class mutations through the repository, and keep archive/unarchive/account/security actions behind one shared online-only policy.

Tech Stack: React 19, TypeScript, TanStack Query, Vite/Vitest, Deno tests, Supabase Edge Functions, SQLite WASM/OPFS, IndexedDB, Tauri native SQLite, existing PWA service worker.

## Global Constraints

- Initial registration and initial login remain online-required; a valid provisioned offline session may unlock later offline launches.
- Teacher account changes, password recovery, class archive, and class unarchive remain online-only.
- The exact offline online-only message is: Check internet connection as this is online-only
- SQLite is preferred: OPFS in the PWA and native SQLite in Tauri; IndexedDB is the browser fallback.
- No volatile-memory fallback may be introduced or used as a silent durability substitute.
- All supported classroom and learning writes commit locally first and enqueue a durable outbox operation.
- Online login and reconnect must synchronize pending work without deleting or overwriting it.
- Preserve existing tests and CI quality gates; do not focus, skip, weaken, or swallow tests.
- Run each test execution lane within the repository's 110-second limit.
- Preserve unrelated user changes, including the existing untracked color assets; stage only files belonging to this work.

---

## File and Responsibility Map

- frontend/src/lib/offline/onlineOnly.ts centralizes network-required policy and exact user-facing error text.
- frontend/src/lib/offline/classroom/types.ts, mutations.ts, and repository.ts define and persist local class lifecycle operations.
- frontend/src/lib/offline/classroom/queries.ts exposes pending-aware cached class reads so optimistic local classes are not replaced by an incomplete server list.
- frontend/src/features/classroom/api/hooks.ts selects local-first mutations for teacher class create/rename and direct online mutations for archive/unarchive.
- frontend/src/components/teacher/TeacherClassList.tsx, TeacherClassCard.tsx, TeacherClassManagementDialog.tsx, and frontend/src/features/teacher/class-settings.tsx expose the correct offline affordances and errors.
- frontend/src/lib/auth/auth.ts, password.ts, and frontend/src/features/public-site/auth.tsx enforce online-only registration/login/security flows while preserving cached offline unlock.
- supabase/functions/_shared/offline_operations.ts applies and validates server-side class create/rename operations through the existing offline-sync endpoint.
- frontend/src/lib/offline/sqlite/runtime.ts, store.ts, and adapter tests verify identical durable behavior across SQLite and IndexedDB.
- docs/offline-classroom.md and README.md document the corrected product contract.

---

### Task 1: Centralize online-only policy and protect authentication/security actions

Files:
- Create: frontend/src/lib/offline/onlineOnly.ts
- Modify: frontend/src/lib/auth/auth.ts
- Modify: frontend/src/lib/auth/password.ts
- Modify: frontend/src/features/public-site/auth.tsx
- Test: frontend/test/src/lib/offline/online-only-policy.test.ts
- Test: frontend/test/src/lib/auth/offline-unlock.test.ts
- Test: frontend/test/src/lib/auth/offline-provisioning.test.ts
- Test: frontend/test/src/pages/auth.test.ts

Interfaces:
- Produces ONLINE_ONLY_OFFLINE_MESSAGE, OnlineOnlyError, isBrowserOnline(), and requireOnlineOnly().
- requireOnlineOnly(isOnline?: boolean): void throws OnlineOnlyError with exactly Check internet connection as this is online-only when isOnline is false.

- [ ] Step 1: Write the failing policy tests.

~~~ts
import { assertEquals } from 'jsr:@std/assert';
import {
  ONLINE_ONLY_OFFLINE_MESSAGE,
  OnlineOnlyError,
  requireOnlineOnly,
} from '../../../../src/lib/offline/onlineOnly.ts';

Deno.test('online-only policy uses the required exact offline message', () => {
  let error: unknown;
  try {
    requireOnlineOnly(false);
  } catch (caught) {
    error = caught;
  }
  if (!(error instanceof OnlineOnlyError)) throw new Error('Expected OnlineOnlyError.');
  assertEquals(error.message, ONLINE_ONLY_OFFLINE_MESSAGE);
});

Deno.test('online-only policy allows connected actions', () => {
  requireOnlineOnly(true);
});
~~~

- [ ] Step 2: Run the focused policy test to verify it fails.

Run:

~~~powershell
deno test --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/offline/online-only-policy.test.ts
~~~

Expected: FAIL because onlineOnly.ts does not exist.

- [ ] Step 3: Implement the shared policy.

~~~ts
export const ONLINE_ONLY_OFFLINE_MESSAGE = 'Check internet connection as this is online-only';

export class OnlineOnlyError extends Error {
  constructor() {
    super(ONLINE_ONLY_OFFLINE_MESSAGE);
    this.name = 'OnlineOnlyError';
  }
}

export function isBrowserOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export function requireOnlineOnly(isOnline = isBrowserOnline()): void {
  if (!isOnline) throw new OnlineOnlyError();
}
~~~

- [ ] Step 4: Make initial registration/login and teacher security APIs call the policy. Apply requireOnlineOnly before calling Supabase in teacherSignUp, teacherSignIn, requestTeacherPasswordReset, verifyTeacherPasswordResetOtp, and changeTeacherPassword. Apply it to teacher return-to-account password verification as well. Do not apply it to offlineSignIn when a valid enrollment exists.

When offlineSignIn finds no enrollment, or the offline lease is expired, throw OnlineOnlyError so an offline initial-login attempt displays the exact required message. Preserve OfflineAuthError('Incorrect offline password.') for an enrolled device with a wrong password.

- [ ] Step 5: Update the public auth forms to preserve cached offline login and surface online-only failures. Keep the current flow where /login tries cached offlineSignIn while offline and Supabase login while online. Ensure caught OnlineOnlyError is rendered unchanged. Add the same guard path to signup, forgot-password, and password-reset submits through their auth functions; do not call network APIs first when the browser is already offline.

- [ ] Step 6: Run the focused auth/policy tests.

~~~powershell
deno test --allow-read --allow-env --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/offline/online-only-policy.test.ts frontend/test/src/lib/auth/offline-unlock.test.ts frontend/test/src/lib/auth/offline-provisioning.test.ts frontend/test/src/pages/auth.test.ts
~~~

Expected: PASS, with existing cached offline unlock and enrollment tests unchanged except for the new exact online-only error assertions.

- [ ] Step 7: Commit the policy/auth boundary.

~~~powershell
git add frontend/src/lib/offline/onlineOnly.ts frontend/src/lib/auth/auth.ts frontend/src/lib/auth/password.ts frontend/src/features/public-site/auth.tsx frontend/test/src/lib/offline/online-only-policy.test.ts frontend/test/src/lib/auth/offline-unlock.test.ts frontend/test/src/lib/auth/offline-provisioning.test.ts frontend/test/src/pages/auth.test.ts
git commit -m "feat: centralize offline online-only auth policy"
~~~

---

### Task 2: Add durable local class create/rename mutations to both repository adapters

Files:
- Modify: frontend/src/lib/offline/classroom/types.ts
- Modify: frontend/src/lib/offline/classroom/repository.ts
- Modify: frontend/src/lib/offline/classroom/mutations.ts
- Modify: frontend/src/lib/offline/classroom/queries.ts
- Test: frontend/test/src/lib/offline/classroom/mutations.test.ts
- Test: frontend/test/src/lib/offline/classroom/queries.test.ts
- Test: frontend/test/src/lib/offline/sqlite/local-first.integration.test.ts
- Test: frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts

Interfaces:
- Adds class.create and class.rename to OfflineOperationType.
- Extends OfflineMutationInput with localEntity?: Record<string, unknown> so an update can preserve the complete optimistic local row while writing its outbox operation.
- Produces createOfflineClass(repository, actorId, name, idFactory?) and renameOfflineClass(repository, actorId, classId, name), returning { id: string; syncState: 'pending' }.
- Produces hasPendingClassMutations(repository): Promise<boolean>.

- [ ] Step 1: Write failing tests for local class creation and rename. Assert that class creation writes a complete local classroom row and class.create outbox operation; rename preserves existing fields, changes only the name locally, and depends on a pending create.

~~~ts
Deno.test('offline class creation is immediately visible and queued', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  const result = await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');

  assertEquals(result, { id: 'class-local-1', syncState: 'pending' });
  assertEquals((await repository.readByKey('classrooms', 'class-local-1'))?.value, {
    id: 'class-local-1',
    teacher_id: 'teacher-1',
    name: 'Year 5',
    created_at: '2026-10-07T00:00:00.000Z',
    archived_at: null,
  });
  assertEquals((await repository.getOutbox())[0]?.type, 'class.create');
});

Deno.test('offline class rename preserves the local row and depends on pending create', async () => {
  const repository = createOfflineRepository(createMemoryStore(), () => '2026-10-07T00:00:00.000Z');
  await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');
  await renameOfflineClass(repository, 'teacher-1', 'class-local-1', 'Year 5 - Blue');

  assertEquals((await repository.readByKey('classrooms', 'class-local-1'))?.value.name, 'Year 5 - Blue');
  const operations = await repository.getOutbox();
  assertEquals(operations.map((operation) => operation.type), ['class.create', 'class.rename']);
  assertEquals(operations[1]?.dependencies, [operations[0]?.operationId]);
});
~~~

- [ ] Step 2: Run the focused mutation test to verify it fails.

~~~powershell
deno test --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/offline/classroom/mutations.test.ts
~~~

Expected: FAIL because the operation types and mutation helpers are not defined.

- [ ] Step 3: Add the new operation types and atomic local-entity support. Update operationStores so both class operations use classrooms. In both the IndexedDB repository and SQLite repository, write input.localEntity ?? valueWithId(input.entityId, input.payload) in the same transaction as the outbox row.

~~~ts
export type OfflineOperationType =
  | 'class.create'
  | 'class.rename'
  | 'class.ensure'
  // existing operation types remain unchanged
  ;

export type OfflineMutationInput = {
  actorId: string;
  type: OfflineOperationType;
  entityId: string;
  payload: Record<string, unknown>;
  dependencies: string[];
  localEntity?: Record<string, unknown>;
};
~~~

- [ ] Step 4: Implement createOfflineClass and renameOfflineClass. Generate UUID-compatible provisional IDs with the existing makeId helper. Store class rows with id, teacher_id, name, created_at, and archived_at: null. For rename, read the class first, reject a missing local row with Classroom is not available offline., preserve the entire row, and add the pending class.create operation ID to dependencies when present.

~~~ts
export async function createOfflineClass(
  repository: OfflineRepository,
  actorId: string,
  name: string,
  idFactory?: () => string,
): Promise<PendingMutationResult> {
  const id = makeId(idFactory);
  const createdAt = new Date().toISOString();
  const localEntity = {
    id,
    teacher_id: actorId,
    name: name.trim(),
    created_at: createdAt,
    archived_at: null,
  };
  await repository.applyMutation({
    actorId,
    type: 'class.create',
    entityId: id,
    payload: { classId: id, name: localEntity.name },
    dependencies: [],
    localEntity,
  });
  return { id, syncState: 'pending' };
}
~~~

The rename implementation must use type class.rename, payload { classId, name }, the merged local entity, and dependencies derived from repository.getOutbox().

- [ ] Step 5: Add pending-aware class reads. hasPendingClassMutations must inspect outbox operations for class.create or class.rename. The teacher class query will use this to keep optimistic class rows visible while an online bootstrap/list request has not acknowledged them.

- [ ] Step 6: Run mutation, query, and SQLite integration tests.

~~~powershell
deno test --allow-read --allow-env --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/offline/classroom/mutations.test.ts frontend/test/src/lib/offline/classroom/queries.test.ts frontend/test/src/lib/offline/sqlite/local-first.integration.test.ts frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts
~~~

Expected: PASS, with class rows and outbox rows surviving repository recreation.

- [ ] Step 7: Commit durable local class mutations.

~~~powershell
git add frontend/src/lib/offline/classroom/types.ts frontend/src/lib/offline/classroom/repository.ts frontend/src/lib/offline/classroom/mutations.ts frontend/src/lib/offline/classroom/queries.ts frontend/test/src/lib/offline/classroom/mutations.test.ts frontend/test/src/lib/offline/classroom/queries.test.ts frontend/test/src/lib/offline/sqlite/local-first.integration.test.ts frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts
git commit -m "feat: add durable offline class mutations"
~~~

---

### Task 3: Apply class create/rename operations in Supabase offline sync

Files:
- Modify: supabase/functions/_shared/offline_operations.ts
- Create: test/supabase/functions/offline-sync/class-operations.test.ts
- Modify: test/supabase/functions/offline-sync/handler.test.ts

Interfaces:
- Adds class.create and class.rename to OFFLINE_OPERATION_TYPES.
- Produces ClassOperationPersistence:

~~~ts
export type ClassOperationPersistence = {
  createClass(input: {
    id: string;
    teacherId: string;
    name: string;
    createdAt: string;
  }): Promise<Record<string, unknown>>;
  getTeacherClass(teacherId: string, classId: string): Promise<Record<string, unknown> | null>;
  renameClass(classId: string, name: string): Promise<Record<string, unknown> | null>;
};
~~~

- applyOfflineOperation routes class lifecycle operations through createClassOperationApplier and leaves roster class.ensure, class.addStudents, and class.removeStudent behavior intact.

- [ ] Step 1: Write failing server applier tests. Add tests for valid create, invalid blank/overlong names, valid rename against an owned class, missing/foreign class rejection, and retry-safe create when the same class entity already exists for the teacher. Assert failed validation does not call persistence writes.

~~~ts
Deno.test('class.create creates the requested class and returns an ID mapping', async () => {
  let created: { id: string; teacherId: string; name: string; createdAt: string } | null = null;
  const persistence: ClassOperationPersistence = {
    createClass: async (input) => {
      created = input;
      return { id: 'class-server-1', teacher_id: input.teacherId, name: input.name };
    },
    getTeacherClass: async () => null,
    renameClass: async () => null,
  };

  const result = await createClassOperationApplier(persistence)('teacher-1', {
    operationId: 'operation-1',
    deviceId: 'device-1',
    actorId: 'teacher-1',
    type: 'class.create',
    entityId: 'class-local-1',
    payload: { classId: 'class-local-1', name: 'Year 5' },
    dependencies: [],
    createdAt: '2026-10-07T00:00:00.000Z',
  });

  assertEquals(created?.name, 'Year 5');
  assertEquals(result.status, 'accepted');
  assertEquals(result.result && (result.result as Record<string, unknown>).mappings, [{
    entityType: 'classroom',
    localId: 'class-local-1',
    serverId: 'class-server-1',
  }]);
});
~~~

- [ ] Step 2: Run the focused server test to verify it fails.

~~~powershell
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync/class-operations.test.ts
~~~

Expected: FAIL because the new operation types/applier do not exist.

- [ ] Step 3: Implement class operation validation and application. Validate a trimmed non-empty name of at most 120 characters. For create, call createClass with operation.entityId as the provisional ID input and return the classroom plus a classroom mapping. If persistence reports an already-owned row for the same ID, return it as accepted so a request lost after the database insert can be retried safely. For rename, resolve payload.classId or operation.entityId, verify teacher ownership before writing, and return Classroom not found. for missing/foreign rows.

- [ ] Step 4: Implement default Supabase persistence. Insert into classes with the supplied ID, teacher ID, trimmed name, join_code null, and archived_at null. If the insert reports a duplicate ID, query the exact ID and teacher owner; return that row only when it belongs to the same teacher, otherwise rethrow. For rename, update the exact owned class ID and return the refreshed class summary. Do not alter archive/unarchive direct handlers.

- [ ] Step 5: Extend handler validation tests to accept the new operation types and preserve duplicate/retry behavior. Add one class.create payload to the existing offline-sync handler fixture and assert that its result is recorded and returned as accepted. Keep existing invalid-operation and retryable-operation assertions.

- [ ] Step 6: Run all offline-sync backend tests.

~~~powershell
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync
~~~

Expected: PASS with no skipped tests; class operations, roster operations, assignments, quizzes, activity, and duplicate recording all remain covered.

- [ ] Step 7: Commit the server sync operations.

~~~powershell
git add supabase/functions/_shared/offline_operations.ts test/supabase/functions/offline-sync/class-operations.test.ts test/supabase/functions/offline-sync/handler.test.ts
git commit -m "feat: sync offline class lifecycle operations"
~~~

---

### Task 4: Route teacher class UI mutations through local-first storage

Files:
- Modify: frontend/src/features/classroom/api/hooks.ts
- Modify: frontend/src/components/teacher/TeacherClassList.tsx
- Modify: frontend/src/components/teacher/TeacherClassCard.tsx
- Modify: frontend/src/features/teacher/class-settings.tsx
- Modify: frontend/src/components/teacher/TeacherClassManagementDialog.tsx
- Test: frontend/test/src/pages/offline-shell.test.ts
- Test: frontend/src/features/teacher/classes.test.tsx
- Test: frontend/src/features/teacher/settings.test.tsx

Interfaces:
- useCreateClass uses createOfflineClass for authenticated teachers whether online or offline, calls syncNow when connected, and invalidates the class list without claiming cloud acknowledgement when pending.
- useUpdateClass uses renameOfflineClass for action rename; action archive/unarchive calls requireOnlineOnly before api.classes.update and never writes a local outbox operation.
- The UI keeps New class and rename available offline, makes archive/unarchive clickable online-only actions, and renders ONLINE_ONLY_OFFLINE_MESSAGE when attempted offline.

- [ ] Step 1: Add failing UI/source tests. Assert that class list source no longer disables New class while offline, no longer says class creation/renaming require internet, class settings enables rename offline, and archive/unarchive paths include the exact required message/policy. Assert class mutation hooks call local mutation helpers.

~~~ts
Deno.test('teacher class UI keeps create and rename available offline', async () => {
  const source = await Deno.readTextFile(new URL('../../../src/components/teacher/TeacherClassList.tsx', import.meta.url));
  const settings = await Deno.readTextFile(new URL('../../../src/features/teacher/class-settings.tsx', import.meta.url));
  if (source.includes('disabled={!online}') || source.includes('Class creation, renaming, archiving, and unarchiving require')) {
    throw new Error('Class creation and rename must not be disabled offline.');
  }
  if (settings.includes('disabled={!online || updateClass.isPending')) {
    throw new Error('Class rename must not be disabled offline.');
  }
});
~~~

- [ ] Step 2: Run focused UI tests to verify they fail.

~~~powershell
npm run test:frontend --prefix frontend -- src/features/teacher/classes.test.tsx src/features/teacher/settings.test.tsx
deno test --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/pages/offline-shell.test.ts
~~~

Expected: FAIL because the current class list/settings still disable or label class creation/rename as online-required.

- [ ] Step 3: Update class hooks. Inject user, repository, and syncNow into useCreateClass/useUpdateClass. Return local optimistic class summaries for create/rename, call syncNow when isBrowserOnline() is true, and keep bootstrapNow as a follow-up refresh after acknowledged online work. Use requireOnlineOnly for archive/unarchive before invoking the online API.

The update branch must distinguish rename from archive/unarchive:

~~~ts
if (input.action === 'rename' && user?.role === 'teacher') {
  const result = await renameOfflineClass(repository, user.id, input.classId, input.name ?? '');
  if (isBrowserOnline()) void syncNow();
  return { classroom: { id: result.id, name: input.name }, syncState: result.syncState };
}
requireOnlineOnly();
return api.classes.update(input);
~~~

For create, use the same local-first path with createOfflineClass; remove the old browserIsOffline rejection.

- [ ] Step 4: Update teacher UI copy and controls.

Make these concrete changes:
- New class button stays enabled offline.
- Offline banner says class creation and renaming continue locally; archive/unarchive require internet.
- Class rename submit stays enabled offline.
- Archive/unarchive controls stay visible/clickable and are disabled only while a request is pending.
- Class list and class settings render mutation errors for archive/unarchive regardless of network state, preserving the exact OnlineOnlyError message.
- Do not add a second custom wording for the required online-only error.

- [ ] Step 5: Run focused frontend and shell tests.

~~~powershell
npm run test:frontend --prefix frontend -- src/features/teacher/classes.test.tsx src/features/teacher/settings.test.tsx
deno test --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/pages/offline-shell.test.ts
~~~

Expected: PASS, including existing offline pack/status shell contracts.

- [ ] Step 6: Commit the teacher class UX.

~~~powershell
git add frontend/src/features/classroom/api/hooks.ts frontend/src/components/teacher/TeacherClassList.tsx frontend/src/components/teacher/TeacherClassCard.tsx frontend/src/features/teacher/class-settings.tsx frontend/src/components/teacher/TeacherClassManagementDialog.tsx frontend/test/src/pages/offline-shell.test.ts frontend/src/features/teacher/classes.test.tsx frontend/src/features/teacher/settings.test.tsx
git commit -m "feat: make teacher class management offline-first"
~~~

---

### Task 5: Preserve optimistic classes through bootstrap and verify login/reconnect sync

Files:
- Modify: frontend/src/lib/offline/classroom/useOfflineClassroom.ts only if the ordering test identifies a regression
- Modify: frontend/src/lib/offline/classroom/bootstrap.ts only if the merge path needs a contract-preserving change
- Modify: frontend/src/lib/offline/classroom/snapshot.ts
- Modify: frontend/src/features/classroom/api/hooks.ts
- Test: frontend/test/src/lib/offline/classroom/bootstrap.test.ts
- Test: frontend/test/src/lib/offline/classroom/bootstrap-contract.test.ts
- Test: frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts
- Test: frontend/test/src/pages/offline-shell.test.ts

Interfaces:
- persistBootstrap and mergeOfflineSnapshot preserve pending class.create and class.rename rows/operations exactly as they preserve existing pending classroom work.
- OfflineClassroomProvider runs bootstrapNow().finally(syncNow) after an authenticated online teacher session becomes available and on reconnect; tests cover the order, not just the presence of both calls.

- [ ] Step 1: Add an integration test with a pending local class create and rename, bootstrap using a server snapshot that omits the class, and assert that the local name and both pending operations remain.

~~~ts
Deno.test('bootstrap preserves pending class create and rename until sync acknowledges them', async () => {
  const repository = createOfflineRepository(createMemoryStore(), () => '2026-10-07T00:00:00.000Z');
  await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');
  await renameOfflineClass(repository, 'teacher-1', 'class-local-1', 'Year 5 - Blue');
  await bootstrapRepository(repository, async () => serverSnapshotWithoutLocalClass);

  assertEquals((await readOfflineTeacherClasses(repository))[0]?.name, 'Year 5 - Blue');
  assertEquals((await repository.getOutbox()).map((operation) => operation.type), ['class.create', 'class.rename']);
});
~~~

- [ ] Step 2: Run focused integration tests to verify the new behavior is not fully covered.

~~~powershell
deno test --allow-read --allow-env --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/offline/classroom/bootstrap.test.ts frontend/test/src/lib/offline/classroom/bootstrap-contract.test.ts frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts
~~~

Expected: the new assertion fails if bootstrap merging only considers existing operation entity/local-student IDs.

- [ ] Step 3: Extend pending snapshot references for class operations. Ensure mergeOfflineSnapshot considers the class operation entity ID and class IDs referenced by class.rename payloads. Preserve the optimistic row when a server snapshot omits it or contains the old name. Keep existing cleanup behavior for acknowledged server rows.

- [ ] Step 4: Verify provider startup ordering. Keep the existing effect order:

~~~ts
void bootstrapNow()
  .catch((error) => console.warn('Automatic offline classroom refresh skipped', error))
  .finally(() => { void syncNow(); });
~~~

Add a deterministic test around the injected invoke/repository path that records offline-bootstrap before offline-sync on online startup and records offline-sync on reconnect. Do not extend the offline lease from a force reload or failed sync.

- [ ] Step 5: Run focused integration and shell tests.

~~~powershell
deno test --allow-read --allow-env --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/offline/classroom/bootstrap.test.ts frontend/test/src/lib/offline/classroom/bootstrap-contract.test.ts frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts frontend/test/src/pages/offline-shell.test.ts
~~~

Expected: PASS with pending classes preserved through bootstrap and sync triggered after online startup/reconnect.

- [ ] Step 6: Commit bootstrap and reconnect behavior.

~~~powershell
git add frontend/src/lib/offline/classroom/useOfflineClassroom.ts frontend/src/lib/offline/classroom/bootstrap.ts frontend/src/lib/offline/classroom/snapshot.ts frontend/src/features/classroom/api/hooks.ts frontend/test/src/lib/offline/classroom/bootstrap.test.ts frontend/test/src/lib/offline/classroom/bootstrap-contract.test.ts frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts frontend/test/src/pages/offline-shell.test.ts
git commit -m "fix: preserve pending classes during offline sync"
~~~

---

### Task 6: Prove SQLite/IndexedDB repository parity and durable restart behavior

Files:
- Modify: frontend/src/lib/offline/classroom/store.ts only to inject an IndexedDB factory for deterministic tests
- Modify: frontend/src/lib/offline/sqlite/runtime.ts only if the parity test exposes a fallback selection bug
- Create: frontend/test/src/lib/offline/sqlite/indexeddb-repository-contract.test.ts
- Test: frontend/test/src/lib/offline/sqlite/runtime.test.ts
- Test: frontend/test/src/lib/offline/sqlite/local-first.integration.test.ts
- Test: frontend/test/src/lib/offline/sqlite/pwaAdapter.test.ts

Interfaces:
- createIndexedDbStore may accept an optional IndexedDB factory only for deterministic tests; production behavior continues to use globalThis.indexedDB.
- The shared repository contract is exercised with SQLite and IndexedDB for create, rename, reload, outbox, and ID remapping.

- [ ] Step 1: Add a shared contract test with a deterministic IndexedDB factory. Reuse the existing fake IndexedDB transaction harness and createMemorySqlite(). Execute the same class create/rename/reload scenario for each adapter and assert the same rows/outbox shape.

~~~ts
async function exerciseClassLifecycle(storage: OfflineStore | SqliteDatabase) {
  const repository = createOfflineRepository(storage, () => '2026-10-07T00:00:00.000Z', () => 'class-local-1', 'device-1');
  await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');
  await renameOfflineClass(repository, 'teacher-1', 'class-local-1', 'Year 5 - Blue');
  const reloaded = createOfflineRepository(storage, () => '2026-10-07T00:00:00.000Z', () => 'unused', 'device-1');
  return { row: await reloaded.readByKey('classrooms', 'class-local-1'), outbox: await reloaded.getOutbox() };
}
~~~

- [ ] Step 2: Run the new parity test to expose missing test injection or adapter differences.

~~~powershell
deno test --allow-read --allow-env --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/offline/sqlite/indexeddb-repository-contract.test.ts
~~~

Expected: FAIL until the deterministic IndexedDB factory can be injected and both adapters expose the same lifecycle behavior.

- [ ] Step 3: Add only the minimal IndexedDB factory injection needed by the test. Keep transaction semantics unchanged: local entity and outbox row are written in one readwrite transaction. Keep runtime fallback detection unchanged for non-OPFS SQLite errors; only OPFS/durable-storage availability failures may select IndexedDB.

- [ ] Step 4: Add restart/ID-remap assertions. Simulate an accepted class.create result with a distinct server ID, call repository.remapEntityId({ entityType: 'classroom', localId, serverId }), and assert the class row key, rename payload class ID, and dependent operation IDs update identically in SQLite and IndexedDB.

- [ ] Step 5: Run all storage tests.

~~~powershell
deno test --allow-read --allow-env --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/offline/sqlite/indexeddb-repository-contract.test.ts frontend/test/src/lib/offline/sqlite/runtime.test.ts frontend/test/src/lib/offline/sqlite/local-first.integration.test.ts frontend/test/src/lib/offline/sqlite/pwaAdapter.test.ts frontend/test/src/lib/offline/sqlite/migrations.test.ts
~~~

Expected: PASS; SQLite remains preferred, IndexedDB remains durable fallback, and no test introduces a memory-only production path.

- [ ] Step 6: Commit adapter parity coverage.

~~~powershell
git add frontend/src/lib/offline/classroom/store.ts frontend/src/lib/offline/sqlite/runtime.ts frontend/test/src/lib/offline/sqlite/indexeddb-repository-contract.test.ts frontend/test/src/lib/offline/sqlite/runtime.test.ts frontend/test/src/lib/offline/sqlite/local-first.integration.test.ts frontend/test/src/lib/offline/sqlite/pwaAdapter.test.ts
git commit -m "test: verify sqlite and indexeddb offline parity"
~~~

---

### Task 7: Update offline documentation and run the complete CI-equivalent verification gate

Files:
- Modify: docs/offline-classroom.md
- Modify: README.md

- [ ] Step 1: Update product documentation. State that class creation and renaming work offline, while registration, initial login without an enrolled device, teacher account/security changes, archive, and unarchive are online-only. Include the exact UI message and both SQLite/IndexedDB storage paths. Document that online login/reconnect flushes pending work.

- [ ] Step 2: Inspect the final diff and repository status.

~~~powershell
git diff --check
git status --short --branch
git diff --stat master...HEAD
~~~

Expected: only files belonging to this task are staged/committed; the pre-existing untracked color assets remain untouched and unstaged.

- [ ] Step 3: Run frontend CI lanes sequentially.

~~~powershell
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
~~~

Expected: each command exits 0, with the frontend test lane below 110 seconds.

- [ ] Step 4: Run the Supabase CI lane.

~~~powershell
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
~~~

Expected: all Supabase tests pass with no skipped tests.

- [ ] Step 5: Run Windows Tauri CI lanes.

~~~powershell
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run tauri:build -- --debug
~~~

Expected: formatting, Rust tests, Clippy, and the debug Tauri bundle pass. If a required toolchain is unavailable, record that exact limitation instead of treating the lane as passed.

- [ ] Step 6: Perform the manual offline test matrix.

1. Register and log in once online; verify the classroom pack is present.
2. Force-close/reopen with networking disabled; unlock with the cached teacher session.
3. Create a class offline; reload; verify it remains selectable.
4. Rename that class offline; reload; verify the new name remains.
5. Exercise assignments, roster, posts, reports/dashboard reads, quizzes/checkpoints/attempts, cached student switching, and Free Play offline.
6. Restore connectivity; verify automatic sync clears acknowledged work and the server contains class create/rename changes.
7. Perform offline work, then complete an online login; verify sync starts immediately without losing pending work.
8. Attempt archive, unarchive, password change, password reset, registration, and initial login on an unprovisioned device while offline; verify the exact message and no local outbox mutation.
9. Force a rejected operation; verify the conflict/recovery panel keeps it visible and retryable.

- [ ] Step 7: Commit documentation.

~~~powershell
git add docs/offline-classroom.md README.md
git commit -m "docs: document complete offline workflow"
~~~

- [ ] Step 8: Report verification precisely. State exact local command results, whether the Windows Tauri lane ran, and whether remote GitHub Actions was verified. Do not claim cloud deployment or production sync behavior until the corresponding remote deployment has been run and checked.

---

## Plan Self-Review

- Spec coverage: product boundaries are covered by Tasks 1 and 4; SQLite/IndexedDB parity by Task 6; class lifecycle persistence by Task 2; server synchronization by Task 3; login/reconnect synchronization and merge behavior by Task 5; documentation/manual verification/CI gates by Task 7.
- Placeholder scan: no TBD, TODO, skipped-test instruction, weakened assertion, or advisory quality gate is used.
- Type consistency: OfflineOperationType, OfflineMutationInput.localEntity, createOfflineClass, renameOfflineClass, hasPendingClassMutations, ClassOperationPersistence, and requireOnlineOnly are defined before later tasks consume them.
- Scope: no new dependency, parallel offline data model, password store, archive queue, or production-data repair behavior is introduced.

