import type { OfflineOutboxOperation } from './types.ts';
import type { OfflineRepository } from './repository.ts';

export type OfflineSyncResult = {
  operationId: string;
  status: 'accepted' | 'applied' | 'duplicate' | 'rejected' | 'conflict' | 'retryable';
  error?: string;
  result?: unknown;
};

export type SyncProgress = {
  completed: number;
  remaining: number;
  failed: number;
  networkError?: boolean;
};

export type SyncBatchSender = (operations: OfflineOutboxOperation[]) => Promise<OfflineSyncResult[]>;

function dependenciesAreAcknowledged(
  operation: OfflineOutboxOperation,
  activeIds: Set<string>,
  failedIds: Set<string>,
): boolean {
  return operation.dependencies.every((dependency) => !activeIds.has(dependency) && !failedIds.has(dependency));
}

function actionableCount(operations: OfflineOutboxOperation[]): number {
  return operations.filter((operation) => operation.status !== 'failed').length;
}

function resultMappings(result: unknown): Array<{ entityType: string; localId: string; serverId: string }> {
  if (!result || typeof result !== 'object') return [];
  const mappings = (result as { mappings?: unknown }).mappings;
  if (!Array.isArray(mappings)) return [];
  return mappings.flatMap((value) => {
    if (!value || typeof value !== 'object') return [];
    const mapping = value as Record<string, unknown>;
    return typeof mapping.entityType === 'string'
      && typeof mapping.localId === 'string'
      && typeof mapping.serverId === 'string'
      ? [{ entityType: mapping.entityType, localId: mapping.localId, serverId: mapping.serverId }]
      : [];
  });
}

export async function syncOutbox(
  repository: OfflineRepository,
  sendBatch: SyncBatchSender,
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncProgress> {
  let completed = 0;
  let failed = 0;
  while (true) {
    const operations = await repository.getOutbox();
    const active = operations.filter((operation) => operation.status !== 'failed');
    if (active.length === 0) {
      const finalProgress = { completed, remaining: 0, failed };
      onProgress?.(finalProgress);
      return finalProgress;
    }
    const activeIds = new Set(active.map((operation) => operation.operationId));
    const failedIds = new Set(operations.filter((operation) => operation.status === 'failed').map((operation) => operation.operationId));
    const eligible = active
      .filter((operation) => dependenciesAreAcknowledged(operation, activeIds, failedIds))
      .slice(0, 50);
    if (eligible.length === 0) {
      for (const operation of active) {
        await repository.updateOutbox(operation.operationId, {
          status: 'failed',
          attemptCount: operation.attemptCount + 1,
          lastError: 'The operation is blocked by an unresolved dependency.',
        });
        await repository.recordConflict({
          conflictId: `dependency:${operation.operationId}`,
          operationId: operation.operationId,
          entityType: operation.type,
          entityId: operation.entityId,
          local: operation.payload,
          server: null,
          message: 'The operation is blocked by an unresolved dependency.',
          status: 'open',
          createdAt: operation.createdAt,
        });
        failed += 1;
      }
      const finalProgress = { completed, remaining: 0, failed };
      onProgress?.(finalProgress);
      return finalProgress;
    }

    for (const operation of eligible) {
      await repository.updateOutbox(operation.operationId, {
        status: 'syncing',
        attemptCount: operation.attemptCount + 1,
      });
    }
    let results: OfflineSyncResult[];
    try {
      results = await sendBatch(eligible);
    } catch {
      for (const operation of eligible) {
        await repository.updateOutbox(operation.operationId, {
          status: 'pending',
          lastError: 'The sync request failed before the server acknowledged it.',
        });
      }
      const finalProgress = {
        completed,
        remaining: actionableCount(await repository.getOutbox()),
        failed,
        networkError: true,
      };
      onProgress?.(finalProgress);
      return finalProgress;
    }
    const byId = new Map(results.map((result) => [result.operationId, result]));
    let completedThisBatch = 0;
    for (const operation of eligible) {
      const result = byId.get(operation.operationId);
      if (!result || result.status === 'retryable') {
        await repository.updateOutbox(operation.operationId, {
          status: 'pending',
          lastError: result?.error ?? 'The server did not return a result for this operation.',
        });
        continue;
      }
      if (result.status === 'accepted' || result.status === 'applied' || result.status === 'duplicate') {
        for (const mapping of resultMappings(result.result)) {
          await repository.remapEntityId(mapping);
        }
        await repository.deleteOutbox(operation.operationId);
        completed += 1;
        completedThisBatch += 1;
      } else {
        await repository.updateOutbox(operation.operationId, {
          status: 'failed',
          lastError: result.error ?? 'The server rejected this operation.',
        });
        await repository.recordConflict({
          conflictId: `${result.status}:${operation.operationId}`,
          operationId: operation.operationId,
          entityType: operation.type,
          entityId: operation.entityId,
          local: operation.payload,
          server: result.result && typeof result.result === 'object'
            ? (result.result as Record<string, unknown>).server ?? null
            : null,
          message: result.error ?? 'The server rejected this operation.',
          status: 'open',
          createdAt: operation.createdAt,
        });
        failed += 1;
      }
    }
    const progress = { completed, remaining: actionableCount(await repository.getOutbox()), failed };
    onProgress?.(progress);
    if (progress.remaining === 0) return progress;
    if (completedThisBatch === 0) return progress;
  }
}
