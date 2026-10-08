import React, { useState, useEffect, useRef } from 'react';
import { LearningMaterial } from '../types';
import { speak, playSfx } from '../utils/audio';
import { 
  addReviewRecord, 
  recordGameStats, 
  getGameProgress, 
  saveGameProgress 
} from '../utils/db';
import { getMemoryConfigForLevel, getLevelTitle } from '../utils/levels';
import { LevelSelectorModal } from '../components/LevelSelectorModal';
import { WrongAnswerGuide } from '../components/WrongAnswerGuide';
import confetti from 'canvas-confetti';
import { Sparkles, Play, Home, RotateCcw, ListOrdered } from 'lucide-react';

interface MemoryGameProps {
  materials: LearningMaterial[];
  onAwardSticker: (name: string, rarity?: 'normal' | 'bonus' | 'special' | 'effort') => void;
  onFinishRound: () => void;
  profileId: string;
}

interface CardItem {
  uid: string;
  material: LearningMaterial;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({
  materials,
  onAwardSticker,
  onFinishRound,
  profileId,
}) => {
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [consecutiveMismatches, setConsecutiveMismatches] = useState(0);
  const [hintPairUids, setHintPairUids] = useState<string[]>([]);

  const [roundNumber, setRoundNumber] = useState(1);
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);

  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoNextTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load progress on mount
  useEffect(() => {
    async function loadProgress() {
      const prog = await getGameProgress('memory', profileId);
      setLevel(prog.currentLevel);
      setHighestLevel(prog.highestLevel);
      startNewGame(prog.currentLevel);
    }
    loadProgress();

    return () => clearAllTimers();
  }, [profileId]);

  const clearAllTimers = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    if (autoNextTimerRef.current) {
      clearInterval(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
  };

  const startNewGame = (targetLevel: number = level) => {
    clearAllTimers();
    setIsRoundFinished(false);
    setAutoNextCountdown(null);
    setConsecutiveMismatches(0);
    setHintPairUids([]);

    const config = getMemoryConfigForLevel(targetLevel);
    let pool = materials.filter(m => m.enabled !== false);
    if (categoryFilter !== '전체') {
      pool = pool.filter(m => m.category === categoryFilter);
      if (pool.length < config.pairCount) pool = materials;
    }

    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffledPool.slice(0, config.pairCount);

    const deck: CardItem[] = [];
    selected.forEach((mat) => {
      deck.push({
        uid: `${mat.id}_1_${Date.now()}_${Math.random()}`,
        material: mat,
        isFlipped: true, // Preview flip
        isMatched: false,
      });
      deck.push({
        uid: `${mat.id}_2_${Date.now()}_${Math.random()}`,
        material: mat,
        isFlipped: true,
        isMatched: false,
      });
    });

    const randomizedDeck = deck.sort(() => Math.random() - 0.5);
    setCards(randomizedDeck);
    setFlippedUids([]);
    setIsLocked(true); // Locked during initial preview

    speak('카드를 잘 기억해 두세요!');
    previewTimeoutRef.current = setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
      setIsLocked(false);
      speak('똑같은 그림 두 개를 찾아보세요!');
    }, config.previewSeconds * 1000);
  };

  const handleCardClick = (card: CardItem) => {
    if (isLocked || card.isFlipped || card.isMatched || isRoundFinished) return;

    playSfx('button');
    speak(card.material.name);

    const newCards = cards.map(c => (c.uid === card.uid ? { ...c, isFlipped: true } : c));
    setCards(newCards);

    const newFlipped = [...flippedUids, card.uid];
    setFlippedUids(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      const firstCard = newCards.find(c => c.uid === newFlipped[0])!;
      const secondCard = card;

      if (firstCard.material.id === secondCard.material.id) {
        // MATCH!
        setTimeout(() => {
          playSfx('correct');
          speak(`${card.material.name}! 짝을 찾았어요!`);
          setCards(prev =>
            prev.map(c =>
              c.uid === firstCard.uid || c.uid === secondCard.uid
                ? { ...c, isMatched: true }
                : c
            )
          );
          setFlippedUids([]);
          setIsLocked(false);
          setConsecutiveMismatches(0);
          setHintPairUids([]);

          const remainingUnmatched = newCards.filter(
            c => !c.isMatched && c.uid !== firstCard.uid && c.uid !== secondCard.uid
          );
          if (remainingUnmatched.length === 0) {
            handleAllMatched();
          }
        }, 500);
      } else {
        // Mismatch! 3-Tier Error Handling
        handleMismatch(firstCard, secondCard);
      }
    }
  };

  const handleMismatch = async (card1: CardItem, card2: CardItem) => {
    const nextMis = consecutiveMismatches + 1;
    setConsecutiveMismatches(nextMis);

    if (nextMis === 1) {
      // 1차 실수
      setTimeout(() => {
        playSfx('gentle');
        setCards(prev =>
          prev.map(c =>
            c.uid === card1.uid || c.uid === card2.uid ? { ...c, isFlipped: false } : c
          )
        );
        setFlippedUids([]);
        setIsLocked(false);
      }, 1200);
    } else if (nextMis === 2) {
      // 2차 실수: 힌트 음성
      speak('토끼가 힌트를 줄게요! 아까 보았던 카드를 떠올려봐요.');
      setTimeout(() => {
        playSfx('gentle');
        setCards(prev =>
          prev.map(c =>
            c.uid === card1.uid || c.uid === card2.uid ? { ...c, isFlipped: false } : c
          )
        );
        setFlippedUids([]);
        setIsLocked(false);
      }, 1400);
    } else {
      // 3차 실수: 짝 하나를 반짝이며 알려줌 + 오답노트 등록 + 응원 스티커
      playSfx('sticker');
      speak(`토끼가 짝을 살짝 보여줄게요!`);
      onAwardSticker('응원 스티커', 'effort');

      // Find an unmatched pair
      const unmatched = cards.filter(c => !c.isMatched);
      if (unmatched.length >= 2) {
        const targetMatId = unmatched[0].material.id;
        const matchingUids = unmatched.filter(c => c.material.id === targetMatId).map(c => c.uid);
        setHintPairUids(matchingUids);

        await addReviewRecord({
          profileId,
          gameType: 'memory',
          title: `${unmatched[0].material.name} 카드 짝맞추기 (${level}단계)`,
          questionText: `${unmatched[0].material.name} 카드 짝을 찾아보세요.`,
          correctAnswer: unmatched[0].material.name,
          category: '기억력',
          emoji: unmatched[0].material.emoji || '❓',
          attempts: 3,
          timestamp: new Date().toISOString(),
          graduated: false,
          explanation: `${unmatched[0].material.name} 똑같은 그림 2장입니다.`,
        });
      }

      setTimeout(() => {
        setCards(prev =>
          prev.map(c =>
            c.uid === card1.uid || c.uid === card2.uid ? { ...c, isFlipped: false } : c
          )
        );
        setFlippedUids([]);
        setIsLocked(false);
      }, 1500);
    }
  };

  const handleAllMatched = async () => {
    setIsRoundFinished(true);
    playSfx('success');
    speak('와아! 모든 짝을 다 찾았어요! 대단해요!');
    confetti({ particleCount: 65, spread: 75 });

    await recordGameStats('memory', profileId, 3);
    onAwardSticker('기억력 쑥쑥 스티커', level >= 50 ? 'special' : 'normal');

    // Save and advance level progress
    const nextLvl = Math.min(100, level + 1);
    const newHighest = Math.max(highestLevel, nextLvl);
    setHighestLevel(newHighest);
    await saveGameProgress('memory', profileId, nextLvl, newHighest);

    // Auto next countdown (3 seconds)
    let count = 4;
    setAutoNextCountdown(count);
    autoNextTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current);
        proceedNextLevel();
      } else {
        setAutoNextCountdown(count);
      }
    }, 1000);
  };

  const proceedNextLevel = (customLevel?: number) => {
    clearAllTimers();
    setIsRoundFinished(false);
    setAutoNextCountdown(null);
    setRoundNumber(r => r + 1);

    const target = customLevel ?? Math.min(100, level + 1);
    setLevel(target);
    saveGameProgress('memory', profileId, target);
    startNewGame(target);
  };

  const currentConfig = getMemoryConfigForLevel(level);

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col items-center justify-between p-1.5 sm:p-3 md:p-6 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-3xl flex items-center justify-between bg-white/90 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl shadow-md border-2 border-amber-200 shrink-0">
        <button
          onClick={() => {
            playSfx('button');
            setShowLevelModal(true);
          }}
          className="flex items-center gap-1.5 sm:gap-2 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 active:scale-95 transition-all"
        >
          <span className="font-kids text-stone-800 text-sm sm:text-base md:text-lg font-bold">
            {getLevelTitle(level)} · {currentConfig.pairCount * 2}장
          </span>
          <ListOrdered className="w-4 h-4 text-amber-600" />
        </button>

        {/* Category Filter */}
        <div className="flex items-center gap-1">
          {['전체', '과일', '동물', '탈것'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playSfx('button');
                setCategoryFilter(cat);
                startNewGame(level);
              }}
              className={`px-2 sm:px-3 py-1 rounded-xl font-kids text-xs transition-all ${
                categoryFilter === cat
                  ? 'bg-amber-400 text-amber-950 border border-amber-500 font-bold'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3차 오답 가이드 배너 */}
      <WrongAnswerGuide
        errorCount={consecutiveMismatches}
        hintText="토끼가 힌트를 줄게요! 같은 카드를 떠올려보세요."
        solutionText="토끼가 짝을 반짝이며 알려줄게요!"
      />

      {/* Cards Grid */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center w-full max-w-4xl p-1 sm:p-2 my-1">
        <div
          className={`grid gap-2 sm:gap-3 md:gap-5 justify-center items-center ${
            cards.length <= 4
              ? 'grid-cols-2 sm:grid-cols-4'
              : cards.length <= 6
              ? 'grid-cols-3 sm:grid-cols-3'
              : cards.length <= 8
              ? 'grid-cols-4 sm:grid-cols-4'
              : 'grid-cols-4 sm:grid-cols-6'
          }`}
        >
          {cards.map((card) => {
            const isOpen = card.isFlipped || card.isMatched;
            const isHinted = hintPairUids.includes(card.uid);

            return (
              <div
                key={card.uid}
                onClick={() => handleCardClick(card)}
                className={`w-16 h-22 sm:w-24 sm:h-32 md:w-32 md:h-44 rounded-xl sm:rounded-3xl cursor-pointer select-none transition-all duration-300 transform active:scale-95 flex flex-col items-center justify-center p-1 sm:p-2 shadow-md border-2 sm:border-4 relative ${
                  card.isMatched
                    ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-300 scale-95 opacity-80'
                    : isHinted
                    ? 'bg-yellow-200 border-yellow-500 ring-4 ring-yellow-400 animate-bounce'
                    : isOpen
                    ? 'bg-white border-amber-300 rotate-0'
                    : 'bg-gradient-to-br from-amber-400 to-amber-500 border-white hover:scale-105'
                }`}
              >
                {isHinted && !isOpen && (
                  <span className="absolute -top-2 bg-amber-500 text-white font-kids text-[9px] px-1.5 py-0.2 rounded-full shadow">
                    🐰 짝!
                  </span>
                )}
                {isOpen ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-3xl sm:text-4xl md:text-5xl drop-shadow-sm mb-0.5">
                      {card.material.emoji || '🍎'}
                    </span>
                    <span className="font-kids text-stone-800 text-xs sm:text-sm truncate max-w-full">
                      {card.material.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-white">
                    <span className="text-2xl sm:text-3xl opacity-80">❓</span>
                    <span className="font-kids text-[9px] sm:text-[11px] text-amber-100 mt-0.5">토끼 카드</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pb-2 flex items-center gap-2">
        <button
          onClick={() => {
            playSfx('button');
            startNewGame(level);
          }}
          className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-white hover:bg-amber-50 text-stone-700 font-kids text-sm sm:text-base shadow-md border-2 border-amber-200 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-amber-500" />
          <span>새로 섞기</span>
        </button>
      </div>

      {/* Level Selector Modal */}
      <LevelSelectorModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        gameTitle="짝맞추기"
        currentLevel={level}
        highestLevel={highestLevel}
        onSelectLevel={(lvl) => proceedNextLevel(lvl)}
      />

      {/* Round Finished Victory Modal */}
      {isRoundFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative max-w-sm sm:max-w-md w-full bg-white rounded-3xl p-6 text-center border-4 border-amber-300 shadow-2xl flex flex-col items-center">
            <span className="text-6xl animate-bounce mb-2">🏆</span>
            <h3 className="font-kids text-2xl sm:text-3xl text-stone-800 mb-1">
              {level}단계 완성!
            </h3>
            <p className="font-kids text-amber-700 text-sm sm:text-base mb-3">
              모든 짝을 완벽하게 맞췄어요!
            </p>

            {autoNextCountdown !== null && (
              <p className="font-kids text-xs text-stone-400 mb-4">
                ({autoNextCountdown}초 뒤 다음 단계로 자동 이동해요)
              </p>
            )}

            <div className="w-full flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => proceedNextLevel(Math.min(100, level + 1))}
                className="w-full flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-kids text-base shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{Math.min(100, level + 1)}단계 바로 도전!</span>
              </button>

              <button
                onClick={onFinishRound}
                className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-kids text-sm flex items-center justify-center gap-1 active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>메인으로</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
