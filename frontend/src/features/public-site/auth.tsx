import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@features/i18n/context';
import { useAuth } from '@features/auth/context';
import {
  PASSWORD_RESET_OTP_LENGTH,
  requestTeacherPasswordReset,
  teacherSignIn,
  teacherSignUp,
  validateNewPassword,
  verifyTeacherPasswordResetOtp,
} from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { requireOnlineOnly } from '@/lib/offline/onlineOnly';
import { Button, Input, Label, Card } from '@/components/ui';
import { Map, Leaf, Compass, ArrowLeft } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { offlineSignIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      if (isOffline) {
        await offlineSignIn(password);
      } else {
        try {
          await teacherSignIn(email, password);
        } catch (onlineError) {
          if (typeof navigator === 'undefined' || navigator.onLine) throw onlineError;
          await offlineSignIn(password);
        }
      }
      setLocation('/'); // App.tsx will redirect based on role
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page font-comic-sans min-h-[100dvh] flex items-center justify-center p-4 bg-background overflow-hidden relative">
      {/* Decorative Jungle Leaves */}
      <Leaf className="absolute top-10 left-10 text-primary/20 h-32 w-32 -rotate-45" />
      <Leaf className="absolute bottom-10 right-10 text-jungle-orange/20 h-40 w-40 rotate-12" />
      
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" className="absolute top-4 left-4 z-50 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" /> Back to Home
        </Button>
      </Link>
      
      <Card className="w-full max-w-md p-8 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg -rotate-6">
            <Compass className="h-10 w-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-display font-bold text-center mb-2">Welcome Back!</h1>
        <p className="text-center text-muted-foreground mb-8">Ready for your next math adventure?</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-destructive text-sm font-bold">{error}</p>}
          
          <Button type="submit" className="w-full" size="lg" disabled={loading} variant="jungle">
            {loading ? t('common.loading') : t('auth.signin')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm font-bold">
          <Link href="/forgot-password">
            <span className="cursor-pointer text-primary hover:underline">{t('auth.forgotPassword')}</span>
          </Link>
        </p>

        <p className="mt-6 text-center text-sm font-bold text-muted-foreground">
          Are you a teacher? <Link href="/signup"><span className="text-primary hover:underline cursor-pointer">Create an account</span></Link>
        </p>
      </Card>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await requestTeacherPasswordReset(email);
      setMessage(t('auth.resetCodeSent'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('auth.resetRequestFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetHref = `/reset-password?email=${encodeURIComponent(email.trim())}`;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background overflow-hidden relative">
      <Card className="w-full max-w-md p-8 relative z-10">
        <h1 className="text-3xl font-display font-bold text-center mb-2">{t('auth.forgotPasswordTitle')}</h1>
        <p className="text-center text-muted-foreground mb-8">{t('auth.forgotPasswordDescription')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">{t('auth.email')}</Label>
            <Input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          {message && <p className="text-primary text-sm font-bold">{message}</p>}
          {error && <p className="text-destructive text-sm font-bold">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading} variant="jungle">
            {loading ? t('common.loading') : t('auth.sendResetCode')}
          </Button>
        </form>

        {message && (
          <Link href={resetHref}>
            <Button type="button" variant="outline" className="w-full mt-3">
              {t('auth.continueToReset')}
            </Button>
          </Link>
        )}

        <p className="mt-6 text-center text-sm font-bold text-muted-foreground">
          <Link href="/login"><span className="text-primary hover:underline cursor-pointer">{t('auth.backToLogin')}</span></Link>
        </p>
      </Card>
    </div>
  );
}

export function PasswordReset() {
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get('email') ?? '');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const passwordError = validateNewPassword(newPassword, confirmation);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      requireOnlineOnly();
      if (!isOtpVerified) {
        await verifyTeacherPasswordResetOtp(email, token);
        setIsOtpVerified(true);
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setLocation('/login?reset=success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('auth.resetRequestFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    setResending(true);
    try {
      await requestTeacherPasswordReset(email);
      setIsOtpVerified(false);
      setMessage(t('auth.resetCodeResent'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('auth.resetRequestFailed'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background overflow-hidden relative">
      <Card className="w-full max-w-md p-8 relative z-10">
        <h1 className="text-3xl font-display font-bold text-center mb-2">{t('auth.resetPasswordTitle')}</h1>
        <p className="text-center text-muted-foreground mb-8">{t('auth.resetPasswordDescription')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">{t('auth.email')}</Label>
            <Input
              id="reset-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setIsOtpVerified(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-code">{t('auth.verificationCode')}</Label>
            <Input
              id="reset-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={PASSWORD_RESET_OTP_LENGTH}
              required
              autoComplete="one-time-code"
              value={token}
              onChange={(event) => {
                setToken(event.target.value.replace(/\D/g, '').slice(0, PASSWORD_RESET_OTP_LENGTH));
                setIsOtpVerified(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-new-password">{t('auth.newPassword')}</Label>
            <Input
              id="reset-new-password"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password">{t('auth.confirmPassword')}</Label>
            <Input
              id="reset-confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>

          {message && <p className="text-primary text-sm font-bold">{message}</p>}
          {error && <p className="text-destructive text-sm font-bold">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading || resending} variant="jungle">
            {loading ? t('common.loading') : t('auth.resetPassword')}
          </Button>
          <Button type="button" variant="outline" className="w-full" disabled={loading || resending} onClick={() => void handleResend()}>
            {resending ? t('common.loading') : t('auth.resendCode')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-bold text-muted-foreground">
          <Link href="/login"><span className="text-primary hover:underline cursor-pointer">{t('auth.backToLogin')}</span></Link>
        </p>
      </Card>
    </div>
  );
}

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await teacherSignUp(email, password, fullName);
      await teacherSignIn(email, password);
      setLocation('/'); 
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <Map className="absolute top-1/4 -right-10 text-primary/10 h-64 w-64 rotate-12" />
      
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" className="absolute top-4 left-4 z-50 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" /> Back to Home
        </Button>
      </Link>
      
      <Card className="w-full max-w-md p-8 relative z-10">
        <h1 className="text-3xl font-display font-bold text-center mb-2">Create a Teacher Account</h1>
        <p className="text-center text-muted-foreground mb-8">Students get their accounts from their teacher.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('auth.name')}</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-destructive text-sm font-bold">{error}</p>}
          
          <Button type="submit" className="w-full mt-4" size="lg" disabled={loading} variant="jungle">
            {loading ? t('common.loading') : t('auth.signup')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-bold text-muted-foreground">
          Already have an account? <Link href="/login"><span className="text-primary hover:underline cursor-pointer">Sign In</span></Link>
        </p>
      </Card>
    </div>
  );
}
