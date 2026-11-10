import { useEffect, useMemo, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import { TeacherClassCard } from './TeacherClassCard';
import { TeacherClassManagementDialog } from './TeacherClassManagementDialog';
import { useClasses, useCreateClass, useUpdateClass } from '@features/classroom/api/hooks';
import type { TeacherClassSummary } from '@/lib/api';
import { OfflinePackPanel } from '@/components/offline/OfflinePackPanel';

export function TeacherClassList() {
  const classesQuery = useClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const [management, setManagement] = useState<{ mode: 'create' | 'rename'; classroom?: TeacherClassSummary } | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const queryData = classesQuery.data;
  const data: { classes: TeacherClassSummary[]; archivedClasses: TeacherClassSummary[] } | null = queryData
    && 'archivedClasses' in queryData
    && Array.isArray(queryData.classes)
    && Array.isArray(queryData.archivedClasses)
    ? {
      classes: queryData.classes as TeacherClassSummary[],
      archivedClasses: queryData.archivedClasses as TeacherClassSummary[],
    }
    : null;
  const activeClasses = useMemo(() => data?.classes ?? [], [data]);
  const archivedClasses = useMemo(() => data?.archivedClasses ?? [], [data]);
  const managementError = createClass.error ?? updateClass.error;

  const submitName = async (name: string) => {
    try {
      if (management?.mode === 'create') await createClass.mutateAsync(name);
      else if (management?.classroom) await updateClass.mutateAsync({ classId: management.classroom.id, action: 'rename', name });
      setManagement(null);
    } catch {
      // The mutation error is rendered in the dialog.
    }
  };

  const unarchive = (classroom: TeacherClassSummary) => {
    updateClass.reset();
    void updateClass.mutateAsync({ classId: classroom.id, action: 'unarchive' });
  };

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <p className="teacher-eyebrow">MathVenture teacher workspace</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--teacher-ink)] sm:text-5xl">My Classes</h1>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--teacher-ink)]/70">Choose a class to manage its students, assignments, and reports.</p>
        </>
      )}
      action={(
        <Button type="button" className="w-full bg-[var(--teacher-terracotta)] text-[var(--teacher-sand)] hover:bg-[var(--teacher-terracotta)]/90 md:w-auto" onClick={() => setManagement({ mode: 'create' })}>
          New class
        </Button>
      )}
    >
      <div className="mb-6">
        <OfflinePackPanel />
      </div>
      {!online && <Card className="mb-6 border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-5 font-semibold text-[var(--teacher-ink)]">You are offline. Class creation and renaming continue locally. To archive or unarchive a class, check internet connection as this is online-only.</Card>}
      {classesQuery.isLoading && <Card className="border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-8 font-semibold text-[var(--teacher-ink)]/70">Loading classes...</Card>}
      {classesQuery.error && <Card role="alert" className="border-[var(--teacher-terracotta)]/35 bg-[var(--teacher-oat)]/55 p-8 font-semibold text-[var(--teacher-ink)]">{(classesQuery.error as Error).message}</Card>}
      {managementError && !management && <Card role="alert" className="mb-6 border-[var(--teacher-terracotta)]/35 bg-[var(--teacher-oat)]/55 p-5 font-semibold text-[var(--teacher-ink)]">{managementError instanceof Error ? managementError.message : String(managementError)}</Card>}
      {!classesQuery.isLoading && !classesQuery.error && !data && <Card className="border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-8 font-semibold text-[var(--teacher-ink)]">Class management is available for teacher accounts.</Card>}
      {data && (
        <div className="grid gap-10">
          <section aria-labelledby="active-classes-heading">
            <div className="flex items-end justify-between gap-4">
              <div><p className="teacher-eyebrow">Current roster spaces</p><h2 id="active-classes-heading" className="mt-2 font-display text-2xl font-bold text-[var(--teacher-ink)]">Active classes</h2></div>
              <span className="text-sm font-bold text-[var(--teacher-ink)]/60">{activeClasses.length} total</span>
            </div>
            {activeClasses.length ? <div className="mt-5 grid gap-5 md:grid-cols-2">{activeClasses.map((classroom) => <TeacherClassCard key={classroom.id} classroom={classroom} onUnarchive={() => unarchive(classroom)} />)}</div> : <Card className="mt-5 border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-8 font-semibold text-[var(--teacher-ink)]/70">No active classes yet. Create your first class to get started.</Card>}
          </section>
          {archivedClasses.length > 0 && <section aria-labelledby="archived-classes-heading"><div><p className="teacher-eyebrow">Kept for reference</p><h2 id="archived-classes-heading" className="mt-2 font-display text-2xl font-bold text-[var(--teacher-ink)]">Archived classes</h2></div><div className="mt-5 grid gap-5 md:grid-cols-2">{archivedClasses.map((classroom) => <TeacherClassCard key={classroom.id} classroom={classroom} onUnarchive={() => unarchive(classroom)} />)}</div></section>}
        </div>
      )}
      <TeacherClassManagementDialog open={management !== null} mode={management?.mode ?? 'create'} classroom={management?.classroom} pending={createClass.isPending || updateClass.isPending} error={managementError instanceof Error ? managementError.message : null} onOpenChange={(open) => { if (!open) { createClass.reset(); updateClass.reset(); setManagement(null); } }} onSubmit={(name) => void submitName(name)} />
    </TeacherWorkspaceBoard>
  );
}
