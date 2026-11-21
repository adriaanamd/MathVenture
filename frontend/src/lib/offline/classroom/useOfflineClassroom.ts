import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { createContext, createElement, useContext, useEffect, useMemo, useReducer, useRef, useCallback, useState, type ReactNode } from 'react';
import { createOfflineRepository, type OfflineRepository } from './repository.ts';
import { bootstrapRepository, downloadClassroomPack } from './bootstrap.ts';
import { syncOfflineClassroom } from './index.ts';
import type { SyncProgress } from './sync.ts';
import { offlineStatusReducer, type OfflineLifecycleState } from './status.ts';
import type { BootstrapInvoker } from './bootstrap.ts';
import { getOrCreateDeviceId } from './crypto.ts';
import { getApplicationStorage, resetApplicationDatabaseForTests, type ApplicationStorage } from '../sqlite/runtime.ts';

const initialState: OfflineLifecycleState = {
  status: typeof navigator !== 'undefined' && (navigator as Navigator & { onLine?: boolean }).onLine === false ? 'offline' : 'online',
  pendingCount: 0,
  failedCount: 0,
  lastSyncedAt: null,
  error: null,
  leaseExpiresAt: null,
  storage: 'unknown',
};

type OfflineClassroomContextValue = OfflineLifecycleState & {
  repository: OfflineRepository;
  bootstrapNow: () => Promise<void>;
  syncNow: () => Promise<SyncProgress | null>;
};

const OfflineClassroomContext = createContext<OfflineClassroomContextValue | null>(null);
const AUTO_SYNC_INTERVAL_MS = 5000;

export function OfflineClassroomProvider({ children, repository, invoke, teacherId = null }: {
  children: ReactNode;
  repository?: OfflineRepository;
  invoke?: BootstrapInvoker;
  teacherId?: string | null;
}) {
  const [state, dispatch] = useReducer(offlineStatusReducer, initialState);
  const [applicationStorage, setApplicationStorage] = useState<ApplicationStorage | null>(null);
  const [storageError, setStorageError] = useState<Error | null>(null);
  const syncInFlight = useRef<Promise<SyncProgress | null> | null>(null);
  const resolvedRepository = useMemo(() => {
    if (repository) return repository;
    if (!applicationStorage) return null;
    const storage = typeof window === 'undefined' ? undefined : window.localStorage;
    const deviceId = storage ? getOrCreateDeviceId(storage) : 'local-device';
    return createOfflineRepository(applicationStorage, undefined, undefined, deviceId);
  }, [applicationStorage, repository]);
  useEffect(() => {
    if (repository) return;
    let active = true;
    void getApplicationStorage()
      .then(async (opened) => {
        const health = 'health' in opened ? await opened.health() : null;
        if (active) {
          dispatch({ type: 'storage-health', storage: health?.quality === 'best-effort' || !health ? 'best-effort' : 'healthy' });
          setApplicationStorage(opened);
        }
      })
      .catch((error: unknown) => {
        if (active) setStorageError(error instanceof Error ? error : new Error('Durable offline storage is unavailable.'));
      });
    return () => { active = false; };
  }, [repository]);
  useEffect(() => {
    if (repository || !applicationStorage || !('close' in applicationStorage)) return;
    return () => {
      void applicationStorage.close().finally(() => resetApplicationDatabaseForTests());
    };
  }, [applicationStorage, repository]);
  const syncNow = useCallback(async (): Promise<SyncProgress | null> => {
    if (!resolvedRepository) return null;
    if (syncInFlight.current) return syncInFlight.current;

    const activeRepository = resolvedRepository;
    const run = (async () => {
      dispatch({ type: 'sync-start' });
      try {
        const request = invoke ?? (async (name, options) => {
          const { invokeFunction } = await import('../../api/client.ts');
          return invokeFunction<unknown>(name, options);
        });
        const progress = await syncOfflineClassroom(activeRepository, request);
        const summary = await activeRepository.getSyncSummary();
        dispatch({ type: 'sync-success', pendingCount: summary.pendingCount, failedCount: summary.failedCount, lastSyncedAt: new Date().toISOString() });
        const leaseExpiresAt = await activeRepository.readMeta('offlineAccessUntil');
        if (typeof leaseExpiresAt === 'string') dispatch({ type: 'lease-update', leaseExpiresAt });
        return progress;
      } catch (error) {
        const summary = await activeRepository.getSyncSummary();
        dispatch({ type: 'sync-error', pendingCount: summary.pendingCount, failedCount: summary.failedCount, error: error instanceof Error ? error.message : 'Sync failed.' });
        return { completed: 0, remaining: summary.pendingCount, failed: summary.failedCount };
      }
    })();

    syncInFlight.current = run;
    try {
      return await run;
    } finally {
      if (syncInFlight.current === run) syncInFlight.current = null;
    }
  }, [invoke, resolvedRepository]);
  const bootstrapNow = useCallback(async () => {
    if (!resolvedRepository) return;
    const activeRepository = resolvedRepository;
    if (typeof navigator !== 'undefined' && (navigator as Navigator & { onLine?: boolean }).onLine === false) {
      throw new Error('An internet connection is required to refresh the classroom pack.');
    }
    const request = invoke ?? (async (name, options) => {
      const { invokeTeacherFunction } = await import('../../api/client.ts');
      return invokeTeacherFunction<unknown>(name, options);
    });
    await bootstrapRepository(activeRepository, () => downloadClassroomPack(request));
    const summary = await activeRepository.getSyncSummary();
    dispatch({ type: 'sync-success', pendingCount: summary.pendingCount, failedCount: summary.failedCount, lastSyncedAt: new Date().toISOString() });
    const leaseExpiresAt = await activeRepository.readMeta('offlineAccessUntil');
    if (typeof leaseExpiresAt === 'string') dispatch({ type: 'lease-update', leaseExpiresAt });
  }, [invoke, resolvedRepository]);
  useEffect(() => {
    if (!resolvedRepository || !teacherId || (typeof navigator !== 'undefined' && (navigator as Navigator & { onLine?: boolean }).onLine === false)) return;
    void bootstrapNow().catch((error: unknown) => {
      console.warn('Automatic offline classroom refresh skipped', error);
    }).finally(() => {
      void syncNow();
    });
  }, [bootstrapNow, resolvedRepository, syncNow, teacherId]);
  useEffect(() => {
    if (!resolvedRepository) return;
    const activeRepository = resolvedRepository;
    const onOnline = () => {
      dispatch({ type: 'network-online' });
      void bootstrapNow()
        .catch((error: unknown) => console.warn('Automatic offline classroom refresh skipped', error))
        .finally(() => { void syncNow(); });
    };
    const onOffline = () => dispatch({ type: 'network-offline' });
    addEventListener('online', onOnline);
    addEventListener('offline', onOffline);
    void activeRepository.getSyncSummary().then((summary) => dispatch({ type: 'counts', ...summary }));
    void activeRepository.readMeta('offlineAccessUntil').then((value) => {
      if (typeof value === 'string') dispatch({ type: 'lease-update', leaseExpiresAt: value });
    });
    return () => {
      removeEventListener('online', onOnline);
      removeEventListener('offline', onOffline);
    };
  }, [bootstrapNow, resolvedRepository, syncNow]);
  useEffect(() => {
    if (!resolvedRepository || typeof window === 'undefined') return;
    const activeRepository = resolvedRepository;
    const retryPendingSync = () => {
      if (typeof navigator !== 'undefined' && (navigator as Navigator & { onLine?: boolean }).onLine === false) return;
      void activeRepository.getSyncSummary()
        .then((summary) => {
          if (summary.pendingCount > 0) void syncNow();
        })
        .catch(() => undefined);
    };
    const retryTimer = window.setInterval(retryPendingSync, AUTO_SYNC_INTERVAL_MS);
    return () => window.clearInterval(retryTimer);
  }, [resolvedRepository, syncNow]);
  if (!resolvedRepository) {
    if (!storageError) return createElement(AppLoadingScreen);
    return createElement(
      'div',
      { role: 'alert', className: 'min-h-[100dvh] bg-background p-6 text-center text-foreground' },
      `Offline storage could not be prepared. ${storageError.message}`,
    );
  }
  return createElement(OfflineClassroomContext.Provider, { value: { ...state, repository: resolvedRepository, bootstrapNow, syncNow } }, children);
}

export function useOfflineClassroom(): OfflineClassroomContextValue {
  const context = useContext(OfflineClassroomContext);
  if (!context) throw new Error('useOfflineClassroom must be used inside OfflineClassroomProvider.');
  return context;
}
