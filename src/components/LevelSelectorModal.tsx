import React, { useState } from 'react';
import { X, Star, Lock, Play, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { playSfx } from '../utils/audio';
import { LEVEL_CHAPTERS, getChapterForLevel } from '../utils/levels';

interface LevelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  currentLevel: number;
  highestLevel: number;
  stars?: Record<number, number>;
  onSelectLevel: (level: number) => void;
}

export const LevelSelectorModal: React.FC<LevelSelectorModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  currentLevel,
  highestLevel,
  stars = {},
  onSelectLevel,
}) => {
  const currentChapter = getChapterForLevel(currentLevel);
  const [selectedChapterId, setSelectedChapterId] = useState(currentChapter.id);

  if (!isOpen) return null;

  const activeChapter = LEVEL_CHAPTERS.find(c => c.id === selectedChapterId) || LEVEL_CHAPTERS[0];
  const levelsInChapter = Array.from(
    { length: activeChapter.maxLevel - activeChapter.minLevel + 1 },
    (_, i) => activeChapter.minLevel + i
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-lg sm:max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeChapter.icon}</span>
            <div>
              <h3 className="font-kids text-lg sm:text-xl text-white drop-shadow-sm">
                {gameTitle} 단계 선택
              </h3>
              <p className="font-kids text-xs text-amber-100">
                100단계까지 도전해보세요! (현재 최고: {highestLevel}단계)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSfx('button');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapter Selector Bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border-b border-amber-200 overflow-x-auto shrink-0 scrollbar-none">
          {LEVEL_CHAPTERS.map((ch) => {
            const isSelected = ch.id === selectedChapterId;
            const isUnlocked = highestLevel >= ch.minLevel;

            return (
              <button
                key={ch.id}
                onClick={() => {
                  playSfx('button');
                  setSelectedChapterId(ch.id);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-kids text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-sm font-bold scale-105'
                    : isUnlocked
                    ? 'bg-white text-stone-700 hover:bg-amber-100 border border-amber-200'
                    : 'bg-stone-100 text-stone-400 border border-stone-200 opacity-60'
                }`}
              >
                <span>{ch.icon}</span>
                <span>{ch.id * 10}단계</span>
              </button>
            );
          })}
        </div>

        {/* Chapter Title Badge */}
        <div className="px-4 py-2 bg-white flex items-center justify-between border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">{activeChapter.icon}</span>
            <span className="font-kids text-stone-800 text-sm sm:text-base font-bold">
              {activeChapter.name} ({activeChapter.minLevel}~{activeChapter.maxLevel}단계)
            </span>
          </div>
          <span className="font-kids text-xs text-amber-600 bg-amber-100/70 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            {activeChapter.badge}
          </span>
        </div>

        {/* Levels Grid */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 justify-items-center">
            {levelsInChapter.map((lvl) => {
              const isCurrent = lvl === currentLevel;
              const isUnlocked = lvl <= Math.max(highestLevel, 1);
              const starCount = stars[lvl] || (lvl < highestLevel ? 3 : 0);

              return (
                <button
                  key={lvl}
                  disabled={!isUnlocked}
                  onClick={() => {
                    playSfx('button');
                    onSelectLevel(lvl);
                    onClose();
                  }}
                  className={`w-14 h-16 sm:w-20 sm:h-22 rounded-2xl flex flex-col items-center justify-center p-1 transition-all relative transform active:scale-95 ${
                    isCurrent
                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg ring-4 ring-amber-300 scale-105 font-bold'
                      : isUnlocked
                      ? 'bg-amber-50/80 hover:bg-amber-100 text-stone-800 border-2 border-amber-200 shadow-sm'
                      : 'bg-stone-100 text-stone-400 border border-stone-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="font-kids text-base sm:text-xl font-bold">{lvl}</span>
                  
                  {isUnlocked ? (
                    <div className="flex items-center gap-0.5 mt-0.5 sm:mt-1">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${
                            s <= starCount
                              ? 'text-yellow-400 fill-yellow-400'
                              : isCurrent
                              ? 'text-amber-200/50'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-stone-400 mt-1" />
                  )}

                  {isCurrent && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-kids px-1.5 py-0.5 rounded-full shadow">
                      도전
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer with Continue Button */}
        <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedChapterId > 1) {
                  playSfx('button');
                  setSelectedChapterId(selectedChapterId - 1);
                }
              }}
              disabled={selectedChapterId <= 1}
              className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5 text-stone-700" />
            </button>
            <button
              onClick={() => {
                if (selectedChapterId < 10) {
                  playSfx('button');
                  setSelectedChapterId(selectedChapterId + 1);
                }
              }}
              disabled={selectedChapterId >= 10}
              className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5 text-stone-700" />
            </button>
          </div>

          <button
            onClick={() => {
              playSfx('button');
              onSelectLevel(Math.min(100, highestLevel));
              onClose();
            }}
            className="flex-1 max-w-xs py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-kids text-sm sm:text-base shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>이어하기 ({Math.min(100, highestLevel)}단계)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
