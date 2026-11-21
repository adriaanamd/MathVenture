import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { resetActiveAuthClient, setActiveAuthClient } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';
import { studentSupabase } from '@/lib/supabase/student-client';
import {
  getProfile,
  offlineSignIn as unlockOfflineTeacher,
  readOfflineSession,
  readOfflineViewingStudent,
  restoreOfflineSession,
  returnToTeacherAccount as clearStudentAccount,
  viewStudentAccount as openStudentAccount,
} from '@/lib/auth/auth';
import { profileFromAuthSession, type UserProfile } from '@/lib/auth/profile';
import { buildAuthViewState } from '@features/auth/model/session-state';
import { loadAuthSession } from '@features/auth/session/service';
import { AuthContext } from '@features/auth/context';
export type { AuthContextType } from '@features/auth/context';
export { useAuth } from '@features/auth/context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [teacherUser, setTeacherUser] = useState<UserProfile | null>(null);
  const [viewingStudent, setViewingStudent] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const session = await loadAuthSession({
        isOffline: typeof navigator !== 'undefined'
          && (navigator as Navigator & { onLine?: boolean }).onLine === false,
        getProfile,
        getStudentSession: async () => {
          const result = await studentSupabase.auth.getSession();
          return { session: result.data.session };
        },
        readOfflineSession: () => readOfflineSession().catch(() => null),
        readOfflineViewingStudent: () => readOfflineViewingStudent().catch(() => null),
        restoreOfflineSession,
        profileFromSession: (session) => profileFromAuthSession(
          session as Parameters<typeof profileFromAuthSession>[0],
        ),
      });
      setTeacherUser(session.teacherUser);
      setViewingStudent(session.viewingStudent);
      if (session.useStudentAuthClient) {
        setActiveAuthClient(studentSupabase);
      } else {
        resetActiveAuthClient();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setTeacherUser(null);
      setViewingStudent(null);
      resetActiveAuthClient();
    } finally {
      setIsLoading(false);
    }
  };

  const viewStudentAccount = async (studentId: string) => {
    const studentProfile = await openStudentAccount(studentId);
    queryClient.clear();
    setViewingStudent(studentProfile);
  };

  const returnToTeacherAccount = async (password: string) => {
    await clearStudentAccount(password);
    queryClient.clear();
    setViewingStudent(null);
  };

  const offlineSignIn = async (password: string) => {
    const profile = await unlockOfflineTeacher(password);
    setTeacherUser(profile);
    setViewingStudent(null);
    resetActiveAuthClient();
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchProfile();

    const { data: { subscription: teacherSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Auth callbacks run while supabase-js holds its internal auth lock.
      // Do not call getSession(), getUser(), or any other async Supabase API
      // here; update from the session that the callback already provides.
      const profile = profileFromAuthSession(session);
      setTeacherUser(profile?.role === 'teacher' ? profile : null);
      if (!profile) {
        setViewingStudent(null);
        resetActiveAuthClient();
      }
    });

    const { data: { subscription: studentSubscription } } = studentSupabase.auth.onAuthStateChange((_event, session) => {
      const profile = profileFromAuthSession(session);
      if (profile?.role === 'student') {
        setActiveAuthClient(studentSupabase);
        setViewingStudent(profile);
      } else {
        resetActiveAuthClient();
        setViewingStudent(null);
      }
    });

    return () => {
      teacherSubscription.unsubscribe();
      studentSubscription.unsubscribe();
    };
  }, [queryClient]);

  const viewState = buildAuthViewState(teacherUser, viewingStudent);

  return (
    <AuthContext.Provider value={{
      ...viewState,
      isLoading,
      refreshProfile: fetchProfile,
      viewStudentAccount,
      returnToTeacherAccount,
      offlineSignIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
