import React, { useState, useRef, useEffect } from 'react';
import { ColoringTemplate, SavedArtwork } from '../types';
import { speak, playSfx } from '../utils/audio';
import { 
  Palette, 
  RotateCcw, 
  Eraser, 
  Check, 
  PaintBucket, 
  Brush, 
  Trash2, 
  Download, 
  Images, 
  ChevronLeft,
  ChevronRight,
  Upload,
  ListOrdered,
  Play,
  SlidersHorizontal,
  Eye,
  Sparkles,
  Plus,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { 
  saveArtwork, 
  getSavedArtworks, 
  deleteArtwork, 
  saveCustomTemplate, 
  deleteCustomTemplate,
  getGameProgress, 
  saveGameProgress 
} from '../utils/db';
import { getRandomSticker } from '../utils/stickers';
import { ParentalGateModal } from '../components/ParentalGateModal';
import { LevelSelectorModal } from '../components/LevelSelectorModal';
import { getLevelTitle } from '../utils/levels';
import confetti from 'canvas-confetti';

interface ColoringGameProps {
  templates: ColoringTemplate[];
  onAwardSticker: (stickerName: string, rarity?: 'normal' | 'bonus' | 'special' | 'effort' | 'artwork', dataUrl?: string) => void;
  onFinishRound: () => void;
  isParentModeActive: boolean;
  onRequestParentMode: () => void;
  profileId?: string;
  onTemplatesUpdated?: (templates: ColoringTemplate[]) => void;
}

const PALETTE_COLORS = [
  '#FF4757', // 빨강
  '#FFA502', // 주황
  '#FFD32A', // 노랑
  '#2ED573', // 초록
  '#1E90FF', // 파랑
  '#3742FA', // 남색
  '#A55EEA', // 보라
  '#FF85A2', // 분홍
  '#70A1FF', // 하늘
  '#20BF6B', // 민트
  '#8B4513', // 갈색
  '#2F3542', // 검정
];

const SAMPLE_PRESET_SVGS: Record<string, { title: string; category: string; icon: string; svg: string }> = {
  pororo: {
    title: '귀여운 뽀로로',
    category: '캐릭터',
    icon: '🐧',
    svg: `<path d="M 265 140 C 200 140, 160 190, 160 250 C 160 330, 210 390, 265 390 C 320 390, 370 330, 370 250 C 370 190, 330 140, 265 140 Z" fill="none" stroke="#2B2B2B" stroke-width="14" /><ellipse cx="225" cy="235" rx="30" ry="25" fill="none" stroke="#2B2B2B" stroke-width="10" /><ellipse cx="305" cy="235" rx="30" ry="25" fill="none" stroke="#2B2B2B" stroke-width="10" /><circle cx="230" cy="235" r="8" fill="#2B2B2B" /><circle cx="300" cy="235" r="8" fill="#2B2B2B" /><path d="M 235 270 Q 265 300 295 270 Q 265 255 235 270 Z" fill="none" stroke="#2B2B2B" stroke-width="12" /><path d="M 170 180 C 170 90, 360 90, 360 180" fill="none" stroke="#2B2B2B" stroke-width="14" />`
  },
  shark: {
    title: '신나는 아기상어',
    category: '캐릭터',
    icon: '🦈',
    svg: `<path d="M 120 280 C 140 180, 260 150, 380 200 C 440 220, 470 280, 420 330 C 350 390, 200 380, 140 330 Z" fill="none" stroke="#2B2B2B" stroke-width="14" /><path d="M 250 160 L 290 80 L 320 160 Z" fill="none" stroke="#2B2B2B" stroke-width="14" /><circle cx="210" cy="250" r="20" fill="none" stroke="#2B2B2B" stroke-width="10" /><circle cx="210" cy="250" r="8" fill="#2B2B2B" /><path d="M 180 300 Q 250 340 310 290" fill="none" stroke="#2B2B2B" stroke-width="12" /><path d="M 420 280 L 480 230 L 460 300 L 490 350 Z" fill="none" stroke="#2B2B2B" stroke-width="12" />`
  },
  dino: {
    title: '쿵쾅쿵쾅 아기공룡',
    category: '공룡',
    icon: '🦖',
    svg: `<path d="M 180 180 C 180 120, 260 120, 300 160 C 340 180, 360 220, 340 260 L 310 280 C 330 330, 330 380, 280 400 L 220 400 C 170 380, 160 300, 180 260 Z" fill="none" stroke="#2B2B2B" stroke-width="14" /><circle cx="240" cy="180" r="8" fill="#2B2B2B" /><path d="M 280 230 Q 300 250 330 240" fill="none" stroke="#2B2B2B" stroke-width="10" /><path d="M 330 350 Q 420 360 450 320" fill="none" stroke="#2B2B2B" stroke-width="12" />`
  },
  bus: {
    title: '달리는 꼬마버스',
    category: '탈것',
    icon: '🚌',
    svg: `<path d="M 120 180 L 390 180 Q 430 180, 440 220 L 440 350 L 100 350 L 100 220 Q 110 180, 120 180 Z" fill="none" stroke="#2B2B2B" stroke-width="14" /><path d="M 130 200 L 250 200 L 250 270 L 130 270 Z" fill="none" stroke="#2B2B2B" stroke-width="12" /><path d="M 270 200 L 400 200 L 400 270 L 270 270 Z" fill="none" stroke="#2B2B2B" stroke-width="12" /><circle cx="170" cy="360" r="35" fill="none" stroke="#2B2B2B" stroke-width="14" /><circle cx="370" cy="360" r="35" fill="none" stroke="#2B2B2B" stroke-width="14" />`
  }
};

export const ColoringGame: React.FC<ColoringGameProps> = ({
  templates,
  onAwardSticker,
  onFinishRound,
  isParentModeActive,
  onRequestParentMode,
  profileId = 'profile_default',
  onTemplatesUpdated,
}) => {
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const currentTemplate = templates[currentTemplateIndex] || templates[0];

  // Tool states
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0]);
  const [brushSize, setBrushSize] = useState<number>(24); // 12, 24, 48
  const [isEraser, setIsEraser] = useState(false);
  const [toolMode, setToolMode] = useState<'brush' | 'fill'>('brush');

  // Canvases: bottom = color layer, top = template outline layer
  const colorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Undo history (up to 20)
  const undoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Modal states
  const [showGallery, setShowGallery] = useState(false);
  const [savedArtworks, setSavedArtworks] = useState<SavedArtwork[]>([]);
  const [showClearGate, setShowClearGate] = useState(false);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [currentArtDataUrl, setCurrentArtDataUrl] = useState('');

  // Parent upload template state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadGate, setShowUploadGate] = useState(false);

  // Upload modal inputs
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('캐릭터');
  const [uploadThreshold, setUploadThreshold] = useState(150);
  const [uploadInvert, setUploadInvert] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [processedOutlineUrl, setProcessedOutlineUrl] = useState<string | null>(null);
  const [rawImageObj, setRawImageObj] = useState<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load progress
  useEffect(() => {
    async function loadProgress() {
      const prog = await getGameProgress('coloring', profileId);
      setLevel(prog.currentLevel);
      setHighestLevel(prog.highestLevel);
      const tplIdx = (prog.currentLevel - 1) % Math.max(1, templates.length);
      setCurrentTemplateIndex(tplIdx);
    }
    loadProgress();
  }, [profileId, templates.length]);

  // Convert uploaded image to toddler-friendly transparent outline
  const processImageToOutline = (img: HTMLImageElement, thresholdVal: number, invert: boolean = false): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 530;
    canvas.height = 530;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Clean white canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 530, 530);

    // Maintain aspect ratio with 24px padding
    const pad = 24;
    const maxW = 530 - pad * 2;
    const maxH = 530 - pad * 2;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (530 - w) / 2;
    const y = (530 - h) / 2;

    ctx.drawImage(img, x, y, w, h);

    const imgData = ctx.getImageData(0, 0, 530, 530);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      let isLine = false;
      if (invert) {
        isLine = lum >= thresholdVal && a > 50;
      } else {
        isLine = lum < thresholdVal && a > 50;
      }

      if (isLine) {
        // Dark line outline for toddler coloring
        data[i] = 40;
        data[i + 1] = 40;
        data[i + 2] = 40;
        data[i + 3] = 255;
      } else {
        // Transparent interior so toddler coloring shows through!
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  // Re-process when threshold or invert changes
  useEffect(() => {
    if (rawImageObj) {
      const outline = processImageToOutline(rawImageObj, uploadThreshold, uploadInvert);
      setProcessedOutlineUrl(outline);
    }
  }, [uploadThreshold, uploadInvert, rawImageObj]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadTitle.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setUploadTitle(baseName);
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      setRawImageSrc(result);
      const img = new Image();
      img.onload = () => {
        setRawImageObj(img);
        const outline = processImageToOutline(img, uploadThreshold, uploadInvert);
        setProcessedOutlineUrl(outline);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const loadPresetSample = (key: string) => {
    const preset = SAMPLE_PRESET_SVGS[key];
    if (!preset) return;
    setUploadTitle(preset.title);
    setUploadCategory(preset.category);
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 530 530" width="530" height="530">
        <rect width="100%" height="100%" fill="white" />
        ${preset.svg}
      </svg>
    `;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setRawImageSrc(url);
    const img = new Image();
    img.onload = () => {
      setRawImageObj(img);
      const outline = processImageToOutline(img, uploadThreshold, uploadInvert);
      setProcessedOutlineUrl(outline);
    };
    img.src = url;
  };

  const handleSaveUploadedTemplate = async () => {
    if (!processedOutlineUrl) {
      speak('먼저 사진이나 그림 파일을 올려주세요.');
      return;
    }

    const title = uploadTitle.trim() || '내가 올린 멋진 도안';
    const newTpl: ColoringTemplate = {
      id: `tpl_custom_${Date.now()}`,
      title,
      category: uploadCategory,
      svgPath: processedOutlineUrl,
      isCustom: true,
    };

    await saveCustomTemplate(newTpl);
    const updated = [...templates, newTpl];
    onTemplatesUpdated?.(updated);
    setCurrentTemplateIndex(updated.length - 1);
    setShowUploadModal(false);
    setRawImageSrc(null);
    setProcessedOutlineUrl(null);
    setRawImageObj(null);
    setUploadTitle('');

    playSfx('correct');
    speak(`${title} 도안이 등록되었어요! 예쁘게 색칠해볼까요?`);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleDeleteCurrentTemplate = async () => {
    if (!currentTemplate.isCustom) return;
    if (!window.confirm(`'${currentTemplate.title}' 맞춤 도안을 삭제할까요?`)) return;

    await deleteCustomTemplate(currentTemplate.id);
    const updated = templates.filter(t => t.id !== currentTemplate.id);
    onTemplatesUpdated?.(updated);
    setCurrentTemplateIndex(0);
    playSfx('button');
    speak('도안이 삭제되었습니다.');
  };

  // Draw outline on top canvas whenever template changes
  useEffect(() => {
    renderTemplateOutline();
    clearColorLayer();
  }, [currentTemplateIndex, currentTemplate]);

  // Load gallery
  useEffect(() => {
    if (showGallery) {
      loadGalleryArtworks();
    }
  }, [showGallery]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveProgressLocal();
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [currentTemplateIndex]);

  const loadGalleryArtworks = async () => {
    const list = await getSavedArtworks();
    setSavedArtworks(list);
  };

  const renderTemplateOutline = () => {
    const canvas = outlineCanvasRef.current;
    if (!canvas || !currentTemplate) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Support data URL raster images (custom uploaded template)
    if (currentTemplate.svgPath.startsWith('data:image/') || currentTemplate.svgPath.startsWith('blob:') || currentTemplate.svgPath.startsWith('http')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = currentTemplate.svgPath;
      return;
    }

    // Support SVG markup
    let svgContent = currentTemplate.svgPath;
    let svgString = '';
    if (svgContent.includes('<svg')) {
      svgString = svgContent;
    } else {
      svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 530 530" width="530" height="530">
          <rect width="100%" height="100%" fill="none" />
          ${svgContent}
        </svg>
      `;
    }
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(blobURL);
    };
    img.src = blobURL;
  };

  const clearColorLayer = () => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStackRef.current = [];
    setCanUndo(false);
  };

  const pushUndo = () => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(data);
    if (undoStackRef.current.length > 20) {
      undoStackRef.current.shift();
    }
    setCanUndo(true);
  };

  const handleUndo = () => {
    if (undoStackRef.current.length === 0) return;
    playSfx('button');
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = undoStackRef.current.pop();
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
    }
    setCanUndo(undoStackRef.current.length > 0);
  };

  // Convert client coordinate to canvas coordinate
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent | React.TouchEvent) => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.PointerEvent).clientX;
      clientY = (e as React.PointerEvent).clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Flood fill algorithm
  const performFloodFill = (startX: number, startY: number) => {
    const colorCanvas = colorCanvasRef.current;
    const outlineCanvas = outlineCanvasRef.current;
    if (!colorCanvas || !outlineCanvas) return;

    const colorCtx = colorCanvas.getContext('2d');
    const outlineCtx = outlineCanvas.getContext('2d');
    if (!colorCtx || !outlineCtx) return;

    pushUndo();

    const width = colorCanvas.width;
    const height = colorCanvas.height;
    const colorData = colorCtx.getImageData(0, 0, width, height);
    const outlineData = outlineCtx.getImageData(0, 0, width, height);

    const targetX = Math.floor(startX);
    const targetY = Math.floor(startY);
    if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) return;

    // Check if clicked directly on a dark outline line
    const outlineIdx = (targetY * width + targetX) * 4;
    if (outlineData.data[outlineIdx + 3] > 180) {
      // Clicked on line, ignore
      return;
    }

    // Convert hex color to RGBA
    const hex = selectedColor.replace('#', '');
    const fillR = parseInt(hex.substring(0, 2), 16);
    const fillG = parseInt(hex.substring(2, 4), 16);
    const fillB = parseInt(hex.substring(4, 6), 16);
    const fillA = 240;

    const startIdx = (targetY * width + targetX) * 4;
    const origR = colorData.data[startIdx];
    const origG = colorData.data[startIdx + 1];
    const origB = colorData.data[startIdx + 2];
    const origA = colorData.data[startIdx + 3];

    // Already the same color?
    if (
      Math.abs(origR - fillR) < 10 &&
      Math.abs(origG - fillG) < 10 &&
      Math.abs(origB - fillB) < 10 &&
      Math.abs(origA - fillA) < 10
    ) {
      return;
    }

    const tolerance = 36;
    const matchStart = (idx: number) => {
      // Must not hit outline line
      if (outlineData.data[idx + 3] > 180) return false;
      const rDiff = Math.abs(colorData.data[idx] - origR);
      const gDiff = Math.abs(colorData.data[idx + 1] - origG);
      const bDiff = Math.abs(colorData.data[idx + 2] - origB);
      const aDiff = Math.abs(colorData.data[idx + 3] - origA);
      return rDiff < tolerance && gDiff < tolerance && bDiff < tolerance && aDiff < tolerance;
    };

    const pixelStack: [number, number][] = [[targetX, targetY]];
    const seen = new Uint8Array(width * height);

    while (pixelStack.length > 0) {
      const [curX, curY] = pixelStack.pop()!;
      const curIdx = (curY * width + curX) * 4;
      const pos = curY * width + curX;

      if (seen[pos]) continue;
      seen[pos] = 1;

      if (!matchStart(curIdx)) continue;

      colorData.data[curIdx] = fillR;
      colorData.data[curIdx + 1] = fillG;
      colorData.data[curIdx + 2] = fillB;
      colorData.data[curIdx + 3] = fillA;

      if (curX > 0 && !seen[pos - 1]) pixelStack.push([curX - 1, curY]);
      if (curX < width - 1 && !seen[pos + 1]) pixelStack.push([curX + 1, curY]);
      if (curY > 0 && !seen[pos - width]) pixelStack.push([curX, curY - 1]);
      if (curY < height - 1 && !seen[pos + width]) pixelStack.push([curX, curY + 1]);
    }

    colorCtx.putImageData(colorData, 0, 0);
    playSfx('sticker');
  };

  // Drawing event handlers
  const handleStartDraw = (e: React.MouseEvent | React.TouchEvent) => {
    // Ignore palm touches (if touch radius / area is huge > 40px)
    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0] as unknown as { radiusX?: number };
      if (touch.radiusX && touch.radiusX > 45) return;
    }

    const coords = getCanvasCoords(e);

    if (toolMode === 'fill' && !isEraser) {
      performFloodFill(coords.x, coords.y);
      return;
    }

    pushUndo();
    isDrawingRef.current = true;
    lastPointRef.current = coords;

    // Draw single dot
    drawStroke(coords.x, coords.y, coords.x, coords.y);
  };

  const handleMoveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || toolMode === 'fill') return;
    const coords = getCanvasCoords(e);
    if (lastPointRef.current) {
      drawStroke(lastPointRef.current.x, lastPointRef.current.y, coords.x, coords.y);
    }
    lastPointRef.current = coords;
  };

  const handleEndDraw = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const drawStroke = (x1: number, y1: number, x2: number, y2: number) => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      // 60% opacity so coloring over gently darkens
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = selectedColor;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  const saveProgressLocal = () => {
    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return;
    try {
      const data = colorCanvas.toDataURL();
      localStorage.setItem(`color_draft_${currentTemplate.id}`, data);
    } catch {
      // ignore
    }
  };

  // "다 했어요!" Finish button handler
  const handleFinishArtwork = async () => {
    playSfx('correct');
    speak('와아! 정말 멋진 그림이에요! 최고예요!');
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.5 },
    });

    // Merge color canvas and outline canvas onto temporary canvas
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = 530;
    mergedCanvas.height = 530;
    const ctx = mergedCanvas.getContext('2d');
    if (ctx && colorCanvasRef.current && outlineCanvasRef.current) {
      // White paper background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 530, 530);
      // Color layer below
      ctx.drawImage(colorCanvasRef.current, 0, 0);
      // Outline layer above
      ctx.drawImage(outlineCanvasRef.current, 0, 0);

      const finalDataUrl = mergedCanvas.toDataURL('image/png');
      setCurrentArtDataUrl(finalDataUrl);

      // Save artwork to IndexedDB
      const newArt: SavedArtwork = {
        id: `art_${Date.now()}`,
        templateId: currentTemplate.id,
        templateTitle: currentTemplate.title,
        dataUrl: finalDataUrl,
        createdAt: new Date().toISOString(),
      };
      await saveArtwork(newArt);

      // Award custom artwork sticker
      onAwardSticker(currentTemplate.title, 'artwork', finalDataUrl);

      // Save and advance level progress
      const nextLvl = Math.min(100, level + 1);
      const newHighest = Math.max(highestLevel, nextLvl);
      setHighestLevel(newHighest);
      await saveGameProgress('coloring', profileId, nextLvl, newHighest);

      setShowFinishedModal(true);
    }
  };

  // Download PNG in Parent mode
  const handleDownloadPNG = () => {
    if (!currentArtDataUrl) return;
    const link = document.createElement('a');
    link.download = `${currentTemplate.title}_색칠.png`;
    link.href = currentArtDataUrl;
    link.click();
  };

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col landscape:flex-row md:flex-row items-center justify-between p-1 sm:p-2 md:p-3 gap-1.5 sm:gap-2 select-none overflow-hidden">
      {/* Left Control Panel: Tools & Palettes */}
      <div className="flex landscape:flex-col md:flex-col items-center justify-center gap-1 sm:gap-1.5 bg-white/95 p-1 sm:p-2 rounded-2xl md:rounded-3xl shadow-md border-2 border-amber-200 z-10 overflow-x-auto max-w-full shrink-0">
        {/* Template Prev / Next & Stage Button */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={() => {
              playSfx('button');
              setShowLevelModal(true);
            }}
            className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-xl border border-amber-300 font-kids text-xs text-amber-950 active:scale-95"
            title="단계 선택"
          >
            <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
            <span>{level}단계</span>
          </button>
          <button
            onClick={() => {
              playSfx('button');
              setCurrentTemplateIndex((i) => (i > 0 ? i - 1 : templates.length - 1));
            }}
            title="이전 도안"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center font-kids text-amber-900 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
          <span className="font-kids text-xs text-stone-600 px-1 whitespace-nowrap">
            {currentTemplateIndex + 1}/{templates.length}
          </span>
          <button
            onClick={() => {
              playSfx('button');
              setCurrentTemplateIndex((i) => (i < templates.length - 1 ? i + 1 : 0));
            }}
            title="다음 도안"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center font-kids text-amber-900 active:scale-95"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="h-px w-full bg-stone-200 hidden landscape:block md:block my-0.5" />

        {/* Brush vs Fill Mode */}
        <div className="flex landscape:flex-col md:flex-col gap-1 sm:gap-1.5">
          <button
            onClick={() => {
              playSfx('button');
              setToolMode('brush');
              setIsEraser(false);
            }}
            title="쓱싹 붓 모드"
            className={`w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              toolMode === 'brush' && !isEraser
                ? 'bg-amber-400 text-amber-950 shadow-md border-2 border-amber-500'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Brush className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={() => {
              playSfx('button');
              setToolMode('fill');
              setIsEraser(false);
            }}
            title="한 번에 톡! 채우기 모드"
            className={`w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              toolMode === 'fill' && !isEraser
                ? 'bg-amber-400 text-amber-950 shadow-md border-2 border-amber-500'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <PaintBucket className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={() => {
              playSfx('button');
              setIsEraser(true);
            }}
            title="지우개"
            className={`w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              isEraser
                ? 'bg-rose-400 text-white shadow-md border-2 border-rose-500'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Eraser className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="h-px w-full bg-stone-200 hidden landscape:block md:block my-0.5" />

        {/* Brush Size (12, 24, 48) */}
        <div className="flex landscape:flex-col md:flex-col items-center gap-1 sm:gap-1.5">
          {[12, 24, 48].map((size) => (
            <button
              key={size}
              onClick={() => {
                playSfx('button');
                setBrushSize(size);
              }}
              title={`굵기 ${size}px`}
              className={`w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                brushSize === size
                  ? 'bg-amber-200 border-2 border-amber-400'
                  : 'bg-stone-100 hover:bg-stone-200'
              }`}
            >
              <div
                className="rounded-full bg-stone-700"
                style={{ width: `${Math.max(5, size / 3.5)}px`, height: `${Math.max(5, size / 3.5)}px` }}
              />
            </button>
          ))}
        </div>

        <div className="h-px w-full bg-stone-200 hidden landscape:block md:block my-0.5" />

        {/* Undo & Clear */}
        <div className="flex landscape:flex-col md:flex-col gap-1 sm:gap-1.5">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="되돌리기"
            className={`w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
              canUndo
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 active:scale-95'
                : 'bg-stone-100 text-stone-300 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => {
              playSfx('button');
              setShowClearGate(true);
            }}
            title="전체 지우기 (보호자 확인)"
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-xl sm:rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center active:scale-95"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Center: Interactive Double Layer Canvas */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center w-full max-w-[min(92vw,50vh,460px)] landscape:max-w-[min(54vw,74vh,480px)] md:max-w-[min(54vw,74vh,500px)] aspect-square my-0.5">
        <div className="relative w-full h-full rounded-3xl bg-white shadow-xl border-4 border-amber-300 overflow-hidden touch-none">
          {/* Bottom Layer: Color Canvas */}
          <canvas
            ref={colorCanvasRef}
            width={530}
            height={530}
            className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none"
            onPointerDown={handleStartDraw}
            onPointerMove={handleMoveDraw}
            onPointerUp={handleEndDraw}
            onPointerCancel={handleEndDraw}
          />

          {/* Top Layer: Drawing Outline Canvas (Never erased!) */}
          <canvas
            ref={outlineCanvasRef}
            width={530}
            height={530}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />
        </div>

        {/* Current Template Name Banner */}
        <div className="mt-0.5 font-kids text-stone-700 text-xs sm:text-sm md:text-base flex items-center gap-1.5 shrink-0">
          <span>🎨 {currentTemplate.title}</span>
          {currentTemplate.isCustom && (
            <button
              onClick={handleDeleteCurrentTemplate}
              title="이 맞춤 도안 삭제"
              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs flex items-center gap-0.5 ml-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>삭제</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Control Panel: 12-Color Palette & Actions */}
      <div className="flex landscape:flex-col md:flex-col items-center justify-center gap-1.5 sm:gap-2 bg-white/95 p-1 sm:p-2 rounded-2xl md:rounded-3xl shadow-md border-2 border-amber-200 z-10 overflow-x-auto max-w-full shrink-0">
        {/* Big Circular 12-Color Palette Buttons */}
        <div className="grid grid-cols-6 landscape:grid-cols-2 md:grid-cols-2 gap-1.5 sm:gap-2">
          {PALETTE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                playSfx('button');
                setSelectedColor(c);
                setIsEraser(false);
              }}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full shadow-md transition-transform active:scale-90 flex items-center justify-center border-2 cursor-pointer ${
                selectedColor === c && !isEraser
                  ? 'border-white ring-3 ring-amber-400 scale-110'
                  : 'border-white/80'
              }`}
            >
              {selectedColor === c && !isEraser && (
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white shadow-sm" />
              )}
            </button>
          ))}
        </div>

        <div className="h-px w-full bg-stone-200 hidden landscape:block md:block my-0.5" />

        {/* "다 했어요!" Big Action Button (Kid Friendly) */}
        <button
          onClick={handleFinishArtwork}
          className="px-3 sm:px-4 py-1.5 sm:py-2.5 md:py-3.5 landscape:w-full md:w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-kids text-sm sm:text-base md:text-lg shadow-lg flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>다 했어요!</span>
        </button>

        {/* Gallery & Upload Buttons */}
        <div className="flex gap-1 sm:gap-1.5">
          <button
            onClick={() => {
              playSfx('button');
              setShowGallery(true);
            }}
            title="그림 갤러리"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl sm:rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <Images className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Upload Custom Template Button - ALWAYS accessible */}
          <button
            onClick={() => {
              playSfx('button');
              if (!isParentModeActive) {
                setShowUploadGate(true);
              } else {
                setShowUploadModal(true);
              }
            }}
            title="도안 직접 올리기 (보호자)"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl sm:rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center active:scale-95 cursor-pointer border border-amber-300"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
          </button>
        </div>
      </div>

      {/* Finished Picture Frame Modal */}
      {showFinishedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-amber-50 rounded-3xl p-6 text-center border-4 border-amber-300 shadow-2xl animate-soft-bounce">
            <span className="text-4xl">🎉</span>
            <h3 className="font-kids text-2xl text-amber-950 mt-2 mb-1">
              멋진 작품이 완성되었어요!
            </h3>
            <p className="text-sm text-stone-600 mb-4">
              스티커북에 새로운 스티커가 쏙 들어갔어요!
            </p>

            {/* Framed Image */}
            <div className="p-3 bg-amber-200/60 rounded-2xl border-4 border-amber-400 shadow-inner inline-block mb-6">
              <img
                src={currentArtDataUrl}
                alt="완성 작품"
                className="w-56 h-56 object-contain rounded-xl bg-white shadow-md"
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              {isParentModeActive && (
                <button
                  onClick={handleDownloadPNG}
                  className="px-4 py-3 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-kids text-base flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  <span>저장</span>
                </button>
              )}

              <button
                onClick={() => {
                  playSfx('button');
                  setShowFinishedModal(false);
                  const nextLvl = Math.min(100, level + 1);
                  setLevel(nextLvl);
                  const tplIdx = (nextLvl - 1) % Math.max(1, templates.length);
                  setCurrentTemplateIndex(tplIdx);
                }}
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-kids text-base shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{Math.min(100, level + 1)}단계 도전!</span>
              </button>

              <button
                onClick={() => {
                  playSfx('button');
                  setShowFinishedModal(false);
                  onFinishRound();
                }}
                className="px-4 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-kids text-sm flex items-center justify-center active:scale-95"
              >
                메인으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Selector Modal */}
      <LevelSelectorModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        gameTitle="색칠 놀이"
        currentLevel={level}
        highestLevel={highestLevel}
        onSelectLevel={(lvl) => {
          setLevel(lvl);
          saveGameProgress('coloring', profileId, lvl);
          const tplIdx = (lvl - 1) % Math.max(1, templates.length);
          setCurrentTemplateIndex(tplIdx);
        }}
      />

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative max-w-3xl w-full h-[80vh] bg-white rounded-3xl p-6 flex flex-col shadow-2xl border-4 border-amber-300">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-kids text-2xl text-amber-950 flex items-center gap-2">
                <span>🖼️</span> 내 그림 갤러리 ({savedArtworks.length}개)
              </h3>
              <button
                onClick={() => setShowGallery(false)}
                className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-kids text-lg"
              >
                ✕
              </button>
            </div>

            {savedArtworks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-400 font-kids text-lg">
                <p>아직 저장된 그림이 없어요.</p>
                <p className="text-sm mt-1">색칠하고 '다 했어요!'를 눌러보세요!</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
                {savedArtworks.map((art) => (
                  <div
                    key={art.id}
                    className="relative p-2 bg-amber-50 rounded-2xl border-2 border-amber-200 flex flex-col items-center shadow-sm"
                  >
                    <img
                      src={art.dataUrl}
                      alt={art.templateTitle}
                      className="w-full h-36 object-contain rounded-xl bg-white shadow-inner mb-2"
                    />
                    <span className="font-kids text-sm text-stone-700 truncate w-full text-center">
                      {art.templateTitle}
                    </span>

                    {/* Parent Mode Delete */}
                    {isParentModeActive && (
                      <button
                        onClick={async () => {
                          await deleteArtwork(art.id);
                          loadGalleryArtworks();
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parental Gate for Clear Canvas */}
      <ParentalGateModal
        isOpen={showClearGate}
        onClose={() => setShowClearGate(false)}
        onSuccess={() => {
          clearColorLayer();
          speak('그림을 깨끗이 지웠어요.');
        }}
      />

      {/* Parental Gate for Uploading Custom Template */}
      <ParentalGateModal
        isOpen={showUploadGate}
        onClose={() => setShowUploadGate(false)}
        onSuccess={() => {
          setShowUploadGate(false);
          onRequestParentMode();
          setShowUploadModal(true);
        }}
      />

      {/* Upload Custom Template Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 select-none animate-fadeIn">
          <div className="relative max-w-2xl w-full max-h-[92dvh] bg-white rounded-3xl p-4 sm:p-6 flex flex-col shadow-2xl border-4 border-amber-300 overflow-y-auto text-stone-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">🎨</span>
                <div>
                  <h3 className="font-kids text-lg sm:text-2xl text-amber-950 font-bold">
                    도안 직접 올리기 (색칠 도안 등록)
                  </h3>
                  <p className="text-xs text-stone-500">
                    스마트폰이나 컴퓨터에 있는 그림/사진을 색칠 도안으로 자동 변환합니다!
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  playSfx('button');
                  setShowUploadModal(false);
                }}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-kids text-lg text-stone-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4 pt-3">
              {/* Form inputs: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    도안 이름
                  </label>
                  <input
                    type="text"
                    placeholder="예: 뽀로로와 크롱, 아기상어, 우리 강아지"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 font-kids"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    카테고리
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white font-kids"
                  >
                    <option value="캐릭터">캐릭터</option>
                    <option value="동물">동물</option>
                    <option value="탈것">탈것</option>
                    <option value="공룡">공룡</option>
                    <option value="과일">과일</option>
                    <option value="가족">가족</option>
                    <option value="자유">자유</option>
                  </select>
                </div>
              </div>

              {/* File upload zone */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-4 border-2 border-dashed border-amber-400 hover:border-amber-500 rounded-2xl bg-amber-50/60 hover:bg-amber-100/60 flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.99] cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-amber-600" />
                  <span className="font-kids text-sm sm:text-base text-amber-950 font-bold">
                    내 기기에서 사진/도안 파일 선택하기
                  </span>
                  <span className="text-xs text-stone-500">
                    PNG, JPG, WEBP, SVG 이미지 지원 (외곽선 자동 추출)
                  </span>
                </button>
              </div>

              {/* Sample Preset Buttons for quick testing */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-1 text-xs font-bold text-stone-700 font-kids mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>또는 추천 도안 원클릭 불러오기:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(SAMPLE_PRESET_SVGS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => loadPresetSample(key)}
                      className="px-2.5 py-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl font-kids text-xs text-amber-950 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                    >
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview and Threshold adjustments */}
              {processedOutlineUrl && (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 font-kids flex items-center gap-1">
                      <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                      외곽선 선명도(두께) 조절
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uploadInvert}
                        onChange={(e) => setUploadInvert(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span>흑백 반전</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-stone-500 whitespace-nowrap">연하게</span>
                    <input
                      type="range"
                      min={60}
                      max={220}
                      value={uploadThreshold}
                      onChange={(e) => setUploadThreshold(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-stone-500 whitespace-nowrap">진하게</span>
                  </div>

                  {/* Previews side by side */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-stone-500 mb-1 font-kids">원본 그림</span>
                      <div className="w-full h-36 sm:h-44 bg-white rounded-xl border border-stone-200 p-2 flex items-center justify-center overflow-hidden">
                        {rawImageSrc && (
                          <img
                            src={rawImageSrc}
                            alt="원본 미리보기"
                            className="max-w-full max-h-full object-contain"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-xs text-emerald-700 font-bold mb-1 font-kids">
                        색칠 도안 (완성 미리보기)
                      </span>
                      <div className="w-full h-36 sm:h-44 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] bg-white rounded-xl border-2 border-emerald-400 p-2 flex items-center justify-center overflow-hidden shadow-inner">
                        <img
                          src={processedOutlineUrl}
                          alt="도안 미리보기"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  playSfx('button');
                  setShowUploadModal(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-kids text-sm text-stone-700 active:scale-95"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveUploadedTemplate}
                disabled={!processedOutlineUrl}
                className={`px-5 py-2.5 rounded-xl font-kids text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition ${
                  processedOutlineUrl
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>도안 등록하고 바로 색칠하기!</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
