export type GameType = 
  | 'coloring' 
  | 'math' 
  | 'maze' 
  | 'memory' 
  | 'shadow' 
  | 'balloon' 
  | 'words' 
  | 'stickers' 
  | 'parents';

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  createdDate: string;
}

export interface StickerItem {
  id: string;
  name: string;
  emoji: string;
  category: '동물' | '과일' | '우주' | '공룡' | '탈것' | '특별';
  rarity: 'normal' | 'bonus' | 'special' | 'effort' | 'artwork';
  unlockedAt?: string;
  artworkDataUrl?: string;
}

export interface LearningMaterial {
  id: string;
  name: string; // e.g. "사과"
  category: string; // e.g. '과일', '채소', '동물', '탈것', '가족', '뽀로로', '아기상어' 등 사용자 추가 카테고리
  emoji?: string;
  imageUrl?: string;
  syllables?: string[]; // ["사", "과"]
  firstSound?: string; // "사"
  isCustom?: boolean;
  enabled?: boolean;
}

export interface ColoringTemplate {
  id: string;
  title: string;
  category: string;
  svgPath: string; // SVG path data or SVG string
  isCustom?: boolean;
  contourCount?: number;
}

export interface SavedArtwork {
  id: string;
  templateId: string;
  templateTitle: string;
  dataUrl: string;
  createdAt: string;
}

export interface MathRecord {
  id?: number;
  profileId: string;
  itemA: string;
  countA: number;
  itemB: string;
  countB: number;
  total: number;
  correct: boolean;
  attempts: number;
  timestamp: string;
  graduated?: boolean; // For review notebook
  consecutiveSuccess?: number;
}

export interface ReviewRecord {
  id?: number;
  profileId: string;
  gameType: 'math' | 'words' | 'shadow' | 'memory';
  title: string;
  questionText: string;
  correctAnswer: string;
  userAnswer?: string;
  category?: string;
  emoji?: string;
  attempts: number;
  timestamp: string;
  graduated: boolean;
  explanation?: string;
  choices?: string[];
  metadata?: any;
}

export interface GameProgress {
  gameId: string; // 'math' | 'memory' | 'shadow' | 'maze' | 'balloon' | 'words' | 'coloring'
  profileId: string;
  currentLevel: number; // 1 ~ 100
  highestLevel: number; // 1 ~ 100
  stars: Record<number, number>; // level -> stars (1~3)
  lastPlayed: string;
}

export interface GameStatRecord {
  profileId: string;
  gameId: string;
  playCount: number;
  totalTimeSeconds: number;
  lastPlayed: string;
  starsEarned: number;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  minutes: number;
  problemsSolved: number;
  accuracy: number;
}

export interface EncouragingMessage {
  id: string;
  text: string;
  author: string; // "엄마", "아빠"
  timing: 'immediate' | 'next_login' | 'every_morning';
  lastSpokenDate?: string;
}

export interface AppSettings {
  timeLimitMinutes: number; // 10, 15, 20, 30, 0 (unlimited)
  speechRate: number; // 0.8 default
  speechPitch: number; // 1.2 default
  speechVolume: number; // 1.0 default
  sfxVolume: number; // 1.0 default
  bgmEnabled: boolean;
  tapConfirmMode: '1tap' | '2tap'; // 1 tap vs 2 taps
  interactionMode: 'tap' | 'drag';
  parentGateMethod: 'math' | 'hold'; // 2-digit math or 3-second hold
  highContrast: boolean;
  largeFont: boolean;
  activeProfileId: string;
}
