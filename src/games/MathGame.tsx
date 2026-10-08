import React, { useState, useEffect } from 'react';
import { LearningMaterial } from '../types';
import { speak, playSfx } from '../utils/audio';
import { getKoreanNumberWord, getCountWord } from '../utils/materials';
import { 
  addReviewRecord, 
  recordGameStats, 
  getGameProgress, 
  saveGameProgress 
} from '../utils/db';
import { generateMathQuestion, MathQuestionConfig, getLevelTitle } from '../utils/levels';
import { LevelSelectorModal } from '../components/LevelSelectorModal';
import { WrongAnswerGuide } from '../components/WrongAnswerGuide';
import { Star, RotateCcw, Sparkles, Play, Home, ListOrdered } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MathGameProps {
  materials: LearningMaterial[];
  currentLevel?: number;
  levelStars?: number[];
  profileId: string;
  onAwardSticker: (name: string, rarity?: 'normal' | 'bonus' | 'special' | 'effort') => void;
  onFinishRound: () => void;
  tapConfirmMode: '1tap' | '2tap';
}

export const MathGame: React.FC<MathGameProps> = ({
  materials,
  profileId,
  onAwardSticker,
  onFinishRound,
  tapConfirmMode,
}) => {
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0); // 0 to 4
  const [correctCount, setCorrectCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestionConfig | null>(null);

  // Soft failure handling (3차 오답 처리)
  const [errorCount, setErrorCount] = useState(0); // 0, 1, 2, 3
  const [dimmedChoices, setDimmedChoices] = useState<number[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  // Round summary
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);

  // Load persistent progress on mount
  useEffect(() => {
    async function loadProgress() {
      const prog = await getGameProgress('math', profileId);
      setLevel(prog.currentLevel);
      setHighestLevel(prog.highestLevel);
      startNewQuestion(prog.currentLevel, 0);
    }
    loadProgress();
  }, [profileId]);

  const startNewQuestion = (lvl: number, qIdx: number) => {
    setErrorCount(0);
    setDimmedChoices([]);
    setSelectedCandidate(null);
    setIsMerging(false);

    const q = generateMathQuestion(lvl, materials);
    setCurrentQuestion(q);

    // Speak Korean guidance
    const wordA = getKoreanNumberWord(q.countA);
    const wordB = getKoreanNumberWord(q.countB);
    const text = q.operation === 'add'
      ? `${q.itemA.name} ${wordA} 개랑 ${q.itemB.name} ${wordB} 개를 합치면 모두 몇 개일까요?`
      : `${q.itemA.name} ${wordA} 개에서 ${wordB} 개를 덜어내면 몇 개가 남을까요?`;

    speak(text);
  };

  const handleChoiceTap = async (count: number) => {
    if (!currentQuestion || isMerging) return;
    if (dimmedChoices.includes(count)) return;

    // 2-tap mode confirmation
    if (tapConfirmMode === '2tap' && selectedCandidate !== count) {
      setSelectedCandidate(count);
      playSfx('button');

      let countSeq = '';
      for (let i = 1; i <= Math.min(10, count); i++) {
        countSeq += `${getCountWord(i)}... `;
      }
      speak(countSeq.trim() + ' 한 번 더 누르면 선택해요.');
      return;
    }

    if (count === currentQuestion.total) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer(count);
    }
  };

  const handleCorrectAnswer = async () => {
    if (!currentQuestion) return;
    setIsMerging(true);
    playSfx('correct');
    speak('맞았어요! 정말 잘했어요!');
    confetti({ particleCount: 30, spread: 50 });

    const newCorrectCount = correctCount + 1;
    setCorrectCount(newCorrectCount);

    if (errorCount > 0) {
      onAwardSticker('노력상 스티커', 'effort');
    } else {
      onAwardSticker('수학 척척 스티커', 'normal');
    }

    setTimeout(() => {
      if (questionIndex >= 4) {
        finishRound(newCorrectCount);
      } else {
        setQuestionIndex(q => q + 1);
        startNewQuestion(level, questionIndex + 1);
      }
    }, 1600);
  };

  // 3차 오답 처리 시스템
  const handleWrongAnswer = async (wrongCount: number) => {
    if (!currentQuestion) return;
    const nextError = errorCount + 1;
    setErrorCount(nextError);

    if (nextError === 1) {
      // 1차 오답: 부드러운 격려 음성 + 오답 카드 살짝 흐려짐
      playSfx('gentle');
      speak('다시 해볼까? 찬찬히 세어보자.');
      setDimmedChoices(prev => [...prev, wrongCount]);
    } else if (nextError === 2) {
      // 2차 오답: 50% 보기 축소 + 정답 카드 반짝임 힌트
      playSfx('gentle');
      speak('토끼가 힌트를 줄게요! 반짝이는 곳을 보세요.');
      const otherWrong = currentQuestion.choices.filter(
        c => c !== currentQuestion.total && c !== wrongCount
      );
      if (otherWrong.length > 0) {
        setDimmedChoices(prev => [...prev, wrongCount, otherWrong[0]]);
      } else {
        setDimmedChoices(prev => [...prev, wrongCount]);
      }
    } else {
      // 3차 오답: 정답 친절히 공개 + 오답노트 자동 등록 + 응원 스티커
      playSfx('sticker');
      const totalWord = getKoreanNumberWord(currentQuestion.total);
      speak(`정답은 ${totalWord} 개예요! 토끼가 응원 스티커를 줄게요.`);
      onAwardSticker('응원 스티커', 'effort');

      // 오답노트에 자동 등록
      await addReviewRecord({
        profileId,
        gameType: 'math',
        title: `${currentQuestion.itemA.name} ${currentQuestion.operation === 'add' ? '더하기' : '빼기'} (${level}단계)`,
        questionText: currentQuestion.operation === 'add'
          ? `${currentQuestion.itemA.name} ${currentQuestion.countA}개 + ${currentQuestion.itemB.name} ${currentQuestion.countB}개는?`
          : `${currentQuestion.itemA.name} ${currentQuestion.countA}개 - ${currentQuestion.countB}개는?`,
        correctAnswer: `${currentQuestion.total}`,
        userAnswer: `${wrongCount}`,
        category: '수학',
        emoji: currentQuestion.itemA.emoji || '🍎',
        attempts: 3,
        timestamp: new Date().toISOString(),
        graduated: false,
        explanation: currentQuestion.explanation,
        choices: currentQuestion.choices.map(String),
      });

      // 3차 오답 처리 후 아동이 정답 카드를 직접 탭하여 성공 경험으로 넘어가도록 유지
      // (Blink the correct card with glowing bunny paw)
    }
  };

  const finishRound = async (finalCorrect: number) => {
    setIsRoundFinished(true);
    playSfx('success');
    speak('다섯 문제 모두 완성! 최고예요!');
    confetti({ particleCount: 60, spread: 70 });

    await recordGameStats('math', profileId, finalCorrect);

    // Save and advance level progress
    const nextLvl = Math.min(100, level + 1);
    const newHighest = Math.max(highestLevel, nextLvl);
    setHighestLevel(newHighest);
    await saveGameProgress('math', profileId, nextLvl, newHighest);

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
    saveGameProgress('math', profileId, target);
    startNewQuestion(target, 0);
  };

  if (!currentQuestion) return null;

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
            {getLevelTitle(level)}
          </span>
          <ListOrdered className="w-4 h-4 text-amber-600" />
        </button>

        {/* Question Progress dots */}
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
        solutionText={`정답은 ${getKoreanNumberWord(currentQuestion.total)}개예요! 반짝이는 카드를 콕 눌러보세요!`}
      />

      {/* Center Equation Display */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center w-full max-w-4xl p-1 sm:p-2 my-1">
        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-8 flex-wrap">
          {/* Group A */}
          <div className="flex flex-wrap items-center justify-center gap-1 p-2 sm:p-3 bg-amber-50/90 rounded-2xl border-2 border-amber-300 max-w-[140px] sm:max-w-[200px]">
            {Array.from({ length: currentQuestion.countA }).map((_, i) => (
              <span key={i} className="text-3xl sm:text-5xl md:text-6xl drop-shadow-sm">
                {currentQuestion.itemA.emoji}
              </span>
            ))}
          </div>

          <span className="font-kids text-2xl sm:text-4xl text-amber-600 font-bold">
            {currentQuestion.operation === 'add' ? '➕' : '➖'}
          </span>

          {/* Group B */}
          <div className="flex flex-wrap items-center justify-center gap-1 p-2 sm:p-3 bg-amber-50/90 rounded-2xl border-2 border-amber-300 max-w-[140px] sm:max-w-[200px]">
            {Array.from({ length: currentQuestion.countB }).map((_, i) => (
              <span key={i} className="text-3xl sm:text-5xl md:text-6xl drop-shadow-sm">
                {currentQuestion.itemB.emoji}
              </span>
            ))}
          </div>

          <span className="font-kids text-2xl sm:text-4xl text-amber-600 font-bold">
            🟰
          </span>

          {/* Question Box */}
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-dashed border-amber-400 flex items-center justify-center shadow-inner">
            <span className="font-kids text-2xl sm:text-4xl text-amber-700 animate-pulse">❓</span>
          </div>
        </div>
      </div>

      {/* Bottom Candidate Cards */}
      <div className="w-full max-w-3xl flex items-center justify-center gap-2 sm:gap-4 pb-2 shrink-0">
        {currentQuestion.choices.map((choice) => {
          const isDimmed = dimmedChoices.includes(choice);
          const isCorrect = choice === currentQuestion.total;
          const isHintBlinking = (errorCount === 2 || errorCount >= 3) && isCorrect;
          const isSelected = selectedCandidate === choice;

          return (
            <button
              key={choice}
              onClick={() => handleChoiceTap(choice)}
              disabled={isDimmed && !isCorrect}
              className={`flex-1 min-h-[72px] sm:min-h-[96px] md:min-h-[120px] p-2 rounded-2xl sm:rounded-3xl shadow-md border-2 sm:border-4 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer relative ${
                isDimmed && !isCorrect
                  ? 'opacity-25 bg-stone-100 border-stone-200 cursor-not-allowed'
                  : isHintBlinking
                  ? 'bg-amber-100 border-amber-500 ring-4 ring-yellow-400 animate-bounce'
                  : isSelected
                  ? 'bg-amber-200 border-amber-500 scale-105'
                  : 'bg-white hover:bg-amber-50 border-amber-200'
              }`}
            >
              {isHintBlinking && (
                <span className="absolute -top-3 bg-amber-500 text-white font-kids text-[10px] px-2 py-0.5 rounded-full shadow">
                  🐰 여기 콕!
                </span>
              )}
              <div className="flex flex-wrap items-center justify-center gap-0.5 max-w-[120px]">
                {Array.from({ length: Math.min(10, choice) }).map((_, i) => (
                  <span key={i} className="text-xl sm:text-3xl">
                    {currentQuestion.itemA.emoji}
                  </span>
                ))}
              </div>
              <span className="font-kids text-base sm:text-xl text-stone-800 font-bold">
                {choice}
              </span>
            </button>
          );
        })}
      </div>

      {/* Level Selector Modal */}
      <LevelSelectorModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        gameTitle="숫자 놀이"
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
