import React, { useState } from 'react';
import { StickerItem } from '../types';
import { ALL_STICKERS } from '../utils/stickers';
import { speak, playSfx } from '../utils/audio';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StickerBookProps {
  unlockedStickers: StickerItem[];
  onClose: () => void;
}

export const StickerBook: React.FC<StickerBookProps> = ({
  unlockedStickers,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // Map unlocked by ID for fast lookup
  const unlockedMap = new Map<string, StickerItem>();
  unlockedStickers.forEach((stk) => unlockedMap.set(stk.id, stk));

  // Combine standard stickers with any custom artwork stickers
  const artworkStickers = unlockedStickers.filter((s) => s.rarity === 'artwork');
  const fullList = [...ALL_STICKERS, ...artworkStickers];

  // Category filter
  const categories = ['전체', '동물', '과일', '우주', '공룡', '탈것', '특별'];
  const filteredList =
    selectedCategory === '전체'
      ? fullList
      : fullList.filter((s) => s.category === selectedCategory);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const pageItems = filteredList.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handleStickerClick = (item: StickerItem, isUnlocked: boolean) => {
    if (isUnlocked) {
      playSfx('sticker');
      speak(item.name);
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.6 },
      });
    } else {
      playSfx('gentle');
      speak('아직 모으지 못한 스티커예요. 문제를 맞히면 얻을 수 있어요!');
    }
  };

  const handleNextPage = () => {
    playSfx('button');
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    playSfx('button');
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-1.5 sm:p-4 select-none">
      <div className="relative w-full max-w-4xl h-[95dvh] max-h-[720px] bg-amber-50 rounded-2xl sm:rounded-3xl shadow-2xl border-3 sm:border-4 border-amber-300 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3.5 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 border-b-2 border-amber-300 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">📖</span>
            <div>
              <h2 className="font-kids text-lg sm:text-2xl text-amber-950">내 보물 스티커북</h2>
              <p className="text-[11px] sm:text-xs text-amber-800">
                모은 스티커: {unlockedStickers.length} / {fullList.length}개
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSfx('button');
              onClose();
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white hover:bg-stone-100 flex items-center justify-center font-kids text-lg sm:text-xl shadow-md border-2 border-amber-300 active:scale-95 text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-3 sm:px-6 py-1.5 sm:py-2 overflow-x-auto border-b border-amber-200 bg-amber-50/70 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playSfx('button');
                setSelectedCategory(cat);
                setCurrentPage(0);
              }}
              className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl font-kids text-xs sm:text-sm md:text-base whitespace-nowrap transition-all active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-amber-950 shadow-sm border border-amber-500 font-bold'
                  : 'bg-white/80 text-stone-600 hover:bg-white border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 12-Slot Sticker Grid */}
        <div className="flex-1 p-1.5 sm:p-4 md:p-6 overflow-y-auto flex items-center justify-center">
          <div className="grid grid-cols-3 landscape:grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 w-full h-full max-h-[520px]">
            {pageItems.map((item) => {
              const isUnlocked = unlockedMap.has(item.id);
              const unlockedItem = unlockedMap.get(item.id) || item;

              return (
                <div
                  key={item.id}
                  onClick={() => handleStickerClick(unlockedItem, isUnlocked)}
                  className={`relative rounded-xl sm:rounded-3xl flex flex-col items-center justify-center p-1 sm:p-2 transition-all cursor-pointer select-none active:scale-95 ${
                    isUnlocked
                      ? 'bg-white shadow-md hover:shadow-lg border-2 border-amber-200 hover:border-amber-400'
                      : 'bg-amber-100/50 border-2 border-dashed border-amber-200/70 opacity-60'
                  }`}
                >
                  {/* Special Sparkle Badge */}
                  {isUnlocked && unlockedItem.rarity === 'special' && (
                    <div className="absolute top-1 sm:top-2 right-1 sm:right-2 text-amber-500 animate-spin-slow">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  )}

                  {/* Artwork Image or Emoji Icon */}
                  {isUnlocked ? (
                    unlockedItem.artworkDataUrl ? (
                      <img
                        src={unlockedItem.artworkDataUrl}
                        alt={unlockedItem.name}
                        className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain rounded-xl"
                      />
                    ) : (
                      <span className="text-2xl sm:text-4xl md:text-5xl drop-shadow-sm transition-transform hover:scale-110">
                        {unlockedItem.emoji}
                      </span>
                    )
                  ) : (
                    // Subtle Silhouette for unobtained
                    <span className="text-2xl sm:text-4xl md:text-5xl grayscale opacity-25 filter blur-[0.5px]">
                      {item.emoji}
                    </span>
                  )}

                  {/* Sticker Name */}
                  <span
                    className={`mt-0.5 sm:mt-1 font-kids text-[10px] sm:text-xs md:text-sm text-center truncate max-w-full ${
                      isUnlocked ? 'text-stone-800' : 'text-stone-400'
                    }`}
                  >
                    {isUnlocked ? unlockedItem.name : '???'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Big Navigation Arrows */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-amber-100/60 border-t border-amber-200 shrink-0">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md border-2 border-amber-300 transition-all ${
              currentPage === 0
                ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-500 text-amber-950 active:scale-95'
            }`}
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
          </button>

          <span className="font-kids text-stone-700 text-sm sm:text-base md:text-lg">
            {currentPage + 1} / {totalPages} 쪽
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md border-2 border-amber-300 transition-all ${
              currentPage >= totalPages - 1
                ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-500 text-amber-950 active:scale-95'
            }`}
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
          </button>
        </div>
      </div>
    </div>
  );
};
