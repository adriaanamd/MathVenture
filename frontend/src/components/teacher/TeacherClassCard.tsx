import { Link } from 'wouter';
import { ArchiveRestore, Calendar, Users } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import type { TeacherClassSummary } from '@/lib/api';
import { teacherClassPath, isArchivedClass } from '@features/teacher/model/classes';

// Deterministic accent colour from a string
function classAccentColor(name: string) {
  const palette = [
    '#606C38', // moss
    '#C66B3D', // terracotta
    '#C08E3A', // ochre
    '#8B9D83', // sage
    '#B08B6E', // clay
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[hash % palette.length];
}

export function TeacherClassCard({
  classroom,
  onUnarchive,
}: {
  classroom: TeacherClassSummary;
  onUnarchive(): void;
}) {
  const archived = isArchivedClass(classroom);
  const accent = classAccentColor(classroom.name);

  return (
    <Card className="group relative flex min-h-[13rem] flex-col justify-between overflow-hidden border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Top colour accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-[inherit]" style={{ backgroundColor: accent }} />

      <div className="px-6 pt-7 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="teacher-eyebrow">{archived ? 'Archived class' : 'Active class'}</p>
            <h3 className="mt-1.5 truncate font-display text-2xl font-bold text-[var(--teacher-ink)] leading-tight">
              {classroom.name}
            </h3>
          </div>
          {archived && (
            <Badge variant="secondary" className="shrink-0 mt-1">Archived</Badge>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-[var(--teacher-ink)]/65">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {classroom.studentCount} {classroom.studentCount === 1 ? 'student' : 'students'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Created {new Date(classroom.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-6 py-5 mt-auto">
        <Button asChild size="sm" className="bg-[var(--teacher-terracotta)] text-[var(--teacher-sand)] hover:bg-[var(--teacher-terracotta)]/90">
          <Link href={teacherClassPath(classroom.id)}>Open class</Link>
        </Button>
        {archived && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-[var(--teacher-ink)]/70 hover:text-[var(--teacher-ink)]"
              onClick={onUnarchive}
            >
              <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
              Unarchive
            </Button>
        )}
      </div>
    </Card>
  );
}
