import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui';
import { useAuth, signOut } from '@/lib/auth';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';
import { useLanguage } from '@features/i18n/context';
import { TEACHER_NAV_ITEMS, getTeacherWorkspaceNavItems, isTeacherNavActive } from '@features/teacher/model/navigation';
import { cn } from '@shared/utils';
import { BookOpen, ClipboardList, Home, LogOut, Menu, Settings, Users, X } from 'lucide-react';

const NAV_ICONS: Record<string, React.ReactNode> = {
  'teacher.today': <Home className="h-4 w-4 shrink-0" />,
  'teacher.students': <Users className="h-4 w-4 shrink-0" />,
  'teacher.assignments': <ClipboardList className="h-4 w-4 shrink-0" />,
  'teacher.reports': <BookOpen className="h-4 w-4 shrink-0" />,
  'teacher.classes': <Home className="h-4 w-4 shrink-0" />,
  'teacher.settings': <Settings className="h-4 w-4 shrink-0" />,
};

function TeacherNavLinks({
  location,
  classId,
  onNavigate,
}: {
  location: string;
  classId?: string;
  onNavigate?(): void;
}) {
  const { t } = useLanguage();
  const items = classId ? getTeacherWorkspaceNavItems(classId) : TEACHER_NAV_ITEMS;

  return (
    <>
      {items.map((item) => {
        const active = isTeacherNavActive(location, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span
              className={cn(
                'teacher-nav-item',
                active ? 'teacher-nav-item-active' : '',
              )}
            >
              {NAV_ICONS[item.labelKey] ?? null}
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </>
  );
}

export function TeacherSidebar({ classId }: { classId?: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const [logoutOpen, setLogoutOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const initials = user?.full_name?.trim().slice(0, 2).toUpperCase() ?? 'T';

  const identity = (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--teacher-moss)] text-sm font-extrabold tracking-wide text-[var(--teacher-sand)] shadow-sm">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-[var(--teacher-moss)]/70">Teacher</p>
        <p className="truncate font-display text-base font-bold leading-tight text-[var(--teacher-ink)]">
          {user?.full_name ?? 'Teacher'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[280px] flex-col border-r border-[var(--teacher-moss)]/20 bg-[var(--teacher-sand)] p-5 lg:flex">
        <div className="rounded-2xl border border-[var(--teacher-moss)]/15 bg-[var(--teacher-oat)]/30 px-4 py-3">
          {identity}
        </div>
        <nav aria-label="Teacher navigation" className="mt-6 grid gap-1">
          <TeacherNavLinks location={location} classId={classId} />
        </nav>
        <div className="mt-auto border-t border-[var(--teacher-moss)]/20 pt-4">
          <button
            type="button"
            className="teacher-nav-item w-full text-[var(--teacher-ink)]/70 hover:text-[var(--teacher-ink)]"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t('common.logout')}
          </button>
        </div>
      </aside>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          'fixed right-4 top-[4.75rem] z-40 border-[var(--teacher-moss)]/30 bg-[var(--teacher-sand)] text-[var(--teacher-ink)] lg:hidden',
          mobileOpen && 'hidden',
        )}
        aria-expanded={mobileOpen}
        aria-controls="teacher-mobile-nav"
        aria-label={mobileOpen ? 'Close teacher navigation' : 'Open teacher navigation'}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X /> : <Menu />}
      </Button>

      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--teacher-ink)]/35"
            aria-label="Close teacher navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            id="teacher-mobile-nav"
            className="relative flex h-full w-[min(88vw,22rem)] flex-col overflow-y-auto border-r border-[var(--teacher-moss)]/20 bg-[var(--teacher-sand)] p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 rounded-2xl border border-[var(--teacher-moss)]/15 bg-[var(--teacher-oat)]/30 px-4 py-3">
                {identity}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Close teacher navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X />
              </Button>
            </div>
            <nav aria-label="Teacher navigation" className="mt-6 grid gap-1">
              <TeacherNavLinks location={location} classId={classId} onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="mt-auto border-t border-[var(--teacher-moss)]/20 pt-4">
              <button
                type="button"
                className="teacher-nav-item w-full text-[var(--teacher-ink)]/70 hover:text-[var(--teacher-ink)]"
                onClick={() => setLogoutOpen(true)}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {t('common.logout')}
              </button>
            </div>
          </aside>
        </div>
      )}

      <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} onConfirm={handleSignOut} />
    </>
  );
}
