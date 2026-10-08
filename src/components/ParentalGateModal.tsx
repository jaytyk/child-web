import React, { useState, useEffect, useRef } from 'react';
import { playSfx, speak } from '../utils/audio';
import { Lock, X, RefreshCw } from 'lucide-react';

interface ParentalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  method?: 'math' | 'hold';
}

export const ParentalGateModal: React.FC<ParentalGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  method = 'math',
}) => {
  // Math Challenge State
  const [numA, setNumA] = useState(15);
  const [numB, setNumB] = useState(23);
  const [inputVal, setInputVal] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Hold State
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);

  // Generate new math problem
  const generateProblem = () => {
    const a = Math.floor(Math.random() * 40) + 12; // 12 ~ 51
    const b = Math.floor(Math.random() * 40) + 12;
    setNumA(a);
    setNumB(b);
    setInputVal('');
    setErrorMessage('');
  };

  useEffect(() => {
    if (isOpen) {
      generateProblem();
      setHoldProgress(0);
    }
  }, [isOpen]);

  // Handle Lockout Timer
  useEffect(() => {
    let timer: number | null = null;
    if (lockoutRemaining > 0) {
      timer = window.setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer!);
            setFailCount(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutRemaining]);

  if (!isOpen) return null;

  const isLocked = lockoutRemaining > 0;
  const correctAnswer = numA + numB;

  const handleKeypadPress = (digit: string) => {
    if (isLocked) return;
    playSfx('button');
    if (inputVal.length < 3) {
      setInputVal(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (isLocked) return;
    playSfx('button');
    setInputVal(prev => prev.slice(0, -1));
  };

  const handleCheck = () => {
    if (isLocked) return;
    const userNum = parseInt(inputVal, 10);
    if (userNum === correctAnswer) {
      playSfx('correct');
      onSuccess();
      onClose();
    } else {
      playSfx('gentle');
      const newFails = failCount + 1;
      setFailCount(newFails);
      if (newFails >= 3) {
        setLockoutRemaining(30);
        setErrorMessage('3회 실패하여 30초 동안 잠깁니다.');
        speak('잠시 후에 다시 시도해 주세요.');
      } else {
        setErrorMessage(`정답이 아닙니다 (${newFails}/3회 실패)`);
        generateProblem();
      }
    }
  };

  // Hold 3 seconds handlers
  const startHold = () => {
    if (isLocked) return;
    holdIntervalRef.current = window.setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current!);
          playSfx('correct');
          onSuccess();
          onClose();
          return 100;
        }
        return prev + 4; // ~3 seconds
      });
    }, 100);
  };

  const cancelHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-4 sm:p-6 text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-kids text-xl text-stone-800">보호자 확인</h3>
              <p className="text-xs text-stone-500">어른만 들어갈 수 있는 공간입니다</p>
            </div>
          </div>
          <button
            onClick={() => {
              playSfx('button');
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {isLocked ? (
          <div className="text-center py-8">
            <p className="text-rose-500 font-bold text-lg mb-2">보호자 확인 잠김</p>
            <p className="text-stone-600 text-sm mb-4">
              {lockoutRemaining}초 후에 다시 시도할 수 있습니다.
            </p>
            <div className="w-20 h-20 rounded-full border-4 border-amber-400 border-t-rose-500 animate-spin mx-auto" />
          </div>
        ) : method === 'hold' ? (
          <div className="text-center py-6">
            <p className="text-stone-700 font-medium mb-6">
              아래 원을 <strong>3초 동안 꾹</strong> 누르고 계세요.
            </p>
            <div
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              className="relative w-36 h-36 mx-auto rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform"
            >
              <div
                className="absolute inset-0 rounded-full bg-amber-400 opacity-40 transition-all duration-100"
                style={{ transform: `scale(${holdProgress / 100})` }}
              />
              <span className="font-kids text-lg text-amber-900 relative z-10">
                {holdProgress > 0 ? `${Math.round(holdProgress)}%` : '꾹 누르기'}
              </span>
            </div>
          </div>
        ) : (
          <div>
            {/* Math Problem Presentation */}
            <div className="bg-amber-50 rounded-2xl p-4 text-center mb-4 border border-amber-200">
              <span className="text-xs text-amber-700 block mb-1">다음 문제를 풀어주세요</span>
              <div className="font-kids text-3xl text-stone-800 tracking-wider">
                {numA} + {numB} = <span className="text-amber-600 underline font-bold">{inputVal || '?'}</span>
              </div>
              {errorMessage && (
                <p className="text-xs text-rose-500 mt-2 font-medium">{errorMessage}</p>
              )}
            </div>

            {/* Custom Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  className="h-14 rounded-2xl bg-stone-100 text-stone-800 font-kids text-2xl hover:bg-amber-100 active:scale-95 transition-all shadow-sm"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={generateProblem}
                title="새로운 문제"
                className="h-14 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-2xl bg-stone-100 text-stone-800 font-kids text-2xl hover:bg-amber-100 active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-14 rounded-2xl bg-stone-200 text-stone-700 font-kids text-base hover:bg-stone-300 active:scale-95"
              >
                지움
              </button>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleCheck}
              disabled={inputVal.length === 0}
              className={`w-full py-4 rounded-2xl font-kids text-xl shadow-md transition-all active:scale-95 ${
                inputVal.length > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              확인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
