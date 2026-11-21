# Offline Read Fallbacks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every authenticated classroom read use the durable offline snapshot when the network request fails, including valid empty lists and not-started quiz state, even when navigator.onLine incorrectly reports true.

**Architecture:** Keep loadOnlineFirst as the single server-first/read-cache fallback boundary. Add small repository predicates for determining whether a classroom or assignment snapshot exists, then make each query cache reader return its complete cached shape whenever that predicate proves the snapshot is valid. Mutations remain unchanged and continue to use their existing online-only and outbox rules.

**Tech Stack:** React, TanStack Query, TypeScript, Vitest, Deno tests, Vite/PWA build.

## Global Constraints

- Preserve existing offline auth, lease, storage, outbox, sync, and mutation behavior.
- Do not use navigator.onLine as proof that a server request is reachable; it only selects the explicit offline branch.
- A cached classroom or assignment with zero child rows is valid data and must not be rejected because its derived array is empty.
- Keep server errors visible when no relevant cached snapshot exists.
- Add regression tests before implementation for each affected query path.
- Run targeted Vitest tests after each task, then run npm run test:frontend, npm run typecheck, and npm run build from frontend before completion.
- The repository Deno lane currently has unrelated import-map and route-contract failures; record those failures without weakening or skipping the lane.

---

### Task 1: Add shared snapshot-validity predicates

**Files:**
- Modify: frontend/src/lib/offline/classroom/queries.ts
- Test: frontend/test/src/lib/offline/classroom/queries.test.ts

**Interfaces:**
- Produces hasOfflineClassroom(repository: OfflineRepository, classId?: string): Promise<boolean> for query cache readers that need to distinguish an empty classroom from no snapshot.
- Produces hasOfflineAssignment(repository: OfflineRepository, assignmentId: string): Promise<boolean> for assignment quiz cache validation.

- [ ] Step 1: Write failing Deno tests for the predicates

Add hasOfflineClassroom and hasOfflineAssignment to the existing named imports, then add this test using the repository's putSnapshot API:

    Deno.test('snapshot predicates recognize empty classrooms and cached assignments', async () => {
      const repository = createOfflineRepository(createMemoryStore());
      await repository.putSnapshot('classrooms', [{ id: 'class-1', name: 'Room' }]);
      await repository.putSnapshot('assignments', [{
        id: 'assignment-1',
        class_id: 'class-1',
        lesson_id: 'lesson-1',
      }]);

      assertEquals(await hasOfflineClassroom(repository, 'class-1'), true);
      assertEquals(await hasOfflineClassroom(repository, 'missing-class'), false);
      assertEquals(await hasOfflineAssignment(repository, 'assignment-1'), true);
      assertEquals(await hasOfflineAssignment(repository, 'missing-assignment'), false);
    });

- [ ] Step 2: Run the focused Deno test and verify it fails

Run from frontend:

    deno test --allow-read --allow-env --import-map=deno.json test/src/lib/offline/classroom/queries.test.ts

Expected: FAIL because hasOfflineClassroom and hasOfflineAssignment are not exported yet.

- [ ] Step 3: Implement the minimal predicates

Add these functions to queries.ts:

    export async function hasOfflineClassroom(repository: OfflineRepository, classId?: string): Promise<boolean> {
      const classrooms = await repository.readCollection('classrooms');
      return classId === undefined
        ? classrooms.length > 0
        : classrooms.some((classroom) => String(classroom.id) === classId);
    }

    export async function hasOfflineAssignment(repository: OfflineRepository, assignmentId: string): Promise<boolean> {
      const assignments = await repository.readCollection('assignments');
      return assignments.some((assignment) => String(assignment.id) === assignmentId);
    }

- [ ] Step 4: Run the focused Deno test and verify it passes

Run the same command. Expected: PASS, with the existing queries tests still passing.

- [ ] Step 5: Commit the shared predicate change

    git add frontend/src/lib/offline/classroom/queries.ts frontend/test/src/lib/offline/classroom/queries.test.ts
    git commit -m "test(offline): recognize empty cached snapshots"
    git push origin master

### Task 2: Make dashboard and post reads accept valid empty snapshots

**Files:**
- Modify: frontend/src/features/dashboard/api/hooks.ts
- Create: frontend/src/features/dashboard/api/hooks.test.tsx
- Modify: frontend/src/features/posts/api/hooks.ts
- Create: frontend/src/features/posts/api/hooks.test.tsx

**Interfaces:**
- Consumes hasOfflineClassroom from the offline classroom query helpers.
- Keeps the existing StudentDashboard, TeacherDashboard, and ClassPost[] query result shapes unchanged.

- [ ] Step 1: Write failing dashboard and posts hook tests

Create Vitest hook tests that set navigator.onLine to true, provide a cached classroom with no attempts/posts, reject the server calls with new TypeError('Failed to fetch'), and assert successful zero-valued results:

    it('uses a cached student classroom when the dashboard has no attempts and the fetch fails', async () => {
      mocks.studentDashboard.mockRejectedValue(new TypeError('Failed to fetch'));
      const { result } = renderHook(() => useStudentDashboard(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({ completedLessons: 0, streakDays: 0, recentAttempts: [] });
    });

    it('uses an empty cached post list when the classroom exists and the fetch fails', async () => {
      mocks.posts.mockRejectedValue(new TypeError('Failed to fetch'));
      const { result } = renderHook(() => useClassPosts('class-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({ posts: [] });
    });

The test harness must mock useAuth, useOfflineClassroom, api.dashboard.student, and api.posts.list, use a QueryClient with retry: false, and restore the original navigator.onLine value in afterEach.

- [ ] Step 2: Run the new focused Vitest tests and verify they fail

Run from frontend:

    npm run test:frontend -- src/features/dashboard/api/hooks.test.tsx src/features/posts/api/hooks.test.tsx

Expected: FAIL because the cache readers currently return null for empty attempts/posts while navigator.onLine is true.

- [ ] Step 3: Update the dashboard cache readers

Import hasOfflineClassroom and change the student cache reader to use the classroom snapshot as the validity signal:

    const attempts = await repository.readCollection('attempts');
    const hasClassroom = await hasOfflineClassroom(repository);
    if (!attempts.length && !hasClassroom && !browserIsOffline()) return null;
    return buildOfflineStudentDashboard(attempts);

Keep the teacher dashboard classroom-based check, because a cached teacher classroom already makes an empty attempts/students aggregate valid.

- [ ] Step 4: Update the post cache reader

Import hasOfflineClassroom and replace the post-count check with a class-snapshot check:

    const posts = await readOfflinePosts(repository, classId);
    const hasClassroom = await hasOfflineClassroom(repository, classId);
    if (!posts.length && !hasClassroom && !browserIsOffline()) return null;
    return { posts };

- [ ] Step 5: Run the focused Vitest tests and verify they pass

Run the same focused command. Expected: PASS for both new suites.

- [ ] Step 6: Commit and push the dashboard/post change

    git add frontend/src/features/dashboard/api/hooks.ts frontend/src/features/dashboard/api/hooks.test.tsx frontend/src/features/posts/api/hooks.ts frontend/src/features/posts/api/hooks.test.tsx
    git commit -m "fix(offline): serve empty dashboard and post snapshots"
    git push origin master

### Task 3: Standardize classroom read hooks on server-first/cache-fallback behavior

**Files:**
- Modify: frontend/src/features/classroom/api/hooks.ts
- Modify: frontend/src/features/classroom/api/hooks.test.tsx

**Interfaces:**
- Consumes loadOnlineFirst, hasOfflineClassroom, and existing readOfflineClassroom/readOfflineRoster helpers.
- Keeps existing query keys and result shapes used by teacher and student pages.

- [ ] Step 1: Add failing tests for student class reads with a false online signal

Extend the existing classroom hook suite with these cases:

    it('uses the cached student classroom when the class-list fetch fails', async () => {
      mocks.useAuth.mockReturnValue({
        user: { id: 'student-1', role: 'student', full_name: 'Student' },
        isLoading: false,
      });
      const { result } = renderHook(() => useStudentClassroom(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.classroom).toEqual(expect.objectContaining({ id: 'class-1' }));
    });

    it('uses the cached student class list when the class-list fetch fails', async () => {
      mocks.useAuth.mockReturnValue({
        user: { id: 'student-1', role: 'student', full_name: 'Student' },
        isLoading: false,
      });
      const { result } = renderHook(() => useClasses(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.classes).toEqual([expect.objectContaining({ id: 'class-1' })]);
    });

Use a cached student-shaped classroom row and keep navigator.onLine set to true so the test proves the network failure is caught rather than relying on the browser offline branch.

- [ ] Step 2: Run the focused classroom tests and verify they fail

    npm run test:frontend -- src/features/classroom/api/hooks.test.tsx

Expected: the new student tests fail with the server Failed to fetch error.

- [ ] Step 3: Route student class-list and selected-class reads through loadOnlineFirst

For useClasses, build the cached legacy response and use it as readCache for the student role:

    const cached = await readOfflineClassroom(repository, user.role);
    return loadOnlineFirst({
      isOffline: browserIsOffline(),
      readCache: async () => cached ? toLegacyClassesResponse({ classroom: cached }) : null,
      readServer: async () => {
        const data = await api.classes.list();
        return toLegacyClassesResponse({ classroom: data.classroom ?? null });
      },
    });

For useStudentClassroom, use the same server-first boundary and return { classroom: cached } when the server rejects and a student classroom exists. Preserve the existing offline empty response only when browserIsOffline() is true and no cached classroom exists.

- [ ] Step 4: Refactor roster reads to use loadOnlineFirst without changing valid-empty behavior

Use readCache that returns the cached roster when the selected classroom exists, including { students: [] }; when the browser is online and the classroom is absent, return null so a real server error remains visible. The teacher roster path must retain the current empty-roster regression test.

- [ ] Step 5: Run the focused classroom tests and typecheck

    npm run test:frontend -- src/features/classroom/api/hooks.test.tsx
    npm run typecheck

Expected: all classroom hook tests pass and TypeScript exits 0.

- [ ] Step 6: Commit and push the classroom read standardization

    git add frontend/src/features/classroom/api/hooks.ts frontend/src/features/classroom/api/hooks.test.tsx
    git commit -m "fix(offline): use cached student classroom reads"
    git push origin master

### Task 4: Preserve not-started assignment quizzes from the offline snapshot

**Files:**
- Modify: frontend/src/features/assignments/api/hooks.ts
- Modify: frontend/src/features/assignments/api/hooks.test.tsx

**Interfaces:**
- Consumes hasOfflineAssignment from the offline classroom query helpers.
- Keeps AssignmentQuizState unchanged; a cached assignment with no attempt returns status not_started and attemptId null.

- [ ] Step 1: Write the failing quiz fallback test

Add a mocked api.assignmentQuiz.get and render useAssignmentQuiz('assignment-1', 'lesson-1') with a cached assignment row but no attempt row:

    it('uses cached not-started quiz state when the server fetch fails', async () => {
      mocks.assignmentQuiz.mockRejectedValue(new TypeError('Failed to fetch'));
      const { result } = renderHook(() => useAssignmentQuiz('assignment-1', 'lesson-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.state).toEqual(expect.objectContaining({
        assignmentId: 'assignment-1',
        lessonId: 'lesson-1',
        status: 'not_started',
        attemptId: null,
      }));
    });

- [ ] Step 2: Run the assignment hook tests and verify the new test fails

    npm run test:frontend -- src/features/assignments/api/hooks.test.tsx

Expected: FAIL because the current cache reader only accepts a non-null attempt or an explicitly offline browser.

- [ ] Step 3: Make cached assignment existence validate the quiz state

Change the cache reader to return the locally derived state when an assignment row exists:

    const state = await readOfflineAssignmentQuiz(repository, user.id, assignmentId!, lessonId!);
    const hasAssignment = await hasOfflineAssignment(repository, assignmentId!);
    return state.attemptId || hasAssignment || browserIsOffline() ? { state } : null;

- [ ] Step 4: Run the focused assignment tests and typecheck

    npm run test:frontend -- src/features/assignments/api/hooks.test.tsx
    npm run typecheck

Expected: all assignment hook tests pass and TypeScript exits 0.

- [ ] Step 5: Commit and push the quiz fallback change

    git add frontend/src/features/assignments/api/hooks.ts frontend/src/features/assignments/api/hooks.test.tsx
    git commit -m "fix(offline): preserve cached not-started quizzes"
    git push origin master

### Task 5: Run the complete local gates and record baseline failures

**Files:**
- No production file changes.
- Verify: frontend/src/features/**, frontend/test/**, .github/workflows/ci.yml.

- [ ] Step 1: Run the complete frontend Vitest lane

    npm run test:frontend

Expected: PASS with the new dashboard, posts, classroom, and assignment fallback tests included.

- [ ] Step 2: Run typecheck and production build

    npm run typecheck
    npm run build

Expected: both commands exit 0; existing bundle-size and dynamic-import warnings may remain informational.

- [ ] Step 3: Run the repository Deno lane without altering it

    npm test

Expected: preserve the current unrelated failures if they remain: Deno import-map errors for @infrastructure/api/classroom and @infrastructure/offline/mediaManifest, plus stale route-contract assertions in teacher/student page tests. Report the exact count and first failing commands.

- [ ] Step 4: Verify the pushed branch state

    git diff --check
    git status --short --branch
    git log -1 --oneline
    git ls-remote origin refs/heads/master

Expected: no whitespace errors, a clean master worktree tracking origin/master, and the remote hash matching the final local commit.

- [ ] Step 5: Commit the plan before implementation if it is not already included in a task commit

    git add docs/superpowers/plans/2026-11-21-offline-read-fallbacks.md
    git commit -m "docs(plan): define offline read fallback audit"
    git push origin master

