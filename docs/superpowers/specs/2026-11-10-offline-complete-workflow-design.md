# Complete Offline Workflow Design

**Date:** 2026-11-10  
**Status:** Approved for implementation planning

## Goal

Make MathVenture usable without internet after a successful online registration/login and initial local provisioning. All supported teaching and learning work must remain usable offline, with local writes synchronized to the cloud when connectivity returns or an online login completes.

The offline runtime must support both durable browser storage paths:

- SQLite is preferred: SQLite WASM backed by OPFS in the PWA and native SQLite in the Windows Tauri app.
- IndexedDB is the browser fallback when SQLite/OPFS is unavailable.

Both paths expose the same repository and outbox contracts. The application must not silently fall back to volatile memory.

## Product boundaries

The following actions require internet:

- Initial registration.
- Initial login when no valid offline session has been provisioned on the device.
- Teacher account changes, including password changes and password recovery.
- Class archiving.
- Class unarchiving.

Before an online-only action is attempted while offline, the UI must say exactly:

> Check internet connection as this is online-only

The following actions must work offline after local provisioning:

- Restoring a cached authenticated session and opening the installed app.
- Creating a class.
- Renaming a class.
- Viewing and switching among locally available teacher classes.
- Viewing cached rosters, assignments, posts, dashboards, and reports.
- Adding/removing roster entries and provisioning classroom student profiles through the outbox.
- Creating, editing, and deleting supported assignments.
- Publishing supported classroom posts.
- Opening assigned lessons and quizzes.
- Saving quiz checkpoints, completing quizzes, and recording attempts/progress.
- Switching to cached student accounts where the current classroom flow permits it.
- Authenticated Free Play and public guest Free Play, including local progress rules already supported by the application.

Public pages and packaged/cached application assets must continue to load from the installed PWA shell when offline.

## Existing architecture to preserve

The implementation extends the existing local-first classroom architecture rather than introducing a parallel offline mode.

The repository boundary remains the single interface used by classroom queries and mutations. Its storage adapter is selected at runtime:

1. Browser SQLite/OPFS when the runtime supports it.
2. Browser IndexedDB when SQLite/OPFS is unavailable.
3. Native SQLite for the Tauri desktop target.

The repository stores classroom entities, metadata, local identity mappings, pending operations, failed operations, and conflict information. Every local mutation and its outbox entry must be committed atomically by the selected durable adapter.

The existing PWA service worker and media caching remain responsible for application shell and media assets. They are not a substitute for classroom data storage.

## Authentication and startup flow

Registration and the first online login continue to use Supabase while connected. A successful online login provisions the protected offline session material and downloads the required classroom snapshot. Raw passwords must never be stored.

On a later launch:

- If online, the app may restore the normal Supabase session and refresh the classroom snapshot without discarding pending local writes.
- If offline and a valid cached offline session exists, the app unlocks the local classroom and exposes offline-capable routes.
- If offline and no valid cached session exists, the app stays at authentication and explains that the initial login requires internet.

When an online login succeeds after offline work, synchronization starts as soon as the authenticated session and repository are ready. Login must not overwrite pending local operations or replace optimistic local entities before those operations are processed.

Offline session expiration follows the existing lease/security policy. The UI must distinguish missing sign-in from ordinary storage or sync errors.

## Offline class lifecycle

Class creation and renaming are local-first operations.

### Class creation

Creating a class offline immediately creates a local class with a stable provisional ID, writes the corresponding outbox operation, and makes the class selectable throughout the offline teacher experience. The operation carries all required class fields and the teacher identity. When synchronized, the server returns the canonical class ID; dependent local rows and pending operations are remapped atomically.

The sync protocol must make retries safe. A duplicate submission for the same operation/device identity must not create a second server class.

### Class renaming

Renaming a class offline updates the local class immediately and queues a mutation that references the local/canonical class identity. If the class itself is still pending creation, the rename depends on class creation and is sent afterward. If the server rejects a stale or invalid rename, the operation remains visible in the conflict/recovery UI instead of being silently discarded.

### Archive and unarchive

Archive and unarchive remain online-only. They must not queue local mutations while offline. The guard should run before optimistic state changes or destructive UI transitions and must use the exact online-only message above.

## Synchronization

Synchronization is dependency-ordered and durable.

- Reconnect events trigger automatic sync when an authenticated online session is available.
- A successful online login triggers automatic sync immediately.
- The existing manual **Sync now** action remains available for retries.
- Class creation precedes dependent class renames, roster operations, assignments, posts, and progress writes.
- Pending work is preserved while a server classroom refresh/bootstrap occurs.
- Successful operations update local canonical IDs and clear only the acknowledged outbox rows.
- Retry-safe duplicates are accepted as already applied where the server can identify the same operation.
- Stale mutable edits and validation failures become explicit conflicts with recovery information.
- Sync status must accurately distinguish offline, syncing, online, missing sign-in, and sync-error states. Pending work must not be described as cloud-synchronized until acknowledged by the server.

After sync, local queries remain the source used to render the current device state. A refresh must merge the acknowledged server snapshot with still-pending local operations rather than replacing newer local edits.

## Online-only handling

The online-only policy must be centralized enough that all entry points enforce the same behavior. This includes teacher settings/account actions and class archive/unarchive controls.

The policy should check both network availability and the presence of the required online auth/session capability. An online-looking browser state is not sufficient if the request cannot authenticate or reach the server; failures should retain the existing actionable network/auth error behavior without creating a false local success.

The required offline message is:

`Check internet connection as this is online-only`

No online-only action may mutate the local durable repository before the guard passes.

## Error handling and recovery

- Storage initialization failure must be visible and must not silently downgrade to memory-only state.
- IndexedDB fallback must report its best-effort/browser-managed retention status where applicable, while continuing to protect writes through the durable adapter.
- Failed sync operations remain inspectable and retryable.
- Conflicts identify the affected class/entity and preserve enough local/server context for the existing recovery UI.
- Clearing browser storage remains a destructive local action: it may remove cached sessions, classroom data, and pending work. Existing diagnostics/export guidance remains applicable.

## Testing and verification

Tests must cover both the shared repository behavior and the user-visible policy:

- SQLite/OPFS and IndexedDB adapters satisfy the same class-create, class-rename, outbox, mapping, and restart contracts.
- Class creation works offline, survives reload/reopen, syncs once, and remaps provisional IDs.
- Offline class rename survives reload, depends on pending class creation when necessary, and syncs after reconnect/login.
- Archive/unarchive and teacher account changes do not queue offline and show the exact online-only message.
- Initial registration/initial login remain online-required, while a provisioned cached session can unlock offline.
- Online login after offline work starts sync without losing pending operations.
- Sync ordering, duplicate retry safety, conflict visibility, and server snapshot merge preserve local pending work.
- Public shell and required assets remain available offline through the PWA/Tauri packaging paths.
- Existing classroom, Free Play, auth, Supabase, and Tauri tests remain intact.

Manual verification should exercise at minimum: first online provisioning, force-close/reopen offline, class create and rename offline, each supported classroom mutation offline, cached student switching, offline quiz checkpoints and attempts, reconnect sync, online-login-triggered sync, an archive/unarchive attempt offline, and recovery from a rejected operation.

The completion gate is the repository's CI-equivalent frontend typecheck, frontend tests, frontend build, Supabase tests, Rust formatting/tests/clippy, and Windows Tauri build checks, with fresh output recorded before claiming completion.

## Out of scope

- Offline teacher password changes or password recovery.
- Offline class archive/unarchive.
- Replacing Supabase authentication or inventing a second password store.
- A separate offline-only UI/data model.
- Silent volatile-memory fallback when durable storage is unavailable.
- Automatic destructive reconciliation of already-misrouted or conflicting production records.
