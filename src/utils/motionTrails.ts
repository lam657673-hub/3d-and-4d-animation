// =========================================================================
// MOTION TRAILS & LIGHT STREAKS ENGINE (HIỆU ỨNG VỆT SÁNG CHUYỂN ĐỘNG)
// Tạo dải vệt sáng đa chiều (Streamlines & Ghost Wireframe Echoes) cho hình khối 3D & 4D
// =========================================================================

import { RenderSettings } from '../types';

export interface TrailPoint {
  x: number;
  y: number;
  visible: boolean;
  wDepth?: number;
  z?: number;
}

export interface TrailFrameSnapshot {
  shapeId: string;
  points: TrailPoint[];
  edges?: [number, number][];
  majorVertices?: number[];
  timestamp: number;
}

export class MotionTrailEngine {
  private history: TrailFrameSnapshot[] = [];
  private lastShapeId: string = '';

  /**
   * Thêm một khung hình mới vào bộ nhớ đệm vệt sáng
   */
  public addSnapshot(
    snapshot: TrailFrameSnapshot,
    maxTrailLength: number
  ): void {
    // Nếu chuyển sang hình khối khác, dọn dẹp bộ nhớ đệm để tránh vệt cắt ngang màn hình
    if (snapshot.shapeId !== this.lastShapeId) {
      this.history = [];
      this.lastShapeId = snapshot.shapeId;
    }

    // Đưa khung hình mới nhất lên đầu danh sách (index 0 = mới nhất)
    this.history.unshift(snapshot);

    // Cắt bớt đuôi nếu vượt quá độ dài chỉ định
    const limit = Math.max(2, Math.min(60, maxTrailLength));
    if (this.history.length > limit) {
      this.history.length = limit;
    }
  }

  /**
   * Xóa toàn bộ lịch sử vệt sáng
   */
  public clear(): void {
    this.history = [];
  }

  /**
   * Số lượng khung hình hiện có trong bộ nhớ
   */
  public getCount(): number {
    return this.history.length;
  }

  /**
   * Vẽ hiệu ứng vệt sáng chuyển động (Motion Trails & Light Streaks)
   */
  public renderTrails(
    ctx: CanvasRenderingContext2D,
    settings: RenderSettings,
    width: number,
    height: number,
    disableGlow: boolean
  ): void {
    if (!settings.motionTrail || this.history.length < 2) {
      return;
    }

    const maxLen = Math.max(3, Math.min(60, settings.trailLength || 20));
    const persistence = Math.max(0.15, Math.min(0.99, settings.trailPersistence ?? 0.85));
    const histLen = Math.min(this.history.length, maxLen);
    const primaryColor = settings.theme.lineColor;
    const accentColor = settings.theme.accentColor || '#38bdf8';
    const isAntiLag = !!settings.antiLag;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Kích hoạt Neon Glow nhẹ nếu không ở chế độ Anti-Lag
    if (!disableGlow && !isAntiLag) {
      ctx.shadowColor = settings.theme.glowColor || primaryColor;
      ctx.shadowBlur = Math.min(8, 12 * persistence);
    } else {
      ctx.shadowBlur = 0;
    }

    const newestFrame = this.history[0];
    const pointCount = newestFrame.points.length;
    if (pointCount === 0) {
      ctx.restore();
      return;
    }

    // -----------------------------------------------------------------------
    // PHẦN 1: DƯ ẢNH DÂY LƯỚI KHÔNG GIAN (GHOST WIREFRAME ECHOES)
    // Vẽ bóng mờ của các cạnh khung dây ở các bước quá khứ với độ mờ phân rã theo persistence
    // -----------------------------------------------------------------------
    if (settings.showEdges && newestFrame.edges && newestFrame.edges.length > 0) {
      const edges = newestFrame.edges;
      const ghostInterval = histLen > 24 ? 3 : histLen > 12 ? 2 : 1;

      for (let k = ghostInterval; k < histLen; k += ghostInterval) {
        const frame = this.history[k];
        if (!frame || frame.points.length !== pointCount) continue;

        const stepFrac = k / histLen;
        // Phân rã độ mờ theo hàm số mũ persistence^k kết hợp tỷ lệ đuôi
        const alpha = Math.pow(persistence, k * 0.85) * (1 - stepFrac * 0.75) * 0.28;
        if (alpha < 0.015) continue;

        ctx.globalAlpha = Math.max(0.01, Math.min(0.5, alpha));
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = Math.max(0.6, settings.lineWidth * (1 - stepFrac * 0.5) * 0.75);

        ctx.beginPath();
        for (let e = 0; e < edges.length; e++) {
          const [a, b] = edges[e];
          const pa = frame.points[a];
          const pb = frame.points[b];
          if (pa && pb && pa.visible && pb.visible) {
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
          }
        }
        ctx.stroke();
      }
    }

    // -----------------------------------------------------------------------
    // PHẦN 2: DẢI TIA SÁNG ĐỈNH (VERTEX STREAMLINES / LIGHT STREAKS)
    // Nối liên tục các đỉnh từ hiện tại ngược về quá khứ tạo thành dải lụa quang học
    // -----------------------------------------------------------------------
    // Bước nhảy đỉnh (stride) để tối ưu hiệu năng mượt mà trên các khối nhiều đỉnh
    let stride = 1;
    if (pointCount > 1000) stride = 16;
    else if (pointCount > 256) stride = 4;
    else if (pointCount > 64) stride = 2;

    const majorIndices = new Set(newestFrame.majorVertices || []);
    const maxJumpAllowed = Math.min(width, height) * 0.45; // Ngăn chặn vệt đứt gãy cắt ngang màn hình

    // Lặp qua từng bước lịch sử từ gần đến xa (k từ 0 đến histLen - 2)
    for (let k = 0; k < histLen - 1; k++) {
      const fCurr = this.history[k];
      const fPast = this.history[k + 1];
      if (!fCurr || !fPast) continue;
      if (fCurr.points.length !== pointCount || fPast.points.length !== pointCount) continue;

      const stepRatio = k / (histLen - 1);
      // Decay factor dựa trên persistence và vị trí trên đuôi
      const decay = Math.pow(persistence, k) * (1 - stepRatio * 0.7);
      const alpha = Math.max(0.02, Math.min(0.9, decay * 0.8));
      const lw = Math.max(0.6, settings.lineWidth * (1 - stepRatio * 0.65));

      // Tuyến vẽ tiêu chuẩn (Standard Streamline Batch)
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = lw;

      ctx.beginPath();
      for (let v = 0; v < pointCount; v += stride) {
        if (majorIndices.has(v)) continue; // Vẽ riêng ở tầng trọng điểm
        const p1 = fCurr.points[v];
        const p2 = fPast.points[v];
        if (!p1 || !p2 || !p1.visible || !p2.visible) continue;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (dx * dx + dy * dy > maxJumpAllowed * maxJumpAllowed) continue;

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();

      // Tuyến vẽ đỉnh trọng điểm (Major Vertices / Double Pendulum Bobs / Star Anchors)
      if (majorIndices.size > 0) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = Math.max(1.2, lw * 1.5);
        ctx.globalAlpha = Math.min(1.0, alpha * 1.35);

        ctx.beginPath();
        majorIndices.forEach((v) => {
          const p1 = fCurr.points[v];
          const p2 = fPast.points[v];
          if (!p1 || !p2 || !p1.visible || !p2.visible) return;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          if (dx * dx + dy * dy > maxJumpAllowed * maxJumpAllowed) return;

          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        });
        ctx.stroke();
      }
    }

    // -----------------------------------------------------------------------
    // PHẦN 3: ĐỐM HẠT BỤI SAO DỌC ĐUÔI VỆT SÁNG (STARDUST PARTICLES)
    // Tạo các điểm phát quang nhỏ li ti ở các nút đuôi của đỉnh trọng điểm
    // -----------------------------------------------------------------------
    if (majorIndices.size > 0 && histLen >= 3) {
      const sparkInterval = histLen > 15 ? 4 : 2;
      for (let k = sparkInterval; k < histLen; k += sparkInterval) {
        const frame = this.history[k];
        if (!frame) continue;
        const decay = Math.pow(persistence, k) * (1 - k / histLen);
        if (decay < 0.1) continue;

        ctx.globalAlpha = Math.min(0.85, decay);
        ctx.fillStyle = accentColor;

        majorIndices.forEach((v) => {
          const pt = frame.points[v];
          if (pt && pt.visible) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Math.max(1.0, 2.5 * (1 - k / histLen)), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
    }

    ctx.restore();
  }
}

export const motionTrailSingleton = new MotionTrailEngine();
