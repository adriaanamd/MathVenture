import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { isAuthReadyForData } from '@features/auth/model/session-state';
import { api } from '@/lib/api/client';
import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';
import { createOfflinePost } from '@/lib/offline/classroom/mutations';
import { hasOfflineClassroom } from '@/lib/offline/classroom/queries';
import { readOfflinePosts } from '@/lib/offline/classroom/reports';
import { postKeys } from '@infrastructure/api/queryKeys';
import { loadOnlineFirst } from '@infrastructure/api/online-first';
import { invalidatePostCreated } from '@infrastructure/api/invalidation';

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function useClassPosts(classId: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: postKeys.list(classId),
    queryFn: async () => {
      return loadOnlineFirst({
        isOffline: browserIsOffline(),
        readCache: async () => {
          const posts = await readOfflinePosts(repository, classId);
          const hasClassroom = await hasOfflineClassroom(repository, classId);
          if (!posts.length && !hasClassroom && !browserIsOffline()) return null;
          return { posts };
        },
        readServer: () => api.posts.list(classId),
      });
    },
    enabled: !!classId && isAuthReadyForData(isLoading, user),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async ({ classId, content }: { classId: string, content: string }) => {
      if (user) {
        const result = await createOfflinePost(repository, user.id, { classId, content });
        if (!browserIsOffline()) void syncNow();
        return { post: { id: result.id, classId, content }, syncState: result.syncState };
      }
      return api.posts.create(classId, content);
    },
    onSuccess: (_, variables) => {
      invalidatePostCreated(queryClient, variables.classId);
    },
  });
}
