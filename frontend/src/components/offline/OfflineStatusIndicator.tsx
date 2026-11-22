import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';

function statusLabel(status: string): string {
  if (status === 'offline') return 'Offline';
  if (status === 'syncing') return 'Syncing';
  if (status === 'needs-auth') return 'Needs sign-in';
  if (status === 'error') return 'Sync error';
  return 'Online';
}

export function OfflineStatusIndicator() {
  const { status, pendingCount, failedCount, syncNow } = useOfflineClassroom();
  return (
    <div
      aria-live="polite"
      className="flex flex-col items-end justify-center gap-0.5 text-right text-[11px] leading-tight font-bold text-muted-foreground sm:flex-row sm:items-center sm:gap-2 sm:text-xs"
    >
      <span className="whitespace-nowrap">{statusLabel(status)}</span>
      {(pendingCount > 0 || failedCount > 0) && (
        <div className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 sm:gap-2">
          {pendingCount > 0 && <span className="whitespace-nowrap">{pendingCount} pending</span>}
          {failedCount > 0 && <span className="whitespace-nowrap">{failedCount} failed</span>}
          {status !== 'offline' && pendingCount > 0 && (
            <button type="button" onClick={() => void syncNow()} className="whitespace-nowrap underline underline-offset-2">
              Sync now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
