import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OfflineRepository } from '@/lib/offline/classroom/repository';

const mocks = vi.hoisted(() => ({
  studentDashboard: vi.fn(),
  useAuth: vi.fn(),
  useOfflineClassroom: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  useAuth: mocks.useAuth,
}));

vi.mock('@/lib/api/client', () => ({
  api: {
    dashboard: {
      student: mocks.studentDashboard,
      teacher: vi.fn(),
    },
  },
}));

vi.mock('@/lib/offline/classroom/useOfflineClassroom', () => ({
  useOfflineClassroom: mocks.useOfflineClassroom,
}));

import { useStudentDashboard } from './hooks';

describe('dashboard offline fallback', () => {
  let previousOnline: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    previousOnline = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    mocks.useAuth.mockReturnValue({
      user: { id: 'student-1', role: 'student', full_name: 'Student' },
      isLoading: false,
    });
    mocks.useOfflineClassroom.mockReturnValue({
      repository: {
        readCollection: vi.fn(async (collection: string) => collection === 'classrooms'
          ? [{ id: 'class-1', name: 'Offline Class', archived_at: null }]
          : []),
      } as unknown as OfflineRepository,
    });
    mocks.studentDashboard.mockRejectedValue(new TypeError('Failed to fetch'));
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: previousOnline });
  });

  it('uses a cached student classroom when the dashboard has no attempts and the fetch fails', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useStudentDashboard(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ completedLessons: 0, streakDays: 0, recentAttempts: [] });
  });
});
