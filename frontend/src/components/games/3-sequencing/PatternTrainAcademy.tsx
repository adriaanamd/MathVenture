import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, XCircle, Train } from 'lucide-react';
import { buildPatternRound, type PatternSessions, type PatternRound } from '@/lib/games/pattern-train';

const ITEMS_2D = [
  { a: '\u{1F36A}', b: '\u{1F95B}' },
  { a: '\u{1F34E}', b: '\u{1F350}' },
  { a: '\u{1F369}', b: '\u{1F36A}' },
  { a: '\u{1F431}', b: '\u{1F436}' },
  { a: '\u{1F697}', b: '\u{1F681}' },
];

const ITEMS_3D = [
  { a: '\u{1F534}', b: '\u{1F7E6}', c: '\u{2B50}' },
  { a: '\u{1F981}', b: '\u{1F435}', c: '\u{1F98B}' },
  { a: '\u{1F34C}', b: '\u{1F347}', c: '\u{1F353}' },
];

const ITEMS_HARD = [
  { a: '\u{1F366}', b: '\u{1F36D}', c: '\u{1F353}' },
  { a: '\u{1F388}', b: '\u{1F381}', c: '\u{1F380}' },
  { a: '\u{1F438}', b: '\u{1F427}', c: '\u{1F98B}' },
];

function shuffled<T>(items: readonly T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function PatternTrainAcademy({
  onComplete,
  allowSkip = false,
}: {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}) {
  const [sessions, setSessions] = useState<PatternSessions | null>(null);
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState<PatternRound | null>(null);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [roundSolved, setRoundSolved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [correctItems, setCorrectItems] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  // 'waiting' = offscreen left, 'idle' = on screen, 'exit' = offscreen right
  const [trainStatus, setTrainStatus] = useState<'waiting' | 'idle' | 'exit'>('waiting');

  useEffect(() => {
    setSessions({
      pairs: shuffled(ITEMS_2D),
      trios: shuffled(ITEMS_3D),
      hard: shuffled(ITEMS_HARD),
    });
  }, []);

  useEffect(() => {
    if (sessions) startLevel(1);
  }, [sessions]);

  const startLevel = (nextLevel: number) => {
    if (!sessions) return;

    setLevel(nextLevel);
    setRound(buildPatternRound(nextLevel, sessions));
    setSelectedCar(null);
    setRoundSolved(false);
    setErrorMsg('');
    setTrainStatus('waiting');

    if (nextLevel === 1) {
      setCorrectItems(0);
      setWrongAttempts(0);
    }

    setTimeout(() => setTrainStatus('idle'), 100);
  };

  const handleCarClick = (carIndex: number) => {
    if (!round || trainStatus !== 'idle' || roundSolved) return;

    setSelectedCar(carIndex);

    if (carIndex !== round.oddIndex) {
      setWrongAttempts((previous) => previous + 1);
      setErrorMsg('That carriage fits the pattern. Try another one!');
      setTimeout(() => setErrorMsg(''), 1800);
      return;
    }

    setRoundSolved(true);
    setCorrectItems((previous) => previous + 1);
    setErrorMsg('');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });

    setTimeout(() => {
      setTrainStatus('exit');
      if (level < 11) {
        setTimeout(() => startLevel(level + 1), 800);
      }
    }, 900);
  };

  const getDifficultyStyles = () => {
    if (level <= 5) {
      return { bg: 'bg-emerald-500', text: 'AB Pattern', prompt: 'Which carriage breaks the pattern?' };
    }
    if (level <= 8) {
      return { bg: 'bg-amber-500', text: 'ABC Pattern', prompt: 'Find the carriage that does not belong!' };
    }
    return { bg: 'bg-rose-500', text: 'ABB Pattern', prompt: 'The pattern is trickier—spot the odd carriage!' };
  };

  const isCompleted = trainStatus === 'exit' && level === 11;
  const isPerfect = wrongAttempts === 0;
  const diffStyle = getDifficultyStyles();

  if (!sessions || !round) return null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#bae6fd] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-sky-300 shrink-0 overflow-hidden min-h-[600px]">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-sky-200 flex-wrap gap-4 z-10">
        <h2 className="text-xl md:text-2xl font-bold font-display text-sky-700 uppercase tracking-wide flex items-center gap-2">
          <Train className="w-8 h-8 text-sky-600" /> Pattern Breaker Train
        </h2>
        <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">
          <div className="text-lg md:text-xl font-bold text-slate-700 bg-sky-100 px-4 py-1 rounded-full shadow-sm flex items-center gap-2">
            Level: <span className="text-sky-600">{level}/11</span>
            <span className={`text-sm text-white px-3 py-1 rounded-full shadow-sm ${diffStyle.bg}`}>{diffStyle.text}</span>
          </div>
          {onComplete && allowSkip && (
            <Button variant="outline" className="border-2 border-sky-400 text-sky-700 font-bold hover:bg-sky-50 rounded-xl bg-white w-full justify-center md:w-auto" onClick={() => onComplete?.()}>
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-white/80 border-4 border-sky-300 rounded-3xl p-4 mb-8 shadow-sm text-center w-full max-w-2xl z-10">
        <h3 className="text-2xl md:text-3xl font-bold text-sky-800 drop-shadow-sm">
          {diffStyle.prompt}
        </h3>
        <p className="mt-2 text-base md:text-lg font-semibold text-sky-700">
          Tap the one train carriage that does not belong.
        </p>
      </div>

      {/* Train Track Area */}
      <div className="w-full h-48 md:h-56 relative flex items-end justify-center mb-10 overflow-visible z-10">
        <div className="absolute bottom-0 w-[200%] h-4 bg-slate-700 rounded-full shadow-md" style={{ left: '-50%' }}>
          <div className="w-full h-1 bg-slate-500 mt-1"></div>
        </div>

        <motion.div
          className="flex items-end gap-0.5 sm:gap-1 md:gap-2 absolute bottom-4"
          initial={false}
          animate={{
            x: trainStatus === 'waiting' ? '-150%' : trainStatus === 'idle' ? '0%' : '150%',
          }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
        >
          <div className="text-4xl sm:text-6xl md:text-7xl -mr-1 sm:-mr-2 md:-mr-4 drop-shadow-lg z-20">🚂</div>

          {round.sequence.map((item, index) => {
            const isSelected = selectedCar === index;
            const isCorrect = isSelected && roundSolved;
            const isWrong = isSelected && !roundSolved;

            return (
              <motion.button
                key={`car-${index}`}
                type="button"
                aria-label={`Train carriage ${index + 1}`}
                disabled={roundSolved}
                onClick={() => handleCarClick(index)}
                whileHover={!roundSolved ? { y: -8, scale: 1.05 } : undefined}
                whileTap={!roundSolved ? { scale: 0.95 } : undefined}
                className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl shadow-[0_4px_0_0_#0284c7] border-2 z-10 relative transition-colors
                  ${isCorrect ? 'bg-emerald-100 border-emerald-500 ring-4 ring-emerald-300' : ''}
                  ${isWrong ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-300' : ''}
                  ${!isSelected ? 'bg-white border-sky-600 hover:border-amber-400 hover:bg-amber-50' : ''}
                `}
              >
                {item}
                <span className="absolute -bottom-4 w-full flex justify-center gap-2 text-xs opacity-80" aria-hidden="true">⚫ ⚫</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Feedback & Controls */}
      <div className="h-24 flex flex-col items-center justify-center w-full mt-auto z-10">
        <AnimatePresence mode="wait">
          {errorMsg ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-rose-600 font-bold text-xl md:text-2xl bg-rose-50 px-6 py-4 rounded-full border-2 border-rose-200 shadow-sm text-center"
            >
              <XCircle className="w-8 h-8 shrink-0" /> {errorMsg}
            </motion.div>
          ) : isCompleted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 fixed inset-0 bg-emerald-50 z-50 justify-center"
            >
              <div className="text-7xl">🏆🚂🏆</div>
              <h1 className="text-4xl md:text-5xl font-bold text-emerald-700 drop-shadow-sm">{isPerfect ? 'PATTERN BREAKER MASTER!' : 'PATTERN PRACTICE COMPLETE!'}</h1>
              <p className="text-xl md:text-2xl text-emerald-600 font-medium mb-4">{isPerfect ? 'You found every odd carriage!' : 'Good try! Keep looking for pattern breaks.'}</p>

              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all"
                onClick={allowSkip ? () => startLevel(1) : () => onComplete?.(correctItems, correctItems + wrongAttempts)}
              >
                {allowSkip ? 'Repeat Game' : 'Next Game'} <Play className="ml-2 w-6 h-6 fill-current" />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
