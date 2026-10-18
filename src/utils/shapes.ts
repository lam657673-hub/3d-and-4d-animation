import { Edge, Point2D, Point3D, Shape3D, RenderTheme } from '../types';

export const COLOR_THEMES: RenderTheme[] = [
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    lineColor: '#00ffcc',
    glowColor: 'rgba(0, 255, 204, 0.4)',
    vertexColor: '#ffffff',
    accentColor: '#00ffcc',
  },
  {
    id: 'neon-emerald',
    name: 'Neon Matrix',
    lineColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    vertexColor: '#a7f3d0',
    accentColor: '#10b981',
  },
  {
    id: 'electric-amber',
    name: 'Electric Amber',
    lineColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    vertexColor: '#fef3c7',
    accentColor: '#f59e0b',
  },
  {
    id: 'synth-violet',
    name: 'Synthwave Purple',
    lineColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    vertexColor: '#f3e8ff',
    accentColor: '#a855f7',
  },
  {
    id: 'hyper-rose',
    name: 'Laser Rose',
    lineColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    vertexColor: '#ffe4e6',
    accentColor: '#f43f5e',
  },
  {
    id: 'pure-mono',
    name: 'Blueprint Mono',
    lineColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.3)',
    vertexColor: '#e0f2fe',
    accentColor: '#38bdf8',
  },
];

// 1. Lập phương (Cube)
export function makeCube(size = 120): Shape3D {
  const s = size / 2;
  const vertices: Point3D[] = [
    { x: -s, y: -s, z: -s },
    { x: s, y: -s, z: -s },
    { x: s, y: s, z: -s },
    { x: -s, y: s, z: -s },
    { x: -s, y: -s, z: s },
    { x: s, y: -s, z: s },
    { x: s, y: s, z: s },
    { x: -s, y: s, z: s },
  ];
  const edges: Edge[] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const faces: number[][] = [
    [0, 1, 2, 3], // Mặt trước (Z-)
    [5, 4, 7, 6], // Mặt sau (Z+)
    [4, 0, 3, 7], // Mặt trái (X-)
    [1, 5, 6, 2], // Mặt phải (X+)
    [4, 5, 1, 0], // Mặt trên (Y-)
    [3, 2, 6, 7], // Mặt dưới (Y+)
  ];
  return {
    id: 'cube',
    name: 'Cube',
    nameVi: 'Lập phương',
    descriptionVi: '8 đỉnh, 12 cạnh đối xứng hoàn hảo',
    vertices,
    edges,
    faces,
  };
}

// 2. Hình chóp (Pyramid)
export function makePyramid(size = 140): Shape3D {
  const half = size / 2;
  const vertices: Point3D[] = [
    { x: -half, y: half, z: -half },
    { x: half, y: half, z: -half },
    { x: half, y: half, z: half },
    { x: -half, y: half, z: half },
    { x: 0, y: -half * 1.2, z: 0 }, // đỉnh chóp
  ];
  const edges: Edge[] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 0], [4, 1], [4, 2], [4, 3],
  ];
  const faces: number[][] = [
    [0, 1, 2, 3], // Đáy tứ giác
    [0, 1, 4],    // Mặt bên 1
    [1, 2, 4],    // Mặt bên 2
    [2, 3, 4],    // Mặt bên 3
    [3, 0, 4],    // Mặt bên 4
  ];
  return {
    id: 'pyramid',
    name: 'Pyramid',
    nameVi: 'Hình chóp',
    descriptionVi: 'Đáy tứ giác với đỉnh đối xứng',
    vertices,
    edges,
    faces,
  };
}

// 3. Bát diện đều (Octahedron)
export function makeOctahedron(size = 140): Shape3D {
  const half = size / 2;
  const vertices: Point3D[] = [
    { x: half, y: 0, z: 0 },
    { x: -half, y: 0, z: 0 },
    { x: 0, y: half, z: 0 },
    { x: 0, y: -half, z: 0 },
    { x: 0, y: 0, z: half },
    { x: 0, y: 0, z: -half },
  ];
  const edges: Edge[] = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [2, 5], [3, 4], [3, 5],
  ];
  const faces: number[][] = [
    [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
    [0, 2, 5], [2, 1, 5], [1, 3, 5], [3, 0, 5],
  ];
  return {
    id: 'octahedron',
    name: 'Octahedron',
    nameVi: 'Bát diện',
    descriptionVi: '8 mặt tam giác đều, 6 đỉnh nhọn',
    vertices,
    edges,
    faces,
  };
}

// 4. Nhị thập diện (Icosahedron)
export function makeIcosahedron(size = 120): Shape3D {
  const phi = (1 + Math.sqrt(5)) / 2;
  const s = size / 2;
  const scale = s / Math.sqrt(1 + phi * phi);

  const v: Point3D[] = [
    { x: -1 * scale, y: phi * scale, z: 0 },
    { x: 1 * scale, y: phi * scale, z: 0 },
    { x: -1 * scale, y: -phi * scale, z: 0 },
    { x: 1 * scale, y: -phi * scale, z: 0 },

    { x: 0, y: -1 * scale, z: phi * scale },
    { x: 0, y: 1 * scale, z: phi * scale },
    { x: 0, y: -1 * scale, z: -phi * scale },
    { x: 0, y: 1 * scale, z: -phi * scale },

    { x: phi * scale, y: 0, z: -1 * scale },
    { x: phi * scale, y: 0, z: 1 * scale },
    { x: -phi * scale, y: 0, z: -1 * scale },
    { x: -phi * scale, y: 0, z: 1 * scale },
  ];

  const edges: Edge[] = [
    [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
    [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
    [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
    [9, 4], [4, 2], [2, 6], [6, 8], [8, 9],
    [4, 5], [5, 9], [9, 1], [1, 8], [8, 7],
    [7, 6], [6, 10], [10, 2], [2, 11], [11, 4]
  ];

  return {
    id: 'icosahedron',
    name: 'Icosahedron',
    nameVi: 'Khối 20 mặt',
    descriptionVi: '20 mặt tam giác vàng điều hòa',
    vertices: v,
    edges,
  };
}

// 5. Vòng xuyến (Torus wireframe)
export function makeTorus(r1 = 80, r2 = 30, seg1 = 12, seg2 = 8): Shape3D {
  const vertices: Point3D[] = [];
  const edges: Edge[] = [];

  for (let i = 0; i < seg1; i++) {
    const u = (i / seg1) * Math.PI * 2;
    for (let j = 0; j < seg2; j++) {
      const v = (j / seg2) * Math.PI * 2;
      const x = (r1 + r2 * Math.cos(v)) * Math.cos(u);
      const y = (r1 + r2 * Math.cos(v)) * Math.sin(u);
      const z = r2 * Math.sin(v);
      vertices.push({ x, y, z });

      const curr = i * seg2 + j;
      const nextU = ((i + 1) % seg1) * seg2 + j;
      const nextV = i * seg2 + ((j + 1) % seg2);

      edges.push([curr, nextU]);
      edges.push([curr, nextV]);
    }
  }

  return {
    id: 'torus',
    name: 'Torus',
    nameVi: 'Vòng xuyến (Donut)',
    descriptionVi: 'Hình xuyến cong đa chiều',
    vertices,
    edges,
  };
}

// 6. Mạng Lưới Lượng Tử Siêu Phức Tạp (Quantum Neural Plexus / Hyper Polytope)
// Mô phỏng chính xác mạng lưới chùm đa diện thần kinh với hàng ngàn sợi liên kết dày đặc,
// các đỉnh vòng tròn (ring hubs), cụm lõi trung tâm và hạt vệ tinh (satellites)
export function makeQuantumPlexus(): Shape3D {
  const vertices: Point3D[] = [];
  const edges: Edge[] = [];
  const majorVertices: number[] = [];

  // Deterministic PRNG for consistent, beautiful geometric distribution
  let seed = 42891;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // 1. Outer Polyhedral Envelope (Golden ratio icosahedral frame + stellated apices)
  const phi = (1 + Math.sqrt(5)) / 2;
  const baseScale = 110;
  const baseIco: Point3D[] = [
    { x: -1, y: phi, z: 0 },
    { x: 1, y: phi, z: 0 },
    { x: -1, y: -phi, z: 0 },
    { x: 1, y: -phi, z: 0 },
    { x: 0, y: -1, z: phi },
    { x: 0, y: 1, z: phi },
    { x: 0, y: -1, z: -phi },
    { x: 0, y: 1, z: -phi },
    { x: phi, y: 0, z: -1 },
    { x: phi, y: 0, z: 1 },
    { x: -phi, y: 0, z: -1 },
    { x: -phi, y: 0, z: 1 },
  ].map((p) => {
    const len = Math.hypot(p.x, p.y, p.z);
    // Slight organic asymmetry matching reference sketch
    const r = baseScale * (1 + (rnd() - 0.5) * 0.18);
    return { x: (p.x / len) * r, y: (p.y / len) * r, z: (p.z / len) * r };
  });

  const outerStartIndex = vertices.length;
  baseIco.forEach((p) => vertices.push(p));

  // Outer major anchor hubs (will render with distinctive celestial rings like the image)
  majorVertices.push(0, 3, 5, 8, 11);

  // 2. Stellated Facet Apices (outer prominent peaks)
  const stellatedOffsets: Point3D[] = [
    { x: 0, y: 165, z: 30 },
    { x: 155, y: 80, z: -40 },
    { x: -160, y: 70, z: -30 },
    { x: -140, y: -90, z: 45 },
    { x: 130, y: -110, z: 60 },
    { x: 0, y: -175, z: -20 },
    { x: 60, y: 20, z: 155 },
    { x: -70, y: -30, z: -160 },
  ];
  stellatedOffsets.forEach((p) => {
    majorVertices.push(vertices.length);
    vertices.push(p);
  });

  // 3. Dense Inner Core Cluster (Nucleus of the neural plexus, r ~ 30..65)
  const coreCount = 28;
  const coreStartIndex = vertices.length;
  for (let i = 0; i < coreCount; i++) {
    const u = rnd();
    const v = rnd();
    const theta = u * 2.0 * Math.PI;
    const phiAngle = Math.acos(2.0 * v - 1.0);
    const r = 25 + rnd() * 45;
    const sinPhi = Math.sin(phiAngle);
    vertices.push({
      x: r * sinPhi * Math.cos(theta),
      y: r * sinPhi * Math.sin(theta),
      z: r * Math.cos(phiAngle),
    });
  }

  // 4. Intermediate Strut Nodes (along chords and boundaries)
  const strutCount = 42;
  const strutStartIndex = vertices.length;
  for (let i = 0; i < strutCount; i++) {
    // Pick two existing vertices and interpolate with slight displacement
    const idxA = Math.floor(rnd() * coreStartIndex);
    const idxB = coreStartIndex + Math.floor(rnd() * coreCount);
    const t = 0.25 + rnd() * 0.5;
    const va = vertices[idxA];
    const vb = vertices[idxB];
    const jitter = 14;
    vertices.push({
      x: va.x * (1 - t) + vb.x * t + (rnd() - 0.5) * jitter,
      y: va.y * (1 - t) + vb.y * t + (rnd() - 0.5) * jitter,
      z: va.z * (1 - t) + vb.z * t + (rnd() - 0.5) * jitter,
    });
  }

  // 5. Orbiting Satellite Nodes / Micro Dust (floating outside hull with thin filaments)
  const satelliteCount = 28;
  const satelliteStartIndex = vertices.length;
  for (let i = 0; i < satelliteCount; i++) {
    const anchorIdx = Math.floor(rnd() * 20);
    const anchor = vertices[anchorIdx];
    const dist = 20 + rnd() * 42;
    const dirTheta = rnd() * Math.PI * 2;
    const dirPhi = rnd() * Math.PI;
    vertices.push({
      x: anchor.x + dist * Math.sin(dirPhi) * Math.cos(dirTheta),
      y: anchor.y + dist * Math.sin(dirPhi) * Math.sin(dirTheta),
      z: anchor.z + dist * Math.cos(dirPhi),
    });
  }

  // 6. Generate Dense Interconnecting Plexus Edge Mesh
  const edgeSet = new Set<string>();
  const addEdge = (a: number, b: number) => {
    if (a === b || a < 0 || b < 0 || a >= vertices.length || b >= vertices.length) return;
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const key = `${min}_${max}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push([min, max]);
    }
  };

  // 6a. Outer hull facets (base icosahedron & stellated struts)
  const baseEdges: [number, number][] = [
    [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
    [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
    [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
    [9, 4], [4, 2], [2, 6], [6, 8], [8, 9],
    [4, 5], [5, 9], [9, 1], [1, 8], [8, 7],
    [7, 6], [6, 10], [10, 2], [2, 11], [11, 4],
  ];
  baseEdges.forEach(([a, b]) => addEdge(a, b));

  // Connect stellated apices to nearest 3-4 hull vertices
  for (let s = 12; s < 20; s++) {
    const sv = vertices[s];
    const distances = baseIco.map((bv, idx) => ({
      idx,
      dist: Math.hypot(sv.x - bv.x, sv.y - bv.y, sv.z - bv.z),
    }));
    distances.sort((d1, d2) => d1.dist - d2.dist);
    for (let k = 0; k < 4; k++) {
      addEdge(s, distances[k].idx);
    }
  }

  // 6b. Convergent Fan Rays from Major Hubs into the entire interior
  // (This creates that intense hyper-dense chord volume visible in the reference sketch)
  for (const hub of majorVertices) {
    // Fan out to core vertices
    for (let c = coreStartIndex; c < strutStartIndex; c++) {
      if (rnd() > 0.35) {
        addEdge(hub, c);
      }
    }
    // Fan out to strut vertices
    for (let st = strutStartIndex; st < satelliteStartIndex; st++) {
      if (rnd() > 0.6) {
        addEdge(hub, st);
      }
    }
  }

  // 6c. Internal Plexus Cross-links (Proximity Delaunay web inside core & struts)
  for (let i = coreStartIndex; i < satelliteStartIndex; i++) {
    const vi = vertices[i];
    for (let j = i + 1; j < satelliteStartIndex; j++) {
      const vj = vertices[j];
      const d = Math.hypot(vi.x - vj.x, vi.y - vj.y, vi.z - vj.z);
      if (d < 52 || (d < 75 && rnd() > 0.55)) {
        addEdge(i, j);
      }
    }
  }

  // 6d. Cross-connecting Core to Outer Frame
  for (let c = coreStartIndex; c < coreStartIndex + 18; c++) {
    const vc = vertices[c];
    for (let o = 0; o < 16; o++) {
      const vo = vertices[o];
      const d = Math.hypot(vc.x - vo.x, vc.y - vo.y, vc.z - vo.z);
      if (d < 115 && rnd() > 0.6) {
        addEdge(c, o);
      }
    }
  }

  // 6e. Satellite Filaments (connecting dust particles to 2-3 nearby vertices)
  for (let s = satelliteStartIndex; s < vertices.length; s++) {
    const sv = vertices[s];
    const distances: { idx: number; dist: number }[] = [];
    for (let target = 0; target < satelliteStartIndex; target++) {
      const tv = vertices[target];
      distances.push({
        idx: target,
        dist: Math.hypot(sv.x - tv.x, sv.y - tv.y, sv.z - tv.z),
      });
    }
    distances.sort((d1, d2) => d1.dist - d2.dist);
    addEdge(s, distances[0].idx);
    if (rnd() > 0.3) addEdge(s, distances[1].idx);
    if (rnd() > 0.7) addEdge(s, distances[2].idx);
  }

  return {
    id: 'quantum-plexus',
    name: 'Quantum Plexus',
    nameVi: 'Mạng Lưới Lượng Tử',
    descriptionVi: 'Đa diện siêu phức tạp với hơn 1.000 sợi thần kinh (Tối ưu 60 FPS)',
    vertices,
    edges,
    majorVertices,
  };
}

// 7. Siêu Điểm Lượng Tử 10.000 Đỉnh (Hyper Nova - 10,000 Vertex Point Cloud)
// Vũ khí tinh chỉnh chuẩn 10.000 điểm 3D: hố đen trung tâm, 4 nhánh xoắn ốc ngân hà,
// đám mây tinh vân bao bọc và vòng quỹ đạo chòm sao chuẩn 10.000 đỉnh 3D!
export function makeHyperPoint10000(): Shape3D {
  const TOTAL_VERTICES = 10000;
  const vertices: Point3D[] = new Array(TOTAL_VERTICES);
  const edges: Edge[] = [];
  const majorVertices: number[] = [];

  let seed = 100007;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // 1. Galactic Core & Relativistic Jets (1.500 điểm)
  const coreCount = 1500;
  for (let i = 0; i < coreCount; i++) {
    if (i < 300) {
      // Tia chớp bức xạ cực quang 2 đầu trục Y
      const sign = i % 2 === 0 ? 1 : -1;
      const h = 25 + Math.pow(rnd(), 1.4) * 210;
      const coneR = 3 + (h / 210) * 28 * rnd();
      const ang = rnd() * Math.PI * 2;
      vertices[i] = {
        x: Math.cos(ang) * coneR,
        y: sign * h,
        z: Math.sin(ang) * coneR,
      };
    } else {
      // Đĩa bồi tụ siêu đặc quanh lỗ đen
      const r = Math.pow(rnd(), 1.8) * 65 + 4;
      const theta = rnd() * Math.PI * 2;
      const zSpread = (1 - r / 75) * (rnd() - 0.5) * 24;
      vertices[i] = {
        x: Math.cos(theta) * r,
        y: zSpread,
        z: Math.sin(theta) * r,
      };
    }
  }

  // 2. Bốn Nhánh Xoắn Ngân Hà (5.500 điểm)
  const armCount = 5500;
  const numArms = 4;
  for (let i = 0; i < armCount; i++) {
    const armIdx = i % numArms;
    const baseArmAngle = (armIdx * Math.PI * 2) / numArms;
    const progress = Math.pow(rnd(), 0.88);
    const dist = 32 + progress * 175;
    const winding = progress * 4.4;
    const armAngle = baseArmAngle + winding;
    const spread = (10 + progress * 28) * (rnd() - 0.5);
    const heightSpread = (6 + progress * 20) * (rnd() - 0.5);

    const x = Math.cos(armAngle) * dist + Math.sin(armAngle) * spread;
    const z = Math.sin(armAngle) * dist - Math.cos(armAngle) * spread;
    const y = heightSpread;

    vertices[coreCount + i] = { x, y, z };
  }

  // 3. Mây Tinh Vân Cầu & Hào Quang Kepler (2.500 điểm)
  const haloCount = 2500;
  for (let i = 0; i < haloCount; i++) {
    const u = rnd();
    const v = rnd();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 95 + Math.pow(rnd(), 0.72) * 135;
    const sinPhi = Math.sin(phi);
    vertices[coreCount + armCount + i] = {
      x: r * sinPhi * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * sinPhi * Math.sin(theta),
    };
  }

  // 4. Vòng Quỹ Đạo Chòm Sao Đa Chiều (500 điểm => Tổng đúng 10.000 đỉnh!)
  const remainingCount = TOTAL_VERTICES - (coreCount + armCount + haloCount); // 500
  const ringStart = coreCount + armCount + haloCount;

  for (let i = 0; i < remainingCount; i++) {
    const ringPlane = i % 3;
    const angle = (i / remainingCount) * Math.PI * 6;
    const R = 185 + (i % 7) * 3.5;
    let x = 0, y = 0, z = 0;
    if (ringPlane === 0) {
      x = Math.cos(angle) * R;
      y = Math.sin(angle) * R;
      z = (rnd() - 0.5) * 8;
    } else if (ringPlane === 1) {
      x = Math.cos(angle) * R;
      z = Math.sin(angle) * R;
      y = (rnd() - 0.5) * 8;
    } else {
      y = Math.cos(angle) * R;
      z = Math.sin(angle) * R;
      x = (rnd() - 0.5) * 8;
    }
    vertices[ringStart + i] = { x, y, z };
  }

  // Chọn 16 đỉnh mấu chốt tạo vòng hào quang lớn
  for (let k = 0; k < 16; k++) {
    majorVertices.push(ringStart + Math.floor((k / 16) * remainingCount));
  }

  // 200 cạnh liên kết chòm sao quỹ đạo
  for (let e = 0; e < 200; e++) {
    const idxA = ringStart + (e * 5) % remainingCount;
    const idxB = ringStart + (e * 5 + 15) % remainingCount;
    edges.push([idxA, idxB]);
  }

  return {
    id: 'super-point-10000',
    name: 'Super Point 10.000',
    nameVi: 'Siêu Điểm 10.000',
    descriptionVi: '10.000 Đỉnh 3D • Lỗ đen & Thiên hà xoắn ốc • Chế độ Lag Thật (CPU Burner) & Turbo 60 FPS.',
    vertices,
    edges,
    majorVertices,
    isBenchmark: true,
  };
}

export const makeHyperPoint77777 = makeHyperPoint10000;

// 8. Đùn (extrude) nét vẽ 2D / đa giác (hỗ trợ nhiều nét vẽ tách rời không bị dính chùm) thành khối 3D wireframe
export function makeCustomFromStrokes(
  strokes: Point2D[][],
  depth = 40,
  name = 'Hình vẽ tự do 3D',
  isClosed = false
): Shape3D {
  const validStrokes = strokes.filter((s) => s && s.length > 0);
  if (validStrokes.length === 0) {
    return makeCube(100);
  }

  const vertices: Point3D[] = [];
  const edges: Edge[] = [];
  const halfDepth = depth / 2;

  for (const stroke of validStrokes) {
    // Filter redundant duplicate points (< 2px)
    const pts: Point2D[] = [];
    for (let i = 0; i < stroke.length; i++) {
      const p = stroke[i];
      if (pts.length === 0) {
        pts.push(p);
      } else {
        const last = pts[pts.length - 1];
        const distSq = (last.x - p.x) ** 2 + (last.y - p.y) ** 2;
        if (distSq >= 4 || i === stroke.length - 1) {
          pts.push(p);
        }
      }
    }

    const k = pts.length;

    // Case 1: Single dot / point (ví dụ: dấu chấm trên chữ 'i', dấu chấm câu)
    if (k === 1) {
      const p = pts[0];
      const r = 5;
      const startIdx = vertices.length;
      // Tạo hình thoi 3D nhỏ cho dấu chấm
      vertices.push({ x: p.x, y: p.y - r, z: -halfDepth });
      vertices.push({ x: p.x + r, y: p.y, z: -halfDepth });
      vertices.push({ x: p.x, y: p.y + r, z: -halfDepth });
      vertices.push({ x: p.x - r, y: p.y, z: -halfDepth });

      vertices.push({ x: p.x, y: p.y - r, z: halfDepth });
      vertices.push({ x: p.x + r, y: p.y, z: halfDepth });
      vertices.push({ x: p.x, y: p.y + r, z: halfDepth });
      vertices.push({ x: p.x - r, y: p.y, z: halfDepth });

      edges.push([startIdx, startIdx + 1]);
      edges.push([startIdx + 1, startIdx + 2]);
      edges.push([startIdx + 2, startIdx + 3]);
      edges.push([startIdx + 3, startIdx]);

      edges.push([startIdx + 4, startIdx + 5]);
      edges.push([startIdx + 5, startIdx + 6]);
      edges.push([startIdx + 6, startIdx + 7]);
      edges.push([startIdx + 7, startIdx + 4]);

      edges.push([startIdx, startIdx + 4]);
      edges.push([startIdx + 1, startIdx + 5]);
      edges.push([startIdx + 2, startIdx + 6]);
      edges.push([startIdx + 3, startIdx + 7]);
      continue;
    }

    // Case 2: Multi-point stroke (chữ viết, đường nét uốn lượn tự do, cạnh đa giác)
    const baseIdx = vertices.length;

    // Mặt trước (z = -halfDepth)
    for (let i = 0; i < k; i++) {
      vertices.push({ x: pts[i].x, y: pts[i].y, z: -halfDepth });
    }
    // Mặt sau (z = halfDepth)
    for (let i = 0; i < k; i++) {
      vertices.push({ x: pts[i].x, y: pts[i].y, z: halfDepth });
    }

    // Đường nét mặt trước
    for (let i = 0; i < k - 1; i++) {
      edges.push([baseIdx + i, baseIdx + i + 1]);
    }
    // Đường nét mặt sau
    for (let i = 0; i < k - 1; i++) {
      edges.push([baseIdx + k + i, baseIdx + k + i + 1]);
    }

    // Cạnh nối giữa 2 mặt (tạo độ dày 3D)
    edges.push([baseIdx, baseIdx + k]);
    edges.push([baseIdx + k - 1, baseIdx + 2 * k - 1]);

    // Các nan nối dọc thân nét vẽ để tạo hiệu ứng khung không gian 3D dạng ruy băng (wireframe ribbon)
    const step = k <= 14 ? 1 : k <= 30 ? 2 : Math.max(2, Math.round(k / 24));
    for (let i = step; i < k - 1; i += step) {
      edges.push([baseIdx + i, baseIdx + k + i]);
    }

    // Nếu người dùng chọn khép kín nét (tạo đa giác lăng trụ kín)
    if (isClosed && k >= 3) {
      edges.push([baseIdx + k - 1, baseIdx]);
      edges.push([baseIdx + 2 * k - 1, baseIdx + k]);
    }
  }

  return {
    id: 'custom-' + Date.now(),
    name: 'Custom 3D Drawing',
    nameVi: name,
    descriptionVi: `${validStrokes.length} nét tách rời, ${vertices.length} đỉnh 3D`,
    vertices,
    edges,
    isCustom: true,
  };
}

// Tương thích ngược với mảng 1 nét
export function makeCustomShape(points2D: Point2D[], depth = 50, name = 'Khối tự vẽ'): Shape3D {
  return makeCustomFromStrokes([points2D], depth, name, true);
}

// ================= 3D PROJECTION & ROTATION MATH =================
export function rotateX(v: Point3D, angle: number): Point3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x,
    y: v.y * cos - v.z * sin,
    z: v.y * sin + v.z * cos,
  };
}

export function rotateY(v: Point3D, angle: number): Point3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos + v.z * sin,
    y: v.y,
    z: -v.x * sin + v.z * cos,
  };
}

export function rotateZ(v: Point3D, angle: number): Point3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
    z: v.z,
  };
}

export function projectPoint(
  v: Point3D,
  width: number,
  height: number,
  fov: number,
  scaleMultiplier = 1
): { x: number; y: number; z: number; scaleFactor: number; visible: boolean } {
  const centerX = width / 2;
  const centerY = height / 2;
  const effectiveZ = v.z * scaleMultiplier;
  const denominator = fov + effectiveZ;

  if (denominator <= 10) {
    return { x: centerX, y: centerY, z: effectiveZ, scaleFactor: 0, visible: false };
  }

  const scaleFactor = fov / denominator;
  return {
    x: v.x * scaleMultiplier * scaleFactor + centerX,
    y: v.y * scaleMultiplier * scaleFactor + centerY,
    z: effectiveZ,
    scaleFactor,
    visible: true,
  };
}

export * from './shapes4D';
export * from './nameShapes';
export * from './doublePendulum';
export * from './motionTrails';
export * from './woodTexture';
export * from './shapes5D';
