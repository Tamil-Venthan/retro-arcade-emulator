import React, { useRef } from 'react';
import { inputManager } from '../utils/input';
import { PlayerId } from '../types';

interface VirtualTouchControlsProps {
  player?: PlayerId;
  visible: boolean;
  onToggleVisible?: () => void;
  onQuickSave?: () => void;
  onQuickLoad?: () => void;
}

export const VirtualTouchControls: React.FC<VirtualTouchControlsProps> = ({
  player = 'p1',
  visible,
  onQuickSave,
  onQuickLoad
}) => {
  const dpadRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  // Touch handlers for action buttons
  const handleButtonStart = (btn: 'a' | 'b' | 'x' | 'y' | 'start' | 'select') => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    inputManager.setVirtualButton(player, btn, true);
  };

  const handleButtonEnd = (btn: 'a' | 'b' | 'x' | 'y' | 'start' | 'select') => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    inputManager.setVirtualButton(player, btn, false);
  };

  // D-Pad multi-direction touch calculation
  const handleDpadTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!dpadRef.current) return;
    const rect = dpadRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const deadzone = 12;

    const isLeft = dx < -deadzone;
    const isRight = dx > deadzone;
    const isUp = dy < -deadzone;
    const isDown = dy > deadzone;

    inputManager.setVirtualButton(player, 'left', isLeft);
    inputManager.setVirtualButton(player, 'right', isRight);
    inputManager.setVirtualButton(player, 'up', isUp);
    inputManager.setVirtualButton(player, 'down', isDown);
  };

  const handleDpadEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    inputManager.setVirtualButton(player, 'left', false);
    inputManager.setVirtualButton(player, 'right', false);
    inputManager.setVirtualButton(player, 'up', false);
    inputManager.setVirtualButton(player, 'down', false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2 select-none touch-none">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Virtual D-Pad */}
        <div
          ref={dpadRef}
          onTouchStart={handleDpadTouch}
          onTouchMove={handleDpadTouch}
          onTouchEnd={handleDpadEnd}
          onTouchCancel={handleDpadEnd}
          className="relative w-36 h-36 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-2xl flex items-center justify-center p-2"
        >
          {/* Directional Cross */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Horizontal Bar */}
            <div className="absolute w-28 h-10 bg-slate-800 rounded-md border border-slate-700 flex justify-between px-2 items-center">
              <span className="text-slate-400 font-bold text-xs select-none">◀</span>
              <span className="text-slate-400 font-bold text-xs select-none">▶</span>
            </div>
            {/* Vertical Bar */}
            <div className="absolute h-28 w-10 bg-slate-800 rounded-md border border-slate-700 flex flex-col justify-between py-2 items-center">
              <span className="text-slate-400 font-bold text-xs select-none">▲</span>
              <span className="text-slate-400 font-bold text-xs select-none">▼</span>
            </div>
            {/* Center Pivot */}
            <div className="absolute w-8 h-8 rounded-full bg-slate-950 border border-slate-700/60 shadow-inner" />
          </div>
        </div>

        {/* Center: System & Save buttons */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
            {onQuickSave && (
              <button
                type="button"
                onClick={onQuickSave}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-slate-200 rounded transition-colors whitespace-nowrap"
              >
                Quick Save
              </button>
            )}
            {onQuickLoad && (
              <button
                type="button"
                onClick={onQuickLoad}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-slate-200 rounded transition-colors whitespace-nowrap"
              >
                Quick Load
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onTouchStart={handleButtonStart('select')}
              onTouchEnd={handleButtonEnd('select')}
              onMouseDown={handleButtonStart('select')}
              onMouseUp={handleButtonEnd('select')}
              className="px-3 py-1.5 bg-slate-800 active:bg-slate-700 text-slate-300 border border-slate-700 rounded-full text-[10px] font-semibold tracking-wide uppercase transition-transform active:scale-95 whitespace-nowrap shadow"
            >
              Select
            </button>
            <button
              type="button"
              onTouchStart={handleButtonStart('start')}
              onTouchEnd={handleButtonEnd('start')}
              onMouseDown={handleButtonStart('start')}
              onMouseUp={handleButtonEnd('start')}
              className="px-3.5 py-1.5 bg-rose-950 active:bg-rose-900 text-rose-200 border border-rose-800 rounded-full text-[10px] font-semibold tracking-wide uppercase transition-transform active:scale-95 whitespace-nowrap shadow"
            >
              Start
            </button>
          </div>
        </div>

        {/* Right: Arcade Action Diamond (A, B, X, Y) */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Button Y (Top) */}
          <button
            type="button"
            onTouchStart={handleButtonStart('y')}
            onTouchEnd={handleButtonEnd('y')}
            onMouseDown={handleButtonStart('y')}
            onMouseUp={handleButtonEnd('y')}
            className="absolute top-0 w-11 h-11 rounded-full bg-amber-500 active:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 border-2 border-amber-300 flex items-center justify-center active:scale-90 transition-transform"
          >
            Y
          </button>
          {/* Button X (Left) */}
          <button
            type="button"
            onTouchStart={handleButtonStart('x')}
            onTouchEnd={handleButtonEnd('x')}
            onMouseDown={handleButtonStart('x')}
            onMouseUp={handleButtonEnd('x')}
            className="absolute left-0 w-11 h-11 rounded-full bg-blue-500 active:bg-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/20 border-2 border-blue-300 flex items-center justify-center active:scale-90 transition-transform"
          >
            X
          </button>
          {/* Button B (Right) */}
          <button
            type="button"
            onTouchStart={handleButtonStart('b')}
            onTouchEnd={handleButtonEnd('b')}
            onMouseDown={handleButtonStart('b')}
            onMouseUp={handleButtonEnd('b')}
            className="absolute right-0 w-11 h-11 rounded-full bg-emerald-500 active:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 border-2 border-emerald-300 flex items-center justify-center active:scale-90 transition-transform"
          >
            B
          </button>
          {/* Button A (Bottom) */}
          <button
            type="button"
            onTouchStart={handleButtonStart('a')}
            onTouchEnd={handleButtonEnd('a')}
            onMouseDown={handleButtonStart('a')}
            onMouseUp={handleButtonEnd('a')}
            className="absolute bottom-0 w-12 h-12 rounded-full bg-rose-500 active:bg-rose-400 text-white font-bold text-base shadow-lg shadow-rose-500/30 border-2 border-rose-300 flex items-center justify-center active:scale-90 transition-transform"
          >
            A
          </button>
        </div>
      </div>
    </div>
  );
};
