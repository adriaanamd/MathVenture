# Offline Student View and Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make offline student-account viewing survive reload and allow cached assigned quizzes to start, checkpoint, and complete locally while fixing the refresh transport crash.

**Architecture:** Keep the current teacher-enrolled offline session as the authority. Persist only the selected student profile in the existing durable classroom database, restore it beside the teacher session, and keep the existing student query/cache paths. Mark only transport-level sync failures as network-pending so quiz mutations remain local without hiding actual server rejection or conflict results.

**Tech Stack:** React, TanStack Query, TypeScript, Supabase Edge Function transport, SQLite/IndexedDB offline repository, Vitest, Deno, Vite/PWA.

## Global Constraints

- Preserve the existing teacher offline lease, password verifier, classroom snapshot, outbox, and server-conflict behavior.
- Do not add a separate student credential or allow first-time provisioning offline.
- A selected student must be restored only when the enrolled teacher session is valid and the stored profile has role student.
- A failed network batch must leave outbox operations pending; it must never delete them or mark them as a server conflict.
- A server retryable, rejected, or conflict response must continue to fail the mutation as it does today.
- Add each regression test before the corresponding production change and run the smallest relevant check after every edit.
- Run frontend Vitest, typecheck, build, and Deno tests before completion. Record any remaining stale route-contract failures without weakening tests.

---

### Task 1: Harden transport error parsing

**Files:**
- Modify: frontend/src/infrastructure/api/transport.ts
- Create: frontend/src/infrastructure/api/transport.test.ts

**Interfaces:**
- Keeps invokeFunction<T> return and rejection behavior unchanged except that non-callable error contexts no longer throw a secondary TypeError.
- Error extraction accepts a context whose json property is absent, non-callable, throwing, or Response-like.

- [ ] Step 1: Write the failing transport regression test

Create a Vitest test with a mocked Supabase client:

    import { describe, expect, it, vi } from 'vitest';

    const invoke = vi.fn();

    vi.mock('@/lib/supabase/client', () => ({
      supabase: { functions: { invoke } },
    }));

    import { invokeFunction } from './transport';

    describe('invokeFunction error handling', () => {
      it('uses the original error message when context.json is not callable', async () => {
        invoke.mockResolvedValueOnce({
          data: null,
          error: { message: 'Network request failed', context: { status: 0 } },
        });

        await expect(invokeFunction('offline-bootstrap')).rejects.toThrow('Network request failed');
      });
    });

- [ ] Step 2: Run the focused test and verify it fails with the reported TypeError

    npm run test:frontend -- src/infrastructure/api/transport.test.ts

Expected: FAIL with context.json is not a function.

- [ ] Step 3: Guard the context parser

Replace the unconditional context truthiness check with a callable check:

    const context = (error as { context?: unknown }).context;
    const contextJson = context && typeof (context as { json?: unknown }).json === 'function'
      ? (context as { json: () => Promise<{ error?: string }> }).json()
      : Promise.resolve(undefined);
    const message = await contextJson
      .then((payload) => payload?.error)
      .catch(() => undefined);

Use error.message when contextJson yields no server error string.

- [ ] Step 4: Run the focused test and the transport-adjacent frontend tests

    npm run test:frontend -- src/infrastructure/api/transport.test.ts src/lib/api/client.test.ts

Expected: all selected tests pass.

- [ ] Step 5: Commit and push

    git add frontend/src/infrastructure/api/transport.ts frontend/src/infrastructure/api/transport.test.ts
    git commit -m "fix(api): guard non-response error contexts"
    git push origin master

### Task 2: Persist and restore offline student-view selection

**Files:**
- Modify: frontend/src/lib/auth/auth.ts
- Modify: frontend/src/features/auth/session/service.ts
- Modify: frontend/src/features/auth/provider.tsx
- Modify: frontend/src/features/auth/session/service.test.ts
- Modify: frontend/test/src/lib/auth/offline-unlock.test.ts
- Modify: frontend/deno.json

**Interfaces:**
- Add readOfflineViewingStudent(store?: OfflineStorage): Promise<UserProfile | null>.
- Add persistOfflineViewingStudent(profile: UserProfile | null, store?: OfflineStorage): Promise<void>.
- Add readOfflineViewingStudent to AuthSessionDependencies.
- Offline loadAuthSession restores a valid stored student profile and sets useStudentAuthClient accordingly.

- [ ] Step 1: Add the failing session-service test

Update the offline session test to provide readOfflineViewingStudent and expect the selected student to be restored:

    it('restores the selected student view during offline startup', async () => {
      const deps = dependencies({
        isOffline: true,
        readOfflineViewingStudent: vi.fn().mockResolvedValue(student),
      });

      await expect(loadAuthSession(deps)).resolves.toEqual({
        teacherUser: teacher,
        viewingStudent: student,
        useStudentAuthClient: true,
      });
    });

The dependency factory must provide readOfflineViewingStudent: vi.fn().mockResolvedValue(null) for other cases.

- [ ] Step 2: Run the focused session tests and verify the new test fails

    npm run test:frontend -- src/features/auth/session/service.test.ts

Expected: FAIL because offline loading currently always returns viewingStudent null.

- [ ] Step 3: Add durable student-view persistence

In auth.ts, add a profile parser that accepts only id, role student, and full_name. Implement readOfflineViewingStudent by reading local_sessions.viewing_student_json for SQLite or the offlineViewingStudent metadata key for the legacy adapter. Implement persistOfflineViewingStudent by updating the active SQLite local_sessions row or writing/deleting the legacy metadata key.

Call persistOfflineViewingStudent after both online and offline viewStudentAccount succeeds. Clear it when offlineSignIn, offlineSignOut, returnToTeacherAccount, or signOut clears the active view. Persistence failures during account switching must be logged and must not prevent the already-resolved student profile from opening.

- [ ] Step 4: Restore the selected student in offline loadAuthSession

Change AuthSessionDependencies to include readOfflineViewingStudent. In the isOffline branch, load restoreOfflineSession and readOfflineViewingStudent together, ignore a missing/invalid selected profile, and return:

    {
      teacherUser: offlineSession,
      viewingStudent: offlineSession && selectedStudent?.role === 'student' ? selectedStudent : null,
      useStudentAuthClient: offlineSession !== null && selectedStudent?.role === 'student',
    }

Pass readOfflineViewingStudent from AuthProvider and keep the existing online path unchanged.

- [ ] Step 5: Add durable persistence regression coverage

Extend offline-unlock.test.ts with a SQLite scenario that writes an enrolled teacher, persists student-1 as the selected student, recreates/reads the database, and verifies readOfflineViewingStudent returns student-1. Then clear the selection and assert it returns null.

Add the missing Deno path aliases to frontend/deno.json so the existing auth tests can load the same source imports:

    {
      "imports": {
        "@/": "./src/",
        "@app/": "./src/app/",
        "@content/": "./src/content/",
        "@features/": "./src/features/",
        "@infrastructure/": "./src/infrastructure/",
        "@shared/": "./src/shared/"
      }
    }

- [ ] Step 6: Run the focused auth tests and typecheck

    npm run test:frontend -- src/features/auth/session/service.test.ts
    deno test --allow-read --allow-env --import-map=deno.json test/src/lib/auth/offline-unlock.test.ts test/src/lib/auth/offline-enrollment.test.ts
    npm run typecheck

Expected: selected student restoration and durable persistence pass; the import-map errors for these auth tests are gone.

- [ ] Step 7: Commit and push

    git add frontend/src/lib/auth/auth.ts frontend/src/features/auth/session/service.ts frontend/src/features/auth/provider.tsx frontend/src/features/auth/session/service.test.ts frontend/test/src/lib/auth/offline-unlock.test.ts frontend/deno.json
    git commit -m "fix(offline): restore selected student views"
    git push origin master

### Task 3: Keep classroom quiz mutations local during network loss

**Files:**
- Modify: frontend/src/lib/offline/classroom/sync.ts
- Modify: frontend/src/lib/offline/classroom/useOfflineClassroom.ts
- Modify: frontend/src/features/assignments/api/online.ts
- Modify: frontend/test/src/lib/offline/classroom/sync.test.ts
- Modify: frontend/test/src/features/assignments/api/online.test.ts

**Interfaces:**
- Extends SyncProgress with optional networkError?: boolean.
- A batch sender exception returns pending progress with networkError: true.
- waitForOnlineAssignmentSync accepts networkError progress and still rejects non-network pending progress.

- [ ] Step 1: Add failing sync and assignment-helper tests

Add this Deno sync test:

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

Add this Deno helper test:

    Deno.test('assignment mutations continue locally when sync reports a network error', async () => {
      const result = await waitForOnlineAssignmentSync(false, async () => ({
        completed: 0,
        remaining: 1,
        failed: 0,
        networkError: true,
      }));

      assertEquals(result?.networkError, true);
    });

- [ ] Step 2: Run focused Deno tests and verify the new tests fail

    deno test --allow-read --allow-env --import-map=deno.json test/src/lib/offline/classroom/sync.test.ts test/src/features/assignments/api/online.test.ts

Expected: FAIL because the progress type has no networkError and waitForOnlineAssignmentSync currently throws for every remaining operation.

- [ ] Step 3: Mark only sender exceptions as network errors

Add networkError?: boolean to SyncProgress. In syncOutbox's sendBatch catch, return the pending progress with networkError: true. Do not add the property to successful, retryable, rejected, or conflict results.

Update OfflineClassroomContext.syncNow and its refs to use SyncProgress so the marker reaches assignment hooks.

- [ ] Step 4: Allow assignment quiz local commits after a network failure

Add networkError?: boolean to AssignmentSyncProgress. In waitForOnlineAssignmentSync, return progress when progress.networkError is true; keep the existing not-acknowledged error for remaining/failed progress without that marker.

- [ ] Step 5: Run focused Deno tests and the assignment hook tests

    deno test --allow-read --allow-env --import-map=deno.json test/src/lib/offline/classroom/sync.test.ts test/src/features/assignments/api/online.test.ts
    npm run test:frontend -- src/features/assignments/api/hooks.test.tsx

Expected: all selected tests pass, and pending assignment quiz operations remain visible for later sync.

- [ ] Step 6: Commit and push

    git add frontend/src/lib/offline/classroom/sync.ts frontend/src/lib/offline/classroom/useOfflineClassroom.ts frontend/src/features/assignments/api/online.ts frontend/test/src/lib/offline/classroom/sync.test.ts frontend/test/src/features/assignments/api/online.test.ts
    git commit -m "fix(offline): keep quizzes local during network loss"
    git push origin master

### Task 4: Verify student entry and quiz flow end to end

**Files:**
- Verify: frontend/src/features/student/dashboard.tsx
- Verify: frontend/src/features/student/classroom.tsx
- Verify: frontend/src/pages/QuizPage.tsx
- Verify: frontend/src/features/assignments/api/hooks.ts
- Test: frontend/src/features/auth/session/service.test.ts
- Test: frontend/src/features/assignments/api/hooks.test.tsx

- [ ] Step 1: Add a focused student quiz mutation regression test

Extend the assignment hook test harness so syncNow resolves with networkError: true and useAssignmentQuiz/start mutation uses a cached student assignment. Assert startAssignmentQuiz.mutateAsync resolves with a local state instead of rejecting.

- [ ] Step 2: Run the focused student tests

    npm run test:frontend -- src/features/auth/session/service.test.ts src/features/assignments/api/hooks.test.tsx src/features/classroom/api/hooks.test.tsx

Expected: offline student session restoration and cached quiz reads/mutations pass.

- [ ] Step 3: Run complete frontend gates

    npm run test:frontend
    npm run typecheck
    npm run build

Expected: all frontend Vitest tests pass, typecheck exits 0, and build exits 0 with only existing bundle/import warnings.

- [ ] Step 4: Run the Deno lane and verify repository state

    npm test
    git diff --check
    git status --short --branch
    git log -1 --oneline
    git ls-remote origin refs/heads/master

Expected: import-map failures are resolved; report any unrelated stale route-contract failures exactly rather than changing them as part of this task.

