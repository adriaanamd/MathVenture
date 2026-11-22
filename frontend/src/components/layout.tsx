import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@features/i18n/context';
import { STUDENT_NAV_ITEMS, isStudentNavActive } from '@features/student/model/navigation';
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from '@features/teacher/model/navigation';
import { signOut } from '@/lib/auth';
import { Button, Input } from './ui';
import { LogOut, Globe, Compass, Users, LayoutDashboard, Settings, Map, Menu, User, ClipboardList, BarChart3 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@shared/utils';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';
import { InstallAppAction } from '@/components/pwa/InstallAppAction';
import { OfflineStatusIndicator } from '@/components/offline/OfflineStatusIndicator';

function getTeacherNavItems(t: (key: string) => string) {
  return TEACHER_NAV_ITEMS.map((item) => ({
    href: item.href,
    label: t(item.labelKey),
    icon: item.href === '/teacher' ? LayoutDashboard : Settings,
  }));
}

function isAppNavItemActive(location: string, href: string, isTeacher: boolean) {
  if (isTeacher) {
    return isTeacherNavActive(location, href);
  }

  return isStudentNavActive(location, href);
}

export function TopNav() {
  const {
    user,
    isViewingStudent,
    viewingStudent,
    returnToTeacherAccount,
  } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [isReturning, setIsReturning] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const handleReturnToTeacher = () => {
    setTeacherPassword('');
    setReturnError(null);
    setIsReturnDialogOpen(true);
  };

  const handleConfirmReturn = async () => {
    setIsReturning(true);
    setReturnError(null);
    try {
      await returnToTeacherAccount(teacherPassword);
      setIsReturnDialogOpen(false);
      setTeacherPassword('');
      setLocation('/teacher');
    } catch (caught) {
      setReturnError(
        caught instanceof Error
          ? caught.message
          : "We couldn't return to the teacher account right now.",
      );
    } finally {
      setIsReturning(false);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'tl' : 'en');
  };

  const isTeacher = user?.role === 'teacher';
  const teacherNavItems = getTeacherNavItems(t);
  const studentNavItems = STUDENT_NAV_ITEMS.map((item) => ({
    href: item.href,
    label: t(item.labelKey),
    icon: Map,
  }));
  const navItems = user ? (isTeacher ? teacherNavItems : studentNavItems) : [];

  return (
    <header className={`sticky top-0 z-40 w-full border-b-2 border-border bg-background/95 ${isTeacher ? 'teacher-topbar' : 'backdrop-blur supports-[backdrop-filter]:bg-background/60'}`}>
      {isViewingStudent && viewingStudent && (
        <div className="border-b-2 border-primary/20 bg-primary px-4 py-2 text-primary-foreground">
          <div className="container mx-auto flex flex-col gap-2 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
            <p>
              Viewing account as <span className="font-extrabold">{viewingStudent.full_name}</span>
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReturnToTeacher}
              disabled={isReturning}
            >
              {isReturning ? 'Returning...' : 'Return to teacher account'}
            </Button>
          </div>
        </div>
      )}
      <Dialog
        open={isReturnDialogOpen}
        onOpenChange={(open) => {
          setIsReturnDialogOpen(open);
          if (!open) {
            setTeacherPassword('');
            setReturnError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return to teacher account?</DialogTitle>
            <DialogDescription>
              Are you sure? Enter the teacher password to end student view and return.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="teacher-return-password" className="text-sm font-bold">
              Teacher password
            </label>
            <Input
              id="teacher-return-password"
              type="password"
              value={teacherPassword}
              onChange={(event) => setTeacherPassword(event.target.value)}
              autoComplete="current-password"
              disabled={isReturning}
            />
            {returnError && <p className="text-sm font-bold text-destructive">{returnError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsReturnDialogOpen(false)}
              disabled={isReturning}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleConfirmReturn}
              disabled={isReturning || !teacherPassword}
            >
              {isReturning ? 'Verifying...' : 'Confirm and return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        <div className="min-w-0 flex items-center gap-2">
          <Link
            href={user ? (user.role === 'student' ? '/student' : '/teacher') : '/'}
            className="flex min-w-0 cursor-pointer items-center gap-1.5 group sm:gap-2"
          >
            <Compass className="h-7 w-7 shrink-0 text-primary group-hover:rotate-45 transition-transform sm:h-8 sm:w-8" />
            <span className="truncate font-display text-lg font-bold tracking-tight text-primary sm:text-2xl">MathVenture</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
          <InstallAppAction compact className="hidden sm:inline-flex" />
          <OfflineStatusIndicator />
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 px-2 font-bold text-muted-foreground sm:gap-2 sm:px-4">
            <Globe className="h-4 w-4 shrink-0" />
            {lang === 'en' ? 'EN' : 'TL'}
          </Button>

          {user && (
            <>
              <div className="h-6 w-px bg-border mx-2 hidden md:block" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 px-2 font-bold text-muted-foreground hover:text-foreground md:px-4">
                    <span className="hidden md:inline-block">{user.full_name}</span>
                    {isTeacher ? <User className="h-5 w-5" /> : (
                      <>
                        <Menu className="h-5 w-5 md:hidden" />
                        <User className="h-5 w-5 hidden md:block" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-bold">
                  {/* Mobile nav items */}
                  <div className="md:hidden">
                    <div className="px-2 py-1.5 text-sm text-muted-foreground border-b border-border/50 mb-1">
                      {user.full_name}
                    </div>
                    {(isTeacher ? [] : navItems).map(item => {
                      const active = isAppNavItemActive(location, item.href, Boolean(isTeacher));
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className={`cursor-pointer flex items-center gap-2 ${active ? 'text-primary bg-primary/10' : ''}`}>
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                  </div>

                  {!isViewingStudent && (
                    <DropdownMenuItem onClick={() => (user?.role === 'teacher' ? setIsLogoutDialogOpen(true) : handleSignOut())} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      <LogoutConfirmDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen} onConfirm={handleSignOut} />
    </header>
  );
}

export function AppLayout({
  children,
  sidebarMode = 'default',
}: {
  children: React.ReactNode;
  sidebarMode?: 'default' | 'hidden';
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();

  if (!user) return <div className="min-h-[100dvh] flex flex-col"><TopNav /><main className="flex-1">{children}</main></div>;

  const isTeacher = user.role === 'teacher';
  const showSidebar = sidebarMode !== 'hidden';

  const teacherNavItems = getTeacherNavItems(t);
  const studentNavItems = STUDENT_NAV_ITEMS.map((item) => ({
    href: item.href,
    label: t(item.labelKey),
    icon: Map,
  }));
  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopNav />
      <div
        className={cn(
          'flex-1',
          showSidebar
            ? 'container mx-auto flex flex-col gap-6 p-4 md:flex-row md:py-8'
            : 'w-full p-0',
        )}
      >
        {showSidebar && (
          <aside className="hidden md:block w-full md:w-64 shrink-0">
            <nav className="flex flex-col gap-2">
              {navItems.map(item => {
                const active = isAppNavItemActive(location, item.href, isTeacher);
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl font-bold cursor-pointer transition-colors whitespace-nowrap',
                      active ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-accent hover:text-accent-foreground text-foreground',
                    )}>
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        <main className={cn('flex-1 min-w-0', !showSidebar && 'h-full')}>
          {children}
        </main>
      </div>
    </div>
  );
}
