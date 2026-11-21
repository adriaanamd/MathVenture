export type AssignmentPage<T> = {
  assignments: T[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type AssignmentSyncProgress = {
  completed: number;
  remaining: number;
  failed: number;
  networkError?: boolean;
};

export async function loadAssignmentsOnlineFirst<T>(input: {
  isOffline: boolean;
  readCache: () => Promise<AssignmentPage<T>>;
  readServer: () => Promise<AssignmentPage<T>>;
}): Promise<AssignmentPage<T>> {
  if (input.isOffline) return input.readCache();
  try {
    return await input.readServer();
  } catch (error) {
    const cached = await input.readCache();
    if (cached.assignments.length > 0) return cached;
    throw error;
  }
}

export async function waitForOnlineAssignmentSync(
  isOffline: boolean,
  syncNow: () => Promise<AssignmentSyncProgress | null>,
): Promise<AssignmentSyncProgress | null> {
  if (isOffline) return null;
  const progress = await syncNow();
  if (progress?.networkError) return progress;
  if (progress && (progress.remaining > 0 || progress.failed > 0)) {
    throw new Error('The assignment change was not acknowledged by the server yet.');
  }
  return progress;
}
