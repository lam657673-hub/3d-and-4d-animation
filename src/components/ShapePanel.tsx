import React, { useState } from 'react';
import { RenderTheme, Shape3D } from '../types';
import {
  Box,
  Pyramid,
  Octagon,
  Sparkles,
  PenTool,
  Disc,
  Layers,
  Network,
  Zap,
  Flame,
  Orbit,
  ArrowUpRight,
  Music,
  Shield,
  Crown,
} from 'lucide-react';
import { cosmicAudio } from '../utils/audioEngine';
import {
  makeCube,
  makePyramid,
  makeOctahedron,
  makeIcosahedron,
  makeTorus,
  makeQuantumPlexus,
  makeHyperPoint10000,
  makeTesseract,
  make24Cell,
  make16Cell,
  make5Cell,
  makeCliffordTorus4D,
  extrudeShapeTo4D,
  makeThienLong3D,
  makeThanhTai3D,
  makeDualCreators3D,
  makeThienLong4D,
  makeThanhTai4D,
  makeDualCreators4D,
  makeDoublePendulum3D,
  makeDoublePendulum4D,
  makePenteract5D,
  make5Simplex,
  make5Orthoplex,
  makeDoublePendulum5D,
  makeThienLong5D,
  makeThanhTai5D,
  makeDualCreators5D,
} from '../utils/shapes';

interface ShapePanelProps {
  currentShape: Shape3D;
  onSelectShape: (shape: Shape3D) => void;
  onOpenDrawer: () => void;
  theme: RenderTheme;
}

export const ShapePanel: React.FC<ShapePanelProps> = ({
  currentShape,
  onSelectShape,
  onOpenDrawer,
  theme,
}) => {
  const [activeCategory, setActiveCategory] = useState<'3D' | '4D' | '5D'>(
    currentShape.is5D ? '5D' : currentShape.is4D ? '4D' : '3D'
  );

  React.useEffect(() => {
    if (currentShape.is5D) {
      setActiveCategory('5D');
    } else if (currentShape.is4D) {
      setActiveCategory('4D');
    }
  }, [currentShape.id, currentShape.is5D, currentShape.is4D]);

  const isSuperPointSelected =
    currentShape.id === 'super-point-10000' || currentShape.id === 'super-point-77777';

  const shape3DPresets = [
    // --- KHỐI 3D ĐẶC TRƯNG TÁC GIẢ ---
    {
      id: 'thien-long-3d',
      nameVi: 'THIÊN LONG 3D',
      nameEn: 'Thiên Long Wireframe',
      icon: Shield,
      generator: () => {
        cosmicAudio.playTheme('equinox');
        return makeThienLong3D();
      },
      badge: '👑 Người làm ra • Equinox',
      isAuthor: true,
      color: '#00ffcc',
    },
    {
      id: 'thanh-tai-3d',
      nameVi: 'THÀNH TÀI 3D',
      nameEn: 'Thành Tài Wireframe',
      icon: Zap,
      generator: () => {
        cosmicAudio.playTheme('attribute');
        return makeThanhTai3D();
      },
      badge: '⚡ Ý tưởng • Attribute',
      isAuthor: true,
      color: '#c084fc',
    },
    {
      id: 'dual-creators-3d',
      nameVi: 'SONG HÙNG 3D',
      nameEn: 'Thiên Long × Thành Tài',
      icon: Flame,
      generator: () => {
        cosmicAudio.playTheme('equinox');
        return makeDualCreators3D();
      },
      badge: '✨ Tượng Đài Đôi',
      isAuthor: true,
      color: '#f59e0b',
    },
    // --- CON LẮC KÉP HỖN LOẠN (DOUBLE PENDULUM) ---
    {
      id: 'double-pendulum-3d',
      nameVi: 'KHỐI GỖ CON LẮC KÉP 3D',
      nameEn: 'Wooden Double Pendulum 3D',
      icon: Orbit,
      generator: () => {
        cosmicAudio.playTheme('equinox');
        return makeDoublePendulum3D();
      },
      badge: '🪵 Khối Gỗ Xưởng Mộc • Góc 000,0000°',
      isAuthor: false,
      color: '#f59e0b',
    },
    // --- CÁC HÌNH KHỐI 3D CHUẨN ---
    {
      id: 'cube',
      nameVi: 'Lập phương',
      nameEn: 'Cube',
      icon: Box,
      generator: () => makeCube(120),
    },
    {
      id: 'pyramid',
      nameVi: 'Hình chóp',
      nameEn: 'Pyramid',
      icon: Pyramid,
      generator: () => makePyramid(140),
    },
    {
      id: 'octahedron',
      nameVi: 'Bát diện',
      nameEn: 'Octahedron',
      icon: Octagon,
      generator: () => makeOctahedron(140),
    },
    {
      id: 'icosahedron',
      nameVi: 'Khối 20 mặt',
      nameEn: 'Icosahedron',
      icon: Layers,
      generator: () => makeIcosahedron(120),
    },
    {
      id: 'torus',
      nameVi: 'Vòng xuyến',
      nameEn: 'Torus',
      icon: Disc,
      generator: () => makeTorus(85, 30, 14, 8),
    },
    {
      id: 'quantum-plexus',
      nameVi: 'Mạng Lượng Tử',
      nameEn: 'Quantum Plexus',
      icon: Network,
      generator: () => makeQuantumPlexus(),
      badge: '1.200+ Dây',
      isHyper: true,
    },
  ];

  const shape4DPresets = [
    // --- KHỐI 4D ĐẶC TRƯNG TÁC GIẢ ---
    {
      id: 'thien-long-4d',
      nameVi: 'THIÊN LONG 4D',
      nameEn: 'Tesseract Thiên Long',
      icon: Shield,
      generator: () => {
        cosmicAudio.playTheme('equinox');
        return makeThienLong4D();
      },
      badge: '👑 4D Lộn Ruột • Equinox',
      desc: 'Tesseract Chữ 4D',
      color: '#00ffcc',
    },
    {
      id: 'thanh-tai-4d',
      nameVi: 'THÀNH TÀI 4D',
      nameEn: 'Hyper-Matrix Thành Tài',
      icon: Zap,
      generator: () => {
        cosmicAudio.playTheme('attribute');
        return makeThanhTai4D();
      },
      badge: '⚡ 4D Ma Trận • Attribute',
      desc: 'Hyperspace Thuộc Tính',
      color: '#e879f9',
    },
    {
      id: 'dual-creators-4d',
      nameVi: 'SONG HÙNG 4D',
      nameEn: 'Thiên Long × Thành Tài',
      icon: Flame,
      generator: () => {
        cosmicAudio.playTheme('equinox');
        return makeDualCreators4D();
      },
      badge: '🌌 W+ & W- Hoán Đổi',
      desc: 'Hyper-Duality Kép',
      color: '#f59e0b',
    },
    // --- CON LẮC KÉP SIÊU KHÔNG GIAN 4D ---
    {
      id: 'double-pendulum-4d',
      nameVi: 'KHỐI GỖ CON LẮC KÉP 4D',
      nameEn: 'Wooden Double Pendulum 4D',
      icon: Orbit,
      generator: () => {
        cosmicAudio.playTheme('equinox');
        return makeDoublePendulum4D();
      },
      badge: '🪵 Siêu Khối Gỗ 4D • Góc 000,0000°',
      desc: 'Khối dầm gỗ đa chiều lộn ruột trục W',
      color: '#f59e0b',
    },
    // --- CÁC HÌNH SIÊU KHÔNG GIAN 4D CHUẨN ---
    {
      id: 'tesseract-4d',
      nameVi: 'Siêu Lập Phương',
      nameEn: 'Tesseract 4D',
      icon: Box,
      generator: () => makeTesseract(85),
      badge: '16 Đỉnh • 32 Cạnh',
      desc: '8 khối 3D lộn ruột',
      color: '#c084fc',
    },
    {
      id: '24-cell-4d',
      nameVi: 'Khối 24 Mặt',
      nameEn: '24-Cell (Độc Bản)',
      icon: Orbit,
      generator: () => make24Cell(95),
      badge: '24 Đỉnh • 96 Cạnh',
      desc: 'Chỉ tồn tại ở 4D',
      color: '#e879f9',
    },
    {
      id: '16-cell-4d',
      nameVi: 'Siêu Bát Diện',
      nameEn: '16-Cell',
      icon: Octagon,
      generator: () => make16Cell(110),
      badge: '8 Đỉnh • 24 Cạnh',
      desc: 'Đối ngẫu Tesseract',
      color: '#38bdf8',
    },
    {
      id: 'clifford-torus-4d',
      nameVi: 'Xuyến Clifford',
      nameEn: 'Clifford Torus',
      icon: Disc,
      generator: () => makeCliffordTorus4D(14, 14, 95),
      badge: '196 Đỉnh • 392 Cạnh',
      desc: 'Không tự giao nhau',
      color: '#00ffcc',
    },
    {
      id: '5-cell-4d',
      nameVi: 'Siêu Tứ Diện',
      nameEn: '5-Cell Simplex',
      icon: Pyramid,
      generator: () => make5Cell(115),
      badge: '5 Đỉnh • 10 Cạnh',
      desc: 'Đơn hình 4D K5',
      color: '#f59e0b',
    },
  ];

  const shape5DPresets = [
    // --- KHỐI 5D ĐẶC TRƯNG TÁC GIẢ ---
    {
      id: 'thien-long-5d',
      nameVi: 'THIÊN LONG 5D',
      nameEn: 'Penteract Thiên Long',
      icon: Shield,
      generator: () => {
        cosmicAudio.playTheme('equinox');
        return makeThienLong5D();
      },
      badge: '👑 Siêu Chiều 5D • Equinox',
      desc: '4 Lớp W & V Giao Thoa',
      color: '#10b981',
    },
    {
      id: 'thanh-tai-5d',
      nameVi: 'THÀNH TÀI 5D',
      nameEn: '5D Matrix Thành Tài',
      icon: Zap,
      generator: () => {
        cosmicAudio.playTheme('attribute');
        return makeThanhTai5D();
      },
      badge: '⚡ Ma Trận 5D • Attribute',
      desc: 'Trục V Thuộc Tính',
      color: '#34d399',
    },
    {
      id: 'dual-creators-5d',
      nameVi: 'SONG HÙNG 5D',
      nameEn: 'Thiên Long × Thành Tài',
      icon: Flame,
      generator: () => {
        cosmicAudio.playTheme('equinox');
        return makeDualCreators5D();
      },
      badge: '🌌 Siêu Đa Chiều Kép',
      desc: 'Lộn nhào W & V Cùng Lúc',
      color: '#06b6d4',
    },
    // --- CON LẮC KÉP 5D ---
    {
      id: 'double-pendulum-5d',
      nameVi: 'KHỐI GỖ CON LẮC KÉP 5D',
      nameEn: 'Wooden Double Pendulum 5D',
      icon: Orbit,
      generator: () => {
        cosmicAudio.playTheme('equinox');
        return makeDoublePendulum5D();
      },
      badge: '🪵 5D Vô Cực • Góc 000,0000°',
      desc: 'Hỗn loạn 5 chiều lồng Hyper-Prism',
      color: '#f59e0b',
    },
    // --- CÁC KHỐI SIÊU ĐA DIỆN 5 CHIỀU CHUẨN ---
    {
      id: 'penteract-5d',
      nameVi: 'Siêu Lập Phương 5D',
      nameEn: 'Penteract (5-Cube)',
      icon: Box,
      generator: () => makePenteract5D(80),
      badge: '32 Đỉnh • 80 Cạnh',
      desc: '10 Tesseract lộn ruột',
      color: '#10b981',
    },
    {
      id: 'simplex-5d',
      nameVi: 'Siêu Tứ Diện 5D',
      nameEn: '5-Simplex (Hexateron)',
      icon: Pyramid,
      generator: () => make5Simplex(110),
      badge: '6 Đỉnh • 15 Cạnh',
      desc: 'Cách đều trong R^5',
      color: '#06b6d4',
    },
    {
      id: 'orthoplex-5d',
      nameVi: 'Siêu Bát Diện 5D',
      nameEn: '5-Orthoplex (32-Cell)',
      icon: Octagon,
      generator: () => make5Orthoplex(120),
      badge: '10 Đỉnh • 40 Cạnh',
      desc: 'Đối ngẫu Penteract',
      color: '#a7f3d0',
    },
  ];

  return (
    <div
      id="shape-selection-panel"
      className="bg-[#0b0e15] border border-neutral-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden"
      style={{
        boxShadow: `0 0 25px rgba(0,0,0,0.9), 0 0 15px ${theme.glowColor}20`,
        borderColor: `${theme.lineColor}40`,
      }}
    >
      {/* Top subtle neon line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.lineColor}, transparent)`,
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-medium text-white">
          <div
            className="w-5 h-5 rounded-lg flex items-center justify-center border shadow-sm"
            style={{
              backgroundColor: '#000000',
              borderColor: `${theme.lineColor}60`,
              boxShadow: `0 0 8px ${theme.glowColor}`,
              color: theme.lineColor,
            }}
          >
            <Box className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wider uppercase text-white font-bold">CHỌN HÌNH DẠNG KHÔNG GIAN</span>
        </div>

        {/* 3D vs 4D vs 5D Mode Switcher Pills */}
        <div className="flex items-center gap-1 bg-black p-0.5 rounded-lg border border-neutral-700">
          <button
            onClick={() => setActiveCategory('3D')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition ${
              activeCategory === '3D'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            3D CHUẨN
          </button>
          <button
            onClick={() => setActiveCategory('4D')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 transition ${
              activeCategory === '4D'
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.8)]'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-2.5 h-2.5" />
            4D HYPER
          </button>
          <button
            onClick={() => setActiveCategory('5D')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 transition ${
              activeCategory === '5D'
                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.9)]'
                : 'text-emerald-400 hover:text-white'
            }`}
          >
            <Flame className="w-2.5 h-2.5 text-emerald-300" />
            5D SIÊU CHIỀU
          </button>
        </div>
      </div>

      {/* Category 1: 3D Presets */}
      {activeCategory === '3D' && (
        <div className="flex flex-col gap-2">
          {/* Credit Bar for 3D with song & shape triggers */}
          <div className="flex flex-wrap items-center justify-between px-3 py-1.5 rounded-xl bg-[#07090e] border border-cyan-500/40 text-[11px] font-mono shadow-sm gap-1.5">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>MỤC 3D WIREFRAME</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {/* Thien Long Button */}
              <button
                onClick={() => {
                  cosmicAudio.playTheme('equinox');
                  onSelectShape(makeThienLong3D());
                }}
                title="Bấm để phát Equinox & Xem Khối 3D THIÊN LONG (Người làm ra)"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition text-neutral-200 hover:text-white ${
                  currentShape.id === 'thien-long-3d'
                    ? 'bg-cyan-900 border border-cyan-400 text-white shadow-[0_0_8px_rgba(0,255,204,0.5)] font-bold'
                    : 'bg-cyan-950/70 border border-cyan-500/40 hover:bg-cyan-900'
                }`}
              >
                <span>Người làm ra:</span>
                <strong className="text-cyan-300 underline decoration-cyan-500">Thiên Long</strong>
                <span className="text-[9px] px-1 py-0.1 bg-black/60 rounded text-cyan-400 font-bold border border-cyan-500/30">
                  👑 3D • 🎵 Equinox
                </span>
              </button>

              <span className="text-neutral-600 font-bold">•</span>

              {/* Thanh Tai Button */}
              <button
                onClick={() => {
                  cosmicAudio.playTheme('attribute');
                  onSelectShape(makeThanhTai3D());
                }}
                title="Bấm để phát Attribute & Xem Khối 3D THÀNH TÀI (Ý tưởng)"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition text-neutral-200 hover:text-white ${
                  currentShape.id === 'thanh-tai-3d'
                    ? 'bg-purple-900 border border-purple-400 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)] font-bold'
                    : 'bg-purple-950/70 border border-purple-500/40 hover:bg-purple-900'
                }`}
              >
                <span>Ý tưởng:</span>
                <strong className="text-purple-300 underline decoration-purple-500">Thành Tài</strong>
                <span className="text-[9px] px-1 py-0.1 bg-black/60 rounded text-purple-400 font-bold border border-purple-500/30">
                  ⚡ 3D • 🎵 Attribute
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {shape3DPresets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = currentShape.id === preset.id;
              const buttonColor = preset.color || theme.lineColor;
              return (
                <button
                  key={preset.id}
                  id={`btn-shape-${preset.id}`}
                  onClick={() => onSelectShape(preset.generator())}
                  style={{
                    borderColor: isSelected
                      ? buttonColor
                      : preset.isAuthor
                      ? `${buttonColor}60`
                      : undefined,
                    boxShadow: isSelected
                      ? `0 0 16px ${buttonColor}, inset 0 0 10px ${buttonColor}25`
                      : preset.isAuthor
                      ? `0 0 10px ${buttonColor}20`
                      : undefined,
                  }}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                    isSelected
                      ? 'text-white bg-neutral-900'
                      : preset.isAuthor
                      ? 'bg-neutral-900/95 text-white hover:bg-neutral-850'
                      : 'bg-neutral-900/90 border-neutral-700 text-neutral-200 hover:text-white hover:border-cyan-400 hover:bg-neutral-850'
                  }`}
                >
                  {preset.badge && (
                    <span
                      className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold flex items-center gap-0.5"
                      style={{
                        backgroundColor: '#05070d',
                        color: buttonColor,
                        borderColor: `${buttonColor}80`,
                        borderWidth: 1,
                        boxShadow: `0 0 8px ${buttonColor}40`,
                      }}
                    >
                      {preset.badge}
                    </span>
                  )}
                  <Icon
                    className={`w-5 h-5 mb-1.5 transition-colors ${preset.isHyper || preset.isAuthor ? 'animate-pulse' : ''}`}
                    style={{
                      color: isSelected ? buttonColor : buttonColor,
                      filter: `drop-shadow(0 0 6px ${buttonColor})`,
                    }}
                  />
                  <span className="font-bold text-white text-xs">{preset.nameVi}</span>
                  <span className="text-[11px] text-neutral-300 font-medium font-mono">{preset.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category 2: 4D Hyperspace Presets */}
      {activeCategory === '4D' && (
        <div className="flex flex-col gap-2">
          {/* Credit Bar for 4D with song triggers */}
          <div className="flex flex-wrap items-center justify-between px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/50 text-[11px] font-mono shadow-[0_0_12px_rgba(168,85,247,0.2)] gap-1.5">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>MỤC 4D HYPERSPACE</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {/* Thien Long Button */}
              <button
                onClick={() => {
                  cosmicAudio.playTheme('equinox');
                  onSelectShape(makeThienLong4D());
                }}
                title="Bấm để phát Equinox & Xem Khối 4D THIÊN LONG (Hyper-Tesseract)"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition text-neutral-200 hover:text-white ${
                  currentShape.id === 'thien-long-4d'
                    ? 'bg-purple-900 border border-cyan-400 text-white shadow-[0_0_10px_rgba(0,255,204,0.6)] font-bold'
                    : 'bg-purple-950/80 border border-purple-500/40 hover:bg-purple-900'
                }`}
              >
                <span>Người làm ra:</span>
                <strong className="text-purple-300 underline decoration-purple-500">Thiên Long</strong>
                <span className="text-[9px] px-1 py-0.1 bg-black/60 rounded text-cyan-300 font-bold border border-cyan-500/40">
                  👑 4D • 🎵 Equinox
                </span>
              </button>

              <span className="text-neutral-600 font-bold">•</span>

              {/* Thanh Tai Button */}
              <button
                onClick={() => {
                  cosmicAudio.playTheme('attribute');
                  onSelectShape(makeThanhTai4D());
                }}
                title="Bấm để phát Attribute & Xem Khối 4D THÀNH TÀI (Hyper-Matrix)"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition text-neutral-200 hover:text-white ${
                  currentShape.id === 'thanh-tai-4d'
                    ? 'bg-fuchsia-900 border border-fuchsia-400 text-white shadow-[0_0_10px_rgba(232,121,249,0.6)] font-bold'
                    : 'bg-fuchsia-950/80 border border-fuchsia-500/40 hover:bg-fuchsia-900'
                }`}
              >
                <span>Ý tưởng:</span>
                <strong className="text-fuchsia-300 underline decoration-fuchsia-500">Thành Tài</strong>
                <span className="text-[9px] px-1 py-0.1 bg-black/60 rounded text-purple-300 font-bold border border-purple-500/40">
                  ⚡ 4D • 🎵 Attribute
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {shape4DPresets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = currentShape.id === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`btn-shape-${preset.id}`}
                  onClick={() => onSelectShape(preset.generator())}
                  style={{
                    borderColor: isSelected ? preset.color : undefined,
                    boxShadow: isSelected
                      ? `0 0 16px ${preset.color}80, inset 0 0 10px ${preset.color}30`
                      : undefined,
                  }}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                    isSelected
                      ? 'text-white bg-purple-950/50'
                      : 'bg-neutral-900/90 border-purple-900/50 text-neutral-200 hover:text-white hover:border-purple-400 hover:bg-neutral-850'
                  }`}
                >
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold bg-purple-950 text-purple-200 border border-purple-500/70 shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                    {preset.badge}
                  </span>
                  <Icon
                    className="w-5 h-5 mb-1.5 animate-pulse"
                    style={{
                      color: preset.color,
                      filter: `drop-shadow(0 0 6px ${preset.color})`,
                    }}
                  />
                  <span className="font-bold text-white text-xs">{preset.nameVi}</span>
                  <span className="text-[10px] text-purple-300 font-medium font-mono">{preset.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Button: Extrude Any Current Shape to 4D! */}
          <button
            onClick={() => onSelectShape(extrudeShapeTo4D(currentShape))}
            title="Nhân bản khối hiện tại sang chiều không gian W để tạo Siêu Lăng Trụ 4D"
            className="flex items-center justify-between px-3 py-2 rounded-xl border border-purple-500/60 bg-gradient-to-r from-purple-950/60 to-fuchsia-950/40 text-purple-200 hover:text-white hover:border-purple-400 transition text-xs font-mono font-bold active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
          >
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-purple-400" />
              <span>Đùn khối "{currentShape.nameVi}" lên Chiều Thứ 4 (4D Prism)</span>
            </div>
            <span className="text-[10px] bg-purple-800/80 text-white px-2 py-0.5 rounded border border-purple-400">
              KÍCH HOẠT 4D
            </span>
          </button>
        </div>
      )}

      {/* Category 3: 5D Hyper-Space Presets */}
      {activeCategory === '5D' && (
        <div className="flex flex-col gap-2">
          {/* Credit Bar for 5D with song & shape triggers */}
          <div className="flex flex-wrap items-center justify-between px-3 py-1.5 rounded-xl bg-[#061812] border border-emerald-500/50 text-[11px] font-mono shadow-sm gap-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>SIÊU KHÔNG GIAN 5 CHIỀU (R^5 • TRỤC V)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {/* Thien Long Button */}
              <button
                onClick={() => {
                  cosmicAudio.playTheme('equinox');
                  onSelectShape(makeThienLong5D());
                }}
                title="Bấm để phát Equinox & Xem Khối 5D THIÊN LONG (Người làm ra)"
                className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-400/60 text-emerald-300 hover:text-white hover:bg-emerald-900 transition flex items-center gap-1 font-bold"
              >
                <span>👑 Thiên Long 5D</span>
              </button>

              {/* Thanh Tai Button */}
              <button
                onClick={() => {
                  cosmicAudio.playTheme('attribute');
                  onSelectShape(makeThanhTai5D());
                }}
                title="Bấm để phát Attribute & Xem Khối 5D THÀNH TÀI (Ý tưởng)"
                className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-teal-400/60 text-teal-300 hover:text-white hover:bg-teal-900 transition flex items-center gap-1 font-bold"
              >
                <span>⚡ Thành Tài 5D</span>
              </button>

              {/* Song Hung 5D Button */}
              <button
                onClick={() => {
                  cosmicAudio.playTheme('equinox');
                  onSelectShape(makeDualCreators5D());
                }}
                title="Bấm để phát Equinox & Kích hoạt Khối Đôi SONG HÙNG 5D"
                className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-cyan-400/60 text-cyan-300 hover:text-white hover:bg-cyan-900 transition flex items-center gap-1 font-bold"
              >
                <span>🌌 Song Hùng 5D</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {shape5DPresets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = currentShape.id === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`btn-shape-${preset.id}`}
                  onClick={() => onSelectShape(preset.generator())}
                  style={{
                    borderColor: isSelected ? preset.color : undefined,
                    boxShadow: isSelected
                      ? `0 0 16px ${preset.color}80, inset 0 0 10px ${preset.color}30`
                      : undefined,
                  }}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                    isSelected
                      ? 'text-white bg-emerald-950/50'
                      : 'bg-neutral-900/90 border-emerald-900/50 text-neutral-200 hover:text-white hover:border-emerald-400 hover:bg-neutral-850'
                  }`}
                >
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold bg-emerald-950 text-emerald-200 border border-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                    {preset.badge}
                  </span>
                  <Icon
                    className="w-5 h-5 mb-1.5 animate-pulse"
                    style={{
                      color: preset.color,
                      filter: `drop-shadow(0 0 6px ${preset.color})`,
                    }}
                  />
                  <span className="font-bold text-white text-xs">{preset.nameVi}</span>
                  <span className="text-[10px] text-emerald-300 font-medium font-mono">{preset.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/50 to-teal-950/40 text-emerald-200 text-xs font-mono">
            <div className="flex items-center gap-1.5 font-bold text-white mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>HỆ TOẠ ĐỘ 5 CHIỀU: (X, Y, Z, W, V)</span>
            </div>
            <div className="text-[11px] text-emerald-300">
              Chiếu phối cảnh 3 cấp: 5D (Trục V) → 4D (Trục W) → 3D (Trục Z) → 2D Màn hình canvas. Hỗ trợ 10 mặt phẳng siêu xoay: XV, YV, ZV, WV, ALL_5D!
            </div>
          </div>
        </div>
      )}

      {/* Super Point 10,000 + Black Hole Option */}
      <button
        id="btn-shape-super-point-10000"
        onClick={() => onSelectShape(makeHyperPoint10000())}
        style={{
          borderColor: isSuperPointSelected ? '#ef4444' : 'rgba(239, 68, 68, 0.45)',
          boxShadow: isSuperPointSelected
            ? '0 0 20px rgba(239, 68, 68, 0.7), inset 0 0 12px rgba(239, 68, 68, 0.3)'
            : '0 0 12px rgba(239, 68, 68, 0.15)',
        }}
        className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
          isSuperPointSelected
            ? 'text-white border-red-500 bg-red-950/50'
            : 'bg-neutral-900/95 border-red-500/40 text-neutral-200 hover:border-red-500 hover:bg-neutral-850'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center border border-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
            <Flame className="w-4 h-4 text-red-500 animate-bounce" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs">Siêu Điểm 10.000 + Lỗ Đen</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold bg-red-950 text-red-300 border border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                BẪY TROLL BẠN BÈ
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              <div>Bấm vào là lag bốc mùi khét liền! (Bấm Turbo 60 FPS để cứu)</div>
              <div className="text-[10px] text-red-300 font-semibold flex items-center gap-1 mt-0.5">
                🎵 Âm thanh lỗ đen ma mị • Sáng tạo: Thiên Long & Thành Tài
              </div>
            </div>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md border flex items-center gap-1 ${
            isSuperPointSelected
              ? 'bg-red-600 text-white border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
              : 'bg-red-950/80 text-red-300 border-red-500/50'
          }`}
        >
          <Flame className="w-3 h-3 text-red-400" />
          10.000 + LỖ ĐEN
        </span>
      </button>

      {/* Custom 2D Polygon Button ("Tự vẽ") spanning bottom */}
      <button
        id="btn-open-custom-draw"
        onClick={onOpenDrawer}
        style={{
          borderColor: currentShape.isCustom ? theme.lineColor : undefined,
          boxShadow: currentShape.isCustom
            ? `0 0 14px ${theme.glowColor}, inset 0 0 10px ${theme.glowColor}25`
            : undefined,
        }}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
          currentShape.isCustom
            ? 'text-white border-cyan-400 bg-neutral-900'
            : 'border-cyan-500/60 bg-neutral-900/90 text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_14px_rgba(0,255,204,0.3)] hover:bg-neutral-850'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center border border-cyan-500/50">
            <PenTool className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="font-bold text-white text-xs">Tự vẽ hình & chữ viết 3D (3 kiểu)</div>
            <div className="text-[11px] text-cyan-300 font-mono">1. Hold (vẽ tự do) • 2. Click • 3. Waiting</div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40">
          MỞ BẢNG VẼ
        </span>
      </button>

      {currentShape.isCustom && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-cyan-500/60 text-xs text-cyan-200 shadow-[0_0_12px_rgba(0,255,204,0.15)]">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-cyan-400" />
            <span className="truncate">Đang hiển thị: <strong className="text-white font-bold">{currentShape.nameVi}</strong></span>
          </div>
          <button
            onClick={onOpenDrawer}
            className="text-xs text-cyan-300 underline font-semibold hover:text-white flex-shrink-0 ml-2 font-mono"
          >
            Chỉnh sửa
          </button>
        </div>
      )}
    </div>
  );
};
