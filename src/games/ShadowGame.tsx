import React, { useState, useEffect, useRef } from 'react';
import { LearningMaterial } from '../types';
import { speak, playSfx } from '../utils/audio';
import { 
  addReviewRecord, 
  recordGameStats, 
  getGameProgress, 
  saveGameProgress 
} from '../utils/db';
import { getShadowConfigForLevel, getLevelTitle } from '../utils/levels';
import { LevelSelectorModal } from '../components/LevelSelectorModal';
import { WrongAnswerGuide } from '../components/WrongAnswerGuide';
import { Play, Home, ListOrdered } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShadowGameProps {
  materials: LearningMaterial[];
  onAwardSticker: (name: string, rarity?: 'normal' | 'bonus' | 'special' | 'effort') => void;
  onFinishRound: () => void;
  profileId: string;
  interactionMode?: 'tap' | 'drag';
}

interface ShadowQuestion {
  target: LearningMaterial;
  choices: LearningMaterial[];
}

export const ShadowGame: React.FC<ShadowGameProps> = ({
  materials,
  onAwardSticker,
  onFinishRound,
  profileId,
}) => {
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0); // 0 to 4
  const [correctCount, setCorrectCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<ShadowQuestion | null>(null);
  const [silhouetteDataUrl, setSilhouetteDataUrl] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState(false);

  // 3차 오답 처리 상태
  const [errorCount, setErrorCount] = useState(0); // 0, 1, 2, 3
  const [dimmedIds, setDimmedIds] = useState<string[]>([]);

  // Round finished modal
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);

  // Silhouette cache
  const silhouetteCacheRef = useRef<Map<string, string>>(new Map());

  // Load persistent progress on mount
  useEffect(() => {
    async function loadProgress() {
      const prog = await getGameProgress('shadow', profileId);
      setLevel(prog.currentLevel);
      setHighestLevel(prog.highestLevel);
      startNewQuestion(prog.currentLevel, 0);
    }
    loadProgress();
  }, [profileId]);

  // Generate silhouette on canvas (#2B2B2B)
  const generateSilhouette = (emoji: string): string => {
    if (silhouetteCacheRef.current.has(emoji)) {
      return silhouetteCacheRef.current.get(emoji)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.font = '100px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 80, 85);

    const imgData = ctx.getImageData(0, 0, 160, 160);
    for (let i = 0; i < imgData.data.length; i += 4) {
      if (imgData.data[i + 3] > 40) {
        imgData.data[i] = 43;     // #2B
        imgData.data[i + 1] = 43; // #2B
        imgData.data[i + 2] = 43; // #2B
        imgData.data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const dataUrl = canvas.toDataURL();
    silhouetteCacheRef.current.set(emoji, dataUrl);
    return dataUrl;
  };

  const startNewQuestion = (targetLevel: number = level, qIdx: number = questionIndex) => {
    setIsRevealed(false);
    setDimmedIds([]);
    setErrorCount(0);

    const config = getShadowConfigForLevel(targetLevel);
    const pool = materials.filter(m => m.enabled !== false);
    const activePool = pool.length > 0 ? pool : materials;
    const target = activePool[Math.floor(Math.random() * activePool.length)];

    const choicesSet = new Set<LearningMaterial>([target]);

    while (choicesSet.size < config.choiceCount) {
      let candidatePool = activePool;
      if (config.hasSubtleDistractors) {
        const sameCat = activePool.filter(p => p.category === target.category && p.id !== target.id);
        if (sameCat.length >= 2) candidatePool = sameCat;
      }
      const rand = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      choicesSet.add(rand);
    }

    const choices = Array.from(choicesSet).sort(() => Math.random() - 0.5);
    setCurrentQuestion({ target, choices });

    const sUrl = generateSilhouette(target.emoji || '🐰');
    setSilhouetteDataUrl(sUrl);

    speak('누구의 그림자일까요? 꼭 맞는 그림을 찾아보세요!');
  };

  const handleChoiceSelect = (item: LearningMaterial) => {
    if (!currentQuestion || isRevealed || dimmedIds.includes(item.id)) return;

    if (item.id === currentQuestion.target.id) {
      // Correct!
      handleCorrect(item);
    } else {
      // Wrong! 3-Tier Error Handling
      handleWrong(item);
    }
  };

  const handleCorrect = (item: LearningMaterial) => {
    if (!currentQuestion) return;
    setIsRevealed(true);
    playSfx('correct');
    speak(`정답이에요! ${item.name}이에요!`);
    confetti({ particleCount: 35, spread: 55 });

    const newCorrect = correctCount + 1;
    setCorrectCount(newCorrect);

    if (errorCount > 0) {
      onAwardSticker('노력상 스티커', 'effort');
    } else {
      onAwardSticker('그림자 탐정 스티커', 'normal');
    }

    setTimeout(() => {
      if (questionIndex >= 4) {
        handleRoundComplete(newCorrect);
      } else {
        const nextIdx = questionIndex + 1;
        setQuestionIndex(nextIdx);
        startNewQuestion(level, nextIdx);
      }
    }, 1800);
  };

  const handleWrong = async (item: LearningMaterial) => {
    if (!currentQuestion) return;
    const nextError = errorCount + 1;
    setErrorCount(nextError);

    if (nextError === 1) {
      // 1차 오답: 부드러운 음성 안내 + 오답 카드 살짝 흐려짐
      playSfx('gentle');
      speak('다시 해볼까? 모양의 뾰족한 곳이나 둥근 곳을 보세요.');
      setDimmedIds(prev => [...prev, item.id]);
    } else if (nextError === 2) {
      // 2차 오답: 추가 오답 제거 + 정답 카드 반짝임 힌트
      playSfx('gentle');
      speak('토끼가 힌트를 줄게요! 반짝이는 곳을 보세요.');
      const otherWrongs = currentQuestion.choices.filter(
        c => c.id !== currentQuestion.target.id && c.id !== item.id
      );
      if (otherWrongs.length > 0) {
        setDimmedIds(prev => [...prev, item.id, otherWrongs[0].id]);
      } else {
        setDimmedIds(prev => [...prev, item.id]);
      }
    } else {
      // 3차 오답: 정답 친절히 공개 + 오답노트 자동 등록 + 응원 스티커
      playSfx('sticker');
      speak(`정답은 ${currentQuestion.target.name}이에요! 토끼가 응원 스티커를 줄게요.`);
      onAwardSticker('응원 스티커', 'effort');

      // 오답노트에 자동 등록
      await addReviewRecord({
        profileId,
        gameType: 'shadow',
        title: `${currentQuestion.target.name} 그림자 찾기 (${level}단계)`,
        questionText: `이 그림자는 누구의 그림자일까요?`,
        correctAnswer: currentQuestion.target.name,
        userAnswer: item.name,
        category: '그림자',
        emoji: currentQuestion.target.emoji || '👤',
        attempts: 3,
        timestamp: new Date().toISOString(),
        graduated: false,
        explanation: `${currentQuestion.target.name}의 외곽선 그림자입니다.`,
        choices: currentQuestion.choices.map(c => c.name),
      });
    }
  };

  const handleRoundComplete = async (finalCorrect: number) => {
    setIsRoundFinished(true);
    playSfx('success');
    speak('다섯 문제 모두 완성! 최고예요!');
    confetti({ particleCount: 60, spread: 70 });

    await recordGameStats('shadow', profileId, finalCorrect);

    // Save and advance level progress
    const nextLvl = Math.min(100, level + 1);
    const newHighest = Math.max(highestLevel, nextLvl);
    setHighestLevel(newHighest);
    await saveGameProgress('shadow', profileId, nextLvl, newHighest);

    // Auto next countdown
    let count = 4;
    setAutoNextCountdown(count);
    const timer = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(timer);
        proceedNextLevel();
      } else {
        setAutoNextCountdown(count);
      }
    }, 1000);
  };

  const proceedNextLevel = (customLevel?: number) => {
    setAutoNextCountdown(null);
    setIsRoundFinished(false);
    setQuestionIndex(0);
    setCorrectCount(0);
    const target = customLevel ?? Math.min(100, level + 1);
    setLevel(target);
    saveGameProgress('shadow', profileId, target);
    startNewQuestion(target, 0);
  };

  if (!currentQuestion) return null;

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col items-center justify-between p-1.5 sm:p-3 md:p-6 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-white/90 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl shadow-md border-2 border-amber-200 shrink-0">
        <button
          onClick={() => {
            playSfx('button');
            setShowLevelModal(true);
          }}
          className="flex items-center gap-1.5 sm:gap-2 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 active:scale-95 transition-all"
        >
          <span className="font-kids text-stone-800 text-sm sm:text-base md:text-lg font-bold">
            {getLevelTitle(level)}
          </span>
          <ListOrdered className="w-4 h-4 text-amber-600" />
        </button>

        {/* Question dots */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all ${
                idx < questionIndex
                  ? 'bg-amber-400 scale-100'
                  : idx === questionIndex
                  ? 'bg-amber-500 scale-125 ring-2 ring-amber-300'
                  : 'bg-stone-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 3차 오답 가이드 배너 */}
      <WrongAnswerGuide
        errorCount={errorCount}
        hintText="토끼가 힌트를 줄게요! 반짝이는 카드를 보세요."
        solutionText={`정답은 ${currentQuestion.target.name}이에요! 반짝이는 카드를 콕 눌러보세요!`}
      />

      {/* Center: Silhouette Display Box */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center my-0.5 sm:my-2">
        <div className="w-28 h-28 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-3xl bg-amber-50/90 shadow-xl border-4 border-amber-300 flex items-center justify-center p-2 relative overflow-hidden transition-all duration-500">
          {isRevealed ? (
            <span className="text-6xl sm:text-8xl md:text-9xl animate-gentle-pulse">
              {currentQuestion.target.emoji}
            </span>
          ) : silhouetteDataUrl ? (
            <img
              src={silhouetteDataUrl}
              alt="그림자"
              className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
            />
          ) : (
            <span className="text-5xl sm:text-7xl">❓</span>
          )}

          {isRevealed && (
            <div className="absolute inset-0 bg-amber-300/20 backdrop-blur-[1px] flex items-center justify-center">
              <span className="font-kids text-amber-900 text-lg sm:text-2xl bg-white/95 px-3 py-1 rounded-2xl shadow-md border-2 border-amber-400">
                {currentQuestion.target.name}!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Candidate Cards */}
      <div className="w-full max-w-2xl flex items-center justify-center gap-2 sm:gap-4 pb-2 shrink-0">
        {currentQuestion.choices.map((choice) => {
          const isDimmed = dimmedIds.includes(choice.id);
          const isCorrect = choice.id === currentQuestion.target.id;
          const isHintBlinking = (errorCount === 2 || errorCount >= 3) && isCorrect;

          return (
            <button
              key={choice.id}
              onClick={() => handleChoiceSelect(choice)}
              disabled={isDimmed && !isCorrect}
              className={`flex-1 min-h-[72px] sm:min-h-[100px] md:min-h-[130px] p-2 rounded-2xl sm:rounded-3xl shadow-md border-2 sm:border-4 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer relative ${
                isDimmed && !isCorrect
                  ? 'opacity-25 bg-stone-100 border-stone-200 cursor-not-allowed'
                  : isHintBlinking
                  ? 'bg-amber-100 border-amber-500 ring-4 ring-yellow-400 animate-bounce'
                  : 'bg-white hover:bg-amber-50 border-amber-200'
              }`}
            >
              {isHintBlinking && (
                <span className="absolute -top-3 bg-amber-500 text-white font-kids text-[10px] px-2 py-0.5 rounded-full shadow">
                  🐰 여기 콕!
                </span>
              )}
              <span className="text-3xl sm:text-5xl md:text-6xl drop-shadow-sm">
                {choice.emoji}
              </span>
              <span className="font-kids text-stone-800 text-xs sm:text-sm md:text-base font-bold">
                {choice.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Level Selector Modal */}
      <LevelSelectorModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        gameTitle="그림자 놀이"
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
              5문제 중 <strong>{correctCount}</strong>문제를 맞혔어요!
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
                <span>{Math.min(100, level + 1)}단계 도전!</span>
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
