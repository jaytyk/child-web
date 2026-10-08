import React, { useState, useEffect } from 'react';
import { speak, playSfx } from '../utils/audio';
import { Mascot } from './Mascot';
import { ParentalGateModal } from './ParentalGateModal';
import { recordUsageTime } from '../utils/db';
import { Moon, Clock, PlusCircle } from 'lucide-react';

interface ScreenTimeManagerProps {
  timeLimitMinutes: number; // 0 for unlimited
  onAddTime: (additionalMinutes: number) => void;
  parentGateMethod?: 'math' | 'hold';
}

export const ScreenTimeManager: React.FC<ScreenTimeManagerProps> = ({
  timeLimitMinutes,
  onAddTime,
  parentGateMethod = 'math',
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [warnedOneMinute, setWarnedOneMinute] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showGate, setShowGate] = useState(false);

  // Timer tick
  useEffect(() => {
    if (timeLimitMinutes <= 0) {
      setIsLocked(false);
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1;
        const totalLimitSeconds = timeLimitMinutes * 60;

        // 1-minute warning
        if (totalLimitSeconds - next <= 60 && totalLimitSeconds - next > 58 && !warnedOneMinute) {
          setWarnedOneMinute(true);
          speak('곧 쉬어요! 조금만 더 놀고 토끼랑 쉬어요.');
        }

        // Time up
        if (next >= totalLimitSeconds) {
          setIsLocked(true);
          speak('토끼가 잠들었어요. 이제 눈을 쉬어줄 시간이에요.');
          recordUsageTime(Math.round(next / 60));
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimitMinutes, warnedOneMinute]);

  // Reset states if timeLimitMinutes changes
  useEffect(() => {
    setWarnedOneMinute(false);
    if (timeLimitMinutes <= 0 || secondsElapsed < timeLimitMinutes * 60) {
      setIsLocked(false);
    }
  }, [timeLimitMinutes, secondsElapsed]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-950/95 text-white p-6 select-none animate-fadeIn">
      {/* Stars in background */}
      <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
        <span className="absolute top-12 left-16 text-3xl">✨</span>
        <span className="absolute top-24 right-20 text-2xl">⭐</span>
        <span className="absolute bottom-20 left-24 text-4xl">🌙</span>
        <span className="absolute top-1/3 left-1/4 text-2xl">✨</span>
        <span className="absolute bottom-1/3 right-1/4 text-3xl">⭐</span>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
        {/* Sleeping Mascot */}
        <div className="mb-6">
          <Mascot expression="sleeping" size="xl" />
        </div>

        <div className="flex items-center gap-2 text-indigo-300 mb-2">
          <Moon className="w-6 h-6 animate-pulse" />
          <span className="font-kids text-lg">새근새근 쉬는 시간</span>
        </div>

        <h2 className="font-kids text-3xl md:text-4xl text-amber-200 mb-4">
          토끼가 코~ 자고 있어요!
        </h2>

        <p className="text-stone-300 text-lg md:text-xl font-body leading-relaxed mb-8">
          눈도 반짝, 몸도 튼튼해지도록<br />
          토끼와 함께 푹 쉬어볼까요?
        </p>

        {/* Parent unlock button */}
        <button
          onClick={() => {
            playSfx('button');
            setShowGate(true);
          }}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-stone-200 font-kids text-base transition-transform active:scale-95"
        >
          <Clock className="w-5 h-5 text-amber-300" />
          <span>보호자 확인 후 시간 추가하기</span>
        </button>
      </div>

      {/* Parental Gate for adding time */}
      <ParentalGateModal
        isOpen={showGate}
        onClose={() => setShowGate(false)}
        method={parentGateMethod}
        onSuccess={() => {
          // Add 10 minutes
          onAddTime(10);
          setIsLocked(false);
          setWarnedOneMinute(false);
          speak('10분이 추가되었습니다.');
        }}
      />
    </div>
  );
};
