import React, { useRef, useState, useEffect } from 'react';
import { Point2D, RenderTheme, Shape3D } from '../types';
import { makeCustomFromStrokes, extrudeShapeTo4D } from '../utils/shapes';
import {
  smoothStrokeCatmullRom,
  drawSmoothBezierPath,
} from '../utils/curveSmoothing';
import {
  PenTool,
  RotateCcw,
  Trash2,
  Check,
  X,
  Sparkles,
  Layers,
  Clock,
  MousePointer,
  Hand,
  Split,
  Smile,
  Type,
  Activity,
} from 'lucide-react';

export type DrawMode = 'hold' | 'click' | 'waiting';

interface ShapeDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyShape: (shape: Shape3D) => void;
  theme: RenderTheme;
}

export const ShapeDrawerModal: React.FC<ShapeDrawerModalProps> = ({
  isOpen,
  onClose,
  onApplyShape,
  theme,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Array of completed, separate strokes (each stroke is Point2D[])
  const [strokes, setStrokes] = useState<Point2D[][]>([]);
  // Active stroke being drawn right now
  const [activeStroke, setActiveStroke] = useState<Point2D[]>([]);

  const [depth, setDepth] = useState<number>(50);
  const [shapeName, setShapeName] = useState<string>('Chữ / Hình vẽ 3D');
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Path smoothing toggle: Catmull-Rom & Bezier interpolation (active by default)
  const [smoothCurves, setSmoothCurves] = useState<boolean>(true);

  // 3 Draw Modes: 'hold' (default) | 'click' | 'waiting'
  const [drawMode, setDrawMode] = useState<DrawMode>('hold');

  // Waiting mode setup: default 3 seconds
  const [waitingSeconds, setWaitingSeconds] = useState<number>(3);

  // Status message
  const [statusMsg, setStatusMsg] = useState<string>(
    'Kiểu Hold: Nhấn giữ chuột vẽ tự do nhiều nét tách rời (viết chữ, vẽ hình)!'
  );

  const canvasWidth = 380;
  const canvasHeight = 380;
  const gridSize = 20;

  // Real-time animation tracker ref
  const trackerRef = useRef<{
    isOnCanvas: boolean;
    isDown: boolean;
    rawSx: number;
    rawSy: number;
    snappedSx: number;
    snappedSy: number;
    lastHoldSx: number;
    lastHoldSy: number;
    // Waiting mode dwell tracking
    anchorRawSx: number;
    anchorRawSy: number;
    pauseStart: number | null;
    hasPlacedCurrentWaiting: boolean;
    // Flash effect
    flashEndTime: number;
    flashPos: { sx: number; sy: number } | null;
  }>({
    isOnCanvas: false,
    isDown: false,
    rawSx: 190,
    rawSy: 190,
    snappedSx: 190,
    snappedSy: 190,
    lastHoldSx: 0,
    lastHoldSy: 0,
    anchorRawSx: 190,
    anchorRawSy: 190,
    pauseStart: null,
    hasPlacedCurrentWaiting: false,
    flashEndTime: 0,
    flashPos: null,
  });

  const strokesRef = useRef<Point2D[][]>(strokes);
  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const activeStrokeRef = useRef<Point2D[]>(activeStroke);
  useEffect(() => {
    activeStrokeRef.current = activeStroke;
  }, [activeStroke]);

  const drawModeRef = useRef<DrawMode>(drawMode);
  useEffect(() => {
    drawModeRef.current = drawMode;
    const tracker = trackerRef.current;
    tracker.pauseStart = null;
    tracker.hasPlacedCurrentWaiting = false;

    if (drawMode === 'hold') {
      setStatusMsg('Vẽ tự do (Hold): Nét uốn lượn mượt mà với Catmull-Rom & Bezier interpolation!');
    } else if (drawMode === 'click') {
      setStatusMsg('Kiểu Click: Nhấp chuột đặt từng đỉnh, bấm "Tách nét mới" để vẽ chữ/hình rời.');
    } else {
      setStatusMsg(`Kiểu Waiting: Dừng chuột ${waitingSeconds}s để chốt điểm.`);
    }
  }, [drawMode, waitingSeconds]);

  const smoothCurvesRef = useRef<boolean>(smoothCurves);
  useEffect(() => {
    smoothCurvesRef.current = smoothCurves;
  }, [smoothCurves]);

  const waitingSecondsRef = useRef<number>(waitingSeconds);
  useEffect(() => {
    waitingSecondsRef.current = waitingSeconds;
  }, [waitingSeconds]);

  const isClosedRef = useRef<boolean>(isClosed);
  useEffect(() => {
    isClosedRef.current = isClosed;
  }, [isClosed]);

  const snapToGridRef = useRef<boolean>(snapToGrid);
  useEffect(() => {
    snapToGridRef.current = snapToGrid;
  }, [snapToGrid]);

  // Main 60 FPS Canvas Render Loop
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;

    const renderLoop = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const tracker = trackerRef.current;
      const currentStrokes = strokesRef.current;
      const currentActive = activeStrokeRef.current;
      const currentMode = drawModeRef.current;
      const closed = isClosedRef.current;
      const waitLimitMs = waitingSecondsRef.current * 1000;
      const useSmoothing = smoothCurvesRef.current;

      // 1. Dark Blueprint Background
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. Subtle Grid
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }

      // 3. Center Axes
      ctx.strokeStyle = `${theme.lineColor}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvasWidth / 2, 0);
      ctx.lineTo(canvasWidth / 2, canvasHeight);
      ctx.moveTo(0, canvasHeight / 2);
      ctx.lineTo(canvasWidth, canvasHeight / 2);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = `${theme.lineColor}60`;
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText('+X', canvasWidth - 20, canvasHeight / 2 - 5);
      ctx.fillText('+Y', canvasWidth / 2 + 5, 14);

      // 4. Render all completed strokes (TÁCH RỜI, KHÔNG AUTO NỐI CHÙM)
      const renderStroke = (pts: Point2D[], isCurActive: boolean) => {
        if (pts.length === 0) return;

        // Single dot (như dấu chấm của chữ 'i')
        if (pts.length === 1) {
          const p = pts[0];
          ctx.fillStyle = theme.lineColor;
          ctx.shadowColor = theme.glowColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.sx ?? p.x + canvasWidth / 2, p.sy ?? p.y + canvasHeight / 2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          return;
        }

        // Multi-point stroke
        ctx.strokeStyle = isCurActive ? '#00ffcc' : theme.lineColor;
        ctx.shadowColor = theme.glowColor;
        ctx.shadowBlur = isCurActive ? 14 : 8;
        ctx.lineWidth = isCurActive ? 3 : 2.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        if (useSmoothing && (currentMode === 'hold' || pts.length >= 3)) {
          // Organic fluid curve via Bezier / Catmull-Rom interpolation
          drawSmoothBezierPath(ctx, pts, closed && pts.length >= 3);
        } else {
          // Sharp line segments
          ctx.moveTo(pts[0].sx ?? pts[0].x, pts[0].sy ?? pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].sx ?? pts[i].x, pts[i].sy ?? pts[i].y);
          }
          if (closed && pts.length >= 3) {
            ctx.closePath();
          }
        }

        if (closed && pts.length >= 3) {
          // Subtle fill only if explicitly closed
          ctx.fillStyle = `${theme.lineColor}15`;
          ctx.fill();
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // In Click or Waiting mode: show vertex dots so users can see exact angles
        // In Hold mode: DO NOT show vertex dots ("ko lập điểm") - pure smooth brush
        if (currentMode !== 'hold') {
          for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            ctx.fillStyle = i === 0 ? '#00ffcc' : theme.vertexColor;
            ctx.beginPath();
            ctx.arc(p.sx ?? p.x, p.sy ?? p.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      };

      // Draw all separate strokes
      for (const stroke of currentStrokes) {
        renderStroke(stroke, false);
      }

      // Draw active stroke currently in progress
      if (currentActive.length > 0) {
        renderStroke(currentActive, true);
      }

      // 5. Flash effect on point chốt (in Click / Waiting)
      if (tracker.flashPos && time < tracker.flashEndTime) {
        const remaining = (tracker.flashEndTime - time) / 400;
        const radius = 5 + (1 - remaining) * 20;
        ctx.strokeStyle = `rgba(0, 255, 204, ${remaining})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tracker.flashPos.sx, tracker.flashPos.sy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 6. Mode-specific interactive overlays
      if (tracker.isOnCanvas) {
        const targetX = currentMode === 'hold' ? tracker.rawSx : tracker.snappedSx;
        const targetY = currentMode === 'hold' ? tracker.rawSy : tracker.snappedSy;

        // MODE: HOLD (Vẽ tự do mượt mà, không lập điểm)
        if (currentMode === 'hold') {
          if (tracker.isDown) {
            // Neon glowing brush head
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 14;
            ctx.fillStyle = '#00ffcc';
            ctx.beginPath();
            ctx.arc(targetX, targetY, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            // Hover pen ring
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(targetX, targetY, 6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#00ffcc';
            ctx.beginPath();
            ctx.arc(targetX, targetY, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // MODE: CLICK (Nhấp từng góc)
        else if (currentMode === 'click') {
          // Crosshair
          ctx.strokeStyle = 'rgba(0, 255, 204, 0.5)';
          ctx.beginPath();
          ctx.moveTo(targetX - 10, targetY);
          ctx.lineTo(targetX + 10, targetY);
          ctx.moveTo(targetX, targetY - 10);
          ctx.lineTo(targetX, targetY + 10);
          ctx.stroke();

          // Dotted guide to last point of active stroke
          if (currentActive.length > 0) {
            const last = currentActive[currentActive.length - 1];
            ctx.strokeStyle = `${theme.lineColor}80`;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(last.sx ?? last.x, last.sy ?? last.y);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          ctx.fillStyle = '#00ffcc';
          ctx.beginPath();
          ctx.arc(targetX, targetY, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // MODE: WAITING (Dừng chốt điểm có Setup thời gian)
        else if (currentMode === 'waiting') {
          let progress = 0;
          let remainingSec = waitingSecondsRef.current;

          if (tracker.pauseStart !== null && !tracker.hasPlacedCurrentWaiting) {
            const elapsed = time - tracker.pauseStart;
            progress = Math.min(1, elapsed / waitLimitMs);
            remainingSec = Math.max(0, (waitLimitMs - elapsed) / 1000);

            // Trigger point placement when time reaches setup limit
            if (elapsed >= waitLimitMs) {
              tracker.hasPlacedCurrentWaiting = true;
              tracker.flashEndTime = time + 400;
              tracker.flashPos = { sx: targetX, sy: targetY };

              const newPt: Point2D = {
                sx: targetX,
                sy: targetY,
                x: targetX - canvasWidth / 2,
                y: targetY - canvasHeight / 2,
              };

              setActiveStroke((prev) => [...prev, newPt]);
              setStatusMsg(`✓ Đã chốt điểm! Tiếp tục di chuyển hoặc bấm "Tách nét mới".`);
            }
          }

          // Dwell countdown dial
          const dialR = 18;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(targetX, targetY, dialR, 0, Math.PI * 2);
          ctx.stroke();

          if (progress > 0 && !tracker.hasPlacedCurrentWaiting) {
            ctx.strokeStyle = '#00ffcc';
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
              targetX,
              targetY,
              dialR,
              -Math.PI / 2,
              -Math.PI / 2 + progress * Math.PI * 2
            );
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px JetBrains Mono, monospace';
            ctx.fillText(`${remainingSec.toFixed(1)}s`, targetX + dialR + 5, targetY + 4);
          }

          ctx.fillStyle = '#00ffcc';
          ctx.beginPath();
          ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, theme]);

  // Pointer position coordinate calculator
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { rawX: 0, rawY: 0, snappedX: 0, snappedY: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;

    const clampedX = Math.max(0, Math.min(canvasWidth, rawX));
    const clampedY = Math.max(0, Math.min(canvasHeight, rawY));

    let snappedX = clampedX;
    let snappedY = clampedY;

    if (snapToGridRef.current) {
      snappedX = Math.round(clampedX / gridSize) * gridSize;
      snappedY = Math.round(clampedY / gridSize) * gridSize;
    }

    return { rawX: clampedX, rawY: clampedY, snappedX, snappedY };
  };

  // POINTER DOWN
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { rawX, rawY, snappedX, snappedY } = getCanvasCoords(e);
    const tracker = trackerRef.current;
    const currentMode = drawModeRef.current;

    tracker.isDown = true;
    tracker.isOnCanvas = true;
    tracker.rawSx = rawX;
    tracker.rawSy = rawY;
    tracker.snappedSx = snappedX;
    tracker.snappedSy = snappedY;

    if (currentMode === 'hold') {
      // HOLD MODE: start a brand new active stroke from this exact point
      const pt: Point2D = {
        sx: rawX,
        sy: rawY,
        x: rawX - canvasWidth / 2,
        y: rawY - canvasHeight / 2,
      };
      setActiveStroke([pt]);
      tracker.lastHoldSx = rawX;
      tracker.lastHoldSy = rawY;
      setStatusMsg('Đang giữ chuột: Nét vẽ tự do uốn lượn mượt mà!');
    } else if (currentMode === 'click') {
      // CLICK MODE: add point to active stroke
      const pt: Point2D = {
        sx: snappedX,
        sy: snappedY,
        x: snappedX - canvasWidth / 2,
        y: snappedY - canvasHeight / 2,
      };
      setActiveStroke((prev) => [...prev, pt]);
      tracker.flashEndTime = performance.now() + 300;
      tracker.flashPos = { sx: snappedX, sy: snappedY };
      setStatusMsg('✓ Đã thêm điểm vào nét hiện tại.');
    } else if (currentMode === 'waiting') {
      tracker.anchorRawSx = rawX;
      tracker.anchorRawSy = rawY;
      tracker.pauseStart = performance.now();
      tracker.hasPlacedCurrentWaiting = false;
    }
  };

  // POINTER MOVE
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { rawX, rawY, snappedX, snappedY } = getCanvasCoords(e);
    const tracker = trackerRef.current;
    const currentMode = drawModeRef.current;

    tracker.isOnCanvas = true;
    tracker.rawSx = rawX;
    tracker.rawSy = rawY;
    tracker.snappedSx = snappedX;
    tracker.snappedSy = snappedY;

    if (currentMode === 'hold' && tracker.isDown) {
      // Sample points along movement (distance threshold ~4px for fluid resolution)
      const dist = Math.hypot(rawX - tracker.lastHoldSx, rawY - tracker.lastHoldSy);
      if (dist >= 4) {
        const pt: Point2D = {
          sx: rawX,
          sy: rawY,
          x: rawX - canvasWidth / 2,
          y: rawY - canvasHeight / 2,
        };
        setActiveStroke((prev) => [...prev, pt]);
        tracker.lastHoldSx = rawX;
        tracker.lastHoldSy = rawY;
      }
    } else if (currentMode === 'waiting') {
      const distFromAnchor = Math.hypot(rawX - tracker.anchorRawSx, rawY - tracker.anchorRawSy);
      if (distFromAnchor > 12) {
        tracker.anchorRawSx = rawX;
        tracker.anchorRawSy = rawY;
        tracker.pauseStart = performance.now();
        tracker.hasPlacedCurrentWaiting = false;
      } else if (tracker.pauseStart === null) {
        tracker.pauseStart = performance.now();
      }
    }
  };

  // POINTER UP: finalize active stroke with Catmull-Rom smoothing
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    const tracker = trackerRef.current;
    tracker.isDown = false;

    // In HOLD MODE: releasing mouse completes this independent stroke!
    // It DOES NOT auto-close or connect to previous strokes!
    if (drawModeRef.current === 'hold') {
      const cur = activeStrokeRef.current;
      if (cur.length > 0) {
        // Apply Catmull-Rom path smoothing if enabled
        const finalStroke = smoothCurvesRef.current
          ? smoothStrokeCatmullRom(cur, {
              isClosed: isClosedRef.current,
              stepDist: 6,
              smoothFactor: 1,
              canvasWidth,
              canvasHeight,
            })
          : cur;

        setStrokes((prev) => {
          const next = [...prev, finalStroke];
          setStatusMsg(`✓ Đã lưu nét mượt mà (${next.length} nét). Nhấc tay và vẽ tiếp nét mới!`);
          return next;
        });
        setActiveStroke([]);
      }
    }
  };

  const handlePointerLeave = () => {
    const tracker = trackerRef.current;
    tracker.isOnCanvas = false;
    tracker.isDown = false;
    tracker.pauseStart = null;
    tracker.hasPlacedCurrentWaiting = false;

    // If hold drawing left canvas, commit stroke with smoothing
    if (drawModeRef.current === 'hold') {
      const cur = activeStrokeRef.current;
      if (cur.length > 0) {
        const finalStroke = smoothCurvesRef.current
          ? smoothStrokeCatmullRom(cur, {
              isClosed: isClosedRef.current,
              stepDist: 6,
              smoothFactor: 1,
              canvasWidth,
              canvasHeight,
            })
          : cur;
        setStrokes((prev) => [...prev, finalStroke]);
        setActiveStroke([]);
      }
    }
  };

  // Button to explicitly finish the current stroke and start a new separate stroke
  const handleSplitStroke = () => {
    if (activeStroke.length > 0) {
      const finalStroke = smoothCurves
        ? smoothStrokeCatmullRom(activeStroke, {
            isClosed,
            stepDist: 6,
            canvasWidth,
            canvasHeight,
          })
        : activeStroke;

      setStrokes((prev) => [...prev, finalStroke]);
      setActiveStroke([]);
      setStatusMsg(`✓ Đã chốt nét thành công! Bắt đầu nét vẽ tách rời mới.`);
    } else {
      setStatusMsg('Chưa có nét vẽ dở để tách.');
    }
  };

  // Undo last stroke or active point
  const handleUndo = () => {
    if (activeStroke.length > 0) {
      setActiveStroke([]);
      setStatusMsg('Đã hủy nét đang vẽ dở.');
      return;
    }
    if (strokes.length > 0) {
      setStrokes((prev) => {
        const next = prev.slice(0, -1);
        setStatusMsg(next.length > 0 ? `Đã hoàn tác nét cuối. Còn ${next.length} nét.` : 'Đã xóa hết nét.');
        return next;
      });
    }
  };

  // Clear all
  const handleClear = () => {
    setStrokes([]);
    setActiveStroke([]);
    setWarning(null);
    setStatusMsg('Đã xóa toàn bộ bản vẽ.');
  };

  // Quick Preset Samples (Designed to showcase multiple separate strokes!)
  const handleTemplate = (key: string) => {
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    let newStrokes: Point2D[][] = [];

    if (key === 'mi') {
      // Chữ "mi" với 3 nét tách rời hoàn toàn:
      // Nét 1: Chữ 'm' uốn lượn
      const mPoints: Point2D[] = [
        { sx: cx - 110, sy: cy + 30, x: -110, y: 30 },
        { sx: cx - 110, sy: cy - 20, x: -110, y: -20 },
        { sx: cx - 85, sy: cy - 45, x: -85, y: -45 },
        { sx: cx - 60, sy: cy - 20, x: -60, y: -20 },
        { sx: cx - 60, sy: cy + 30, x: -60, y: 30 },
        { sx: cx - 60, sy: cy - 20, x: -60, y: -20 },
        { sx: cx - 35, sy: cy - 45, x: -35, y: -45 },
        { sx: cx - 10, sy: cy - 20, x: -10, y: -20 },
        { sx: cx - 10, sy: cy + 30, x: -10, y: 30 },
      ];
      // Nét 2: Thân chữ 'i'
      const iStem: Point2D[] = [
        { sx: cx + 30, sy: cy - 20, x: 30, y: -20 },
        { sx: cx + 30, sy: cy + 30, x: 30, y: 30 },
      ];
      // Nét 3: Dấu chấm chữ 'i' (1 điểm tách rời)
      const iDot: Point2D[] = [
        { sx: cx + 30, sy: cy - 42, x: 30, y: -42 },
      ];

      // Smooth template strokes
      const smoothedM = smoothStrokeCatmullRom(mPoints, { stepDist: 5 });
      const smoothedStem = smoothStrokeCatmullRom(iStem, { stepDist: 5 });

      newStrokes = [smoothedM, smoothedStem, iDot];
      setShapeName("Chữ 'mi' 3D (3 nét tách rời)");
      setIsClosed(false);
      setStatusMsg("✓ Đã tạo mẫu chữ 'mi' chuẩn với 3 nét rời (chữ m, thân i, chấm i)!");
    } else if (key === 'smiley') {
      // Mặt cười (4 nét tách rời):
      // Nét 1: Vòng tròn khuôn mặt
      const face: Point2D[] = [];
      const r = 85;
      for (let i = 0; i <= 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        const sx = cx + r * Math.cos(ang);
        const sy = cy + r * Math.sin(ang);
        face.push({ sx, sy, x: sx - cx, y: sy - cy });
      }
      // Nét 2: Mắt trái
      const eyeL: Point2D[] = [
        { sx: cx - 30, sy: cy - 30, x: -30, y: -30 },
        { sx: cx - 30, sy: cy - 15, x: -30, y: -15 },
      ];
      // Nét 3: Mắt phải
      const eyeR: Point2D[] = [
        { sx: cx + 30, sy: cy - 30, x: 30, y: -30 },
        { sx: cx + 30, sy: cy - 15, x: 30, y: -15 },
      ];
      // Nét 4: Miệng cười uốn cong
      const smile: Point2D[] = [];
      for (let i = 0; i <= 10; i++) {
        const ang = Math.PI * 0.2 + (i / 10) * Math.PI * 0.6;
        const sx = cx + 50 * Math.cos(ang);
        const sy = cy + 10 + 40 * Math.sin(ang);
        smile.push({ sx, sy, x: sx - cx, y: sy - cy });
      }

      newStrokes = [
        face,
        smoothStrokeCatmullRom(eyeL, { stepDist: 5 }),
        smoothStrokeCatmullRom(eyeR, { stepDist: 5 }),
        smoothStrokeCatmullRom(smile, { stepDist: 5 }),
      ];
      setShapeName('Mặt Cười 3D (4 nét tách rời)');
      setIsClosed(false);
      setStatusMsg('✓ Đã tạo mẫu Mặt Cười với 4 nét tách rời!');
    } else if (key === 'star') {
      // Ngôi sao khép kín
      const starPts: Point2D[] = [];
      const pts = 5;
      for (let i = 0; i < pts * 2; i++) {
        const r = i % 2 === 0 ? 95 : 45;
        const ang = -Math.PI / 2 + (i * Math.PI) / pts;
        const sx = cx + r * Math.cos(ang);
        const sy = cy + r * Math.sin(ang);
        starPts.push({ sx, sy, x: sx - cx, y: sy - cy });
      }
      newStrokes = [starPts];
      setShapeName('Ngôi Sao 3D (Khép kín)');
      setIsClosed(true);
      setStatusMsg('✓ Đã tạo mẫu Ngôi Sao 3D khép kín.');
    } else if (key === 'heart') {
      // Trái tim khép kín
      const heartPts: Point2D[] = [];
      const pts = 24;
      for (let i = 0; i < pts; i++) {
        const t = (i / pts) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const scale = 5.5;
        const sx = cx + hx * scale;
        const sy = cy + hy * scale;
        heartPts.push({ sx, sy, x: sx - cx, y: sy - cy });
      }
      const smoothedHeart = smoothStrokeCatmullRom(heartPts, { isClosed: true, stepDist: 6 });
      newStrokes = [smoothedHeart];
      setShapeName('Trái Tim 3D (Khép kín)');
      setIsClosed(true);
      setStatusMsg('✓ Đã tạo mẫu Trái Tim 3D khép kín.');
    }

    setStrokes(newStrokes);
    setActiveStroke([]);
    setWarning(null);
  };

  // Convert strokes into 3D wireframe shape and apply
  const handleDone = () => {
    // Collect all valid strokes (both completed and any pending active stroke)
    let allStrokes: Point2D[][] = [...strokes];
    if (activeStroke.length > 0) {
      const smoothedActive = smoothCurves
        ? smoothStrokeCatmullRom(activeStroke, {
            isClosed,
            stepDist: 6,
            canvasWidth,
            canvasHeight,
          })
        : activeStroke;
      allStrokes.push(smoothedActive);
    }

    if (smoothCurves) {
      // Ensure all strokes benefit from Catmull-Rom interpolation before 3D extrusion
      allStrokes = allStrokes.map((stroke) =>
        stroke.length >= 3
          ? smoothStrokeCatmullRom(stroke, {
              isClosed,
              stepDist: 6,
              canvasWidth,
              canvasHeight,
            })
          : stroke
      );
    }

    const totalPts = allStrokes.reduce((acc, s) => acc + s.length, 0);
    if (totalPts === 0) {
      setWarning('Chưa có nét vẽ nào! Hãy vẽ chữ hoặc đường nét trên bảng trước.');
      return;
    }

    const custom3DShape = makeCustomFromStrokes(
      allStrokes,
      depth,
      shapeName.trim() || 'Hình vẽ 3D tự do',
      isClosed
    );

    onApplyShape(custom3DShape);
    onClose();
  };

  // Convert strokes into 4D hyper-prism wireframe and apply
  const handleDone4D = () => {
    let allStrokes: Point2D[][] = [...strokes];
    if (activeStroke.length > 0) {
      const smoothedActive = smoothCurves
        ? smoothStrokeCatmullRom(activeStroke, {
            isClosed,
            stepDist: 6,
            canvasWidth,
            canvasHeight,
          })
        : activeStroke;
      allStrokes.push(smoothedActive);
    }

    if (smoothCurves) {
      allStrokes = allStrokes.map((stroke) =>
        stroke.length >= 3
          ? smoothStrokeCatmullRom(stroke, {
              isClosed,
              stepDist: 6,
              canvasWidth,
              canvasHeight,
            })
          : stroke
      );
    }

    const totalPts = allStrokes.reduce((acc, s) => acc + s.length, 0);
    if (totalPts === 0) {
      setWarning('Chưa có nét vẽ nào! Hãy vẽ chữ hoặc đường nét trên bảng trước.');
      return;
    }

    const custom3DShape = makeCustomFromStrokes(
      allStrokes,
      depth,
      (shapeName.trim() || 'Hình vẽ') + ' (4D)',
      isClosed
    );

    const custom4DShape = extrudeShapeTo4D(custom3DShape);
    onApplyShape(custom4DShape);
    onClose();
  };

  const totalCompletedStrokes = strokes.length + (activeStroke.length > 0 ? 1 : 0);
  const totalPoints = strokes.reduce((acc, s) => acc + s.length, 0) + activeStroke.length;

  if (!isOpen) return null;

  return (
    <div
      id="custom-draw-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="bg-[#0b0e15] border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
        style={{
          boxShadow: `0 0 35px rgba(0,0,0,0.95), 0 0 25px ${theme.glowColor}30`,
          borderColor: `${theme.lineColor}60`,
        }}
      >
        {/* Top neon accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.lineColor}, transparent)`,
          }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-md bg-neutral-900"
              style={{
                borderColor: `${theme.lineColor}70`,
                boxShadow: `0 0 12px ${theme.glowColor}`,
                color: theme.lineColor,
              }}
            >
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Vẽ Chữ & Đường Nét Tự Do 3D</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold"
                  style={{
                    borderColor: `${theme.lineColor}60`,
                    color: theme.lineColor,
                    backgroundColor: `${theme.lineColor}15`,
                  }}
                >
                  CATMULL-ROM & BEZIER SMOOTHING
                </span>
              </h2>
              <p className="text-xs text-neutral-300 font-medium">
                Vẽ chữ cái, nét uốn lượn mượt mà tự nhiên — tự động làm mịn đường cong, không gãy khúc!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 DRAW MODES SELECTOR BAR */}
        <div className="px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-black rounded-xl border border-neutral-800">
            {/* Mode 1: Hold (Default - Freehand with smoothing) */}
            <button
              onClick={() => setDrawMode('hold')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                drawMode === 'hold'
                  ? 'bg-neutral-800 text-white border border-cyan-400 shadow-[0_0_10px_rgba(0,255,204,0.3)]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Hand className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. Hold (Vẽ tự do - Khử răng cưa)</span>
            </button>

            {/* Mode 2: Click */}
            <button
              onClick={() => setDrawMode('click')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                drawMode === 'click'
                  ? 'bg-neutral-800 text-white border border-cyan-400 shadow-[0_0_10px_rgba(0,255,204,0.3)]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Click (Nhấp từng góc)</span>
            </button>

            {/* Mode 3: Waiting */}
            <button
              onClick={() => setDrawMode('waiting')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                drawMode === 'waiting'
                  ? 'bg-neutral-800 text-white border border-cyan-400 shadow-[0_0_10px_rgba(0,255,204,0.3)]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. Waiting (Dừng {waitingSeconds}s chốt điểm)</span>
            </button>
          </div>

          {/* Quick status pill with smoothing badge */}
          <div className="flex items-center gap-2">
            {drawMode === 'hold' && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 font-bold">
                <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                Catmull-Rom: Active
              </span>
            )}
            <div className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-semibold">{statusMsg}</span>
            </div>
          </div>
        </div>

        {/* SETUP BAR FOR WAITING OR CLICK */}
        {drawMode === 'waiting' && (
          <div className="px-4 py-2 bg-[#0c1018] border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="font-bold text-white">Setup thời gian dừng:</span>
              <span className="font-mono font-bold text-cyan-300 text-sm bg-black px-2 py-0.5 rounded border border-neutral-800">
                {waitingSeconds}s
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 5].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setWaitingSeconds(sec)}
                  className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold transition border ${
                    waitingSeconds === sec
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
              <button
                onClick={handleSplitStroke}
                className="ml-2 flex items-center gap-1 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-bold rounded-lg text-xs transition"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Tách nét mới</span>
              </button>
            </div>
          </div>
        )}

        {drawMode === 'click' && (
          <div className="px-4 py-2 bg-[#0c1018] border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="font-bold text-white">Chế độ nhấp điểm:</span>
              <span className="text-neutral-400">Nhấp từng góc để vẽ. Bấm &quot;Tách nét mới&quot; để vẽ chi tiết tách rời.</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white font-medium">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-cyan-400 focus:ring-0 accent-cyan-400 w-3.5 h-3.5"
                />
                <span>Hút lưới (20px)</span>
              </label>
              <button
                onClick={handleSplitStroke}
                disabled={activeStroke.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-bold rounded-lg text-xs transition disabled:opacity-40"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Chốt nét & Vẽ nét mới</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Body */}
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left: Canvas Area */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div
              className="relative rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-black cursor-crosshair"
              style={{
                width: canvasWidth,
                height: canvasHeight,
                maxWidth: '100%',
                aspectRatio: '1/1',
              }}
            >
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                className="w-full h-full block touch-none"
              />
            </div>

            {/* Quick helper note under canvas */}
            <div className="mt-2.5 text-center text-xs text-neutral-300 font-medium flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>
                {drawMode === 'hold'
                  ? 'Nhấn giữ chuột/tay để vẽ. Đường cong được làm mượt tự nhiên theo thuật toán Catmull-Rom & Bezier!'
                  : drawMode === 'click'
                  ? 'Nhấp chuột từng đỉnh. Muốn vẽ nét mới tách rời, bấm nút "Chốt nét & Vẽ nét mới".'
                  : 'Rê chuột đến vị trí cần đặt đỉnh, dừng yên để máy tự chốt điểm.'}
              </span>
            </div>
          </div>

          {/* Right: Controls & Presets */}
          <div className="md:col-span-6 flex flex-col gap-4">
            {/* Shape Name & Depth */}
            <div className="space-y-3 bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800">
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Tên chữ / hình vẽ:
                </label>
                <input
                  type="text"
                  value={shapeName}
                  onChange={(e) => setShapeName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black border border-neutral-700 rounded-lg text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Ví dụ: Chữ mi, Chữ 3D, Hình mặt cười..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <span className="text-white font-bold">Độ sâu đùn 3D (Chiều dày Z):</span>
                  <span className="font-bold text-cyan-300">{depth} px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="140"
                  step="5"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Path Smoothing Option (Catmull-Rom & Bezier Interpolation) */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-white font-medium">
                  <input
                    type="checkbox"
                    checked={smoothCurves}
                    onChange={(e) => setSmoothCurves(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-950 text-cyan-400 focus:ring-0 accent-cyan-400 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>Làm mượt Catmull-Rom & Bezier</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold border border-cyan-500/40">
                      ORGANIC
                    </span>
                  </span>
                </label>
                <span className="text-[11px] text-neutral-400">
                  {smoothCurves ? 'Đang bật (uốn cong mượt)' : 'Tắt (nét góc cạnh thô)'}
                </span>
              </div>

              {/* Loop Closing Option */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-white font-medium">
                  <input
                    type="checkbox"
                    checked={isClosed}
                    onChange={(e) => setIsClosed(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-950 text-cyan-400 focus:ring-0 accent-cyan-400 w-4 h-4"
                  />
                  <span>Khép kín nét (Tạo lăng trụ kín)</span>
                </label>
                <span className="text-[11px] text-neutral-400">
                  {isClosed ? 'Đang bật (đa giác kín)' : 'Tắt (tự nhiên cho chữ viết & hình vẽ)'}
                </span>
              </div>
            </div>

            {/* Quick Multi-Stroke Presets (Specifically includes "Chữ mi" and "Mặt cười") */}
            <div>
              <label className="text-xs font-bold text-white block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mẫu thử nghiệm nét tách rời (Bấm để tải ngay):</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTemplate('mi')}
                  className="flex items-center justify-start gap-2 py-2 px-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/50 hover:border-cyan-400 rounded-xl text-xs font-bold text-white transition active:scale-95"
                >
                  <Type className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-cyan-300 font-bold">Chữ &apos;mi&apos; 3D</div>
                    <div className="text-[10px] text-neutral-400 font-normal">3 nét mượt: m, thân i, chấm i</div>
                  </div>
                </button>

                <button
                  onClick={() => handleTemplate('smiley')}
                  className="flex items-center justify-start gap-2 py-2 px-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-400 rounded-xl text-xs font-bold text-white transition active:scale-95"
                >
                  <Smile className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-white font-bold">Mặt Cười 3D</div>
                    <div className="text-[10px] text-neutral-400 font-normal">4 nét rời: mặt, 2 mắt, miệng</div>
                  </div>
                </button>

                <button
                  onClick={() => handleTemplate('star')}
                  className="flex items-center justify-start gap-2 py-2 px-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-400 rounded-xl text-xs font-bold text-white transition active:scale-95"
                >
                  <span className="text-amber-400 text-sm">★</span>
                  <div className="text-left">
                    <div className="text-white font-bold">Ngôi Sao 3D</div>
                    <div className="text-[10px] text-neutral-400 font-normal">Khối khép kín đối xứng</div>
                  </div>
                </button>

                <button
                  onClick={() => handleTemplate('heart')}
                  className="flex items-center justify-start gap-2 py-2 px-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-400 rounded-xl text-xs font-bold text-white transition active:scale-95"
                >
                  <span className="text-rose-400 text-sm">♥</span>
                  <div className="text-left">
                    <div className="text-white font-bold">Trái Tim 3D</div>
                    <div className="text-[10px] text-neutral-400 font-normal">Đường cong mượt mà kín</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Strokes Information Status Readout */}
            <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 flex-1 min-h-[95px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cấu trúc nét vẽ hiện tại:</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-300 font-bold bg-black px-2 py-0.5 rounded border border-neutral-800 text-[11px]">
                    {totalCompletedStrokes} nét tách rời
                  </span>
                  <span className="font-mono text-neutral-300 text-[11px] bg-neutral-800 px-2 py-0.5 rounded">
                    {totalPoints} điểm
                  </span>
                </div>
              </div>

              {totalCompletedStrokes === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-2 text-neutral-400 text-xs font-medium">
                  <span>Nhấn giữ vẽ tự do — các đường nét sẽ tự động làm mượt bằng Catmull-Rom!</span>
                </div>
              ) : (
                <div className="space-y-1 text-[11px] font-mono text-neutral-300">
                  <div className="text-cyan-400 flex items-center gap-1.5 font-bold">
                    <span>✓ Nét vẽ mượt mà, độc lập, không nối dính thành hình núi.</span>
                  </div>
                  <div className="text-neutral-400">
                    Mỗi nét đùn thành dải ruy băng 3D uốn lượn liên tục (C1 continuity) xoay 360° tự do!
                  </div>
                </div>
              )}
            </div>

            {/* Warning display */}
            {warning && (
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-xs text-amber-200 font-medium">
                {warning}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="border-t border-neutral-800 p-4 flex items-center justify-between gap-3 bg-[#0c1018]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0 && activeStroke.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 hover:text-white transition disabled:opacity-40 disabled:pointer-events-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Hoàn tác nét (Undo)
            </button>
            <button
              onClick={handleClear}
              disabled={strokes.length === 0 && activeStroke.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-rose-950/40 border border-neutral-700 hover:border-rose-500 text-xs font-bold text-rose-300 hover:text-rose-200 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa tất cả
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 hover:text-white font-medium transition"
            >
              Hủy
            </button>
            <button
              id="btn-apply-custom-4d"
              onClick={handleDone4D}
              className="px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-lg active:scale-95 bg-purple-950/80 border border-purple-500/80 text-purple-200 hover:text-white hover:border-purple-300"
              style={{
                boxShadow: '0 0 14px rgba(168, 85, 247, 0.4)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Đùn thành 4D Hyper
            </button>
            <button
              id="btn-apply-custom-shape"
              onClick={handleDone}
              className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg active:scale-95 bg-black border"
              style={{
                borderColor: theme.lineColor,
                color: theme.lineColor,
                boxShadow: `0 0 16px ${theme.glowColor}`,
              }}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Tạo hình 3D ({totalCompletedStrokes} nét)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
