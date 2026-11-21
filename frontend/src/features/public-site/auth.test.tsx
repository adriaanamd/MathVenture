import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  teacherSignIn: vi.fn(),
  offlineSignIn: vi.fn(),
  setLocation: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  PASSWORD_RESET_OTP_LENGTH: 6,
  requestTeacherPasswordReset: vi.fn(),
  teacherSignIn: mocks.teacherSignIn,
  teacherSignUp: vi.fn(),
  validateNewPassword: vi.fn(),
  verifyTeacherPasswordResetOtp: vi.fn(),
}));

vi.mock('@features/auth/context', () => ({
  useAuth: () => ({ offlineSignIn: mocks.offlineSignIn }),
}));

vi.mock('@features/i18n/context', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('wouter', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useLocation: () => ['/login', mocks.setLocation],
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: { auth: { signOut: vi.fn(), updateUser: vi.fn() } },
}));

import { Login } from './auth';

describe('Login offline fallback', () => {
  let previousOnline: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    previousOnline = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: previousOnline });
  });

  it('unlocks the enrolled offline account when auth fetch fails despite online browser status', async () => {
    mocks.teacherSignIn.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    mocks.offlineSignIn.mockResolvedValueOnce(undefined);

    render(<Login />);
    await userEvent.type(screen.getByLabelText('auth.email'), 'teacher@example.com');
    await userEvent.type(screen.getByLabelText('auth.password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'auth.signin' }));

    await waitFor(() => expect(mocks.offlineSignIn).toHaveBeenCalledWith('secret'));
    expect(mocks.setLocation).toHaveBeenCalledWith('/');
    expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument();
  });
});
