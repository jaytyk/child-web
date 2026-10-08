import { LearningMaterial } from '../types';

export const DEFAULT_MATERIALS: LearningMaterial[] = [
  // 과일 (10종)
  { id: 'mat_apple', name: '사과', category: '과일', emoji: '🍎', syllables: ['사', '과'], firstSound: '사' },
  { id: 'mat_banana', name: '바나나', category: '과일', emoji: '🍌', syllables: ['바', '나', '나'], firstSound: '바' },
  { id: 'mat_grape', name: '포도', category: '과일', emoji: '🍇', syllables: ['포', '도'], firstSound: '포' },
  { id: 'mat_strawberry', name: '딸기', category: '과일', emoji: '🍓', syllables: ['딸', '기'], firstSound: '딸' },
  { id: 'mat_orange', name: '귤', category: '과일', emoji: '🍊', syllables: ['귤'], firstSound: '귤' },
  { id: 'mat_watermelon', name: '수박', category: '과일', emoji: '🍉', syllables: ['수', '박'], firstSound: '수' },
  { id: 'mat_peach', name: '복숭아', category: '과일', emoji: '🍑', syllables: ['복', '숭', '아'], firstSound: '복' },
  { id: 'mat_cherry', name: '체리', category: '과일', emoji: '🍒', syllables: ['체', '리'], firstSound: '체' },
  { id: 'mat_melon', name: '멜론', category: '과일', emoji: '🍈', syllables: ['멜', '론'], firstSound: '멜' },
  { id: 'mat_pineapple', name: '파인애플', category: '과일', emoji: '🍍', syllables: ['파', '인', '애', '플'], firstSound: '파' },

  // 채소 (10종)
  { id: 'mat_carrot', name: '당근', category: '채소', emoji: '🥕', syllables: ['당', '근'], firstSound: '당' },
  { id: 'mat_tomato', name: '토마토', category: '채소', emoji: '🍅', syllables: ['토', '마', '토'], firstSound: '토' },
  { id: 'mat_corn', name: '옥수수', category: '채소', emoji: '🌽', syllables: ['옥', '수', '수'], firstSound: '옥' },
  { id: 'mat_broccoli', name: '브로콜리', category: '채소', emoji: '🥦', syllables: ['브', '로', '콜', '리'], firstSound: '브' },
  { id: 'mat_potato', name: '감자', category: '채소', emoji: '🥔', syllables: ['감', '자'], firstSound: '감' },
  { id: 'mat_sweetpotato', name: '고구마', category: '채소', emoji: '🍠', syllables: ['고', '구', '마'], firstSound: '고' },
  { id: 'mat_cucumber', name: '오이', category: '채소', emoji: '🥒', syllables: ['오', '이'], firstSound: '오' },
  { id: 'mat_onion', name: '양파', category: '채소', emoji: '🧅', syllables: ['양', '파'], firstSound: '양' },
  { id: 'mat_mushroom', name: '버섯', category: '채소', emoji: '🍄', syllables: ['버', '섯'], firstSound: '버' },
  { id: 'mat_eggplant', name: '가지', category: '채소', emoji: '🍆', syllables: ['가', '지'], firstSound: '가' },

  // 동물 (10종)
  { id: 'mat_rabbit', name: '토끼', category: '동물', emoji: '🐰', syllables: ['토', '끼'], firstSound: '토' },
  { id: 'mat_dog', name: '강아지', category: '동물', emoji: '🐶', syllables: ['강', '아', '지'], firstSound: '강' },
  { id: 'mat_cat', name: '고양이', category: '동물', emoji: '🐱', syllables: ['고', '양', '이'], firstSound: '고' },
  { id: 'mat_bear', name: '곰', category: '동물', emoji: '🐻', syllables: ['곰'], firstSound: '곰' },
  { id: 'mat_lion', name: '사자', category: '동물', emoji: '🦁', syllables: ['사', '자'], firstSound: '사' },
  { id: 'mat_tiger', name: '호랑이', category: '동물', emoji: '🐯', syllables: ['호', '랑', '이'], firstSound: '호' },
  { id: 'mat_duck', name: '오리', category: '동물', emoji: '🦆', syllables: ['오', '리'], firstSound: '오' },
  { id: 'mat_pig', name: '돼지', category: '동물', emoji: '🐷', syllables: ['돼', '지'], firstSound: '돼' },
  { id: 'mat_frog', name: '개구리', category: '동물', emoji: '🐸', syllables: ['개', '구', '리'], firstSound: '개' },
  { id: 'mat_elephant', name: '코끼리', category: '동물', emoji: '🐘', syllables: ['코', '끼', '리'], firstSound: '코' },

  // 탈것 (6종)
  { id: 'mat_car', name: '자동차', category: '탈것', emoji: '🚗', syllables: ['자', '동', '차'], firstSound: '자' },
  { id: 'mat_bus', name: '버스', category: '탈것', emoji: '🚌', syllables: ['버', '스'], firstSound: '버' },
  { id: 'mat_train', name: '기차', category: '탈것', emoji: '🚂', syllables: ['기', '차'], firstSound: '기' },
  { id: 'mat_plane', name: '비행기', category: '탈것', emoji: '✈️', syllables: ['비', '행', '기'], firstSound: '비' },
  { id: 'mat_bike', name: '자전거', category: '탈것', emoji: '🚲', syllables: ['자', '전', '거'], firstSound: '자' },
  { id: 'mat_ship', name: '배', category: '탈것', emoji: '🚢', syllables: ['배'], firstSound: '배' },

  // 가족 & 신체 (8종)
  { id: 'mat_mom', name: '엄마', category: '가족', emoji: '👩', syllables: ['엄', '마'], firstSound: '엄' },
  { id: 'mat_dad', name: '아빠', category: '가족', emoji: '👨', syllables: ['아', '빠'], firstSound: '아' },
  { id: 'mat_baby', name: '아기', category: '가족', emoji: '👶', syllables: ['아', '기'], firstSound: '아' },
  { id: 'mat_eyes', name: '눈', category: '신체', emoji: '👀', syllables: ['눈'], firstSound: '눈' },
  { id: 'mat_nose', name: '코', category: '신체', emoji: '👃', syllables: ['코'], firstSound: '코' },
  { id: 'mat_mouth', name: '입', category: '신체', emoji: '👄', syllables: ['입'], firstSound: '입' },
  { id: 'mat_ears', name: '귀', category: '신체', emoji: '👂', syllables: ['귀'], firstSound: '귀' },
  { id: 'mat_hand', name: '손', category: '신체', emoji: '✋', syllables: ['손'], firstSound: '손' },

  // 뽀로로 친구들 (기본 탑재)
  { id: 'mat_pororo', name: '뽀로로', category: '뽀로로', emoji: '🐧', syllables: ['뽀', '로', '로'], firstSound: '뽀' },
  { id: 'mat_crong', name: '크롱', category: '뽀로로', emoji: '🦖', syllables: ['크', '롱'], firstSound: '크' },
  { id: 'mat_loopy', name: '루피', category: '뽀로로', emoji: '🌸', syllables: ['루', '피'], firstSound: '루' },
  { id: 'mat_poby', name: '포비', category: '뽀로로', emoji: '🐻', syllables: ['포', '비'], firstSound: '포' },

  // 아기상어 가족 (기본 탑재)
  { id: 'mat_baby_shark', name: '아기상어', category: '아기상어', emoji: '🦈', syllables: ['아', '기', '상', '어'], firstSound: '아' },
  { id: 'mat_mom_shark', name: '엄마상어', category: '아기상어', emoji: '🦈', syllables: ['엄', '마', '상', '어'], firstSound: '엄' },
  { id: 'mat_dad_shark', name: '아빠상어', category: '아기상어', emoji: '🦈', syllables: ['아', '빠', '상', '어'], firstSound: '아' },
  { id: 'mat_grandma_shark', name: '할머니상어', category: '아기상어', emoji: '🦈', syllables: ['할', '머', '니', '상', '어'], firstSound: '할' },
];

export const DEFAULT_CATEGORIES: string[] = [
  '과일', '채소', '동물', '탈것', '가족', '신체', '뽀로로', '아기상어', '공룡'
];

export const CATEGORY_ICONS: Record<string, string> = {
  '과일': '🍎',
  '채소': '🥕',
  '동물': '🐶',
  '탈것': '🚗',
  '가족': '👨‍👩‍👧',
  '신체': '👀',
  '뽀로로': '🐧',
  '아기상어': '🦈',
  '공룡': '🦖',
  '사용자': '✨',
  '기타': '📦',
};

export function getCategoryIcon(cat: string): string {
  if (CATEGORY_ICONS[cat]) return CATEGORY_ICONS[cat];
  if (cat.includes('상어')) return '🦈';
  if (cat.includes('뽀로로') || cat.includes('펭귄')) return '🐧';
  if (cat.includes('공룡')) return '🦖';
  if (cat.includes('바다') || cat.includes('물고기')) return '🐠';
  if (cat.includes('곤충')) return '🐝';
  if (cat.includes('꽃') || cat.includes('식물')) return '🌸';
  if (cat.includes('우주')) return '🚀';
  if (cat.includes('음식') || cat.includes('간식')) return '🧁';
  return '🏷️';
}

export function suggestEmojiForName(name: string, category: string): string {
  const n = name.trim();
  if (n.includes('뽀로로')) return '🐧';
  if (n.includes('크롱')) return '🦖';
  if (n.includes('루피')) return '🌸';
  if (n.includes('포비')) return '🐻';
  if (n.includes('에디')) return '🦊';
  if (n.includes('패티')) return '🎀';
  if (n.includes('상어')) return '🦈';
  if (n.includes('티라노') || n.includes('공룡')) return '🦖';
  if (n.includes('토끼')) return '🐰';
  if (n.includes('강아지') || n.includes('개')) return '🐶';
  if (n.includes('고양이')) return '🐱';
  if (n.includes('사자')) return '🦁';
  if (n.includes('호랑이')) return '🐯';
  if (n.includes('곰')) return '🐻';
  if (n.includes('새') || n.includes('오리')) return '🦆';
  if (n.includes('물고기') || n.includes('고래')) return '🐳';
  if (n.includes('차') || n.includes('버스')) return '🚌';
  if (n.includes('비행기')) return '✈️';
  if (n.includes('기차')) return '🚂';
  if (n.includes('사과')) return '🍎';
  if (n.includes('딸기')) return '🍓';
  if (n.includes('바나나')) return '🍌';
  if (n.includes('엄마')) return '👩';
  if (n.includes('아빠')) return '👨';
  if (n.includes('아기')) return '👶';
  if (n.includes('할머니')) return '👵';
  if (n.includes('할아버지')) return '👴';
  
  return getCategoryIcon(category);
}

export interface PresetBundle {
  category: string;
  icon: string;
  title: string;
  description: string;
  items: Array<{ name: string; emoji: string }>;
}

export const RECOMMENDED_PRESETS: PresetBundle[] = [
  {
    category: '뽀로로',
    icon: '🐧',
    title: '뽀로로와 친구들',
    description: '크롱, 루피, 포비, 에디, 패티',
    items: [
      { name: '뽀로로', emoji: '🐧' },
      { name: '크롱', emoji: '🦖' },
      { name: '루피', emoji: '🌸' },
      { name: '포비', emoji: '🐻' },
      { name: '에디', emoji: '🦊' },
      { name: '패티', emoji: '🎀' },
    ]
  },
  {
    category: '아기상어',
    icon: '🦈',
    title: '아기상어 가족',
    description: '아기상어, 엄마상어, 아빠상어, 할머니상어, 할아버지상어',
    items: [
      { name: '아기상어', emoji: '🦈' },
      { name: '엄마상어', emoji: '🦈' },
      { name: '아빠상어', emoji: '🦈' },
      { name: '할머니상어', emoji: '🦈' },
      { name: '할아버지상어', emoji: '🦈' },
    ]
  },
  {
    category: '공룡',
    icon: '🦖',
    title: '쿵쾅쿵쾅 공룡 친구들',
    description: '티라노사우루스, 트리케라톱스, 브라키오, 프테라노돈',
    items: [
      { name: '티라노사우루스', emoji: '🦖' },
      { name: '트리케라톱스', emoji: '🦕' },
      { name: '브라키오사우루스', emoji: '🦕' },
      { name: '프테라노돈', emoji: '🦅' },
    ]
  },
  {
    category: '바다친구',
    icon: '🌊',
    title: '첨벙첨벙 바다친구',
    description: '돌고래, 문어, 오징어, 꽃게, 바다거북',
    items: [
      { name: '돌고래', emoji: '🐬' },
      { name: '문어', emoji: '🐙' },
      { name: '오징어', emoji: '🦑' },
      { name: '꽃게', emoji: '🦀' },
      { name: '바다거북', emoji: '🐢' },
    ]
  }
];

export function getKoreanNumberWord(n: number): string {
  const words = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  return words[n] || String(n);
}

export function getCountWord(n: number): string {
  const countWords = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  return countWords[n] || String(n);
}
