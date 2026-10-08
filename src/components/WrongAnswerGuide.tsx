import React from 'react';
import { Sparkles, HelpCircle, HeartHandshake } from 'lucide-react';

interface WrongAnswerGuideProps {
  errorCount: number; // 0, 1, 2, 3
  hintText?: string;
  solutionText?: string;
}

export const WrongAnswerGuide: React.FC<WrongAnswerGuideProps> = ({
  errorCount,
  hintText,
  solutionText,
}) => {
  if (errorCount === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto my-1 px-3 py-1.5 rounded-2xl flex items-center justify-center gap-2 text-center select-none animate-in fade-in transition-all">
      {errorCount === 1 && (
        <div className="flex items-center gap-1.5 bg-amber-100/90 text-amber-900 border border-amber-300 px-3.5 py-1.5 rounded-2xl shadow-sm text-xs sm:text-sm font-kids">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>다시 한 번 살펴볼까요? 찬찬히 세어보거나 찾아보세요.</span>
        </div>
      )}

      {errorCount === 2 && (
        <div className="flex items-center gap-1.5 bg-yellow-100/95 text-yellow-950 border-2 border-yellow-400 px-4 py-1.5 rounded-2xl shadow-md text-xs sm:text-sm font-kids animate-pulse">
          <Sparkles className="w-4 h-4 text-yellow-600 fill-yellow-400 shrink-0" />
          <span>{hintText || '토끼가 힌트를 줄게요! 반짝이는 곳을 보세요.'}</span>
        </div>
      )}

      {errorCount >= 3 && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-rose-400 text-white border-2 border-white px-4 py-2 rounded-2xl shadow-lg text-xs sm:text-sm font-kids animate-bounce">
          <span className="text-xl">🐰</span>
          <span>{solutionText || '정답은 바로 여기예요! 같이 콕 눌러볼까요?'}</span>
          <HeartHandshake className="w-4 h-4 text-white shrink-0" />
        </div>
      )}
    </div>
  );
};
