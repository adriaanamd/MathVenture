import type { UserProfile } from '@/lib/auth/profile';

export type AuthSessionResult = {
  teacherUser: UserProfile | null;
  viewingStudent: UserProfile | null;
  useStudentAuthClient: boolean;
};

export type AuthSessionDependencies = {
  isOffline: boolean;
  getProfile: () => Promise<UserProfile | null>;
  getStudentSession: () => Promise<{ session: unknown }>;
  readOfflineSession: () => Promise<UserProfile | null>;
  readOfflineViewingStudent: () => Promise<UserProfile | null>;
  restoreOfflineSession: (options: { online: false }) => Promise<UserProfile | null>;
  profileFromSession: (session: unknown) => UserProfile | null;
};

export async function loadAuthSession({
  isOffline,
  getProfile,
  getStudentSession,
  readOfflineSession,
  readOfflineViewingStudent,
  restoreOfflineSession,
  profileFromSession,
}: AuthSessionDependencies): Promise<AuthSessionResult> {
  if (isOffline) {
    const [offlineSession, selectedStudent] = await Promise.all([
      restoreOfflineSession({ online: false }),
      readOfflineViewingStudent(),
    ]);
    return {
      teacherUser: offlineSession,
      viewingStudent: offlineSession && selectedStudent?.role === 'student' ? selectedStudent : null,
      useStudentAuthClient: offlineSession !== null && selectedStudent?.role === 'student',
    };
  }

  const [profile, studentSessionResult, offlineSession] = await Promise.all([
    getProfile(),
    getStudentSession(),
    readOfflineSession(),
  ]);
  const teacherUser = profile?.role === 'teacher' ? profile : offlineSession;
  const studentProfile = profileFromSession(studentSessionResult.session);
  const viewingStudent = teacherUser && studentProfile?.role === 'student' ? studentProfile : null;

  return {
    teacherUser,
    viewingStudent,
    useStudentAuthClient: viewingStudent !== null,
  };
}
