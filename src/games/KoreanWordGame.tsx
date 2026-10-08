import React, { useState, useEffect } from 'react';
import { LearningMaterial } from '../types';
import { speak, playSfx } from '../utils/audio';
import { 
  addReviewRecord, 
  recordGameStats, 
  getGameProgress, 
  saveGameProgress 
} from '../utils/db';
import { getWordConfigForLevel, getLevelTitle } from '../utils/levels';
import { LevelSelectorModal } from '../components/LevelSelectorModal';
import { WrongAnswerGuide } from '../components/WrongAnswerGuide';
import { ChevronLeft, ChevronRight, Volume2, Sparkles, Play, Home, ListOrdered, Lightbulb, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KoreanWordGameProps {
  materials: LearningMaterial[];
  onAwardSticker: (name: string, rarity?: 'normal' | 'bonus' | 'special' | 'effort') => void;
  onFinishRound: () => void;
  profileId: string;
}

export const KoreanWordGame: React.FC<KoreanWordGameProps> = ({
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

  // Question targets
  const [targetItem, setTargetItem] = useState<LearningMaterial | null>(null);
  const [choices, setChoices] = useState<LearningMaterial[]>([]);
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number | null>(null);

  // 문제 이미지 숨김 & 힌트/정답 공개 상태
  const [isImageRevealed, setIsImageRevealed] = useState(false);
  const [isPeekingHint, setIsPeekingHint] = useState(false);

  // 3차 오답 처리
  const [errorCount, setErrorCount] = useState(0); // 0, 1, 2, 3
  const [dimmedIds, setDimmedIds] = useState<string[]>([]);

  // Round finished modal
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);

  const activeMaterials = materials.filter(m => m.enabled !== false);

  // Load persistent progress on mount
  useEffect(() => {
    async function loadProgress() {
      const prog = await getGameProgress('words', profileId);
      setLevel(prog.currentLevel);
      setHighestLevel(prog.highestLevel);
      startNewQuestion(prog.currentLevel, 0);
    }
    loadProgress();
  }, [profileId]);

  const startNewQuestion = (targetLevel: number = level, qIdx: number = questionIndex) => {
    setErrorCount(0);
    setDimmedIds([]);
    setActiveSyllableIndex(null);

    const config = getWordConfigForLevel(targetLevel);
    const pool = activeMaterials.length > 0 ? activeMaterials : materials;

    // Filter by syllable count if available
    let eligible = pool.filter(m => {
      const sylCount = m.syllables ? m.syllables.length : m.name.length;
      return sylCount >= config.minSyllables && sylCount <= config.maxSyllables;
    });
    if (eligible.length === 0) eligible = pool;

    const target = eligible[Math.floor(Math.random() * eligible.length)];
    const choicesSet = new Set<LearningMaterial>([target]);

    while (choicesSet.size < config.choiceCount) {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      choicesSet.add(rand);
    }

    const shuffledChoices = Array.from(choicesSet).sort(() => Math.random() - 0.5);
    setTargetItem(target);
    setChoices(shuffledChoices);
    setIsImageRevealed(false);
    setIsPeekingHint(false);

    if (config.mode === 'firstSound') {
      const first = target.firstSound || target.name[0];
      speak(`'${first}'(으)로 시작하는 낱말은 무엇일까요?`);
    } else {
      speak(`${target.name}은(는) 어디에 있을까요?`);
    }
  };

  const handleSyllableTap = (syllable: string, idx: number) => {
    playSfx('button');
    setActiveSyllableIndex(idx);
    speak(syllable);
  };

  const handlePeekHint = () => {
    if (isImageRevealed || isPeekingHint || !targetItem) return;
    playSfx('button');
    setIsPeekingHint(true);
    speak(`${targetItem.name} 힌트예요!`);
    setTimeout(() => {
      setIsPeekingHint(false);
    }, 2000);
  };

  const handleChoiceTap = (choice: LearningMaterial) => {
    if (!targetItem || dimmedIds.includes(choice.id)) return;

    if (choice.id === targetItem.id) {
      // Correct!
      handleCorrect(choice);
    } else {
      // Wrong! 3-Tier Error Handling
      handleWrong(choice);
    }
  };

  const handleCorrect = (choice: LearningMaterial) => {
    setIsImageRevealed(true);
    playSfx('correct');
    speak(`딩동댕! ${choice.name}을(를) 맞췄어요!`);
    confetti({ particleCount: 35, spread: 55 });

    const newCorrect = correctCount + 1;
    setCorrectCount(newCorrect);

    if (errorCount > 0) {
      onAwardSticker('노력상 스티커', 'effort');
    } else {
      onAwardSticker('한글 척척 스티커', 'normal');
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

  const handleWrong = async (choice: LearningMaterial) => {
    if (!targetItem) return;
    const nextError = errorCount + 1;
    setErrorCount(nextError);

    if (nextError === 1) {
      // 1차 오답: 부드러운 음성 안내 + 오답 카드 흐려짐
      playSfx('gentle');
      speak(`다시 들어볼까요? ${targetItem.name}을(를) 찾아보세요.`);
      setDimmedIds(prev => [...prev, choice.id]);
    } else if (nextError === 2) {
      // 2차 오답: 추가 오답 제거 + 정답 카드 반짝임 힌트
      playSfx('gentle');
      speak('토끼가 힌트를 줄게요! 반짝이는 곳을 보세요.');
      const otherWrongs = choices.filter(c => c.id !== targetItem.id && c.id !== choice.id);
      if (otherWrongs.length > 0) {
        setDimmedIds(prev => [...prev, choice.id, otherWrongs[0].id]);
      } else {
        setDimmedIds(prev => [...prev, choice.id]);
      }
    } else {
      // 3차 오답: 정답 공개 + 오답노트 자동 등록 + 응원 스티커
      setIsImageRevealed(true);
      playSfx('sticker');
      speak(`정답은 바로 ${targetItem.name}이에요! 토끼가 응원 스티커를 줄게요.`);
      onAwardSticker('응원 스티커', 'effort');

      // 오답노트에 자동 등록
      await addReviewRecord({
        profileId,
        gameType: 'words',
        title: `${targetItem.name} 낱말 맞추기 (${level}단계)`,
        questionText: `'${targetItem.name}' 낱말을 찾아보세요.`,
        correctAnswer: targetItem.name,
        userAnswer: choice.name,
        category: '한글',
        emoji: targetItem.emoji || '✏️',
        attempts: 3,
        timestamp: new Date().toISOString(),
        graduated: false,
        explanation: `${targetItem.name}의 글자와 그림입니다.`,
        choices: choices.map(c => c.name),
      });
    }
  };

  const handleRoundComplete = async (finalCorrect: number) => {
    setIsRoundFinished(true);
    playSfx('success');
    speak('다섯 문제 모두 완성! 한글 박사님 최고예요!');
    confetti({ particleCount: 60, spread: 70 });

    await recordGameStats('words', profileId, finalCorrect);

    // Save and advance level progress
    const nextLvl = Math.min(100, level + 1);
    const newHighest = Math.max(highestLevel, nextLvl);
    setHighestLevel(newHighest);
    await saveGameProgress('words', profileId, nextLvl, newHighest);

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
    saveGameProgress('words', profileId, target);
    startNewQuestion(target, 0);
  };

  if (!targetItem) return null;

  const currentConfig = getWordConfigForLevel(level);

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
        solutionText={`정답은 '${targetItem.name}'이에요! 반짝이는 카드를 콕 눌러보세요!`}
      />

      {/* Main Big Display Area (문제 영역: 글자 중심 & 이미지는 정답/힌트 시 공개) */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center w-full max-w-2xl my-1">
        <div className="w-full max-w-xs sm:max-w-md bg-white rounded-3xl p-3 sm:p-5 shadow-xl border-4 border-amber-300 flex flex-col items-center text-center">
          
          {/* Picture Box or Mystery Box */}
          <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl flex flex-col items-center justify-center mb-2.5 shadow-inner transition-all overflow-hidden border-2">
            {isImageRevealed || isPeekingHint ? (
              <div className="w-full h-full bg-amber-50 border-amber-300 flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
                <span className="text-6xl sm:text-7xl md:text-8xl drop-shadow-sm animate-bounce">
                  {targetItem.emoji || '✏️'}
                </span>
                <span className={`absolute bottom-1 px-2 py-0.5 rounded-full font-kids text-[10px] sm:text-xs font-bold text-white shadow ${
                  isImageRevealed ? 'bg-emerald-500' : 'bg-amber-500'
                }`}>
                  {isImageRevealed ? '🎉 딩동댕! 정답!' : '💡 힌트 (잠깐 공개)'}
                </span>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/70 border-dashed border-amber-300 flex flex-col items-center justify-center p-2">
                <span className="text-4xl sm:text-5xl md:text-6xl drop-shadow-sm animate-pulse mb-1">
                  ❓
                </span>
                <span className="font-kids text-amber-800 text-[11px] sm:text-xs font-bold bg-white/80 px-2 py-0.5 rounded-full border border-amber-200">
                  어떤 그림일까요?
                </span>
              </div>
            )}
          </div>

          {/* Syllable Buttons (글자 주인공!) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2.5">
            {(targetItem.syllables || targetItem.name.split('')).map((syl, sIdx) => (
              <button
                key={sIdx}
                onClick={() => handleSyllableTap(syl, sIdx)}
                className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl font-kids text-2xl sm:text-3xl md:text-4xl flex items-center justify-center border-2 sm:border-4 transition-all transform active:scale-90 shadow-md ${
                  activeSyllableIndex === sIdx
                    ? 'bg-amber-400 text-white border-amber-500 scale-110 shadow-lg ring-4 ring-amber-200'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                }`}
                title="글자를 누르면 소리가 나요"
              >
                {syl}
              </button>
            ))}
          </div>

          {/* Sound & Hint Buttons Row */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                playSfx('button');
                speak(targetItem.name);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-kids text-xs sm:text-sm active:scale-95 transition-all border border-amber-200 shadow-sm"
            >
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>소리 듣기</span>
            </button>

            {!isImageRevealed && (
              <button
                onClick={handlePeekHint}
                disabled={isPeekingHint}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-kids text-xs sm:text-sm active:scale-95 transition-all border border-yellow-300 shadow-sm disabled:opacity-50"
              >
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>그림 힌트</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Candidate Cards */}
      <div className="w-full max-w-2xl flex items-center justify-center gap-2 sm:gap-3 pb-2 shrink-0">
        {choices.map((choice) => {
          const isDimmed = dimmedIds.includes(choice.id);
          const isCorrect = choice.id === targetItem.id;
          const isHintBlinking = (errorCount === 2 || errorCount >= 3) && isCorrect;

          return (
            <button
              key={choice.id}
              onClick={() => handleChoiceTap(choice)}
              disabled={isDimmed && !isCorrect}
              className={`flex-1 min-h-[64px] sm:min-h-[84px] md:min-h-[110px] p-2 rounded-2xl sm:rounded-3xl shadow-md border-2 sm:border-4 transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 cursor-pointer relative ${
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
              <span className="text-2xl sm:text-4xl md:text-5xl">
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
        gameTitle="한글 놀이"
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
