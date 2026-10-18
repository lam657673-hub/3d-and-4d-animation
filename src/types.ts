export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Point4D {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Point5D {
  x: number;
  y: number;
  z: number;
  w: number;
  v: number;
}

export interface Point2D {
  x: number;
  y: number;
  sx?: number;
  sy?: number;
}

export type Edge = [number, number];

export interface Shape3D {
  id: string;
  name: string;
  nameVi: string;
  descriptionVi?: string;
  vertices: Point3D[];
  edges: Edge[];
  faces?: number[][]; // Polygons for surface texture mapping
  isCustom?: boolean;
  majorVertices?: number[];
  isBenchmark?: boolean;
  // 4D Hyperspace attributes
  is4D?: boolean;
  vertices4D?: Point4D[];
  cells4DCount?: number;
  hyperType?: 'tesseract' | '16-cell' | '24-cell' | '5-cell' | 'clifford-torus' | 'hyperprism' | 'custom-4d';
  // 5D Hyperspace attributes
  is5D?: boolean;
  vertices5D?: Point5D[];
  hyperType5D?: 'penteract' | '5-simplex' | '5-orthoplex' | 'pendulum-5d' | 'clifford-5d';
}

export interface ControlState {
  angle: number; // in radians
  speed: number; // 0 to maxSpeed
}

export interface RenderTheme {
  id: string;
  name: string;
  lineColor: string;
  glowColor: string;
  vertexColor: string;
  accentColor: string;
}

export type HyperPlane = 'XW' | 'YW' | 'ZW' | 'DOUBLE_CLIFFORD' | 'ALL';
export type Hyper5DPlane = 'XV' | 'YV' | 'ZV' | 'WV' | 'ALL_5D';

export type AestheticMode = 'cyber' | 'wooden';

export interface RenderSettings {
  theme: RenderTheme;
  aestheticMode: AestheticMode; // 'cyber' neon wireframe vs 'wooden' grain texture
  fov: number;
  scale: number;
  lineWidth: number;
  vertexRadius: number;
  showVertices: boolean;
  showEdges: boolean;
  showDepthDimming: boolean;
  showCoordinates: boolean;
  showStats: boolean;
  autoSpin: boolean;
  // Hiệu ứng vệt sáng chuyển động (Motion Trail & Light Streaks)
  motionTrail: boolean;
  trailLength: number;
  trailPersistence: number;
  // 4D Hyperspace settings
  hyperSpeed: number;
  hyperPlane: HyperPlane;
  hyperDistance: number;
  hyperSliceW: number;
  autoHyperSpin: boolean;
  hyperColorW: boolean;
  // 5D Hyperspace settings (Trục thứ 5 V)
  hyper5DSpeed: number;
  hyper5DPlane: Hyper5DPlane;
  hyper5DDistance: number;
  autoHyper5DSpin: boolean;
  hyperColor5D: boolean;
  // Hệ Thống Giảm Lag & Tối Ưu Hiệu Năng (Anti-Lag Engine)
  antiLag: boolean;
  disableGlow: boolean;
  capDpr: boolean;
  lodDensity: number;
  autoAntiLag: boolean;
}
