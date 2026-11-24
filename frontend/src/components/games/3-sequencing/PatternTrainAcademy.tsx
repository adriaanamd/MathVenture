import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, XCircle, Train } from 'lucide-react';
import { scoreByPosition } from '@/lib/games/sequence-scoring';

const ITEMS_2D = [{a:"🍰",b:"🧆"}, {a:"🍎",b:"🍐"}, {a:"🍩",b:"🍪"}, {a:"🐱",b:"🐶"}, {a:"🚗",b:"🚁"}];
const ITEMS_3D = [{a:"🔴",b:"🟦",c:"⭐"}, {a:"🦁",b:"🐵",c:"🐘"}, {a:"🍌",b:"🍇",c:"🍓"}];
const ITEMS_HARD = [{a:"🍦",b:"🍭"}, {a:"🎈",b:"🎁"}, {a:"🐸",b:"🐥"}];

export function PatternTrainAcademy({ onComplete, allowSkip = false }: { onComplete?: (score?: number, maxScore?: number) => void; allowSkip?: boolean }) {
  const [sessions, setSessions] = useState<{ s2: typeof ITEMS_2D, s3: typeof ITEMS_3D, sh: typeof ITEMS_HARD } | null>(null);
  
  const [level, setLevel] = useState(1);
  const [pattern, setPattern] = useState<string[]>([]);
  const [missingIndices, setMissingIndices] = useState<number[]>([]);
  const [filledSlots, setFilledSlots] = useState<{ [key: number]: string }>({});
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [correctItems, setCorrectItems] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  
  // 'waiting' = offscreen left, 'idle' = on screen, 'exit' = offscreen right
  const [trainStatus, setTrainStatus] = useState<'waiting' | 'idle' | 'exit'>('waiting');

  useEffect(() => {
      const s2 = [...ITEMS_2D].sort(() => Math.random() - 0.5);
      const s3 = [...ITEMS_3D].sort(() => Math.random() - 0.5);
      const sh = [...ITEMS_HARD].sort(() => Math.random() - 0.5);
      setSessions({ s2, s3, sh });
  }, []);

  useEffect(() => {
      if (sessions) startLevel(1);
  }, [sessions]);

  const startLevel = (lvl: number) => {
    setLevel(lvl);
    setTrainStatus('waiting');
    setFilledSlots({});
    setErrorMsg('');
    if (lvl === 1) {
        setCorrectItems(0);
        setWrongAttempts(0);
    }

    let pat: string[] = [];
    let missing: number[] = [];

    if (lvl <= 5) {
        const pair = sessions!.s2[lvl - 1];
        pat = [pair.a, pair.b, pair.a, pair.b, pair.a, pair.b];
        missing = [[2, 4, 5][Math.floor(Math.random() * 3)]];
    } else if (lvl <= 8) {
        const trio = sessions!.s3[lvl - 6];
        pat = [trio.a, trio.b, trio.c, trio.a, trio.b, trio.c];
        missing = [[3, 4, 5][Math.floor(Math.random() * 3)]];
    } else {
        const pair = sessions!.sh[lvl - 9];
        pat = [pair.a, pair.b, pair.a, pair.b, pair.a, pair.b];
        missing = [2, 4]; // hard mode has 2 missing!
    }

    setPattern(pat);
    setMissingIndices(missing);
    setActiveSlot(missing[0]);

    const uniqueChoices = Array.from(new Set(pat)).sort(() => Math.random() - 0.5);
    setChoices(uniqueChoices);

    setTimeout(() => setTrainStatus('idle'), 100);
  };

  const handleChoiceClick = (item: string) => {
    if (activeSlot === null || trainStatus !== 'idle') return;

    if (allowSkip === false) {
        const newFilled = { ...filledSlots, [activeSlot]: item };
        setFilledSlots(newFilled);
        setErrorMsg('');

        const remaining = missingIndices.filter(i => !newFilled[i]);
        if (remaining.length > 0) {
            setActiveSlot(remaining[0]);
            return;
        }

        const expected = missingIndices.map(i => pattern[i]);
        const placed = missingIndices.map(i => newFilled[i]);
        const levelScore = scoreByPosition(placed, expected);
        setCorrectItems(prev => prev + levelScore);
        setWrongAttempts(prev => prev + missingIndices.length - levelScore);
        setActiveSlot(null);
        if (levelScore === expected.length) {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        }
        setTimeout(() => {
            setTrainStatus('exit');
            if (level < 11) {
                startLevel(level + 1);
            }
        }, 1000);
        return;
    }

    if (item === pattern[activeSlot]) {
        // Correct!
        const newFilled = { ...filledSlots, [activeSlot]: item };
        setFilledSlots(newFilled);
        setCorrectItems(prev => prev + 1);

        const remaining = missingIndices.filter(i => !newFilled[i]);
        if (remaining.length > 0) {
            setActiveSlot(remaining[0]);
        } else {
            // Level complete!
            setActiveSlot(null);
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            
            setTimeout(() => {
                setTrainStatus('exit');
                setTimeout(() => {
                    if (level < 11) {
                        startLevel(level + 1);
                    }
                }, 800);
            }, 1000);
        }
    } else {
        setWrongAttempts(prev => prev + 1);
        setErrorMsg('❌ Oops! Try the other one!');
        setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const getDifficultyStyles = () => {
      if (level <= 5) return { bg: 'bg-emerald-500', text: 'Easy Mode', prompt: 'Fill the empty car!' };
      if (level <= 8) return { bg: 'bg-amber-500', text: '3 Items!', prompt: '3 different items now!' };
      return { bg: 'bg-rose-500', text: 'Hard Mode 🧠', prompt: 'Find both missing items!' };
  };

  const isCompleted = trainStatus === 'exit' && level === 11;
  const isPerfect = allowSkip || wrongAttempts === 0;
  const diffStyle = getDifficultyStyles();

  if (!sessions) return null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#bae6fd] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-sky-300 shrink-0 overflow-hidden min-h-[600px]">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-sky-200 flex-wrap gap-4 z-10">
        <h2 className="text-xl md:text-2xl font-bold font-display text-sky-700 uppercase tracking-wide flex items-center gap-2">
          <Train className="w-8 h-8 text-sky-600" /> Pattern Academy
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
      </div>

      {/* Train Track Area */}
      <div className="w-full h-48 md:h-56 relative flex items-end justify-center mb-10 overflow-visible z-10">
         {/* Track Line */}
         <div className="absolute bottom-0 w-[200%] h-4 bg-slate-700 rounded-full shadow-md" style={{ left: '-50%' }}>
             <div className="w-full h-1 bg-slate-500 mt-1"></div>
         </div>

         {/* The Train */}
         <motion.div 
            className="flex items-end gap-0.5 sm:gap-1 md:gap-2 absolute bottom-4"
            initial={false}
            animate={{ 
                x: trainStatus === 'waiting' ? '-150%' : trainStatus === 'idle' ? '0%' : '150%' 
            }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
         >
             <div className="text-4xl sm:text-6xl md:text-7xl -mr-1 sm:-mr-2 md:-mr-4 drop-shadow-lg z-20">🚂</div>
             
             {pattern.map((item, idx) => {
                 const isMissing = missingIndices.includes(idx);
                 const isFilled = isMissing && filledSlots[idx];
                 const isActive = isMissing && activeSlot === idx;

                 if (isMissing && !isFilled) {
                     return (
                         <div 
                             key={idx}
                             className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold cursor-pointer transition-all border-4 z-10 bg-rose-50 text-rose-400 relative
                                ${isActive ? 'border-amber-400 bg-amber-50 scale-110 shadow-lg' : 'border-rose-400 border-dashed'}
                             `}
                             onClick={() => setActiveSlot(idx)}
                         >
                             ?
                             {/* Train Wheels */}
                             <div className="absolute -bottom-4 w-full flex justify-center gap-2 text-xs opacity-80">⚫ ⚫</div>
                         </div>
                     );
                 }

                 return (
                     <div 
                         key={idx}
                         className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl shadow-[0_4px_0_0_#0284c7] border-2 border-sky-600 z-10 relative"
                     >
                         {isFilled ? filledSlots[idx] : item}
                         {/* Train Wheels */}
                         <div className="absolute -bottom-4 w-full flex justify-center gap-2 text-xs opacity-80">⚫ ⚫</div>
                     </div>
                 );
             })}
         </motion.div>
      </div>

      {/* Available Choices */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 w-full max-w-3xl mb-8 min-h-[100px] z-10">
        <AnimatePresence>
          {choices.map((choice) => (
              <motion.button
                key={`choice-${choice}`}
                layout
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChoiceClick(choice)}
                className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex flex-col items-center justify-center text-4xl shadow-[0_6px_0_0_#d97706] border-4 border-amber-400 cursor-pointer active:translate-y-2 active:shadow-none transition-all"
              >
                 {choice}
              </motion.button>
          ))}
        </AnimatePresence>
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
              className="flex items-center gap-2 text-rose-600 font-bold text-xl md:text-2xl bg-rose-50 px-6 py-4 rounded-full border-2 border-rose-200 shadow-sm"
            >
              <XCircle className="w-8 h-8" /> {errorMsg}
            </motion.div>
          ) : isCompleted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 fixed inset-0 bg-emerald-50 z-50 justify-center"
            >
              <div className="text-7xl">👑🏆👑</div>
              <h1 className="text-4xl md:text-5xl font-bold text-emerald-700 drop-shadow-sm">{isPerfect ? 'GRAND TRAIN MASTER!' : 'PATTERN PRACTICE COMPLETE!'}</h1>
              <p className="text-xl md:text-2xl text-emerald-600 font-medium mb-4">{isPerfect ? 'You beat every pattern!' : 'Good try! Keep practicing your patterns.'}</p>
              
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
