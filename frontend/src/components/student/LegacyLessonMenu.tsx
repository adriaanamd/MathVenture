import { useMemo, useState } from "react";

import { Button } from "@/components/ui";
import type { PortalTopicEntry, PortalTopicId } from "@features/student/model/portal";
import { cn } from '@shared/utils';
import { useLanguage } from "@features/i18n/context";

const headerAssets = [
  { key: "let", src: "/assets/images/1let.png", fallback: "Let's Learn!" },
  { key: "lets", src: "/assets/images/1lets.png", fallback: "Tayo ay Matuto!" },
] as const;

export function LegacyLessonMenu({
  topics,
  highlightedLessonId,
  onSelect,
  showStatus = true,
}: {
  topics: PortalTopicEntry[];
  highlightedLessonId: PortalTopicId | null;
  onSelect: (href: string) => void;
  showStatus?: boolean;
}) {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const { t } = useLanguage();

  const topicState = useMemo(() => {
    return topics.map((topic) => ({
      ...topic,
      isBroken: brokenImages[topic.id] === true,
    }));
  }, [brokenImages, topics]);

  return (
    <section className="student-lesson-map relative z-10 flex min-h-[560px] flex-col gap-4 rounded-[28px] p-3 md:p-5">
      <header className="student-lesson-map__header grid gap-3 rounded-[24px] p-3 md:grid-cols-2 md:items-center md:p-4">
        {headerAssets.map((asset) => {
          const broken = brokenImages[asset.key] === true;

          return broken ? (
            <div
              key={asset.key}
              className="rounded-2xl bg-white/80 px-4 py-3 text-center text-xl font-extrabold text-primary shadow-sm"
            >
              {asset.fallback}
            </div>
          ) : (
            <img
              key={asset.key}
              src={asset.src}
              alt={asset.fallback}
              className="w-full object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.16)]"
              onError={() => setBrokenImages((current) => ({ ...current, [asset.key]: true }))}
            />
          );
        })}
      </header>

      <div className="grid gap-3">
        {topicState.length === 0 ? (
          <div className="rounded-[22px] bg-white/80 px-5 py-8 text-center shadow-sm">
            <p className="text-lg font-extrabold text-primary">No classroom quizzes yet</p>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              Your teacher&apos;s assigned quizzes will appear here.
            </p>
          </div>
        ) : topicState.map((topic) => {
          const isHighlighted = highlightedLessonId === topic.id;

          return (
            <Button
              key={topic.id}
              type="button"
              variant="ghost"
              onClick={() => onSelect(topic.href)}
              aria-label={showStatus
                ? `${topic.fallbackLabel} — ${topic.gameTitle ?? "Classroom quiz"}: ${topic.isCompleted ? t("student.status.finished") : t("student.status.assigned")}`
                : `${topic.fallbackLabel} — ${topic.gameTitle ?? "Classroom quiz"}`}
              className={cn(
                "student-trail-stop group grid min-h-[72px] items-center gap-3 rounded-[22px] border-2 px-3 py-2 text-left transition-transform hover:-translate-y-0.5 md:min-h-[80px] md:px-4",
                showStatus
                  ? "grid-cols-[2.75rem_minmax(0,1fr)_auto] md:grid-cols-[3rem_minmax(0,1fr)_auto]"
                  : "grid-cols-[2.75rem_minmax(0,1fr)] md:grid-cols-[3rem_minmax(0,1fr)]",
                isHighlighted && "student-trail-stop--highlighted ring-4",
              )}
            >
              <span className="student-trail-stop__number flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold shadow-sm md:h-12 md:w-12">
                {topic.lessonNumber}
              </span>

              <div className="min-w-0">
                {!topic.isBroken && (
                  <img
                    src={topic.assetSrc}
                    alt={topic.fallbackLabel}
                    className="max-h-8 w-full object-contain object-left drop-shadow-[0_6px_8px_rgba(0,0,0,0.18)]"
                    onError={() => setBrokenImages((current) => ({ ...current, [topic.id]: true }))}
                  />
                )}
                <span className="student-trail-stop__label block truncate text-base font-extrabold tracking-tight">
                  {topic.fallbackLabel}
                </span>
                <span className="student-trail-stop__game block truncate text-sm font-bold opacity-75">
                  {topic.gameTitle ?? "Classroom quiz"}
                </span>
              </div>

              {showStatus && (
                <span className="student-trail-stop__status whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold md:text-sm">
                  {topic.isCompleted ? t("student.status.finished") : t("student.status.assigned")}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
