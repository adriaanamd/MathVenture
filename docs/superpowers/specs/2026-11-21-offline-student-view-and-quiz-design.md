# Offline Student View and Quiz Design

## Problem

The offline classroom refresh and student-view action can fail with TypeError: context.json is not a function. The transport wrapper assumes every Supabase error context is a Response-like object. Separately, offline startup restores only the teacher session, so the selected student view is lost after reload. Assignment quiz mutations are stored locally, but a network failure reported while the browser still says online is surfaced as a quiz error instead of remaining pending for later sync.

## Goals

- Make API error parsing safe for Response-like and non-Response error contexts.
- Open an enrolled student account from the teacher roster while offline.
- Persist the selected student view in the durable classroom database and restore it after an offline reload.
- Let the student enter cached assignments and run start, checkpoint, and complete quiz mutations offline.
- Keep real server rejection and conflict behavior visible.
- Preserve existing teacher offline authentication and sync behavior.

## Non-goals

- Add a separate student credential or direct student login system.
- Make initial enrollment, teacher login, account creation, password reset, or teacher return-password verification offline.
- Change quiz content or game scoring.

## Design

The transport wrapper will inspect error.context before parsing it. It will call context.json only when it is a function and otherwise fall back to error.message or the generic request error.

The offline auth store will add a durable selected-student record alongside the existing active teacher session. Viewing a student will write that profile after the offline profile is found and after a successful online student switch. Returning to the teacher account, offline teacher sign-in, and sign-out will clear the record. Offline session loading will restore the teacher enrollment and selected student record, then expose the student as the active user and select the student auth client for data reads.

The outbox sync result will carry an optional networkError marker only when the batch sender itself fails. Assignment quiz mutation helpers will accept a networkError result as a successful local commit with pending sync, while continuing to reject a non-network pending/retryable or server-rejected result.

## Data flow

1. Teacher signs in online and the classroom pack stores teacher, student profiles, assignments, attempts, and game content.
2. Teacher selects View student account while online or offline.
3. The app stores the selected student profile in local_sessions/viewing-student metadata and navigates to /student.
4. On offline reload, auth restores the teacher enrollment plus the selected student profile.
5. Student queries read the classroom snapshot; quiz state reads attempts/assignments.
6. Quiz mutations update attempts and outbox locally, then attempt sync. Network failure leaves the operation pending.
7. A later online event or sync timer retries the outbox.

## Verification

- Vitest transport regression: a Supabase error with a non-callable context.json does not throw while extracting the error message.
- Vitest auth/session regression: offline loading restores the selected student and enables the student auth client.
- Deno repository/auth regression: selected student persistence survives repository recreation and clear operations remove it.
- Deno sync regression: a network batch failure returns pending progress with networkError and does not delete the outbox operation.
- Vitest assignment hook regression: quiz mutations resolve locally when sync reports networkError.
- Run the frontend Vitest suite, typecheck, build, and the repository Deno lane without weakening existing failures.

