import { useRef, useState, useCallback, useEffect } from 'react';
import type { ProjectSettings } from '../types';
import { Upload, X, Monitor, Smartphone } from 'lucide-react';

interface Props {
  settings: ProjectSettings;
  onChange: (patch: Partial<ProjectSettings>) => void;
}

const DEBOUNCE_MS = 400;

function useDebounced<T>(fn: (val: T) => void, ms: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (val: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(val), ms);
    },
    [fn, ms]
  );
}

export function VideoMockupCanvas({ settings, onChange }: Props) {
  // Local shadow state so controls feel instant
  const [local, setLocal] = useState<ProjectSettings>({ ...settings });
  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartPct = useRef(0);

  // Keep local in sync when parent pushes a fresh project load
  useEffect(() => {
    setLocal(prev => ({
      ...prev,
      ...settings,
    }));
  }, [settings.aspectRatio, settings.borderWidthPercent, settings.titleText,
      settings.titleYPercent, settings.titleFontSize, settings.titleColor,
      settings.titleBoxOpacity]);

  const saveDebounced = useDebounced(onChange, DEBOUNCE_MS);

  function update(patch: Partial<ProjectSettings>) {
    const next = { ...local, ...patch };
    setLocal(next);
    saveDebounced(patch);
  }

  // Canvas display dimensions
  const is16x9 = local.aspectRatio === '16:9';
  // The canvas area is ~100% of the right column. We cap width and derive height.
  // We'll let CSS control width and compute height via aspect-ratio.

  // --- Image drop handling ---
  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setSampleImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setSampleImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  // --- Text drag handling ---
  function onTextPointerDown(e: React.PointerEvent) {
    if (!canvasRef.current) return;
    e.preventDefault();
    setIsDraggingText(true);
    dragStartY.current = e.clientY;
    dragStartPct.current = local.titleYPercent;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onTextPointerMove(e: React.PointerEvent) {
    if (!isDraggingText || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const deltaY = e.clientY - dragStartY.current;
    const deltaPct = (deltaY / canvasRect.height) * 100;
    const newPct = Math.max(2, Math.min(97, dragStartPct.current + deltaPct));
    setLocal(prev => ({ ...prev, titleYPercent: newPct }));
  }

  function onTextPointerUp(e: React.PointerEvent) {
    if (!isDraggingText) return;
    setIsDraggingText(false);
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const deltaY = e.clientY - dragStartY.current;
    const deltaPct = (deltaY / canvasRect.height) * 100;
    const newPct = Math.max(2, Math.min(97, dragStartPct.current + deltaPct));
    update({ titleYPercent: newPct });
  }

  const borderPct = local.borderWidthPercent;

  // Track actual canvas display width for proportional font scaling
  const [canvasDisplayW, setCanvasDisplayW] = useState(320);
  useEffect(() => {
    if (!canvasRef.current) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) setCanvasDisplayW(w);
    });
    obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, []);

  // Scale font: realOutW is the actual video output width; canvasDisplayW is the preview width.
  const realOutW = is16x9 ? 1920 : 1080;
  const fontScale = canvasDisplayW / realOutW;
  const displayFontSize = Math.max(8, Math.round(local.titleFontSize * fontScale));

  return (
    <div className="flex flex-col gap-4">
      {/* Aspect ratio toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Format</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => update({ aspectRatio: '9:16' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              !is16x9
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            9:16
          </button>
          <button
            type="button"
            onClick={() => update({ aspectRatio: '16:9' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              is16x9
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            16:9
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative w-full overflow-hidden rounded-lg border-2 border-gray-300 shadow-inner bg-black select-none"
        style={{ aspectRatio: is16x9 ? '16/9' : '9/16' }}
        ref={canvasRef}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleImageDrop}
      >
        {/* Black border area */}
        <div
          className="absolute inset-0 bg-black"
          style={{
            padding: `${borderPct}%`,
          }}
        >
          {/* Inner video area */}
          <div className="relative w-full h-full overflow-hidden">
            {sampleImage ? (
              <img
                src={sampleImage}
                alt="Sample"
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              /* Checkered pattern */
              <div
                className="w-full h-full flex flex-col items-center justify-center"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#c0c0c0 0% 25%, #e8e8e8 0% 50%)',
                  backgroundSize: '20px 20px',
                }}
              >
                {isDragOver ? (
                  <div className="text-gray-600 text-xs font-medium bg-white/80 px-3 py-1.5 rounded-lg">
                    Drop image here
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-medium text-center leading-tight">
                      Drop or click<br />to add sample image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageInputChange}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Clear image button */}
        {sampleImage && (
          <button
            type="button"
            onClick={() => setSampleImage(null)}
            className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors z-20"
            title="Remove sample image"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Draggable text overlay */}
        {local.titleText && (
          <div
            ref={textRef}
            className="absolute left-0 right-0 flex justify-center z-10"
            style={{ top: `${local.titleYPercent}%`, transform: 'translateY(-50%)' }}
            onPointerDown={onTextPointerDown}
            onPointerMove={onTextPointerMove}
            onPointerUp={onTextPointerUp}
          >
            <div
              className="px-2 py-1 rounded cursor-ns-resize whitespace-nowrap max-w-[90%] truncate text-center"
              style={{
                background: `rgba(0,0,0,${local.titleBoxOpacity})`,
                color: local.titleColor,
                fontSize: `${displayFontSize}px`,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                lineHeight: 1.3,
              }}
            >
              {local.titleText}
            </div>
          </div>
        )}

        {/* Drag hint when text is being dragged */}
        {isDraggingText && (
          <div className="absolute inset-x-0 top-1 flex justify-center pointer-events-none z-30">
            <span className="text-[9px] bg-black/50 text-white px-2 py-0.5 rounded-full">
              Drag to reposition
            </span>
          </div>
        )}
      </div>

      {/* Hint about drag */}
      {local.titleText && (
        <p className="text-[10px] text-gray-400 text-center -mt-2">
          Drag the text overlay to reposition it
        </p>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Video Layout Settings</h3>

        {/* Border width */}
        <div>
          <label className="flex justify-between text-xs font-medium text-gray-600 mb-1">
            <span>Black Border</span>
            <span>{local.borderWidthPercent}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={15}
            step={1}
            value={local.borderWidthPercent}
            onChange={e => update({ borderWidthPercent: parseInt(e.target.value) })}
            className="w-full accent-purple-600"
          />
        </div>

        {/* Title text */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title / Overlay Text</label>
          <input
            type="text"
            value={local.titleText}
            onChange={e => update({ titleText: e.target.value })}
            placeholder="Your brand name or call to action"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Font size + color row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex justify-between text-xs font-medium text-gray-600 mb-1">
              <span>Font Size</span>
              <span>{local.titleFontSize}px</span>
            </label>
            <input
              type="range"
              min={20}
              max={80}
              step={1}
              value={local.titleFontSize}
              onChange={e => update({ titleFontSize: parseInt(e.target.value) })}
              className="w-full accent-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={local.titleColor}
                onChange={e => update({ titleColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <span className="text-xs text-gray-500 font-mono">{local.titleColor}</span>
            </div>
          </div>
        </div>

        {/* Box opacity */}
        <div>
          <label className="flex justify-between text-xs font-medium text-gray-600 mb-1">
            <span>Background Box Opacity</span>
            <span>{Math.round(local.titleBoxOpacity * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={local.titleBoxOpacity}
            onChange={e => update({ titleBoxOpacity: parseFloat(e.target.value) })}
            className="w-full accent-purple-600"
          />
        </div>
      </div>
    </div>
  );
}
