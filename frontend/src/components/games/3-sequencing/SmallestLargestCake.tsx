import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle } from 'lucide-react';
import { scoreByPosition } from '@/lib/games/sequence-scoring';

const SIZES = [1, 2, 3, 4];

const Cake = ({ size }: { size: number }) => {
  return (
    <div className="flex flex-col items-center drop-shadow-md pb-1 sm:pb-2 w-full">
      {/* Cherry on top */}
      <div className="text-2xl sm:text-3xl md:text-4xl z-10 -mb-1.5 sm:-mb-2 relative drop-shadow-sm">
         🍒
      </div>
      {/* Layers */}
      {Array.from({ length: size }).map((_, i) => (
         <div 
            key={i} 
            className="w-12 h-5 sm:w-20 sm:h-6 md:w-24 md:h-8 max-w-full bg-pink-400 rounded-md sm:rounded-lg border-2 border-pink-600 shadow-inner mt-0.5 sm:mt-1 relative overflow-hidden"
            style={{ zIndex: 5 - i }} // ensure correct stacking context if they overlap
         >
            {/* Frosting drips */}
            <div className="absolute top-0 left-1.5 sm:left-2 w-2.5 sm:w-4 h-2 sm:h-3 bg-pink-200 rounded-b-full opacity-80"></div>
            <div className="absolute top-0 right-1.5 sm:right-3 w-2 sm:w-3 h-2.5 sm:h-4 bg-pink-200 rounded-b-full opacity-80"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 sm:w-5 h-1.5 sm:h-2 bg-pink-200 rounded-b-full opacity-80"></div>
         </div>
      ))}
    </div>
  );
}

export function SmallestLargestCake({ onComplete, allowSkip = false }: { onComplete?: (score?: number, maxScore?: number) => void; allowSkip?: boolean }) {
  const [shuffled, setShuffled] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);
  const [correctItems, setCorrectItems] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  useEffect(() => {
    startRound();
  }, []);

  const startRound = () => {
    let newShuffled = [...SIZES].sort(() => Math.random() - 0.5);
    while (JSON.stringify(newShuffled) === JSON.stringify(SIZES)) {
      newShuffled = [...SIZES].sort(() => Math.random() - 0.5);
    }
    setShuffled(newShuffled);
    setCurrentIndex(0);
    setPlaced([]);
    setErrorMsg('');
    setCorrectItems(0);
    setWrongAttempts(0);
  };

  const handleCakeClick = (size: number) => {
    if (currentIndex >= SIZES.length) return;

    if (allowSkip === false) {
      const nextPlaced = [...placed, size];
      const nextScore = scoreByPosition(nextPlaced, SIZES);
      setPlaced(nextPlaced);
      setCurrentIndex(nextPlaced.length);
      setCorrectItems(nextScore);
      setWrongAttempts(nextPlaced.length - nextScore);
      setErrorMsg('');
      if (nextPlaced.length === SIZES.length) {
        setScore(nextScore);
        if (nextScore === SIZES.length) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      }
      return;
    }

    if (size === SIZES[currentIndex]) {
      // Correct!
      setCurrentIndex(prev => prev + 1);
      setCorrectItems(prev => prev + 1);
      setErrorMsg('');
      if (currentIndex + 1 === SIZES.length) {
        setScore(s => s + 1);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      // Wrong!
      setWrongAttempts(prev => prev + 1);
      setErrorMsg('❌ Oops! Piliin ang pinakamaliit na cake na susunod!');
      setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const handleRemovePlaced = (index: number) => {
    if (allowSkip || index >= placed.length) return;
    const nextPlaced = placed.filter((_, placedIndex) => placedIndex !== index);
    const nextScore = scoreByPosition(nextPlaced, SIZES);
    setPlaced(nextPlaced);
    setCurrentIndex(nextPlaced.length);
    setCorrectItems(nextScore);
    setWrongAttempts(nextPlaced.length - nextScore);
    setScore(0);
    setErrorMsg('');
  };

  const isCompleted = currentIndex === SIZES.length;
  const isPerfect = allowSkip || wrongAttempts === 0;
  const slotSizes = allowSkip === false ? [...placed, ...SIZES.slice(placed.length)] : SIZES;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#ffe6f0] p-4 md:p-8 rounded-3xl md:rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-pink-200 shrink-0 min-h-[520px] md:min-h-[600px]">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4 md:mb-6 bg-white/80 backdrop-blur-sm p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-pink-100 flex-wrap gap-3 md:gap-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-display text-pink-700 uppercase tracking-wide flex items-center gap-2">
          🎂 Smallest to Biggest Cake
        </h2>
        <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">
          <div className="text-base sm:text-lg md:text-xl font-bold text-slate-700">Score: <span className="text-pink-600">{score}</span></div>
          {onComplete && allowSkip && (
            <Button variant="outline" className="border-2 border-pink-300 text-pink-700 font-bold hover:bg-pink-50 rounded-xl w-full justify-center md:w-auto" onClick={() => onComplete?.()}>
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-white/60 border-4 border-pink-300 rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 mb-6 md:mb-8 shadow-sm text-center w-full max-w-2xl">
         <h3 className="text-lg sm:text-xl md:text-3xl font-bold text-pink-800 drop-shadow-sm break-words">
            Ayusin mula sa <span className="text-rose-500">PINAKAMALIIT</span> papuntang <span className="text-fuchsia-600">PINAKAMALAKI!</span>
         </h3>
      </div>

      {/* Target Area (Placed items) */}
      <div className="grid grid-cols-4 items-end justify-items-center gap-2 sm:gap-4 md:gap-8 mb-6 md:mb-10 w-full max-w-3xl bg-white/40 p-3 sm:p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-4 border-dashed border-pink-400 min-h-[150px] sm:min-h-[180px] md:min-h-[200px]">
        <AnimatePresence>
          {/* Placed Cakes */}
          {slotSizes.slice(0, currentIndex).map((size, index) => (
            <motion.button
              type="button"
              key={`placed-${size}`}
              layout
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              onClick={allowSkip === false ? () => handleRemovePlaced(index) : undefined}
              disabled={allowSkip}
              aria-label={`Remove placed cake of size ${size}`}
              title={allowSkip === false ? 'Tap to remove this cake' : undefined}
              className="relative w-full max-w-[7rem] flex flex-col items-center justify-end border-b-4 border-pink-200/50 pb-2 px-1 sm:px-2"
            >
               <Cake size={size} />
               {allowSkip === false && <XCircle className="absolute -right-1 top-0 sm:right-0 w-4 h-4 sm:w-5 sm:h-5 text-rose-500/70" />}
            </motion.button>
          ))}
          {/* Empty Slots */}
          {SIZES.slice(currentIndex).map((size) => (
            <motion.div
              key={`empty-${size}`}
              className="w-full max-w-[7rem] h-24 sm:h-28 md:h-32 bg-pink-50/50 rounded-xl border-2 sm:border-4 border-dashed border-pink-300 flex items-center justify-center"
            >
               <div className="text-pink-300/60 font-bold text-xs sm:text-sm tracking-widest">SLOT</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Available Items */}
      <div className={`flex flex-wrap items-end justify-center gap-3 sm:gap-6 md:gap-10 w-full max-w-3xl ${isCompleted ? 'mb-2 min-h-0' : 'mb-6 md:mb-8 min-h-[120px] sm:min-h-[160px]'}`}>
        <AnimatePresence>
          {shuffled.map((size) => {
            const isPlaced = allowSkip === false ? placed.includes(size) : SIZES.indexOf(size) < currentIndex;
            if (isPlaced) return null;

            return (
              <motion.button
                key={`avail-${size}`}
                layout
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, y: -10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCakeClick(size)}
                className="bg-white/80 hover:bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border-4 border-pink-300 shadow-[0_6px_0_0_#f9a8d4] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-end min-h-[110px] sm:min-h-[140px]"
              >
                 <Cake size={size} />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Feedback & Controls */}
      <div className="min-h-[6rem] py-2 flex flex-col items-center justify-center w-full mt-auto">
        <AnimatePresence mode="wait">
          {errorMsg ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-rose-600 font-bold text-base sm:text-xl md:text-2xl bg-rose-50 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-full border-2 border-rose-200 shadow-sm text-center"
            >
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" /> {errorMsg}
            </motion.div>
          ) : isCompleted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-pink-700 font-bold text-lg sm:text-2xl md:text-3xl bg-pink-50 px-5 sm:px-8 py-3 sm:py-4 rounded-3xl sm:rounded-full border-2 border-pink-200 shadow-md text-center">
                {isPerfect ? <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" /> : <XCircle className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" />} {isPerfect ? '🎉 Yummy! Correct order!' : 'Good try! Keep practicing.'}
              </div>
              <Button 
                size="lg" 
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-5 sm:py-6 rounded-full shadow-[0_4px_0_0_#ec4899] active:translate-y-1 active:shadow-none transition-all"
                onClick={allowSkip ? startRound : () => onComplete?.(correctItems, correctItems + wrongAttempts)}
              >
                {allowSkip ? 'Play Again' : 'Next Game'} <Play className="ml-2 w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

    </div>
  );
}
