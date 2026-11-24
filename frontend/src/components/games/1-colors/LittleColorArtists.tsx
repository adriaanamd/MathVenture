import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Eraser, Palette, Paintbrush, Save, Sparkles, Trash2, Undo2, Volume2 } from 'lucide-react';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const COLORS = [
  { name: 'Pula', englishName: 'Red', value: '#ef3434' },
  { name: 'Kahel', englishName: 'Orange', value: '#ff8b23' },
  { name: 'Dilaw', englishName: 'Yellow', value: '#ffdf24' },
  { name: 'Berde', englishName: 'Green', value: '#2cb957' },
  { name: 'Asul', englishName: 'Blue', value: '#2683ed' },
  { name: 'Lila', englishName: 'Purple', value: '#963bd7' },
  { name: 'Rosas', englishName: 'Pink', value: '#ff78b3' },
  { name: 'Kayumanggi', englishName: 'Brown', value: '#89502e' },
  { name: 'Itim', englishName: 'Black', value: '#242424' },
  { name: 'Abo', englishName: 'Gray', value: '#999999' },
];

const TOOLS = [
  { id: 'pen', label: 'Guhit', icon: '🖍️' },
  { id: 'circle', label: 'Bilog', icon: '●' },
  { id: 'square', label: 'Parisukat', icon: '■' },
  { id: 'triangle', label: 'Tatsulok', icon: '▲' },
  { id: 'star', label: 'Bituin', icon: '★' },
  { id: 'heart', label: 'Puso', icon: '♥' },
  { id: 'flower', label: 'Bulaklak', icon: '✿' },
  { id: 'eraser', label: 'Pambura', icon: '🧽' },
] as const;

type ToolId = (typeof TOOLS)[number]['id'];
type Point = { x: number; y: number };
type Snapshot = { image: ImageData; usedColors: string[]; hasDrawing: boolean };

const INSTRUCTION_AUDIO = '/assets/audio/little-color-artists/gumawa-ng-sarili.m4a';

function playInstruction(audioRef: { current: HTMLAudioElement | null }) {
  audioRef.current?.pause();
  const audio = new Audio(INSTRUCTION_AUDIO);
  audio.preload = 'auto';
  audioRef.current = audio;
  void audio.play().catch(() => undefined);
}

export function LittleColorArtists({
  onComplete,
  allowSkip = true,
}: {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<Snapshot[]>([]);
  const lastPointRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);

  const [color, setColor] = useState(COLORS[0].value);
  const [tool, setTool] = useState<ToolId>('pen');
  const [hasDrawing, setHasDrawing] = useState(false);
  const [usedColors, setUsedColors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const timer = window.setTimeout(() => playInstruction(audioRef), 400);

    return () => {
      window.clearTimeout(timer);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const snapshot = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    historyRef.current.push({
      image: context.getImageData(0, 0, canvas.width, canvas.height),
      usedColors: [...usedColors],
      hasDrawing,
    });
    if (historyRef.current.length > 25) historyRef.current.shift();
  };

  const rememberColor = () => {
    if (tool === 'eraser') return;
    setUsedColors((previous) => previous.includes(color) ? previous : [...previous, color]);
  };

  const drawStroke = (from: Point, to: Point) => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    context.strokeStyle = tool === 'eraser' ? 'white' : color;
    context.lineWidth = tool === 'eraser' ? 65 : 16;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  };

  const drawStamp = (point: Point) => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    const radius = 55;
    const { x, y } = point;
    context.fillStyle = color;
    context.beginPath();

    if (tool === 'circle') {
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      return;
    }

    if (tool === 'square') {
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      return;
    }

    if (tool === 'triangle') {
      context.moveTo(x, y - radius);
      context.lineTo(x + radius, y + radius);
      context.lineTo(x - radius, y + radius);
      context.closePath();
      context.fill();
      return;
    }

    if (tool === 'star') {
      for (let index = 0; index < 10; index += 1) {
        const angle = index * Math.PI / 5 - Math.PI / 2;
        const pointRadius = index % 2 === 0 ? radius : radius * 0.45;
        const nextX = x + Math.cos(angle) * pointRadius;
        const nextY = y + Math.sin(angle) * pointRadius;
        if (index === 0) context.moveTo(nextX, nextY);
        else context.lineTo(nextX, nextY);
      }
      context.closePath();
      context.fill();
      return;
    }

    if (tool === 'heart') {
      context.moveTo(x, y + radius);
      context.bezierCurveTo(x - 125, y - 20, x - 45, y - 100, x, y - 35);
      context.bezierCurveTo(x + 45, y - 100, x + 125, y - 20, x, y + radius);
      context.fill();
      return;
    }

    if (tool === 'flower') {
      for (let index = 0; index < 6; index += 1) {
        const angle = index * Math.PI / 3;
        const petalX = x + Math.cos(angle) * 35;
        const petalY = y + Math.sin(angle) * 35;
        context.moveTo(petalX + 29, petalY);
        context.arc(petalX, petalY, 29, 0, Math.PI * 2);
      }
      context.fill();
      context.fillStyle = '#ffdf24';
      context.beginPath();
      context.arc(x, y, 18, 0, Math.PI * 2);
      context.fill();
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const point = getPoint(event);
    snapshot();
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPointRef.current = point;
    setHasDrawing(true);
    rememberColor();

    if (tool === 'pen' || tool === 'eraser') {
      isDrawingRef.current = true;
      drawStroke(point, point);
    } else {
      drawStamp(point);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;

    const point = getPoint(event);
    drawStroke(lastPointRef.current, point);
    lastPointRef.current = point;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const undo = () => {
    const previous = historyRef.current.pop();
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!previous || !canvas || !context) return;

    context.putImageData(previous.image, 0, 0);
    setUsedColors(previous.usedColors);
    setHasDrawing(previous.hasDrawing);
    setStatusMessage('');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    snapshot();
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setUsedColors([]);
    setHasDrawing(false);
    setStatusMessage('');
  };

  const saveArtwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'my-color-masterpiece.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const finishArtwork = () => {
    if (!hasDrawing) {
      setStatusMessage('Gumawa muna ng larawan.');
      return;
    }
    if (usedColors.length < 3) {
      setStatusMessage(`Pumili pa ng kulay. Gumamit ng ${3 - usedColors.length} pang kulay.`);
      return;
    }

    setStatusMessage('');
    setShowComplete(true);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  };

  return (
    <div className="fixed inset-0 z-50 w-full overflow-auto bg-gradient-to-b from-amber-50 to-orange-100 p-3 md:p-6">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-7xl flex-col">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border-4 border-amber-200 bg-white/90 p-3 shadow-lg md:p-4">
          <div className="flex items-center gap-3">
            <Palette className="h-9 w-9 text-fuchsia-500" aria-hidden="true" />
            <div>
              <h1 className="text-2xl font-black text-indigo-900 md:text-4xl">Little Color Artists</h1>
              <p className="font-bold text-indigo-700">Gumawa ng sarili mong makulay na larawan!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-2 border-indigo-300 bg-white font-bold text-indigo-700"
              aria-label="Pakinggan ang instruksyon"
              title="Pakinggan ang instruksyon"
              onClick={() => playInstruction(audioRef)}
            >
              <Volume2 className="mr-2 h-5 w-5" aria-hidden="true" /> Pakinggan
            </Button>
            {onComplete && allowSkip && (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-2 border-indigo-300 bg-white font-bold text-indigo-700"
                onClick={() => onComplete?.()}
              >
                Laktawan
              </Button>
            )}
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="rounded-3xl border-4 border-indigo-200 bg-white p-3 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-lg font-black text-indigo-900">
              <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" /> Pumili ng kulay
            </div>
            <div className="grid grid-cols-5 gap-2 lg:grid-cols-2">
              {COLORS.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  aria-label={`Kulay ${entry.name}`}
                  title={`${entry.name} / ${entry.englishName}`}
                  onClick={() => {
                    setColor(entry.value);
                    if (tool === 'eraser') setTool('pen');
                  }}
                  className={`h-11 w-11 rounded-xl border-4 shadow-sm transition-transform hover:scale-110 ${color === entry.value ? 'scale-110 border-indigo-900 ring-2 ring-white' : 'border-white'}`}
                  style={{ backgroundColor: entry.value }}
                />
              ))}
            </div>

            <div className="mb-3 mt-5 flex items-center gap-2 text-lg font-black text-indigo-900">
              <Paintbrush className="h-5 w-5 text-fuchsia-500" aria-hidden="true" /> Pumili ng gamit
            </div>
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
              {TOOLS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-label={entry.label}
                  title={entry.label}
                  onClick={() => setTool(entry.id)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-4 bg-indigo-50 px-2 py-1 text-2xl transition-transform hover:scale-105 ${tool === entry.id ? 'border-indigo-900 bg-amber-100 shadow-md' : 'border-transparent'}`}
                >
                  <span aria-hidden="true">{entry.icon}</span>
                  <span className="text-[10px] font-bold text-indigo-900">{entry.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-900">
              Gumamit ng hindi bababa sa 3 kulay.
              <div className="mt-2 flex justify-center gap-1" aria-label={`${usedColors.length} na kulay ang nagamit`}>
                {[0, 1, 2].map((index) => (
                  <span key={index} className={`h-4 w-4 rounded-full border-2 border-white shadow ${usedColors[index] ? 'bg-emerald-500' : 'bg-amber-200'}`} />
                ))}
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col gap-3 rounded-3xl border-4 border-fuchsia-200 bg-white/70 p-2 shadow-lg md:p-3">
            <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-3xl border-4 border-indigo-300 bg-white shadow-inner">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                aria-label="Lugar ng pagguhit"
                className="h-full min-h-[280px] w-full touch-none cursor-crosshair object-contain"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={stopDrawing}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="outline" className="rounded-2xl border-2 border-indigo-200 bg-white font-bold text-indigo-700" onClick={undo}>
                <Undo2 className="mr-2 h-5 w-5" aria-hidden="true" /> Undo
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl border-2 border-rose-200 bg-white font-bold text-rose-700" onClick={clearCanvas}>
                <Trash2 className="mr-2 h-5 w-5" aria-hidden="true" /> Clear
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl border-2 border-emerald-200 bg-white font-bold text-emerald-700" onClick={saveArtwork}>
                <Save className="mr-2 h-5 w-5" aria-hidden="true" /> Save art
              </Button>
              <Button type="button" className="rounded-2xl bg-fuchsia-500 font-black text-white shadow-md hover:bg-fuchsia-600" onClick={finishArtwork}>
                <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" /> Tapos na!
              </Button>
            </div>

            {statusMessage && (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-amber-100 px-4 py-3 text-center font-black text-amber-900" role="status">
                <Eraser className="h-5 w-5" aria-hidden="true" /> {statusMessage}
              </div>
            )}
          </section>
        </div>
      </div>

      {showComplete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border-4 border-amber-300 bg-white p-8 text-center shadow-2xl">
            <div className="mb-3 text-6xl" aria-hidden="true">🌈🎨🌟</div>
            <h2 className="text-3xl font-black text-indigo-900">Napakaganda!</h2>
            <p className="mt-3 text-lg font-bold text-indigo-700">Nagawa mo ang sarili mong obra gamit ang maraming kulay.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button type="button" variant="outline" className="rounded-2xl border-2 border-indigo-200 font-bold text-indigo-700" onClick={() => setShowComplete(false)}>
                Balik sa larawan
              </Button>
              <Button type="button" className="rounded-2xl bg-emerald-500 font-black text-white hover:bg-emerald-600" onClick={() => onComplete?.(1, 1)}>
                Susunod
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
