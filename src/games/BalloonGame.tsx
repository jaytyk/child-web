import React, { useState, useEffect, useRef } from 'react';
import { speak, playSfx } from '../utils/audio';
import { 
  recordGameStats, 
  getGameProgress, 
  saveGameProgress 
} from '../utils/db';
import { getBalloonConfigForLevel, getLevelTitle } from '../utils/levels';
import { LevelSelectorModal } from '../components/LevelSelectorModal';
import { WrongAnswerGuide } from '../components/WrongAnswerGuide';
import confetti from 'canvas-confetti';
import { Play, Home, ListOrdered, Sparkles, RotateCcw } from 'lucide-react';

interface BalloonGameProps {
  onAwardSticker: (name: string, rarity?: 'normal' | 'bonus' | 'special' | 'effort') => void;
  onFinishRound: () => void;
  profileId: string;
}

interface BalloonItem {
  id: number;
  x: number; // percentage 5 to 85
  y: number; // percentage 110 to -20
  speed: number;
  size: number;
  colorName: string;
  colorHex: string;
  emblem: string;
  isPopped: boolean;
  isRainbow?: boolean;
}

const BALLOON_COLORS = [
  { name: '빨간', hex: '#FF4D4D', emblem: '❤️' },
  { name: '노란', hex: '#FFD32A', emblem: '⭐' },
  { name: '파란', hex: '#3867D6', emblem: '●' },
  { name: '초록', hex: '#20BF6B', emblem: '🔷' },
  { name: '보라', hex: '#8854D0', emblem: '💜' },
  { name: '주황', hex: '#FA8231', emblem: '🔶' },
];

export const BalloonGame: React.FC<BalloonGameProps> = ({
  onAwardSticker,
  onFinishRound,
  profileId,
}) => {
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const [mode, setMode] = useState<'color' | 'number' | 'free'>('color');
  const [targetColor, setTargetColor] = useState(BALLOON_COLORS[0]);
  const [poppedCount, setPoppedCount] = useState(0);
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);

  // 3차 오답 처리
  const [errorCount, setErrorCount] = useState(0);

  const balloonIdRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);

  // Load persistent progress on mount
  useEffect(() => {
    async function loadProgress() {
      const prog = await getGameProgress('balloon', profileId);
      setLevel(prog.currentLevel);
      setHighestLevel(prog.highestLevel);
      startRound(prog.currentLevel);
    }
    loadProgress();

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [profileId]);

  const currentConfig = getBalloonConfigForLevel(level);

  const startRound = (targetLevel: number = level) => {
    setPoppedCount(0);
    setIsFinished(false);
    setAutoNextCountdown(null);
    setBalloons([]);
    setErrorCount(0);

    const randColor = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    setTargetColor(randColor);

    if (mode === 'color') {
      speak(`${randColor.name} 풍선만 팡팡 터뜨려요!`);
    } else {
      speak(`${currentConfig.targetCount}개 풍선을 모두 터뜨려 볼까요?`);
    }
  };

  // Continuous Balloon Spawner
  useEffect(() => {
    if (isFinished) return;

    const spawnInterval = setInterval(() => {
      setBalloons((prev) => {
        if (prev.length >= 8) return prev;

        const isTarget = Math.random() < 0.45;
        const color = isTarget ? targetColor : BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
        const isRainbow = level >= 40 && Math.random() < 0.15;

        const newBalloon: BalloonItem = {
          id: ++balloonIdRef.current,
          x: Math.floor(Math.random() * 75) + 10,
          y: 110,
          speed: (Math.random() * 0.35 + 0.5) * currentConfig.floatSpeedMultiplier,
          size: Math.floor(Math.random() * 30) + 120,
          colorName: color.name,
          colorHex: isRainbow ? 'linear-gradient(45deg, #f093fb, #f5576c)' : color.hex,
          emblem: isRainbow ? '🌈' : color.emblem,
          isPopped: false,
          isRainbow,
        };

        return [...prev, newBalloon];
      });
    }, currentConfig.spawnSpeedMs);

    return () => clearInterval(spawnInterval);
  }, [isFinished, mode, targetColor, currentConfig]);

  // Float animation loop
  useEffect(() => {
    if (isFinished) return;

    let lastTime = performance.now();
    const updateLoop = (now: number) => {
      const dt = (now - lastTime) / 16;
      lastTime = now;

      setBalloons((prev) =>
        prev
          .map((b) => ({
            ...b,
            y: b.y - b.speed * dt,
          }))
          .filter((b) => b.y > -25 && !b.isPopped)
      );

      gameLoopRef.current = requestAnimationFrame(updateLoop);
    };

    gameLoopRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isFinished]);

  const handleBalloonClick = (balloon: BalloonItem) => {
    if (balloon.isPopped || isFinished) return;

    // Check color matching
    if (mode === 'color' && !balloon.isRainbow && balloon.colorName !== targetColor.name) {
      handleWrong();
      return;
    }

    // POP!
    setErrorCount(0);
    playSfx('pop');
    setBalloons((prev) =>
      prev.map((b) => (b.id === balloon.id ? { ...b, isPopped: true } : b))
    );

    const newCount = poppedCount + 1;
    setPoppedCount(newCount);

    if (newCount % 3 === 0) {
      playSfx('correct');
      confetti({ particleCount: 20, spread: 40 });
    }

    if (newCount >= currentConfig.targetCount) {
      handleRoundEnd(newCount);
    }
  };

  const handleWrong = () => {
    const nextErr = errorCount + 1;
    setErrorCount(nextErr);

    if (nextErr === 1) {
      playSfx('gentle');
      speak(`${targetColor.name} 풍선을 찾아봐요!`);
    } else if (nextErr === 2) {
      playSfx('gentle');
      speak(`토끼가 힌트를 줄게요! ${targetColor.name} 풍선이 반짝여요.`);
    } else {
      playSfx('sticker');
      speak(`${targetColor.name} 풍선은 바로 이거예요! 같이 팡 터뜨려요!`);
      onAwardSticker('응원 스티커', 'effort');
    }
  };

  const handleRoundEnd = async (finalCount: number) => {
    setIsFinished(true);
    playSfx('success');
    speak(`우와! 풍선을 ${finalCount}개나 터뜨렸어요!`);
    confetti({ particleCount: 60, spread: 70 });

    await recordGameStats('balloon', profileId, 3);
    onAwardSticker('풍선 팡팡 스티커', level >= 50 ? 'special' : 'bonus');

    // Save and advance level progress
    const nextLvl = Math.min(100, level + 1);
    const newHighest = Math.max(highestLevel, nextLvl);
    setHighestLevel(newHighest);
    await saveGameProgress('balloon', profileId, nextLvl, newHighest);

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
    setIsFinished(false);
    const target = customLevel ?? Math.min(100, level + 1);
    setLevel(target);
    saveGameProgress('balloon', profileId, target);
    startRound(target);
  };

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col items-center justify-between p-1.5 sm:p-3 select-none overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50">
      {/* Top Banner */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-white/90 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl shadow-md border-2 border-amber-200 z-20 shrink-0">
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

        {/* Target Indicator */}
        {mode === 'color' && (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-100/80 px-2.5 sm:px-3 py-1 rounded-xl">
            <span className="font-kids text-stone-800 text-xs sm:text-sm">목표:</span>
            <div
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white shadow-sm flex items-center justify-center text-[10px]"
              style={{ backgroundColor: targetColor.hex }}
            >
              {targetColor.emblem}
            </div>
            <span className="font-kids text-xs sm:text-sm text-amber-900 font-bold">
              {targetColor.name} ({poppedCount}/{currentConfig.targetCount})
            </span>
          </div>
        )}
      </div>

      {/* 3차 오답 가이드 배너 */}
      <WrongAnswerGuide
        errorCount={errorCount}
        hintText={`토끼가 힌트를 줄게요! ${targetColor.name} 풍선만 터뜨려보세요.`}
        solutionText={`반짝이는 ${targetColor.name} 풍선을 콕 터뜨려보세요!`}
      />

      {/* Balloon Floating Stage */}
      <div className="relative flex-1 w-full max-w-3xl min-h-0 overflow-hidden">
        {balloons.map((b) => {
          const isTarget = mode === 'color' && (b.colorName === targetColor.name || b.isRainbow);
          const isHintGlow = errorCount >= 2 && isTarget;

          return (
            <div
              key={b.id}
              onClick={() => handleBalloonClick(b)}
              className={`absolute cursor-pointer transition-transform transform active:scale-90 ${
                b.isPopped ? 'scale-150 opacity-0 pointer-events-none' : 'hover:scale-105'
              }`}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.size}px`,
                height: `${b.size * 1.25}px`,
              }}
            >
              {isHintGlow && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-kids text-[10px] px-2 py-0.5 rounded-full shadow z-30 animate-bounce whitespace-nowrap">
                  🐰 팡!
                </div>
              )}
              {/* Balloon Body SVG */}
              <div
                className={`w-full h-full relative flex items-center justify-center rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] shadow-lg border-2 border-white/60 ${
                  isHintGlow ? 'ring-4 ring-yellow-400 animate-pulse' : ''
                }`}
                style={{
                  background: b.colorHex.startsWith('linear') ? b.colorHex : b.colorHex,
                }}
              >
                <div className="absolute top-3 left-3 w-5 h-8 bg-white/40 rounded-full rotate-[-30deg]" />
                <span className="text-3xl sm:text-4xl select-none drop-shadow">
                  {b.emblem}
                </span>
                <div className="absolute -bottom-2 w-3 h-3 bg-amber-800/40 rounded-full" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Level Selector Modal */}
      <LevelSelectorModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        gameTitle="풍선 팡팡"
        currentLevel={level}
        highestLevel={highestLevel}
        onSelectLevel={(lvl) => proceedNextLevel(lvl)}
      />

      {/* Victory Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative max-w-sm sm:max-w-md w-full bg-white rounded-3xl p-6 text-center border-4 border-amber-300 shadow-2xl flex flex-col items-center">
            <span className="text-6xl animate-bounce mb-2">🎈</span>
            <h3 className="font-kids text-2xl sm:text-3xl text-stone-800 mb-1">
              {level}단계 완성!
            </h3>
            <p className="font-kids text-amber-700 text-sm sm:text-base mb-3">
              총 <strong>{poppedCount}</strong>개의 풍선을 팡팡 터뜨렸어요!
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
