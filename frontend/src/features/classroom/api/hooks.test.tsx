import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OfflineRepository } from '@/lib/offline/classroom/repository';

const mocks = vi.hoisted(() => ({
  listClasses: vi.fn(),
  roster: vi.fn(),
  useAuth: vi.fn(),
  useOfflineClassroom: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  useAuth: mocks.useAuth,
}));

vi.mock('@/lib/api/client', () => ({
  api: { classes: { list: mocks.listClasses, roster: mocks.roster } },
}));

vi.mock('@/lib/offline/classroom/useOfflineClassroom', () => ({
  useOfflineClassroom: mocks.useOfflineClassroom,
}));

import { useClasses, useClassRoster, useTeacherClassroom } from './hooks';

describe('classroom offline fallback', () => {
  let previousOnline: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    previousOnline = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    mocks.useAuth.mockReturnValue({
      user: { id: 'teacher-1', role: 'teacher', full_name: 'Teacher' },
      isLoading: false,
    });
    mocks.useOfflineClassroom.mockReturnValue({
      repository: {
        readCollection: vi.fn(async (collection: string) => collection === 'classrooms'
          ? [{ id: 'class-1', name: 'Offline Class', created_at: '2026-11-21T00:00:00.000Z', archived_at: null }]
          : []),
        getOutbox: vi.fn().mockResolvedValue([]),
      } as unknown as OfflineRepository,
    });
    mocks.listClasses.mockRejectedValue(new TypeError('Failed to fetch'));
    mocks.roster.mockRejectedValue(new TypeError('Failed to fetch'));
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: previousOnline });
  });

  it('uses the cached classroom when the browser reports online but the server fetch fails', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useTeacherClassroom('class-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      classroom: expect.objectContaining({ id: 'class-1', name: 'Offline Class' }),
    });
  });

  it('uses the cached teacher class list when the browser reports online but the server fetch fails', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useClasses(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      classes: [expect.objectContaining({ id: 'class-1', name: 'Offline Class' })],
      archivedClasses: [],
    });
  });

  it('keeps an empty cached roster usable when the browser reports online but the server fetch fails', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useClassRoster('class-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      pages: [{ students: [], page: { nextCursor: null, hasMore: false } }],
      pageParams: [null],
    });
  });
});
