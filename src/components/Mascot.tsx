import React from 'react';
import { speak, playSfx } from '../utils/audio';

interface MascotProps {
  expression?: 'happy' | 'talking' | 'thinking' | 'cheering' | 'sleeping';
  bubbleText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  expression = 'happy',
  bubbleText,
  size = 'md',
  onClick,
  className = '',
}) => {
  const sizeMap = {
    sm: { w: 'w-16 h-16', bubble: 'text-sm py-1.5 px-3 max-w-xs' },
    md: { w: 'w-24 h-24 md:w-28 md:h-28', bubble: 'text-base md:text-lg py-2 px-4 max-w-sm' },
    lg: { w: 'w-36 h-36 md:w-44 md:h-44', bubble: 'text-lg md:text-xl py-3 px-5 max-w-md' },
    xl: { w: 'w-48 h-48 md:w-60 md:h-60', bubble: 'text-xl md:text-2xl py-4 px-6 max-w-lg' },
  };

  const handleBubbleClick = () => {
    if (bubbleText) {
      playSfx('button');
      speak(bubbleText);
    }
  };

  const isSleeping = expression === 'sleeping';
  const isCheering = expression === 'cheering';

  return (
    <div className={`relative flex items-center gap-3 select-none ${className}`}>
      {/* Speech Bubble */}
      {bubbleText && (
        <div
          onClick={handleBubbleClick}
          className={`relative cursor-pointer bg-white/95 text-stone-800 font-kids rounded-3xl shadow-lg border-2 border-amber-200/80 transition-transform active:scale-95 animate-gentle-pulse ${sizeMap[size].bubble}`}
        >
          <p className="leading-snug text-center">{bubbleText}</p>
          <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-white" />
        </div>
      )}

      {/* Rabbit Mascot Avatar (Vector SVG for crispness & softness) */}
      <div
        onClick={onClick}
        className={`relative ${sizeMap[size].w} shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${
          isCheering ? 'animate-soft-bounce' : ''
        }`}
      >
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
          {/* Bunny Ears */}
          <g>
            {/* Left Ear */}
            <path
              d={isSleeping ? "M 45 65 C 20 50, 15 20, 35 15 C 55 10, 65 40, 55 65 Z" : "M 48 65 C 30 15, 45 2, 60 12 C 75 22, 68 50, 60 70 Z"}
              fill="#FDE4CF"
              stroke="#F2C4A2"
              strokeWidth="4"
            />
            <path
              d={isSleeping ? "M 43 55 C 28 45, 25 28, 38 23 C 50 18, 56 38, 49 55 Z" : "M 51 55 C 38 22, 48 12, 57 19 C 66 26, 61 44, 55 58 Z"}
              fill="#FFB6C1"
            />

            {/* Right Ear */}
            <path
              d={isSleeping ? "M 115 65 C 140 50, 145 20, 125 15 C 105 10, 95 40, 105 65 Z" : "M 112 65 C 130 15, 115 2, 100 12 C 85 22, 92 50, 100 70 Z"}
              fill="#FDE4CF"
              stroke="#F2C4A2"
              strokeWidth="4"
            />
            <path
              d={isSleeping ? "M 117 55 C 132 45, 135 28, 122 23 C 110 18, 104 38, 111 55 Z" : "M 109 55 C 122 22, 112 12, 103 19 C 94 26, 99 44, 105 58 Z"}
              fill="#FFB6C1"
            />
          </g>

          {/* Bunny Head */}
          <ellipse cx="80" cy="98" rx="55" ry="48" fill="#FFF9F5" stroke="#F2C4A2" strokeWidth="4" />

          {/* Cheeks (Blushing Peach) */}
          <circle cx="46" cy="106" r="12" fill="#FFAAA6" opacity="0.6" />
          <circle cx="114" cy="106" r="12" fill="#FFAAA6" opacity="0.6" />

          {/* Eyes */}
          {isSleeping ? (
            // Sleeping closed curved eyes
            <g stroke="#6D4C41" strokeWidth="3.5" strokeLinecap="round" fill="none">
              <path d="M 52 94 Q 62 102 70 94" />
              <path d="M 90 94 Q 98 102 108 94" />
            </g>
          ) : isCheering ? (
            // Joyful smiling eyes ^ ^
            <g stroke="#6D4C41" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M 50 96 Q 60 84 70 96" />
              <path d="M 90 96 Q 100 84 110 96" />
            </g>
          ) : expression === 'thinking' ? (
            // Thinking wide eyes looking up
            <g>
              <ellipse cx="60" cy="90" rx="6" ry="8" fill="#4E342E" />
              <circle cx="58" cy="88" r="2.5" fill="#FFFFFF" />
              <ellipse cx="100" cy="90" rx="6" ry="8" fill="#4E342E" />
              <circle cx="98" cy="88" r="2.5" fill="#FFFFFF" />
            </g>
          ) : (
            // Happy sparkly eyes
            <g>
              <ellipse cx="60" cy="94" rx="7" ry="9" fill="#4E342E" />
              <circle cx="58" cy="91" r="3" fill="#FFFFFF" />
              <ellipse cx="100" cy="94" rx="7" ry="9" fill="#4E342E" />
              <circle cx="98" cy="91" r="3" fill="#FFFFFF" />
            </g>
          )}

          {/* Bunny Nose & Mouth */}
          <polygon points="80,105 74,99 86,99" fill="#FF8A80" />
          <path
            d="M 74 106 Q 80 114 86 106"
            fill="none"
            stroke="#6D4C41"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Sleep Zzz marker if sleeping */}
          {isSleeping && (
            <text x="110" y="45" fill="#7986CB" fontSize="20" fontWeight="bold" fontFamily="sans-serif">
              zZz
            </text>
          )}

          {/* Bow tie / ribbon */}
          <g>
            <circle cx="80" cy="144" r="6" fill="#FF80AB" />
            <polygon points="80,144 65,138 65,150" fill="#FF80AB" />
            <polygon points="80,144 95,138 95,150" fill="#FF80AB" />
          </g>
        </svg>
      </div>
    </div>
  );
};
