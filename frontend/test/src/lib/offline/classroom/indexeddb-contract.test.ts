import { assertEquals } from 'jsr:@std/assert';
import {
  createIndexedDbStore,
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
} from '../../../../../src/lib/offline/classroom/store.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createOfflineClass, renameOfflineClass } from '../../../../../src/lib/offline/classroom/mutations.ts';

Deno.test('IndexedDB adapter exposes the classroom database contract', () => {
  assertEquals(OFFLINE_DB_NAME, 'mathventure-classroom');
  assertEquals(OFFLINE_DB_VERSION, 2);
  assertEquals(typeof createIndexedDbStore().get, 'function');
});

Deno.test('IndexedDB upgrade adds stores missing from an existing version-one classroom database', async () => {
  const root = globalThis as typeof globalThis & { indexedDB?: unknown };
  const previousIndexedDb = root.indexedDB;
  const requestedVersions: number[] = [];
  const stores = new Set([
    'profiles',
    'classrooms',
    'classStudents',
    'assignments',
    'attempts',
    'attemptGameResults',
    'posts',
    'outbox',
    'conflicts',
    'meta',
  ]);
  const database = {
    objectStoreNames: { contains: (name: string) => stores.has(name) },
    createObjectStore: (name: string) => { stores.add(name); },
    transaction: (name: string, _mode: string) => {
      if (!stores.has(name)) throw new DOMException(`Missing object store: ${name}`, 'NotFoundError');
      let complete: (() => void) | null = null;
      const transaction = {
        objectStore: () => ({
          getAll: () => {
            const request = { result: [], error: null, onsuccess: null as (() => void) | null, onerror: null };
            queueMicrotask(() => request.onsuccess?.());
            return request;
          },
        }),
        error: null,
        oncomplete: null as (() => void) | null,
        onerror: null,
        onabort: null,
      };
      Object.defineProperty(transaction, 'oncomplete', {
        get: () => complete,
        set: (handler: () => void) => {
          complete = handler;
          queueMicrotask(() => complete?.());
        },
      });
      return transaction;
    },
    close: () => undefined,
  };
  const fakeIndexedDb = {
    open: (_name: string, version: number) => {
      requestedVersions.push(version);
      let upgrade: (() => void) | null = null;
      let success: (() => void) | null = null;
      const request = { result: database, error: null } as Record<string, unknown>;
      Object.defineProperty(request, 'onupgradeneeded', {
        set: (handler: () => void) => { upgrade = handler; },
      });
      Object.defineProperty(request, 'onsuccess', {
        set: (handler: () => void) => {
          success = handler;
          if (version > 1) upgrade?.();
          queueMicrotask(() => success?.());
        },
      });
      Object.defineProperty(request, 'onerror', { set: () => undefined });
      Object.defineProperty(request, 'onblocked', { set: () => undefined });
      return request;
    },
  };

  root.indexedDB = fakeIndexedDb;
  try {
    await createIndexedDbStore('stale-classroom').getAll('freePlaySessions');
  } finally {
    if (previousIndexedDb === undefined) delete root.indexedDB;
    else root.indexedDB = previousIndexedDb;
  }

  assertEquals(requestedVersions, [2]);
  assertEquals(stores.has('freePlaySessions'), true);
  assertEquals(stores.has('freePlayProgress'), true);
});

Deno.test('IndexedDB transactions include every requested classroom store', async () => {
  const transactions: { stores: string | string[]; mode: string }[] = [];
  const records = new Map<string, Map<string, Record<string, unknown>>>();
  const root = globalThis as typeof globalThis & { indexedDB?: unknown };
  const previousIndexedDb = root.indexedDB;
  const request = (result: unknown, apply?: () => void) => {
    let success: (() => void) | null = null;
    const pending = { result, error: null } as Record<string, unknown>;
    Object.defineProperty(pending, 'onsuccess', {
      set(handler: () => void) {
        success = handler;
        queueMicrotask(() => {
          apply?.();
          success?.();
        });
      },
    });
    Object.defineProperty(pending, 'onerror', { set: () => undefined });
    return pending;
  };
  const fakeDatabase = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => undefined,
    transaction(stores: string | string[], mode: string) {
      transactions.push({ stores, mode });
      let complete: (() => void) | null = null;
      let pendingRequests = 0;
      const transaction = {
        objectStore: (name: string) => {
          const recordsForStore = records.get(name) ?? new Map<string, Record<string, unknown>>();
          records.set(name, recordsForStore);
          return {
            get: (key: string) => {
              pendingRequests += 1;
              return request(recordsForStore.get(key), () => { pendingRequests -= 1; });
            },
            getAll: () => {
              pendingRequests += 1;
              return request(Array.from(recordsForStore.values()), () => { pendingRequests -= 1; });
            },
            put: (record: Record<string, unknown>) => {
              pendingRequests += 1;
              return request(undefined, () => {
                recordsForStore.set(String(record.key), record);
                pendingRequests -= 1;
              });
            },
            delete: (key: string) => {
              pendingRequests += 1;
              return request(undefined, () => {
                recordsForStore.delete(key);
                pendingRequests -= 1;
              });
            },
          };
        },
        error: null,
        onerror: null,
        onabort: null,
      } as Record<string, unknown>;
      Object.defineProperty(transaction, 'oncomplete', {
        set(handler: () => void) {
          complete = handler;
          if (pendingRequests === 0) queueMicrotask(() => complete?.());
        },
      });
      return transaction;
    },
    close: () => undefined,
  };
  const fakeIndexedDb = {
    open: () => {
      let upgrade: (() => void) | null = null;
      let success: (() => void) | null = null;
      const request = {
        result: fakeDatabase,
        error: null,
      } as Record<string, unknown>;
      Object.defineProperty(request, 'onupgradeneeded', {
        set(handler: () => void) { upgrade = handler; },
      });
      Object.defineProperty(request, 'onsuccess', {
        set(handler: () => void) {
          success = handler;
          upgrade?.();
          queueMicrotask(() => success?.());
        },
      });
      Object.defineProperty(request, 'onerror', { set: () => undefined });
      Object.defineProperty(request, 'onblocked', { set: () => undefined });
      return request;
    },
  };

  root.indexedDB = fakeIndexedDb;
  try {
    await createIndexedDbStore('transaction-contract').transaction(['assignments', 'outbox'], async (transactionStore) => {
      await transactionStore.put('assignments', { key: 'assignment-1', value: { id: 'assignment-1' } });
      await transactionStore.put('outbox', { key: 'operation-1', value: { operationId: 'operation-1' } });
    });

    const repository = createOfflineRepository(
      createIndexedDbStore('transaction-contract'),
      () => '2026-11-10T00:00:00.000Z',
      (() => {
        let next = 0;
        return () => `class-operation-${++next}`;
      })(),
    );
    await createOfflineClass(repository, 'teacher-1', 'Year 5', () => 'class-local-1');
    await renameOfflineClass(repository, 'teacher-1', 'class-local-1', 'Year 5 - Blue');
  } finally {
    if (previousIndexedDb === undefined) delete root.indexedDB;
    else root.indexedDB = previousIndexedDb;
  }

  assertEquals(transactions[0], { stores: ['assignments', 'outbox'], mode: 'readwrite' });
  assertEquals(records.get('assignments')?.get('assignment-1')?.value, { id: 'assignment-1' });
  assertEquals((records.get('classrooms')?.get('class-local-1')?.value as { name?: string } | undefined)?.name, 'Year 5 - Blue');
  assertEquals(
    Array.from(records.get('outbox')?.values() ?? []).map((record) => (record.value as { operationId?: string }).operationId).sort(),
    ['class-operation-1', 'class-operation-2', 'operation-1'],
  );
});
