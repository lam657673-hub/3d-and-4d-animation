import React, { useState, useEffect } from 'react';
import { ControlState, RenderSettings, Shape3D } from './types';
import {
  makeCube,
  makeQuantumPlexus,
  makeHyperPoint10000,
  COLOR_THEMES,
  makeThienLong3D,
  makeThanhTai3D,
  makeDualCreators3D,
  makeThienLong4D,
  makeThanhTai4D,
  makeDualCreators4D,
  makeDoublePendulum3D,
  makeDoublePendulum4D,
  makeDoublePendulum5D,
  makeThienLong5D,
  makeThanhTai5D,
  makeDualCreators5D,
} from './utils/shapes';
import { cosmicAudio, SoundMode } from './utils/audioEngine';
import { Viewport3D } from './components/Viewport3D';
import { JoystickControl } from './components/JoystickControl';
import { ShapePanel } from './components/ShapePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ShapeDrawerModal } from './components/ShapeDrawerModal';
import { AudioHubModal } from './components/AudioHubModal';
import {
  Box,
  Compass,
  PenTool,
  Sliders,
  Layers,
  Sparkles,
  Info,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  Shield,
  Zap,
  Disc,
  Orbit,
} from 'lucide-react';

export default function App() {
  // Currently active 3D shape
  const [currentShape, setCurrentShape] = useState<Shape3D>(() => makeQuantumPlexus());

  // Joystick state: angle in radians, speed from 0 to 450
  const [control, setControl] = useState<ControlState>({
    angle: -Math.PI / 2,
    speed: 0,
  });

  // Cosmic Audio state & modal
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => cosmicAudio.getIsMuted());
  const [activeAudioMode, setActiveAudioMode] = useState<SoundMode>(() => cosmicAudio.getCurrentMode());
  const [isAudioHubOpen, setIsAudioHubOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = cosmicAudio.subscribe(() => {
      setIsAudioMuted(cosmicAudio.getIsMuted());
      setActiveAudioMode(cosmicAudio.getCurrentMode());
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handlePlayTheme = (theme: SoundMode, artistName: string, songName: string) => {
    cosmicAudio.playTheme(theme);
    showToast(`🎵 Đang phát: ${songName} (Theme của ${artistName})`);
  };

  const handleSelectAuthorShape = (
    author: 'thien-long' | 'thanh-tai' | 'dual',
    dim: '3D' | '4D' | '5D'
  ) => {
    if (author === 'thien-long') {
      cosmicAudio.playTheme('equinox');
      setCurrentShape(dim === '3D' ? makeThienLong3D() : dim === '4D' ? makeThienLong4D() : makeThienLong5D());
      showToast(`👑 Đã kích hoạt Khối ${dim} THIÊN LONG (Người làm ra) • ⚔️ Equinox Theme!`);
    } else if (author === 'thanh-tai') {
      cosmicAudio.playTheme('attribute');
      setCurrentShape(dim === '3D' ? makeThanhTai3D() : dim === '4D' ? makeThanhTai4D() : makeThanhTai5D());
      showToast(`⚡ Đã kích hoạt Khối ${dim} THÀNH TÀI (Ý tưởng) • ⚡ Attribute Theme!`);
    } else {
      cosmicAudio.playTheme('equinox');
      setCurrentShape(dim === '3D' ? makeDualCreators3D() : dim === '4D' ? makeDualCreators4D() : makeDualCreators5D());
      showToast(`✨ Đã kích hoạt Đại Tượng Đài Song Hùng ${dim} (Thiên Long & Thành Tài)!`);
    }
  };

  const handleToggleAudio = () => {
    cosmicAudio.resume();
    const muted = cosmicAudio.toggleMute();
    setIsAudioMuted(muted);
    showToast(muted ? '🔇 Đã tắt âm thanh' : '🔊 Đã bật âm thanh vũ trụ');
  };

  // Render & projection settings
  const [settings, setSettings] = useState<RenderSettings>({
    theme: COLOR_THEMES[0], // Cyber Cyan (#00ffcc) as in user's script
    aestheticMode: 'wooden', // 'wooden' texture mode by default, toggleable to 'cyber'
    fov: 300, // Matching user's this.fov = 300
    scale: 1.0,
    lineWidth: 2, // Matching user's this.graphics.lineStyle(2, 0x00ffcc, 1)
    vertexRadius: 4, // Matching user's fillCircle(p.x, p.y, 4)
    showVertices: true,
    showEdges: true,
    showDepthDimming: true,
    showCoordinates: true,
    showStats: true,
    autoSpin: false,
    // Hiệu ứng vệt sáng chuyển động (Motion Trail)
    motionTrail: true,
    trailLength: 20,
    trailPersistence: 0.85,
    // 4D Hyperspace settings
    hyperSpeed: 1.0,
    hyperPlane: 'XW',
    hyperDistance: 2.2,
    hyperSliceW: 0.0,
    autoHyperSpin: true,
    hyperColorW: true,
    // 5D Hyperspace settings (Trục không gian thứ 5 V)
    hyper5DSpeed: 1.0,
    hyper5DPlane: 'WV',
    hyper5DDistance: 2.5,
    autoHyper5DSpin: true,
    hyperColor5D: true,
    // Hệ thống giảm lag mặc định
    antiLag: false,
    disableGlow: false,
    capDpr: false,
    lodDensity: 1.0,
    autoAntiLag: true,
  });

  // Custom 2D polygon drawing modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Active tab on mobile (viewport / controls / settings)
  const [mobileTab, setMobileTab] = useState<'viewport' | 'controls' | 'settings'>('viewport');

  const handleUpdateSettings = (partial: Partial<RenderSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleApplyCustomShape = (shape: Shape3D) => {
    setCurrentShape(shape);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <header
        className="border-b bg-[#0c0e15] px-4 py-3 sticky top-0 z-30 shadow-2xl"
        style={{
          borderColor: `${settings.theme.lineColor}35`,
          boxShadow: `0 4px 25px rgba(0,0,0,0.9), 0 2px 10px ${settings.theme.glowColor}15`,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-lg transition-colors bg-black"
              style={{
                borderColor: `${settings.theme.lineColor}70`,
                boxShadow: `0 0 12px ${settings.theme.glowColor}, inset 0 0 8px ${settings.theme.glowColor}20`,
                color: settings.theme.lineColor,
              }}
            >
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className="text-base font-bold tracking-tight text-white flex items-center gap-1.5"
                  style={{
                    textShadow: `0 0 12px ${settings.theme.glowColor}50`,
                  }}
                >
                  3D, 4D & 5D Wireframe Studio
                </h1>

                {/* Credit badge with interactive 3D/4D/5D shapes & songs: Thiên Long (Equinox) & Thành Tài (Attribute) */}
                <div
                  className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-black/95 border shadow-md font-semibold tracking-wide"
                  style={{
                    borderColor: 'rgba(0, 255, 204, 0.6)',
                    boxShadow: '0 0 16px rgba(0, 255, 204, 0.25)',
                  }}
                >
                  {/* Thien Long - Shape & Song */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSelectAuthorShape('thien-long', '3D')}
                      title="Kích hoạt Khối 3D THIÊN LONG & phát Equinox Armor Theme"
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition active:scale-95 ${
                        (currentShape.id === 'thien-long-3d' || currentShape.id === 'thien-long-4d' || currentShape.id === 'thien-long-5d')
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-[0_0_10px_rgba(0,255,204,0.5)] font-bold'
                          : 'text-neutral-200 hover:text-cyan-300 hover:bg-white/5'
                      }`}
                    >
                      <Shield className="w-3 h-3 text-cyan-400" />
                      <span>Người làm ra: <strong className="text-white underline decoration-cyan-400">Thiên Long</strong></span>
                    </button>
                    {/* Quick 3D / 4D / 5D switchers */}
                    <button
                      onClick={() => handleSelectAuthorShape('thien-long', '3D')}
                      title="Xem Khối 3D THIÊN LONG"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'thien-long-3d'
                          ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold shadow-[0_0_8px_rgba(0,255,204,0.8)]'
                          : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-800'
                      }`}
                    >
                      3D
                    </button>
                    <button
                      onClick={() => handleSelectAuthorShape('thien-long', '4D')}
                      title="Xem Khối 4D THIÊN LONG (Hyper-Tesseract Lộn Ruột)"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'thien-long-4d'
                          ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold shadow-[0_0_8px_rgba(0,255,204,0.8)]'
                          : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-800'
                      }`}
                    >
                      4D
                    </button>
                    <button
                      onClick={() => handleSelectAuthorShape('thien-long', '5D')}
                      title="Xem Khối 5D THIÊN LONG (4 Lớp Giao Thoa Siêu Chiều)"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'thien-long-5d'
                          ? 'bg-emerald-400 text-black border-emerald-300 font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-800'
                      }`}
                    >
                      5D
                    </button>
                    <button
                      onClick={() => handlePlayTheme('equinox', 'Thiên Long', 'Equinox Armor Theme')}
                      title="Phát Equinox Armor Theme"
                      className="text-[9px] px-1.5 py-0.2 rounded bg-black/80 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-950 flex items-center gap-0.5 font-bold"
                    >
                      <Music className="w-2.5 h-2.5" /> Equinox
                    </button>
                  </div>

                  <span className="text-neutral-600 font-bold">•</span>

                  {/* Thanh Tai - Shape & Song */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSelectAuthorShape('thanh-tai', '3D')}
                      title="Kích hoạt Khối 3D THÀNH TÀI & phát Attribute Mutilation"
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition active:scale-95 ${
                        (currentShape.id === 'thanh-tai-3d' || currentShape.id === 'thanh-tai-4d' || currentShape.id === 'thanh-tai-5d')
                          ? 'bg-purple-500/25 text-purple-200 border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] font-bold'
                          : 'text-neutral-200 hover:text-purple-300 hover:bg-white/5'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span>Ý tưởng: <strong className="text-white underline decoration-purple-400">Thành Tài</strong></span>
                    </button>
                    {/* Quick 3D / 4D / 5D switchers */}
                    <button
                      onClick={() => handleSelectAuthorShape('thanh-tai', '3D')}
                      title="Xem Khối 3D THÀNH TÀI"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'thanh-tai-3d'
                          ? 'bg-purple-400 text-black border-purple-300 font-extrabold shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                          : 'bg-purple-950/80 text-purple-300 border-purple-500/40 hover:bg-purple-800'
                      }`}
                    >
                      3D
                    </button>
                    <button
                      onClick={() => handleSelectAuthorShape('thanh-tai', '4D')}
                      title="Xem Khối 4D THÀNH TÀI (Hyper-Matrix)"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'thanh-tai-4d'
                          ? 'bg-purple-400 text-black border-purple-300 font-extrabold shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                          : 'bg-purple-950/80 text-purple-300 border-purple-500/40 hover:bg-purple-800'
                      }`}
                    >
                      4D
                    </button>
                    <button
                      onClick={() => handleSelectAuthorShape('thanh-tai', '5D')}
                      title="Xem Khối 5D THÀNH TÀI (Ma Trận Siêu Chiều Trục V)"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'thanh-tai-5d'
                          ? 'bg-emerald-400 text-black border-emerald-300 font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-800'
                      }`}
                    >
                      5D
                    </button>
                    <button
                      onClick={() => handlePlayTheme('attribute', 'Thành Tài', 'Attribute Mutilation Fractured')}
                      title="Phát Attribute Mutilation Fractured"
                      className="text-[9px] px-1.5 py-0.2 rounded bg-black/80 text-purple-300 border border-purple-500/50 hover:bg-purple-950 flex items-center gap-0.5 font-bold"
                    >
                      <Music className="w-2.5 h-2.5" /> Attribute
                    </button>
                  </div>

                  <span className="text-neutral-600 font-bold">•</span>

                  {/* Dual Monument Button */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSelectAuthorShape('dual', currentShape.is5D ? '5D' : currentShape.is4D ? '4D' : '3D')}
                      title="Xem Đại Tượng Đài Song Hùng (Thiên Long × Thành Tài)"
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1 ${
                        (currentShape.id === 'dual-creators-3d' || currentShape.id === 'dual-creators-4d' || currentShape.id === 'dual-creators-5d')
                          ? 'bg-amber-400 text-black border-amber-300 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                          : 'bg-amber-950/70 text-amber-300 border-amber-500/50 hover:bg-amber-900'
                      }`}
                    >
                      👑 Song Hùng {currentShape.is5D ? '5D' : currentShape.is4D ? '4D' : '3D'}
                    </button>
                    <button
                      onClick={() => handleSelectAuthorShape('dual', '5D')}
                      title="Kích hoạt Song Hùng 5D"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'dual-creators-5d'
                          ? 'bg-emerald-400 text-black border-emerald-300 font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-800'
                      }`}
                    >
                      5D
                    </button>
                  </div>

                  <span className="text-neutral-600 font-bold">•</span>

                  {/* Double Pendulum Quick Button */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const dim = currentShape.is5D ? '5D' : currentShape.is4D ? '4D' : '3D';
                        setCurrentShape(dim === '5D' ? makeDoublePendulum5D() : dim === '4D' ? makeDoublePendulum4D() : makeDoublePendulum3D());
                        showToast(`🌀 Đã kích hoạt CON LẮC KÉP ${dim} • Tự động chuyển động liên tục & đo góc 000,0000°!`);
                      }}
                      title="Kích hoạt Con Lắc Kép: Tự động di chuyển liên tục & đo góc chính xác 000,0000°"
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1 ${
                        (currentShape.id === 'double-pendulum-3d' || currentShape.id === 'double-pendulum-4d' || currentShape.id === 'double-pendulum-5d')
                          ? 'bg-sky-400 text-black border-sky-300 font-extrabold shadow-[0_0_10px_rgba(56,189,248,0.8)]'
                          : 'bg-sky-950/80 text-sky-300 border-sky-500/50 hover:bg-sky-900'
                      }`}
                    >
                      <Orbit className="w-3 h-3 text-cyan-300 animate-spin" />
                      <span>Con Lắc Kép</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentShape(makeDoublePendulum3D());
                        showToast('🌀 Con Lắc Kép 3D (Không gian 3 chiều)');
                      }}
                      title="Chuyển sang Con Lắc Kép 3D"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'double-pendulum-3d'
                          ? 'bg-sky-400 text-black border-sky-300 font-extrabold'
                          : 'bg-sky-950/80 text-sky-300 border-sky-500/40 hover:bg-sky-800'
                      }`}
                    >
                      3D
                    </button>
                    <button
                      onClick={() => {
                        setCurrentShape(makeDoublePendulum4D());
                        showToast('🌌 Con Lắc Kép 4D Hyperspace (Trục W lộn ruột)');
                      }}
                      title="Chuyển sang Con Lắc Kép 4D Hyperspace"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'double-pendulum-4d'
                          ? 'bg-purple-400 text-black border-purple-300 font-extrabold'
                          : 'bg-purple-950/80 text-purple-300 border-purple-500/40 hover:bg-purple-800'
                      }`}
                    >
                      4D
                    </button>
                    <button
                      onClick={() => {
                        setCurrentShape(makeDoublePendulum5D());
                        showToast('🚀 Con Lắc Kép 5D Siêu Không Gian (Trục W & V)');
                      }}
                      title="Chuyển sang Con Lắc Kép 5D Siêu Không Gian"
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border transition ${
                        currentShape.id === 'double-pendulum-5d'
                          ? 'bg-emerald-400 text-black border-emerald-300 font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-800'
                      }`}
                    >
                      5D
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-300 font-medium">
                Kỹ sư: <span className="text-cyan-300 font-semibold">Thiên Long</span> (🎵 Equinox Armor) • Ý tưởng: <span className="text-purple-300 font-semibold">Thành Tài</span> (🎵 Attribute Fractured) • 4D & 5D Hyperspace (Trục W & V) • Lỗ Đen 10.000 Điểm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Jukebox / Hub Button */}
            <button
              id="btn-open-audio-hub"
              onClick={() => setIsAudioHubOpen(true)}
              title="Mở Hộp Âm Nhạc Vũ Trụ: Đổi Theme Thiên Long (Equinox), Thành Tài (Attribute), Lỗ Đen hoặc tải file MP3"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition active:scale-95 ${
                !isAudioMuted && activeAudioMode !== 'off'
                  ? 'bg-gradient-to-r from-cyan-950/80 to-purple-950/80 border-cyan-400/80 text-cyan-200 shadow-[0_0_14px_rgba(0,255,204,0.35)]'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500'
              }`}
            >
              <Disc className={`w-4 h-4 text-cyan-400 ${!isAudioMuted && activeAudioMode !== 'off' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              <span className="hidden sm:inline">Kho Âm Nhạc</span>
              {activeAudioMode === 'equinox' && <span className="text-[10px] text-cyan-300 font-mono">(Equinox)</span>}
              {activeAudioMode === 'attribute' && <span className="text-[10px] text-purple-300 font-mono">(Attribute)</span>}
            </button>

            {/* Mute/Unmute Quick Toggle */}
            <button
              id="btn-toggle-audio-header"
              onClick={handleToggleAudio}
              title={isAudioMuted ? "Bật âm thanh" : "Tắt tiếng"}
              className={`p-2 rounded-xl border text-xs font-mono font-bold transition active:scale-95 ${
                !isAudioMuted
                  ? 'bg-neutral-900 border-cyan-500/50 text-cyan-300 shadow-[0_0_8px_rgba(0,255,204,0.2)]'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              {!isAudioMuted ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
            </button>

            {/* Quick Anti-Lag Toggle Button */}
            <button
              id="btn-toggle-antilag-header"
              onClick={() => {
                const next = !settings.antiLag;
                handleUpdateSettings({
                  antiLag: next,
                  disableGlow: next,
                  capDpr: next,
                });
                showToast(
                  next
                    ? '🚀 ĐÃ BẬT GIẢM LAG: Siêu mượt 60 FPS, tối ưu hóa toàn diện!'
                    : '✨ ĐÃ TẮT GIẢM LAG: Chuyển về đồ họa đầy đủ'
                );
              }}
              title={
                settings.antiLag
                  ? "Đang BẬT Giảm Lag (60 FPS). Bấm để tắt"
                  : "Bật Chế Độ Giảm Lag (Siêu mượt 60 FPS, nhẹ máy)"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition active:scale-95 ${
                settings.antiLag
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-emerald-400 hover:border-emerald-500/50'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${settings.antiLag ? 'text-white animate-pulse' : 'text-emerald-400'}`} />
              <span className="hidden md:inline">
                {settings.antiLag ? 'Giảm Lag: BẬT' : 'Giảm Lag'}
              </span>
            </button>

            <button
              id="btn-open-drawer-header"
              onClick={() => setIsDrawerOpen(true)}
              style={{
                borderColor: `${settings.theme.lineColor}70`,
                boxShadow: `0 0 12px ${settings.theme.glowColor}30`,
              }}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border text-xs font-semibold transition active:scale-95 hover:border-cyan-400"
            >
              <PenTool className="w-4 h-4 text-cyan-400" />
              <span>Vẽ chữ & Nét 3D tự do</span>
            </button>

            <button
              id="btn-open-info"
              onClick={() => setShowInfoModal(true)}
              title="Thông tin toán học 3D, 4D & Tác giả"
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 hover:border-neutral-500 transition active:scale-95"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden border-b border-neutral-800 bg-[#0c0e15] px-4 py-2 gap-2 text-xs font-mono sticky top-[61px] z-20">
        <button
          onClick={() => setMobileTab('viewport')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'viewport'
              ? 'bg-neutral-900 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,255,204,0.25)] font-bold'
              : 'text-neutral-300 hover:text-white border border-neutral-800'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Màn hình 3D</span>
        </button>
        <button
          onClick={() => setMobileTab('controls')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'controls'
              ? 'bg-neutral-900 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,255,204,0.25)] font-bold'
              : 'text-neutral-300 hover:text-white border border-neutral-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Joystick & Khối</span>
        </button>
        <button
          onClick={() => setMobileTab('settings')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'settings'
              ? 'bg-neutral-900 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,255,204,0.25)] font-bold'
              : 'text-neutral-300 hover:text-white border border-neutral-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Cài đặt</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left/Center Column: The 3D Viewport */}
        <div
          className={`lg:col-span-7 xl:col-span-8 h-[550px] lg:h-[720px] flex flex-col ${
            mobileTab !== 'viewport' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <Viewport3D
            shape={currentShape}
            control={control}
            settings={settings}
            onResetRotation={() => {
              setControl({ angle: -Math.PI / 2, speed: 0 });
            }}
            onUpdateSettings={handleUpdateSettings}
          />

          {/* Quick instructions under viewport */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 font-mono px-1">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: settings.theme.lineColor }}
              />
              Công thức phép chiếu: <code className="text-neutral-300">scale = FOV / (FOV + Z)</code>
            </span>
            <span className="hidden sm:inline">
              Kéo trên hình để xoay hoặc dùng cần Joystick bên phải
            </span>
          </div>
        </div>

        {/* Right Column: Joystick + Shape Presets + Settings Panels */}
        <div
          className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-4 ${
            mobileTab === 'viewport' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Virtual Joystick (Visible on desktop or when 'controls' tab is active) */}
          {(mobileTab === 'controls' || typeof window === 'undefined' || window.innerWidth >= 1024) && (
            <JoystickControl
              control={control}
              onChange={setControl}
              theme={settings.theme}
            />
          )}

          {/* Shape Selector & Extrusion Trigger */}
          {(mobileTab === 'controls' || typeof window === 'undefined' || window.innerWidth >= 1024) && (
            <ShapePanel
              currentShape={currentShape}
              onSelectShape={setCurrentShape}
              onOpenDrawer={() => setIsDrawerOpen(true)}
              theme={settings.theme}
            />
          )}

          {/* Display & Camera Settings */}
          {(mobileTab === 'settings' || typeof window === 'undefined' || window.innerWidth >= 1024) && (
            <SettingsPanel
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </div>
      </main>

      {/* 2D Polygon Custom Drawing Modal */}
      <ShapeDrawerModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApplyShape={handleApplyCustomShape}
        theme={settings.theme}
      />

      {/* Educational & Architectural Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 overflow-y-auto">
          <div
            className="bg-black border rounded-2xl shadow-2xl max-w-lg w-full p-6 text-neutral-100 flex flex-col gap-4 relative overflow-hidden"
            style={{
              borderColor: `${settings.theme.lineColor}50`,
              boxShadow: `0 0 40px rgba(0,0,0,1), 0 0 25px ${settings.theme.glowColor}25`,
            }}
          >
            {/* Top neon accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${settings.theme.lineColor}, transparent)`,
              }}
            />

            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-black border shadow-sm"
                  style={{
                    borderColor: `${settings.theme.lineColor}60`,
                    color: settings.theme.lineColor,
                    boxShadow: `0 0 8px ${settings.theme.glowColor}30`,
                  }}
                >
                  <Box className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-white">Cơ chế hoạt động của ứng dụng</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed font-sans">
              <p className="text-neutral-400">
                Đây là bản nâng cấp hoàn chỉnh cho dự án mô phỏng 3D mà bạn đã viết trong 1 buổi chiều:
              </p>

              <div className="p-3 rounded-xl bg-black border border-neutral-900 font-mono space-y-1.5 text-[11px] shadow-md">
                <div
                  className="font-semibold flex items-center gap-1.5"
                  style={{ color: settings.theme.lineColor }}
                >
                  1. Ma trận quay không gian 3D:
                </div>
                <div className="text-neutral-400">
                  • Trục X: <span className="text-neutral-200">y' = y*cos - z*sin</span>, <span className="text-neutral-200">z' = y*sin + z*cos</span>
                </div>
                <div className="text-neutral-400">
                  • Trục Y: <span className="text-neutral-200">x' = x*cos + z*sin</span>, <span className="text-neutral-200">z' = -x*sin + z*cos</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black border border-neutral-900 font-mono space-y-1.5 text-[11px] shadow-md">
                <div
                  className="font-semibold flex items-center gap-1.5"
                  style={{ color: settings.theme.lineColor }}
                >
                  2. Phép chiếu phối cảnh (Perspective Projection):
                </div>
                <div className="text-neutral-400">
                  • Tỷ lệ thu phóng: <span className="text-cyan-300">scale = FOV / (FOV + Z)</span>
                </div>
                <div className="text-neutral-400">
                  • Chiếu lên màn hình 2D: <span className="text-neutral-200">x_screen = x * scale + centerX</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black border border-neutral-900 font-mono space-y-1.5 text-[11px] shadow-md">
                <div
                  className="font-semibold flex items-center gap-1.5"
                  style={{ color: settings.theme.lineColor }}
                >
                  3. Cần Joystick ảo (Vector điều hướng):
                </div>
                <div className="text-neutral-400">
                  • Khoảng cách từ tâm = tốc độ xoay (<span className="text-cyan-300">speedFactor</span>).
                </div>
                <div className="text-neutral-400">
                  • Góc <span className="text-cyan-300">angle</span> xác định tỷ lệ phân bố lực quay giữa trục X và trục Y.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black border border-neutral-900 font-mono space-y-1.5 text-[11px] shadow-md">
                <div
                  className="font-semibold flex items-center gap-1.5"
                  style={{ color: settings.theme.lineColor }}
                >
                  4. Đùn hình 2D thành 3D (Extrude):
                </div>
                <div className="text-neutral-400">
                  Nhân đôi tập hợp điểm 2D thành 2 lớp trước/sau (<span className="text-neutral-200">z = -depth</span> và <span className="text-neutral-200">z = +depth</span>) và tạo cạnh kết nối các mặt tương ứng.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/80 to-cyan-950/80 border border-purple-500/60 font-mono space-y-2 text-xs shadow-lg">
                <div className="font-bold flex items-center justify-between text-white">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>ĐỘI NGŨ PHÁT TRIỂN & CHỦ ĐỀ ÂM NHẠC</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowInfoModal(false);
                      setIsAudioHubOpen(true);
                    }}
                    className="text-[10px] text-cyan-300 hover:text-white underline font-semibold flex items-center gap-1"
                  >
                    <Disc className="w-3 h-3" /> Mở Kho Âm Nhạc
                  </button>
                </div>

                <div className="text-neutral-200 flex flex-col gap-2 text-[11px]">
                  {/* Thien Long Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-black/60 border border-cyan-500/40 gap-2">
                    <div>
                      <div className="text-cyan-300 font-bold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        Người làm ra: <span className="text-white underline decoration-cyan-400">Thiên Long</span>
                      </div>
                      <div className="text-neutral-400 text-[10px]">
                        Khối 3D Wireframe & 4D Tesseract • Theme: <strong>Equinox Armor Theme (Gacha RPG)</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        onClick={() => {
                          handleSelectAuthorShape('thien-long', '3D');
                          setShowInfoModal(false);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-400/80 hover:bg-cyan-900 transition"
                      >
                        Khối 3D
                      </button>
                      <button
                        onClick={() => {
                          handleSelectAuthorShape('thien-long', '4D');
                          setShowInfoModal(false);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-200 border border-cyan-300 hover:bg-cyan-900 transition shadow-[0_0_8px_rgba(0,255,204,0.4)]"
                      >
                        Khối 4D
                      </button>
                      <button
                        onClick={() => {
                          handleSelectAuthorShape('thien-long', '5D');
                          setShowInfoModal(false);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-400 hover:bg-emerald-900 transition shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      >
                        Khối 5D
                      </button>
                      <button
                        onClick={() => handlePlayTheme('equinox', 'Thiên Long', 'Equinox Armor Theme')}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-black text-cyan-400 border border-cyan-500/50 hover:bg-cyan-950 transition flex items-center gap-1"
                      >
                        <Music className="w-2.5 h-2.5" /> Equinox
                      </button>
                    </div>
                  </div>

                  {/* Thanh Tai Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-black/60 border border-purple-500/40 gap-2">
                    <div>
                      <div className="text-purple-300 font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        Ý tưởng sáng tạo: <span className="text-white underline decoration-purple-400">Thành Tài</span>
                      </div>
                      <div className="text-neutral-400 text-[10px]">
                        Khối 3D Cyber, 4D Hyper-Matrix & 5D Trục V • Theme: <strong>Attribute Mutilation Fractured</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        onClick={() => {
                          handleSelectAuthorShape('thanh-tai', '3D');
                          setShowInfoModal(false);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-400/80 hover:bg-purple-900 transition"
                      >
                        Khối 3D
                      </button>
                      <button
                        onClick={() => {
                          handleSelectAuthorShape('thanh-tai', '4D');
                          setShowInfoModal(false);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-200 border border-purple-300 hover:bg-purple-900 transition shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                      >
                        Khối 4D
                      </button>
                      <button
                        onClick={() => {
                          handleSelectAuthorShape('thanh-tai', '5D');
                          setShowInfoModal(false);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-400 hover:bg-emerald-900 transition shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      >
                        Khối 5D
                      </button>
                      <button
                        onClick={() => handlePlayTheme('attribute', 'Thành Tài', 'Attribute Mutilation Fractured')}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-black text-purple-400 border border-purple-500/50 hover:bg-purple-950 transition flex items-center gap-1"
                      >
                        <Music className="w-2.5 h-2.5" /> Attribute
                      </button>
                    </div>
                  </div>

                  {/* Dual Monument Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 gap-2">
                    <div>
                      <div className="text-amber-300 font-bold flex items-center gap-1">
                        <span>👑</span>
                        <span>Đại Tượng Đài: Thiên Long × Thành Tài</span>
                      </div>
                      <div className="text-neutral-400 text-[10px]">
                        Kết hợp cả 2 tác giả trong 1 khối điêu khắc 3D đa tầng, 4D Hyper-Duality kép & 5D Vô Cực
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        onClick={() => {
                          handleSelectAuthorShape('dual', '3D');
                          setShowInfoModal(false);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500 hover:bg-amber-900 transition"
                      >
                        Song Hùng 3D
                      </button>
                      <button
                        onClick={() => {
                          handleSelectAuthorShape('dual', '4D');
                          setShowInfoModal(false);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-amber-900 text-amber-200 border border-amber-400 hover:bg-amber-800 transition shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      >
                        Song Hùng 4D
                      </button>
                      <button
                        onClick={() => {
                          handleSelectAuthorShape('dual', '5D');
                          setShowInfoModal(false);
                        }}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-emerald-900 text-emerald-200 border border-emerald-400 hover:bg-emerald-800 transition shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      >
                        Song Hùng 5D
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black border border-purple-900/60 font-mono space-y-1.5 text-[11px] shadow-md">
                <div className="font-semibold flex items-center gap-1.5 text-purple-400">
                  5. Không gian Siêu Chiều 4D & 5D (Hyperspace R^4 & R^5):
                </div>
                <div className="text-neutral-300">
                  • 4D Stereographic: <span className="text-purple-300">factor = D_w / (D_w - w)</span> với trục W.
                </div>
                <div className="text-neutral-300">
                  • 5D Hyperspace Projection: Chiếu phối cảnh đa tầng <span className="text-emerald-300">5D (V) → 4D (W) → 3D (Z) → 2D Màn hình</span>.
                </div>
                <div className="text-neutral-400">
                  • 10 mặt phẳng siêu xoay 5D: <span className="text-emerald-300">XV, YV, ZV, WV (lộn ruột giữa chiều 4 và chiều 5) & ALL_5D</span>!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-2 w-full py-2.5 bg-black border font-mono font-bold text-xs rounded-xl transition active:scale-95 shadow-lg"
              style={{
                borderColor: settings.theme.lineColor,
                color: settings.theme.lineColor,
                boxShadow: `0 0 16px ${settings.theme.glowColor}`,
              }}
            >
              Đã hiểu & Tiếp tục trải nghiệm
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-neutral-900/95 border border-cyan-400 text-cyan-200 text-xs font-mono font-bold shadow-[0_0_20px_rgba(0,255,204,0.4)] flex items-center gap-2 animate-bounce">
          <Disc className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Audio Hub Modal */}
      <AudioHubModal
        isOpen={isAudioHubOpen}
        onClose={() => setIsAudioHubOpen(false)}
        onPlayTheme={(theme) => {
          const artist = theme === 'equinox' ? 'Thiên Long' : theme === 'attribute' ? 'Thành Tài' : 'Vũ Trụ';
          const title = theme === 'equinox' ? 'Equinox Armor Theme' : theme === 'attribute' ? 'Attribute Mutilation Fractured' : theme;
          showToast(`🎵 Đang phát: ${title} (${artist})`);
        }}
      />
    </div>
  );
}
