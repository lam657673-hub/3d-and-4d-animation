// =========================================================================
// DOUBLE PENDULUM (CON LẮC KÉP) - CHAOTIC DYNAMICS 3D & 4D ENGINE
// Mô phỏng con lắc kép hỗn loạn phi tuyến (Lagrangian mechanics & Runge-Kutta 4)
// Tự do hoạt động trong cả không gian 3D và 4D Hyperspace
// =========================================================================

import { Point3D, Point4D, Edge, Shape3D } from '../types';

export interface DoublePendulumState {
  // Con lắc chính trên mặt phẳng (theta 1 & theta 2)
  theta1: number; // Góc nhánh 1 (radians)
  theta2: number; // Góc nhánh 2 (radians)
  omega1: number; // Vận tốc góc nhánh 1
  omega2: number; // Vận tốc góc nhánh 2

  // Góc xoay phương vị 3D (trục Yaw / Azimuth - con lắc xoay ngẫu nhiên trong không gian 3D)
  phi: number; // Góc xoay quanh trục Y thẳng đứng
  omegaPhi: number; // Vận tốc xoay không gian 3D

  // Góc xoay 4D Hyperspace (mặt phẳng XW/YW/ZW)
  psi4D: number; // Góc trong không gian 4 chiều
  omegaPsi4D: number; // Vận tốc lộn ruột 4D

  // Góc xoay 5D Hyperspace (mặt phẳng XV/YV/ZV/WV)
  omega5D: number; // Góc trong không gian 5 chiều (trục thứ 5 V)
  velOmega5D: number; // Vận tốc lộn nhào 5D

  // Thông số vật lý
  l1: number; // Chiều dài thanh 1
  l2: number; // Chiều dài thanh 2
  m1: number; // Khối lượng quả nặng 1
  m2: number; // Khối lượng quả nặng 2
  g: number; // Gia tốc trọng trường

  // Damping / cản gió nhẹ
  damping: number;

  // Lịch sử quỹ đạo vệt sáng (Trace history)
  trail: Array<{
    x: number;
    y: number;
    z: number;
    w?: number;
    alpha: number;
  }>;
}

// Trạng thái đơn lẻ duy trì cho mô phỏng liên tục
export const pendulumSim: DoublePendulumState = {
  theta1: Math.PI / 2, // 90 độ ban đầu
  theta2: Math.PI / 2 + 0.1,
  omega1: 0,
  omega2: 0,
  phi: 0,
  omegaPhi: 0.25, // Tự động xoay phương vị ngẫu nhiên 3D
  psi4D: 0,
  omegaPsi4D: 0.35, // Tự động xoay chiều 4D
  omega5D: 0,
  velOmega5D: 0.45, // Tự động xoay chiều 5D
  l1: 65,
  l2: 55,
  m1: 2.0,
  m2: 1.5,
  g: 9.81 * 8, // Tỉ lệ hiển thị mô phỏng thực tế
  damping: 0.9997,
  trail: [],
};

// Đạo hàm hệ phương trình vi phân chuyển động con lắc kép (Equations of Motion)
function getDerivatives(
  t1: number,
  t2: number,
  w1: number,
  w2: number,
  m1: number,
  m2: number,
  l1: number,
  l2: number,
  g: number
): [number, number] {
  const delta = t1 - t2;

  // Công thức giải tích Lagrangian cho con lắc kép tiêu chuẩn
  const den1 = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * t1 - 2 * t2));
  const num1 =
    -g * (2 * m1 + m2) * Math.sin(t1) -
    m2 * g * Math.sin(t1 - 2 * t2) -
    2 * Math.sin(delta) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(delta));
  const alpha1 = num1 / (den1 || 0.0001);

  const den2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * t1 - 2 * t2));
  const num2 =
    2 *
    Math.sin(delta) *
    (w1 * w1 * l1 * (m1 + m2) +
      g * (m1 + m2) * Math.cos(t1) +
      w2 * w2 * l2 * m2 * Math.cos(delta));
  const alpha2 = num2 / (den2 || 0.0001);

  return [alpha1, alpha2];
}

// Tích phân số Runge-Kutta bậc 4 (RK4) cho độ ổn định số học tối đa
export function stepPendulumRK4(sim: DoublePendulumState, dt: number = 0.018): void {
  // Cắt nhỏ dt thành các micro-steps để con lắc không bị giật hoặc nổ số
  const subSteps = 3;
  const subDt = dt / subSteps;

  for (let s = 0; s < subSteps; s++) {
    const { theta1: t1, theta2: t2, omega1: w1, omega2: w2, m1, m2, l1, l2, g, damping } = sim;

    // k1
    const [a1_k1, a2_k1] = getDerivatives(t1, t2, w1, w2, m1, m2, l1, l2, g);

    // k2
    const t1_k2 = t1 + 0.5 * subDt * w1;
    const t2_k2 = t2 + 0.5 * subDt * w2;
    const w1_k2 = w1 + 0.5 * subDt * a1_k1;
    const w2_k2 = w2 + 0.5 * subDt * a2_k1;
    const [a1_k2, a2_k2] = getDerivatives(t1_k2, t2_k2, w1_k2, w2_k2, m1, m2, l1, l2, g);

    // k3
    const t1_k3 = t1 + 0.5 * subDt * w1_k2;
    const t2_k3 = t2 + 0.5 * subDt * w2_k2;
    const w1_k3 = w1 + 0.5 * subDt * a1_k2;
    const w2_k3 = w2 + 0.5 * subDt * a2_k2;
    const [a1_k3, a2_k3] = getDerivatives(t1_k3, t2_k3, w1_k3, w2_k3, m1, m2, l1, l2, g);

    // k4
    const t1_k4 = t1 + subDt * w1_k3;
    const t2_k4 = t2 + subDt * w2_k3;
    const w1_k4 = w1 + subDt * a1_k3;
    const w2_k4 = w2 + subDt * a2_k3;
    const [a1_k4, a2_k4] = getDerivatives(t1_k4, t2_k4, w1_k4, w2_k4, m1, m2, l1, l2, g);

    sim.theta1 += (subDt / 6) * (w1 + 2 * w1_k2 + 2 * w1_k3 + w1_k4);
    sim.theta2 += (subDt / 6) * (w2 + 2 * w2_k2 + 2 * w2_k3 + w2_k4);
    sim.omega1 += (subDt / 6) * (a1_k1 + 2 * a1_k2 + 2 * a1_k3 + a1_k4);
    sim.omega2 += (subDt / 6) * (a2_k1 + 2 * a2_k2 + 2 * a2_k3 + a2_k4);

    sim.omega1 *= damping;
    sim.omega2 *= damping;
  }

  // Tự động thay đổi vị trí hướng xoay ngẫu nhiên theo thời gian
  // Thêm nhiễu loạn nhẹ để hướng con lắc đảo chiều ngẫu hứng không đoán trước
  sim.phi += sim.omegaPhi * dt;
  sim.psi4D += sim.omegaPsi4D * dt;
  sim.omega5D += sim.velOmega5D * dt;

  // Dao động nhẹ tốc độ xoay không gian để góc xoay biến hóa đa dạng
  sim.omegaPhi += (Math.sin(performance.now() * 0.0012) * 0.02 - sim.omegaPhi * 0.01) * dt;
  sim.omegaPsi4D += (Math.cos(performance.now() * 0.0015) * 0.03 - sim.omegaPsi4D * 0.01) * dt;
  sim.velOmega5D += (Math.sin(performance.now() * 0.0018) * 0.03 - sim.velOmega5D * 0.01) * dt;

  // Bổ sung cú hích ngẫu nhiên nếu con lắc chạy chậm dần (giữ chuyển động hỗn loạn vĩnh cửu)
  const totalEnergy = Math.abs(sim.omega1) + Math.abs(sim.omega2);
  if (totalEnergy < 0.4) {
    sim.omega1 += (Math.random() - 0.5) * 2.8;
    sim.omega2 += (Math.random() - 0.5) * 3.4;
    sim.omegaPhi += (Math.random() - 0.5) * 0.8;
    sim.velOmega5D += (Math.random() - 0.5) * 0.9;
  }

  // Lưu điểm đuôi vệt sáng (Trail)
  const p2 = getPendulumBob2Coords(sim);
  sim.trail.push({
    x: p2.x,
    y: p2.y,
    z: p2.z,
    w: p2.w,
    alpha: 1.0,
  });

  // Giới hạn độ dài vệt sáng (tối đa 45 điểm để mượt mà không lag)
  if (sim.trail.length > 45) {
    sim.trail.shift();
  }
}

// Cú hích xáo trộn ngẫu nhiên (Random Perturbation / Chaos Impulse) khi người dùng bấm
export function randomizePendulum(sim: DoublePendulumState): void {
  sim.theta1 = Math.random() * Math.PI * 2;
  sim.theta2 = Math.random() * Math.PI * 2;
  sim.omega1 = (Math.random() - 0.5) * 9.0;
  sim.omega2 = (Math.random() - 0.5) * 12.0;
  sim.phi = Math.random() * Math.PI * 2;
  sim.omegaPhi = (Math.random() - 0.5) * 1.8;
  sim.psi4D = Math.random() * Math.PI * 2;
  sim.omegaPsi4D = (Math.random() - 0.5) * 2.2;
  sim.omega5D = Math.random() * Math.PI * 2;
  sim.velOmega5D = (Math.random() - 0.5) * 2.5;
  sim.trail = [];
}

// Tính tọa độ vị trí thực quả cầu 2 (Bob 2)
export function getPendulumBob2Coords(sim: DoublePendulumState): {
  x: number;
  y: number;
  z: number;
  w: number;
} {
  const { theta1, theta2, phi, psi4D, l1, l2 } = sim;
  const planX1 = l1 * Math.sin(theta1);
  const planY1 = l1 * Math.cos(theta1);
  const planX2 = planX1 + l2 * Math.sin(theta2);
  const planY2 = planY1 + l2 * Math.cos(theta2);

  // Xoay quanh trục thẳng đứng Y với góc phi
  const x = planX2 * Math.cos(phi);
  const z = planX2 * Math.sin(phi);
  const y = planY2;
  const w = Math.sin(psi4D) * (l1 + l2) * 0.85;

  return { x, y, z, w };
}

// Định dạng góc xoay chi tiết độ 000,0000 theo yêu cầu người dùng
export function formatDetailedDegree(rad: number): string {
  // Chuẩn hóa góc về khoảng [0, 360)
  let deg = ((rad * 180) / Math.PI) % 360;
  if (deg < 0) deg += 360;

  const intPart = Math.floor(deg).toString().padStart(3, '0');
  const fracPart = Math.floor((deg - Math.floor(deg)) * 10000)
    .toString()
    .padStart(4, '0');

  return `${intPart},${fracPart}°`;
}

// =========================================================================
// THUẬT TOÁN TẠO KHỐI THANH GỖ HỘP 3D (ORIENTED 3D WOODEN BOX BEAM)
// Tạo một thanh dầm gỗ hình hộp chữ nhật có 8 đỉnh, 12 cạnh và 6 mặt đa giác
// =========================================================================
export function addBoxBeam(
  vertices: Point3D[],
  edges: Edge[],
  faces: number[][],
  pStart: Point3D,
  pEnd: Point3D,
  w: number, // Chiều rộng mặt gỗ (width)
  d: number  // Chiều dày thanh gỗ (thickness/depth)
): number {
  const dx = pEnd.x - pStart.x;
  const dy = pEnd.y - pStart.y;
  const dz = pEnd.z - pStart.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const ux = dx / len, uy = dy / len, uz = dz / len;

  // Tìm vector vuông góc 1
  let ax = 0, ay = 0, az = 1;
  if (Math.abs(uz) > 0.88) {
    ax = 1; ay = 0; az = 0;
  }
  let p1x = uy * az - uz * ay;
  let p1y = uz * ax - ux * az;
  let p1z = ux * ay - uy * ax;
  const p1len = Math.sqrt(p1x * p1x + p1y * p1y + p1z * p1z) || 1;
  p1x = (p1x / p1len) * (w / 2);
  p1y = (p1y / p1len) * (w / 2);
  p1z = (p1z / p1len) * (w / 2);

  // Vector vuông góc 2 = u x p1
  let p2x = uy * p1z - uz * p1y;
  let p2y = uz * p1x - ux * p1z;
  let p2z = ux * p1y - uy * p1x;
  const p2len = Math.sqrt(p2x * p2x + p2y * p2y + p2z * p2z) || 1;
  p2x = (p2x / p2len) * (d / 2);
  p2y = (p2y / p2len) * (d / 2);
  p2z = (p2z / p2len) * (d / 2);

  const baseIdx = vertices.length;

  // 4 đỉnh mặt đầu thanh
  vertices.push(
    { x: pStart.x - p1x - p2x, y: pStart.y - p1y - p2y, z: pStart.z - p1z - p2z }, // 0
    { x: pStart.x + p1x - p2x, y: pStart.y + p1y - p2y, z: pStart.z + p1z - p2z }, // 1
    { x: pStart.x + p1x + p2x, y: pStart.y + p1y + p2y, z: pStart.z + p1z + p2z }, // 2
    { x: pStart.x - p1x + p2x, y: pStart.y - p1y + p2y, z: pStart.z - p1z + p2z }  // 3
  );

  // 4 đỉnh mặt đuôi thanh
  vertices.push(
    { x: pEnd.x - p1x - p2x, y: pEnd.y - p1y - p2y, z: pEnd.z - p1z - p2z }, // 4
    { x: pEnd.x + p1x - p2x, y: pEnd.y + p1y - p2y, z: pEnd.z + p1z - p2z }, // 5
    { x: pEnd.x + p1x + p2x, y: pEnd.y + p1y + p2y, z: pEnd.z + p1z + p2z }, // 6
    { x: pEnd.x - p1x + p2x, y: pEnd.y - p1y + p2y, z: pEnd.z - p1z + p2z }  // 7
  );

  // 12 cạnh khung dây của thanh hộp
  edges.push(
    [baseIdx + 0, baseIdx + 1],
    [baseIdx + 1, baseIdx + 2],
    [baseIdx + 2, baseIdx + 3],
    [baseIdx + 3, baseIdx + 0],
    [baseIdx + 4, baseIdx + 5],
    [baseIdx + 5, baseIdx + 6],
    [baseIdx + 6, baseIdx + 7],
    [baseIdx + 7, baseIdx + 4],
    [baseIdx + 0, baseIdx + 4],
    [baseIdx + 1, baseIdx + 5],
    [baseIdx + 2, baseIdx + 6],
    [baseIdx + 3, baseIdx + 7]
  );

  // 6 mặt đa giác tứ giác để map vân gỗ
  faces.push(
    [baseIdx + 0, baseIdx + 1, baseIdx + 2, baseIdx + 3], // Đầu thanh
    [baseIdx + 5, baseIdx + 4, baseIdx + 7, baseIdx + 6], // Đuôi thanh
    [baseIdx + 0, baseIdx + 4, baseIdx + 5, baseIdx + 1], // Mặt hông 1
    [baseIdx + 1, baseIdx + 5, baseIdx + 6, baseIdx + 2], // Mặt hông 2
    [baseIdx + 2, baseIdx + 6, baseIdx + 7, baseIdx + 3], // Mặt hông 3
    [baseIdx + 3, baseIdx + 7, baseIdx + 4, baseIdx + 0]  // Mặt hông 4
  );

  return baseIdx;
}

// =========================================================================
// TẠO HÌNH KHỐI CON LẮC KÉP GỖ 3D (WOODEN DOUBLE PENDULUM 3D)
// Chuẩn xác theo mô hình xưởng mộc thực tế:
// 1. Chân đế gỗ phẳng nằm ngang
// 2. Hai cột trụ gỗ đứng đỡ trục quay chính
// 3. Trục quay ngang bằng kim loại/gỗ tiện
// 4. Thanh dầm gỗ thứ nhất (Arm 1) dạng khối hộp chữ nhật có độ dày
// 5. Khớp quay trung tâm kèm chốt đồng
// 6. Thanh dầm gỗ thứ hai (Arm 2) dạng khối hộp chữ nhật lồng xoay tự do
// =========================================================================
export function makeDoublePendulum3D(): Shape3D {
  const sim = pendulumSim;
  const { theta1, theta2, phi, l1, l2 } = sim;

  // Tọa độ trục quay chính O ở đỉnh hai cột trụ
  const ox = 0, oy = -60, oz = 0;

  // Khớp 1 (Joint 1 / Bob 1)
  const planX1 = l1 * Math.sin(theta1);
  const planY1 = l1 * Math.cos(theta1);
  const b1x = ox + planX1 * Math.cos(phi);
  const b1z = oz + planX1 * Math.sin(phi);
  const b1y = oy + planY1;

  // Khớp 2 (Joint 2 / Tip 2)
  const planX2 = planX1 + l2 * Math.sin(theta2);
  const planY2 = planY1 + l2 * Math.cos(theta2);
  const b2x = ox + planX2 * Math.cos(phi);
  const b2z = oz + planX2 * Math.sin(phi);
  const b2y = oy + planY2;

  const vertices: Point3D[] = [];
  const edges: Edge[] = [];
  const faces: number[][] = [];
  const majorVertices: number[] = [];

  // 1. Chân đế gỗ phẳng nằm ngang (Base Wooden Plate)
  // Đặt ở dưới đáy tại y = +70, rộng 85mm, sâu 55mm, dày 10mm
  addBoxBeam(
    vertices, edges, faces,
    { x: -45, y: 70, z: 0 },
    { x: 45, y: 70, z: 0 },
    55, 12
  );

  // 2. Trụ đứng gỗ bên trái (Left Vertical Wooden Pillar)
  // Trụ nối từ đế y=70 lên trục trên y=-60, cách tâm z = -20
  addBoxBeam(
    vertices, edges, faces,
    { x: 0, y: 64, z: -20 },
    { x: 0, y: -64, z: -20 },
    12, 12
  );

  // 3. Trụ đứng gỗ bên phải (Right Vertical Wooden Pillar)
  // Trụ nối từ đế y=70 lên trục trên y=-60, cách tâm z = +20
  addBoxBeam(
    vertices, edges, faces,
    { x: 0, y: 64, z: 20 },
    { x: 0, y: -64, z: 20 },
    12, 12
  );

  // 4. Trục quay ngang chính (Main Horizontal Pivot Axle Rod)
  // Xuyên qua đỉnh 2 cột trụ từ z=-24 đến z=+24
  addBoxBeam(
    vertices, edges, faces,
    { x: 0, y: -60, z: -25 },
    { x: 0, y: -60, z: 25 },
    5, 5
  );

  // 5. Thanh dầm gỗ thứ nhất (Upper Wooden Arm 1)
  // Khối hộp chữ nhật gỗ dày 9mm, rộng 12mm nối từ gốc (0, -60, 0) đến khớp 1
  const arm1Idx = addBoxBeam(
    vertices, edges, faces,
    { x: ox, y: oy, z: oz },
    { x: b1x, y: b1y, z: b1z },
    12, 9
  );
  majorVertices.push(arm1Idx + 5); // Đỉnh đầu thanh làm điểm neo sáng

  // 6. Chốt trục quay kim loại đồng ở Khớp 1 (Joint 1 Brass Pivot Pin)
  addBoxBeam(
    vertices, edges, faces,
    { x: b1x, y: b1y, z: b1z - 9 },
    { x: b1x, y: b1y, z: b1z + 9 },
    6, 6
  );

  // 7. Thanh dầm gỗ thứ hai (Lower Wooden Arm 2)
  // Khối hộp chữ nhật gỗ dày 8mm, rộng 11mm nối từ Khớp 1 đến Tip 2
  const arm2Idx = addBoxBeam(
    vertices, edges, faces,
    { x: b1x, y: b1y, z: b1z },
    { x: b2x, y: b2y, z: b2z },
    11, 8
  );
  majorVertices.push(arm2Idx + 5); // Điểm chót cánh tay hỗn loạn

  // Điểm chốt xoay gốc và các khớp
  const pivotCenterIdx = vertices.length;
  vertices.push({ x: ox, y: oy, z: oz });
  majorVertices.push(pivotCenterIdx);

  // 8. Vệt đuôi hỗn loạn (Chaotic Trail)
  if (sim.trail.length > 1) {
    const trailStart = vertices.length;
    for (let i = 0; i < sim.trail.length; i++) {
      vertices.push({
        x: sim.trail[i].x,
        y: sim.trail[i].y,
        z: sim.trail[i].z,
      });
      if (i > 0) {
        edges.push([trailStart + i - 1, trailStart + i]);
      }
    }
    // Nối điểm cuối vệt sáng vào tip thanh gỗ 2
    edges.push([arm2Idx + 5, trailStart + sim.trail.length - 1]);
  }

  return {
    id: 'double-pendulum-3d',
    name: 'Wooden Double Pendulum 3D',
    nameVi: 'Khối Gỗ Con Lắc Kép 3D (Xưởng Mộc)',
    descriptionVi: `Khối gỗ dầm chữ nhật • Khớp 1: ${formatDetailedDegree(theta1)} • Khớp 2: ${formatDetailedDegree(theta2)} • Hướng xoay: ${formatDetailedDegree(phi)}`,
    vertices,
    edges,
    faces,
    majorVertices,
  };
}

// =========================================================================
// TẠO HÌNH KHỐI CON LẮC KÉP 4D HYPERSPACE (DOUBLE PENDULUM 4D)
// Mở rộng phương trình vào siêu không gian 4 chiều (Trục W)
// Với cánh tay Hyper-Tesseract gắn ở mỗi khớp lộn ruột theo trục W!
// =========================================================================
export function makeDoublePendulum4D(): Shape3D {
  const sim = pendulumSim;
  const { theta1, theta2, phi, psi4D, l1, l2 } = sim;

  const ox = 0, oy = -70, oz = 0, ow = 0;

  // Bob 1
  const planX1 = l1 * Math.sin(theta1);
  const planY1 = l1 * Math.cos(theta1);
  const b1x = ox + planX1 * Math.cos(phi);
  const b1z = oz + planX1 * Math.sin(phi);
  const b1y = oy + planY1;
  const b1w = Math.sin(psi4D) * l1 * 0.9;

  // Bob 2
  const planX2 = planX1 + l2 * Math.sin(theta2);
  const planY2 = planY1 + l2 * Math.cos(theta2);
  const b2x = ox + planX2 * Math.cos(phi);
  const b2z = oz + planX2 * Math.sin(phi);
  const b2y = oy + planY2;
  const b2w = b1w + Math.cos(psi4D * 1.3) * l2 * 0.9;

  const vertices4D: Point4D[] = [];
  const edges: Edge[] = [];
  const majorVertices: number[] = [];

  // 1. Khung đỡ siêu lập phương tại gốc treo (Hyper-Gimbal)
  const s0 = 22;
  // 8 đỉnh lập phương không gian thực tại gốc
  const base4DStart = vertices4D.length;
  for (let dx of [-s0, s0]) {
    for (let dy of [-s0, s0]) {
      for (let dz of [-s0, s0]) {
        vertices4D.push({
          x: ox + dx,
          y: oy + dy * 0.35,
          z: oz + dz,
          w: ow + (dx * dz > 0 ? 18 : -18),
        });
      }
    }
  }
  // Các cạnh khung giá treo
  edges.push(
    [base4DStart, base4DStart + 1],
    [base4DStart + 1, base4DStart + 3],
    [base4DStart + 3, base4DStart + 2],
    [base4DStart + 2, base4DStart],
    [base4DStart + 4, base4DStart + 5],
    [base4DStart + 5, base4DStart + 7],
    [base4DStart + 7, base4DStart + 6],
    [base4DStart + 6, base4DStart + 4],
    [base4DStart, base4DStart + 4],
    [base4DStart + 1, base4DStart + 5],
    [base4DStart + 2, base4DStart + 6],
    [base4DStart + 3, base4DStart + 7]
  );

  // Điểm chốt xoay gốc O
  const pivotIdx = vertices4D.length;
  vertices4D.push({ x: ox, y: oy, z: oz, w: ow });
  majorVertices.push(pivotIdx);

  // 2. Điểm Bob 1 trong không gian 4D
  const b1Idx = vertices4D.length;
  vertices4D.push({ x: b1x, y: b1y, z: b1z, w: b1w });
  edges.push([pivotIdx, b1Idx]);
  majorVertices.push(b1Idx);

  // Hyper-Prism 4D tại Bob 1
  const r1 = 14;
  const b1_4DStart = vertices4D.length;
  vertices4D.push(
    { x: b1x + r1, y: b1y, z: b1z, w: b1w + r1 },
    { x: b1x - r1, y: b1y, z: b1z, w: b1w + r1 },
    { x: b1x, y: b1y + r1, z: b1z, w: b1w - r1 },
    { x: b1x, y: b1y - r1, z: b1z, w: b1w - r1 },
    { x: b1x, y: b1y, z: b1z + r1, w: b1w },
    { x: b1x, y: b1y, z: b1z - r1, w: b1w }
  );
  edges.push(
    [b1Idx, b1_4DStart],
    [b1Idx, b1_4DStart + 1],
    [b1Idx, b1_4DStart + 2],
    [b1Idx, b1_4DStart + 3],
    [b1Idx, b1_4DStart + 4],
    [b1Idx, b1_4DStart + 5],
    [b1_4DStart, b1_4DStart + 2],
    [b1_4DStart + 1, b1_4DStart + 2],
    [b1_4DStart + 2, b1_4DStart + 4],
    [b1_4DStart + 3, b1_4DStart + 5]
  );

  // 3. Bob 2 trong không gian 4D
  const b2Idx = vertices4D.length;
  vertices4D.push({ x: b2x, y: b2y, z: b2z, w: b2w });
  edges.push([b1Idx, b2Idx]);
  majorVertices.push(b2Idx);

  // Siêu khối 16-Cell thu nhỏ tại Bob 2
  const r2 = 20;
  const b2_16CellStart = vertices4D.length;
  vertices4D.push(
    { x: b2x + r2, y: b2y, z: b2z, w: b2w },
    { x: b2x - r2, y: b2y, z: b2z, w: b2w },
    { x: b2x, y: b2y + r2, z: b2z, w: b2w },
    { x: b2x, y: b2y - r2, z: b2z, w: b2w },
    { x: b2x, y: b2y, z: b2z + r2, w: b2w },
    { x: b2x, y: b2y, z: b2z - r2, w: b2w },
    { x: b2x, y: b2y, z: b2z, w: b2w + r2 },
    { x: b2x, y: b2y, z: b2z, w: b2w - r2 }
  );
  // Các cạnh chéo nối 16-Cell quanh tâm Bob 2
  for (let i = 0; i < 8; i++) {
    edges.push([b2Idx, b2_16CellStart + i]);
    for (let j = i + 1; j < 8; j++) {
      if (Math.floor(i / 2) !== Math.floor(j / 2)) {
        edges.push([b2_16CellStart + i, b2_16CellStart + j]);
      }
    }
  }

  // 4. Vệt quỹ đạo 4D Trail
  if (sim.trail.length > 1) {
    const trail4DStart = vertices4D.length;
    for (let i = 0; i < sim.trail.length; i++) {
      vertices4D.push({
        x: sim.trail[i].x,
        y: sim.trail[i].y,
        z: sim.trail[i].z,
        w: sim.trail[i].w ?? 0,
      });
      if (i > 0) {
        edges.push([trail4DStart + i - 1, trail4DStart + i]);
      }
    }
    edges.push([b2Idx, trail4DStart + sim.trail.length - 1]);
  }

  // Tạo vertices 3D tương đương (chiếu đơn giản w=0)
  const vertices3D: Point3D[] = vertices4D.map((p) => ({
    x: p.x,
    y: p.y,
    z: p.z,
  }));

  return {
    id: 'double-pendulum-4d',
    name: 'Double Pendulum 4D Hyperspace',
    nameVi: 'Con Lắc Kép 4D (Siêu Không Gian)',
    descriptionVi: `Khớp 1: ${formatDetailedDegree(theta1)} • Khớp 2: ${formatDetailedDegree(theta2)} • Hướng 3D: ${formatDetailedDegree(phi)} • Trục 4D: ${formatDetailedDegree(psi4D)}`,
    vertices: vertices3D,
    edges,
    majorVertices,
    is4D: true,
    vertices4D,
    cells4DCount: 16,
    hyperType: 'custom-4d',
  };
}
