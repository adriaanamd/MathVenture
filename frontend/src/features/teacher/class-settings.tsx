import { useEffect, useState } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import { useTeacherClassroom, useUpdateClass } from '@features/classroom/api/hooks';
import type { TeacherClassroomSummary } from '@/lib/api';
import { isArchivedClass } from '@features/teacher/model/classes';

export function TeacherClassSettingsPage({ classId }: { classId: string }) {
  const { data, isLoading } = useTeacherClassroom(classId);
  const updateClass = useUpdateClass();
  const classroom = data?.classroom as TeacherClassroomSummary | null | undefined;
  const [name, setName] = useState('');
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);

  useEffect(() => {
    if (classroom?.name) setName(classroom.name);
  }, [classroom?.name]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (isLoading) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Loading class settings...</div>;
  }
  if (!classroom) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Classroom unavailable.</div>;
  }

  const archived = isArchivedClass(classroom);
  const error = updateClass.error instanceof Error ? updateClass.error.message : null;
  const trimmed = name.trim();

  return (
    <TeacherWorkspaceBoard
      classId={classId}
      readOnly={archived}
      heading={(
        <>
          <p className="teacher-eyebrow">MathVenture teacher workspace</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--teacher-ink)] sm:text-5xl">Class settings</h1>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--teacher-ink)]/70">Manage the settings for {classroom.name}.</p>
        </>
      )}
    >
      {!online && (
        <p className="mb-6 max-w-2xl font-semibold text-[var(--teacher-ink)]">You are offline. Renaming remains available. To archive or unarchive a class, check internet connection as this is online-only.</p>
      )}
      {!archived && (
        <section className="teacher-section max-w-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-6 sm:p-8" aria-labelledby="class-name-settings">
          <p className="teacher-eyebrow">Class</p>
          <h2 id="class-name-settings" className="mt-2 font-display text-2xl font-bold text-[var(--teacher-ink)]">Class name</h2>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateClass.mutate({ classId, action: 'rename', name: trimmed });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="class-settings-name">Class name</Label>
              <Input id="class-settings-name" value={name} maxLength={120} required onChange={(event) => setName(event.target.value)} />
            </div>
            {error && <p role="alert" className="text-destructive text-sm font-bold">{error}</p>}
            <Button type="submit" variant="jungle" disabled={updateClass.isPending || !trimmed || trimmed === classroom.name}>
              {updateClass.isPending ? 'Saving...' : 'Save name'}
            </Button>
          </form>
        </section>
      )}
      <section className="teacher-section mt-6 max-w-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-6 sm:p-8" aria-labelledby="class-archive-settings">
        <p className="teacher-eyebrow">Availability</p>
        <h2 id="class-archive-settings" className="mt-2 font-display text-2xl font-bold text-[var(--teacher-ink)]">{archived ? 'Unarchive this class' : 'Archive this class'}</h2>
        <p className="mt-2 text-sm font-semibold text-[var(--teacher-ink)]/70">
          {archived
            ? 'Restore this class so roster, assignments, and class changes are available again.'
            : 'Archived classes stay available for reference, while class changes are disabled.'}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6 border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]"
          disabled={updateClass.isPending}
          onClick={() => updateClass.mutate({ classId, action: archived ? 'unarchive' : 'archive' })}
        >
          {archived ? <ArchiveRestore className="mr-1.5 h-4 w-4" /> : <Archive className="mr-1.5 h-4 w-4" />}
          {archived ? 'Unarchive' : 'Archive'}
        </Button>
        {error && updateClass.variables?.action !== 'rename' && <p role="alert" className="mt-4 text-destructive text-sm font-bold">{error}</p>}
      </section>
    </TeacherWorkspaceBoard>
  );
}
