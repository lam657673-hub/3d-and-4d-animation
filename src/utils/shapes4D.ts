import { Edge, Point3D, Point4D, Shape3D } from '../types';

// =========================================================================
// 4D ROTATION MATHEMATICS
// In 4-dimensional Euclidean space, rotations occur in planes (XW, YW, ZW, XY, YZ, XZ)
// =========================================================================

export function rotate4D_XW(p: Point4D, angle: number): Point4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x * cos - p.w * sin,
    y: p.y,
    z: p.z,
    w: p.x * sin + p.w * cos,
  };
}

export function rotate4D_YW(p: Point4D, angle: number): Point4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x,
    y: p.y * cos - p.w * sin,
    z: p.z,
    w: p.y * sin + p.w * cos,
  };
}

export function rotate4D_ZW(p: Point4D, angle: number): Point4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x,
    y: p.y,
    z: p.z * cos - p.w * sin,
    w: p.z * sin + p.w * cos,
  };
}

export function rotate4D_XY(p: Point4D, angle: number): Point4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
    z: p.z,
    w: p.w,
  };
}

export function rotate4D_YZ(p: Point4D, angle: number): Point4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x,
    y: p.y * cos - p.z * sin,
    z: p.y * sin + p.z * cos,
    w: p.w,
  };
}

export function rotate4D_XZ(p: Point4D, angle: number): Point4D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x * cos - p.z * sin,
    y: p.y,
    z: p.x * sin + p.z * cos,
    w: p.w,
  };
}

// Combined 4D transform applying requested hyper-plane rotations
export function transformPoint4D(
  p: Point4D,
  angles: { xw: number; yw: number; zw: number; xy?: number; yz?: number; xz?: number }
): Point4D {
  let curr = p;
  if (angles.xw !== 0) curr = rotate4D_XW(curr, angles.xw);
  if (angles.yw !== 0) curr = rotate4D_YW(curr, angles.yw);
  if (angles.zw !== 0) curr = rotate4D_ZW(curr, angles.zw);
  if (angles.xy && angles.xy !== 0) curr = rotate4D_XY(curr, angles.xy);
  if (angles.yz && angles.yz !== 0) curr = rotate4D_YZ(curr, angles.yz);
  if (angles.xz && angles.xz !== 0) curr = rotate4D_XZ(curr, angles.xz);
  return curr;
}

// =========================================================================
// 4D TO 3D STEREOGRAPHIC / PERSPECTIVE PROJECTION
// Projects a 4-dimensional point (x, y, z, w) down to 3D space (x, y, z)
// Camera is placed at distance Dw along the W axis.
// =========================================================================
export function project4DTo3D(
  p: Point4D,
  distanceW = 2.2,
  scale = 100,
  sliceW = 0
): { p3d: Point3D; wDepth: number; visible: boolean } {
  const effW = p.w + sliceW;
  const denom = distanceW - effW;

  if (denom <= 0.1) {
    // Point is at or behind 4D focal horizon
    return {
      p3d: { x: p.x * scale, y: p.y * scale, z: p.z * scale },
      wDepth: effW,
      visible: false,
    };
  }

  const factor = distanceW / denom;
  return {
    p3d: {
      x: p.x * factor * scale,
      y: p.y * factor * scale,
      z: p.z * factor * scale,
    },
    wDepth: effW,
    visible: true,
  };
}

// Initial projection helper to populate standard 3D vertices array
export function initialProject4DList(vertices4D: Point4D[], scale = 95, distanceW = 2.2): Point3D[] {
  return vertices4D.map((p) => project4DTo3D(p, distanceW, scale).p3d);
}

// =========================================================================
// 4D POLYCHORA GENERATORS (HÌNH SIÊU KHÔNG GIAN 4D)
// =========================================================================

/**
 * 1. TESSERACT (HYPERCUBE / 8-CELL / SIÊU LẬP PHƯƠNG 4D)
 * 16 đỉnh (±1, ±1, ±1, ±1), 32 cạnh, 8 khối lập phương 3D tế bào.
 * Khi xoay quanh mặt phẳng XW/YW, ruột trong lộn ra ngoài cực kỳ ảo diệu!
 */
export function makeTesseract(size = 85): Shape3D {
  const vertices4D: Point4D[] = [];
  const coords = [-1, 1];

  for (let x of coords) {
    for (let y of coords) {
      for (let z of coords) {
        for (let w of coords) {
          vertices4D.push({ x, y, z, w });
        }
      }
    }
  }

  const edges: Edge[] = [];
  const n = vertices4D.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v1 = vertices4D[i];
      const v2 = vertices4D[j];
      // Vertices share an edge in a hypercube if they differ in exactly ONE coordinate
      let diffCount = 0;
      if (v1.x !== v2.x) diffCount++;
      if (v1.y !== v2.y) diffCount++;
      if (v1.z !== v2.z) diffCount++;
      if (v1.w !== v2.w) diffCount++;

      if (diffCount === 1) {
        edges.push([i, j]);
      }
    }
  }

  const vertices3D = initialProject4DList(vertices4D, size, 2.2);

  return {
    id: 'tesseract-4d',
    name: 'Tesseract 4D',
    nameVi: 'Siêu Lập Phương (Tesseract)',
    descriptionVi: '16 đỉnh, 32 cạnh, 8 tế bào lập phương 3D liên kết trong chiều W',
    vertices: vertices3D,
    edges,
    is4D: true,
    vertices4D,
    cells4DCount: 8,
    hyperType: 'tesseract',
  };
}

/**
 * 2. 24-CELL (ICOSITETRACHORON / KHỐI 24 MẶT ĐỘC BẢN 4D)
 * Khối đa diện đều huyền thoại CHỈ TỒN TẠI trong không gian 4 chiều (không có ở 3D hay 5D+).
 * 24 đỉnh, 96 cạnh, 24 tế bào bát diện đều đối xứng tuyệt mỹ.
 */
export function make24Cell(size = 95): Shape3D {
  const vertices4D: Point4D[] = [];

  // Nhóm 1: 8 đỉnh dạng hoán vị (±1, 0, 0, 0)
  const axes = ['x', 'y', 'z', 'w'] as const;
  for (const axis of axes) {
    for (const sign of [-1, 1]) {
      const p: Point4D = { x: 0, y: 0, z: 0, w: 0 };
      p[axis] = sign;
      vertices4D.push(p);
    }
  }

  // Nhóm 2: 16 đỉnh dạng (±0.5, ±0.5, ±0.5, ±0.5)
  const h = 0.5;
  for (let x of [-h, h]) {
    for (let y of [-h, h]) {
      for (let z of [-h, h]) {
        for (let w of [-h, h]) {
          vertices4D.push({ x, y, z, w });
        }
      }
    }
  }

  const edges: Edge[] = [];
  const n = vertices4D.length;

  // Cạnh nối giữa các đỉnh có khoảng cách Euclid xấp xỉ 1.0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v1 = vertices4D[i];
      const v2 = vertices4D[j];
      const dx = v1.x - v2.x;
      const dy = v1.y - v2.y;
      const dz = v1.z - v2.z;
      const dw = v1.w - v2.w;
      const distSq = dx * dx + dy * dy + dz * dz + dw * dw;

      if (Math.abs(distSq - 1.0) < 0.05) {
        edges.push([i, j]);
      }
    }
  }

  const vertices3D = initialProject4DList(vertices4D, size, 2.2);

  return {
    id: '24-cell-4d',
    name: '24-Cell (Icositetrachoron)',
    nameVi: 'Khối 24 Mặt Độc Bản 4D',
    descriptionVi: '24 đỉnh, 96 cạnh đối xứng hoàn mỹ — Đa diện đặc hữu của chiều 4',
    vertices: vertices3D,
    edges,
    is4D: true,
    vertices4D,
    cells4DCount: 24,
    hyperType: '24-cell',
  };
}

/**
 * 3. 16-CELL (HEXADECACHORON / SIÊU BÁT DIỆN 4D)
 * Đối ngẫu (dual) của Tesseract trong không gian 4 chiều.
 * 8 đỉnh, 24 cạnh, 16 tế bào tứ diện đều.
 */
export function make16Cell(size = 110): Shape3D {
  const vertices4D: Point4D[] = [
    { x: 1, y: 0, z: 0, w: 0 },
    { x: -1, y: 0, z: 0, w: 0 },
    { x: 0, y: 1, z: 0, w: 0 },
    { x: 0, y: -1, z: 0, w: 0 },
    { x: 0, y: 0, z: 1, w: 0 },
    { x: 0, y: 0, z: -1, w: 0 },
    { x: 0, y: 0, z: 0, w: 1 },
    { x: 0, y: 0, z: 0, w: -1 },
  ];

  const edges: Edge[] = [];
  const n = vertices4D.length;

  // Nối mọi cặp đỉnh ngoại trừ cặp đối đỉnh (v1 = -v2)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v1 = vertices4D[i];
      const v2 = vertices4D[j];
      const isAntipodal =
        v1.x === -v2.x && v1.y === -v2.y && v1.z === -v2.z && v1.w === -v2.w;
      if (!isAntipodal) {
        edges.push([i, j]);
      }
    }
  }

  const vertices3D = initialProject4DList(vertices4D, size, 2.2);

  return {
    id: '16-cell-4d',
    name: '16-Cell (Hexadecachoron)',
    nameVi: 'Siêu Bát Diện 16 Mặt 4D',
    descriptionVi: '8 đỉnh, 24 cạnh, đối ngẫu của Tesseract với 16 khối tứ diện',
    vertices: vertices3D,
    edges,
    is4D: true,
    vertices4D,
    cells4DCount: 16,
    hyperType: '16-cell',
  };
}

/**
 * 4. 5-CELL (PENTACHORON / 4-SIMPLEX / SIÊU TỨ DIỆN 4D)
 * Đơn giản nhất trong các khối 4D đều (tương đương tứ diện ở 3D, tam giác ở 2D).
 * 5 đỉnh liên kết toàn phần (đồ thị K5), 10 cạnh, 5 tế bào tứ diện.
 */
export function make5Cell(size = 115): Shape3D {
  const a = 1 / Math.sqrt(5);
  const vertices4D: Point4D[] = [
    { x: 1, y: 1, z: 1, w: -a },
    { x: 1, y: -1, z: -1, w: -a },
    { x: -1, y: 1, z: -1, w: -a },
    { x: -1, y: -1, z: 1, w: -a },
    { x: 0, y: 0, z: 0, w: Math.sqrt(5) - a },
  ];

  // Chuẩn hóa kích thước
  const normalized4D: Point4D[] = vertices4D.map((p) => {
    const len = Math.hypot(p.x, p.y, p.z, p.w);
    return {
      x: p.x / len,
      y: p.y / len,
      z: p.z / len,
      w: p.w / len,
    };
  });

  const edges: Edge[] = [];
  // Nối tất cả các cặp đỉnh với nhau (Complete Graph K5)
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      edges.push([i, j]);
    }
  }

  const vertices3D = initialProject4DList(normalized4D, size, 2.2);

  return {
    id: '5-cell-4d',
    name: '5-Cell (Pentachoron)',
    nameVi: 'Siêu Tứ Diện 4D (5-Cell)',
    descriptionVi: '5 đỉnh, 10 cạnh nối trọn vẹn — Khối đơn hình cơ sở của không gian 4 chiều',
    vertices: vertices3D,
    edges,
    is4D: true,
    vertices4D: normalized4D,
    cells4DCount: 5,
    hyperType: '5-cell',
  };
}

/**
 * 5. CLIFFORD TORUS 4D (VÒNG XUYẾN LƯỢNG TỬ 4D)
 * Nhúng phẳng vào mặt cầu đơn vị S^3 trong R^4: (r1 cos u, r1 sin u, r2 cos v, r2 sin v).
 * Trong 4D hình xuyến này không hề bị kéo giãn hay tự cắt nhau.
 */
export function makeCliffordTorus4D(segsU = 14, segsV = 14, size = 95): Shape3D {
  const vertices4D: Point4D[] = [];
  const edges: Edge[] = [];
  const r = 0.7071; // 1 / sqrt(2) để nằm trên S^3

  for (let i = 0; i < segsU; i++) {
    const u = (i / segsU) * Math.PI * 2;
    for (let j = 0; j < segsV; j++) {
      const v = (j / segsV) * Math.PI * 2;
      vertices4D.push({
        x: r * Math.cos(u),
        y: r * Math.sin(u),
        z: r * Math.cos(v),
        w: r * Math.sin(v),
      });

      const curr = i * segsV + j;
      const nextU = ((i + 1) % segsU) * segsV + j;
      const nextV = i * segsV + ((j + 1) % segsV);

      edges.push([curr, nextU]);
      edges.push([curr, nextV]);
    }
  }

  const vertices3D = initialProject4DList(vertices4D, size, 2.2);

  return {
    id: 'clifford-torus-4d',
    name: 'Clifford Torus 4D',
    nameVi: 'Vòng Xuyến Clifford 4D',
    descriptionVi: `${vertices4D.length} đỉnh, ${edges.length} sợi lượng tử không bao giờ tự giao nhau`,
    vertices: vertices3D,
    edges,
    is4D: true,
    vertices4D,
    cells4DCount: segsU * segsV,
    hyperType: 'clifford-torus',
  };
}

/**
 * 6. EXTRUDE 3D SHAPE INTO 4D HYPERPRISM
 * Biến bất kỳ hình 3D nào (kể cả nét vẽ tay) thành lăng trụ 4 chiều:
 * Nhân bản 3D ở w = -d và w = +d, rồi nối các đỉnh tương ứng dọc theo trục W!
 */
export function extrudeShapeTo4D(shape3D: Shape3D, depthW = 0.65): Shape3D {
  const baseCount = shape3D.vertices.length;
  const vertices4D: Point4D[] = [];
  const edges: Edge[] = [];

  // Lấy scale chuẩn của khối gốc
  let maxR = 1;
  for (const v of shape3D.vertices) {
    const r = Math.hypot(v.x, v.y, v.z);
    if (r > maxR) maxR = r;
  }
  const normScale = 1 / maxR;

  // Lớp 1: w = -depthW
  for (const v of shape3D.vertices) {
    vertices4D.push({
      x: v.x * normScale,
      y: v.y * normScale,
      z: v.z * normScale,
      w: -depthW,
    });
  }

  // Lớp 2: w = +depthW
  for (const v of shape3D.vertices) {
    vertices4D.push({
      x: v.x * normScale,
      y: v.y * normScale,
      z: v.z * normScale,
      w: depthW,
    });
  }

  // Cạnh lớp 1
  for (const [a, b] of shape3D.edges) {
    if (a < baseCount && b < baseCount) {
      edges.push([a, b]);
    }
  }

  // Cạnh lớp 2 (tịnh tiến chỉ số theo baseCount)
  for (const [a, b] of shape3D.edges) {
    if (a < baseCount && b < baseCount) {
      edges.push([a + baseCount, b + baseCount]);
    }
  }

  // Các cạnh siêu nối dọc theo trục W
  for (let i = 0; i < baseCount; i++) {
    edges.push([i, i + baseCount]);
  }

  const vertices3D = initialProject4DList(vertices4D, 90, 2.2);

  return {
    id: `hyperprism-${shape3D.id}`,
    name: `4D ${shape3D.name} Hyper-Prism`,
    nameVi: `Siêu Lăng Trụ 4D: ${shape3D.nameVi}`,
    descriptionVi: `Nhân bản sang chiều không gian W: ${vertices4D.length} đỉnh, ${edges.length} cạnh`,
    vertices: vertices3D,
    edges,
    is4D: true,
    vertices4D,
    hyperType: 'hyperprism',
  };
}
