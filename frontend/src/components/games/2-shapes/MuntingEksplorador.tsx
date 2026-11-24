import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, ChevronRight, RotateCcw, Sparkles, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  isLittleExplorerAnswerCorrect,
  LITTLE_EXPLORER_ROUNDS,
  type ExplorerItem,
  type LittleExplorerRound,
} from '@/lib/games/little-explorer';

const AUDIO_ROOT = '/assets/audio/munting-eksplorador';
const AUDIO_CLIPS = {
  ask: `${AUDIO_ROOT}/ask.m4a`,
  correct: `${AUDIO_ROOT}/correct.m4a`,
  wrong: `${AUDIO_ROOT}/wrong.m4a`,
} as const;

const COLORS = ['#ffb54b', '#6cc9ef', '#f58fae', '#9bd47d'];
const MELODY = [72, 76, 79, 76, 74, 77, 81, 77, 76, 79, 84, 79, 77, 74, 79, 0, 72, 76, 79, 81, 79, 76, 74, 0, 77, 81, 79, 74, 76, 74, 72, 0];
const BASS = [48, 50, 52, 55, 48, 48, 53, 55];

type MusicState = {
  context: AudioContext;
  gain: GainNode;
  timer: number | null;
  step: number;
  active: boolean;
};

function playMusicNote(state: MusicState, note: number, time: number, duration: number, volume: number) {
  if (!note) return;
  const oscillator = state.context.createOscillator();
  const gain = state.context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(gain);
  gain.connect(state.gain);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.01);
}

function musicTick(state: MusicState) {
  if (!state.active || state.context.state !== 'running') return;
  const time = state.context.currentTime + 0.025;
  playMusicNote(state, MELODY[state.step % MELODY.length], time, 0.25, 0.19);
  if (state.step % 4 === 0) {
    playMusicNote(state, BASS[Math.floor(state.step / 4) % BASS.length], time, 0.48, 0.13);
  }
  state.step += 1;
}

function setMusicVolume(state: MusicState | null, volume: number) {
  if (!state) return;
  const time = state.context.currentTime;
  state.gain.gain.cancelScheduledValues(time);
  state.gain.gain.setTargetAtTime(volume, time, 0.045);
}

function startMusic(musicRef: { current: MusicState | null }) {
  if (typeof window === 'undefined') return;

  try {
    if (!musicRef.current) {
      const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;
      const context = new AudioContextConstructor();
      const gain = context.createGain();
      gain.gain.value = 0.12;
      gain.connect(context.destination);
      musicRef.current = { context, gain, timer: null, step: 0, active: false };
    }

    const state = musicRef.current;
    void state.context.resume();
    if (!state.active) {
      state.active = true;
      musicTick(state);
      state.timer = window.setInterval(() => musicTick(state), 310);
    }
    setMusicVolume(state, 0.12);
  } catch {
    // The visual game and recorded voice clips still work without background music.
  }
}

function stopMusic(musicRef: { current: MusicState | null }) {
  const state = musicRef.current;
  if (!state) return;
  state.active = false;
  if (state.timer !== null) window.clearInterval(state.timer);
  state.timer = null;
  setMusicVolume(state, 0);
}

function ShapeArt({ item, colorIndex }: { item: ExplorerItem; colorIndex: number }) {
  const color = COLORS[colorIndex];
  const common = { fill: color, stroke: '#36545a', strokeWidth: 3, strokeLinejoin: 'round' as const };

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      {item === 'ball' && <circle {...common} cx="60" cy="60" r="43" />}
      {item === 'clock' && <circle {...common} cx="60" cy="60" r="43" />}
      {item === 'cookie' && <circle {...common} cx="60" cy="60" r="43" />}
      {item === 'gift' && <rect {...common} x="18" y="18" width="84" height="84" rx="2" />}
      {item === 'window' && <rect {...common} x="18" y="18" width="84" height="84" rx="2" />}
      {item === 'tile' && <rect {...common} x="18" y="18" width="84" height="84" rx="2" />}
      {item === 'pizza' && <path {...common} d="M60 12 108 101 12 101Z" />}
      {item === 'flag' && <path {...common} d="M60 12 108 101 12 101Z" />}
      {item === 'sandwich' && <path {...common} d="M60 12 108 101 12 101Z" />}
      {item === 'egg' && <ellipse {...common} cx="60" cy="60" rx="32" ry="46" />}
      {item === 'oval' && <ellipse {...common} cx="60" cy="60" rx="32" ry="46" />}
      {item === 'phone' && <rect {...common} x="30" y="12" width="60" height="96" rx="3" />}
      {item === 'door' && <rect {...common} x="30" y="12" width="60" height="96" rx="3" />}
      {item === 'book' && <rect {...common} x="30" y="12" width="60" height="96" rx="3" />}
      {item === 'star' && <path {...common} d="M60 8 75 42 112 45 84 70 92 107 60 87 28 107 36 70 8 45 45 42Z" />}
      {item === 'heart' && <path {...common} d="M60 102 C45 88 10 65 10 39 C10 12 44 8 60 33 C76 8 110 12 110 39 C110 65 75 88 60 102Z" />}

      {item === 'ball' && <path d="M18 60H102 M60 18V102 M30 30Q60 60 90 90 M90 30Q60 60 30 90" fill="none" stroke="#36545a" strokeWidth="3" />}
      {item === 'clock' && <><circle cx="60" cy="60" r="34" fill="#fff" /><path d="M60 35V60L78 70" fill="none" stroke="#36545a" strokeWidth="3" /></>}
      {item === 'cookie' && <g fill="#8b542f" stroke="none"><circle cx="40" cy="42" r="6" /><circle cx="75" cy="35" r="6" /><circle cx="65" cy="70" r="6" /><circle cx="38" cy="78" r="5" /><circle cx="83" cy="78" r="5" /></g>}
      {item === 'gift' && <path d="M54 18H66V102H54Z M18 53H102V65H18Z" fill="#fff4c7" stroke="#36545a" strokeWidth="3" />}
      {item === 'window' && <path d="M60 18V102 M18 60H102" fill="none" stroke="#36545a" strokeWidth="7" />}
      {item === 'tile' && <rect x="27" y="27" width="66" height="66" fill="none" stroke="#fff" strokeWidth="3" />}
      {item === 'pizza' && <><path d="M20 89H100" stroke="#a96936" strokeWidth="8" /><g fill="#d84e48" stroke="none"><circle cx="60" cy="48" r="6" /><circle cx="45" cy="75" r="6" /><circle cx="75" cy="75" r="6" /></g></>}
      {item === 'flag' && <path d="M60 30 90 88H30Z" fill="#fff5c8" stroke="none" />}
      {item === 'sandwich' && <path d="M22 90H98" stroke="#5c9f4c" strokeWidth="6" />}
      {item === 'egg' && <path d="M44 42Q48 30 56 27" stroke="#fff" fill="none" strokeWidth="5" />}
      {item === 'oval' && <path d="M42 35Q30 60 42 85 M78 35Q90 60 78 85" fill="none" stroke="#36545a" strokeWidth="3" />}
      {item === 'phone' && <><rect x="36" y="22" width="48" height="70" rx="2" fill="#e6f8ff" /><circle cx="60" cy="100" r="3" fill="#36545a" /></>}
      {item === 'door' && <circle cx="77" cy="62" r="4" fill="#fff" />}
      {item === 'book' && <path d="M40 14V106 M48 35H79 M48 45H79" fill="none" stroke="#36545a" strokeWidth="3" />}
    </svg>
  );
}

function playClip(
  audioRef: { current: HTMLAudioElement | null },
  musicRef: { current: MusicState | null },
  src: string,
  onFinished?: () => void,
) {
  audioRef.current?.pause();
  const audio = new Audio(src);
  audioRef.current = audio;
  setMusicVolume(musicRef.current, 0.012);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (audioRef.current === audio) audioRef.current = null;
    setMusicVolume(musicRef.current, 0.12);
    onFinished?.();
  };
  audio.preload = 'auto';
  audio.onended = finish;
  audio.onerror = finish;
  void audio.play().catch(finish);
}

function stopClip(audioRef: { current: HTMLAudioElement | null }, musicRef: { current: MusicState | null }) {
  audioRef.current?.pause();
  audioRef.current = null;
  stopMusic(musicRef);
}

export function MuntingEksplorador({
  onComplete,
  allowSkip = false,
}: {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<MusicState | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missedCurrentRound, setMissedCurrentRound] = useState(false);
  const [solved, setSolved] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | ''>('');
  const [isCompleted, setIsCompleted] = useState(false);

  const round: LittleExplorerRound = LITTLE_EXPLORER_ROUNDS[roundIndex];

  useEffect(() => () => stopClip(audioRef, musicRef), []);

  useEffect(() => {
    if (!hasStarted || isCompleted) return;
    playClip(audioRef, musicRef, AUDIO_CLIPS.ask);
  }, [hasStarted, roundIndex, isCompleted]);

  const startGame = () => {
    startMusic(musicRef);
    setHasStarted(true);
    setIsCompleted(false);
    setRoundIndex(0);
    setScore(0);
    setSolved(false);
    setSelectedIndex(null);
    setFeedback('');
    setMissedCurrentRound(false);
  };

  const choose = (choiceIndex: number) => {
    if (!hasStarted || solved) return;
    setSelectedIndex(choiceIndex);

    if (!isLittleExplorerAnswerCorrect(round, choiceIndex)) {
      setMissedCurrentRound(true);
      setFeedback('wrong');
      playClip(audioRef, musicRef, AUDIO_CLIPS.wrong, () => setSelectedIndex(null));
      return;
    }

    setSolved(true);
    setFeedback('correct');
    if (!missedCurrentRound) setScore((previous) => previous + 1);
    playClip(audioRef, musicRef, AUDIO_CLIPS.correct);
    confetti({ particleCount: 45, spread: 70, origin: { y: 0.65 } });
  };

  const goNext = () => {
    if (!solved) return;
    if (roundIndex === LITTLE_EXPLORER_ROUNDS.length - 1) {
      stopMusic(musicRef);
      setIsCompleted(true);
      return;
    }
    setRoundIndex((previous) => previous + 1);
    setSolved(false);
    setSelectedIndex(null);
    setFeedback('');
    setMissedCurrentRound(false);
  };

  const replay = () => {
    startGame();
  };

  return (
    <div className="relative mx-auto flex min-h-[620px] w-full max-w-5xl flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-8 border-sky-200 bg-gradient-to-br from-sky-100 via-amber-50 to-emerald-100 p-4 shadow-xl md:p-7">
      {!hasStarted && !isCompleted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-sky-100/95 via-amber-50/95 to-emerald-100/95 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border-4 border-emerald-300 bg-white p-7 text-center shadow-2xl">
            <div className="mb-2 text-7xl" aria-hidden="true">🦊</div>
            <h1 className="text-3xl font-black text-emerald-900 md:text-4xl">Munting Eksplorador</h1>
            <h2 className="mt-2 text-2xl font-black text-sky-700">Alin ang Naiiba?</h2>
            <div className="mt-4 text-4xl" aria-hidden="true">⭐ 🔍 🌈</div>
            <Button type="button" size="lg" className="mt-6 rounded-2xl bg-emerald-600 px-8 text-xl font-black text-white hover:bg-emerald-700" onClick={startGame}>
              ▶ Magsimula
            </Button>
            {onComplete && allowSkip && (
              <Button type="button" variant="outline" className="mt-3 rounded-2xl border-2 border-emerald-300 font-bold text-emerald-800" onClick={() => onComplete?.()}>
                Laktawan <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      )}

      <header className="relative z-10 mb-4 flex w-full flex-wrap items-center justify-between gap-3 rounded-3xl border-4 border-white bg-white/80 p-3 shadow-sm md:p-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl" aria-hidden="true">🦊</span>
          <div>
            <h1 className="text-xl font-black text-emerald-900 md:text-3xl">Munting Eksplorador</h1>
            <p className="font-bold text-sky-700">Alin ang Naiiba?</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasStarted && <div className="rounded-full bg-emerald-100 px-4 py-2 text-lg font-black text-emerald-900">{roundIndex + 1} / {LITTLE_EXPLORER_ROUNDS.length}</div>}
          {onComplete && allowSkip && hasStarted && (
            <Button type="button" variant="outline" className="rounded-2xl border-2 border-emerald-300 bg-white font-bold text-emerald-800" onClick={() => onComplete?.()}>
              Laktawan <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>

      {hasStarted && !isCompleted && (
        <>
          <div className="relative z-10 mb-2 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{Array.from({ length: score }, () => '⭐').join('')}{Array.from({ length: LITTLE_EXPLORER_ROUNDS.length - score }, () => '☆').join('')}</span>
            <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-full border-2 border-sky-300 bg-white text-sky-700" aria-label="Pakinggan muli" title="Pakinggan muli" onClick={() => playClip(audioRef, musicRef, AUDIO_CLIPS.ask)}>
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          <h2 className="relative z-10 mb-4 text-center text-2xl font-black text-emerald-900 md:text-4xl">🦊 Alin ang Naiiba?</h2>
          <div className="relative z-10 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {round.items.map((item, index) => {
              const isSelected = selectedIndex === index;
              const isCorrect = isSelected && solved && index === round.answerIndex;
              const isWrong = isSelected && !solved;
              return (
                <button
                  key={`${roundIndex}-${index}`}
                  type="button"
                  className={`relative aspect-square rounded-3xl border-4 bg-[#fffdf4] p-2 shadow-[0_6px_0_#a7c7b4] transition-transform hover:scale-105 disabled:cursor-default ${isCorrect ? 'border-emerald-500 bg-emerald-100' : ''} ${isWrong ? 'border-rose-500 bg-rose-100' : 'border-white'}`}
                  onClick={() => choose(index)}
                  disabled={solved}
                  aria-label={`Pagpipilian ${index + 1}`}
                >
                  <ShapeArt item={item} colorIndex={index} />
                  {isCorrect && <Check className="absolute" aria-hidden="true" />}
                  {isWrong && <X className="absolute" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="relative z-10 mt-3 flex min-h-12 items-center justify-center" role="status" aria-live="polite">
            {feedback === 'correct' && <span className="text-4xl" aria-label="Tama">⭐</span>}
            {feedback === 'wrong' && <span className="text-4xl" aria-label="Subukan muli">↪️</span>}
          </div>
          <Button type="button" size="lg" disabled={!solved} className="relative z-10 mt-2 rounded-2xl bg-emerald-600 px-8 text-xl font-black text-white hover:bg-emerald-700" onClick={goNext}>
            {roundIndex === LITTLE_EXPLORER_ROUNDS.length - 1 ? '🏆 Tapusin' : 'Susunod'} <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </Button>
        </>
      )}

      {isCompleted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-emerald-50/95 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border-4 border-emerald-300 bg-white p-7 text-center shadow-2xl">
            <div className="mb-2 text-7xl" aria-hidden="true">🏆</div>
            <h2 className="text-4xl font-black text-emerald-900">{score} / {LITTLE_EXPLORER_ROUNDS.length}</h2>
            <div className="mt-4 text-5xl" aria-hidden="true">🌟 🎉 🌟</div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button type="button" variant="outline" className="rounded-2xl border-2 border-emerald-300 font-bold text-emerald-800" onClick={replay}>
                <RotateCcw className="h-5 w-5" aria-hidden="true" /> Ulitin
              </Button>
              {onComplete && (
                <Button type="button" className="rounded-2xl bg-emerald-600 font-black text-white hover:bg-emerald-700" onClick={() => onComplete?.(score, LITTLE_EXPLORER_ROUNDS.length)}>
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
