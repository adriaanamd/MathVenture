import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { isAuthReadyForData } from '@features/auth/model/session-state';
import {
  api,
  type StudentClassSummary,
  type StudentClassroomSummary,
  type TeacherClassSummary,
  type TeacherClassroomSummary,
  type TeacherClassesListResponse,
} from '@/lib/api/client';
import type { TeacherAddStudentDraft } from '@/lib/teacher/add-students';
import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';
import {
  addOfflineStudents,
  createOfflineClass,
  removeOfflineStudent,
  renameOfflineClass,
} from '@/lib/offline/classroom/mutations';
import { requireOnlineOnly } from '@/lib/offline/onlineOnly';
import { mergePendingTeacherClasses, readOfflineClassroom, readOfflineTeacherClasses, readOfflineRoster, readPendingClassMutationIds } from '@/lib/offline/classroom/queries';
import { classroomKeys, dashboardKeys } from '@infrastructure/api/queryKeys';
import {
  invalidateClassChanged,
  invalidateClassCreated,
  invalidateRosterChanged,
  invalidateStudentJoined,
} from '@infrastructure/api/invalidation';

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function toLegacyClassesResponse(input: {
  classroom: { id: string; createdAt: string; studentCount: number } | StudentClassroomSummary | null;
}): { classes: (TeacherClassSummary | StudentClassSummary)[] } {
  if (!input.classroom) return { classes: [] };

  if ('teacherName' in input.classroom) {
    return {
      classes: [{
        id: input.classroom.id,
        name: 'Classroom',
        teacherName: input.classroom.teacherName,
        joinedAt: input.classroom.joinedAt,
      }],
    };
  }

  return {
    classes: [{
      id: input.classroom.id,
      name: 'Classroom',
      createdAt: input.classroom.createdAt,
      archivedAt: null,
      studentCount: input.classroom.studentCount,
    }],
  };
}

export function useClasses() {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: classroomKeys.all(),
    queryFn: async () => {
      if (user) {
        if (user.role === 'teacher') {
          const cachedClasses = await readOfflineTeacherClasses(repository);
          const pendingClassIds = new Set(await readPendingClassMutationIds(repository));
          if (browserIsOffline()) {
            return {
              classes: cachedClasses.filter((classroom) => classroom.archivedAt === null),
              archivedClasses: cachedClasses.filter((classroom) => classroom.archivedAt !== null),
            } satisfies TeacherClassesListResponse;
          }
          if (pendingClassIds.size > 0) {
            try {
              const serverData = await api.classes.list();
              return mergePendingTeacherClasses(cachedClasses, {
                classes: serverData.classes ?? [],
                archivedClasses: serverData.archivedClasses ?? [],
              }, pendingClassIds);
            } catch {
              return {
                classes: cachedClasses.filter((classroom) => classroom.archivedAt === null),
                archivedClasses: cachedClasses.filter((classroom) => classroom.archivedAt !== null),
              } satisfies TeacherClassesListResponse;
            }
          }
        }
        const cached = await readOfflineClassroom(repository, user.role);
        if (browserIsOffline()) return toLegacyClassesResponse({ classroom: cached });
      }
      const data = await api.classes.list();
      if (user?.role === 'teacher' && data.classes) {
        return {
          classes: data.classes,
          archivedClasses: data.archivedClasses ?? [],
        } satisfies TeacherClassesListResponse;
      }
      return toLegacyClassesResponse({ classroom: data.classroom ?? null });
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherClassroom(classId?: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: classroomKeys.teacher(classId ?? null),
    queryFn: async () => {
      if (!classId) return { classroom: null };
      if (user) {
        const cached = await readOfflineClassroom(repository, 'teacher', classId);
        const pendingClassIds = new Set(await readPendingClassMutationIds(repository));
        if (browserIsOffline() || pendingClassIds.has(classId)) return { classroom: cached && cached.id === classId ? cached : null };
      }
      const data = await api.classes.list();
      const classrooms = [...(data.classes ?? []), ...(data.archivedClasses ?? [])];
      return { classroom: classrooms.find((classroom) => classroom.id === classId) ?? null };
    },
    enabled: Boolean(classId) && isAuthReadyForData(isLoading, user),
  });
}

export function useStudentClassroom() {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: classroomKeys.student(),
    queryFn: async () => {
      if (user) {
        const cached = await readOfflineClassroom(repository, 'student');
        if (cached || browserIsOffline()) return { classroom: cached };
      }
      const data = await api.classes.list();
      return {
        classroom: data.classroom && 'teacherName' in data.classroom ? data.classroom : null,
      };
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useClassRoster(classId?: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useInfiniteQuery({
    queryKey: classroomKeys.roster(classId ?? null),
    queryFn: async ({ pageParam }) => {
      const cached = await readOfflineRoster(repository, classId);
      if (browserIsOffline()) return cached;
      try {
        return await api.classes.roster(classId!, { cursor: pageParam });
      } catch (error) {
        if (cached.students.length) return cached;
        throw error;
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    enabled: Boolean(classId) && isAuthReadyForData(isLoading, user),
  });
}

export function useClassRosterStudent(classId?: string, studentId?: string | null) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: classroomKeys.rosterStudent(classId ?? null, studentId),
    queryFn: async () => {
      const cached = (await readOfflineRoster(repository, classId)).students.filter((student) => student.id === studentId);
      if (browserIsOffline()) return { students: cached, page: { nextCursor: null, hasMore: false } };
      try {
        return await api.classes.rosterStudent(classId!, studentId!);
      } catch (error) {
        if (cached.length) return { students: cached, page: { nextCursor: null, hasMore: false } };
        throw error;
      }
    },
    enabled: Boolean(classId && studentId) && isAuthReadyForData(isLoading, user),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, bootstrapNow, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (name: string) => {
      if (user?.role === 'teacher') {
        const result = await createOfflineClass(repository, user.id, name);
        if (!browserIsOffline()) await syncNow();
        return result;
      }
      requireOnlineOnly();
      return api.classes.create(name);
    },
    onSuccess: () => {
      invalidateClassCreated(queryClient);
      void bootstrapNow().catch(() => {});
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, bootstrapNow, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: { classId: string; action: 'rename' | 'archive' | 'unarchive'; name?: string }) => {
      if (input.action === 'rename' && user?.role === 'teacher') {
        if (browserIsOffline()) return renameOfflineClass(repository, user.id, input.classId, input.name ?? '');
        let result: Awaited<ReturnType<typeof renameOfflineClass>>;
        try {
          result = await renameOfflineClass(repository, user.id, input.classId, input.name ?? '');
        } catch {
          return api.classes.update(input);
        }
        await syncNow();
        return result;
      }
      if (input.action === 'archive' || input.action === 'unarchive') requireOnlineOnly();
      return api.classes.update(input);
    },
    onSuccess: (_, variables) => {
      invalidateClassChanged(queryClient, variables.classId);
      void bootstrapNow().catch(() => {});
    },
  });
}

export function useJoinClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (joinCode: string) => api.classes.join(joinCode),
    onSuccess: () => {
      invalidateStudentJoined(queryClient);
    },
  });
}

export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      if (user) {
        const result = await removeOfflineStudent(repository, user.id, classId, studentId);
        if (!browserIsOffline()) await syncNow();
        return { removed: true as const, syncState: result.syncState };
      }
      return api.classes.removeStudent(classId, studentId);
    },
    onSuccess: (_, variables) => {
      invalidateRosterChanged(queryClient, variables.classId);
    },
  });
}

export function useAddStudentsToClass() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: ({ classId, students }: { classId: string; students: TeacherAddStudentDraft[] }) => {
      if (user) {
        return addOfflineStudents(repository, user.id, classId, students).then((result) => {
          if (browserIsOffline()) return { createdCount: students.length, syncState: result.syncState };
          return syncNow().then(() => ({ createdCount: students.length, syncState: result.syncState }));
        });
      }
      return api.classes.addStudents(classId, students);
    },
    onSuccess: (_, variables) => {
      invalidateRosterChanged(queryClient, variables.classId);
    },
  });
}
