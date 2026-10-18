// =========================================================================
// 5D HYPERSPACE GEOMETRY & PROJECTION ENGINE (SIÊU KHÔNG GIAN 5 CHIỀU)
// Tọa độ 5 chiều: (X, Y, Z, W, V) với 10 mặt phẳng xoay trong không gian R^5
// Chiếu phối cảnh đa tầng: 5D (V) -> 4D (W) -> 3D (Z) -> 2D Màn hình
// =========================================================================

import { Edge, Point3D, Point4D, Point5D, Shape3D } from '../types';
import { makeThienLong3D, makeThanhTai3D, makeDualCreators3D } from './nameShapes';

export interface Projected5DResult {
  p4d: Point4D;
  vDepth: number; // Tọa độ chiều sâu trục thứ 5 V
  visible: boolean;
}

// -------------------------------------------------------------------------
// 1. CÁC PHÉP XOAY TRONG KHÔNG GIAN 5 CHIỀU (5D HYPERPLANE ROTATIONS)
// -------------------------------------------------------------------------

/** Xoay quanh mặt phẳng XV (X và trục thứ 5 V) */
export function rotate5D_XV(p: Point5D, angle: number): Point5D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    ...p,
    x: p.x * cos - p.v * sin,
    v: p.x * sin + p.v * cos,
  };
}

/** Xoay quanh mặt phẳng YV (Y và trục thứ 5 V) */
export function rotate5D_YV(p: Point5D, angle: number): Point5D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    ...p,
    y: p.y * cos - p.v * sin,
    v: p.y * sin + p.v * cos,
  };
}

/** Xoay quanh mặt phẳng ZV (Z và trục thứ 5 V) */
export function rotate5D_ZV(p: Point5D, angle: number): Point5D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    ...p,
    z: p.z * cos - p.v * sin,
    v: p.z * sin + p.v * cos,
  };
}

/** Xoay quanh mặt phẳng WV (Trục thứ 4 W và Trục thứ 5 V) - Phép lộn ruột siêu chiều */
export function rotate5D_WV(p: Point5D, angle: number): Point5D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    ...p,
    w: p.w * cos - p.v * sin,
    v: p.w * sin + p.v * cos,
  };
}

// -------------------------------------------------------------------------
// 2. CHIẾU PHỐI CẢNH TỪ 5D VỀ 4D (5D to 4D PERSPECTIVE PROJECTION)
// -------------------------------------------------------------------------
export function project5DTo4D(
  p5: Point5D,
  dv: number = 2.5,
  scale: number = 100
): Projected5DResult {
  // Khoảng cách camera 5 chiều theo trục V
  const denom = dv - p5.v / scale;
  if (denom <= 0.05) {
    return {
      p4d: { x: p5.x, y: p5.y, z: p5.z, w: p5.w },
      vDepth: p5.v,
      visible: false,
    };
  }

  const factor = dv / denom;
  return {
    p4d: {
      x: p5.x * factor,
      y: p5.y * factor,
      z: p5.z * factor,
      w: p5.w * factor,
    },
    vDepth: p5.v / scale,
    visible: true,
  };
}

// -------------------------------------------------------------------------
// 3. CÁC SIÊU KHỐI ĐA DIỆN 5 CHIỀU (5D POLYTOPES)
// -------------------------------------------------------------------------

/**
 * 1. PENTERACT (5-CUBE / SIÊU LẬP PHƯƠNG 5 CHIỀU)
 * Gồm: 32 đỉnh, 80 cạnh, 80 mặt tứ giác, 40 khối lập phương 3D, 10 tesseract 4D
 */
export function makePenteract5D(size: number = 70): Shape3D {
  const s = size / 2;
  const vertices5D: Point5D[] = [];
  const edges: Edge[] = [];

  // Tạo 32 đỉnh từ tổ hợp nhị phân 5-bit (+-s, +-s, +-s, +-s, +-s)
  for (let i = 0; i < 32; i++) {
    const x = (i & 1) ? s : -s;
    const y = (i & 2) ? s : -s;
    const z = (i & 4) ? s : -s;
    const w = (i & 8) ? s : -s;
    const v = (i & 16) ? s : -s;
    vertices5D.push({ x, y, z, w, v });
  }

  // Nối cạnh giữa 2 đỉnh có khoảng cách Hamming = 1 (khác nhau đúng 1 chiều)
  for (let i = 0; i < 32; i++) {
    for (let bit = 0; bit < 5; bit++) {
      const neighbor = i ^ (1 << bit);
      if (neighbor > i) {
        edges.push([i, neighbor]);
      }
    }
  }

  // Khởi tạo tọa độ 3D tạm thời từ 3 trục đầu tiên
  const vertices: Point3D[] = vertices5D.map((p) => ({ x: p.x, y: p.y, z: p.z }));

  return {
    id: 'penteract-5d',
    name: 'Penteract 5D',
    nameVi: 'Siêu Lập Phương 5D (Penteract)',
    descriptionVi: '32 đỉnh • 80 cạnh • 10 Tesseract lộn ruột qua trục thứ 5 (V-Axis)',
    vertices,
    edges,
    is5D: true,
    vertices5D,
    hyperType5D: 'penteract',
  };
}

/**
 * 2. 5-SIMPLEX (HEXATERON / SIÊU TỨ DIỆN 5 CHIỀU)
 * Đa diện đều đơn giản nhất trong không gian 5 chiều
 * Gồm: 6 đỉnh (tất cả các cặp đỉnh đều nối với nhau), 15 cạnh
 */
export function make5Simplex(size: number = 100): Shape3D {
  const r = size;
  const vertices5D: Point5D[] = [];
  const edges: Edge[] = [];

  // Tọa độ 6 đỉnh đều trong 5D
  const a = 1 / Math.sqrt(2);
  const rawCoords = [
    [r, 0, 0, 0, 0],
    [-r / 5, r * Math.sqrt(24) / 5, 0, 0, 0],
    [-r / 5, -r * Math.sqrt(6) / 5, r * Math.sqrt(18) / 5, 0, 0],
    [-r / 5, -r * Math.sqrt(6) / 5, -r * Math.sqrt(2) / 5, r * 4 / 5, 0],
    [-r / 5, -r * Math.sqrt(6) / 5, -r * Math.sqrt(2) / 5, -r / 5, r * Math.sqrt(15) / 5],
    [-r / 5, -r * Math.sqrt(6) / 5, -r * Math.sqrt(2) / 5, -r / 5, -r * Math.sqrt(15) / 5],
  ];

  for (let i = 0; i < 6; i++) {
    const c = rawCoords[i];
    vertices5D.push({ x: c[0], y: c[1], z: c[2], w: c[3], v: c[4] });
  }

  // Nối tất cả các cặp đỉnh (C(6, 2) = 15 cạnh)
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) {
      edges.push([i, j]);
    }
  }

  const vertices: Point3D[] = vertices5D.map((p) => ({ x: p.x, y: p.y, z: p.z }));

  return {
    id: 'simplex-5d',
    name: '5-Simplex (Hexateron)',
    nameVi: 'Siêu Tứ Diện 5D (Hexateron)',
    descriptionVi: '6 đỉnh cách đều tuyệt đối trong R^5 • 15 cạnh liên kết toàn phần',
    vertices,
    edges,
    is5D: true,
    vertices5D,
    hyperType5D: '5-simplex',
  };
}

/**
 * 3. 5-ORTHOPLEX (TRIACONTADITERON / 5-CROSS POLYTOPE)
 * Khối đối ngẫu của Penteract 5D
 * Gồm: 10 đỉnh (2 đỉnh trên mỗi trục 5D), 40 cạnh
 */
export function make5Orthoplex(size: number = 110): Shape3D {
  const s = size;
  const vertices5D: Point5D[] = [
    { x: s, y: 0, z: 0, w: 0, v: 0 },
    { x: -s, y: 0, z: 0, w: 0, v: 0 },
    { x: 0, y: s, z: 0, w: 0, v: 0 },
    { x: 0, y: -s, z: 0, w: 0, v: 0 },
    { x: 0, y: 0, z: s, w: 0, v: 0 },
    { x: 0, y: 0, z: -s, w: 0, v: 0 },
    { x: 0, y: 0, z: 0, w: s, v: 0 },
    { x: 0, y: 0, z: 0, w: -s, v: 0 },
    { x: 0, y: 0, z: 0, w: 0, v: s },
    { x: 0, y: 0, z: 0, w: 0, v: -s },
  ];

  const edges: Edge[] = [];
  // Nối tất cả các đỉnh ngoại trừ 2 đỉnh đối xứng trên cùng 1 trục
  for (let i = 0; i < 10; i++) {
    for (let j = i + 1; j < 10; j++) {
      if (Math.floor(i / 2) !== Math.floor(j / 2)) {
        edges.push([i, j]);
      }
    }
  }

  const vertices: Point3D[] = vertices5D.map((p) => ({ x: p.x, y: p.y, z: p.z }));

  return {
    id: 'orthoplex-5d',
    name: '5-Orthoplex',
    nameVi: 'Siêu Bát Diện 5D (32 Mặt)',
    descriptionVi: '10 đỉnh đối xứng trên 5 trục (X, Y, Z, W, V) • 40 cạnh đối ngẫu',
    vertices,
    edges,
    is5D: true,
    vertices5D,
    hyperType5D: '5-orthoplex',
  };
}

/**
 * 4. KHỐI GỖ CON LẮC KÉP 5D (WOODEN DOUBLE PENDULUM 5D)
 * Mở rộng dao động phi tuyến hỗn loạn vào cả trục thứ 4 (W) và trục thứ 5 (V)!
 */
export function makeDoublePendulum5D(
  theta1: number = Math.PI / 2,
  theta2: number = Math.PI / 2 + 0.1,
  phi: number = 0,
  psi4D: number = 0,
  omega5D: number = 0,
  l1: number = 65,
  l2: number = 55
): Shape3D {
  const ox = 0, oy = -60, oz = 0, ow = 0, ov = 0;

  // Khớp 1 trong 5D
  const p1_3d_len = l1 * Math.sin(theta1);
  const b1x = ox + p1_3d_len * Math.cos(phi);
  const b1z = oz + p1_3d_len * Math.sin(phi);
  const b1y = oy + l1 * Math.cos(theta1);
  const b1w = Math.sin(psi4D) * l1 * 0.75;
  const b1v = Math.cos(omega5D) * l1 * 0.75;

  // Khớp 2 trong 5D
  const p2_3d_len = p1_3d_len + l2 * Math.sin(theta2);
  const b2x = ox + p2_3d_len * Math.cos(phi);
  const b2z = oz + p2_3d_len * Math.sin(phi);
  const b2y = b1y + l2 * Math.cos(theta2);
  const b2w = b1w + Math.sin(psi4D + 0.5) * l2 * 0.8;
  const b2v = b1v + Math.sin(omega5D + 0.8) * l2 * 0.8;

  const vertices5D: Point5D[] = [];
  const edges: Edge[] = [];
  const majorVertices: number[] = [];

  // Chân đế 5 chiều
  const baseSize = 25;
  for (let i = 0; i < 8; i++) {
    const bx = (i & 1) ? baseSize : -baseSize;
    const by = 65;
    const bz = (i & 2) ? baseSize : -baseSize;
    const bw = (i & 4) ? baseSize * 0.5 : -baseSize * 0.5;
    const bv = (i & 4) ? baseSize * 0.3 : -baseSize * 0.3;
    vertices5D.push({ x: bx, y: by, z: bz, w: bw, v: bv });
  }
  edges.push(
    [0, 1], [1, 3], [3, 2], [2, 0],
    [4, 5], [5, 7], [7, 6], [6, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  );

  // Gốc quay O
  const pivotIdx = vertices5D.length;
  vertices5D.push({ x: ox, y: oy, z: oz, w: ow, v: ov });
  majorVertices.push(pivotIdx);

  // Thanh 1 (O -> B1)
  const b1Idx = vertices5D.length;
  vertices5D.push({ x: b1x, y: b1y, z: b1z, w: b1w, v: b1v });
  edges.push([pivotIdx, b1Idx]);
  majorVertices.push(b1Idx);

  // Thanh 2 (B1 -> B2)
  const b2Idx = vertices5D.length;
  vertices5D.push({ x: b2x, y: b2y, z: b2z, w: b2w, v: b2v });
  edges.push([b1Idx, b2Idx]);
  majorVertices.push(b2Idx);

  // Thêm lồng Hyper-Prism 5D tại đầu thanh 2 (quỹ đạo lộn nhào 5D)
  const r2 = 18;
  const prismStart = vertices5D.length;
  vertices5D.push(
    { x: b2x + r2, y: b2y, z: b2z, w: b2w, v: b2v + r2 },
    { x: b2x - r2, y: b2y, z: b2z, w: b2w, v: b2v + r2 },
    { x: b2x, y: b2y + r2, z: b2z, w: b2w, v: b2v - r2 },
    { x: b2x, y: b2y - r2, z: b2z, w: b2w, v: b2v - r2 },
    { x: b2x, y: b2y, z: b2z + r2, w: b2w + r2, v: b2v },
    { x: b2x, y: b2y, z: b2z - r2, w: b2w - r2, v: b2v }
  );
  for (let i = 0; i < 6; i++) {
    edges.push([b2Idx, prismStart + i]);
  }
  edges.push(
    [prismStart + 0, prismStart + 2],
    [prismStart + 1, prismStart + 2],
    [prismStart + 2, prismStart + 4],
    [prismStart + 3, prismStart + 5],
    [prismStart + 4, prismStart + 5]
  );

  const vertices: Point3D[] = vertices5D.map((p) => ({ x: p.x, y: p.y, z: p.z }));

  return {
    id: 'double-pendulum-5d',
    name: 'Wooden Double Pendulum 5D',
    nameVi: 'Khối Gỗ Con Lắc Kép 5D (Siêu Không Gian)',
    descriptionVi: 'Quỹ đạo hỗn loạn xuyên 5 chiều • Lộn nhào đồng thời qua trục W & trục V',
    vertices,
    edges,
    is5D: true,
    vertices5D,
    majorVertices,
    hyperType5D: 'pendulum-5d',
  };
}

/**
 * 5. KHỐI 5D THIÊN LONG (5D HYPER-PENTERACT THIÊN LONG)
 * Mở rộng tượng đài Thiên Long vào không gian 5 chiều:
 * 4 tầng siêu tọa độ giao thoa qua trục thứ 4 (W) và trục thứ 5 (V)
 */
export function makeThienLong5D(): Shape3D {
  const baseShape = makeThienLong3D();
  const baseCount = baseShape.vertices.length;

  let maxR = 1;
  for (const v of baseShape.vertices) {
    const r = Math.hypot(v.x, v.y, v.z);
    if (r > maxR) maxR = r;
  }
  const norm = 1.05 / maxR;

  const vertices5D: Point5D[] = [];
  const edges: Edge[] = [];

  const hyperCoords = [
    { w: -0.55, v: -0.55 },
    { w: 0.55, v: -0.55 },
    { w: -0.55, v: 0.55 },
    { w: 0.55, v: 0.55 },
  ];

  for (let k = 0; k < 4; k++) {
    const { w, v } = hyperCoords[k];
    for (const pt of baseShape.vertices) {
      vertices5D.push({
        x: pt.x * norm,
        y: pt.y * norm,
        z: pt.z * norm,
        w,
        v,
      });
    }

    const offset = k * baseCount;
    for (const [a, b] of baseShape.edges) {
      if (a < baseCount && b < baseCount) {
        edges.push([a + offset, b + offset]);
      }
    }
  }

  // Siêu liên kết trục W (0 <-> 1 và 2 <-> 3)
  const stepW = baseCount > 150 ? 2 : 1;
  for (let i = 0; i < baseCount; i += stepW) {
    edges.push([i, i + baseCount]);
    edges.push([i + 2 * baseCount, i + 3 * baseCount]);
  }

  // Siêu liên kết trục V (0 <-> 2 và 1 <-> 3)
  const stepV = baseCount > 150 ? 2 : 1;
  for (let i = 0; i < baseCount; i += stepV) {
    edges.push([i, i + 2 * baseCount]);
    edges.push([i + baseCount, i + 3 * baseCount]);
  }

  // Giằng chéo siêu chiều
  for (let i = 0; i < baseCount; i += 6) {
    edges.push([i, ((i + 5) % baseCount) + 3 * baseCount]);
  }

  const vertices: Point3D[] = vertices5D.map((p) => ({ x: p.x, y: p.y, z: p.z }));

  return {
    id: 'thien-long-5d',
    name: 'Thiên Long 5D Hyper-Penteract',
    nameVi: 'Khối 5D THIÊN LONG',
    descriptionVi: `Khối siêu chiều 5D THIÊN LONG (Người làm ra) • ${vertices5D.length} đỉnh 5D • 4 tầng siêu chiều lộn ruột qua trục W & V • Equinox Theme!`,
    vertices,
    edges,
    is5D: true,
    vertices5D,
    hyperType5D: 'penteract',
  };
}

/**
 * 6. KHỐI 5D THÀNH TÀI (5D HYPER-MATRIX THÀNH TÀI)
 * Ma trận thuộc tính 5 chiều
 */
export function makeThanhTai5D(): Shape3D {
  const baseShape = makeThanhTai3D();
  const baseCount = baseShape.vertices.length;

  let maxR = 1;
  for (const v of baseShape.vertices) {
    const r = Math.hypot(v.x, v.y, v.z);
    if (r > maxR) maxR = r;
  }
  const norm = 1.05 / maxR;

  const vertices5D: Point5D[] = [];
  const edges: Edge[] = [];

  const hyperCoords = [
    { w: -0.55, v: -0.55 },
    { w: 0.55, v: -0.55 },
    { w: -0.55, v: 0.55 },
    { w: 0.55, v: 0.55 },
  ];

  for (let k = 0; k < 4; k++) {
    const { w, v } = hyperCoords[k];
    for (const pt of baseShape.vertices) {
      vertices5D.push({
        x: pt.x * norm,
        y: pt.y * norm,
        z: pt.z * norm,
        w,
        v,
      });
    }

    const offset = k * baseCount;
    for (const [a, b] of baseShape.edges) {
      if (a < baseCount && b < baseCount) {
        edges.push([a + offset, b + offset]);
      }
    }
  }

  const step = baseCount > 150 ? 2 : 1;
  for (let i = 0; i < baseCount; i += step) {
    edges.push([i, i + baseCount]);
    edges.push([i + 2 * baseCount, i + 3 * baseCount]);
    edges.push([i, i + 2 * baseCount]);
    edges.push([i + baseCount, i + 3 * baseCount]);
  }

  for (let i = 0; i < baseCount; i += 7) {
    edges.push([i, ((i + 7) % baseCount) + 3 * baseCount]);
  }

  const vertices: Point3D[] = vertices5D.map((p) => ({ x: p.x, y: p.y, z: p.z }));

  return {
    id: 'thanh-tai-5d',
    name: 'Thành Tài 5D Hyper-Matrix',
    nameVi: 'Khối 5D THÀNH TÀI',
    descriptionVi: `Khối siêu chiều 5D THÀNH TÀI (Ý tưởng) • ${vertices5D.length} đỉnh 5D • Ma trận thuộc tính 5D đa tầng • Attribute Theme!`,
    vertices,
    edges,
    is5D: true,
    vertices5D,
    hyperType5D: 'penteract',
  };
}

/**
 * 7. ĐẠI TƯỢNG ĐÀI SONG HÙNG 5D (THIÊN LONG × THÀNH TÀI)
 */
export function makeDualCreators5D(): Shape3D {
  const baseShape = makeDualCreators3D();
  const baseCount = baseShape.vertices.length;

  let maxR = 1;
  for (const v of baseShape.vertices) {
    const r = Math.hypot(v.x, v.y, v.z);
    if (r > maxR) maxR = r;
  }
  const norm = 1.05 / maxR;

  const vertices5D: Point5D[] = [];
  const edges: Edge[] = [];

  // Tầng 1: W = -0.5, V = -0.5
  // Tầng 2: W = +0.5, V = +0.5
  // Tầng 3: W = +0.5, V = -0.5
  // Tầng 4: W = -0.5, V = +0.5
  const hyperCoords = [
    { w: -0.5, v: -0.5 },
    { w: 0.5, v: 0.5 },
    { w: 0.5, v: -0.5 },
    { w: -0.5, v: 0.5 },
  ];

  for (let k = 0; k < 4; k++) {
    const { w, v } = hyperCoords[k];
    for (const pt of baseShape.vertices) {
      vertices5D.push({
        x: pt.x * norm,
        y: pt.y * norm,
        z: pt.z * norm,
        w,
        v,
      });
    }

    const offset = k * baseCount;
    for (const [a, b] of baseShape.edges) {
      if (a < baseCount && b < baseCount) {
        edges.push([a + offset, b + offset]);
      }
    }
  }

  const step = baseCount > 200 ? 3 : 2;
  for (let i = 0; i < baseCount; i += step) {
    edges.push([i, i + baseCount]);
    edges.push([i + 2 * baseCount, i + 3 * baseCount]);
    edges.push([i, i + 2 * baseCount]);
    edges.push([i + baseCount, i + 3 * baseCount]);
  }

  const vertices: Point3D[] = vertices5D.map((p) => ({ x: p.x, y: p.y, z: p.z }));

  return {
    id: 'dual-creators-5d',
    name: 'Song Hùng 5D Hyper-Duality',
    nameVi: 'SONG HÙNG 5D (Thiên Long × Thành Tài)',
    descriptionVi: 'Liên minh Song Hùng chuyển động đồng thời qua 5 trục không gian (X, Y, Z, W, V) • Equinox Theme!',
    vertices,
    edges,
    is5D: true,
    vertices5D,
    hyperType5D: 'penteract',
  };
}

