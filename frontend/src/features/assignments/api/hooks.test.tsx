import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OfflineRepository } from '@/lib/offline/classroom/repository';

const mocks = vi.hoisted(() => ({
  assignmentQuiz: vi.fn(),
  listAssignments: vi.fn(),
  useAuth: vi.fn(),
  useOfflineClassroom: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  useAuth: mocks.useAuth,
}));

vi.mock('@/lib/api/client', () => ({
  api: {
    assignments: { list: mocks.listAssignments },
    assignmentQuiz: { get: mocks.assignmentQuiz },
  },
}));

vi.mock('@/lib/offline/classroom/useOfflineClassroom', () => ({
  useOfflineClassroom: mocks.useOfflineClassroom,
}));

import { useAssignmentQuiz, useAssignments } from './hooks';

describe('assignment classroom offline fallback', () => {
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
        readCollection: vi.fn(async (collection: string) => {
          if (collection === 'classrooms') return [{ id: 'class-1', name: 'Offline Class', archived_at: null }];
          return [];
        }),
      } as unknown as OfflineRepository,
    });
    mocks.listAssignments.mockRejectedValue(new TypeError('Failed to fetch'));
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: previousOnline });
  });

  it('keeps an empty cached assignment list usable when the server fetch fails', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAssignments('class-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]).toEqual({
      assignments: [],
      page: { nextCursor: null, hasMore: false },
    });
  });

  it('uses cached not-started quiz state when the server fetch fails', async () => {
    mocks.useAuth.mockReturnValue({
      user: { id: 'student-1', role: 'student', full_name: 'Student' },
      isLoading: false,
    });
    mocks.useOfflineClassroom.mockReturnValue({
      repository: {
        readCollection: vi.fn(async (collection: string) => {
          if (collection === 'classrooms') return [{ id: 'class-1', name: 'Offline Class', archived_at: null }];
          if (collection === 'assignments') return [{ id: 'assignment-1', class_id: 'class-1', lesson_id: 'lesson-1' }];
          return [];
        }),
      } as unknown as OfflineRepository,
    });
    mocks.assignmentQuiz.mockRejectedValue(new TypeError('Failed to fetch'));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAssignmentQuiz('assignment-1', 'lesson-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.state).toEqual(expect.objectContaining({
      assignmentId: 'assignment-1',
      lessonId: 'lesson-1',
      status: 'not_started',
      attemptId: null,
    }));
  });
});
