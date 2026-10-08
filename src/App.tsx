import React, { useState, useEffect, useRef } from 'react';
import { GameType, AppSettings, StickerItem, LearningMaterial, ColoringTemplate, GameProgress } from './types';
import { 
  initDatabase, 
  loadSettings, 
  saveSettings, 
  getUnlockedStickers, 
  unlockSticker, 
  getAllAssets, 
  getAllTemplates, 
  getMathProgress,
  getEncouragingMessages,
  getAllReviewRecords,
  getAllGameProgresses,
  getLastPlayedGameSync
} from './utils/db';
import { speak, playSfx, activateAudio, updateAudioSettings } from './utils/audio';
import { getRandomSticker } from './utils/stickers';

// Components
import { TopBar } from './components/TopBar';
import { Mascot } from './components/Mascot';
import { ParentalGateModal } from './components/ParentalGateModal';
import { ScreenTimeManager } from './components/ScreenTimeManager';
import { StickerBook } from './components/StickerBook';
import { ParentDashboard } from './components/ParentDashboard';
import { WrongAnswerNotebook } from './components/WrongAnswerNotebook';

// Games
import { ColoringGame } from './games/ColoringGame';
import { MathGame } from './games/MathGame';
import { MazeGame } from './games/MazeGame';
import { MemoryGame } from './games/MemoryGame';
import { ShadowGame } from './games/ShadowGame';
import { BalloonGame } from './games/BalloonGame';
import { KoreanWordGame } from './games/KoreanWordGame';

// Lucide Icons for Home
import { 
  Palette, 
  Calculator, 
  Compass, 
  Layers, 
  Eye, 
  PartyPopper, 
  BookOpen, 
  Sparkles, 
  Coffee,
  Heart,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameType | 'home'>('home');
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [isParentModeActive, setIsParentModeActive] = useState(false);
  const parentModeTimerRef = useRef<number | null>(null);

  // Data states
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [templates, setTemplates] = useState<ColoringTemplate[]>([]);
  const [mathLevel, setMathLevel] = useState(1);
  const [mathStars, setMathStars] = useState<number[]>([0, 0, 0, 0, 0]);

  // Modals
  const [showParentGate, setShowParentGate] = useState(false);
  const [showParentDashboard, setShowParentDashboard] = useState(false);
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [celebratedSticker, setCelebratedSticker] = useState<StickerItem | null>(null);

  // Review Notebook & Game Progress (100단계 및 이어하기)
  const [showReviewNotebook, setShowReviewNotebook] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [gameProgresses, setGameProgresses] = useState<Record<string, GameProgress>>({});
  const [lastPlayed, setLastPlayed] = useState<{ gameId: string; level: number; title: string } | null>(null);

  const refreshProgressAndReview = async (profId: string = settings.activeProfileId) => {
    try {
      const revs = await getAllReviewRecords(profId);
      setPendingReviewCount(revs.filter(r => !r.graduated).length);
      const progs = await getAllGameProgresses(profId);
      setGameProgresses(progs);
      const last = getLastPlayedGameSync(profId);
      setLastPlayed(last);
    } catch (err) {
      console.warn('Failed to refresh progress:', err);
    }
  };

  // Consecutive rounds for rest suggestion
  const [consecutiveRounds, setConsecutiveRounds] = useState(0);
  const [showRestSuggestion, setShowRestSuggestion] = useState(false);

  // Mascot bubble text on home
  const [mascotBubble, setMascotBubble] = useState('어떤 놀이 할까요?');

  // Initialize DB and load resources
  useEffect(() => {
    async function setup() {
      await initDatabase();
      const stks = await getUnlockedStickers();
      setStickers(stks);

      const mats = await getAllAssets();
      setMaterials(mats);

      const tpls = await getAllTemplates();
      setTemplates(tpls);

      const mProg = await getMathProgress(settings.activeProfileId);
      setMathLevel(mProg.currentLevel);
      setMathStars(mProg.stars);

      await refreshProgressAndReview(settings.activeProfileId);

      updateAudioSettings({
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.speechVolume,
        sfxVolume: settings.sfxVolume,
      });

      // Check encouraging messages on launch
      const msgs = await getEncouragingMessages();
      if (msgs.length > 0) {
        const nextMsg = msgs.find(m => m.timing === 'next_login') || msgs[0];
        if (nextMsg) {
          setTimeout(() => {
            speak(`${nextMsg.author}가 말했어요: ${nextMsg.text}`);
            setMascotBubble(`${nextMsg.author}: "${nextMsg.text}"`);
          }, 1200);
          return;
        }
      }

      // Default welcome voice
      setTimeout(() => {
        speak('어떤 놀이 할까요? 좋아하는 그림을 콕 눌러보세요!');
      }, 700);
    }
    setup();
  }, []);

  // First user interaction audio activation & toddler edge guard
  useEffect(() => {
    const handleFirstTouch = () => {
      activateAudio();
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
    window.addEventListener('click', handleFirstTouch);
    window.addEventListener('touchstart', handleFirstTouch);

    // Toddler Touch Guard:
    // 1. Multi-touch ignore: if touches > 1, cancel
    // 2. Screen edge ignore: ignore accidental bezel touch ON BACKGROUND ONLY (never block buttons or cards!)
    const handleTouchStartGuard = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // Multi-touch reject
        e.preventDefault();
        return;
      }
      const target = e.target as HTMLElement | null;
      const isInteractive = target && (
        target.closest('button') ||
        target.closest('canvas') ||
        target.closest('input') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.cursor-pointer')
      );
      if (isInteractive) return; // Always allow touches on buttons & interactive elements!

      const touch = e.touches[0];
      // On narrow mobile devices, use smaller bezel margin so cards near edge are never blocked
      const edgeThreshold = window.innerWidth < 640 ? 6 : 16;
      if (
        touch.clientX < edgeThreshold ||
        touch.clientX > window.innerWidth - edgeThreshold ||
        touch.clientY < edgeThreshold ||
        touch.clientY > window.innerHeight - edgeThreshold
      ) {
        // Bezel accidental grip reject on non-interactive backdrop
        e.preventDefault();
      }
    };

    window.addEventListener('touchstart', handleTouchStartGuard, { passive: false });
    return () => {
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('touchstart', handleTouchStartGuard);
    };
  }, []);

  // Update Settings Helper
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Parental Mode Activation (10-minute window)
  const activateParentMode = () => {
    setIsParentModeActive(true);
    if (parentModeTimerRef.current) clearTimeout(parentModeTimerRef.current);
    parentModeTimerRef.current = window.setTimeout(() => {
      setIsParentModeActive(false);
    }, 10 * 60 * 1000); // 10 minutes
  };

  // Sticker Awarding Utility
  const handleAwardSticker = async (
    name: string,
    rarity: 'normal' | 'bonus' | 'special' | 'effort' | 'artwork' = 'normal',
    artworkDataUrl?: string
  ) => {
    let stk: StickerItem;
    if (rarity === 'artwork' && artworkDataUrl) {
      stk = {
        id: `stk_art_${Date.now()}`,
        name: `${name} 작품`,
        emoji: '🎨',
        category: '특별',
        rarity: 'artwork',
        artworkDataUrl,
        unlockedAt: new Date().toISOString(),
      };
    } else {
      stk = getRandomSticker(rarity as any);
      stk.name = name;
    }

    const isNew = await unlockSticker(stk);
    if (isNew) {
      playSfx('sticker');
      setCelebratedSticker(stk);
      setStickers((prev) => [...prev, stk]);
      confetti({ particleCount: 35, spread: 60 });
    }
  };

  // Round Finished Handler
  const handleFinishRound = () => {
    const newCount = consecutiveRounds + 1;
    setConsecutiveRounds(newCount);
    refreshProgressAndReview(settings.activeProfileId);

    if (newCount >= 3) {
      // 3 consecutive rounds rest suggestion
      setShowRestSuggestion(true);
      speak('우와, 세 판이나 신나게 놀았어요! 토끼랑 잠깐 기지개 켜고 쉬어볼까요?');
      setConsecutiveRounds(0);
    } else {
      setCurrentScreen('home');
      setMascotBubble('정말 멋져요! 또 다른 놀이를 해볼까요?');
      speak('또 어떤 놀이 할까요?');
    }
  };

  // Home Games Grid Definition
  const GAME_CARDS = [
    {
      id: 'coloring',
      title: '색칠 놀이',
      subtitle: '알록달록 칠해요',
      emoji: '🎨',
      bg: 'from-rose-400 to-rose-500',
      border: 'border-rose-200',
      shadow: 'shadow-rose-200',
    },
    {
      id: 'math',
      title: '숫자 놀이',
      subtitle: '사과를 더해요',
      emoji: '🍎',
      bg: 'from-amber-400 to-amber-500',
      border: 'border-amber-200',
      shadow: 'shadow-amber-200',
    },
    {
      id: 'maze',
      title: '미로 찾기',
      subtitle: '당근 길을 찾아요',
      emoji: '🥕',
      bg: 'from-emerald-400 to-emerald-500',
      border: 'border-emerald-200',
      shadow: 'shadow-emerald-200',
    },
    {
      id: 'memory',
      title: '짝 맞추기',
      subtitle: '똑같은 그림 찾기',
      emoji: '🃏',
      bg: 'from-sky-400 to-sky-500',
      border: 'border-sky-200',
      shadow: 'shadow-sky-200',
    },
    {
      id: 'shadow',
      title: '그림자 맞추기',
      subtitle: '누구 그림자일까?',
      emoji: '👤',
      bg: 'from-indigo-400 to-indigo-500',
      border: 'border-indigo-200',
      shadow: 'shadow-indigo-200',
    },
    {
      id: 'balloon',
      title: '풍선 터뜨리기',
      subtitle: '팡팡 재미있게 터져요',
      emoji: '🎈',
      bg: 'from-pink-400 to-pink-500',
      border: 'border-pink-200',
      shadow: 'shadow-pink-200',
    },
    {
      id: 'words',
      title: '한글 낱말 놀이',
      subtitle: '소리와 말을 배워요',
      emoji: '📖',
      bg: 'from-teal-400 to-teal-500',
      border: 'border-teal-200',
      shadow: 'shadow-teal-200',
    },
  ];

  return (
    <div
      className={`relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden flex flex-col bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-amber-100/60 font-body select-none ${
        settings.highContrast ? 'contrast-125' : ''
      } ${settings.largeFont ? 'text-lg' : ''}`}
    >
      {/* Top Bar with giant Home, Sticker counter, and Parental gear */}
      <TopBar
        currentScreen={currentScreen}
        onGoHome={() => {
          setCurrentScreen('home');
          speak('어떤 놀이 할까요?');
        }}
        onOpenParentGate={() => {
          if (isParentModeActive) {
            setShowParentDashboard(true);
          } else {
            setShowParentGate(true);
          }
        }}
        onOpenStickers={() => setShowStickerBook(true)}
        isParentModeActive={isParentModeActive}
        unlockedStickerCount={stickers.length}
      />

      {/* Screen Time Limit Manager (10/15/20/30/unlimited, 1-min warning, sleeping bunny screen) */}
      <ScreenTimeManager
        timeLimitMinutes={settings.timeLimitMinutes}
        parentGateMethod={settings.parentGateMethod}
        onAddTime={(additionalMins) => {
          handleUpdateSettings({
            ...settings,
            timeLimitMinutes: settings.timeLimitMinutes + additionalMins,
          });
        }}
      />

      {/* Main View Router */}
      <main className="relative flex-1 min-h-0 w-full flex flex-col items-center justify-center p-1 sm:p-2 md:p-4 overflow-y-auto overflow-x-hidden">
        {currentScreen === 'home' && (
          <div className="relative w-full max-w-5xl h-full flex flex-col items-center justify-between pb-1 overflow-hidden">
            {/* Mascot Greeting */}
            <div className="flex items-center justify-center my-0.5 sm:my-2 shrink-0">
              <Mascot
                expression="happy"
                size={window.innerHeight < 500 ? 'sm' : 'md'}
                bubbleText={mascotBubble}
                onClick={() => {
                  playSfx('button');
                  speak(mascotBubble);
                }}
              />
            </div>

            {/* Continue Banner & Review Button */}
            <div className="flex items-center gap-2 flex-wrap justify-center mb-1 shrink-0">
              {lastPlayed && (
                <button
                  onClick={() => {
                    playSfx('button');
                    speak(`${lastPlayed.title} ${lastPlayed.level}단계 이어하기!`);
                    setCurrentScreen(lastPlayed.gameId as GameType);
                  }}
                  className="flex items-center gap-2 py-1.5 px-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-kids text-xs sm:text-sm font-bold shadow-md border-2 border-white hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>🐰 이어하기: {lastPlayed.title} ({lastPlayed.level}단계) 바로가기</span>
                </button>
              )}

              <button
                onClick={() => {
                  playSfx('button');
                  setShowReviewNotebook(true);
                }}
                className="relative flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-white hover:bg-amber-50 text-stone-800 font-kids text-xs sm:text-sm font-bold shadow-sm border-2 border-amber-300 active:scale-95 transition-all"
              >
                <span>📝 오답노트</span>
                {pendingReviewCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {pendingReviewCount}개
                  </span>
                )}
              </button>
            </div>

            {/* 7 Kid Games Grid (Cards are large, tactile, responsive) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3.5 md:gap-5 w-full max-w-4xl p-1 sm:p-2 overflow-y-auto max-h-full">
              {GAME_CARDS.map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    playSfx('button');
                    speak(`${game.title} 시작!`);
                    setCurrentScreen(game.id as GameType);
                  }}
                  className={`min-h-[84px] sm:min-h-[110px] md:min-h-[135px] rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 bg-gradient-to-br ${game.bg} text-white shadow-lg ${game.shadow} border-3 sm:border-4 ${game.border} flex flex-col items-center justify-center gap-0.5 sm:gap-1 cursor-pointer transition-transform active:scale-95 hover:scale-105 relative`}
                >
                  <span className="text-2xl sm:text-4xl md:text-5xl drop-shadow-md">
                    {game.emoji}
                  </span>
                  <strong className="font-kids text-sm sm:text-lg md:text-xl drop-shadow-sm mt-0.5">
                    {game.title}
                  </strong>
                  <span className="font-body text-[10px] sm:text-xs text-white/90 font-medium">
                    {game.subtitle}
                  </span>
                  <span className="font-kids text-[9px] sm:text-[11px] bg-white/25 px-2 py-0.5 rounded-full mt-0.5">
                    Lv. {gameProgresses[game.id]?.highestLevel || 1} / 100
                  </span>
                </button>
              ))}

              {/* Quick Wrong Answer Notebook Card in Grid */}
              <button
                onClick={() => {
                  playSfx('button');
                  setShowReviewNotebook(true);
                }}
                className="min-h-[84px] sm:min-h-[110px] md:min-h-[135px] rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-lg border-3 sm:border-4 border-rose-200 flex flex-col items-center justify-center gap-0.5 sm:gap-1 active:scale-95 hover:scale-105 cursor-pointer relative"
              >
                {pendingReviewCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 font-kids text-xs px-2 py-0.5 rounded-full shadow-md font-bold border-2 border-white animate-bounce">
                    {pendingReviewCount}개
                  </span>
                )}
                <span className="text-2xl sm:text-4xl md:text-5xl">📝</span>
                <strong className="font-kids text-sm sm:text-lg md:text-xl">오답노트</strong>
                <span className="font-body text-[10px] sm:text-xs text-white/90">
                  틀린 문제 다시 풀기
                </span>
              </button>

              {/* Quick Sticker Book Card in Grid */}
              <button
                onClick={() => {
                  playSfx('button');
                  setShowStickerBook(true);
                }}
                className="min-h-[84px] sm:min-h-[110px] md:min-h-[135px] rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-lg border-3 sm:border-4 border-purple-200 flex flex-col items-center justify-center gap-0.5 sm:gap-1 active:scale-95 hover:scale-105 cursor-pointer"
              >
                <span className="text-2xl sm:text-4xl md:text-5xl">📖</span>
                <strong className="font-kids text-sm sm:text-lg md:text-xl">보물 스티커북</strong>
                <span className="font-body text-[10px] sm:text-xs text-white/90">
                  {stickers.length}개 모았어요
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 1. COLORING GAME */}
        {currentScreen === 'coloring' && (
          <ColoringGame
            templates={templates}
            onAwardSticker={handleAwardSticker}
            onFinishRound={handleFinishRound}
            isParentModeActive={isParentModeActive}
            onRequestParentMode={() => setShowParentGate(true)}
            profileId={settings.activeProfileId}
            onTemplatesUpdated={(tpls) => setTemplates(tpls)}
          />
        )}

        {/* 2. MATH GAME */}
        {currentScreen === 'math' && (
          <MathGame
            materials={materials}
            currentLevel={mathLevel}
            levelStars={mathStars}
            profileId={settings.activeProfileId}
            onAwardSticker={handleAwardSticker}
            onFinishRound={handleFinishRound}
            tapConfirmMode={settings.tapConfirmMode}
          />
        )}

        {/* 3. MAZE GAME */}
        {currentScreen === 'maze' && (
          <MazeGame
            onAwardSticker={handleAwardSticker}
            onFinishRound={handleFinishRound}
            profileId={settings.activeProfileId}
          />
        )}

        {/* 4. MEMORY MATCH GAME */}
        {currentScreen === 'memory' && (
          <MemoryGame
            materials={materials}
            onAwardSticker={handleAwardSticker}
            onFinishRound={handleFinishRound}
            profileId={settings.activeProfileId}
          />
        )}

        {/* 5. SHADOW MATCH GAME */}
        {currentScreen === 'shadow' && (
          <ShadowGame
            materials={materials}
            onAwardSticker={handleAwardSticker}
            onFinishRound={handleFinishRound}
            profileId={settings.activeProfileId}
            interactionMode={settings.interactionMode}
          />
        )}

        {/* 6. BALLOON POP GAME */}
        {currentScreen === 'balloon' && (
          <BalloonGame
            onAwardSticker={handleAwardSticker}
            onFinishRound={handleFinishRound}
            profileId={settings.activeProfileId}
          />
        )}

        {/* 7. KOREAN WORD GAME */}
        {currentScreen === 'words' && (
          <KoreanWordGame
            materials={materials}
            onAwardSticker={handleAwardSticker}
            onFinishRound={handleFinishRound}
            profileId={settings.activeProfileId}
          />
        )}
      </main>

      {/* Parental Gate Modal */}
      <ParentalGateModal
        isOpen={showParentGate}
        onClose={() => setShowParentGate(false)}
        method={settings.parentGateMethod}
        onSuccess={() => {
          activateParentMode();
          setShowParentDashboard(true);
          speak('보호자 모드가 켜졌습니다.');
        }}
      />

      {/* Parental Dashboard Modal */}
      {showParentDashboard && (
        <ParentDashboard
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => {
            setShowParentDashboard(false);
            getAllAssets().then(setMaterials);
            getAllTemplates().then(setTemplates);
          }}
          onMaterialsUpdated={(mats) => setMaterials(mats)}
          onTemplatesUpdated={(tpls) => setTemplates(tpls)}
        />
      )}

      {/* Unified 12-Slot Sticker Book */}
      {showStickerBook && (
        <StickerBook
          unlockedStickers={stickers}
          onClose={() => setShowStickerBook(false)}
        />
      )}

      {/* Wrong Answer Notebook (오답노트) */}
      <WrongAnswerNotebook
        isOpen={showReviewNotebook}
        onClose={() => {
          setShowReviewNotebook(false);
          refreshProgressAndReview(settings.activeProfileId);
        }}
        profileId={settings.activeProfileId}
        onAwardSticker={handleAwardSticker}
      />

      {/* New Sticker Earned Celebration Popup */}
      {celebratedSticker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 select-none">
          <div className="relative max-w-sm w-full bg-amber-50 rounded-3xl p-6 text-center border-4 border-amber-300 shadow-2xl animate-soft-bounce">
            <span className="text-3xl">✨</span>
            <h3 className="font-kids text-2xl text-amber-950 mt-1 mb-2">
              새 스티커 획득!
            </h3>

            <div className="w-28 h-28 mx-auto my-3 rounded-2xl bg-white shadow-md border-2 border-amber-200 flex items-center justify-center">
              {celebratedSticker.artworkDataUrl ? (
                <img
                  src={celebratedSticker.artworkDataUrl}
                  alt={celebratedSticker.name}
                  className="w-24 h-24 object-contain rounded-xl"
                />
              ) : (
                <span className="text-6xl drop-shadow-sm">
                  {celebratedSticker.emoji}
                </span>
              )}
            </div>

            <p className="font-kids text-xl text-stone-800 mb-4">
              {celebratedSticker.name}
            </p>

            <button
              onClick={() => {
                playSfx('button');
                setCelebratedSticker(null);
              }}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-kids text-lg shadow-md active:scale-95"
            >
              고마워!
            </button>
          </div>
        </div>
      )}

      {/* 3-Consecutive Rounds Rest Suggestion Modal */}
      {showRestSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
          <div className="relative max-w-md w-full bg-amber-50 rounded-3xl p-6 text-center border-4 border-amber-300 shadow-2xl">
            <Mascot expression="thinking" size="lg" className="mx-auto mb-3" />
            <h3 className="font-kids text-2xl md:text-3xl text-amber-950 mb-2">
              잠깐 쉬어볼까요?
            </h3>
            <p className="text-stone-600 font-kids text-lg mb-6 leading-relaxed">
              기지개를 쭉 켜고<br />
              눈도 깜빡깜빡 쉬어주면 좋아요!
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  playSfx('button');
                  setShowRestSuggestion(false);
                  setCurrentScreen('home');
                }}
                className="flex-1 py-3.5 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-kids text-base active:scale-95"
              >
                조금 쉬기
              </button>
              <button
                onClick={() => {
                  playSfx('button');
                  setShowRestSuggestion(false);
                  setCurrentScreen('home');
                }}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-kids text-base shadow-md active:scale-95"
              >
                더 놀기!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
