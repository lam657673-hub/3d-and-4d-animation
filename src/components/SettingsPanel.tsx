import React from 'react';
import { RenderSettings, RenderTheme } from '../types';
import { COLOR_THEMES } from '../utils/shapes';
import { Sliders, Palette, Eye, RotateCw, Sparkles, Grid, Zap, Gauge, Cpu, ShieldCheck, Flame, Box } from 'lucide-react';

interface SettingsPanelProps {
  settings: RenderSettings;
  onUpdateSettings: (settings: Partial<RenderSettings>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const { theme } = settings;

  return (
    <div
      id="settings-panel"
      className="bg-[#0b0e15] border border-neutral-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-4 relative overflow-hidden"
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
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wider uppercase text-white font-bold">TÙY CHỈNH CAMERA & HIỂN THỊ</span>
        </div>
        <span className="text-xs text-neutral-300 font-mono tracking-wider font-semibold">NEON OPTICS</span>
      </div>

      {/* 🌲 PHONG CÁCH HIỂN THỊ: CYBER vs KHỐI GỖ (AESTHETIC STYLE) */}
      <div className="bg-black/50 border border-neutral-800 rounded-xl p-2.5 space-y-2">
        <label className="text-xs font-semibold text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono">
            <Box className="w-3.5 h-3.5 text-amber-400" />
            PHONG CÁCH HIỂN THỊ (AESTHETIC):
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              settings.aestheticMode === 'wooden'
                ? 'bg-amber-900/60 text-amber-200 border-amber-500/60'
                : 'bg-cyan-900/60 text-cyan-200 border-cyan-500/60'
            }`}
          >
            {settings.aestheticMode === 'wooden' ? 'GỖ SỒI TỰ NHIÊN' : 'CYBER NEON'}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {/* Wooden Texture Mode Button */}
          <button
            onClick={() => onUpdateSettings({ aestheticMode: 'wooden' })}
            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
              settings.aestheticMode === 'wooden'
                ? 'bg-gradient-to-br from-amber-950/80 to-amber-900/40 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-neutral-900/90 border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500'
            }`}
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-500/50 flex-shrink-0 flex items-center justify-center bg-amber-800/40">
              <span className="text-sm">🪵</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate text-amber-200">Khối Gỗ Thật</span>
              <span className="text-[10px] text-neutral-400 truncate">Vân sồi & ánh xưởng mộc</span>
            </div>
          </button>

          {/* Cyber Wireframe Mode Button */}
          <button
            onClick={() => onUpdateSettings({ aestheticMode: 'cyber' })}
            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
              settings.aestheticMode === 'cyber'
                ? 'bg-gradient-to-br from-cyan-950/80 to-cyan-900/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-neutral-900/90 border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500'
            }`}
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyan-500/50 flex-shrink-0 flex items-center justify-center bg-cyan-950">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate text-cyan-200">Cyber Neon</span>
              <span className="text-[10px] text-neutral-400 truncate">Khung dây quang học</span>
            </div>
          </button>
        </div>
      </div>

      {/* Color Palettes */}
      <div>
        <label className="text-xs font-semibold text-white block mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bảng màu Neon Wireframe:</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {COLOR_THEMES.map((th) => {
            const isActive = settings.theme.id === th.id;
            return (
              <button
                key={th.id}
                onClick={() => onUpdateSettings({ theme: th })}
                style={{
                  borderColor: isActive ? th.lineColor : undefined,
                  boxShadow: isActive
                    ? `0 0 12px ${th.glowColor}, inset 0 0 10px ${th.glowColor}25`
                    : undefined,
                }}
                className={`flex items-center gap-2 p-1.5 rounded-lg border text-left text-xs transition ${
                  isActive
                    ? 'bg-neutral-900 text-white font-bold border-cyan-400'
                    : 'bg-neutral-900/90 border-neutral-700 text-neutral-200 hover:text-white hover:border-neutral-500'
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: th.lineColor,
                    boxShadow: `0 0 8px ${th.lineColor}`,
                  }}
                />
                <span className="text-xs truncate font-medium">{th.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-3.5 pt-2 border-t border-neutral-800">
        {/* FOV (Field of View) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium">Trường nhìn (FOV):</span>
            <span
              className="font-bold text-xs"
              style={{
                color: theme.lineColor,
                textShadow: `0 0 8px ${theme.glowColor}`,
              }}
            >
              {settings.fov} px
            </span>
          </div>
          <input
            type="range"
            min="150"
            max="600"
            step="10"
            value={settings.fov}
            onChange={(e) => onUpdateSettings({ fov: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Scale multiplier */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium">Tỉ lệ kích thước (Scale):</span>
            <span
              className="font-bold text-xs"
              style={{
                color: theme.lineColor,
                textShadow: `0 0 8px ${theme.glowColor}`,
              }}
            >
              {settings.scale.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.2"
            step="0.1"
            value={settings.scale}
            onChange={(e) => onUpdateSettings({ scale: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Line width */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium">Độ dày nét cạnh:</span>
            <span
              className="font-bold text-xs"
              style={{
                color: theme.lineColor,
                textShadow: `0 0 8px ${theme.glowColor}`,
              }}
            >
              {settings.lineWidth} px
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="4.5"
            step="0.5"
            value={settings.lineWidth}
            onChange={(e) => onUpdateSettings({ lineWidth: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* 4D Hyperspace Settings Section */}
      <div className="pt-3 border-t border-purple-900/50 space-y-3 bg-purple-950/20 -mx-4 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            CHIỀU THỨ 4 (4D HYPER-SPACE)
          </span>
          <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-900/60 px-1.5 py-0.5 rounded border border-purple-500/40">
            TRỤC W
          </span>
        </div>

        {/* 4D Rotation Speed */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium">Tốc độ xoay 4D (Hyper-Spin):</span>
            <span className="font-bold text-xs text-purple-300">
              {settings.hyperSpeed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.2"
            value={settings.hyperSpeed}
            onChange={(e) => onUpdateSettings({ hyperSpeed: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
        </div>

        {/* 4D Distance D_w (Stereographic Focal Point) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium">Tiêu cự chiếu 4D (D_w Distance):</span>
            <span className="font-bold text-xs text-purple-300">
              {settings.hyperDistance.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="1.6"
            max="3.5"
            step="0.1"
            value={settings.hyperDistance}
            onChange={(e) => onUpdateSettings({ hyperDistance: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
        </div>

        {/* 4D Toggles */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-purple-950/40 border border-purple-800/60 hover:border-purple-400 transition">
            <input
              type="checkbox"
              checked={settings.autoHyperSpin}
              onChange={(e) => onUpdateSettings({ autoHyperSpin: e.target.checked })}
              className="rounded border-purple-600 bg-black text-purple-400 focus:ring-0 accent-purple-400 w-4 h-4"
            />
            <span className="text-white text-xs font-medium">Tự xoay 4D</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-purple-950/40 border border-purple-800/60 hover:border-purple-400 transition">
            <input
              type="checkbox"
              checked={settings.hyperColorW}
              onChange={(e) => onUpdateSettings({ hyperColorW: e.target.checked })}
              className="rounded border-purple-600 bg-black text-purple-400 focus:ring-0 accent-purple-400 w-4 h-4"
            />
            <span className="text-white text-xs font-medium">Tô màu trục W</span>
          </label>
        </div>
      </div>

      {/* 🌌 5D Hyperspace Settings Section (TRỤC THỨ 5 V) */}
      <div className="pt-3 border-t border-emerald-900/50 space-y-3 bg-emerald-950/20 -mx-4 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            CHIỀU THỨ 5 (5D HYPER-SPACE)
          </span>
          <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            TRỤC THỨ 5 (V)
          </span>
        </div>

        {/* 5D Rotation Speed */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium">Tốc độ xoay 5D (Hyper-5D Spin):</span>
            <span className="font-bold text-xs text-emerald-300">
              {(settings.hyper5DSpeed ?? 1.0).toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.2"
            value={settings.hyper5DSpeed ?? 1.0}
            onChange={(e) => onUpdateSettings({ hyper5DSpeed: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        {/* 5D Distance D_v */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium">Tiêu cự chiếu 5D (D_v Distance):</span>
            <span className="font-bold text-xs text-emerald-300">
              {(settings.hyper5DDistance ?? 2.5).toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="1.5"
            max="4.0"
            step="0.1"
            value={settings.hyper5DDistance ?? 2.5}
            onChange={(e) => onUpdateSettings({ hyper5DDistance: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        {/* 5D Hyperplane Selection */}
        <div>
          <span className="text-neutral-200 text-xs font-medium font-mono block mb-1">
            Mặt phẳng xoay siêu chiều 5D:
          </span>
          <div className="grid grid-cols-5 gap-1 font-mono text-[10px]">
            {(
              [
                { id: 'XV', label: 'XV', tip: 'Xoay trục X & V' },
                { id: 'YV', label: 'YV', tip: 'Xoay trục Y & V' },
                { id: 'ZV', label: 'ZV', tip: 'Xoay trục Z & V' },
                { id: 'WV', label: 'W-V', tip: 'Lộn ruột giữa Chiều 4 & Chiều 5 (Trục W & V)' },
                { id: 'ALL_5D', label: 'ALL', tip: 'Siêu xoay toàn phần R^5' },
              ] as const
            ).map((item) => {
              const isSelected = settings.hyper5DPlane === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onUpdateSettings({ hyper5DPlane: item.id })}
                  title={item.tip}
                  className={`py-1 rounded border text-center font-bold transition ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                      : 'bg-black/60 text-neutral-300 border-neutral-700 hover:border-emerald-500 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5D Toggles */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 hover:border-emerald-400 transition">
            <input
              type="checkbox"
              checked={settings.autoHyper5DSpin}
              onChange={(e) => onUpdateSettings({ autoHyper5DSpin: e.target.checked })}
              className="rounded border-emerald-600 bg-black text-emerald-400 focus:ring-0 accent-emerald-400 w-4 h-4"
            />
            <span className="text-white text-xs font-medium">Tự xoay 5D</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 hover:border-emerald-400 transition">
            <input
              type="checkbox"
              checked={settings.hyperColor5D}
              onChange={(e) => onUpdateSettings({ hyperColor5D: e.target.checked })}
              className="rounded border-emerald-600 bg-black text-emerald-400 focus:ring-0 accent-emerald-400 w-4 h-4"
            />
            <span className="text-white text-xs font-medium">Tô màu trục V</span>
          </label>
        </div>
      </div>

      {/* 🌠 HIỆU ỨNG VỆT SÁNG CHUYỂN ĐỘNG (MOTION TRAILS & LIGHT STREAKS) */}
      <div className="pt-3 border-t border-cyan-900/50 space-y-3 bg-cyan-950/20 -mx-4 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            VỆT SÁNG CHUYỂN ĐỘNG (MOTION TRAILS)
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition ${
              settings.motionTrail
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.8)] font-extrabold'
                : 'bg-neutral-900 text-neutral-400 border-neutral-700'
            }`}
          >
            {settings.motionTrail ? 'ĐANG BẬT STREAKS' : 'ĐÃ TẮT'}
          </span>
        </div>

        {/* Master Motion Trail Toggle */}
        <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-700/50 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Hiệu Ứng Vệt Sáng Neon Đa Chiều
            </span>
            <span className="text-[10px] text-neutral-400">
              Vẽ dải lụa quang học và bóng ma dư ảnh khi xoay hoặc lắc
            </span>
          </div>
          <button
            onClick={() => onUpdateSettings({ motionTrail: !settings.motionTrail })}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition active:scale-95 flex-shrink-0 ${
              settings.motionTrail
                ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.9)]'
                : 'bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700'
            }`}
          >
            {settings.motionTrail ? 'BẬT (SIÊU ẢO)' : 'BẬT NGAY'}
          </button>
        </div>

        {/* Tail Length Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium flex items-center gap-1">
              Độ dài đuôi (Tail Length):
            </span>
            <span className="font-bold text-xs text-cyan-300">
              {settings.trailLength ?? 20} bước (frames)
            </span>
          </div>
          <input
            type="range"
            min="4"
            max="50"
            step="2"
            value={settings.trailLength ?? 20}
            onChange={(e) => onUpdateSettings({ trailLength: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-0.5">
            <span>Ngắn (4)</span>
            <span>Vừa (20)</span>
            <span>Cực Dài (50)</span>
          </div>
        </div>

        {/* Persistence Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium flex items-center gap-1">
              Độ bền / Lưu sáng (Persistence):
            </span>
            <span className="font-bold text-xs text-cyan-300">
              {Math.round((settings.trailPersistence ?? 0.85) * 100)}% ({((settings.trailPersistence ?? 0.85)).toFixed(2)})
            </span>
          </div>
          <input
            type="range"
            min="0.20"
            max="0.98"
            step="0.02"
            value={settings.trailPersistence ?? 0.85}
            onChange={(e) => onUpdateSettings({ trailPersistence: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-0.5">
            <span>Mờ nhanh (20%)</span>
            <span>Mặc định (85%)</span>
            <span>Lưu lâu (98%)</span>
          </div>
        </div>

        {/* Quick Presets for Light Streaks */}
        <div>
          <span className="text-[11px] text-neutral-400 font-mono block mb-1.5 font-medium">
            Mẫu vệt sáng cài sẵn (Streak Presets):
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onUpdateSettings({ motionTrail: true, trailLength: 20, trailPersistence: 0.85 })}
              className="px-2 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-700 hover:border-cyan-400 text-[11px] text-left text-neutral-200 hover:text-white transition flex flex-col"
            >
              <span className="font-bold text-cyan-300">✨ Chuẩn Cân Bằng</span>
              <span className="text-[9px] text-neutral-400">Độ dài 20 • Lưu 85%</span>
            </button>
            <button
              onClick={() => onUpdateSettings({ motionTrail: true, trailLength: 40, trailPersistence: 0.94 })}
              className="px-2 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-700 hover:border-cyan-400 text-[11px] text-left text-neutral-200 hover:text-white transition flex flex-col"
            >
              <span className="font-bold text-amber-300">🌠 Vệt Sao Băng</span>
              <span className="text-[9px] text-neutral-400">Độ dài 40 • Lưu 94%</span>
            </button>
            <button
              onClick={() => onUpdateSettings({ motionTrail: true, trailLength: 8, trailPersistence: 0.60 })}
              className="px-2 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-700 hover:border-cyan-400 text-[11px] text-left text-neutral-200 hover:text-white transition flex flex-col"
            >
              <span className="font-bold text-emerald-300">⚡ Tia Chớp Laser</span>
              <span className="text-[9px] text-neutral-400">Độ dài 8 • Lưu 60%</span>
            </button>
            <button
              onClick={() => onUpdateSettings({ motionTrail: true, trailLength: 50, trailPersistence: 0.97 })}
              className="px-2 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-700 hover:border-cyan-400 text-[11px] text-left text-neutral-200 hover:text-white transition flex flex-col"
            >
              <span className="font-bold text-purple-300">🌀 Hư Vô Vô Tận</span>
              <span className="text-[9px] text-neutral-400">Độ dài 50 • Lưu 97%</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 HỆ THỐNG GIẢM LAG & TỐI ƯU HIỆU NĂNG (ANTI-LAG ENGINE) */}
      <div className="pt-3 border-t border-emerald-900/50 space-y-3 bg-emerald-950/20 -mx-4 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            HỆ THỐNG GIẢM LAG & SIÊU MƯỢT (ANTI-LAG)
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition ${
              settings.antiLag
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                : 'bg-neutral-900 text-neutral-400 border-neutral-700'
            }`}
          >
            {settings.antiLag ? 'ĐANG BẬT 60+ FPS' : 'CHẾ ĐỘ CHUẨN'}
          </span>
        </div>

        {/* Master Anti-Lag Toggle */}
        <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-700/50 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Chế Độ Siêu Giảm Lag (Anti-Lag Turbo)
            </span>
            <span className="text-[10px] text-neutral-400">
              Tắt bóng mờ GPU, batch nét vẽ, khóa 60 FPS mượt mà
            </span>
          </div>
          <button
            onClick={() => {
              const next = !settings.antiLag;
              onUpdateSettings({
                antiLag: next,
                disableGlow: next,
                capDpr: next,
              });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition active:scale-95 flex-shrink-0 ${
              settings.antiLag
                ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.9)]'
                : 'bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700'
            }`}
          >
            {settings.antiLag ? 'BẬT (SIÊU MƯỢT)' : 'BẬT NGAY'}
          </button>
        </div>

        {/* Performance Sub-options */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <label
            className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 hover:border-emerald-400 transition"
            title="Khóa độ phân giải 1.0x giúp giảm 75% khối lượng pixel trên iPhone, iPad, Macbook Retina, màn hình 2K/4K"
          >
            <input
              type="checkbox"
              checked={settings.capDpr}
              onChange={(e) => onUpdateSettings({ capDpr: e.target.checked })}
              className="rounded border-emerald-600 bg-black text-emerald-400 focus:ring-0 accent-emerald-400 w-4 h-4"
            />
            <span className="text-white text-xs font-medium">Khóa DPR 1.0x (Mát máy)</span>
          </label>

          <label
            className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 hover:border-emerald-400 transition"
            title="Tắt tính năng shadowBlur gây hao tốn vi xử lý CPU/GPU"
          >
            <input
              type="checkbox"
              checked={settings.disableGlow}
              onChange={(e) => onUpdateSettings({ disableGlow: e.target.checked })}
              className="rounded border-emerald-600 bg-black text-emerald-400 focus:ring-0 accent-emerald-400 w-4 h-4"
            />
            <span className="text-white text-xs font-medium">Tắt Neon Blur (Nhẹ GPU)</span>
          </label>

          <label
            className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 hover:border-emerald-400 transition"
            title="Tự động chuyển sang chế độ giảm lag nếu đo được FPS dưới 35"
          >
            <input
              type="checkbox"
              checked={settings.autoAntiLag}
              onChange={(e) => onUpdateSettings({ autoAntiLag: e.target.checked })}
              className="rounded border-emerald-600 bg-black text-emerald-400 focus:ring-0 accent-emerald-400 w-4 h-4"
            />
            <span className="text-white text-xs font-medium">Tự chống lag (&lt;35 FPS)</span>
          </label>

          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] font-mono">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">Skia Zero-GC Engine</span>
          </div>
        </div>

        {/* LOD / Detail Level Slider */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs mb-1 font-mono">
            <span className="text-neutral-200 text-xs font-medium">Mật độ chi tiết (LOD / Tối ưu máy yếu):</span>
            <span className="font-bold text-xs text-emerald-300">
              {Math.round((settings.lodDensity ?? 1.0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.25"
            max="1.0"
            step="0.25"
            value={settings.lodDensity ?? 1.0}
            onChange={(e) => onUpdateSettings({ lodDensity: Number(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="pt-2.5 border-t border-neutral-800 grid grid-cols-2 gap-2 text-xs">
        <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-700 hover:border-cyan-400 transition">
          <input
            type="checkbox"
            checked={settings.showVertices}
            onChange={(e) => onUpdateSettings({ showVertices: e.target.checked })}
            className="rounded border-neutral-600 bg-black text-cyan-400 focus:ring-0 accent-cyan-400 w-4 h-4"
          />
          <span className="text-white text-xs font-medium">Hiện các đỉnh</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-700 hover:border-cyan-400 transition">
          <input
            type="checkbox"
            checked={settings.autoSpin}
            onChange={(e) => onUpdateSettings({ autoSpin: e.target.checked })}
            className="rounded border-neutral-600 bg-black text-cyan-400 focus:ring-0 accent-cyan-400 w-4 h-4"
          />
          <span className="text-white text-xs font-medium">Tự xoay nhẹ</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-700 hover:border-cyan-400 transition">
          <input
            type="checkbox"
            checked={settings.showDepthDimming}
            onChange={(e) => onUpdateSettings({ showDepthDimming: e.target.checked })}
            className="rounded border-neutral-600 bg-black text-cyan-400 focus:ring-0 accent-cyan-400 w-4 h-4"
          />
          <span className="text-white text-xs font-medium">Mờ theo chiều sâu</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-700 hover:border-cyan-400 transition">
          <input
            type="checkbox"
            checked={settings.showCoordinates}
            onChange={(e) => onUpdateSettings({ showCoordinates: e.target.checked })}
            className="rounded border-neutral-600 bg-black text-cyan-400 focus:ring-0 accent-cyan-400 w-4 h-4"
          />
          <span className="text-white text-xs font-medium">Trục XYZ & Lưới</span>
        </label>
      </div>
    </div>
  );
};
