import { Point2D } from '../types';

/**
 * Evaluates a Catmull-Rom spline segment at parameter t in [0, 1]
 * with configurable tension (default 0.5).
 */
export function catmullRomPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): { x: number; y: number; sx: number; sy: number } {
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom basis matrix coefficients
  const b0 = -0.5 * t3 + t2 - 0.5 * t;
  const b1 = 1.5 * t3 - 2.5 * t2 + 1.0;
  const b2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
  const b3 = 0.5 * t3 - 0.5 * t2;

  const sx0 = p0.sx ?? p0.x;
  const sy0 = p0.sy ?? p0.y;
  const sx1 = p1.sx ?? p1.x;
  const sy1 = p1.sy ?? p1.y;
  const sx2 = p2.sx ?? p2.x;
  const sy2 = p2.sy ?? p2.y;
  const sx3 = p3.sx ?? p3.x;
  const sy3 = p3.sy ?? p3.y;

  const sx = b0 * sx0 + b1 * sx1 + b2 * sx2 + b3 * sx3;
  const sy = b0 * sy0 + b1 * sy1 + b2 * sy2 + b3 * sy3;

  const x = b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x;
  const y = b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y;

  return { x, y, sx, sy };
}

/**
 * Filter raw pointer events to remove micro-jitter and duplicate points
 */
export function filterJitter(points: Point2D[], minDistance = 4): Point2D[] {
  if (points.length <= 2) return [...points];

  const filtered: Point2D[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = filtered[filtered.length - 1];
    const curr = points[i];
    const distSq =
      ((curr.sx ?? curr.x) - (prev.sx ?? prev.x)) ** 2 +
      ((curr.sy ?? curr.y) - (prev.sy ?? prev.y)) ** 2;

    if (distSq >= minDistance * minDistance || i === points.length - 1) {
      filtered.push(curr);
    }
  }

  return filtered;
}

/**
 * Smooth a stroke using Catmull-Rom interpolation with adaptive step sampling.
 * Produces organic, fluid curves that preserve intended shape while eliminating jagged angles.
 */
export function smoothStrokeCatmullRom(
  rawPoints: Point2D[],
  options: {
    isClosed?: boolean;
    stepDist?: number; // Distance in pixels between interpolated points (default ~6px)
    smoothFactor?: number; // Pre-smoothing pass iterations
    canvasWidth?: number;
    canvasHeight?: number;
  } = {}
): Point2D[] {
  const {
    isClosed = false,
    stepDist = 6,
    smoothFactor = 1,
    canvasWidth = 380,
    canvasHeight = 380,
  } = options;

  if (rawPoints.length < 3) {
    return rawPoints.map((p) => ({
      ...p,
      sx: p.sx ?? p.x + canvasWidth / 2,
      sy: p.sy ?? p.y + canvasHeight / 2,
    }));
  }

  // 1. Initial jitter reduction
  let pts = filterJitter(rawPoints, 3);
  if (pts.length < 3) {
    return pts;
  }

  // 2. Chaikin corner-softening pre-pass for hand-drawn organic fluidity
  if (smoothFactor > 0 && pts.length >= 4) {
    for (let s = 0; s < smoothFactor; s++) {
      const smoothed: Point2D[] = [];
      smoothed.push(pts[0]);
      for (let i = 0; i < pts.length - 1; i++) {
        const pA = pts[i];
        const pB = pts[i + 1];

        const pA_sx = pA.sx ?? pA.x + canvasWidth / 2;
        const pA_sy = pA.sy ?? pA.y + canvasHeight / 2;
        const pB_sx = pB.sx ?? pB.x + canvasWidth / 2;
        const pB_sy = pB.sy ?? pB.y + canvasHeight / 2;

        const q_sx = 0.75 * pA_sx + 0.25 * pB_sx;
        const q_sy = 0.75 * pA_sy + 0.25 * pB_sy;
        const r_sx = 0.25 * pA_sx + 0.75 * pB_sx;
        const r_sy = 0.25 * pA_sy + 0.75 * pB_sy;

        smoothed.push({
          sx: q_sx,
          sy: q_sy,
          x: q_sx - canvasWidth / 2,
          y: q_sy - canvasHeight / 2,
        });
        smoothed.push({
          sx: r_sx,
          sy: r_sy,
          x: r_sx - canvasWidth / 2,
          y: r_sy - canvasHeight / 2,
        });
      }
      smoothed.push(pts[pts.length - 1]);
      pts = smoothed;
    }
  }

  // 3. Catmull-Rom Spline Interpolation
  const n = pts.length;
  const result: Point2D[] = [];

  for (let i = 0; i < n - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];

    // Compute virtual ghost points for endpoints
    let p0: Point2D;
    let p3: Point2D;

    if (isClosed) {
      p0 = pts[(i - 1 + n) % n];
      p3 = pts[(i + 2) % n];
    } else {
      if (i === 0) {
        // Extrapolate reflection before start
        const p1_sx = p1.sx ?? p1.x + canvasWidth / 2;
        const p1_sy = p1.sy ?? p1.y + canvasHeight / 2;
        const p2_sx = p2.sx ?? p2.x + canvasWidth / 2;
        const p2_sy = p2.sy ?? p2.y + canvasHeight / 2;
        p0 = {
          sx: 2 * p1_sx - p2_sx,
          sy: 2 * p1_sy - p2_sy,
          x: 2 * p1.x - p2.x,
          y: 2 * p1.y - p2.y,
        };
      } else {
        p0 = pts[i - 1];
      }

      if (i === n - 2) {
        // Extrapolate reflection after end
        const p1_sx = p1.sx ?? p1.x + canvasWidth / 2;
        const p1_sy = p1.sy ?? p1.y + canvasHeight / 2;
        const p2_sx = p2.sx ?? p2.x + canvasWidth / 2;
        const p2_sy = p2.sy ?? p2.y + canvasHeight / 2;
        p3 = {
          sx: 2 * p2_sx - p1_sx,
          sy: 2 * p2_sy - p1_sy,
          x: 2 * p2.x - p1.x,
          y: 2 * p2.y - p1.y,
        };
      } else {
        p3 = pts[i + 2];
      }
    }

    const p1_sx = p1.sx ?? p1.x + canvasWidth / 2;
    const p1_sy = p1.sy ?? p1.y + canvasHeight / 2;
    const p2_sx = p2.sx ?? p2.x + canvasWidth / 2;
    const p2_sy = p2.sy ?? p2.y + canvasHeight / 2;

    const segmentDist = Math.hypot(p2_sx - p1_sx, p2_sy - p1_sy);
    const steps = Math.max(1, Math.min(12, Math.round(segmentDist / stepDist)));

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const interp = catmullRomPoint(p0, p1, p2, p3, t);
      result.push(interp);
    }
  }

  // Push the final endpoint
  const lastPt = pts[pts.length - 1];
  result.push({
    ...lastPt,
    sx: lastPt.sx ?? lastPt.x + canvasWidth / 2,
    sy: lastPt.sy ?? lastPt.y + canvasHeight / 2,
  });

  return result;
}

/**
 * Renders a path on a 2D canvas context using smooth Bezier curve interpolation.
 * Instead of jagged lineTo segments, this uses quadratic Bezier midpoint curves
 * to guarantee continuous smooth curves (C1 continuity) in real-time.
 */
export function drawSmoothBezierPath(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  isClosed = false
): void {
  if (points.length === 0) return;

  if (points.length === 1) {
    const p = points[0];
    const sx = p.sx ?? p.x;
    const sy = p.sy ?? p.y;
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    return;
  }

  if (points.length === 2) {
    const p0 = points[0];
    const p1 = points[1];
    ctx.moveTo(p0.sx ?? p0.x, p0.sy ?? p0.y);
    ctx.lineTo(p1.sx ?? p1.x, p1.sy ?? p1.y);
    return;
  }

  const p0 = points[0];
  ctx.moveTo(p0.sx ?? p0.x, p0.sy ?? p0.y);

  if (isClosed && points.length >= 3) {
    // Closed loop smooth curve
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const curr = points[i];
      const next = points[(i + 1) % n];

      const currSx = curr.sx ?? curr.x;
      const currSy = curr.sy ?? curr.y;
      const nextSx = next.sx ?? next.x;
      const nextSy = next.sy ?? next.y;

      const midX = (currSx + nextSx) / 2;
      const midY = (currSy + nextSy) / 2;

      if (i === 0) {
        ctx.moveTo(midX, midY);
      } else {
        ctx.quadraticCurveTo(currSx, currSy, midX, midY);
      }
    }
    // Close back to first midpoint
    const first = points[0];
    const second = points[1];
    const midX = ((first.sx ?? first.x) + (second.sx ?? second.x)) / 2;
    const midY = ((first.sy ?? first.y) + (second.sy ?? second.y)) / 2;
    ctx.quadraticCurveTo(first.sx ?? first.x, first.sy ?? first.y, midX, midY);
    ctx.closePath();
  } else {
    // Open path: Quadratic curve through midpoints
    for (let i = 1; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];

      const currSx = curr.sx ?? curr.x;
      const currSy = curr.sy ?? curr.y;
      const nextSx = next.sx ?? next.x;
      const nextSy = next.sy ?? next.y;

      const midX = (currSx + nextSx) / 2;
      const midY = (currSy + nextSy) / 2;

      ctx.quadraticCurveTo(currSx, currSy, midX, midY);
    }

    // Connect to the final point with straight line or curve
    const last = points[points.length - 1];
    ctx.lineTo(last.sx ?? last.x, last.sy ?? last.y);
  }
}
