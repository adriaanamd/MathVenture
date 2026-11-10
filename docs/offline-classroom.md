# Offline classroom operation

MathVenture classroom work is offline-first after the device has been provisioned once.

## One-time online setup

1. Complete the first online login with the teacher account.
2. Open the teacher class list and wait for the offline classroom pack to finish downloading.
3. Confirm that each downloaded class, its roster, assignments, lesson catalog, and recent progress are visible before leaving coverage.

The device stores a salted password verifier, never the raw password. The first online login, account creation, first classroom provisioning, password reset, and password change require a network connection. A successful online validation starts a sliding seven-day offline lease. The lease renews after a successful bootstrap or sync; a reload or force-reload never renews it.

## Working without internet

After setup, reload the installed PWA and use the cached teacher login. Teachers can view and switch among downloaded classes, switch to a cached student account within the selected class, create and rename classes, assign quizzes, edit or remove assignments, add or remove roster entries, publish classroom posts, and view cached dashboards/reports. Archiving and unarchiving classes, teacher account changes, registration, and initial login remain online-only; the app tells the user to **check internet connection as this is online-only** when one of those actions is attempted offline. Students retain the single-class flow: they do not select, rename, archive, or switch classes. Students can open assigned lessons, start quizzes, save every checkpoint, complete quizzes, and submit standalone attempts.

Every local write is saved immediately to the active durable adapter—SQLite when available, or the existing IndexedDB classroom adapter when SQLite cannot be opened—and placed in a durable outbox. In the web app, SQLite WASM uses OPFS behind a worker boundary; in the Windows Tauri app, the same repository uses native SQLite in the app configuration directory. After an online login or restored connection, dependency-ordered pending work syncs automatically; the status indicator distinguishes Offline, Syncing, Online, Needs sign-in, and Sync error. Pending work is not described as reaching Supabase until it is acknowledged.

## Returning online

When coverage returns, MathVenture syncs dependency-ordered operations automatically. Use **Sync now** to retry manually. Use **Refresh classroom pack** while online to download an updated server snapshot; pending local work is preserved during refresh. Rejected operations remain available in the conflict/recovery panel. Server duplicates are safe to retry, stale mutable edits become explicit conflicts, and roster provisioning returns canonical server IDs for local rows.

## Storage and recovery

On the web, classroom application data prefers the `mathventure-app` SQLite database in OPFS. If the browser declines persistent-storage protection, SQLite can still be durable; the UI labels this as **ready; browser-managed retention**. If OPFS or cross-origin isolation is unavailable, the browser uses the existing durable IndexedDB classroom adapter and labels storage as best effort instead of blocking the app; it never falls back to volatile memory. Free Play media metadata remains in its separate IndexedDB database and media bytes remain in Cache Storage; that media cache is not the classroom database. On Windows Tauri, classroom SQLite and the packaged Free Play media are native/app-bundle resources, so the service worker and browser media cache are not used for that path. Authenticated Free Play progress and sessions are application data and sync through the active local storage adapter, while public guest Free Play remains local. Clearing browser storage removes the local classroom copy and pending work, so export diagnostics or sync before clearing storage. Diagnostics exclude passwords and password verifiers.

## Windows Tauri runtime

The supported desktop target for this phase is Windows. Run `npm run tauri:dev`
for development or `npm run tauri:build -- --debug` for a debug bundle after
installing Node.js, Rust/MSVC build tools, and WebView2. Tauri applies the
canonical TypeScript SQLite migrations through a Rust-managed transaction
bridge. An interrupted native transaction is rolled back before the next
startup; entity writes and their outbox rows therefore remain atomic.

Student accounts in this app are teacher-provisioned classroom profiles. Creating accounts, changing or resetting a teacher password, and the first device provisioning remain online-only.

## Maintainer verification

Run the same blocking lanes used by CI from the repository root:

```powershell
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run tauri:build -- --debug
```
