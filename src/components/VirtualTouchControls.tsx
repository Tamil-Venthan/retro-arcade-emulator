import React, { useRef, useState } from 'react';
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
  const [activeDpadDir, setActiveDpadDir] = useState<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false
  });
  const [isClassicTwoButton, setIsClassicTwoButton] = useState(false);

  if (!visible) return null;

  // Touch handlers for individual action buttons
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

    setActiveDpadDir({ up: isUp, down: isDown, left: isLeft, right: isRight });

    inputManager.setVirtualButton(player, 'left', isLeft);
    inputManager.setVirtualButton(player, 'right', isRight);
    inputManager.setVirtualButton(player, 'up', isUp);
    inputManager.setVirtualButton(player, 'down', isDown);
  };

  const handleDpadEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setActiveDpadDir({ up: false, down: false, left: false, right: false });
    inputManager.setVirtualButton(player, 'left', false);
    inputManager.setVirtualButton(player, 'right', false);
    inputManager.setVirtualButton(player, 'up', false);
    inputManager.setVirtualButton(player, 'down', false);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-2 pt-1 pb-3 select-none touch-none space-y-3">
      {/* Top Controls Bar: Select, Start, Quick Save, Quick Load */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          {onQuickSave && (
            <button
              type="button"
              onClick={onQuickSave}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 active:bg-amber-600 text-slate-200 rounded-lg transition-colors whitespace-nowrap min-h-[36px]"
            >
              💾 Save
            </button>
          )}
          {onQuickLoad && (
            <button
              type="button"
              onClick={onQuickLoad}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 active:bg-emerald-600 text-slate-200 rounded-lg transition-colors whitespace-nowrap min-h-[36px]"
            >
              🔄 Load
            </button>
          )}
        </div>

        {/* Center Select / Start buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onTouchStart={handleButtonStart('select')}
            onTouchEnd={handleButtonEnd('select')}
            onMouseDown={handleButtonStart('select')}
            onMouseUp={handleButtonEnd('select')}
            className="px-3 py-1.5 bg-slate-800 active:bg-slate-700 text-slate-300 border border-slate-700 rounded-full text-[10px] font-bold tracking-wider uppercase transition-transform active:scale-95 whitespace-nowrap min-h-[36px] flex items-center justify-center shadow"
          >
            SELECT
          </button>
          <button
            type="button"
            onTouchStart={handleButtonStart('start')}
            onTouchEnd={handleButtonEnd('start')}
            onMouseDown={handleButtonStart('start')}
            onMouseUp={handleButtonEnd('start')}
            className="px-3.5 py-1.5 bg-rose-950 active:bg-rose-900 text-rose-200 border border-rose-800 rounded-full text-[10px] font-bold tracking-wider uppercase transition-transform active:scale-95 whitespace-nowrap min-h-[36px] flex items-center justify-center shadow"
          >
            START
          </button>
        </div>

        {/* Layout Toggle (4-Button vs 2-Button) */}
        <button
          type="button"
          onClick={() => setIsClassicTwoButton(!isClassicTwoButton)}
          className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800/60 rounded border border-slate-700/60"
        >
          {isClassicTwoButton ? '4-BTN' : '2-BTN'}
        </button>
      </div>

      {/* Main Touch Deck: Left Thumb (D-Pad) and Right Thumb (Action Buttons) */}
      <div className="grid grid-cols-2 gap-4 items-center">
        {/* Left Thumb: Ergonomic D-Pad */}
        <div className="flex items-center justify-center">
          <div
            ref={dpadRef}
            onTouchStart={handleDpadTouch}
            onTouchMove={handleDpadTouch}
            onTouchEnd={handleDpadEnd}
            onTouchCancel={handleDpadEnd}
            className="relative w-36 h-36 bg-slate-900/95 border-2 border-slate-700/80 rounded-full shadow-2xl flex items-center justify-center"
          >
            {/* Horizontal Bar */}
            <div className="absolute w-32 h-11 bg-slate-800 rounded-lg border border-slate-700 flex justify-between px-2.5 items-center">
              <span className={`text-sm font-black transition-colors ${activeDpadDir.left ? 'text-amber-400 scale-125' : 'text-slate-400'}`}>
                ◀
              </span>
              <span className={`text-sm font-black transition-colors ${activeDpadDir.right ? 'text-amber-400 scale-125' : 'text-slate-400'}`}>
                ▶
              </span>
            </div>

            {/* Vertical Bar */}
            <div className="absolute h-32 w-11 bg-slate-800 rounded-lg border border-slate-700 flex flex-col justify-between py-2.5 items-center">
              <span className={`text-sm font-black transition-colors ${activeDpadDir.up ? 'text-amber-400 scale-125' : 'text-slate-400'}`}>
                ▲
              </span>
              <span className={`text-sm font-black transition-colors ${activeDpadDir.down ? 'text-amber-400 scale-125' : 'text-slate-400'}`}>
                ▼
              </span>
            </div>

            {/* Center Pivot Point */}
            <div className="relative w-8 h-8 rounded-full bg-slate-950 border border-slate-700/60 shadow-inner z-10" />
          </div>
        </div>

        {/* Right Thumb: Dedicated Action Button Grid (Zero Overlap Guaranteed!) */}
        <div className="flex items-center justify-center">
          {isClassicTwoButton ? (
            /* Classic 2-Button NES Layout: B on left, A on right, angled upwards */
            <div className="flex items-center gap-4 -rotate-12 bg-slate-900/60 p-3 rounded-3xl border border-slate-800">
              {/* Button B */}
              <button
                type="button"
                onTouchStart={handleButtonStart('b')}
                onTouchEnd={handleButtonEnd('b')}
                onMouseDown={handleButtonStart('b')}
                onMouseUp={handleButtonEnd('b')}
                className="w-14 h-14 rounded-full bg-emerald-600 active:bg-emerald-500 text-white font-black text-lg shadow-xl shadow-emerald-950 border-3 border-emerald-400 flex items-center justify-center active:scale-90 transition-transform"
              >
                B
              </button>

              {/* Button A */}
              <button
                type="button"
                onTouchStart={handleButtonStart('a')}
                onTouchEnd={handleButtonEnd('a')}
                onMouseDown={handleButtonStart('a')}
                onMouseUp={handleButtonEnd('a')}
                className="w-14 h-14 rounded-full bg-rose-600 active:bg-rose-500 text-white font-black text-lg shadow-xl shadow-rose-950 border-3 border-rose-400 flex items-center justify-center active:scale-90 transition-transform -translate-y-2"
              >
                A
              </button>
            </div>
          ) : (
            /* 4-Button Arcade Diamond (CSS Grid prevents any overlapping!) */
            <div className="grid grid-cols-2 gap-3 p-2 bg-slate-900/60 rounded-3xl border border-slate-800">
              {/* Button Y (Top-Left) */}
              <button
                type="button"
                onTouchStart={handleButtonStart('y')}
                onTouchEnd={handleButtonEnd('y')}
                onMouseDown={handleButtonStart('y')}
                onMouseUp={handleButtonEnd('y')}
                className="w-12 h-12 rounded-full bg-amber-500 active:bg-amber-400 text-slate-950 font-black text-sm shadow-lg border-2 border-amber-300 flex items-center justify-center active:scale-90 transition-transform"
              >
                Y
              </button>

              {/* Button X (Top-Right) */}
              <button
                type="button"
                onTouchStart={handleButtonStart('x')}
                onTouchEnd={handleButtonEnd('x')}
                onMouseDown={handleButtonStart('x')}
                onMouseUp={handleButtonEnd('x')}
                className="w-12 h-12 rounded-full bg-blue-500 active:bg-blue-400 text-white font-black text-sm shadow-lg border-2 border-blue-300 flex items-center justify-center active:scale-90 transition-transform"
              >
                X
              </button>

              {/* Button B (Bottom-Left) */}
              <button
                type="button"
                onTouchStart={handleButtonStart('b')}
                onTouchEnd={handleButtonEnd('b')}
                onMouseDown={handleButtonStart('b')}
                onMouseUp={handleButtonEnd('b')}
                className="w-12 h-12 rounded-full bg-emerald-500 active:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg border-2 border-emerald-300 flex items-center justify-center active:scale-90 transition-transform"
              >
                B
              </button>

              {/* Button A (Bottom-Right) */}
              <button
                type="button"
                onTouchStart={handleButtonStart('a')}
                onTouchEnd={handleButtonEnd('a')}
                onMouseDown={handleButtonStart('a')}
                onMouseUp={handleButtonEnd('a')}
                className="w-12 h-12 rounded-full bg-rose-500 active:bg-rose-400 text-white font-black text-sm shadow-lg border-2 border-rose-300 flex items-center justify-center active:scale-90 transition-transform"
              >
                A
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
