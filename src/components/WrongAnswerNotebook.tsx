import React, { useState, useEffect } from 'react';
import { ReviewRecord } from '../types';
import { getAllReviewRecords, graduateReviewRecord, deleteReviewRecord } from '../utils/db';
import { speak, playSfx } from '../utils/audio';
import { 
  X, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Volume2, 
  HelpCircle, 
  Award,
  Play,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WrongAnswerNotebookProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  onAwardSticker: (name: string, rarity?: 'normal' | 'bonus' | 'special' | 'effort') => void;
}

export const WrongAnswerNotebook: React.FC<WrongAnswerNotebookProps> = ({
  isOpen,
  onClose,
  profileId,
  onAwardSticker,
}) => {
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [gameFilter, setGameFilter] = useState<'all' | 'math' | 'words' | 'shadow' | 'memory'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'graduated' | 'all'>('pending');

  // Interactive retry modal state
  const [activeRetryRecord, setActiveRetryRecord] = useState<ReviewRecord | null>(null);
  const [retrySelectedAnswer, setRetrySelectedAnswer] = useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRecords();
    }
  }, [isOpen, profileId]);

  const loadRecords = async () => {
    const list = await getAllReviewRecords(profileId);
    setRecords(list);
  };

  if (!isOpen) return null;

  const filtered = records.filter((r) => {
    if (gameFilter !== 'all' && r.gameType !== gameFilter) return false;
    if (statusFilter === 'pending' && r.graduated) return false;
    if (statusFilter === 'graduated' && !r.graduated) return false;
    return true;
  });

  const pendingCount = records.filter(r => !r.graduated).length;
  const graduatedCount = records.filter(r => r.graduated).length;

  const handleSpeakQuestion = (record: ReviewRecord) => {
    playSfx('button');
    const speech = record.explanation || `${record.questionText} 정답은 ${record.correctAnswer}입니다.`;
    speak(speech);
  };

  const handleOpenRetry = (record: ReviewRecord) => {
    playSfx('button');
    setActiveRetryRecord(record);
    setRetrySelectedAnswer(null);
    setRetryFeedback(null);
    speak(`${record.questionText} 정답을 찾아보세요!`);
  };

  const handleRetrySubmit = async (choice: string) => {
    if (!activeRetryRecord || retryFeedback) return;
    setRetrySelectedAnswer(choice);

    if (choice.trim() === activeRetryRecord.correctAnswer.trim()) {
      // CORRECT!
      setRetryFeedback('correct');
      playSfx('success');
      confetti({ particleCount: 50, spread: 60 });
      speak('우와! 다시 풀어서 정답을 맞췄어요! 완전 정복 완료!');

      if (activeRetryRecord.id) {
        await graduateReviewRecord(activeRetryRecord.id);
        onAwardSticker('오답 정복 마스터 스티커', 'special');
      }

      setTimeout(() => {
        setActiveRetryRecord(null);
        loadRecords();
      }, 1600);
    } else {
      // WRONG
      setRetryFeedback('wrong');
      playSfx('gentle');
      speak('다시 한 번 자세히 살펴볼까요?');
      setTimeout(() => {
        setRetryFeedback(null);
      }, 1200);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    playSfx('button');
    await deleteReviewRecord(id);
    loadRecords();
  };

  // Generate mock choices if record didn't store explicit choices
  const getRecordChoices = (record: ReviewRecord): string[] => {
    if (record.choices && record.choices.length > 0) return record.choices;

    const correct = record.correctAnswer;
    const num = parseInt(correct, 10);
    if (!isNaN(num)) {
      const set = new Set<string>([correct]);
      while (set.size < 3) {
        const fake = Math.max(1, num + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1));
        set.add(String(fake));
      }
      return Array.from(set).sort(() => Math.random() - 0.5);
    }

    return [correct, '바나나', '사과'].sort(() => Math.random() - 0.5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 select-none animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-500 text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">📝</span>
            <div>
              <h3 className="font-kids text-lg sm:text-xl text-white drop-shadow-sm flex items-center gap-1.5">
                <span>토끼 오답노트</span>
                <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">복습 놀이</span>
              </h3>
              <p className="font-kids text-xs text-amber-100">
                틀렸던 문제를 다시 풀고 별을 모아요! (복습 대기: {pendingCount}개 · 정복 완료: {graduatedCount}개)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSfx('button');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-3 sm:px-5 py-2.5 bg-amber-50/80 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Game Type Filter */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: '전체' },
              { id: 'math', label: '수학 🍎' },
              { id: 'words', label: '한글 ✏️' },
              { id: 'shadow', label: '그림자 👤' },
              { id: 'memory', label: '짝맞추기 ❓' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  playSfx('button');
                  setGameFilter(f.id as any);
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-xl font-kids text-xs sm:text-sm whitespace-nowrap transition-all ${
                  gameFilter === f.id
                    ? 'bg-amber-500 text-white shadow-sm font-bold'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-amber-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                playSfx('button');
                setStatusFilter('pending');
              }}
              className={`px-2.5 py-1 rounded-xl font-kids text-xs transition-all ${
                statusFilter === 'pending'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              복습 필요 ({pendingCount})
            </button>
            <button
              onClick={() => {
                playSfx('button');
                setStatusFilter('graduated');
              }}
              className={`px-2.5 py-1 rounded-xl font-kids text-xs transition-all ${
                statusFilter === 'graduated'
                  ? 'bg-emerald-500 text-white font-bold shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              완전 정복 ⭐ ({graduatedCount})
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <span className="text-5xl mb-2">🎉</span>
              <p className="font-kids text-lg text-stone-700 mb-1">
                {statusFilter === 'pending'
                  ? '복습할 문제가 없어요! 최고예요!'
                  : '아직 기록된 문제가 없습니다.'}
              </p>
              <p className="font-kids text-xs text-stone-400">
                게임을 플레이하면서 아쉽게 틀린 문제가 이곳에 자동으로 쏙 들어와요.
              </p>
            </div>
          ) : (
            filtered.map((record) => (
              <div
                key={record.id || `${record.timestamp}_${record.title}`}
                className={`p-3 sm:p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm ${
                  record.graduated
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-white border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0 border border-amber-200 shadow-sm">
                    {record.emoji || '💡'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-kids text-stone-800 text-sm sm:text-base font-bold">
                        {record.title}
                      </span>
                      {record.graduated ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-kids px-2 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          완전 정복
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-kids px-2 py-0.5 rounded-full font-bold">
                          복습 필요
                        </span>
                      )}
                    </div>
                    <p className="font-kids text-xs text-stone-500 mb-1">
                      {record.questionText}
                    </p>
                    <p className="font-kids text-xs text-amber-700">
                      정답: <strong className="text-amber-900 font-bold">{record.correctAnswer}</strong>
                      {record.explanation && <span className="text-stone-400 ml-1.5">({record.explanation})</span>}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleSpeakQuestion(record)}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 active:scale-95 transition-all"
                    title="다시 듣기"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenRetry(record)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-kids text-xs sm:text-sm shadow-sm active:scale-95 transition-all ${
                      record.graduated
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{record.graduated ? '다시 풀기' : '풀어보기'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 rounded-xl bg-stone-50 hover:bg-rose-50 text-stone-400 hover:text-rose-500 border border-stone-200 active:scale-95 transition-all"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs font-kids text-stone-500 shrink-0">
          <span>💡 3번 틀렸던 문제가 자동으로 저장되어 복습을 도와줍니다.</span>
          <button
            onClick={() => {
              playSfx('button');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 active:scale-95"
          >
            닫기
          </button>
        </div>
      </div>

      {/* Interactive Retry Modal */}
      {activeRetryRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border-4 border-amber-400 text-center flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 flex items-center justify-center text-3xl sm:text-4xl shadow-inner border-2 border-amber-300 mb-3">
              {activeRetryRecord.emoji || '🐰'}
            </div>

            <h4 className="font-kids text-lg sm:text-xl text-stone-800 mb-1">
              {activeRetryRecord.title}
            </h4>

            <p className="font-kids text-amber-800 text-sm sm:text-base mb-4 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              {activeRetryRecord.questionText}
            </p>

            {/* Answer Choices */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full mb-4">
              {getRecordChoices(activeRetryRecord).map((choice) => (
                <button
                  key={choice}
                  disabled={retryFeedback !== null}
                  onClick={() => handleRetrySubmit(choice)}
                  className={`py-3 px-3 rounded-2xl font-kids text-lg sm:text-xl border-2 transition-all transform active:scale-95 ${
                    retrySelectedAnswer === choice
                      ? retryFeedback === 'correct'
                        ? 'bg-emerald-500 text-white border-emerald-600 scale-105 shadow-lg'
                        : 'bg-rose-500 text-white border-rose-600'
                      : 'bg-amber-50 hover:bg-amber-100 text-stone-800 border-amber-300 shadow-sm'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>

            {retryFeedback === 'correct' && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-kids text-sm font-bold animate-bounce mb-2">
                <Sparkles className="w-4 h-4 fill-emerald-500" />
                <span>정답이에요! 완전 정복 완료!</span>
              </div>
            )}

            <button
              onClick={() => {
                playSfx('button');
                setActiveRetryRecord(null);
              }}
              className="mt-2 py-2 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-kids text-xs"
            >
              다음에 풀기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
