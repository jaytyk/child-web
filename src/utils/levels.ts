import { LearningMaterial } from '../types';

export interface LevelChapter {
  id: number;
  name: string;
  icon: string;
  minLevel: number;
  maxLevel: number;
  badge: string;
}

export const LEVEL_CHAPTERS: LevelChapter[] = [
  { id: 1, name: '새싹 단계', icon: '🌱', minLevel: 1, maxLevel: 10, badge: '새싹 배지' },
  { id: 2, name: '꽃봉오리 단계', icon: '🌷', minLevel: 11, maxLevel: 20, badge: '꽃잎 배지' },
  { id: 3, name: '푸른나무 단계', icon: '🌳', minLevel: 21, maxLevel: 30, badge: '숲속 배지' },
  { id: 4, name: '무지개 단계', icon: '🌈', minLevel: 31, maxLevel: 40, badge: '무지개 배지' },
  { id: 5, name: '반짝보석 단계', icon: '💎', minLevel: 41, maxLevel: 50, badge: '보석 배지' },
  { id: 6, name: '별빛하늘 단계', icon: '⭐', minLevel: 51, maxLevel: 60, badge: '별빛 배지' },
  { id: 7, name: '은하수 단계', icon: '🌌', minLevel: 61, maxLevel: 70, badge: '우주 배지' },
  { id: 8, name: '탐험대장 단계', icon: '🧭', minLevel: 71, maxLevel: 80, badge: '탐험 배지' },
  { id: 9, name: '지혜마법 단계', icon: '🧙', minLevel: 81, maxLevel: 90, badge: '마법 배지' },
  { id: 10, name: '마스터 왕관 단계', icon: '👑', minLevel: 91, maxLevel: 100, badge: '마스터 왕관' },
];

export function getChapterForLevel(level: number): LevelChapter {
  const bounded = Math.max(1, Math.min(100, level));
  return LEVEL_CHAPTERS.find(c => bounded >= c.minLevel && bounded <= c.maxLevel) || LEVEL_CHAPTERS[0];
}

export function getLevelTitle(level: number): string {
  const chapter = getChapterForLevel(level);
  return `${chapter.icon} ${level}단계 (${chapter.name})`;
}

// ==========================================
// 1. MATH LEVEL GENERATOR (1 ~ 100)
// ==========================================
export interface MathQuestionConfig {
  itemA: LearningMaterial;
  countA: number;
  itemB: LearningMaterial;
  countB: number;
  total: number;
  choices: number[];
  operation: 'add' | 'subtract';
  explanation: string;
}

export function generateMathQuestion(level: number, materials: LearningMaterial[]): MathQuestionConfig {
  const boundedLevel = Math.max(1, Math.min(100, level));
  const pool = materials.filter(m => m.enabled !== false);
  const activePool = pool.length > 0 ? pool : materials;

  const mat1 = activePool[Math.floor(Math.random() * activePool.length)];
  const mat2 = boundedLevel > 20 ? activePool[Math.floor(Math.random() * activePool.length)] : mat1;

  let operation: 'add' | 'subtract' = 'add';
  let countA = 1;
  let countB = 1;
  let total = 2;
  let choiceCount = 3;

  if (boundedLevel <= 10) {
    // Level 1 ~ 10: 1-digit addition within 5
    const max = boundedLevel <= 5 ? 3 : 5;
    countA = Math.floor(Math.random() * (max - 1)) + 1;
    countB = Math.floor(Math.random() * (max - countA)) + 1;
    total = countA + countB;
    choiceCount = 3;
  } else if (boundedLevel <= 25) {
    // Level 11 ~ 25: Addition within 10
    const max = 10;
    countA = Math.floor(Math.random() * 6) + 1;
    countB = Math.floor(Math.random() * (max - countA)) + 1;
    total = countA + countB;
    choiceCount = boundedLevel >= 20 ? 4 : 3;
  } else if (boundedLevel <= 40) {
    // Level 26 ~ 40: Subtraction within 10
    operation = Math.random() > 0.4 ? 'subtract' : 'add';
    if (operation === 'subtract') {
      const max = 10;
      countA = Math.floor(Math.random() * 5) + 3; // 3 to 7
      countB = Math.floor(Math.random() * (countA - 1)) + 1;
      total = countA - countB;
    } else {
      countA = Math.floor(Math.random() * 5) + 1;
      countB = Math.floor(Math.random() * 5) + 1;
      total = countA + countB;
    }
    choiceCount = 4;
  } else if (boundedLevel <= 60) {
    // Level 41 ~ 60: Addition within 15 & Subtraction within 12
    operation = Math.random() > 0.5 ? 'subtract' : 'add';
    if (operation === 'subtract') {
      countA = Math.floor(Math.random() * 6) + 6; // 6 to 11
      countB = Math.floor(Math.random() * 5) + 1;
      total = countA - countB;
    } else {
      countA = Math.floor(Math.random() * 6) + 4; // 4 to 9
      countB = Math.floor(Math.random() * 6) + 1; // 1 to 6
      total = countA + countB;
    }
    choiceCount = 4;
  } else if (boundedLevel <= 80) {
    // Level 61 ~ 80: Sums/Differences within 20
    operation = Math.random() > 0.5 ? 'subtract' : 'add';
    if (operation === 'subtract') {
      countA = Math.floor(Math.random() * 8) + 8; // 8 to 15
      countB = Math.floor(Math.random() * 6) + 2; // 2 to 7
      total = countA - countB;
    } else {
      countA = Math.floor(Math.random() * 7) + 5; // 5 to 11
      countB = Math.floor(Math.random() * 7) + 3; // 3 to 9
      total = countA + countB;
    }
    choiceCount = 4;
  } else {
    // Level 81 ~ 100: Master math challenges within 20~25
    operation = Math.random() > 0.5 ? 'subtract' : 'add';
    if (operation === 'subtract') {
      countA = Math.floor(Math.random() * 10) + 10; // 10 to 19
      countB = Math.floor(Math.random() * 8) + 2;  // 2 to 9
      total = countA - countB;
    } else {
      countA = Math.floor(Math.random() * 8) + 6;  // 6 to 13
      countB = Math.floor(Math.random() * 8) + 4;  // 4 to 11
      total = countA + countB;
    }
    choiceCount = 4;
  }

  // Choices set
  const choicesSet = new Set<number>([total]);
  while (choicesSet.size < choiceCount) {
    const diff = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
    let candidate = total + diff;
    if (candidate <= 0) candidate = total + choicesSet.size;
    choicesSet.add(candidate);
  }

  const choices = Array.from(choicesSet).sort(() => Math.random() - 0.5);
  const explanation = operation === 'add'
    ? `${mat1.name} ${countA}개와 ${mat2.name} ${countB}개를 더하면 모두 ${total}개예요!`
    : `${mat1.name} ${countA}개에서 ${countB}개를 덜어내면 ${total}개가 남아요!`;

  return {
    itemA: mat1,
    countA,
    itemB: mat2,
    countB,
    total,
    choices,
    operation,
    explanation,
  };
}

// ==========================================
// 2. MEMORY GAME CONFIG (1 ~ 100)
// ==========================================
export interface MemoryLevelConfig {
  pairCount: number;
  previewSeconds: number;
  categoryFilter: string;
}

export function getMemoryConfigForLevel(level: number): MemoryLevelConfig {
  const bounded = Math.max(1, Math.min(100, level));
  if (bounded <= 10) {
    return { pairCount: 2, previewSeconds: 2.2, categoryFilter: '전체' };
  } else if (bounded <= 25) {
    return { pairCount: 3, previewSeconds: 2.0, categoryFilter: '전체' };
  } else if (bounded <= 50) {
    return { pairCount: 4, previewSeconds: 1.6, categoryFilter: '전체' };
  } else if (bounded <= 75) {
    return { pairCount: 5, previewSeconds: 1.3, categoryFilter: '전체' };
  } else if (bounded <= 90) {
    return { pairCount: 6, previewSeconds: 1.0, categoryFilter: '전체' };
  } else {
    return { pairCount: 6, previewSeconds: 0.8, categoryFilter: '전체' };
  }
}

// ==========================================
// 3. SHADOW GAME CONFIG (1 ~ 100)
// ==========================================
export interface ShadowLevelConfig {
  choiceCount: number;
  category: string;
  hasSubtleDistractors: boolean;
}

export function getShadowConfigForLevel(level: number): ShadowLevelConfig {
  const bounded = Math.max(1, Math.min(100, level));
  if (bounded <= 20) {
    return { choiceCount: 3, category: '전체', hasSubtleDistractors: false };
  } else if (bounded <= 50) {
    return { choiceCount: 4, category: '동물', hasSubtleDistractors: true };
  } else if (bounded <= 80) {
    return { choiceCount: 4, category: '탈것', hasSubtleDistractors: true };
  } else {
    return { choiceCount: 4, category: '전체', hasSubtleDistractors: true };
  }
}

// ==========================================
// 4. MAZE GAME CONFIG (1 ~ 100)
// ==========================================
export interface MazeLevelConfig {
  gridSize: number; // 5, 7, 9, 11, 13
  bonusCarrotCount: number;
  bonusStarCount: number;
}

export function getMazeConfigForLevel(level: number): MazeLevelConfig {
  const bounded = Math.max(1, Math.min(100, level));
  if (bounded <= 15) {
    return { gridSize: 5, bonusCarrotCount: 2, bonusStarCount: 1 };
  } else if (bounded <= 35) {
    return { gridSize: 7, bonusCarrotCount: 3, bonusStarCount: 1 };
  } else if (bounded <= 60) {
    return { gridSize: 9, bonusCarrotCount: 4, bonusStarCount: 2 };
  } else if (bounded <= 85) {
    return { gridSize: 11, bonusCarrotCount: 5, bonusStarCount: 3 };
  } else {
    return { gridSize: 13, bonusCarrotCount: 6, bonusStarCount: 4 };
  }
}

// ==========================================
// 5. BALLOON GAME CONFIG (1 ~ 100)
// ==========================================
export interface BalloonLevelConfig {
  targetCount: number;
  spawnSpeedMs: number;
  floatSpeedMultiplier: number;
}

export function getBalloonConfigForLevel(level: number): BalloonLevelConfig {
  const bounded = Math.max(1, Math.min(100, level));
  if (bounded <= 15) {
    return { targetCount: 5, spawnSpeedMs: 1400, floatSpeedMultiplier: 1.0 };
  } else if (bounded <= 35) {
    return { targetCount: 8, spawnSpeedMs: 1200, floatSpeedMultiplier: 1.1 };
  } else if (bounded <= 60) {
    return { targetCount: 10, spawnSpeedMs: 1000, floatSpeedMultiplier: 1.25 };
  } else if (bounded <= 85) {
    return { targetCount: 12, spawnSpeedMs: 900, floatSpeedMultiplier: 1.35 };
  } else {
    return { targetCount: 15, spawnSpeedMs: 800, floatSpeedMultiplier: 1.5 };
  }
}

// ==========================================
// 6. KOREAN WORD GAME CONFIG (1 ~ 100)
// ==========================================
export interface WordLevelConfig {
  mode: 'explore' | 'firstSound' | 'quiz' | 'spelling';
  minSyllables: number;
  maxSyllables: number;
  choiceCount: number;
}

export function getWordConfigForLevel(level: number): WordLevelConfig {
  const bounded = Math.max(1, Math.min(100, level));
  if (bounded <= 20) {
    return { mode: 'explore', minSyllables: 2, maxSyllables: 2, choiceCount: 3 };
  } else if (bounded <= 45) {
    return { mode: 'firstSound', minSyllables: 2, maxSyllables: 3, choiceCount: 3 };
  } else if (bounded <= 70) {
    return { mode: 'quiz', minSyllables: 2, maxSyllables: 3, choiceCount: 4 };
  } else {
    return { mode: 'spelling', minSyllables: 2, maxSyllables: 4, choiceCount: 4 };
  }
}
