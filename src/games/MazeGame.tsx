import React, { useState, useEffect, useRef, useCallback } from 'react';
import { speak, playSfx } from '../utils/audio';
import { 
  recordGameStats, 
  getGameProgress, 
  saveGameProgress 
} from '../utils/db';
import { getLevelTitle } from '../utils/levels';
import { LevelSelectorModal } from '../components/LevelSelectorModal';
import { Sparkles, RotateCcw, Hand, Palette, Play, Home, ListOrdered } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MazeGameProps {
  onAwardSticker: (name: string, rarity?: 'normal' | 'bonus' | 'special' | 'effort') => void;
  onFinishRound: () => void;
  profileId: string;
}

type ThemeType = 'forest' | 'ocean' | 'space';

interface Cell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface PixelPoint {
  x: number;
  y: number;
}

const TRAIL_COLORS = [
  { name: '당근 주황', color: '#FF7A00', glow: 'rgba(255, 122, 0, 0.45)' },
  { name: '딸기 분홍', color: '#FF4D8D', glow: 'rgba(255, 77, 141, 0.45)' },
  { name: '바다 파랑', color: '#0EA5E9', glow: 'rgba(14, 165, 233, 0.45)' },
  { name: '새싹 초록', color: '#10B981', glow: 'rgba(16, 185, 129, 0.45)' },
  { name: '별빛 노랑', color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.45)' },
];

export const MazeGame: React.FC<MazeGameProps> = ({
  onAwardSticker,
  onFinishRound,
  profileId,
}) => {
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const [theme, setTheme] = useState<ThemeType>('forest');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  // Compute grid size based on 1~100 level
  const getSizeForLevel = (lvl: number) => {
    if (lvl <= 10) return 3;
    if (lvl <= 25) return 4;
    if (lvl <= 45) return 5;
    if (lvl <= 70) return 6;
    if (lvl <= 90) return 7;
    return 8;
  };

  const size = getSizeForLevel(level);

  // Maze grid state
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [characterPos, setCharacterPos] = useState<Point>({ x: 0, y: 0 });
  const [cellHistory, setCellHistory] = useState<Point[]>([{ x: 0, y: 0 }]);
  
  // Real-time drawn stroke points
  const [freeStrokePoints, setFreeStrokePoints] = useState<PixelPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isGoalReached, setIsGoalReached] = useState(false);
  const [solutionCells, setSolutionCells] = useState<Point[]>([]);

  // Round finished modal
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);

  const idleTimerRef = useRef<number | null>(null);
  const autoNextTimerRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastVisitedCellRef = useRef<Point>({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);

  // Load persistent progress on mount
  useEffect(() => {
    async function loadProgress() {
      const prog = await getGameProgress('maze', profileId);
      setLevel(prog.currentLevel);
      setHighestLevel(prog.highestLevel);
      generateMaze(getSizeForLevel(prog.currentLevel));
    }
    loadProgress();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current);
    };
  }, [profileId]);

  // Keep lastVisitedCell in sync
  useEffect(() => {
    lastVisitedCellRef.current = characterPos;
  }, [characterPos]);

  // 3-Tier Idle Hint handling (8s, 14s, 20s)
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setShowHint(false);

    idleTimerRef.current = window.setTimeout(() => {
      // 1st tier idle: gentle voice
      speak('당근이 어디 있을까? 천천히 길을 찾아봐요.');

      idleTimerRef.current = window.setTimeout(() => {
        // 2nd tier idle: blinking sparkles along solution
        setShowHint(true);
        speak('토끼가 힌트를 줄게요! 반짝이는 길을 따라와요.');
      }, 6000);
    }, 8000);
  }, []);

  // Generate Maze with recursive backtracking
  const generateMaze = (gridSize: number) => {
    const newGrid: Cell[][] = [];
    for (let y = 0; y < gridSize; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < gridSize; x++) {
        row.push({
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false,
        });
      }
      newGrid.push(row);
    }

    const stack: Point[] = [];
    let current: Point = { x: 0, y: 0 };
    newGrid[0][0].visited = true;
    let visitedCount = 1;
    const totalCells = gridSize * gridSize;

    while (visitedCount < totalCells) {
      const neighbors: { pt: Point; dir: 'top' | 'right' | 'bottom' | 'left' }[] = [];
      const { x, y } = current;

      if (y > 0 && !newGrid[y - 1][x].visited) neighbors.push({ pt: { x, y: y - 1 }, dir: 'top' });
      if (x < gridSize - 1 && !newGrid[y][x + 1].visited) neighbors.push({ pt: { x: x + 1, y }, dir: 'right' });
      if (y < gridSize - 1 && !newGrid[y + 1][x].visited) neighbors.push({ pt: { x, y: y + 1 }, dir: 'bottom' });
      if (x > 0 && !newGrid[y][x - 1].visited) neighbors.push({ pt: { x: x - 1, y }, dir: 'left' });

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        const nx = next.pt.x;
        const ny = next.pt.y;

        if (next.dir === 'top') {
          newGrid[y][x].walls.top = false;
          newGrid[ny][nx].walls.bottom = false;
        } else if (next.dir === 'right') {
          newGrid[y][x].walls.right = false;
          newGrid[ny][nx].walls.left = false;
        } else if (next.dir === 'bottom') {
          newGrid[y][x].walls.bottom = false;
          newGrid[ny][nx].walls.top = false;
        } else if (next.dir === 'left') {
          newGrid[y][x].walls.left = false;
          newGrid[ny][nx].walls.right = false;
        }

        newGrid[ny][nx].visited = true;
        stack.push(current);
        current = next.pt;
        visitedCount++;
      } else if (stack.length > 0) {
        current = stack.pop()!;
      } else {
        break;
      }
    }

    setGrid(newGrid);
    setCharacterPos({ x: 0, y: 0 });
    lastVisitedCellRef.current = { x: 0, y: 0 };
    setCellHistory([{ x: 0, y: 0 }]);
    setFreeStrokePoints([]);
    setIsGoalReached(false);
    setIsRoundFinished(false);

    // Compute BFS Solution path
    const sol = solveMazeBFS(newGrid, gridSize, { x: 0, y: 0 }, { x: gridSize - 1, y: gridSize - 1 });
    setSolutionCells(sol);

    resetIdleTimer();
  };

  const solveMazeBFS = (mazeGrid: Cell[][], gridSize: number, start: Point, end: Point): Point[] => {
    const queue: { pt: Point; path: Point[] }[] = [{ pt: start, path: [start] }];
    const visited = new Set<string>([`0,0`]);

    while (queue.length > 0) {
      const { pt, path } = queue.shift()!;
      if (pt.x === end.x && pt.y === end.y) return path;

      const cell = mazeGrid[pt.y]?.[pt.x];
      if (!cell) continue;

      const moves: { pt: Point; open: boolean }[] = [
        { pt: { x: pt.x, y: pt.y - 1 }, open: !cell.walls.top },
        { pt: { x: pt.x + 1, y: pt.y }, open: !cell.walls.right },
        { pt: { x: pt.x, y: pt.y + 1 }, open: !cell.walls.bottom },
        { pt: { x: pt.x - 1, y: pt.y }, open: !cell.walls.left },
      ];

      for (const m of moves) {
        if (m.open && m.pt.x >= 0 && m.pt.x < gridSize && m.pt.y >= 0 && m.pt.y < gridSize) {
          const key = `${m.pt.x},${m.pt.y}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ pt: m.pt, path: [...path, m.pt] });
          }
        }
      }
    }
    return [];
  };

  // Convert screen coordinates to grid cell
  const getCellFromCoords = (clientX: number, clientY: number): { cell: Point; center: PixelPoint; pixelPos: PixelPoint } | null => {
    const board = boardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    if (relX < 0 || relX > rect.width || relY < 0 || relY > rect.height) {
      return null;
    }

    const cellWidth = rect.width / size;
    const cellHeight = rect.height / size;

    const cellX = Math.min(size - 1, Math.max(0, Math.floor(relX / cellWidth)));
    const cellY = Math.min(size - 1, Math.max(0, Math.floor(relY / cellHeight)));

    const centerX = cellX * cellWidth + cellWidth / 2;
    const centerY = cellY * cellHeight + cellHeight / 2;

    return {
      cell: { x: cellX, y: cellY },
      center: { x: centerX, y: centerY },
      pixelPos: { x: relX, y: relY },
    };
  };

  const isPassageOpen = (from: Point, to: Point): boolean => {
    if (!grid || grid.length === 0) return false;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return false;

    if (to.x < 0 || to.x >= size || to.y < 0 || to.y >= size) return false;
    if (from.x < 0 || from.x >= size || from.y < 0 || from.y >= size) return false;

    const fromCell = grid[from.y]?.[from.x];
    const toCell = grid[to.y]?.[to.x];
    if (!fromCell || !toCell) return false;

    if (dx === 1) return !fromCell.walls.right && !toCell.walls.left;
    if (dx === -1) return !fromCell.walls.left && !toCell.walls.right;
    if (dy === 1) return !fromCell.walls.bottom && !toCell.walls.top;
    if (dy === -1) return !fromCell.walls.top && !toCell.walls.bottom;

    return false;
  };

  const tryMoveToCell = (targetCell: Point): boolean => {
    const current = lastVisitedCellRef.current;
    if (current.x === targetCell.x && current.y === targetCell.y) {
      return true;
    }

    // 1. Backtracking check
    if (cellHistory.length > 1) {
      const prevCell = cellHistory[cellHistory.length - 2];
      if (targetCell.x === prevCell.x && targetCell.y === prevCell.y) {
        playSfx('button');
        setCharacterPos(prevCell);
        lastVisitedCellRef.current = prevCell;
        setCellHistory((prev) => prev.slice(0, -1));
        return true;
      }
    }

    // 2. Forward move check
    if (isPassageOpen(current, targetCell)) {
      playSfx('button');
      setCharacterPos(targetCell);
      lastVisitedCellRef.current = targetCell;
      setCellHistory((prev) => [...prev, targetCell]);
      resetIdleTimer();

      if (targetCell.x === size - 1 && targetCell.y === size - 1) {
        handleGoalArrival();
      }
      return true;
    }

    // Wall collision!
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 200);
    playSfx('gentle');
    return false;
  };

  const moveStepByStepTowards = (targetCell: Point) => {
    let current = lastVisitedCellRef.current;
    if (current.x === targetCell.x && current.y === targetCell.y) return;

    let safety = 0;
    while ((current.x !== targetCell.x || current.y !== targetCell.y) && safety < 12) {
      safety++;
      const dx = targetCell.x - current.x;
      const dy = targetCell.y - current.y;

      const prevCell = cellHistory.length > 1 ? cellHistory[cellHistory.length - 2] : null;

      const stepX = dx !== 0 ? { x: current.x + Math.sign(dx), y: current.y } : null;
      const stepY = dy !== 0 ? { x: current.x, y: current.y + Math.sign(dy) } : null;

      let nextStep: Point | null = null;

      // Prioritize backtracking if the pointer points back along the path
      if (prevCell && stepX && prevCell.x === stepX.x && prevCell.y === stepX.y) {
        nextStep = stepX;
      } else if (prevCell && stepY && prevCell.x === stepY.x && prevCell.y === stepY.y) {
        nextStep = stepY;
      } else if (Math.abs(dx) >= Math.abs(dy)) {
        if (stepX && isPassageOpen(current, stepX)) {
          nextStep = stepX;
        } else if (stepY && isPassageOpen(current, stepY)) {
          nextStep = stepY;
        }
      } else {
        if (stepY && isPassageOpen(current, stepY)) {
          nextStep = stepY;
        } else if (stepX && isPassageOpen(current, stepX)) {
          nextStep = stepX;
        }
      }

      if (!nextStep) {
        // Wall hit: strictly stop at the wall and do not cross
        setIsWiggling(true);
        setTimeout(() => setIsWiggling(false), 200);
        playSfx('gentle');
        break;
      }

      const moved = tryMoveToCell(nextStep);
      if (!moved) break;

      current = nextStep;
      if (current.x === size - 1 && current.y === size - 1) {
        break; // Goal reached
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isGoalReached || isRoundFinished) return;

    const hit = getCellFromCoords(e.clientX, e.clientY);
    if (!hit) return;

    const current = lastVisitedCellRef.current;
    const dist = Math.abs(hit.cell.x - current.x) + Math.abs(hit.cell.y - current.y);

    // Only allow starting trace if touching character cell or immediately adjacent open passage
    if (dist > 1) {
      setIsWiggling(true);
      setTimeout(() => setIsWiggling(false), 250);
      playSfx('gentle');
      return;
    }

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    setIsDrawing(true);

    if (dist === 1) {
      tryMoveToCell(hit.cell);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || isGoalReached || isRoundFinished) return;
    const hit = getCellFromCoords(e.clientX, e.clientY);
    if (!hit) return;

    moveStepByStepTowards(hit.cell);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePointerIdRef.current === e.pointerId) {
      activePointerIdRef.current = null;
    }
    setIsDrawing(false);
  };

  const handleGoalArrival = async () => {
    if (isGoalReached || isRoundFinished) return;
    setIsGoalReached(true);
    setIsDrawing(false);
    playSfx('munch');
    speak('냠냠! 맛있는 당근을 찾았어요! 정말 잘했어요!');
    confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } });

    await recordGameStats('maze', profileId, 3);
    onAwardSticker('미로 완주 스티커', level >= 50 ? 'special' : 'normal');

    // Save and advance level progress
    const nextLvl = Math.min(100, level + 1);
    const newHighest = Math.max(highestLevel, nextLvl);
    setHighestLevel(newHighest);
    await saveGameProgress('maze', profileId, nextLvl, newHighest);

    setIsRoundFinished(true);

    if (autoNextTimerRef.current) {
      clearInterval(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    let count = 4;
    setAutoNextCountdown(count);
    autoNextTimerRef.current = window.setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (autoNextTimerRef.current) {
          clearInterval(autoNextTimerRef.current);
          autoNextTimerRef.current = null;
        }
        proceedNextLevel();
      } else {
        setAutoNextCountdown(count);
      }
    }, 1000);
  };

  const proceedNextLevel = (customLevel?: number) => {
    if (autoNextTimerRef.current) {
      clearInterval(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAutoNextCountdown(null);
    setIsRoundFinished(false);
    setIsDrawing(false);
    const target = customLevel ?? Math.min(100, level + 1);
    setLevel(target);
    saveGameProgress('maze', profileId, target);
    generateMaze(getSizeForLevel(target));
  };

  const handleRestartTrace = () => {
    if (autoNextTimerRef.current) {
      clearInterval(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAutoNextCountdown(null);
    setIsRoundFinished(false);
    setIsDrawing(false);
    playSfx('button');
    setCharacterPos({ x: 0, y: 0 });
    lastVisitedCellRef.current = { x: 0, y: 0 };
    setCellHistory([{ x: 0, y: 0 }]);
    setFreeStrokePoints([]);
    setIsGoalReached(false);
    speak('처음부터 다시 가볼까요?');
  };

  // Canvas Crayon Rendering
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    const board = boardRef.current;
    if (!canvas || !board) return;

    const rect = board.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const cellSize = rect.width / size;
    const trailColor = TRAIL_COLORS[selectedColorIdx] || TRAIL_COLORS[0];

    if (cellHistory.length > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(14, cellSize * 0.4);
      ctx.strokeStyle = trailColor.glow;
      ctx.beginPath();
      cellHistory.forEach((pt, idx) => {
        const cx = pt.x * cellSize + cellSize / 2;
        const cy = pt.y * cellSize + cellSize / 2;
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      ctx.lineWidth = Math.max(8, cellSize * 0.25);
      ctx.strokeStyle = trailColor.color;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [cellHistory, size, selectedColorIdx, theme]);

  const themeBg = {
    forest: 'bg-emerald-50/95 border-emerald-300',
    ocean: 'bg-sky-50/95 border-sky-300',
    space: 'bg-indigo-950 border-indigo-400 text-white',
  }[theme];

  const wallHexColor = {
    forest: '#047857',
    ocean: '#0369A1',
    space: '#818CF8',
  }[theme];

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col items-center justify-between p-1 sm:p-2 md:p-3 select-none overflow-hidden">
      {/* Top Header */}
      <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-1 bg-white/95 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-md border-2 border-amber-200 z-20 shrink-0">
        <button
          onClick={() => {
            playSfx('button');
            setShowLevelModal(true);
          }}
          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 active:scale-95 transition-all"
        >
          <span className="font-kids text-stone-800 text-xs sm:text-base font-bold">
            {getLevelTitle(level)} ({size}x{size})
          </span>
          <ListOrdered className="w-4 h-4 text-amber-600" />
        </button>

        {/* Crayon Color Selector */}
        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-xl border border-amber-200">
          <Palette className="w-3.5 h-3.5 text-amber-600 hidden sm:block" />
          <div className="flex items-center gap-1">
            {TRAIL_COLORS.map((c, idx) => (
              <button
                key={c.name}
                onClick={() => {
                  playSfx('button');
                  setSelectedColorIdx(idx);
                }}
                style={{ backgroundColor: c.color }}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-transform active:scale-90 ${
                  selectedColorIdx === idx
                    ? 'border-stone-800 ring-2 ring-amber-400 scale-110 shadow-sm'
                    : 'border-white/80'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center gap-1">
          {(['forest', 'ocean', 'space'] as ThemeType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                playSfx('button');
                setTheme(t);
              }}
              className={`px-2 py-1 rounded-xl font-kids text-[11px] sm:text-xs transition-all ${
                theme === t
                  ? 'bg-amber-400 text-amber-950 border border-amber-500 font-bold'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {t === 'forest' ? '🌲 초원' : t === 'ocean' ? '🌊 바다' : '🚀 우주'}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Banner */}
      <div className="flex items-center gap-1.5 text-stone-700 font-kids text-xs sm:text-sm my-0.5 bg-amber-100/80 px-3 py-0.5 rounded-full border border-amber-200 shrink-0">
        <Hand className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
        <span>손가락으로 쓱쓱 길을 그리면 토끼가 따라와요!</span>
      </div>

      {/* Center: Drawing Touch Maze Board */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center w-full max-h-[min(90vw,62vh,480px)] aspect-square my-0.5">
        <div
          ref={boardRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full h-full rounded-3xl shadow-xl border-4 ${themeBg} overflow-hidden p-1 sm:p-2 grid touch-none cursor-crosshair select-none`}
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => {
              const isGoal = x === size - 1 && y === size - 1;
              const isChar = characterPos.x === x && characterPos.y === y;
              const isSolution = solutionCells.some((p) => p.x === x && p.y === y);

              return (
                <div
                  key={`${x}-${y}`}
                  className="relative flex items-center justify-center transition-colors pointer-events-none"
                  style={{
                    borderTop: cell.walls.top ? `4px solid ${wallHexColor}` : 'none',
                    borderRight: cell.walls.right ? `4px solid ${wallHexColor}` : 'none',
                    borderBottom: cell.walls.bottom ? `4px solid ${wallHexColor}` : 'none',
                    borderLeft: cell.walls.left ? `4px solid ${wallHexColor}` : 'none',
                  }}
                >
                  {isGoal && (
                    <span className="text-3xl sm:text-4xl md:text-5xl animate-gentle-pulse z-20 drop-shadow-md">
                      {theme === 'forest' ? '🥕' : theme === 'ocean' ? '🐠' : '⭐'}
                    </span>
                  )}

                  {isChar && (
                    <div
                      className={`relative text-3xl sm:text-4xl md:text-5xl z-30 transition-transform ${
                        isWiggling ? 'animate-bounce' : 'animate-soft-bounce'
                      }`}
                    >
                      {theme === 'forest' ? '🐰' : theme === 'ocean' ? '🐬' : '🧑‍🚀'}
                    </div>
                  )}

                  {x === 0 && y === 0 && !isChar && (
                    <span className="text-xl sm:text-2xl opacity-60">🚩</span>
                  )}

                  {showHint && isSolution && !isChar && !isGoal && (
                    <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow opacity-90 z-10" />
                  )}
                </div>
              );
            })
          )}

          <canvas
            ref={drawCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-15"
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-center gap-2 py-0.5 sm:py-1 shrink-0 z-10">
        <button
          onClick={handleRestartTrace}
          className="flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-2xl bg-white hover:bg-amber-50 text-stone-700 font-kids text-xs sm:text-sm md:text-base shadow-md border-2 border-amber-300 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-amber-600" />
          <span>처음부터 다시 그리기</span>
        </button>
      </div>

      {/* Level Selector Modal */}
      <LevelSelectorModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        gameTitle="미로 찾기"
        currentLevel={level}
        highestLevel={highestLevel}
        onSelectLevel={(lvl) => proceedNextLevel(lvl)}
      />

      {/* Victory Modal */}
      {isRoundFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative max-w-sm sm:max-w-md w-full bg-white rounded-3xl p-6 text-center border-4 border-amber-300 shadow-2xl flex flex-col items-center">
            <span className="text-6xl animate-bounce mb-2">🥕</span>
            <h3 className="font-kids text-2xl sm:text-3xl text-stone-800 mb-1">
              {level}단계 미로 탈출!
            </h3>
            <p className="font-kids text-amber-700 text-sm sm:text-base mb-3">
              맛있는 당근을 찾아냈어요!
            </p>

            {autoNextCountdown !== null && (
              <p className="font-kids text-xs text-stone-400 mb-4">
                ({autoNextCountdown}초 뒤 다음 단계로 자동 이동해요)
              </p>
            )}

            <div className="w-full flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => proceedNextLevel(Math.min(100, level + 1))}
                className="w-full flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-kids text-base shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{Math.min(100, level + 1)}단계 바로 도전!</span>
              </button>

              <button
                onClick={onFinishRound}
                className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-kids text-sm flex items-center justify-center gap-1 active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>메인으로</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
