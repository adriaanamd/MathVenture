
import { Button, Card } from "@/components/ui";
import type { StudentClassroomSummary } from "@/lib/api";
import type { PortalRailSummary } from "@features/student/model/portal";
import { useLanguage } from "@features/i18n/context";

export function StudentPortalRail({
  summary,
  classroom,
  onOpenAssignment,
  onOpenClassroom,
}: {
  summary: PortalRailSummary;
  classroom: StudentClassroomSummary | null;
  onOpenAssignment: (href: string) => void;
  onOpenClassroom: () => void;
}) {
  const { t } = useLanguage();

  return (
    <aside className="flex flex-col gap-4">
      {summary.nextAction.kind === "assignment" && (
        <Card className="student-rail-card student-rail-card--next rounded-[28px] p-5 md:p-6">
          <p className="student-rail-card__eyebrow text-xs font-extrabold uppercase tracking-[0.16em]">
            {t("student.portal.nextAssignment")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold capitalize">
            {summary.nextAction.lessonId}
          </h2>
          <p className="mt-1 text-lg font-extrabold text-primary">
            {summary.nextAction.gameTitle ?? "Classroom quiz"}
          </p>
          <p className="mt-1 text-base font-bold">{t("student.portal.playThisNext")}</p>
          <Button className="mt-5 min-h-14 w-full rounded-2xl text-lg" variant="jungle" onClick={() => onOpenAssignment(summary.nextAction.href)}>
            {t("student.playNow")}
          </Button>
        </Card>
      )}

      <Card className="student-rail-card rounded-[28px] p-5 md:p-6">
        <p className="student-rail-card__eyebrow text-xs font-extrabold uppercase tracking-[0.16em]">
          Your Classroom
        </p>
        {classroom ? (
          <button
            type="button"
            className="student-rail-card__classroom mt-3 min-h-16 w-full rounded-2xl px-4 py-3 text-left"
            onClick={onOpenClassroom}
            aria-label={`Open classroom with ${classroom.teacherName}`}
          >
            <span className="block text-lg font-extrabold">Classroom</span>
            <span className="block text-sm font-bold opacity-75">{classroom.teacherName}</span>
          </button>
        ) : (
          <p className="mt-3 text-sm font-bold opacity-75">
            Your classroom will appear here once your teacher adds you.
          </p>
        )}
      </Card>

      <Card className="student-rail-card rounded-[28px] p-5 md:p-6">
        <p className="student-rail-card__eyebrow text-xs font-extrabold uppercase tracking-[0.16em]">
          {t("student.portal.myProgress")}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="student-progress-chip student-progress-chip--ochre rounded-2xl px-2 py-4 text-center">
            <span className="block text-2xl font-extrabold">{summary.streakDays}</span>
            <span className="text-xs font-bold">{t("student.portal.days")}</span>
          </div>
          <div className="student-progress-chip student-progress-chip--sage rounded-2xl px-2 py-4 text-center">
            <span className="block text-2xl font-extrabold">{summary.completedLessons}</span>
            <span className="text-xs font-bold">{t("student.portal.done")}</span>
          </div>
          <div className="student-progress-chip student-progress-chip--clay rounded-2xl px-2 py-4 text-center">
            <span className="block text-2xl font-extrabold">{summary.recentScorePct ?? "--"}</span>
            <span className="text-xs font-bold">{t("student.portal.recent")}</span>
          </div>
        </div>
      </Card>
    </aside>
  );
}
