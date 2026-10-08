import React from 'react';
import { Home, Settings, Sparkles } from 'lucide-react';
import { playSfx } from '../utils/audio';

interface TopBarProps {
  onGoHome: () => void;
  onOpenParentGate: () => void;
  onOpenStickers: () => void;
  isParentModeActive: boolean;
  unlockedStickerCount?: number;
  currentScreen: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onGoHome,
  onOpenParentGate,
  onOpenStickers,
  isParentModeActive,
  unlockedStickerCount = 0,
  currentScreen,
}) => {
  return (
    <header className="relative w-full z-30 select-none">
      {/* Parental Mode Orange Banner if active */}
      {isParentModeActive && (
        <div className="w-full bg-amber-500 text-amber-950 px-4 py-1.5 text-center text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
          <span>🔒 보호자 모드 활성화 중 (설정 및 업로드 가능)</span>
        </div>
      )}

      <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-1 sm:py-2">
        {/* Left: Giant Home Button (Kid friendly touch target) */}
        {currentScreen !== 'home' ? (
          <button
            onClick={() => {
              playSfx('button');
              onGoHome();
            }}
            aria-label="처음 화면으로 가기"
            className="w-11 h-11 sm:w-15 sm:h-15 md:w-18 md:h-18 rounded-2xl sm:rounded-3xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-amber-950 flex items-center justify-center shadow-lg border-2 sm:border-4 border-white transition-all cursor-pointer shrink-0"
          >
            <Home className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
          </button>
        ) : (
          <div className="w-8 sm:w-12 md:w-16" />
        )}

        {/* Center: Quick Sticker Book Pill */}
        <button
          onClick={() => {
            playSfx('button');
            onOpenStickers();
          }}
          className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 rounded-full bg-white/95 hover:bg-white shadow-md border-2 border-amber-200 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 animate-spin-slow" />
          </div>
          <span className="font-kids text-stone-700 text-xs sm:text-base md:text-lg whitespace-nowrap">
            스티커북 <strong className="text-amber-600">{unlockedStickerCount}</strong>
          </span>
        </button>

        {/* Right: Parental Menu Gear Button */}
        <button
          onClick={() => {
            playSfx('button');
            onOpenParentGate();
          }}
          aria-label="보호자 설정"
          className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-white active:scale-95 text-stone-500 hover:text-stone-700 flex items-center justify-center shadow-md border-2 border-stone-200 transition-all cursor-pointer shrink-0"
        >
          <Settings className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6.5 md:h-6.5" />
        </button>
      </div>
    </header>
  );
};
