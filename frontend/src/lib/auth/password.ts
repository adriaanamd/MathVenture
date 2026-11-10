import { supabase } from '../supabase/client';
import { requireOnlineOnly } from '../offline/onlineOnly';

export const PASSWORD_RESET_ROUTE = '/reset-password';
export const PASSWORD_RESET_OTP_LENGTH = 6;

export type PasswordAuthApi = {
  resetPasswordForEmail: (
    email: string,
    options?: { redirectTo?: string },
  ) => Promise<{ error: Error | null }>;
  verifyOtp: (credentials: {
    email: string;
    token: string;
    type: 'recovery';
  }) => Promise<{ error: Error | null }>;
  updateUser: (attributes: {
    password: string;
    current_password?: string;
  }) => Promise<{ error: Error | null }>;
};

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

function requireEmail(email: string): string {
  const normalized = normalizeAuthEmail(email);
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Enter a valid email address.');
  }
  return normalized;
}

export function validateRecoveryOtp(token: string): string | null {
  return new RegExp(`^\\d{${PASSWORD_RESET_OTP_LENGTH}}$`).test(token)
    ? null
    : 'Enter the 6-digit code.';
}

export function validateNewPassword(password: string, confirmation: string): string | null {
  if (!password) return 'Enter a new password.';
  if (password !== confirmation) return 'Passwords do not match.';
  return null;
}

export function getPasswordResetRedirectUrl(
  origin = typeof window === 'undefined' ? '' : window.location.origin,
): string {
  return `${origin.replace(/\/$/, '')}${PASSWORD_RESET_ROUTE}`;
}

export async function requestTeacherPasswordReset(
  email: string,
  auth: PasswordAuthApi = supabase.auth,
): Promise<void> {
  requireOnlineOnly();
  const { error } = await auth.resetPasswordForEmail(requireEmail(email), {
    redirectTo: getPasswordResetRedirectUrl(),
  });
  if (error) throw error;
}

export async function verifyTeacherPasswordResetOtp(
  email: string,
  token: string,
  auth: PasswordAuthApi = supabase.auth,
): Promise<void> {
  requireOnlineOnly();
  const validationError = validateRecoveryOtp(token);
  if (validationError) throw new Error(validationError);

  const { error } = await auth.verifyOtp({
    email: requireEmail(email),
    token,
    type: 'recovery',
  });
  if (error) throw error;
}

export async function changeTeacherPassword(
  currentPassword: string,
  newPassword: string,
  confirmation: string,
  auth: PasswordAuthApi = supabase.auth,
): Promise<void> {
  requireOnlineOnly();
  if (!currentPassword) throw new Error('Enter your current password.');
  const validationError = validateNewPassword(newPassword, confirmation);
  if (validationError) throw new Error(validationError);

  const { error } = await auth.updateUser({
    password: newPassword,
    current_password: currentPassword,
  });
  if (error) throw error;
}
