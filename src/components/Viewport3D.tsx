import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ControlState, HyperPlane, Hyper5DPlane, Point3D, RenderSettings, Shape3D } from '../types';
import { projectPoint, rotateX, rotateY, rotateZ } from '../utils/shapes';
import { rotate4D_XW, rotate4D_YW, rotate4D_ZW, project4DTo3D } from '../utils/shapes4D';
import {
  rotate5D_XV,
  rotate5D_YV,
  rotate5D_ZV,
  rotate5D_WV,
  project5DTo4D,
  makeDoublePendulum5D,
} from '../utils/shapes5D';
import {
  stepPendulumRK4,
  pendulumSim,
  randomizePendulum,
  formatDetailedDegree,
  makeDoublePendulum3D,
  makeDoublePendulum4D,
} from '../utils/doublePendulum';
import { MotionTrailEngine } from '../utils/motionTrails';
import { drawWorkshopBackground, renderWoodenFace } from '../utils/woodTexture';
import { cosmicAudio } from '../utils/audioEngine';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  Sparkles,
  Flame,
  Zap,
  AlertTriangle,
  Play,
  Pause,
  Layers,
  Compass,
  Volume2,
  VolumeX,
  Music,
  Orbit,
  Shuffle,
  Box,
} from 'lucide-react';

interface Viewport3DProps {
  shape: Shape3D;
  control: ControlState;
  settings: RenderSettings;
  onResetRotation?: () => void;
  onUpdateSettings?: (settings: Partial<RenderSettings>) => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  shape,
  control,
  settings,
  onResetRotation,
  onUpdateSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Rotation angles in 3D (stored in ref for smooth 60fps animation loop)
  const rotationRef = useRef<{ rx: number; ry: number; rz: number }>({
    rx: 0.3,
    ry: 0.4,
    rz: 0,
  });

  // Rotation angles in 4D Hyperspace (planes XW, YW, ZW)
  const rotation4DRef = useRef<{ xw: number; yw: number; zw: number }>({
    xw: 0,
    yw: 0,
    zw: 0,
  });

  // Rotation angles in 5D Hyperspace (planes XV, YV, ZV, WV)
  const rotation5DRef = useRef<{ xv: number; yv: number; zv: number; wv: number }>({
    xv: 0,
    yv: 0,
    zv: 0,
    wv: 0,
  });

  // Track direct canvas drag
  const isDraggingCanvas = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // FPS tracking
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());

  // Fullscreen toggle
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cosmic Audio Engine integration (Âm thanh vu vơ Lỗ Đen, Chiều 4D & Theme Thiên Long/Thành Tài)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => cosmicAudio.getIsMuted());
  const [audioMode, setAudioMode] = useState<string>(() => cosmicAudio.getCurrentMode());

  useEffect(() => {
    const unsub = cosmicAudio.subscribe(() => {
      setIsAudioMuted(cosmicAudio.getIsMuted());
      setAudioMode(cosmicAudio.getCurrentMode());
    });
    return unsub;
  }, []);

  const handleToggleAudio = () => {
    cosmicAudio.resume();
    const muted = cosmicAudio.toggleMute();
    setIsAudioMuted(muted);
  };

  // Sync cosmic audio mode whenever shape changes
  useEffect(() => {
    const isBlackHole = shape.isBenchmark || shape.id === 'super-point-10000';
    const is4D = !!shape.is4D;
    cosmicAudio.setShapeTarget(isBlackHole, is4D);
  }, [shape.id, shape.isBenchmark, shape.is4D]);

  // Revenge / Stress Test Burner Mode (for 10,000 vertices)
  const [burnerMode, setBurnerMode] = useState<boolean>(false);
  const burnerModeRef = useRef<boolean>(false);
  useEffect(() => {
    burnerModeRef.current = burnerMode;
  }, [burnerMode]);

  // Double Pendulum real-time angle display state
  const isDoublePendulum =
    shape.id === 'double-pendulum-3d' ||
    shape.id === 'double-pendulum-4d' ||
    shape.id === 'double-pendulum-5d';
  const [pendulumAngles, setPendulumAngles] = useState<{
    theta1: string;
    theta2: string;
    phi: string;
    psi4D: string;
    omega5D: string;
    totalDeg: string;
  }>({
    theta1: '090,0000°',
    theta2: '095,7320°',
    phi: '000,0000°',
    psi4D: '000,0000°',
    omega5D: '000,0000°',
    totalDeg: '185,7320°',
  });
  const lastAngleUiUpdateRef = useRef<number>(0);

  // Low FPS streak counter & toast for Auto Anti-Lag
  const lowFpsStreakRef = useRef<number>(0);
  const [showAutoLagToast, setShowAutoLagToast] = useState<boolean>(false);

  // When user selects the 10,000 benchmark shape, start in burner mode unless antiLag is already active
  useEffect(() => {
    if (shape.isBenchmark || shape.id === 'super-point-10000') {
      if (!settings.antiLag) {
        setBurnerMode(true);
        burnerModeRef.current = true;
      } else {
        setBurnerMode(false);
        burnerModeRef.current = false;
      }
    } else {
      setBurnerMode(false);
      burnerModeRef.current = false;
    }
  }, [shape.id, shape.isBenchmark, settings.antiLag]);

  // Motion trail and light streaks engine
  const motionTrailEngineRef = useRef<MotionTrailEngine>(new MotionTrailEngine());

  // Flat scratch memory buffers for 77,777 vertices to avoid 150,000+ GC object allocations/sec
  const flatScratchRef = useRef<{
    projX: Float32Array;
    projY: Float32Array;
    projZ: Float32Array;
    visible: Uint8Array;
    size: number;
  } | null>(null);

  // Handle direct canvas orbit dragging
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    cosmicAudio.resume();
    isDraggingCanvas.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingCanvas.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.ry += dx * 0.008;
    rotationRef.current.rx += dy * 0.008;
  };

  const handleCanvasMouseUp = () => {
    isDraggingCanvas.current = false;
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    cosmicAudio.resume();
    if (e.touches[0]) {
      isDraggingCanvas.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingCanvas.current || !e.touches[0]) return;
    const dx = e.touches[0].clientX - lastMousePos.current.x;
    const dy = e.touches[0].clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    rotationRef.current.ry += dx * 0.008;
    rotationRef.current.rx += dy * 0.008;
  };

  const handleCanvasTouchEnd = () => {
    isDraggingCanvas.current = false;
  };

  const resetRotation = useCallback(() => {
    rotationRef.current = { rx: 0.3, ry: 0.4, rz: 0 };
    if (onResetRotation) onResetRotation();
  }, [onResetRotation]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Main 3D Animation & Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Update FPS counter every 500ms
      frameCountRef.current++;
      if (currentTime - lastFpsUpdateRef.current >= 500) {
        const measuredFps = Math.round((frameCountRef.current * 1000) / (currentTime - lastFpsUpdateRef.current));
        setFps(measuredFps);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = currentTime;

        // Auto Anti-Lag: If FPS drops below 32 for 3 consecutive intervals (1.5s), auto-activate Anti-Lag
        if (settings.autoAntiLag && !settings.antiLag && measuredFps > 0 && measuredFps < 32) {
          lowFpsStreakRef.current++;
          if (lowFpsStreakRef.current >= 3) {
            onUpdateSettings?.({ antiLag: true, disableGlow: true, capDpr: true });
            setShowAutoLagToast(true);
            setTimeout(() => setShowAutoLagToast(false), 4000);
            lowFpsStreakRef.current = 0;
          }
        } else {
          lowFpsStreakRef.current = 0;
        }
      }

      // 1. Update rotation based on Joystick (User formula: speedFactor = control.speed / 50)
      if (control.speed > 0) {
        const speedFactor = control.speed / 50;
        rotationRef.current.rx += Math.sin(control.angle) * speedFactor * delta;
        rotationRef.current.ry += Math.cos(control.angle) * speedFactor * delta;
      } else if (settings.autoSpin && !isDraggingCanvas.current) {
        // Default gentle ambient rotation when joystick is at rest
        rotationRef.current.ry += 0.5 * delta;
        rotationRef.current.rx += 0.25 * delta;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Handle DPI and canvas sizing with Anti-Lag optimization
      // If antiLag or capDpr is active, lock DPR to 1.0 (saving 75% fill-rate on Retina/4K displays)
      const isAntiLag = !!settings.antiLag;
      const disableGlow = !!settings.disableGlow || isAntiLag;
      const nativeDpr = window.devicePixelRatio || 1;
      const dpr = isAntiLag || settings.capDpr ? 1.0 : Math.min(nativeDpr, 2.0);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background clearing: Wooden Workshop Atmosphere vs Cyber Void Space
      if (settings.aestheticMode === 'wooden') {
        drawWorkshopBackground(ctx, width, height, settings);
      } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Subtle atmospheric neon grid in the background
        if (settings.showCoordinates) {
          drawAtmosphericGrid(ctx, width, height, rotationRef.current, settings);
        }
      }

      // Step Double Pendulum Physics continuously if active
      let activeShape = shape;
      if (isDoublePendulum) {
        // Tích phân chuyển động con lắc kép Runge-Kutta 4
        stepPendulumRK4(pendulumSim, Math.min(delta, 0.05));

        // Cập nhật lại hình khối con lắc thời gian thực
        if (shape.id === 'double-pendulum-5d') {
          activeShape = makeDoublePendulum5D(
            pendulumSim.theta1,
            pendulumSim.theta2,
            pendulumSim.phi,
            pendulumSim.psi4D,
            pendulumSim.omega5D
          );
        } else if (shape.id === 'double-pendulum-4d') {
          activeShape = makeDoublePendulum4D();
        } else {
          activeShape = makeDoublePendulum3D();
        }

        // Cập nhật UI góc xoay chi tiết độ 000,0000 định kỳ (mỗi 60ms để giao diện mượt mà)
        if (currentTime - lastAngleUiUpdateRef.current >= 60) {
          const t1Deg = formatDetailedDegree(pendulumSim.theta1);
          const t2Deg = formatDetailedDegree(pendulumSim.theta2);
          const phiDeg = formatDetailedDegree(pendulumSim.phi);
          const psiDeg = formatDetailedDegree(pendulumSim.psi4D);
          const o5Deg = formatDetailedDegree(pendulumSim.omega5D);
          const totalAngle = pendulumSim.theta1 + pendulumSim.theta2;
          const totalDeg = formatDetailedDegree(totalAngle);
          setPendulumAngles({
            theta1: t1Deg,
            theta2: t2Deg,
            phi: phiDeg,
            psi4D: psiDeg,
            omega5D: o5Deg,
            totalDeg,
          });
          lastAngleUiUpdateRef.current = currentTime;
        }
      }

      // 2. Transform Vertices: Rotate X -> Rotate Y -> Rotate Z
      const rx = rotationRef.current.rx;
      const ry = rotationRef.current.ry;
      const rz = rotationRef.current.rz;
      const numVertices = activeShape.vertices.length;
      const isMega = numVertices > 5000;

      if (isMega) {
        // =========================================================================
        // MEGA-MESH ENGINE (77,777+ Vertices)
        // Zero-allocation flat Float32 buffers for extreme throughput
        // =========================================================================
        if (!flatScratchRef.current || flatScratchRef.current.size < numVertices) {
          flatScratchRef.current = {
            projX: new Float32Array(numVertices),
            projY: new Float32Array(numVertices),
            projZ: new Float32Array(numVertices),
            visible: new Uint8Array(numVertices),
            size: numVertices,
          };
        }

        const { projX, projY, projZ, visible } = flatScratchRef.current;
        const cosX = Math.cos(rx), sinX = Math.sin(rx);
        const cosY = Math.cos(ry), sinY = Math.sin(ry);
        const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
        const fov = settings.fov;
        const scale = settings.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        for (let i = 0; i < numVertices; i++) {
          const v = shape.vertices[i];
          // 1. Rotate X
          const y1 = v.y * cosX - v.z * sinX;
          const z1 = v.y * sinX + v.z * cosX;
          // 2. Rotate Y
          const x2 = v.x * cosY + z1 * sinY;
          const z2 = -v.x * sinY + z1 * cosY;
          // 3. Rotate Z
          const x3 = rz !== 0 ? x2 * cosZ - y1 * sinZ : x2;
          const y3 = rz !== 0 ? x2 * sinZ + y1 * cosZ : y1;

          // Perspective Project
          const effZ = z2 * scale;
          const denom = fov + effZ;
          if (denom > 10) {
            const sf = fov / denom;
            projX[i] = x3 * scale * sf + centerX;
            projY[i] = y3 * scale * sf + centerY;
            projZ[i] = effZ;
            visible[i] = 1;
          } else {
            visible[i] = 0;
          }
        }

        // Draw Edges for Mega Mesh (Constellation lines)
        if (settings.showEdges && shape.edges.length > 0) {
          ctx.strokeStyle = settings.theme.lineColor;
          ctx.lineWidth = Math.max(1, settings.lineWidth);
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          for (let e = 0; e < shape.edges.length; e++) {
            const [a, b] = shape.edges[e];
            if (visible[a] && visible[b]) {
              ctx.moveTo(projX[a], projY[a]);
              ctx.lineTo(projX[b], projY[b]);
            }
          }
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Draw Vertices for Mega Mesh (10,000 Points)
        if (settings.showVertices) {
          const isBurner = burnerModeRef.current && !isAntiLag;
          if (isBurner) {
            // 🔥 CHẾ ĐỘ THIÊU ĐỐT (BURNER / LAG THẬT - TRẢ THÙ LŨ BẠN)
            // Intentionally uses heavy canvas state changes, individual path allocations,
            // and glow blur on points to stress the CPU/GPU when toggled on!
            ctx.fillStyle = settings.theme.lineColor;
            ctx.shadowColor = settings.theme.lineColor;
            ctx.shadowBlur = 10;
            const burnLimit = Math.min(numVertices, 10000);
            for (let i = 0; i < burnLimit; i++) {
              if (visible[i]) {
                ctx.beginPath();
                ctx.arc(projX[i], projY[i], 1.8, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            ctx.shadowBlur = 0;
          } else {
            // ⚡ CHẾ ĐỘ SIÊU TỐC (TURBO 60 FPS - TỐI ƯU CỰC HẠN)
            // Dual-pass Skia-batched starlight dots with zero GC overhead
            // Apply LOD Density for weak devices
            const density = Math.max(0.25, Math.min(1.0, settings.lodDensity ?? 1.0));
            const step = density <= 0.25 ? 4 : density <= 0.5 ? 2 : 1;

            // Pass 1: Background starlight dust (far/mid depth)
            ctx.fillStyle = settings.theme.lineColor;
            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            for (let i = 0; i < numVertices; i += 2 * step) {
              if (visible[i]) {
                const px = projX[i];
                const py = projY[i];
                if (px >= 0 && px <= width && py >= 0 && py <= height) {
                  ctx.rect(px, py, 1.2, 1.2);
                }
              }
            }
            ctx.fill();

            // Pass 2: Foreground brilliant galaxy stars (near depth, glowing white/accent)
            ctx.fillStyle = settings.theme.vertexColor;
            ctx.globalAlpha = 0.92;
            ctx.beginPath();
            for (let i = 1; i < numVertices; i += 2 * step) {
              if (visible[i]) {
                const px = projX[i];
                const py = projY[i];
                if (px >= 0 && px <= width && py >= 0 && py <= height) {
                  ctx.rect(px, py, 1.5, 1.5);
                }
              }
            }
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Celestial Anchor Rings (major hubs)
            const majorSet = shape.majorVertices || [];
            if (majorSet.length > 0) {
              ctx.strokeStyle = settings.theme.lineColor;
              ctx.lineWidth = 1.5;
              if (!disableGlow) {
                ctx.shadowColor = settings.theme.lineColor;
                ctx.shadowBlur = 10;
              }
              for (let m = 0; m < majorSet.length; m++) {
                const idx = majorSet[m];
                if (visible[idx]) {
                  ctx.beginPath();
                  ctx.arc(projX[idx], projY[idx], 6.5, 0, Math.PI * 2);
                  ctx.stroke();
                }
              }
              ctx.shadowBlur = 0;
            }
          }
        }

        // Draw Central Supermassive Black Hole (Lỗ Đen Khổng Lồ ở Tâm Thiên Hà)
        drawBlackHole(
          ctx,
          width / 2,
          height / 2,
          rx,
          ry,
          burnerModeRef.current && !isAntiLag,
          settings.theme.lineColor,
          disableGlow
        );
      } else if (activeShape.is5D && activeShape.vertices5D && activeShape.vertices5D.length > 0) {
        // =========================================================================
        // 5D HYPERSPACE ENGINE (Penteract, 5-Simplex, 5-Orthoplex, Double Pendulum 5D...)
        // =========================================================================
        const h5Speed = settings.hyper5DSpeed ?? 1.0;
        const h5Delta = delta * h5Speed;
        if (settings.autoHyper5DSpin) {
          if (settings.hyper5DPlane === 'XV') {
            rotation5DRef.current.xv += 0.85 * h5Delta;
          } else if (settings.hyper5DPlane === 'YV') {
            rotation5DRef.current.yv += 0.85 * h5Delta;
          } else if (settings.hyper5DPlane === 'ZV') {
            rotation5DRef.current.zv += 0.85 * h5Delta;
          } else if (settings.hyper5DPlane === 'WV') {
            rotation5DRef.current.wv += 0.85 * h5Delta;
          } else {
            // ALL_5D
            rotation5DRef.current.xv += 0.55 * h5Delta;
            rotation5DRef.current.wv += 0.75 * h5Delta;
            rotation5DRef.current.yv += 0.45 * h5Delta;
          }
        }

        const r5 = rotation5DRef.current;
        const dv = settings.hyper5DDistance ?? 2.5;
        const dw = settings.hyperDistance ?? 2.2;

        // 1. Rotate in 5D Hyperspace
        const rotated5D = activeShape.vertices5D.map((p5) => {
          let curr = p5;
          if (r5.xv !== 0) curr = rotate5D_XV(curr, r5.xv);
          if (r5.yv !== 0) curr = rotate5D_YV(curr, r5.yv);
          if (r5.zv !== 0) curr = rotate5D_ZV(curr, r5.zv);
          if (r5.wv !== 0) curr = rotate5D_WV(curr, r5.wv);
          return curr;
        });

        // 2. Project 5D to 4D
        const projected4DFrom5D = rotated5D.map((p5) => {
          const res = project5DTo4D(p5, dv, 95);
          return { ...res, vDepth: p5.v };
        });

        // 3. Project 4D to 3D
        const projected3D = projected4DFrom5D.map((item) => {
          const res = project4DTo3D(item.p4d, dw, 95, 0);
          return {
            p3d: res.p3d,
            wDepth: res.wDepth,
            vDepth: item.vDepth,
            visible: res.visible && item.visible,
          };
        });

        // 4. Rotate in 3D (Joystick / Mouse drag)
        const rotated3D = projected3D.map((item) => {
          let p = rotateX(item.p3d, rx);
          p = rotateY(p, ry);
          if (rz !== 0) p = rotateZ(p, rz);
          return { p, wDepth: item.wDepth, vDepth: item.vDepth, visible5D: item.visible };
        });

        // 5. Project 3D to 2D Screen Coordinates
        const projected2D = rotated3D.map((item) => {
          const proj = projectPoint(item.p, width, height, settings.fov, settings.scale);
          return {
            ...proj,
            wDepth: item.wDepth,
            vDepth: item.vDepth,
            visible: proj.visible && item.visible5D,
          };
        });

        // Motion Trails & Light Streaks in 5D
        if (settings.motionTrail) {
          motionTrailEngineRef.current.addSnapshot({
            shapeId: activeShape.id,
            points: projected2D.map((p) => ({ x: p.x, y: p.y, visible: p.visible, wDepth: p.wDepth })),
            edges: activeShape.edges,
            majorVertices: activeShape.majorVertices,
            timestamp: currentTime,
          }, settings.trailLength || 20);

          motionTrailEngineRef.current.renderTrails(ctx, settings, width, height, disableGlow);
        }

        // Draw 5D Hyperspace Edges
        if (settings.showEdges) {
          ctx.lineWidth = settings.lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          const isWooden = settings.aestheticMode === 'wooden';
          if (isWooden) {
            ctx.strokeStyle = '#d97706';
            ctx.beginPath();
            for (let i = 0; i < activeShape.edges.length; i++) {
              const [a, b] = activeShape.edges[i];
              const pa = projected2D[a];
              const pb = projected2D[b];
              if (pa && pb && pa.visible && pb.visible) {
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
              }
            }
            ctx.stroke();
          } else {
            // 5D Spectrum Coloring by V-Depth
            ctx.strokeStyle = '#10b981'; // Emerald (V >= 0)
            ctx.beginPath();
            for (let i = 0; i < activeShape.edges.length; i++) {
              const [a, b] = activeShape.edges[i];
              const pa = projected2D[a];
              const pb = projected2D[b];
              if (!pa || !pb || !pa.visible || !pb.visible) continue;
              if ((pa.vDepth + pb.vDepth) / 2 >= 0) {
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
              }
            }
            ctx.stroke();

            ctx.strokeStyle = '#06b6d4'; // Cyan (V < 0)
            ctx.beginPath();
            for (let i = 0; i < activeShape.edges.length; i++) {
              const [a, b] = activeShape.edges[i];
              const pa = projected2D[a];
              const pb = projected2D[b];
              if (!pa || !pb || !pa.visible || !pb.visible) continue;
              if ((pa.vDepth + pb.vDepth) / 2 < 0) {
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
              }
            }
            ctx.stroke();
          }
        }

        // Draw 5D Vertices
        if (settings.showVertices) {
          const vRadius = Math.max(2, settings.vertexRadius * 0.9);
          ctx.fillStyle = settings.aestheticMode === 'wooden' ? '#f59e0b' : '#34d399';
          ctx.beginPath();
          for (let i = 0; i < projected2D.length; i++) {
            const p = projected2D[i];
            if (p && p.visible) {
              ctx.moveTo(p.x + vRadius, p.y);
              ctx.arc(p.x, p.y, vRadius, 0, Math.PI * 2);
            }
          }
          ctx.fill();
        }
      } else if (activeShape.is4D && activeShape.vertices4D && activeShape.vertices4D.length > 0) {
        // =========================================================================
        // 4D HYPERSPACE ENGINE (Tesseract, 24-Cell, 16-Cell, Clifford Torus, Double Pendulum 4D...)
        // =========================================================================
        const hSpeed = settings.hyperSpeed ?? 1.0;
        const hDelta = delta * hSpeed;
        if (settings.autoHyperSpin) {
          if (settings.hyperPlane === 'XW') {
            rotation4DRef.current.xw += 0.85 * hDelta;
          } else if (settings.hyperPlane === 'YW') {
            rotation4DRef.current.yw += 0.85 * hDelta;
          } else if (settings.hyperPlane === 'ZW') {
            rotation4DRef.current.zw += 0.85 * hDelta;
          } else if (settings.hyperPlane === 'DOUBLE_CLIFFORD') {
            rotation4DRef.current.xw += 0.75 * hDelta;
            rotation4DRef.current.yw += 0.75 * hDelta;
          } else {
            rotation4DRef.current.xw += 0.65 * hDelta;
            rotation4DRef.current.yw += 0.45 * hDelta;
            rotation4DRef.current.zw += 0.35 * hDelta;
          }
        }

        const r4 = rotation4DRef.current;
        const dw = settings.hyperDistance ?? 2.2;
        const sliceW = settings.hyperSliceW ?? 0;

        // 1. Rotate in 4D & Project 4D to 3D
        const projected4D = activeShape.vertices4D.map((v4) => {
          let curr = v4;
          if (r4.xw !== 0) curr = rotate4D_XW(curr, r4.xw);
          if (r4.yw !== 0) curr = rotate4D_YW(curr, r4.yw);
          if (r4.zw !== 0) curr = rotate4D_ZW(curr, r4.zw);
          return project4DTo3D(curr, dw, 95, sliceW);
        });

        // 2. Rotate in 3D (Joystick / Mouse drag)
        const rotated3D = projected4D.map((item) => {
          let p = rotateX(item.p3d, rx);
          p = rotateY(p, ry);
          if (rz !== 0) p = rotateZ(p, rz);
          return { p, wDepth: item.wDepth, visible4D: item.visible };
        });

        // 3. Project 3D to 2D Screen
        const projected2D = rotated3D.map((item) => {
          const proj = projectPoint(item.p, width, height, settings.fov, settings.scale);
          return {
            ...proj,
            wDepth: item.wDepth,
            visible: proj.visible && item.visible4D,
          };
        });

        // Motion Trails & Light Streaks in 4D Hyperspace
        if (settings.motionTrail) {
          motionTrailEngineRef.current.addSnapshot({
            shapeId: activeShape.id,
            points: projected2D.map((p) => ({ x: p.x, y: p.y, visible: p.visible, wDepth: p.wDepth })),
            edges: activeShape.edges,
            majorVertices: activeShape.majorVertices,
            timestamp: currentTime,
          }, settings.trailLength || 20);

          motionTrailEngineRef.current.renderTrails(ctx, settings, width, height, disableGlow);
        }

        // 4. Draw 4D Hyperspace Edges
        if (settings.showEdges) {
          ctx.lineWidth = settings.lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          if (isAntiLag || disableGlow) {
            // 🚀 ULTRA FAST BATCHED 4D EDGES (Zero per-edge save/restore/stroke/shadow overhead!)
            if (settings.hyperColorW) {
              // Path 1: Positive W (Pink / Crimson)
              ctx.strokeStyle = '#f43f5e';
              ctx.beginPath();
              for (let i = 0; i < activeShape.edges.length; i++) {
                const [a, b] = activeShape.edges[i];
                const pa = projected2D[a];
                const pb = projected2D[b];
                if (!pa || !pb || !pa.visible || !pb.visible) continue;
                if ((pa.wDepth + pb.wDepth) / 2 > 0.15) {
                  ctx.moveTo(pa.x, pa.y);
                  ctx.lineTo(pb.x, pb.y);
                }
              }
              ctx.stroke();

              // Path 2: Negative W (Teal / Cyan)
              ctx.strokeStyle = '#00ffcc';
              ctx.beginPath();
              for (let i = 0; i < activeShape.edges.length; i++) {
                const [a, b] = activeShape.edges[i];
                const pa = projected2D[a];
                const pb = projected2D[b];
                if (!pa || !pb || !pa.visible || !pb.visible) continue;
                if ((pa.wDepth + pb.wDepth) / 2 < -0.15) {
                  ctx.moveTo(pa.x, pa.y);
                  ctx.lineTo(pb.x, pb.y);
                }
              }
              ctx.stroke();

              // Path 3: Neutral W (Purple)
              ctx.strokeStyle = '#c084fc';
              ctx.beginPath();
              for (let i = 0; i < activeShape.edges.length; i++) {
                const [a, b] = activeShape.edges[i];
                const pa = projected2D[a];
                const pb = projected2D[b];
                if (!pa || !pb || !pa.visible || !pb.visible) continue;
                const avgW = (pa.wDepth + pb.wDepth) / 2;
                if (avgW >= -0.15 && avgW <= 0.15) {
                  ctx.moveTo(pa.x, pa.y);
                  ctx.lineTo(pb.x, pb.y);
                }
              }
              ctx.stroke();
            } else {
              ctx.strokeStyle = settings.theme.lineColor;
              ctx.beginPath();
              for (let i = 0; i < activeShape.edges.length; i++) {
                const [a, b] = activeShape.edges[i];
                const pa = projected2D[a];
                const pb = projected2D[b];
                if (!pa || !pb || !pa.visible || !pb.visible) continue;
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
              }
              ctx.stroke();
            }
          } else {
            for (let i = 0; i < activeShape.edges.length; i++) {
              const [a, b] = activeShape.edges[i];
              const pa = projected2D[a];
              const pb = projected2D[b];
              if (!pa || !pb || !pa.visible || !pb.visible) continue;

              const avgW = (pa.wDepth + pb.wDepth) / 2;
              const avgZ = (pa.z + pb.z) / 2;
              let alpha = 1.0;
              if (settings.showDepthDimming) {
                alpha = Math.max(0.35, Math.min(1.0, 1 - avgZ / (settings.fov * 1.5)));
              }

              ctx.save();
              ctx.globalAlpha = alpha;

              if (settings.hyperColorW) {
                if (avgW > 0.15) {
                  ctx.strokeStyle = '#f43f5e';
                  ctx.shadowColor = '#f43f5e';
                  ctx.shadowBlur = 10;
                } else if (avgW < -0.15) {
                  ctx.strokeStyle = '#00ffcc';
                  ctx.shadowColor = '#00ffcc';
                  ctx.shadowBlur = 10;
                } else {
                  ctx.strokeStyle = '#c084fc';
                  ctx.shadowColor = '#c084fc';
                  ctx.shadowBlur = 8;
                }
              } else {
                ctx.strokeStyle = settings.theme.lineColor;
                ctx.shadowColor = settings.theme.lineColor;
                ctx.shadowBlur = 10;
              }

              ctx.beginPath();
              ctx.moveTo(pa.x, pa.y);
              ctx.lineTo(pb.x, pb.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // 5. Draw 4D Vertices
        if (settings.showVertices) {
          if (isAntiLag || disableGlow) {
            // 🚀 ULTRA FAST BATCHED 4D VERTICES (2 fill calls total, 0 shadowBlur)
            const pointR = Math.max(2, settings.vertexRadius * 0.9);
            // Positive W
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            for (let i = 0; i < projected2D.length; i++) {
              const p = projected2D[i];
              if (p && p.visible && p.wDepth > 0) {
                ctx.moveTo(p.x + pointR, p.y);
                ctx.arc(p.x, p.y, pointR, 0, Math.PI * 2);
              }
            }
            ctx.fill();

            // Negative W
            ctx.fillStyle = '#00ffcc';
            ctx.beginPath();
            for (let i = 0; i < projected2D.length; i++) {
              const p = projected2D[i];
              if (p && p.visible && p.wDepth <= 0) {
                ctx.moveTo(p.x + pointR, p.y);
                ctx.arc(p.x, p.y, pointR, 0, Math.PI * 2);
              }
            }
            ctx.fill();

            // Inner white dots
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            for (let i = 0; i < projected2D.length; i++) {
              const p = projected2D[i];
              if (p && p.visible) {
                ctx.moveTo(p.x + pointR * 0.5, p.y);
                ctx.arc(p.x, p.y, pointR * 0.5, 0, Math.PI * 2);
              }
            }
            ctx.fill();
          } else {
            for (let i = 0; i < projected2D.length; i++) {
              const p = projected2D[i];
              if (!p.visible) continue;

              const pointRadius = Math.max(2.5, settings.vertexRadius * Math.min(1.6, Math.max(0.6, p.scaleFactor)));
              const isPositiveW = p.wDepth > 0;

              ctx.save();
              ctx.shadowBlur = 12;
              ctx.shadowColor = isPositiveW ? '#ec4899' : '#06b6d4';
              ctx.fillStyle = isPositiveW ? '#f43f5e' : '#00ffcc';

              ctx.beginPath();
              ctx.arc(p.x, p.y, pointRadius + 1.2, 0, Math.PI * 2);
              ctx.fill();

              ctx.shadowBlur = 0;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(p.x, p.y, pointRadius * 0.7, 0, Math.PI * 2);
              ctx.fill();

              // Luminous 4D orbital halo ring around vertices
              ctx.strokeStyle = isPositiveW ? 'rgba(244, 63, 94, 0.7)' : 'rgba(0, 255, 204, 0.7)';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.arc(p.x, p.y, pointRadius * 2.2, 0, Math.PI * 2);
              ctx.stroke();

              ctx.restore();
            }
          }
        }
      } else {
        // =========================================================================
        // STANDARD MESH ENGINE (Cube, Pyramid, Torus, Quantum Plexus...)
        // =========================================================================
        const rotatedVertices = activeShape.vertices.map((v) => {
          let p = rotateX(v, rx);
          p = rotateY(p, ry);
          if (rz !== 0) p = rotateZ(p, rz);
          return p;
        });

        // 3. Project 3D points to 2D screen coordinates
        const projected = rotatedVertices.map((v) =>
          projectPoint(v, width, height, settings.fov, settings.scale)
        );

        // Motion Trails & Light Streaks
        if (settings.motionTrail) {
          motionTrailEngineRef.current.addSnapshot({
            shapeId: activeShape.id,
            points: projected.map((p) => ({ x: p.x, y: p.y, visible: p.visible, z: p.z })),
            edges: activeShape.edges,
            majorVertices: activeShape.majorVertices,
            timestamp: currentTime,
          }, settings.trailLength || 20);

          motionTrailEngineRef.current.renderTrails(ctx, settings, width, height, disableGlow);
        }

        // =========================================================================
        // SOLID WOODEN TEXTURE SURFACE MAPPING
        // Map realistic oak wood grain onto wireframe faces with 3D directional lighting
        // =========================================================================
        if (settings.aestheticMode === 'wooden' && activeShape.faces && activeShape.faces.length > 0) {
          // Sort faces from back to front (Painter's algorithm by average Z)
          const sortedFaces = activeShape.faces
            .map((fIndices) => {
              let sumZ = 0;
              for (let i = 0; i < fIndices.length; i++) {
                sumZ += rotatedVertices[fIndices[i]].z;
              }
              const avgZ = sumZ / fIndices.length;
              return { fIndices, avgZ };
            })
            .sort((a, b) => b.avgZ - a.avgZ);

          for (let fi = 0; fi < sortedFaces.length; fi++) {
            const { fIndices } = sortedFaces[fi];
            const face2D = fIndices.map((idx) => projected[idx]);
            const face3D = fIndices.map((idx) => rotatedVertices[idx]);
            renderWoodenFace(ctx, face2D, face3D, settings);
          }
        }

        const meshLineColor = settings.aestheticMode === 'wooden' ? '#854d0e' : settings.theme.lineColor;

        // 4. Draw Edges
        if (settings.showEdges) {
          ctx.lineWidth = settings.lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          if (isAntiLag || disableGlow) {
            // 🚀 BATCHED FAST 3D EDGES (Single beginPath/stroke call!)
            ctx.strokeStyle = meshLineColor;
            ctx.beginPath();
            for (let i = 0; i < activeShape.edges.length; i++) {
              const [a, b] = activeShape.edges[i];
              const pa = projected[a];
              const pb = projected[b];
              if (pa && pb && pa.visible && pb.visible) {
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
              }
            }
            ctx.stroke();
          } else if (activeShape.edges.length > 70) {
            const bFar: { pa: (typeof projected)[0]; pb: (typeof projected)[0] }[] = [];
            const bMid: { pa: (typeof projected)[0]; pb: (typeof projected)[0] }[] = [];
            const bNear: { pa: (typeof projected)[0]; pb: (typeof projected)[0] }[] = [];

            for (let i = 0; i < activeShape.edges.length; i++) {
              const [a, b] = activeShape.edges[i];
              const pa = projected[a];
              const pb = projected[b];
              if (!pa.visible || !pb.visible) continue;
              const avgZ = (pa.z + pb.z) / 2;
              if (avgZ < -25) {
                bFar.push({ pa, pb });
              } else if (avgZ > 35) {
                bNear.push({ pa, pb });
              } else {
                bMid.push({ pa, pb });
              }
            }

            const buckets = [
              { list: bFar, alpha: 0.45 },
              { list: bMid, alpha: 0.75 },
              { list: bNear, alpha: 1.0 },
            ];

            // Pass 1: Subtle Neon Bloom Layer (Warm amber bevel in wooden mode)
            const isWooden = settings.aestheticMode === 'wooden';
            ctx.strokeStyle = isWooden ? '#92400e' : settings.theme.lineColor;
            ctx.shadowColor = isWooden ? '#d97706' : settings.theme.lineColor;
            ctx.shadowBlur = isWooden ? 3 : 8;
            ctx.lineWidth = Math.max(1, settings.lineWidth);
            ctx.globalAlpha = isWooden ? 0.8 : 0.55;
            ctx.beginPath();
            for (let b = 0; b < 3; b++) {
              const { list } = buckets[b];
              for (let i = 0; i < list.length; i++) {
                ctx.moveTo(list[i].pa.x, list[i].pa.y);
                ctx.lineTo(list[i].pb.x, list[i].pb.y);
              }
            }
            ctx.stroke();

            // Pass 2: Crisp Depth-dimmed Core Lines
            ctx.shadowBlur = 0;
            ctx.strokeStyle = isWooden ? '#78350f' : settings.theme.lineColor;
            for (let b = 0; b < 3; b++) {
              const { list, alpha } = buckets[b];
              if (list.length === 0) continue;
              ctx.globalAlpha = settings.showDepthDimming ? alpha : 1.0;
              ctx.beginPath();
              for (let i = 0; i < list.length; i++) {
                ctx.moveTo(list[i].pa.x, list[i].pa.y);
                ctx.lineTo(list[i].pb.x, list[i].pb.y);
              }
              ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
          } else {
            const isWooden = settings.aestheticMode === 'wooden';
            const edgesWithDepth = activeShape.edges.map(([a, b]) => {
              const pa = projected[a];
              const pb = projected[b];
              const avgZ = (pa.z + pb.z) / 2;
              return { a, b, pa, pb, avgZ };
            });

            if (settings.showDepthDimming) {
              edgesWithDepth.sort((e1, e2) => e2.avgZ - e1.avgZ);
            }

            for (const edge of edgesWithDepth) {
              const { pa, pb, avgZ } = edge;
              if (!pa.visible || !pb.visible) continue;

              let alpha = 1;
              if (settings.showDepthDimming) {
                const zFactor = Math.max(0.35, Math.min(1, 1 - avgZ / (settings.fov * 1.5)));
                alpha = zFactor;
              }

              ctx.strokeStyle = isWooden ? '#78350f' : settings.theme.lineColor;
              ctx.shadowColor = isWooden ? '#d97706' : settings.theme.lineColor;
              ctx.shadowBlur = isWooden ? 2 : 14;
              ctx.globalAlpha = alpha;

              ctx.beginPath();
              ctx.moveTo(pa.x, pa.y);
              ctx.lineTo(pb.x, pb.y);
              ctx.stroke();
            }
          }
        }

        // Reset shadow for vertices
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        // 5. Draw Vertices (spheres / points & circled celestial rings)
        if (settings.showVertices) {
          if (isAntiLag || disableGlow) {
            // 🚀 BATCHED FAST 3D VERTICES (2 fill calls total, zero shadowBlur)
            const pointRadius = Math.max(2, settings.vertexRadius * 0.9);
            ctx.fillStyle = settings.theme.lineColor;
            ctx.beginPath();
            for (let i = 0; i < projected.length; i++) {
              const p = projected[i];
              if (p && p.visible) {
                ctx.moveTo(p.x + pointRadius, p.y);
                ctx.arc(p.x, p.y, pointRadius, 0, Math.PI * 2);
              }
            }
            ctx.fill();

            ctx.fillStyle = settings.theme.vertexColor;
            ctx.beginPath();
            for (let i = 0; i < projected.length; i++) {
              const p = projected[i];
              if (p && p.visible) {
                ctx.moveTo(p.x + pointRadius * 0.6, p.y);
                ctx.arc(p.x, p.y, pointRadius * 0.6, 0, Math.PI * 2);
              }
            }
            ctx.fill();
          } else {
            const majorSet = new Set(activeShape.majorVertices || []);

            for (let i = 0; i < projected.length; i++) {
              const p = projected[i];
              if (!p.visible) continue;

              const pointRadius = Math.max(2, settings.vertexRadius * Math.min(1.6, Math.max(0.6, p.scaleFactor)));
              const isMajor = majorSet.has(i);

              const isWooden = settings.aestheticMode === 'wooden';
              const vRimColor = isWooden ? '#d97706' : settings.theme.lineColor;
              const vCenterColor = isWooden ? '#fef08a' : settings.theme.vertexColor;

              if (isMajor) {
                const ringR = pointRadius * 2.4;
                ctx.strokeStyle = vRimColor;
                ctx.shadowColor = vRimColor;
                ctx.shadowBlur = isWooden ? 4 : 12;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.fillStyle = vCenterColor;
                ctx.beginPath();
                ctx.arc(p.x, p.y, pointRadius * 0.9, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.shadowColor = vRimColor;
                ctx.shadowBlur = isWooden ? 2 : 8;
                ctx.fillStyle = vRimColor;
                ctx.beginPath();
                ctx.arc(p.x, p.y, pointRadius + 1.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.fillStyle = vCenterColor;
                ctx.beginPath();
                ctx.arc(p.x, p.y, pointRadius, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }
      }

      // 6. Draw 3D Coordinate Axis Gizmo in bottom-right corner (unobstructed)
      if (settings.showCoordinates) {
        drawGizmo(ctx, width - 54, height - 54, rx, ry, rz, shape.is4D, rotation4DRef.current);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [shape, control, settings]);

  return (
    <div
      ref={containerRef}
      id="viewport-container"
      style={{
        boxShadow: burnerMode
          ? '0 0 45px rgba(239,68,68,0.7), inset 0 0 35px rgba(239,68,68,0.25)'
          : `0 0 35px rgba(0,0,0,0.95), 0 0 20px ${settings.theme.glowColor}15`,
        borderColor: burnerMode ? '#ef4444' : `${settings.theme.lineColor}25`,
      }}
      className="relative w-full h-full min-h-[440px] flex-1 bg-black rounded-2xl overflow-hidden border shadow-2xl flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        id="viewport-canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onTouchStart={handleCanvasTouchStart}
        onTouchMove={handleCanvasTouchMove}
        onTouchEnd={handleCanvasTouchEnd}
        className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
      />

      {/* Top Left Shape Info Pill */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-2 pointer-events-none">
        <div
          className="px-3.5 py-1.5 rounded-xl bg-[#0c0e15] border text-xs font-medium text-white shadow-xl flex items-center gap-2"
          style={{
            borderColor: `${settings.theme.lineColor}60`,
            boxShadow: `0 0 15px rgba(0,0,0,0.9), 0 0 12px ${settings.theme.glowColor}25`,
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
            style={{
              backgroundColor: settings.theme.lineColor,
              boxShadow: `0 0 8px ${settings.theme.lineColor}`,
            }}
          />
          <span className="font-bold text-white text-xs">{shape.nameVi}</span>
          <span className="text-xs text-neutral-300 font-mono font-medium">({shape.name})</span>
        </div>

        {shape.isCustom && (
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400 text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,255,204,0.3)]">
            Custom Extrude
          </span>
        )}
      </div>

      {/* Top Center: REVENGE / STRESS TEST HUD (10,000 Points + Black Hole) */}
      {(shape.isBenchmark || shape.vertices.length > 5000) && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-auto max-w-[95%]">
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border shadow-2xl backdrop-blur-md"
            style={{
              backgroundColor: burnerMode ? 'rgba(35, 10, 10, 0.95)' : 'rgba(10, 25, 20, 0.95)',
              borderColor: burnerMode ? '#ef4444' : '#10b981',
              boxShadow: burnerMode
                ? '0 0 25px rgba(239, 68, 68, 0.6), inset 0 0 12px rgba(239, 68, 68, 0.25)'
                : '0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 10px rgba(16, 185, 129, 0.2)',
            }}
          >
            <div className="flex items-center gap-1.5">
              {burnerMode ? (
                <Flame className="w-4 h-4 text-red-500 animate-bounce" />
              ) : (
                <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
              )}
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                10.000 ĐỈNH • LỖ ĐEN • {burnerMode ? 'LAG THẬT (ĐỐT MÁY)' : 'TURBO 60 FPS'}
              </span>
            </div>

            <div className="h-3 w-[1px] bg-neutral-700" />

            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-neutral-700">
              <button
                id="btn-burner-mode"
                onClick={() => setBurnerMode(true)}
                title="Bật chế độ Lag Thật (CPU Burner) để dằn mặt lũ bạn dám chê máy không lag!"
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 transition ${
                  burnerMode
                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                    : 'text-neutral-400 hover:text-red-300'
                }`}
              >
                <Flame className="w-3 h-3 text-red-400" />
                Lag Thật
              </button>
              <button
                id="btn-turbo-mode"
                onClick={() => setBurnerMode(false)}
                title="Bật chế độ Turbo 60 FPS (Tối ưu hóa Skia) để flex công nghệ mượt mà!"
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 transition ${
                  !burnerMode
                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.9)]'
                    : 'text-neutral-400 hover:text-emerald-300'
                }`}
              >
                <Zap className="w-3 h-3 text-emerald-300" />
                Turbo 60 FPS
              </button>
              <button
                id="btn-blackhole-sound"
                onClick={handleToggleAudio}
                title="Bật/Tắt âm thanh vũ trụ hút Lỗ Đen"
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 transition ${
                  !isAudioMuted
                    ? 'bg-red-900/90 text-red-200 border border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    : 'text-neutral-400 hover:text-red-300'
                }`}
              >
                <Music className="w-3 h-3 text-red-400 animate-pulse" />
                {!isAudioMuted ? 'Nhạc: Bật' : 'Nhạc: Tắt'}
              </button>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono px-3 py-1 rounded-lg border shadow-md flex items-center gap-1.5 backdrop-blur-md ${
              burnerMode
                ? 'bg-red-950/90 text-red-200 border-red-500/80 animate-pulse'
                : 'bg-black/80 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {burnerMode ? (
              <>
                <Flame className="w-3 h-3 text-red-400 animate-bounce flex-shrink-0" />
                <span>
                  <strong>CẢNH BÁO:</strong> Kiểm tra quạt tản nhiệt coi chừng có mùi khét! 🔥💨 Bấm <strong>Turbo 60 FPS</strong> để giải cứu!
                </span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span>Đã bật Turbo Skia: 10.000 đỉnh + Lỗ đen trung tâm 60 FPS êm ru!</span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Top Center: DOUBLE PENDULUM (CON LẮC KÉP) REAL-TIME CONTROL & ANGLE BAR */}
      {isDoublePendulum && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-auto max-w-[95%]">
          <div
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border shadow-2xl backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(8, 22, 38, 0.95)',
              borderColor: 'rgba(56, 189, 248, 0.7)',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.45), inset 0 0 12px rgba(56, 189, 248, 0.2)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <Orbit className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono font-bold text-white tracking-wider flex items-center gap-1">
                CON LẮC KÉP {shape.is5D ? '5D' : shape.is4D ? '4D' : '3D'}
                <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-500/50">
                  {shape.is5D ? '5D VÔ CỰC' : 'HỖN LOẠN'}
                </span>
              </span>
            </div>

            <div className="h-3 w-[1px] bg-cyan-800" />

            {/* Hiển thị góc xoay chi tiết độ 000,0000° theo yêu cầu người dùng */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <div
                className="px-2 py-0.5 rounded bg-black/70 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1"
                title="Góc xoay Khớp 1 (Theta 1) định dạng 000,0000°"
              >
                <span className="text-neutral-400 text-[10px]">θ1:</span>
                <span className="text-white tracking-wider font-extrabold">{pendulumAngles.theta1}</span>
              </div>
              <div
                className="px-2 py-0.5 rounded bg-black/70 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1"
                title="Góc xoay Khớp 2 (Theta 2) định dạng 000,0000°"
              >
                <span className="text-neutral-400 text-[10px]">θ2:</span>
                <span className="text-white tracking-wider font-extrabold">{pendulumAngles.theta2}</span>
              </div>
              <div
                className="px-2 py-0.5 rounded bg-black/70 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1"
                title="Góc xoay Hướng không gian 3D (Phi) định dạng 000,0000°"
              >
                <span className="text-neutral-400 text-[10px]">Hướng 3D:</span>
                <span className="text-white tracking-wider font-extrabold">{pendulumAngles.phi}</span>
              </div>
              {shape.is4D && (
                <div
                  className="px-2 py-0.5 rounded bg-black/70 border border-purple-500/40 text-purple-300 font-bold hidden sm:flex items-center gap-1"
                  title="Góc lộn ruột Trục W 4D định dạng 000,0000°"
                >
                  <span className="text-neutral-400 text-[10px]">Trục 4D:</span>
                  <span className="text-white tracking-wider font-extrabold">{pendulumAngles.psi4D}</span>
                </div>
              )}
              {shape.is5D && (
                <div
                  className="px-2 py-0.5 rounded bg-black/70 border border-emerald-500/40 text-emerald-300 font-bold hidden sm:flex items-center gap-1"
                  title="Góc lộn nhào Trục V 5D định dạng 000,0000°"
                >
                  <span className="text-neutral-400 text-[10px]">Trục 5D:</span>
                  <span className="text-white tracking-wider font-extrabold">{pendulumAngles.omega5D}</span>
                </div>
              )}
            </div>

            <div className="h-3 w-[1px] bg-cyan-800" />

            {/* Quick Aesthetic Toggle */}
            <button
              onClick={() =>
                onUpdateSettings?.({
                  aestheticMode: settings.aestheticMode === 'wooden' ? 'cyber' : 'wooden',
                })
              }
              title={
                settings.aestheticMode === 'wooden'
                  ? 'Đang bật vân gỗ sồi • Bấm để đổi sang Cyber Neon'
                  : 'Đang bật Cyber Neon • Bấm để đổi sang Khối Gỗ Thật'
              }
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition active:scale-95 ${
                settings.aestheticMode === 'wooden'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600'
              }`}
            >
              <Box className="w-3 h-3 text-amber-200" />
              <span>{settings.aestheticMode === 'wooden' ? 'Khối Gỗ' : 'Cyber'}</span>
            </button>

            {/* Nút bấm Đổi Hướng Ngẫu Nhiên (Randomize Chaos Impulse) */}
            <button
              onClick={() => {
                randomizePendulum(pendulumSim);
                cosmicAudio.resume();
              }}
              title="Kích hoạt cú hích hỗn loạn ngẫu nhiên (Đổi hướng xoay & vận tốc tức thì)"
              className="px-2 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-mono font-bold flex items-center gap-1 transition shadow-[0_0_12px_rgba(6,182,212,0.6)] active:scale-95"
            >
              <Shuffle className="w-3 h-3 text-cyan-200" />
              <span>Đổi hướng</span>
            </button>
          </div>

          <span className="text-[10px] font-mono px-3 py-0.5 rounded-lg border shadow-md flex items-center gap-1.5 backdrop-blur-md bg-cyan-950/80 text-cyan-200 border-cyan-500/50">
            <span>
              Tổng góc lệch: <strong className="text-white">{pendulumAngles.totalDeg}</strong> • Đang tự động di chuyển liên tục & đổi hướng xoay ngẫu nhiên!
            </span>
          </span>
        </div>
      )}

      {/* Top Center: 5D HYPERSPACE CONTROL BAR */}
      {shape.is5D && !isDoublePendulum && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-auto max-w-[95%]">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-2xl backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(5, 25, 20, 0.95)',
              borderColor: 'rgba(52, 211, 153, 0.7)',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.5), inset 0 0 12px rgba(16, 185, 129, 0.2)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white tracking-wider flex items-center gap-1">
                5D HYPERSPACE <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-500/50">TRỤC V</span>
              </span>
            </div>

            <div className="h-3 w-[1px] bg-emerald-800" />

            {/* Quick 5D Plane Selectors */}
            <div className="flex items-center gap-1 bg-black/70 p-0.5 rounded-lg border border-emerald-800/60 text-[10px] font-mono">
              {(['XV', 'YV', 'ZV', 'WV', 'ALL_5D'] as const).map((pl) => {
                const isActive = settings.hyper5DPlane === pl;
                const label = pl === 'ALL_5D' ? 'ALL' : pl;
                return (
                  <button
                    key={pl}
                    onClick={() => onUpdateSettings?.({ hyper5DPlane: pl })}
                    className={`px-1.5 py-0.5 rounded transition font-bold ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                        : 'text-emerald-300 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="h-3 w-[1px] bg-emerald-800" />

            {/* Auto Hyper-5D spin toggle */}
            <button
              onClick={() => onUpdateSettings?.({ autoHyper5DSpin: !settings.autoHyper5DSpin })}
              title={settings.autoHyper5DSpin ? 'Dừng xoay 5D' : 'Bật tự xoay 5D'}
              className={`p-1 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 transition ${
                settings.autoHyper5DSpin
                  ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              {settings.autoHyper5DSpin ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>

          <span className="text-[10px] font-mono px-3 py-0.5 rounded-lg border shadow-md flex items-center gap-1.5 backdrop-blur-md bg-emerald-950/80 text-emerald-200 border-emerald-500/50">
            <span>
              Mặt phẳng <strong>{settings.hyper5DPlane}</strong>: Chiếu phối cảnh đa chiều 5D (V) → 4D (W) → 3D → 2D!
            </span>
          </span>
        </div>
      )}

      {/* Top Center: 4D HYPERSPACE CONTROL BAR */}
      {shape.is4D && !isDoublePendulum && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-auto max-w-[95%]">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-2xl backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(20, 10, 35, 0.95)',
              borderColor: 'rgba(192, 132, 252, 0.6)',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.5), inset 0 0 12px rgba(168, 85, 247, 0.2)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white tracking-wider flex items-center gap-1">
                4D HYPERSPACE <span className="text-[10px] px-1 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-500/50">TRỤC W</span>
              </span>
            </div>

            <div className="h-3 w-[1px] bg-purple-800" />

            {/* Quick 4D Plane Selectors */}
            <div className="flex items-center gap-1 bg-black/70 p-0.5 rounded-lg border border-purple-800/60 text-[10px] font-mono">
              {(['XW', 'YW', 'ZW', 'DOUBLE_CLIFFORD', 'ALL'] as const).map((pl) => {
                const isActive = settings.hyperPlane === pl;
                const label =
                  pl === 'XW'
                    ? 'XW'
                    : pl === 'YW'
                    ? 'YW'
                    : pl === 'ZW'
                    ? 'ZW'
                    : pl === 'DOUBLE_CLIFFORD'
                    ? 'Clifford 2D'
                    : 'Tất cả';
                return (
                  <button
                    key={pl}
                    onClick={() => onUpdateSettings?.({ hyperPlane: pl })}
                    className={`px-1.5 py-0.5 rounded transition font-bold ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                        : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="h-3 w-[1px] bg-purple-800" />

            {/* Auto Hyper-spin toggle */}
            <button
              onClick={() => onUpdateSettings?.({ autoHyperSpin: !settings.autoHyperSpin })}
              title={settings.autoHyperSpin ? 'Dừng xoay 4D' : 'Bật tự xoay 4D'}
              className={`p-1 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 transition ${
                settings.autoHyperSpin
                  ? 'bg-fuchsia-600 text-white shadow-[0_0_8px_rgba(217,70,239,0.8)]'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              {settings.autoHyperSpin ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>

            {/* Color by W toggle */}
            <button
              onClick={() => onUpdateSettings?.({ hyperColorW: !settings.hyperColorW })}
              title="Bật/Tắt hiệu ứng tô màu theo chiều sâu trục W"
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition border ${
                settings.hyperColorW
                  ? 'bg-gradient-to-r from-cyan-900 to-fuchsia-900 text-fuchsia-200 border-fuchsia-500/70 shadow-[0_0_8px_rgba(217,70,239,0.5)]'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-700'
              }`}
            >
              Tô W
            </button>

            {/* 4D Celestial Ambient Sound toggle */}
            <button
              onClick={handleToggleAudio}
              title="Bật/Tắt âm thanh không gian 4D ngân vang vu vơ"
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 transition border ${
                !isAudioMuted
                  ? 'bg-purple-800 text-purple-100 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                  : 'bg-neutral-900 text-neutral-400 border-purple-900/40 hover:text-white'
              }`}
            >
              <Music className="w-2.5 h-2.5 text-purple-300 animate-pulse" />
              <span>{!isAudioMuted ? 'Nhạc 4D' : 'Tắt'}</span>
            </button>
          </div>

          <span className="text-[10px] font-mono px-3 py-0.5 rounded-lg border shadow-md flex items-center gap-1.5 backdrop-blur-md bg-purple-950/80 text-purple-200 border-purple-500/50">
            <span>
              Mặt phẳng <strong>{settings.hyperPlane}</strong>: Không gian 4 chiều đang lộn ruột & chiếu phối cảnh!
            </span>
          </span>
        </div>
      )}

      {/* Auto Anti-Lag Activated Notification Toast */}
      {showAutoLagToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/95 border border-emerald-400 text-white font-mono text-xs shadow-2xl backdrop-blur-md animate-bounce pointer-events-none">
          <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>
            🚀 <strong>ĐÃ TỰ ĐỘNG BẬT GIẢM LAG:</strong> Phát hiện FPS giảm, hệ thống tự tối ưu 60 FPS!
          </span>
        </div>
      )}

      {/* Top Right Quick Controls */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
        {/* Aesthetic Mode Toggle (Wooden Texture vs Cyber Neon) */}
        <button
          id="btn-toggle-aesthetic-mode"
          onClick={() =>
            onUpdateSettings?.({
              aestheticMode: settings.aestheticMode === 'wooden' ? 'cyber' : 'wooden',
            })
          }
          title={
            settings.aestheticMode === 'wooden'
              ? 'Đang bật vân gỗ sồi tự nhiên • Bấm để chuyển sang Cyber Neon'
              : 'Đang bật Cyber Neon • Bấm để chuyển sang Khối Gỗ Thật'
          }
          className={`px-2.5 py-2 rounded-xl border transition shadow-xl active:scale-95 flex items-center gap-1.5 text-xs font-mono font-bold ${
            settings.aestheticMode === 'wooden'
              ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.8)]'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border-neutral-700 hover:border-amber-500/60'
          }`}
        >
          <Box className={`w-4 h-4 ${settings.aestheticMode === 'wooden' ? 'text-amber-200' : 'text-neutral-400'}`} />
          <span className="hidden sm:inline">
            {settings.aestheticMode === 'wooden' ? 'Khối Gỗ: BẬT' : 'Khối Gỗ'}
          </span>
        </button>

        {/* Anti-Lag Turbo Toggle Button */}
        <button
          id="btn-toggle-anti-lag"
          onClick={() => {
            const next = !settings.antiLag;
            if (next) {
              setBurnerMode(false);
              burnerModeRef.current = false;
            }
            onUpdateSettings?.({
              antiLag: next,
              disableGlow: next,
              capDpr: next,
            });
          }}
          title={
            settings.antiLag
              ? "Chế độ Giảm Lag đang BẬT (60 FPS siêu mượt). Bấm để chuyển về Chế độ Đầy Đủ"
              : "Bấm để BẬT GIẢM LAG (Anti-Lag Turbo 60 FPS): Tắt bóng mờ GPU, tối ưu hóa vẽ, khóa 1.0x DPI"
          }
          className={`px-2.5 py-2 rounded-xl border transition shadow-xl active:scale-95 flex items-center gap-1.5 text-xs font-mono font-bold ${
            settings.antiLag
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.8)]'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 border-neutral-700 hover:border-emerald-500/60'
          }`}
        >
          <Zap className={`w-4 h-4 ${settings.antiLag ? 'text-white animate-pulse' : 'text-emerald-400'}`} />
          <span className="hidden sm:inline">
            {settings.antiLag ? 'Giảm Lag: BẬT' : 'Giảm Lag'}
          </span>
        </button>

        <button
          id="btn-toggle-viewport-sound"
          onClick={handleToggleAudio}
          title={
            isAudioMuted
              ? "Bật âm thanh vũ trụ"
              : `Đang phát: ${
                  audioMode === 'equinox'
                    ? 'Equinox Armor Theme (Thiên Long)'
                    : audioMode === 'attribute'
                    ? 'Attribute Mutilation (Thành Tài)'
                    : audioMode === 'blackhole'
                    ? 'Lỗ Đen Vũ Trụ'
                    : '4D Hyperspace'
                }`
          }
          className={`px-2.5 py-2 rounded-xl border transition shadow-xl active:scale-95 flex items-center gap-1.5 text-xs font-mono font-bold ${
            !isAudioMuted
              ? audioMode === 'equinox'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400 shadow-[0_0_14px_rgba(0,255,204,0.4)]'
                : audioMode === 'attribute'
                ? 'bg-purple-950/80 text-purple-300 border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/80 text-purple-300 border-purple-500/70 shadow-[0_0_14px_rgba(168,85,247,0.4)]'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
          }`}
        >
          {!isAudioMuted ? (
            <>
              <Volume2 className="w-4 h-4 animate-pulse text-cyan-400" />
              <span className="hidden sm:inline">
                {audioMode === 'equinox'
                  ? 'Equinox'
                  : audioMode === 'attribute'
                  ? 'Attribute'
                  : audioMode === 'blackhole'
                  ? 'Lỗ Đen'
                  : 'Nhạc 4D'}
              </span>
            </>
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-400" />
          )}
        </button>
        <button
          id="btn-reset-orientation"
          onClick={resetRotation}
          title="Đặt lại góc nhìn (Reset Orientation)"
          className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white hover:text-cyan-300 border border-neutral-700 hover:border-cyan-400 transition shadow-xl active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          id="btn-toggle-fullscreen"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
          className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white hover:text-cyan-300 border border-neutral-700 hover:border-cyan-400 transition shadow-xl active:scale-95"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Floating Stats Bar */}
      {settings.showStats && (
        <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#0c0e15] border border-neutral-700 text-xs font-mono text-neutral-200 shadow-2xl">
          <div>
            Đỉnh:{' '}
            <span
              className="font-bold text-white"
              style={{ color: settings.theme.lineColor }}
            >
              {shape.vertices.length.toLocaleString('vi-VN')}
            </span>
          </div>
          <div className="w-[1px] h-3 bg-neutral-700" />
          <div>
            Cạnh:{' '}
            <span
              className="font-bold text-white"
              style={{ color: settings.theme.lineColor }}
            >
              {shape.edges.length.toLocaleString('vi-VN')}
            </span>
          </div>
          <div className="w-[1px] h-3 bg-neutral-700" />
          <div>
            FPS:{' '}
            <span
              className={`font-bold ${
                burnerMode
                  ? 'text-red-500 animate-pulse font-extrabold'
                  : fps < 45
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {fps} {burnerMode && '(LAG)'}
            </span>
          </div>
          {burnerMode && (
            <>
              <div className="w-[1px] h-3 bg-neutral-700" />
              <div className="text-red-400 flex items-center gap-1 font-bold animate-pulse text-[11px]">
                <span>MÙI KHÉT: CỰC CAO 🔥💨</span>
              </div>
            </>
          )}
          {shape.is4D && (
            <>
              <div className="w-[1px] h-3 bg-neutral-700" />
              <div className="text-purple-300 flex items-center gap-1 font-bold text-[11px]">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>4D TẾ BÀO: {shape.cells4DCount || 8} • TRỤC {settings.hyperPlane}</span>
              </div>
            </>
          )}
          {isDoublePendulum && (
            <>
              <div className="w-[1px] h-3 bg-neutral-700" />
              <div className="text-cyan-300 flex items-center gap-1 font-bold text-[11px]">
                <Orbit className="w-3 h-3 text-cyan-400 animate-spin" />
                <span>GÓC XOAY: {pendulumAngles.totalDeg}</span>
              </div>
            </>
          )}
          <div className="w-[1px] h-3 bg-neutral-700" />
          <div className="hidden sm:block">
            FOV: <span className="text-white font-bold">{settings.fov}</span>
          </div>
        </div>
      )}

      {/* Touch/Mouse hint - Centered */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none hidden md:block">
        <span className="text-xs text-neutral-200 font-medium font-mono bg-[#0c0e15]/90 px-3.5 py-1.5 rounded-lg border border-neutral-700 shadow-xl backdrop-blur-sm">
          Kéo chuột trong khung để xoay 3D
        </span>
      </div>
    </div>
  );
};

// 3D Gargantua-style Supermassive Black Hole at the galactic center
function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  isBurner: boolean,
  accentColor: string,
  disableGlow: boolean = false
) {
  ctx.save();

  const time = performance.now() * 0.002;
  const eventHorizonR = 22;
  const diskR = 48;

  // 1. Gravitational Lensing Halo (Thấu kính hấp dẫn uốn cong ánh sáng phía sau)
  const lensGrad = ctx.createRadialGradient(cx, cy, eventHorizonR * 0.8, cx, cy, diskR * 1.7);
  lensGrad.addColorStop(0, 'rgba(255, 160, 0, 0.85)');
  lensGrad.addColorStop(0.35, 'rgba(255, 75, 0, 0.45)');
  lensGrad.addColorStop(0.7, 'rgba(0, 255, 204, 0.2)');
  lensGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = lensGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, diskR * 1.7, 0, Math.PI * 2);
  ctx.fill();

  // 2. Warped Accretion Disk (Đĩa bồi tụ xoay nghiêng theo góc nhìn 3D)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ry * 0.5 + 0.35);
  const tiltY = Math.cos(rx) * 0.38 + 0.12;
  ctx.scale(1, Math.abs(tiltY));

  // Accretion gas swirls
  for (let ring = 0; ring < 4; ring++) {
    ctx.strokeStyle =
      ring === 0 ? '#fff5cc' : ring === 1 ? '#ff8800' : ring === 2 ? '#ff2200' : accentColor;
    ctx.lineWidth = 3.0 - ring * 0.6;
    ctx.globalAlpha = 0.85 - ring * 0.18;
    if (!disableGlow) {
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    ctx.arc(0, 0, diskR - ring * 7 + Math.sin(time * 2 + ring) * 1.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Relativistic Plasma Jets (Bức xạ chuẩn tinh cực mạnh 2 cực)
  const jetAngle = ry * 0.4 + Math.PI / 2;
  const jetLen = 78 + Math.sin(time * 3) * 12;
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  if (!disableGlow) {
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 18;
  }
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(jetAngle) * jetLen, cy + Math.sin(jetAngle) * jetLen);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - Math.cos(jetAngle) * jetLen, cy - Math.sin(jetAngle) * jetLen);
  ctx.stroke();
  ctx.restore();

  // 4. Event Horizon (Hố đen tuyệt đối - Chân trời sự kiện nuốt chửng ánh sáng)
  ctx.fillStyle = '#000000';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, eventHorizonR, 0, Math.PI * 2);
  ctx.fill();

  // 5. Razor-thin Brilliant Photon Sphere Ring (Vòng quang tử rực lửa)
  ctx.strokeStyle = '#fffbf0';
  ctx.lineWidth = 2.2;
  if (!disableGlow) {
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 16;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, eventHorizonR + 1.2, 0, Math.PI * 2);
  ctx.stroke();

  // 6. Burning Embers & Smoke if in Burner Mode ("Mùi khét")
  if (isBurner && !disableGlow) {
    ctx.fillStyle = '#ff3300';
    ctx.shadowColor = '#ff1100';
    ctx.shadowBlur = 9;
    for (let s = 0; s < 16; s++) {
      const sparkAng = (s / 16) * Math.PI * 2 + time * 2.5;
      const sparkR = eventHorizonR + 5 + ((time * 35 + s * 19) % 65);
      const sx = cx + Math.cos(sparkAng) * sparkR;
      const sy = cy + Math.sin(sparkAng) * sparkR - ((time * 30 + s * 11) % 45);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8 + (s % 2) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// 3D & 4D Orientation Axis Gizmo (X=Red, Y=Green, Z=Blue, W=Purple) with Cyber HUD bezel
function drawGizmo(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  rx: number,
  ry: number,
  rz: number,
  is4D = false,
  rot4D?: { xw: number; yw: number; zw: number }
) {
  const axisLen = 22;
  const axes: { name: string; color: string; p: Point3D }[] = [
    { name: 'X', color: '#ff3366', p: { x: axisLen, y: 0, z: 0 } },
    { name: 'Y', color: '#00ff88', p: { x: 0, y: -axisLen, z: 0 } },
    { name: 'Z', color: '#00d2ff', p: { x: 0, y: 0, z: axisLen } },
  ];

  ctx.save();

  // Dark HUD circle background with neon border
  ctx.fillStyle = 'rgba(11, 14, 21, 0.88)';
  ctx.strokeStyle = is4D ? 'rgba(168, 85, 247, 0.55)' : 'rgba(0, 255, 204, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(gx, gy, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Small compass label
  ctx.font = 'bold 8px JetBrains Mono, monospace';
  ctx.fillStyle = is4D ? 'rgba(216, 180, 254, 0.95)' : 'rgba(255, 255, 255, 0.7)';
  ctx.textAlign = 'center';
  ctx.fillText(is4D ? 'TRỤC XYZ + W' : 'TRỤC XYZ', gx, gy - 20);

  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.font = 'bold 11px JetBrains Mono, monospace';

  for (const ax of axes) {
    let p = rotateX(ax.p, rx);
    p = rotateY(p, ry);
    if (rz !== 0) p = rotateZ(p, rz);

    ctx.strokeStyle = ax.color;
    ctx.fillStyle = ax.color;
    ctx.shadowColor = ax.color;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + p.x, gy + p.y);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillText(ax.name, gx + p.x * 1.35, gy + p.y * 1.35 + 4);
  }

  // 4D W-Axis Hyperspace indicator (pulsating diagonal hyper-vector)
  if (is4D) {
    const wAngle = rot4D ? rot4D.xw + rot4D.yw : 0;
    const wLen = 17;
    const wx = Math.cos(wAngle - Math.PI / 4) * wLen;
    const wy = Math.sin(wAngle - Math.PI / 4) * wLen;

    ctx.strokeStyle = '#c084fc';
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 9;
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + wx, gy + wy);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillText('W', gx + wx * 1.45, gy + wy * 1.45 + 4);

    // Hyper-orbital ring around center
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(gx, gy, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Gizmo center anchor
  ctx.fillStyle = is4D ? '#e879f9' : '#ffffff';
  ctx.shadowColor = is4D ? '#c084fc' : '#00ffcc';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Background perspective plane neon cyber grid
function drawAtmosphericGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rot: { rx: number; ry: number },
  settings: RenderSettings
) {
  ctx.save();
  ctx.strokeStyle = `${settings.theme.lineColor}12`; // subtle neon line
  ctx.lineWidth = 1;

  const gridSize = 45;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Neon grid intersection points
  ctx.fillStyle = `${settings.theme.lineColor}25`;
  for (let x = 0; x < w; x += gridSize * 2) {
    for (let y = 0; y < h; y += gridSize * 2) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  ctx.restore();
}
