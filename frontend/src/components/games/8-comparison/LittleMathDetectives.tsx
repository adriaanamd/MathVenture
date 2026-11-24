import { useEffect, useState } from 'react';
import { Check, ChevronRight, Eye, MousePointerClick, Play, RotateCcw, Sparkles, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  getMathDetectiveStatement,
  isMathDetectiveAnswerCorrect,
  MATH_DETECTIVE_QUESTIONS,
} from '@/lib/games/math-detectives';

const AUDIO_ROOT = '/assets/audio/little-math-detectives';
const AUDIO_CLIPS = {
  start: `${AUDIO_ROOT}/start.m4a`,
  questions: [
    `${AUDIO_ROOT}/question-1.m4a`,
    `${AUDIO_ROOT}/question-2.m4a`,
    `${AUDIO_ROOT}/question-3.m4a`,
    `${AUDIO_ROOT}/question-4.m4a`,
    `${AUDIO_ROOT}/question-5.m4a`,
  ],
  correct: `${AUDIO_ROOT}/correct.m4a`,
  retry: `${AUDIO_ROOT}/retry.m4a`,
} as const;

let activeAudio: HTMLAudioElement | null = null;

function stopAudio() {
  activeAudio?.pause();
  activeAudio = null;
}

function playAudioClip(src: string, onFinished?: () => void) {
  if (typeof window === 'undefined') {
    onFinished?.();
    return;
  }

  stopAudio();
  const audio = new Audio(src);
  activeAudio = audio;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (activeAudio === audio) activeAudio = null;
    onFinished?.();
  };

  audio.preload = 'auto';
  audio.onended = finish;
  audio.onerror = finish;
  void audio.play().catch(finish);
}

interface LittleMathDetectivesProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

function Group({
  label,
  count,
  item,
  accent,
}: {
  label: 'A' | 'B';
  count: number;
  item: string;
  accent: 'orange' | 'sky';
}) {
  return (
    <div
      className={`flex min-h-[190px] flex-1 flex-col items-center rounded-[2rem] border-4 p-3 shadow-[0_6px_0_rgba(15,23,42,0.12)] ${
        accent === 'orange'
          ? 'border-orange-300 bg-orange-50'
          : 'border-sky-300 bg-sky-50'
      }`}
      aria-label={`Pangkat ${label}, ${count} na larawan`}
    >
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-black text-slate-700 shadow-sm">
        {label}
      </div>
      <div className="flex max-w-[240px] flex-wrap content-start justify-center gap-1 text-3xl leading-none sm:text-4xl" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <span key={`${label}-${index}`} className="drop-shadow-sm">{item}</span>
        ))}
      </div>
    </div>
  );
}

export function LittleMathDetectives({ onComplete, allowSkip = false }: LittleMathDetectivesProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [firstAttempt, setFirstAttempt] = useState(true);
  const [questionSolved, setQuestionSolved] = useState(false);
  const [nextReady, setNextReady] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'retry' | ''>('');
  const [isCompleted, setIsCompleted] = useState(false);

  const question = MATH_DETECTIVE_QUESTIONS[questionIndex];
  const statement = getMathDetectiveStatement(question);

  useEffect(() => {
    if (!hasStarted || isCompleted) return;
    playAudioClip(AUDIO_CLIPS.questions[questionIndex]);
  }, [hasStarted, questionIndex, isCompleted]);

  useEffect(() => () => {
    stopAudio();
  }, []);

  const handleStart = () => {
    if (isStarting) return;

    setIsStarting(true);
    playAudioClip(AUDIO_CLIPS.start, () => {
      setIsStarting(false);
      setHasStarted(true);
    });
  };

  const handleAnswer = (answer: boolean) => {
    if (!hasStarted || questionSolved || isCompleted) return;

    if (isMathDetectiveAnswerCorrect(question, answer)) {
      setQuestionSolved(true);
      setNextReady(false);
      setFeedback('correct');
      if (firstAttempt) setScore((previous) => previous + 1);
      playAudioClip(AUDIO_CLIPS.correct, () => setNextReady(true));
      return;
    }

    setFirstAttempt(false);
    setFeedback('retry');
    playAudioClip(AUDIO_CLIPS.retry);
  };

  const handleNext = () => {
    if (!questionSolved || !nextReady) return;

    if (questionIndex === MATH_DETECTIVE_QUESTIONS.length - 1) {
      setIsCompleted(true);
      playAudioClip(AUDIO_CLIPS.correct);
      return;
    }

    setQuestionIndex((previous) => previous + 1);
    setFirstAttempt(true);
    setQuestionSolved(false);
    setNextReady(false);
    setFeedback('');
  };

  const resetGame = () => {
    stopAudio();
    setQuestionIndex(0);
    setScore(0);
    setHasStarted(false);
    setIsStarting(false);
    setFirstAttempt(true);
    setQuestionSolved(false);
    setNextReady(false);
    setFeedback('');
    setIsCompleted(false);
  };

  return (
    <div className="relative mx-auto flex min-h-[620px] w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] border-8 border-amber-200 bg-gradient-to-b from-amber-50 via-white to-sky-100 p-4 shadow-xl md:p-7">
      {!hasStarted && !isCompleted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[2rem] bg-amber-50/95 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border-4 border-amber-300 bg-white p-7 text-center shadow-2xl">
            <div className="mb-2 text-6xl" aria-hidden="true">🔎🎧</div>
            <h2 className="text-3xl font-black text-amber-900">Munting Detektib</h2>
            <p className="mt-3 text-lg font-bold text-amber-700">Pindutin ang magsimula at makinig sa kuwento.</p>
            <Button type="button" size="lg" className="mt-6 rounded-2xl bg-emerald-500 px-8 text-xl font-black text-white hover:bg-emerald-600" onClick={handleStart} disabled={isStarting}>
              <Play className="h-6 w-6 fill-current" aria-hidden="true" />
              {isStarting ? 'Nakikinig...' : 'Magsimula'}
            </Button>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute -right-8 -top-8 text-8xl opacity-20" aria-hidden="true">🔎</div>

      <header className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border-4 border-amber-200 bg-white/90 p-3 shadow-sm md:p-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">🕵️</span>
          <div>
            <h1 className="text-xl font-black text-amber-900 md:text-3xl">Little Math Detectives</h1>
            <p className="font-bold text-amber-700">Munting Detektib ng Matematika</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          <div className="rounded-full bg-amber-100 px-4 py-2 text-lg font-black text-amber-900" aria-label={`Tanong ${questionIndex + 1} sa ${MATH_DETECTIVE_QUESTIONS.length}`}>
            {questionIndex + 1} / {MATH_DETECTIVE_QUESTIONS.length}
          </div>
          {onComplete && allowSkip && (
            <Button type="button" variant="outline" className="rounded-2xl border-2 border-amber-300 bg-white font-bold text-amber-800" onClick={() => onComplete?.()}>
              Laktawan <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>

      <div className="relative z-10 mb-4 flex flex-wrap items-center justify-center gap-3 text-slate-700" aria-label="Mga hakbang sa laro">
        <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm"><Eye className="h-6 w-6 text-sky-600" aria-hidden="true" /><span className="text-2xl" aria-hidden="true">👀</span></div>
        <span className="text-xl font-black" aria-hidden="true">➡️</span>
        <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm"><span className="text-2xl" aria-hidden="true">🔢</span><span className="text-sm font-black">BILANG</span></div>
        <span className="text-xl font-black" aria-hidden="true">➡️</span>
        <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm"><MousePointerClick className="h-6 w-6 text-emerald-600" aria-hidden="true" /><span className="text-2xl" aria-hidden="true">☝️</span></div>
      </div>

      <section className="relative z-10 flex flex-1 flex-col items-center">
        <div className="mb-4 w-full max-w-2xl rounded-3xl border-4 border-sky-200 bg-white/95 p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-3">
            <p className="text-xl font-black text-sky-900 md:text-2xl">Tama ba o mali?</p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full border-2 border-sky-300 bg-white text-sky-700"
              aria-label="Pakinggan muli ang tanong"
              title="Pakinggan muli"
              onClick={() => playAudioClip(AUDIO_CLIPS.questions[questionIndex])}
            >
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-2 text-lg font-black leading-snug text-slate-800 md:text-xl">{statement}</p>
          <p className="mt-2 text-sm font-bold text-slate-500">Pakinggan ang tanong. Tingnan at bilangin ang mga larawan.</p>
        </div>

        <div className="mb-5 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
          <Group label="A" count={question.leftCount} item={question.item} accent="orange" />
          <Group label="B" count={question.rightCount} item={question.item} accent="sky" />
        </div>

        <div className="mb-3 min-h-14 text-center" role="status" aria-live="polite">
          {feedback === 'correct' && <p className="rounded-full bg-emerald-100 px-5 py-3 text-xl font-black text-emerald-700">Tama! ⭐</p>}
          {feedback === 'retry' && <p className="rounded-full bg-rose-100 px-5 py-3 text-xl font-black text-rose-700">Subukan muli 💪</p>}
        </div>

        <div className="mt-auto flex w-full max-w-xl flex-wrap justify-center gap-4">
          <button
            type="button"
            disabled={questionSolved}
            onClick={() => handleAnswer(true)}
            aria-label="Tama"
            className="flex min-h-24 min-w-[140px] flex-1 items-center justify-center gap-3 rounded-3xl border-4 border-emerald-600 bg-emerald-500 px-6 text-3xl font-black text-white shadow-[0_7px_0_#15803d] transition hover:scale-105 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-12 w-12" strokeWidth={4} aria-hidden="true" /> TAMA
          </button>
          <button
            type="button"
            disabled={questionSolved}
            onClick={() => handleAnswer(false)}
            aria-label="Mali"
            className="flex min-h-24 min-w-[140px] flex-1 items-center justify-center gap-3 rounded-3xl border-4 border-rose-600 bg-rose-500 px-6 text-3xl font-black text-white shadow-[0_7px_0_#be123c] transition hover:scale-105 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-12 w-12" strokeWidth={4} aria-hidden="true" /> MALI
          </button>
        </div>

        <div className="mt-4 flex min-h-12 items-center justify-center">
          {questionSolved && (
            <Button type="button" size="lg" disabled={!nextReady} className="rounded-2xl bg-sky-600 px-7 text-lg font-black text-white hover:bg-sky-700" onClick={handleNext}>
              {questionIndex === MATH_DETECTIVE_QUESTIONS.length - 1 ? 'Tingnan ang resulta' : 'Susunod na tanong'}
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </Button>
          )}
        </div>
      </section>

      {isCompleted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-amber-50/95 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border-4 border-amber-300 bg-white p-7 text-center shadow-2xl">
            <div className="mb-2 text-6xl" aria-hidden="true">🔎🏆</div>
            <h2 className="text-3xl font-black text-amber-900">Napakahusay!</h2>
            <p className="mt-2 text-lg font-bold text-amber-700">Natapos mo ang limang tanong.</p>
            <p className="mt-4 rounded-2xl bg-emerald-100 px-4 py-3 text-2xl font-black text-emerald-700">Unang sagot na tama: {score} / {MATH_DETECTIVE_QUESTIONS.length}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button type="button" variant="outline" className="rounded-2xl border-2 border-amber-300 font-bold text-amber-800" onClick={resetGame}>
                <RotateCcw className="h-5 w-5" aria-hidden="true" /> Maglaro muli
              </Button>
              {onComplete && (
                <Button type="button" className="rounded-2xl bg-emerald-500 font-black text-white hover:bg-emerald-600" onClick={() => onComplete?.(score, MATH_DETECTIVE_QUESTIONS.length)}>
                  Susunod na laro <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              )}
            </div>
            <Sparkles className="mx-auto mt-5 h-7 w-7 text-amber-400" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
}
