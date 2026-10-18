import { Edge, Point3D, Point4D, Shape3D } from '../types';
import { initialProject4DList } from './shapes4D';

/**
 * 3D & 4D WIREFRAME TYPOGRAPHY & GEOMETRIC SHAPE GENERATORS
 * Dành riêng cho:
 * 1. THIÊN LONG (Người làm ra) - Theme: Equinox Armor
 * 2. THÀNH TÀI (Ý tưởng) - Theme: Attribute Mutilation
 * 3. LIÊN MINH SONG HÙNG (Thiên Long × Thành Tài)
 */

interface BoxDef {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Tạo chùm cạnh hộp 3D (3D beam)
function addBeam(
  vertices: Point3D[],
  edges: Edge[],
  b: BoxDef,
  depth = 12,
  zOffset = 0,
  addCrossBrace = true
) {
  const minX = Math.min(b.x1, b.x2);
  const maxX = Math.max(b.x1, b.x2);
  const minY = Math.min(b.y1, b.y2);
  const maxY = Math.max(b.y1, b.y2);
  const halfD = depth / 2;
  const zF = zOffset - halfD; // Front
  const zB = zOffset + halfD; // Back

  const base = vertices.length;
  // 4 đỉnh mặt trước
  vertices.push({ x: minX, y: minY, z: zF }); // 0: Top-Left Front
  vertices.push({ x: maxX, y: minY, z: zF }); // 1: Top-Right Front
  vertices.push({ x: maxX, y: maxY, z: zF }); // 2: Bottom-Right Front
  vertices.push({ x: minX, y: maxY, z: zF }); // 3: Bottom-Left Front

  // 4 đỉnh mặt sau
  vertices.push({ x: minX, y: minY, z: zB }); // 4: Top-Left Back
  vertices.push({ x: maxX, y: minY, z: zB }); // 5: Top-Right Back
  vertices.push({ x: maxX, y: maxY, z: zB }); // 6: Bottom-Right Back
  vertices.push({ x: minX, y: maxY, z: zB }); // 7: Bottom-Left Back

  // Cạnh mặt trước
  edges.push([base + 0, base + 1]);
  edges.push([base + 1, base + 2]);
  edges.push([base + 2, base + 3]);
  edges.push([base + 3, base + 0]);

  // Cạnh mặt sau
  edges.push([base + 4, base + 5]);
  edges.push([base + 5, base + 6]);
  edges.push([base + 6, base + 7]);
  edges.push([base + 7, base + 4]);

  // Cạnh nối giữa 2 mặt (độ dày)
  edges.push([base + 0, base + 4]);
  edges.push([base + 1, base + 5]);
  edges.push([base + 2, base + 6]);
  edges.push([base + 3, base + 7]);

  // Giằng chéo công nghệ cao (Diagonal Truss Wireframe)
  if (addCrossBrace) {
    edges.push([base + 0, base + 6]);
    edges.push([base + 1, base + 7]);
  }
}

// Tạo dầm nghiêng nối 2 điểm A và B trong 2D với độ dày w
function addAngledBeam(
  vertices: Point3D[],
  edges: Edge[],
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  thick = 3,
  depth = 12,
  zOffset = 0
) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (thick / 2);
  const ny = (dx / len) * (thick / 2);

  const halfD = depth / 2;
  const zF = zOffset - halfD;
  const zB = zOffset + halfD;

  const base = vertices.length;
  // Mặt trước
  vertices.push({ x: p1.x + nx, y: p1.y + ny, z: zF });
  vertices.push({ x: p2.x + nx, y: p2.y + ny, z: zF });
  vertices.push({ x: p2.x - nx, y: p2.y - ny, z: zF });
  vertices.push({ x: p1.x - nx, y: p1.y - ny, z: zF });

  // Mặt sau
  vertices.push({ x: p1.x + nx, y: p1.y + ny, z: zB });
  vertices.push({ x: p2.x + nx, y: p2.y + ny, z: zB });
  vertices.push({ x: p2.x - nx, y: p2.y - ny, z: zB });
  vertices.push({ x: p1.x - nx, y: p1.y - ny, z: zB });

  // Cạnh trước
  edges.push([base + 0, base + 1]);
  edges.push([base + 1, base + 2]);
  edges.push([base + 2, base + 3]);
  edges.push([base + 3, base + 0]);

  // Cạnh sau
  edges.push([base + 4, base + 5]);
  edges.push([base + 5, base + 6]);
  edges.push([base + 6, base + 7]);
  edges.push([base + 7, base + 4]);

  // Nối trước - sau
  edges.push([base + 0, base + 4]);
  edges.push([base + 1, base + 5]);
  edges.push([base + 2, base + 6]);
  edges.push([base + 3, base + 7]);
  // Giằng
  edges.push([base + 0, base + 6]);
}

/**
 * Thư viện sinh chữ cái 3D Wireframe (chiều rộng ~ 14, chiều cao ~ 22)
 */
function renderLetter3D(
  char: string,
  ox: number,
  oy: number,
  vertices: Point3D[],
  edges: Edge[],
  depth = 14,
  zOffset = 0
) {
  const w = 14;
  const h = 22;
  const t = 3.2; // Độ dày nét chữ

  switch (char) {
    case 'T':
      // Thanh ngang trên
      addBeam(vertices, edges, { x1: ox, y1: oy, x2: ox + w, y2: oy + t }, depth, zOffset);
      // Trụ dọc giữa
      addBeam(vertices, edges, { x1: ox + w / 2 - t / 2, y1: oy + t, x2: ox + w / 2 + t / 2, y2: oy + h }, depth, zOffset);
      break;

    case 'H':
      // Trụ dọc trái
      addBeam(vertices, edges, { x1: ox, y1: oy, x2: ox + t, y2: oy + h }, depth, zOffset);
      // Trụ dọc phải
      addBeam(vertices, edges, { x1: ox + w - t, y1: oy, x2: ox + w, y2: oy + h }, depth, zOffset);
      // Thanh giằng giữa
      addBeam(vertices, edges, { x1: ox + t, y1: oy + h / 2 - t / 2, x2: ox + w - t, y2: oy + h / 2 + t / 2 }, depth, zOffset);
      break;

    case 'I':
      // Cột thẳng đứng chữ I
      addBeam(vertices, edges, { x1: ox + w / 2 - t / 2, y1: oy, x2: ox + w / 2 + t / 2, y2: oy + h }, depth, zOffset);
      // Chân và đầu chữ I
      addBeam(vertices, edges, { x1: ox + 2, y1: oy, x2: ox + w - 2, y2: oy + t * 0.9 }, depth, zOffset);
      addBeam(vertices, edges, { x1: ox + 2, y1: oy + h - t * 0.9, x2: ox + w - 2, y2: oy + h }, depth, zOffset);
      break;

    case 'E':
    case 'Ê':
      // Cột dọc trái
      addBeam(vertices, edges, { x1: ox, y1: oy, x2: ox + t, y2: oy + h }, depth, zOffset);
      // 3 thanh ngang: trên, giữa, dưới
      addBeam(vertices, edges, { x1: ox + t, y1: oy, x2: ox + w, y2: oy + t }, depth, zOffset);
      addBeam(vertices, edges, { x1: ox + t, y1: oy + h / 2 - t / 2, x2: ox + w - 2, y2: oy + h / 2 + t / 2 }, depth, zOffset);
      addBeam(vertices, edges, { x1: ox + t, y1: oy + h - t, x2: ox + w, y2: oy + h }, depth, zOffset);

      if (char === 'Ê') {
        // Dấu nón ^ trên đầu chữ Ê
        addAngledBeam(vertices, edges, { x: ox + 1, y: oy - 2 }, { x: ox + w / 2, y: oy - 7 }, 2.5, depth, zOffset);
        addAngledBeam(vertices, edges, { x: ox + w / 2, y: oy - 7 }, { x: ox + w - 1, y: oy - 2 }, 2.5, depth, zOffset);
      }
      break;

    case 'N':
      // Cột trái & cột phải
      addBeam(vertices, edges, { x1: ox, y1: oy, x2: ox + t, y2: oy + h }, depth, zOffset);
      addBeam(vertices, edges, { x1: ox + w - t, y1: oy, x2: ox + w, y2: oy + h }, depth, zOffset);
      // Đường chéo N
      addAngledBeam(vertices, edges, { x: ox + t, y: oy }, { x: ox + w - t, y: oy + h }, 2.8, depth, zOffset);
      break;

    case 'L':
      // Cột đứng
      addBeam(vertices, edges, { x1: ox, y1: oy, x2: ox + t, y2: oy + h }, depth, zOffset);
      // Đáy ngang
      addBeam(vertices, edges, { x1: ox + t, y1: oy + h - t, x2: ox + w, y2: oy + h }, depth, zOffset);
      break;

    case 'O':
      // Khung chữ O bát giác công nghệ
      addBeam(vertices, edges, { x1: ox, y1: oy + 3, x2: ox + t, y2: oy + h - 3 }, depth, zOffset);
      addBeam(vertices, edges, { x1: ox + w - t, y1: oy + 3, x2: ox + w, y2: oy + h - 3 }, depth, zOffset);
      addBeam(vertices, edges, { x1: ox + 3, y1: oy, x2: ox + w - 3, y2: oy + t }, depth, zOffset);
      addBeam(vertices, edges, { x1: ox + 3, y1: oy + h - t, x2: ox + w - 3, y2: oy + h }, depth, zOffset);
      // Góc vát
      addAngledBeam(vertices, edges, { x: ox + t, y: oy + 3 }, { x: ox + 3, y: oy + t }, 2, depth, zOffset);
      addAngledBeam(vertices, edges, { x: ox + w - 3, y: oy + t }, { x: ox + w - t, y: oy + 3 }, 2, depth, zOffset);
      addAngledBeam(vertices, edges, { x: ox + t, y: oy + h - 3 }, { x: ox + 3, y: oy + h - t }, 2, depth, zOffset);
      addAngledBeam(vertices, edges, { x: ox + w - 3, y: oy + h - t }, { x: ox + w - t, y: oy + h - 3 }, 2, depth, zOffset);
      break;

    case 'G':
      // Chữ G: Giống chữ O nhưng khuyết góc phải và có tay vịn
      addBeam(vertices, edges, { x1: ox, y1: oy + 3, x2: ox + t, y2: oy + h - 3 }, depth, zOffset);
      addBeam(vertices, edges, { x1: ox + 3, y1: oy, x2: ox + w - 3, y2: oy + t }, depth, zOffset);
      addBeam(vertices, edges, { x1: ox + 3, y1: oy + h - t, x2: ox + w - 3, y2: oy + h }, depth, zOffset);
      // Cột dưới phải
      addBeam(vertices, edges, { x1: ox + w - t, y1: oy + h / 2, x2: ox + w, y2: oy + h - 3 }, depth, zOffset);
      // Tay ngang vào trong
      addBeam(vertices, edges, { x1: ox + w / 2 - 1, y1: oy + h / 2, x2: ox + w, y2: oy + h / 2 + t }, depth, zOffset);
      break;

    case 'A':
    case 'À':
      // Chân chữ A chéo
      addAngledBeam(vertices, edges, { x: ox + w / 2, y: oy }, { x: ox, y: oy + h }, 2.8, depth, zOffset);
      addAngledBeam(vertices, edges, { x: ox + w / 2, y: oy }, { x: ox + w, y: oy + h }, 2.8, depth, zOffset);
      // Thanh ngang A
      addBeam(vertices, edges, { x1: ox + 3, y1: oy + h * 0.62 - t / 2, x2: ox + w - 3, y2: oy + h * 0.62 + t / 2 }, depth, zOffset);

      if (char === 'À') {
        // Dấu huyền `
        addAngledBeam(vertices, edges, { x: ox + w / 2 - 4, y: oy - 6 }, { x: ox + w / 2 + 1, y: oy - 2 }, 2.5, depth, zOffset);
      }
      break;

    default:
      // Ký tự mặc định (khối hộp nhỏ)
      addBeam(vertices, edges, { x1: ox, y1: oy, x2: ox + w, y2: oy + h }, depth, zOffset);
      break;
  }
}

// Hàm render một từ thành mảng 3D
function renderWord3D(
  word: string,
  startX: number,
  startY: number,
  vertices: Point3D[],
  edges: Edge[],
  letterSpacing = 18,
  depth = 14,
  zOffset = 0
) {
  const chars = Array.from(word);
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    renderLetter3D(char, startX + i * letterSpacing, startY, vertices, edges, depth, zOffset);
  }
}

// =========================================================================
// 1. KHỐI 3D THIÊN LONG (Người làm ra - Equinox Armor Theme)
// =========================================================================
export function makeThienLong3D(): Shape3D {
  const vertices: Point3D[] = [];
  const edges: Edge[] = [];

  // Dòng 1: THIÊN (5 chữ cái x 18 = 90px)
  // Dòng 2: LONG (4 chữ cái x 18 = 72px)
  const depth = 16;
  const line1StartX = -45;
  const line1StartY = -26;

  const line2StartX = -36;
  const line2StartY = 6;

  renderWord3D('THIÊN', line1StartX, line1StartY, vertices, edges, 18, depth, 0);
  renderWord3D('LONG', line2StartX, line2StartY, vertices, edges, 18, depth, 0);

  // Thêm Vòng Hào Quang Thiên Long (Celestial Dragon Orbit Rings & Celestial Diamond Halo)
  const ringRadiusX = 85;
  const ringRadiusY = 55;
  const ringSegments = 24;
  const ringBaseIdx = vertices.length;

  for (let i = 0; i < ringSegments; i++) {
    const angle = (i / ringSegments) * Math.PI * 2;
    vertices.push({
      x: Math.cos(angle) * ringRadiusX,
      y: Math.sin(angle) * ringRadiusY,
      z: Math.sin(angle * 2) * 22,
    });
    edges.push([ringBaseIdx + i, ringBaseIdx + ((i + 1) % ringSegments)]);
  }

  // Vòng quỹ đạo thứ 2 nghiêng đối xứng
  const ring2BaseIdx = vertices.length;
  for (let i = 0; i < ringSegments; i++) {
    const angle = (i / ringSegments) * Math.PI * 2;
    vertices.push({
      x: Math.cos(angle) * (ringRadiusX * 0.95),
      y: Math.sin(angle * 2) * 24,
      z: Math.sin(angle) * ringRadiusY,
    });
    edges.push([ring2BaseIdx + i, ring2BaseIdx + ((i + 1) % ringSegments)]);
  }

  // 8 Điểm Kim Cương Bảo Hộ Thiên Long (Equinox Beacons)
  const beaconBase = vertices.length;
  const beaconR = 98;
  for (let k = 0; k < 8; k++) {
    const theta = (k / 8) * Math.PI * 2;
    vertices.push({
      x: Math.cos(theta) * beaconR,
      y: Math.sin(theta) * beaconR * 0.65,
      z: (k % 2 === 0 ? 1 : -1) * 25,
    });
  }
  for (let k = 0; k < 8; k++) {
    edges.push([beaconBase + k, beaconBase + ((k + 1) % 8)]);
    edges.push([beaconBase + k, ringBaseIdx + (k * 3) % ringSegments]);
  }

  return {
    id: 'thien-long-3d',
    name: 'Thiên Long 3D',
    nameVi: 'Khối 3D THIÊN LONG',
    descriptionVi: `Khối Wireframe điêu khắc tên THIÊN LONG (Người làm ra) • Hào quang Rồng Thần 3D • Nhạc nền: Equinox Armor Theme.`,
    vertices,
    edges,
    isCustom: false,
  };
}

// =========================================================================
// 2. KHỐI 3D THÀNH TÀI (Ý tưởng - Attribute Mutilation Theme)
// =========================================================================
export function makeThanhTai3D(): Shape3D {
  const vertices: Point3D[] = [];
  const edges: Edge[] = [];

  const depth = 16;
  // Dòng 1: THÀNH (5 chữ cái x 18 = 90px)
  // Dòng 2: TÀI (3 chữ cái x 18 = 54px)
  const line1StartX = -45;
  const line1StartY = -26;

  const line2StartX = -27;
  const line2StartY = 6;

  renderWord3D('THÀNH', line1StartX, line1StartY, vertices, edges, 18, depth, 0);
  renderWord3D('TÀI', line2StartX, line2StartY, vertices, edges, 18, depth, 0);

  // Khung Ma Trận Thuộc Tính Cybernetic (Attribute Matrix Cage & Fractured Crystals)
  const cageSizeX = 75;
  const cageSizeY = 52;
  const cageSizeZ = 35;
  const cageBase = vertices.length;

  // 8 đỉnh hộp bao ngoài
  const cX = [-cageSizeX, cageSizeX];
  const cY = [-cageSizeY, cageSizeY];
  const cZ = [-cageSizeZ, cageSizeZ];

  for (const x of cX) {
    for (const y of cY) {
      for (const z of cZ) {
        vertices.push({ x, y, z });
      }
    }
  }

  // 12 cạnh hộp
  edges.push(
    [cageBase + 0, cageBase + 1],
    [cageBase + 1, cageBase + 3],
    [cageBase + 3, cageBase + 2],
    [cageBase + 2, cageBase + 0],
    [cageBase + 4, cageBase + 5],
    [cageBase + 5, cageBase + 7],
    [cageBase + 7, cageBase + 6],
    [cageBase + 6, cageBase + 4],
    [cageBase + 0, cageBase + 4],
    [cageBase + 1, cageBase + 5],
    [cageBase + 2, cageBase + 6],
    [cageBase + 3, cageBase + 7]
  );

  // Các tinh thể thuộc tính (Attribute Fractured Spikes) ở 4 góc
  const spikeBase = vertices.length;
  vertices.push({ x: 0, y: -cageSizeY - 22, z: 0 }); // Đỉnh trên
  vertices.push({ x: 0, y: cageSizeY + 22, z: 0 });  // Đỉnh dưới
  vertices.push({ x: -cageSizeX - 25, y: 0, z: 0 }); // Đỉnh trái
  vertices.push({ x: cageSizeX + 25, y: 0, z: 0 });  // Đỉnh phải

  edges.push([spikeBase + 0, cageBase + 0], [spikeBase + 0, cageBase + 1], [spikeBase + 0, cageBase + 4], [spikeBase + 0, cageBase + 5]);
  edges.push([spikeBase + 1, cageBase + 2], [spikeBase + 1, cageBase + 3], [spikeBase + 1, cageBase + 6], [spikeBase + 1, cageBase + 7]);
  edges.push([spikeBase + 2, cageBase + 0], [spikeBase + 2, cageBase + 2], [spikeBase + 2, cageBase + 4], [spikeBase + 2, cageBase + 6]);
  edges.push([spikeBase + 3, cageBase + 1], [spikeBase + 3, cageBase + 3], [spikeBase + 3, cageBase + 5], [spikeBase + 3, cageBase + 7]);

  return {
    id: 'thanh-tai-3d',
    name: 'Thành Tài 3D',
    nameVi: 'Khối 3D THÀNH TÀI',
    descriptionVi: `Khối Wireframe điêu khắc tên THÀNH TÀI (Ý tưởng) • Lồng ma trận thuộc tính Fractured Cyber • Nhạc nền: Attribute Mutilation.`,
    vertices,
    edges,
    isCustom: false,
  };
}

// =========================================================================
// 3. ĐẠI TƯỢNG ĐÀI SONG HÙNG 3D (THIÊN LONG × THÀNH TÀI)
// =========================================================================
export function makeDualCreators3D(): Shape3D {
  const vertices: Point3D[] = [];
  const edges: Edge[] = [];

  const depth = 12;

  // Tầng 1 (Ở trên, Z nghiêng về trước): THIÊN LONG
  renderWord3D('THIÊN', -45, -44, vertices, edges, 18, depth, -20);
  renderWord3D('LONG', -36, -18, vertices, edges, 18, depth, -20);

  // Tầng 2 (Ở dưới, Z nghiêng về sau): THÀNH TÀI
  renderWord3D('THÀNH', -45, 14, vertices, edges, 18, depth, 20);
  renderWord3D('TÀI', -27, 40, vertices, edges, 18, depth, 20);

  // Trục liên kết Lưỡng Cực Năng Lượng (Double Helix Energy Bridge)
  const helixSteps = 24;
  const helixBaseA = vertices.length;
  for (let i = 0; i < helixSteps; i++) {
    const t = (i / helixSteps) * Math.PI * 4;
    const y = -45 + (i / helixSteps) * 90;
    vertices.push({
      x: Math.cos(t) * 65,
      y,
      z: Math.sin(t) * 35,
    });
  }
  for (let i = 0; i < helixSteps - 1; i++) {
    edges.push([helixBaseA + i, helixBaseA + i + 1]);
  }

  const helixBaseB = vertices.length;
  for (let i = 0; i < helixSteps; i++) {
    const t = (i / helixSteps) * Math.PI * 4 + Math.PI;
    const y = -45 + (i / helixSteps) * 90;
    vertices.push({
      x: Math.cos(t) * 65,
      y,
      z: Math.sin(t) * 35,
    });
  }
  for (let i = 0; i < helixSteps - 1; i++) {
    edges.push([helixBaseB + i, helixBaseB + i + 1]);
  }

  // Nối các nấc thang chuỗi xoắn kép ADN vũ trụ
  for (let i = 0; i < helixSteps; i += 2) {
    edges.push([helixBaseA + i, helixBaseB + i]);
  }

  return {
    id: 'dual-creators-3d',
    name: 'Thiên Long × Thành Tài 3D',
    nameVi: 'Song Hùng 3D: Thiên Long & Thành Tài',
    descriptionVi: 'Đại tượng đài điêu khắc 3D kết hợp cả 2 tác giả: THIÊN LONG (Người làm ra) & THÀNH TÀI (Ý tưởng) liên kết chuỗi xoắn kép!',
    vertices,
    edges,
    isCustom: false,
  };
}

// =========================================================================
// 4. KHỐI 4D THIÊN LONG 4D (HYPER-TESSERACT TYPOGRAPHY)
// =========================================================================
export function makeThienLong4D(): Shape3D {
  // Bắt đầu từ hình dáng chữ 3D gốc
  const baseShape = makeThienLong3D();
  const baseCount = baseShape.vertices.length;

  const vertices4D: Point4D[] = [];
  const edges: Edge[] = [];

  // Tìm bán kính chuẩn hóa
  let maxR = 1;
  for (const v of baseShape.vertices) {
    const r = Math.hypot(v.x, v.y, v.z);
    if (r > maxR) maxR = r;
  }
  const norm = 1.05 / maxR;

  // Lớp 1 trong 4D: W = -0.72 (Khối 3D bên trong siêu không gian)
  const depthW = 0.72;
  for (const v of baseShape.vertices) {
    vertices4D.push({
      x: v.x * norm,
      y: v.y * norm,
      z: v.z * norm,
      w: -depthW,
    });
  }

  // Lớp 2 trong 4D: W = +0.72 (Khối 3D bên ngoài siêu không gian)
  for (const v of baseShape.vertices) {
    vertices4D.push({
      x: v.x * norm,
      y: v.y * norm,
      z: v.z * norm,
      w: depthW,
    });
  }

  // Cạnh lớp 1
  for (const [a, b] of baseShape.edges) {
    if (a < baseCount && b < baseCount) {
      edges.push([a, b]);
    }
  }

  // Cạnh lớp 2
  for (const [a, b] of baseShape.edges) {
    if (a < baseCount && b < baseCount) {
      edges.push([a + baseCount, b + baseCount]);
    }
  }

  // Cạnh siêu kết nối dọc theo Chiều Thứ Tư W (Tesseract hyper-edges)
  // Chỉ chọn các bước đại diện để giữ khung dây tinh tế thanh thoát
  const step = baseCount > 250 ? 2 : 1;
  for (let i = 0; i < baseCount; i += step) {
    edges.push([i, i + baseCount]);
  }

  // Giằng chéo 4D Hyperspace
  for (let i = 0; i < baseCount; i += 8) {
    edges.push([i, ((i + 7) % baseCount) + baseCount]);
  }

  const vertices3D = initialProject4DList(vertices4D, 95, 2.2);

  return {
    id: 'thien-long-4d',
    name: 'Thiên Long 4D Hyper-Tesseract',
    nameVi: 'Khối 4D THIÊN LONG',
    descriptionVi: `Khối siêu chiều 4D THIÊN LONG (Người làm ra) • ${vertices4D.length} đỉnh 4D, ${edges.length} siêu cạnh • Xoay chiều XW/YW lộn ruột tesseract ảo diệu!`,
    vertices: vertices3D,
    edges,
    is4D: true,
    vertices4D,
    cells4DCount: baseCount,
    hyperType: 'custom-4d',
  };
}

// =========================================================================
// 5. KHỐI 4D THÀNH TÀI 4D (HYPER-ATTRIBUTE CLIFFORD CORE)
// =========================================================================
export function makeThanhTai4D(): Shape3D {
  const baseShape = makeThanhTai3D();
  const baseCount = baseShape.vertices.length;

  const vertices4D: Point4D[] = [];
  const edges: Edge[] = [];

  let maxR = 1;
  for (const v of baseShape.vertices) {
    const r = Math.hypot(v.x, v.y, v.z);
    if (r > maxR) maxR = r;
  }
  const norm = 1.05 / maxR;

  // Lớp 1: w = -0.72
  for (const v of baseShape.vertices) {
    vertices4D.push({
      x: v.x * norm,
      y: v.y * norm,
      z: v.z * norm,
      w: -0.72,
    });
  }

  // Lớp 2: w = +0.72
  for (const v of baseShape.vertices) {
    vertices4D.push({
      x: v.x * norm,
      y: v.y * norm,
      z: v.z * norm,
      w: 0.72,
    });
  }

  // Cạnh lớp 1 & 2
  for (const [a, b] of baseShape.edges) {
    if (a < baseCount && b < baseCount) {
      edges.push([a, b]);
      edges.push([a + baseCount, b + baseCount]);
    }
  }

  // Cạnh siêu kết nối 4D
  const step = baseCount > 250 ? 2 : 1;
  for (let i = 0; i < baseCount; i += step) {
    edges.push([i, i + baseCount]);
  }

  const vertices3D = initialProject4DList(vertices4D, 95, 2.2);

  return {
    id: 'thanh-tai-4d',
    name: 'Thành Tài 4D Hyper-Matrix',
    nameVi: 'Khối 4D THÀNH TÀI',
    descriptionVi: `Khối siêu chiều 4D THÀNH TÀI (Ý tưởng) • ${vertices4D.length} đỉnh 4D, ${edges.length} siêu cạnh ma trận thuộc tính Fractured Hyperspace.`,
    vertices: vertices3D,
    edges,
    is4D: true,
    vertices4D,
    cells4DCount: baseCount,
    hyperType: 'custom-4d',
  };
}

// =========================================================================
// 6. KHỐI 4D SONG HÙNG: THIÊN LONG × THÀNH TÀI (DUAL 4D HYPER-TESSERACT)
// =========================================================================
export function makeDualCreators4D(): Shape3D {
  const shapeTL = makeThienLong3D();
  const shapeTT = makeThanhTai3D();

  const tlCount = shapeTL.vertices.length;
  const ttCount = shapeTT.vertices.length;

  const vertices4D: Point4D[] = [];
  const edges: Edge[] = [];

  let maxR = 1;
  for (const v of shapeTL.vertices) {
    const r = Math.hypot(v.x, v.y, v.z);
    if (r > maxR) maxR = r;
  }
  for (const v of shapeTT.vertices) {
    const r = Math.hypot(v.x, v.y, v.z);
    if (r > maxR) maxR = r;
  }
  const norm = 1.0 / maxR;

  // Nửa 4D thứ nhất: THIÊN LONG ngự trị tại siêu phẳng W = +0.65
  for (const v of shapeTL.vertices) {
    vertices4D.push({
      x: v.x * norm,
      y: v.y * norm,
      z: v.z * norm,
      w: 0.65,
    });
  }

  // Nửa 4D thứ hai: THÀNH TÀI ngự trị tại siêu phẳng W = -0.65
  for (const v of shapeTT.vertices) {
    vertices4D.push({
      x: v.x * norm,
      y: v.y * norm,
      z: v.z * norm,
      w: -0.65,
    });
  }

  // Cạnh của Thiên Long (nằm ở W > 0)
  for (const [a, b] of shapeTL.edges) {
    if (a < tlCount && b < tlCount) {
      edges.push([a, b]);
    }
  }

  // Cạnh của Thành Tài (nằm ở W < 0)
  for (const [a, b] of shapeTT.edges) {
    if (a < ttCount && b < ttCount) {
      edges.push([a + tlCount, b + ttCount]);
    }
  }

  // Cầu nối siêu không gian 4D (Hyper-Dimensional Quantum Wormholes) nối giữa 2 tác giả
  const minCount = Math.min(tlCount, ttCount);
  const bridgeStep = Math.max(1, Math.floor(minCount / 32));
  for (let i = 0; i < minCount; i += bridgeStep) {
    edges.push([i, i + tlCount]);
  }

  const vertices3D = initialProject4DList(vertices4D, 95, 2.2);

  return {
    id: 'dual-creators-4d',
    name: 'Song Hùng 4D: Thiên Long × Thành Tài',
    nameVi: 'Khối 4D SONG HÙNG (Thiên Long & Thành Tài)',
    descriptionVi: `Khối siêu chiều 4D ĐỘC NHẤT VÔ NHỊ: THIÊN LONG ở siêu phẳng W+ và THÀNH TÀI ở siêu phẳng W-! Khi xoay 4D, 2 tác giả hoán đổi chiều không gian lộn ngược cực đỉnh!`,
    vertices: vertices3D,
    edges,
    is4D: true,
    vertices4D,
    cells4DCount: tlCount + ttCount,
    hyperType: 'custom-4d',
  };
}
