import { ColoringTemplate } from '../types';

export const DEFAULT_TEMPLATES: ColoringTemplate[] = [
  {
    id: 'tpl_rabbit',
    title: '귀여운 토끼',
    category: '동물',
    svgPath: `
      <!-- 토끼 얼굴과 귀 -->
      <path d="M 220 180 C 190 60, 210 20, 245 40 C 270 55, 260 140, 250 180" fill="none" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 280 180 C 270 140, 260 55, 285 40 C 320 20, 340 60, 310 180" fill="none" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <ellipse cx="265" cy="270" rx="105" ry="95" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <!-- 눈, 코, 입 -->
      <circle cx="225" cy="250" r="10" fill="#2B2B2B" />
      <circle cx="305" cy="250" r="10" fill="#2B2B2B" />
      <ellipse cx="265" cy="275" rx="12" ry="8" fill="#2B2B2B" />
      <path d="M 255 285 Q 265 295 275 285" fill="none" stroke="#2B2B2B" stroke-width="8" stroke-linecap="round" />
      <!-- 몸통과 발 -->
      <ellipse cx="265" cy="380" rx="80" ry="60" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <ellipse cx="220" cy="435" rx="35" ry="20" fill="none" stroke="#2B2B2B" stroke-width="12" />
      <ellipse cx="310" cy="435" rx="35" ry="20" fill="none" stroke="#2B2B2B" stroke-width="12" />
    `
  },
  {
    id: 'tpl_apple',
    title: '맛있는 사과',
    category: '과일',
    svgPath: `
      <!-- 사과 본체 -->
      <path d="M 265 150 C 350 90, 420 200, 380 320 C 350 410, 280 430, 265 400 C 250 430, 180 410, 150 320 C 110 200, 180 90, 265 150 Z" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 꼭지와 잎사귀 -->
      <path d="M 265 150 Q 275 90 280 70" fill="none" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" />
      <path d="M 275 110 Q 340 70 330 110 Q 300 130 275 110 Z" fill="none" stroke="#2B2B2B" stroke-width="12" stroke-linejoin="round" />
    `
  },
  {
    id: 'tpl_car',
    title: '부릉부릉 자동차',
    category: '탈것',
    svgPath: `
      <!-- 차체 지붕 & 몸통 -->
      <path d="M 120 310 L 140 250 Q 180 180 250 180 L 330 180 Q 390 180 420 260 L 460 270 Q 480 280 480 320 L 480 360 L 100 360 Q 90 330 120 310 Z" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 창문 -->
      <path d="M 200 200 L 270 200 L 270 260 L 170 260 Z" fill="none" stroke="#2B2B2B" stroke-width="12" stroke-linejoin="round" />
      <path d="M 290 200 L 350 200 L 380 260 L 290 260 Z" fill="none" stroke="#2B2B2B" stroke-width="12" stroke-linejoin="round" />
      <!-- 바퀴 -->
      <circle cx="180" cy="365" r="45" fill="none" stroke="#2B2B2B" stroke-width="16" />
      <circle cx="180" cy="365" r="18" fill="#2B2B2B" />
      <circle cx="390" cy="365" r="45" fill="none" stroke="#2B2B2B" stroke-width="16" />
      <circle cx="390" cy="365" r="18" fill="#2B2B2B" />
    `
  },
  {
    id: 'tpl_bear',
    title: '아기곰',
    category: '동물',
    svgPath: `
      <!-- 곰 귀 -->
      <circle cx="180" cy="160" r="45" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <circle cx="350" cy="160" r="45" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <!-- 곰 얼굴 -->
      <circle cx="265" cy="250" r="110" fill="none" stroke="#2B2B2B" stroke-width="16" />
      <!-- 눈, 입 -->
      <circle cx="225" cy="230" r="12" fill="#2B2B2B" />
      <circle cx="305" cy="230" r="12" fill="#2B2B2B" />
      <ellipse cx="265" cy="275" rx="42" ry="30" fill="none" stroke="#2B2B2B" stroke-width="10" />
      <ellipse cx="265" cy="265" rx="14" ry="10" fill="#2B2B2B" />
      <path d="M 255 285 Q 265 295 275 285" fill="none" stroke="#2B2B2B" stroke-width="8" stroke-linecap="round" />
      <!-- 몸 -->
      <path d="M 180 340 C 160 410, 180 440, 265 440 C 350 440, 370 410, 350 340" fill="none" stroke="#2B2B2B" stroke-width="14" stroke-linejoin="round" />
    `
  },
  {
    id: 'tpl_fish',
    title: '동글 물고기',
    category: '동물',
    svgPath: `
      <!-- 몸통 & 꼬리 -->
      <path d="M 330 250 C 270 140, 130 170, 100 250 C 130 330, 270 360, 330 250 Z" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <path d="M 330 250 L 410 180 L 390 250 L 410 320 Z" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 지느러미 & 눈 -->
      <path d="M 210 165 Q 240 120 270 175" fill="none" stroke="#2B2B2B" stroke-width="12" />
      <circle cx="150" cy="225" r="14" fill="#2B2B2B" />
      <path d="M 200 200 Q 230 250 200 300" fill="none" stroke="#2B2B2B" stroke-width="10" stroke-linecap="round" />
    `
  },
  {
    id: 'tpl_cat',
    title: '야옹이',
    category: '동물',
    svgPath: `
      <!-- 고양이 머리와 뾰족귀 -->
      <path d="M 170 210 L 160 120 L 225 170 L 305 170 L 370 120 L 360 210 C 390 260, 380 320, 265 320 C 150 320, 140 260, 170 210 Z" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 눈, 코, 수염 -->
      <ellipse cx="215" cy="235" rx="12" ry="16" fill="#2B2B2B" />
      <ellipse cx="315" cy="235" rx="12" ry="16" fill="#2B2B2B" />
      <polygon points="265,260 255,250 275,250" fill="#2B2B2B" />
      <line x1="170" y1="250" x2="130" y2="245" stroke="#2B2B2B" stroke-width="8" stroke-linecap="round" />
      <line x1="170" y1="265" x2="130" y2="270" stroke="#2B2B2B" stroke-width="8" stroke-linecap="round" />
      <line x1="360" y1="250" x2="400" y2="245" stroke="#2B2B2B" stroke-width="8" stroke-linecap="round" />
      <line x1="360" y1="265" x2="400" y2="270" stroke="#2B2B2B" stroke-width="8" stroke-linecap="round" />
      <ellipse cx="265" cy="385" rx="75" ry="50" fill="none" stroke="#2B2B2B" stroke-width="14" />
    `
  },
  {
    id: 'tpl_icecream',
    title: '달콤 아이스크림',
    category: '과일',
    svgPath: `
      <!-- 아이스크림 스쿱 3개 -->
      <circle cx="265" cy="180" r="75" fill="none" stroke="#2B2B2B" stroke-width="16" />
      <circle cx="215" cy="240" r="55" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <circle cx="315" cy="240" r="55" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <!-- 콘 과자 -->
      <polygon points="180,270 350,270 265,450" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 콘 격자무늬 -->
      <line x1="215" y1="330" x2="315" y2="330" stroke="#2B2B2B" stroke-width="8" />
      <line x1="235" y1="380" x2="295" y2="380" stroke="#2B2B2B" stroke-width="8" />
    `
  },
  {
    id: 'tpl_flower',
    title: '활짝 핀 꽃',
    category: '식물',
    svgPath: `
      <!-- 중심원 -->
      <circle cx="265" cy="220" r="50" fill="none" stroke="#2B2B2B" stroke-width="16" />
      <!-- 꽃잎 5개 -->
      <circle cx="265" cy="130" r="45" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <circle cx="350" cy="190" r="45" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <circle cx="320" cy="290" r="45" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <circle cx="210" cy="290" r="45" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <circle cx="180" cy="190" r="45" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <!-- 줄기와 잎 -->
      <path d="M 265 270 L 265 440" stroke="#2B2B2B" stroke-width="16" stroke-linecap="round" />
      <path d="M 265 350 Q 340 330 330 370 Q 290 380 265 350 Z" fill="none" stroke="#2B2B2B" stroke-width="12" stroke-linejoin="round" />
    `
  },
  {
    id: 'tpl_rocket',
    title: '우주 로켓',
    category: '우주',
    svgPath: `
      <!-- 로켓 몸체 -->
      <path d="M 265 80 C 220 180, 210 320, 210 350 L 320 350 C 320 320, 310 180, 265 80 Z" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 창문 -->
      <circle cx="265" cy="220" r="35" fill="none" stroke="#2B2B2B" stroke-width="12" />
      <!-- 날개 -->
      <path d="M 210 280 L 150 360 L 210 350 Z" fill="none" stroke="#2B2B2B" stroke-width="14" stroke-linejoin="round" />
      <path d="M 320 280 L 380 360 L 320 350 Z" fill="none" stroke="#2B2B2B" stroke-width="14" stroke-linejoin="round" />
      <!-- 불꽃 -->
      <path d="M 235 350 L 265 430 L 295 350" fill="none" stroke="#2B2B2B" stroke-width="12" stroke-linejoin="round" />
    `
  },
  {
    id: 'tpl_star',
    title: '반짝이는 별',
    category: '우주',
    svgPath: `
      <!-- 커다란 별 -->
      <polygon points="265,60 315,180 445,190 345,280 380,410 265,340 150,410 185,280 85,190 215,180" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 깜찍한 눈과 미소 -->
      <circle cx="230" cy="250" r="12" fill="#2B2B2B" />
      <circle cx="300" cy="250" r="12" fill="#2B2B2B" />
      <path d="M 245 280 Q 265 300 285 280" fill="none" stroke="#2B2B2B" stroke-width="8" stroke-linecap="round" />
    `
  },
  {
    id: 'tpl_house',
    title: '우리 집',
    category: '탈것',
    svgPath: `
      <!-- 지붕 -->
      <polygon points="265,90 120,210 410,210" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 집 몸체 -->
      <rect x="150" y="210" width="230" height="190" fill="none" stroke="#2B2B2B" stroke-width="16" rx="8" />
      <!-- 창문 & 문 -->
      <rect x="180" y="240" width="60" height="60" fill="none" stroke="#2B2B2B" stroke-width="12" rx="6" />
      <rect x="275" y="270" width="70" height="130" fill="none" stroke="#2B2B2B" stroke-width="12" rx="4" />
      <circle cx="290" cy="340" r="6" fill="#2B2B2B" />
    `
  },
  {
    id: 'tpl_duck',
    title: '뒤뚱 오리',
    category: '동물',
    svgPath: `
      <!-- 머리와 부리 -->
      <circle cx="210" cy="180" r="60" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <path d="M 155 180 L 110 190 L 155 210 Z" fill="none" stroke="#2B2B2B" stroke-width="12" stroke-linejoin="round" />
      <circle cx="200" cy="165" r="10" fill="#2B2B2B" />
      <!-- 몸통 & 꼬리 -->
      <path d="M 210 240 C 210 320, 360 340, 390 270 C 370 250, 320 240, 260 240 Z" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 물결 -->
      <path d="M 120 370 Q 200 350 260 370 Q 320 390 400 370" fill="none" stroke="#2B2B2B" stroke-width="12" stroke-linecap="round" />
    `
  },
  {
    id: 'tpl_strawberry',
    title: '달콤 딸기',
    category: '과일',
    svgPath: `
      <!-- 딸기 잎 -->
      <path d="M 220 140 Q 265 180 310 140 Q 340 110 310 100 Q 265 120 220 100 Z" fill="none" stroke="#2B2B2B" stroke-width="12" stroke-linejoin="round" />
      <!-- 딸기 몸체 -->
      <path d="M 180 160 C 130 260, 200 400, 265 420 C 330 400, 400 260, 350 160 C 310 170, 220 170, 180 160 Z" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 씨앗 -->
      <circle cx="230" cy="230" r="5" fill="#2B2B2B" />
      <circle cx="290" cy="220" r="5" fill="#2B2B2B" />
      <circle cx="260" cy="280" r="5" fill="#2B2B2B" />
      <circle cx="220" cy="330" r="5" fill="#2B2B2B" />
      <circle cx="300" cy="330" r="5" fill="#2B2B2B" />
      <circle cx="265" cy="370" r="5" fill="#2B2B2B" />
    `
  },
  {
    id: 'tpl_sun',
    title: '따뜻한 해님',
    category: '우주',
    svgPath: `
      <!-- 중앙 해님 -->
      <circle cx="265" cy="265" r="90" fill="none" stroke="#2B2B2B" stroke-width="16" />
      <!-- 햇살 8개 -->
      <line x1="265" y1="130" x2="265" y2="70" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" />
      <line x1="265" y1="400" x2="265" y2="460" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" />
      <line x1="130" y1="265" x2="70" y2="265" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" />
      <line x1="400" y1="265" x2="460" y2="265" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" />
      <!-- 눈, 입 -->
      <circle cx="230" cy="250" r="12" fill="#2B2B2B" />
      <circle cx="300" cy="250" r="12" fill="#2B2B2B" />
      <path d="M 235 285 Q 265 315 295 285" fill="none" stroke="#2B2B2B" stroke-width="10" stroke-linecap="round" />
    `
  },
  {
    id: 'tpl_banana',
    title: '노란 바나나',
    category: '과일',
    svgPath: `
      <!-- 바나나 1송이 -->
      <path d="M 170 120 C 130 250, 190 380, 360 380 C 400 380, 410 360, 380 340 C 230 330, 180 230, 200 120 Z" fill="none" stroke="#2B2B2B" stroke-width="16" stroke-linejoin="round" />
      <!-- 꼭지 -->
      <rect x="165" y="90" width="35" height="35" fill="none" stroke="#2B2B2B" stroke-width="12" rx="4" />
    `
  },
  {
    id: 'tpl_butterfly',
    title: '예쁜 나비',
    category: '동물',
    svgPath: `
      <!-- 나비 몸통 -->
      <ellipse cx="265" cy="265" rx="16" ry="75" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <!-- 날개 위/아래 -->
      <path d="M 265 210 C 210 120, 110 140, 130 240 C 150 290, 240 280, 265 260" fill="none" stroke="#2B2B2B" stroke-width="14" stroke-linejoin="round" />
      <path d="M 265 210 C 320 120, 420 140, 400 240 C 380 290, 290 280, 265 260" fill="none" stroke="#2B2B2B" stroke-width="14" stroke-linejoin="round" />
      <!-- 더듬이 -->
      <path d="M 255 190 Q 230 140 220 150" fill="none" stroke="#2B2B2B" stroke-width="10" stroke-linecap="round" />
      <path d="M 275 190 Q 300 140 310 150" fill="none" stroke="#2B2B2B" stroke-width="10" stroke-linecap="round" />
    `
  },
  {
    id: 'tpl_train',
    title: '칙칙폭폭 기차',
    category: '탈것',
    svgPath: `
      <!-- 기차 엔진 몸체 -->
      <rect x="120" y="240" width="220" height="120" fill="none" stroke="#2B2B2B" stroke-width="16" rx="10" />
      <rect x="280" y="180" width="120" height="180" fill="none" stroke="#2B2B2B" stroke-width="16" rx="8" />
      <!-- 굴뚝 -->
      <polygon points="160,240 180,180 220,180 200,240" fill="none" stroke="#2B2B2B" stroke-width="12" stroke-linejoin="round" />
      <!-- 창문 -->
      <rect x="310" y="210" width="60" height="60" fill="none" stroke="#2B2B2B" stroke-width="10" rx="6" />
      <!-- 바퀴들 -->
      <circle cx="170" cy="375" r="30" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <circle cx="250" cy="375" r="30" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <circle cx="340" cy="375" r="35" fill="none" stroke="#2B2B2B" stroke-width="14" />
    `
  },
  {
    id: 'tpl_dog',
    title: '귀여운 강아지',
    category: '동물',
    svgPath: `
      <!-- 귀 -->
      <ellipse cx="160" cy="240" rx="35" ry="60" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <ellipse cx="370" cy="240" rx="35" ry="60" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <!-- 얼굴 -->
      <circle cx="265" cy="260" r="95" fill="none" stroke="#2B2B2B" stroke-width="16" />
      <circle cx="225" cy="240" r="12" fill="#2B2B2B" />
      <circle cx="305" cy="240" r="12" fill="#2B2B2B" />
      <ellipse cx="265" cy="285" rx="20" ry="14" fill="#2B2B2B" />
      <!-- 혀 -->
      <path d="M 265 299 Q 265 330 275 320 Q 285 305 275 299 Z" fill="none" stroke="#2B2B2B" stroke-width="8" stroke-linejoin="round" />
    `
  },
  {
    id: 'tpl_giraffe',
    title: '목이 긴 기린',
    category: '동물',
    svgPath: `
      <!-- 기린 머리와 뿔 -->
      <circle cx="240" cy="130" r="50" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <line x1="225" y1="85" x2="220" y2="60" stroke="#2B2B2B" stroke-width="10" stroke-linecap="round" />
      <line x1="255" y1="85" x2="260" y2="60" stroke="#2B2B2B" stroke-width="10" stroke-linecap="round" />
      <!-- 목과 몸통 -->
      <path d="M 215 170 L 220 340 L 160 440" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" />
      <path d="M 270 160 L 300 340 L 380 440" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" />
      <!-- 반점 -->
      <circle cx="245" cy="220" r="14" fill="none" stroke="#2B2B2B" stroke-width="8" />
      <circle cx="265" cy="280" r="16" fill="none" stroke="#2B2B2B" stroke-width="8" />
      <circle cx="230" cy="120" r="8" fill="#2B2B2B" />
    `
  },
  {
    id: 'tpl_elephant',
    title: '아기 코끼리',
    category: '동물',
    svgPath: `
      <!-- 큰 귀 -->
      <ellipse cx="170" cy="240" rx="50" ry="70" fill="none" stroke="#2B2B2B" stroke-width="14" />
      <!-- 머리와 몸 -->
      <circle cx="280" cy="240" r="90" fill="none" stroke="#2B2B2B" stroke-width="16" />
      <!-- 코 -->
      <path d="M 330 260 Q 400 280 390 350 Q 360 370 340 330" fill="none" stroke="#2B2B2B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <!-- 눈 -->
      <circle cx="290" cy="215" r="12" fill="#2B2B2B" />
      <!-- 다리 -->
      <rect x="230" y="325" width="45" height="90" fill="none" stroke="#2B2B2B" stroke-width="14" rx="8" />
      <rect x="300" y="325" width="45" height="90" fill="none" stroke="#2B2B2B" stroke-width="14" rx="8" />
    `
  }
];
