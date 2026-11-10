import { supabase } from '../supabase/client';
import {
  invokeTeacherFunction,
  resetActiveAuthClient,
  setActiveAuthClient,
  type Role,
} from '../api';
import { studentSupabase } from '../supabase/student-client';
import {
  buildVerifyOtpParams,
  isStudentSessionPayload,
  type StudentSessionPayload,
} from './student-auth';
import { profileFromAuthSession, type UserProfile } from './profile';
import {
  createPasswordVerifier,
  getOrCreateDeviceId,
  verifyPasswordVerifier,
  type OfflineCredentialRecord,
} from '../offline/classroom/crypto';
import {
  isOfflineLeaseValid,
  renewOfflineLease,
  type OfflineEnrollmentRecord as OfflineLeaseEnrollmentRecord,
} from '../offline/classroom/lease';
import type { OfflineStore } from '../offline/classroom/store';
import type { SqliteDatabase, SqliteRow } from '../offline/sqlite/adapter';
import { getApplicationStorage } from '../offline/sqlite/runtime';
import { OnlineOnlyError, requireOnlineOnly } from '../offline/onlineOnly';

export type OfflineEnrollmentRecord = OfflineLeaseEnrollmentRecord;

const fallbackDeviceStorage = new Map<string, string>();

export type OfflineStorage = OfflineStore | SqliteDatabase;

function isSqliteStorage(storage: OfflineStorage): storage is SqliteDatabase {
  return 'query' in storage && 'execute' in storage && 'transaction' in storage && 'health' in storage;
}

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getDeviceStorage(): Map<string, string> | Storage {
  return typeof window === 'undefined' ? fallbackDeviceStorage : window.localStorage;
}

export async function enrollOfflineDevice(
  profile: UserProfile,
  password: string,
  store?: OfflineStorage,
): Promise<OfflineEnrollmentRecord> {
  const storage = store ?? await getApplicationStorage();
  if (profile.role !== 'teacher') {
    throw new Error('Only teacher accounts can enroll this classroom device.');
  }
  const verifier = await createPasswordVerifier(password);
  const deviceId = getOrCreateDeviceId(getDeviceStorage());
  const now = new Date().toISOString();
  const teacherProfile = { ...profile, role: 'teacher' as const };
  const record = renewOfflineLease(now, {
    deviceId,
    verifier,
    profile: teacherProfile,
    lastOnlineValidatedAt: now,
    offlineAccessUntil: now,
  });
  if (isSqliteStorage(storage)) {
    await storage.transaction(async (tx) => {
      await tx.execute('delete from device_enrollment where device_id = ?', [deviceId]);
      await tx.execute(`insert into device_enrollment (device_id, teacher_id, profile_json, verifier_json, last_online_validated_at, offline_access_until, created_at, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?)`, [
        deviceId,
        teacherProfile.id,
        JSON.stringify(teacherProfile),
        JSON.stringify(record.verifier),
        record.lastOnlineValidatedAt,
        record.offlineAccessUntil,
        now,
        now,
      ]);
      await tx.execute('delete from profiles where id = ?', [teacherProfile.id]);
      await tx.execute(`insert into profiles (id, role, full_name, email, data_json, server_revision, is_deleted, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?)`, [teacherProfile.id, 'teacher', teacherProfile.full_name, null, JSON.stringify(teacherProfile), 0, 0, now]);
      await tx.execute('delete from local_sessions where session_id = ?', ['active']);
      await tx.execute(`insert into local_sessions (session_id, teacher_id, active_profile_json, viewing_student_json, updated_at)
        values (?, ?, ?, ?, ?)`, ['active', teacherProfile.id, JSON.stringify(teacherProfile), null, now]);
    });
  } else {
    await storage.put('meta', { key: 'offlineEnrollment', value: record });
    await storage.put('meta', { key: 'deviceId', value: deviceId });
    await storage.put('meta', { key: 'offlineSession', value: teacherProfile });
  }
  return record;
}

export async function readOfflineEnrollment(
  store?: OfflineStorage,
): Promise<OfflineEnrollmentRecord | null> {
  const storage = store ?? await getApplicationStorage();
  const record = isSqliteStorage(storage)
    ? (await storage.query<SqliteRow>('select * from device_enrollment order by updated_at desc limit 1'))[0]
    : (await storage.get('meta', 'offlineEnrollment'))?.value;
  if (isSqliteStorage(storage) && record) {
    const row = record as SqliteRow;
    const parsedProfile = parseJson(row.profile_json);
    const parsedVerifier = parseJson(row.verifier_json);
    return typeof row.device_id === 'string'
      && typeof row.last_online_validated_at === 'string'
      && typeof row.offline_access_until === 'string'
      && parsedProfile && typeof parsedProfile === 'object'
      && parsedVerifier && typeof parsedVerifier === 'object'
      ? {
        deviceId: row.device_id,
        verifier: parsedVerifier as OfflineEnrollmentRecord['verifier'],
        profile: objectValue(parsedProfile) as OfflineEnrollmentRecord['profile'],
        lastOnlineValidatedAt: row.last_online_validated_at,
        offlineAccessUntil: row.offline_access_until,
      }
      : null;
  }
  if (!record || typeof record !== 'object') return null;
  const candidate = record as Partial<OfflineEnrollmentRecord>;
  if (!candidate.deviceId || !candidate.verifier || !candidate.profile
    || typeof candidate.lastOnlineValidatedAt !== 'string'
    || typeof candidate.offlineAccessUntil !== 'string') return null;
  return candidate as OfflineEnrollmentRecord;
}

export class OfflineAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfflineAuthError';
  }
}

export async function offlineSignIn(
  password: string,
  store?: OfflineStorage,
): Promise<UserProfile> {
  const storage = store ?? await getApplicationStorage();
  const enrollment = await readOfflineEnrollment(storage);
  if (!enrollment) {
    throw new OnlineOnlyError();
  }
  if (!isOfflineLeaseValid(new Date().toISOString(), enrollment)) {
    throw new OnlineOnlyError();
  }
  const valid = await verifyPasswordVerifier(password, enrollment.verifier);
  if (!valid) throw new OfflineAuthError('Incorrect offline password.');
  if (isSqliteStorage(storage)) {
    await storage.transaction(async (tx) => {
      await tx.execute('delete from local_sessions where session_id = ?', ['active']);
      await tx.execute(`insert into local_sessions (session_id, teacher_id, active_profile_json, viewing_student_json, updated_at)
        values (?, ?, ?, ?, ?)`, ['active', enrollment.profile.id, JSON.stringify(enrollment.profile), null, new Date().toISOString()]);
    });
  } else {
    await storage.put('meta', { key: 'offlineSession', value: enrollment.profile });
  }
  return enrollment.profile;
}

export async function readOfflineSession(
  store?: OfflineStorage,
): Promise<UserProfile | null> {
  const storage = store ?? await getApplicationStorage();
  const value = isSqliteStorage(storage)
    ? (await storage.query<SqliteRow>('select active_profile_json from local_sessions where session_id = ?', ['active']))[0]?.active_profile_json
    : (await storage.get('meta', 'offlineSession'))?.value;
  const parsedValue = parseJson(value);
  if (!parsedValue || typeof parsedValue !== 'object') return null;
  const profile = parsedValue as Partial<UserProfile>;
  return typeof profile.id === 'string' && profile.role === 'teacher' && typeof profile.full_name === 'string'
    ? profile as UserProfile
    : null;
}

export type RestoreOfflineSessionOptions = {
  now?: string;
  online?: boolean;
  storage?: OfflineStorage;
};

export async function restoreOfflineSession({
  now = new Date().toISOString(),
  online = typeof navigator === 'undefined' || (navigator as Navigator & { onLine?: boolean }).onLine !== false,
  storage,
}: RestoreOfflineSessionOptions = {}): Promise<UserProfile | null> {
  const resolvedStorage = storage ?? await getApplicationStorage();
  if (online) return readOfflineSession(resolvedStorage);
  const enrollment = await readOfflineEnrollment(resolvedStorage);
  if (!enrollment) throw new OnlineOnlyError();
  if (!isOfflineLeaseValid(now, enrollment)) throw new OnlineOnlyError();
  const session = await readOfflineSession(resolvedStorage);
  if (!session) throw new OfflineAuthError('No offline session is available on this device.');
  return session;
}

export async function readOfflineStudentProfile(
  studentId: string,
  store?: OfflineStorage,
): Promise<UserProfile | null> {
  const storage = store ?? await getApplicationStorage();
  const value = isSqliteStorage(storage)
    ? (await storage.query<SqliteRow>('select * from profiles where id = ?', [studentId]))[0]
    : (await storage.get('profiles', studentId))?.value;
  const parsedValue = isSqliteStorage(storage)
    ? { ...objectValue(parseJson((value as SqliteRow | undefined)?.data_json)), ...(value ?? {}) }
    : value;
  if (!parsedValue || typeof parsedValue !== 'object') return null;
  const profile = parsedValue as Partial<UserProfile>;
  return profile.id === studentId && profile.role === 'student' && typeof profile.full_name === 'string'
    ? profile as UserProfile
    : null;
}

export async function offlineSignOut(store?: OfflineStorage): Promise<void> {
  const storage = store ?? await getApplicationStorage();
  if (isSqliteStorage(storage)) {
    await storage.execute('delete from local_sessions where session_id = ?', ['active']);
  } else {
    await storage.delete('meta', 'offlineSession');
  }
}

export type TeacherReturnAuthError = { message: string };

export type TeacherReturnDeps = {
  getTeacherEmail: () => Promise<string | null>;
  verifyTeacherPassword: (
    email: string,
    password: string,
  ) => Promise<TeacherReturnAuthError | null>;
  signOutStudent: () => Promise<TeacherReturnAuthError | null>;
};

const defaultTeacherReturnDeps: TeacherReturnDeps = {
  async getTeacherEmail() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user.email ?? null;
  },
  async verifyTeacherPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { message: error.message } : null;
  },
  async signOutStudent() {
    const { error } = await studentSupabase.auth.signOut();
    return error ? { message: error.message } : null;
  },
};

// Auth (sign up / sign in / sign out / session) talks to Supabase Auth
// directly via the anon client -- this is the one exception to "always go
// through an edge function", since Supabase Auth is itself the
// authorization system, not app data.

export async function teacherSignUp(email: string, password: string, fullName: string) {
  requireOnlineOnly();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'teacher', full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function teacherSignIn(email: string, password: string) {
  requireOnlineOnly();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = data.user;
  if (user) {
    const profile: UserProfile = {
      id: user.id,
      role: 'teacher',
      full_name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '',
    };
    try {
      const store = await getApplicationStorage();
      await enrollOfflineDevice(profile, password, store);
    } catch (enrollmentError) {
      console.warn('Offline classroom enrollment skipped', enrollmentError);
    }
  }
  return data;
}

export async function viewStudentAccount(studentId: string): Promise<UserProfile> {
  const response = await invokeTeacherFunction<StudentSessionPayload>('student-view-as', {
    method: 'POST',
    body: { studentId },
  });

  if (!isStudentSessionPayload(response)) {
    throw new Error("We couldn't open that student account.");
  }

  const { data, error } = await studentSupabase.auth.verifyOtp(
    buildVerifyOtpParams(response),
  );
  if (error) throw error;

  const profile = profileFromAuthSession(data.session);
  if (!profile || profile.role !== 'student') {
    await studentSupabase.auth.signOut();
    throw new Error("We couldn't open that student account.");
  }

  setActiveAuthClient(studentSupabase);
  return profile;
}

export async function returnToTeacherAccount(
  password: string,
  deps: TeacherReturnDeps = defaultTeacherReturnDeps,
) {
  requireOnlineOnly();
  if (!password.trim()) {
    throw new Error('Teacher password is required.');
  }

  const email = await deps.getTeacherEmail();
  if (!email) {
    throw new Error('Teacher session unavailable.');
  }

  const verifyError = await deps.verifyTeacherPassword(email, password);
  if (verifyError) {
    throw new Error('Incorrect teacher password.');
  }

  const signOutError = await deps.signOutStudent();
  if (signOutError) throw new Error(signOutError.message);
  resetActiveAuthClient();
}

export async function signUp(email: string, password: string, role: Role, fullName: string) {
  if (role !== 'teacher') {
    throw new Error('Student sign up requires the name-based student flow.');
  }
  return teacherSignUp(email, password, fullName);
}

export async function signIn(email: string, password: string) {
  return teacherSignIn(email, password);
}

export async function signOut() {
  const [studentResult, teacherResult] = await Promise.all([
    studentSupabase.auth.signOut(),
    supabase.auth.signOut(),
  ]);
  resetActiveAuthClient();
  await offlineSignOut().catch(() => {});
  if (studentResult.error) throw studentResult.error;
  if (teacherResult.error) throw teacherResult.error;
}

export async function getProfile(): Promise<{ id: string; role: Role; full_name: string } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', session.user.id)
    .maybeSingle();
  // Reading one's own profile row is allowed to fail closed like any other
  // table (RLS denies it) -- this is a best-effort convenience read. If it
  // fails, callers fall back to metadata already present on the session.
  if (error || !data) {
    return {
      id: session.user.id,
      role: (session.user.user_metadata?.role as Role) ?? 'student',
      full_name: (session.user.user_metadata?.full_name as string) ?? '',
    };
  }
  return data as { id: string; role: Role; full_name: string };
}
