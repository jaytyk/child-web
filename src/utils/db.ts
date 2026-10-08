import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { 
  ChildProfile, 
  ColoringTemplate, 
  SavedArtwork, 
  LearningMaterial, 
  StickerItem, 
  MathRecord, 
  ReviewRecord,
  GameProgress,
  GameStatRecord, 
  DailyUsage, 
  EncouragingMessage,
  AppSettings
} from '../types';
import { DEFAULT_TEMPLATES } from './templates';
import { DEFAULT_MATERIALS } from './materials';
import { ALL_STICKERS } from './stickers';

interface ToddlerAppDB extends DBSchema {
  profiles: {
    key: string;
    value: ChildProfile;
  };
  templates: {
    key: string;
    value: ColoringTemplate;
  };
  artworks: {
    key: string;
    value: SavedArtwork;
    indexes: { 'by-created': string };
  };
  assets: {
    key: string;
    value: LearningMaterial;
    indexes: { 'by-category': string };
  };
  mathProgress: {
    key: string;
    value: { profileId: string; currentLevel: number; stars: number[]; updatedAt: string };
  };
  mathRecords: {
    key: number;
    value: MathRecord;
    indexes: { 'by-profile': string; 'by-graduated': string };
  };
  reviewRecords: {
    key: number;
    value: ReviewRecord;
    indexes: { 'by-profile': string; 'by-game': string; 'by-graduated': string };
  };
  gameProgress: {
    key: string;
    value: GameProgress;
    indexes: { 'by-profile': string };
  };
  mazeProgress: {
    key: string;
    value: { profileId: string; level: number; clearedLevels: number[]; seed: number };
  };
  gameStats: {
    key: string;
    value: GameStatRecord;
    indexes: { 'by-profile': string };
  };
  stickers: {
    key: string;
    value: StickerItem;
    indexes: { 'by-category': string };
  };
  messages: {
    key: string;
    value: EncouragingMessage;
  };
  usage: {
    key: string;
    value: DailyUsage;
  };
}

const DB_NAME = 'toddler_learning_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<ToddlerAppDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<ToddlerAppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ToddlerAppDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('artworks')) {
          const artStore = db.createObjectStore('artworks', { keyPath: 'id' });
          artStore.createIndex('by-created', 'createdAt');
        }
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('by-category', 'category');
        }
        if (!db.objectStoreNames.contains('mathProgress')) {
          db.createObjectStore('mathProgress', { keyPath: 'profileId' });
        }
        if (!db.objectStoreNames.contains('mathRecords')) {
          const mathRecStore = db.createObjectStore('mathRecords', { keyPath: 'id', autoIncrement: true });
          mathRecStore.createIndex('by-profile', 'profileId');
          mathRecStore.createIndex('by-graduated', 'graduated');
        }
        if (!db.objectStoreNames.contains('reviewRecords')) {
          const revStore = db.createObjectStore('reviewRecords', { keyPath: 'id', autoIncrement: true });
          revStore.createIndex('by-profile', 'profileId');
          revStore.createIndex('by-game', 'gameType');
          revStore.createIndex('by-graduated', 'graduated');
        }
        if (!db.objectStoreNames.contains('gameProgress')) {
          const progStore = db.createObjectStore('gameProgress', { keyPath: 'gameId' });
          progStore.createIndex('by-profile', 'profileId');
        }
        if (!db.objectStoreNames.contains('mazeProgress')) {
          db.createObjectStore('mazeProgress', { keyPath: 'profileId' });
        }
        if (!db.objectStoreNames.contains('gameStats')) {
          const statsStore = db.createObjectStore('gameStats', { keyPath: 'gameId' });
          statsStore.createIndex('by-profile', 'profileId');
        }
        if (!db.objectStoreNames.contains('stickers')) {
          const stkStore = db.createObjectStore('stickers', { keyPath: 'id' });
          stkStore.createIndex('by-category', 'category');
        }
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('usage')) {
          db.createObjectStore('usage', { keyPath: 'date' });
        }
      },
    });
  }
  return dbPromise;
}

// Initial Seeding
export async function initDatabase(): Promise<void> {
  const db = await getDB();

  // Check profiles
  const profiles = await db.getAll('profiles');
  if (profiles.length === 0) {
    const defaultProfile: ChildProfile = {
      id: 'profile_default',
      name: '우리 아이',
      avatar: '🐰',
      age: 3,
      createdDate: new Date().toISOString(),
    };
    await db.put('profiles', defaultProfile);
  }

  // Check templates
  const existingTemplates = await db.getAll('templates');
  if (existingTemplates.length === 0) {
    const tx = db.transaction('templates', 'readwrite');
    for (const tpl of DEFAULT_TEMPLATES) {
      await tx.store.put(tpl);
    }
    await tx.done;
  }

  // Check assets
  const existingAssets = await db.getAll('assets');
  if (existingAssets.length === 0) {
    const tx = db.transaction('assets', 'readwrite');
    for (const mat of DEFAULT_MATERIALS) {
      await tx.store.put({ ...mat, enabled: true });
    }
    await tx.done;
  } else {
    // Ensure newly added default materials (like Pororo, Baby Shark) are synced
    const existingIds = new Set(existingAssets.map(a => a.id));
    const missingDefaults = DEFAULT_MATERIALS.filter(m => !existingIds.has(m.id));
    if (missingDefaults.length > 0) {
      const tx = db.transaction('assets', 'readwrite');
      for (const mat of missingDefaults) {
        await tx.store.put({ ...mat, enabled: true });
      }
      await tx.done;
    }
  }

  // Unlock first 3 welcome stickers
  const existingStickers = await db.getAll('stickers');
  if (existingStickers.length === 0) {
    const tx = db.transaction('stickers', 'readwrite');
    const welcomeIds = ['stk_rabbit', 'stk_apple', 'stk_star'];
    for (const id of welcomeIds) {
      const match = ALL_STICKERS.find(s => s.id === id);
      if (match) {
        await tx.store.put({ ...match, unlockedAt: new Date().toISOString() });
      }
    }
    await tx.done;
  }

  // Default Encouraging Messages
  const existingMessages = await db.getAll('messages');
  if (existingMessages.length === 0) {
    const defaultMsg: EncouragingMessage = {
      id: 'msg_welcome',
      text: '오늘도 즐겁고 신나게 놀아보자, 사랑해!',
      author: '엄마',
      timing: 'next_login',
    };
    await db.put('messages', defaultMsg);
  }
}

// Local Storage for quick settings
const SETTINGS_KEY = 'toddler_app_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  timeLimitMinutes: 15,
  speechRate: 0.8,
  speechPitch: 1.2,
  speechVolume: 1.0,
  sfxVolume: 1.0,
  bgmEnabled: true,
  tapConfirmMode: '2tap',
  interactionMode: 'tap',
  parentGateMethod: 'math',
  highContrast: false,
  largeFont: false,
  activeProfileId: 'profile_default',
};

export function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings:', err);
  }
}

// Sticker Helpers
export async function getUnlockedStickers(): Promise<StickerItem[]> {
  const db = await getDB();
  return db.getAll('stickers');
}

export async function unlockSticker(sticker: StickerItem): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get('stickers', sticker.id);
  if (existing) {
    return false; // Already unlocked
  }
  await db.put('stickers', { ...sticker, unlockedAt: new Date().toISOString() });
  return true;
}

// Artwork Helpers
export async function getSavedArtworks(): Promise<SavedArtwork[]> {
  const db = await getDB();
  return db.getAllFromIndex('artworks', 'by-created');
}

export async function saveArtwork(artwork: SavedArtwork): Promise<void> {
  const db = await getDB();
  await db.put('artworks', artwork);
  // Also create a sticker for this artwork!
  const artSticker: StickerItem = {
    id: `stk_art_${artwork.id}`,
    name: `${artwork.templateTitle} 그림`,
    emoji: '🎨',
    category: '특별',
    rarity: 'artwork',
    unlockedAt: new Date().toISOString(),
    artworkDataUrl: artwork.dataUrl,
  };
  await db.put('stickers', artSticker);
}

export async function deleteArtwork(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('artworks', id);
  await db.delete('stickers', `stk_art_${id}`);
}

// Templates Helpers
export async function getAllTemplates(): Promise<ColoringTemplate[]> {
  const db = await getDB();
  return db.getAll('templates');
}

export async function saveCustomTemplate(tpl: ColoringTemplate): Promise<void> {
  const db = await getDB();
  await db.put('templates', tpl);
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('templates', id);
}

// Assets Helpers
export async function getAllAssets(): Promise<LearningMaterial[]> {
  const db = await getDB();
  return db.getAll('assets');
}

export async function saveCustomAsset(asset: LearningMaterial): Promise<void> {
  const db = await getDB();
  await db.put('assets', asset);
}

export async function deleteCustomAsset(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('assets', id);
}

export async function deleteAssetsByCategory(category: string): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('assets');
  const tx = db.transaction('assets', 'readwrite');
  for (const item of all) {
    if (item.category === category && item.isCustom) {
      await tx.store.delete(item.id);
    }
  }
  await tx.done;
}

export async function saveCustomAssetsBatch(assets: LearningMaterial[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('assets', 'readwrite');
  for (const asset of assets) {
    await tx.store.put(asset);
  }
  await tx.done;
}

// Math Progress & Records
export async function getMathProgress(profileId: string) {
  const db = await getDB();
  const res = await db.get('mathProgress', profileId);
  return res || { profileId, currentLevel: 1, stars: [0, 0, 0, 0, 0], updatedAt: new Date().toISOString() };
}

export async function saveMathProgress(profileId: string, currentLevel: number, stars: number[]) {
  const db = await getDB();
  await db.put('mathProgress', { profileId, currentLevel, stars, updatedAt: new Date().toISOString() });
}

export async function addMathRecord(record: Omit<MathRecord, 'id'>) {
  const db = await getDB();
  // Also save to unified reviewRecords!
  try {
    await db.add('reviewRecords', {
      profileId: record.profileId,
      gameType: 'math',
      title: `${record.itemA} ${record.countA}개 + ${record.itemB} ${record.countB}개`,
      questionText: `${record.itemA} ${record.countA}개랑 ${record.itemB} ${record.countB}개를 합치면 모두 몇 개일까요?`,
      correctAnswer: `${record.total}`,
      userAnswer: `${record.total + 1}`,
      category: '수학',
      emoji: '🍎',
      attempts: record.attempts,
      timestamp: record.timestamp,
      graduated: record.graduated ?? false,
      explanation: `${record.itemA} ${record.countA}개와 ${record.itemB} ${record.countB}개를 더하면 모두 ${record.total}개예요!`,
    });
  } catch (err) {
    console.warn('Failed to add to reviewRecords:', err);
  }
  return db.add('mathRecords', record as MathRecord);
}

export async function getReviewRecords(profileId: string): Promise<MathRecord[]> {
  const db = await getDB();
  const records = await db.getAllFromIndex('mathRecords', 'by-profile', profileId);
  // Return records that were answered incorrectly and not yet graduated
  return records.filter(r => !r.correct && !r.graduated);
}

export async function graduateRecord(id: number) {
  const db = await getDB();
  const rec = await db.get('mathRecords', id);
  if (rec) {
    rec.graduated = true;
    await db.put('mathRecords', rec);
  }
}

// Unified Review Records (오답노트)
export async function addReviewRecord(record: Omit<ReviewRecord, 'id'>): Promise<number> {
  const db = await getDB();
  const id = await db.add('reviewRecords', record as ReviewRecord);
  return id as number;
}

export async function getAllReviewRecords(profileId: string): Promise<ReviewRecord[]> {
  const db = await getDB();
  const records = await db.getAllFromIndex('reviewRecords', 'by-profile', profileId);
  // Sort by newest first
  return records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function graduateReviewRecord(id: number): Promise<void> {
  const db = await getDB();
  const rec = await db.get('reviewRecords', id);
  if (rec) {
    rec.graduated = true;
    await db.put('reviewRecords', rec);
  }
}

export async function deleteReviewRecord(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('reviewRecords', id);
}

// Game Progress & Continue (100단계 및 이어하기)
const GAME_PROGRESS_LOCAL_KEY = 'toddler_app_game_progress';

const GAME_NAMES: Record<string, string> = {
  coloring: '색칠 놀이',
  math: '숫자 놀이',
  maze: '미로 찾기',
  memory: '짝맞추기',
  shadow: '그림자 놀이',
  balloon: '풍선 팡팡',
  words: '한글 놀이',
};

export async function getGameProgress(gameId: string, profileId: string): Promise<GameProgress> {
  // Check localStorage cache first
  try {
    const raw = localStorage.getItem(`${GAME_PROGRESS_LOCAL_KEY}_${profileId}_${gameId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) return parsed;
    }
  } catch {
    // fallback
  }

  try {
    const db = await getDB();
    const res = await db.get('gameProgress', gameId);
    if (res && res.profileId === profileId) return res;
  } catch {
    // fallback
  }

  return {
    gameId,
    profileId,
    currentLevel: 1,
    highestLevel: 1,
    stars: {},
    lastPlayed: new Date().toISOString(),
  };
}

export async function saveGameProgress(
  gameId: string,
  profileId: string,
  currentLevel: number,
  highestLevel?: number,
  stars?: Record<number, number>
): Promise<GameProgress> {
  const prev = await getGameProgress(gameId, profileId);
  const updatedHighest = Math.max(prev.highestLevel, highestLevel ?? currentLevel, currentLevel);
  const updatedStars = { ...prev.stars, ...(stars || {}) };

  const updated: GameProgress = {
    gameId,
    profileId,
    currentLevel: Math.max(1, Math.min(100, currentLevel)),
    highestLevel: Math.max(1, Math.min(100, updatedHighest)),
    stars: updatedStars,
    lastPlayed: new Date().toISOString(),
  };

  // Sync to localStorage
  try {
    localStorage.setItem(`${GAME_PROGRESS_LOCAL_KEY}_${profileId}_${gameId}`, JSON.stringify(updated));
    localStorage.setItem(`${GAME_PROGRESS_LOCAL_KEY}_last_${profileId}`, JSON.stringify({
      gameId,
      level: updated.currentLevel,
      title: GAME_NAMES[gameId] || gameId,
      timestamp: updated.lastPlayed,
    }));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }

  // Sync to IndexedDB
  try {
    const db = await getDB();
    await db.put('gameProgress', updated);
  } catch (err) {
    console.warn('Failed to save gameProgress to IDB:', err);
  }

  return updated;
}

export async function getAllGameProgresses(profileId: string): Promise<Record<string, GameProgress>> {
  const games = ['coloring', 'math', 'maze', 'memory', 'shadow', 'balloon', 'words'];
  const res: Record<string, GameProgress> = {};
  for (const gid of games) {
    res[gid] = await getGameProgress(gid, profileId);
  }
  return res;
}

export function getLastPlayedGameSync(profileId: string): { gameId: string; level: number; title: string } | null {
  try {
    const raw = localStorage.getItem(`${GAME_PROGRESS_LOCAL_KEY}_last_${profileId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return null;
}

// Usage tracking
export async function recordUsageTime(minutes: number, problems: number = 0, isCorrect: boolean = true) {
  const today = new Date().toISOString().split('T')[0];
  const db = await getDB();
  const current = (await db.get('usage', today)) || {
    date: today,
    minutes: 0,
    problemsSolved: 0,
    accuracy: 100,
  };

  const newProblems = current.problemsSolved + problems;
  let newAccuracy = current.accuracy;
  if (problems > 0) {
    const priorCorrect = Math.round((current.accuracy / 100) * current.problemsSolved);
    const totalCorrect = priorCorrect + (isCorrect ? problems : 0);
    newAccuracy = Math.round((totalCorrect / Math.max(1, newProblems)) * 100);
  }

  await db.put('usage', {
    date: today,
    minutes: current.minutes + minutes,
    problemsSolved: newProblems,
    accuracy: newAccuracy,
  });
}

export async function getRecentUsage(days = 14): Promise<DailyUsage[]> {
  const db = await getDB();
  const all = await db.getAll('usage');
  all.sort((a, b) => a.date.localeCompare(b.date));
  return all.slice(-days);
}

// Game Stats
export async function recordGameStats(gameId: string, profileId: string, starsEarned: number) {
  const db = await getDB();
  const current = (await db.get('gameStats', gameId)) || {
    gameId,
    profileId,
    playCount: 0,
    totalTimeSeconds: 0,
    lastPlayed: new Date().toISOString(),
    starsEarned: 0,
  };

  await db.put('gameStats', {
    ...current,
    playCount: current.playCount + 1,
    starsEarned: current.starsEarned + starsEarned,
    lastPlayed: new Date().toISOString(),
  });
}

export async function getAllGameStats(): Promise<GameStatRecord[]> {
  const db = await getDB();
  return db.getAll('gameStats');
}

// Profiles
export async function getAllProfiles(): Promise<ChildProfile[]> {
  const db = await getDB();
  return db.getAll('profiles');
}

export async function saveProfile(profile: ChildProfile): Promise<void> {
  const db = await getDB();
  await db.put('profiles', profile);
}

// Messages
export async function getEncouragingMessages(): Promise<EncouragingMessage[]> {
  const db = await getDB();
  return db.getAll('messages');
}

export async function saveEncouragingMessage(msg: EncouragingMessage): Promise<void> {
  const db = await getDB();
  await db.put('messages', msg);
}

// Export / Import
export async function exportAllData() {
  const db = await getDB();
  const data = {
    profiles: await db.getAll('profiles'),
    artworks: await db.getAll('artworks'),
    assets: await db.getAll('assets'),
    templates: await db.getAll('templates'),
    stickers: await db.getAll('stickers'),
    mathRecords: await db.getAll('mathRecords'),
    gameStats: await db.getAll('gameStats'),
    usage: await db.getAll('usage'),
    messages: await db.getAll('messages'),
    settings: loadSettings(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonStr: string) {
  const parsed = JSON.parse(jsonStr);
  const db = await getDB();

  if (parsed.profiles) {
    for (const item of parsed.profiles) await db.put('profiles', item);
  }
  if (parsed.artworks) {
    for (const item of parsed.artworks) await db.put('artworks', item);
  }
  if (parsed.assets) {
    for (const item of parsed.assets) await db.put('assets', item);
  }
  if (parsed.templates) {
    for (const item of parsed.templates) await db.put('templates', item);
  }
  if (parsed.stickers) {
    for (const item of parsed.stickers) await db.put('stickers', item);
  }
  if (parsed.settings) {
    saveSettings(parsed.settings);
  }
}

export async function resetAllData() {
  const db = await getDB();
  await db.clear('artworks');
  await db.clear('mathRecords');
  await db.clear('gameStats');
  await db.clear('usage');
  await db.clear('stickers');
  localStorage.removeItem(SETTINGS_KEY);
  await initDatabase();
}
