// =========================================================================
// WOODEN TEXTURE & REALISTIC GRAIN SHADER ENGINE
// Tải và map vân gỗ sồi tự nhiên (Natural Oak Grain) lên các bề mặt đa diện 3D/4D
// =========================================================================

const woodTextureUrl = '/src/assets/images/wood_grain_texture_1792053195155.jpg';
import { Point3D, RenderSettings } from '../types';

let woodImage: HTMLImageElement | null = null;
let woodImageLoaded = false;
let cachedPatternCanvas: HTMLCanvasElement | null = null;
let cachedWoodPattern: CanvasPattern | null = null;

// Khởi tạo và tải trước ảnh vân gỗ
export function initWoodTexture(): void {
  if (typeof window === 'undefined') return;
  if (woodImage) return;

  woodImage = new Image();
  woodImage.crossOrigin = 'anonymous';
  woodImage.src = woodTextureUrl;
  woodImage.onload = () => {
    woodImageLoaded = true;
    createPatternCache();
  };
}

// Tạo bộ nhớ đệm pattern từ ảnh hoặc từ thuật toán vân gỗ dự phòng
function createPatternCache(): void {
  try {
    cachedPatternCanvas = document.createElement('canvas');
    cachedPatternCanvas.width = 512;
    cachedPatternCanvas.height = 512;
    const pctx = cachedPatternCanvas.getContext('2d');
    if (!pctx) return;

    if (woodImageLoaded && woodImage) {
      pctx.drawImage(woodImage, 0, 0, 512, 512);
    } else {
      // Procedural Wood Grain fallback (Thuật toán tạo vân gỗ sồi ấm áp dự phòng)
      generateProceduralWood(pctx, 512, 512);
    }
  } catch (err) {
    console.warn('Wood pattern cache init fallback:', err);
  }
}

// Thuật toán vẽ vân gỗ sồi mộc dự phòng nếu ảnh đang load
function generateProceduralWood(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, '#c28741');
  grad.addColorStop(0.3, '#dca056');
  grad.addColorStop(0.55, '#ba7b35');
  grad.addColorStop(0.8, '#e0aa62');
  grad.addColorStop(1, '#be803a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Thêm thớ gỗ tự nhiên (Wood fiber grain lines)
  ctx.strokeStyle = 'rgba(110, 60, 20, 0.18)';
  ctx.lineWidth = 1.2;
  for (let x = 0; x < w; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y < h; y += 20) {
      const offset = Math.sin(y * 0.04 + x * 0.1) * 3 + Math.cos(y * 0.015) * 4;
      ctx.lineTo(x + offset, y);
    }
    ctx.stroke();
  }
}

// Lấy CanvasPattern vân gỗ
export function getWoodPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (cachedWoodPattern) return cachedWoodPattern;
  if (!cachedPatternCanvas) {
    createPatternCache();
  }
  if (cachedPatternCanvas) {
    cachedWoodPattern = ctx.createPattern(cachedPatternCanvas, 'repeat');
    return cachedWoodPattern;
  }
  return null;
}

// =========================================================================
// VẼ KHÔNG GIAN BỐI CẢNH XƯỞNG GỖ (WARM CARPENTER WORKSHOP AMBIANCE)
// Thay thế không gian đen vũ trụ bằng ánh sáng ấm áp của bàn thợ mộc cao cấp
// =========================================================================
export function drawWorkshopBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: RenderSettings
): void {
  // Ánh sáng ấm từ trên xuống (Overhead warm carpenter lamp)
  const grad = ctx.createRadialGradient(
    width / 2,
    height * 0.35,
    50,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75
  );
  grad.addColorStop(0, '#1c130c'); // Nâu gỗ óc chó ấm áp
  grad.addColorStop(0.65, '#0e0805');
  grad.addColorStop(1, '#050302'); // Nền tối sâu

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Lưới bàn mộc thợ thủ công (Carpenter Workbench Mat Grid)
  if (settings.showCoordinates) {
    ctx.save();
    ctx.strokeStyle = 'rgba(217, 145, 74, 0.08)'; // Vạch khắc thớ gỗ màu hổ phách
    ctx.lineWidth = 1;
    const step = 40;
    const cx = width / 2;
    const cy = height / 2;

    ctx.beginPath();
    for (let x = (cx % step); x < width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = (cy % step); y < height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Vạch tâm thước đo mộc
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    ctx.restore();
  }
}

export interface ProjectedFaceVertex {
  x: number;
  y: number;
  z: number;
  visible: boolean;
}

// =========================================================================
// RENDER BỀ MẶT KHỐI GỖ (SOLID WOOD GRAIN FACET RENDERER)
// Tô phủ ảnh vân gỗ lên từng đa giác với ánh sáng 3D chân thực
// =========================================================================
export function renderWoodenFace(
  ctx: CanvasRenderingContext2D,
  pts2D: ProjectedFaceVertex[],
  pts3D: Point3D[],
  settings: RenderSettings
): void {
  if (pts2D.length < 3) return;
  // Kiểm tra điểm hiển thị
  for (let i = 0; i < pts2D.length; i++) {
    if (!pts2D[i].visible) return;
  }

  // 1. Tính Vector Pháp Tuyến 3D (Surface Normal) để mô phỏng ánh sáng
  let nx = 0, ny = 0, nz = 1;
  if (pts3D.length >= 3) {
    const v0 = pts3D[0];
    const v1 = pts3D[1];
    const v2 = pts3D[2];
    const ax = v1.x - v0.x, ay = v1.y - v0.y, az = v1.z - v0.z;
    const bx = v2.x - v0.x, by = v2.y - v0.y, bz = v2.z - v0.z;
    nx = ay * bz - az * by;
    ny = az * bx - ax * bz;
    nz = ax * by - ay * bx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
  }

  // Vector nguồn sáng chiếu từ góc trên bên trái: L = (0.35, -0.75, -0.55)
  const lx = 0.35, ly = -0.75, lz = -0.55;
  const lLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
  const dot = (nx * lx + ny * ly + nz * lz) / lLen;
  // Cường độ sáng từ 0.35 (bóng đổ) đến 1.0 (mặt nhận sáng)
  const lightFactor = Math.max(0.35, Math.min(1.0, 0.65 + dot * 0.35));

  ctx.save();

  // Tạo đường dẫn đa giác
  ctx.beginPath();
  ctx.moveTo(pts2D[0].x, pts2D[0].y);
  for (let i = 1; i < pts2D.length; i++) {
    ctx.lineTo(pts2D[i].x, pts2D[i].y);
  }
  ctx.closePath();

  // 2. Phủ vân gỗ thật từ ảnh (Pattern fill)
  const pattern = getWoodPattern(ctx);
  if (pattern) {
    ctx.fillStyle = pattern;
  } else {
    ctx.fillStyle = '#c28741';
  }
  ctx.fill();

  // 3. Phủ lớp Shading 3D (Đổ bóng & vệt sáng tự nhiên)
  if (lightFactor < 0.65) {
    // Bóng đổ mờ ở các mặt khuất
    ctx.fillStyle = `rgba(30, 15, 5, ${((0.65 - lightFactor) * 1.2).toFixed(2)})`;
    ctx.fill();
  } else {
    // Vệt sáng bóng vec-ni (Varnish highlight) trên mặt đón sáng
    ctx.fillStyle = `rgba(255, 235, 190, ${((lightFactor - 0.65) * 0.5).toFixed(2)})`;
    ctx.fill();
  }

  // 4. Viền cạnh gỗ đã mài nhẵn (Polished bevel timber edge)
  ctx.strokeStyle = lightFactor > 0.65 ? '#8d501c' : '#452208';
  ctx.lineWidth = Math.max(1.0, settings.lineWidth * 0.85);
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.restore();
}

// Khởi chạy load texture ngay khi import
initWoodTexture();
