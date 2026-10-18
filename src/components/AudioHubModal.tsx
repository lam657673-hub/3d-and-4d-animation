import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Upload,
  Radio,
  Sparkles,
  Zap,
  Flame,
  Shield,
  Disc,
} from 'lucide-react';
import {
  cosmicAudio,
  TRACK_CATALOG,
  SoundMode,
} from '../utils/audioEngine';

interface AudioHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTheme?: (theme: SoundMode) => void;
}

export const AudioHubModal: React.FC<AudioHubModalProps> = ({
  isOpen,
  onClose,
  onPlayTheme,
}) => {
  const [currentMode, setCurrentMode] = useState<SoundMode>(() => cosmicAudio.getCurrentMode());
  const [isMuted, setIsMuted] = useState<boolean>(() => cosmicAudio.getIsMuted());
  const [volume, setVolume] = useState<number>(() => cosmicAudio.getVolume());
  const [thienlongFileName, setThienlongFileName] = useState<string | undefined>(() =>
    cosmicAudio.getCustomFileName('thienlong')
  );
  const [thanhtaiFileName, setThanhtaiFileName] = useState<string | undefined>(() =>
    cosmicAudio.getCustomFileName('thanhtai')
  );

  const fileInputThienLong = useRef<HTMLInputElement>(null);
  const fileInputThanhTai = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = cosmicAudio.subscribe(() => {
      setCurrentMode(cosmicAudio.getCurrentMode());
      setIsMuted(cosmicAudio.getIsMuted());
      setVolume(cosmicAudio.getVolume());
      setThienlongFileName(cosmicAudio.getCustomFileName('thienlong'));
      setThanhtaiFileName(cosmicAudio.getCustomFileName('thanhtai'));
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleSelectTrack = (mode: SoundMode) => {
    cosmicAudio.playTheme(mode);
    onPlayTheme?.(mode);
  };

  const handleToggleMute = () => {
    cosmicAudio.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    cosmicAudio.setVolume(val);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>, target: 'thienlong' | 'thanhtai') => {
    const file = e.target.files?.[0];
    if (file) {
      cosmicAudio.loadCustomFile(file, target);
      if (target === 'thienlong') {
        setThienlongFileName(file.name);
      } else {
        setThanhtaiFileName(file.name);
      }
    }
  };

  const activeTrackMeta = TRACK_CATALOG.find((t) => t.id === currentMode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-[#090b12] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,255,204,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0e111b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-900 to-purple-950 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,204,0.3)]">
              <Disc className={`w-5 h-5 text-cyan-300 ${!isMuted && currentMode !== 'off' ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Hộp Âm Nhạc Vũ Trụ & Studio Audio Hub
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-semibold">
                  HI-FI SYNTH
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Theme độc quyền của <strong className="text-cyan-300">Thiên Long</strong> (Equinox) & <strong className="text-purple-300">Thành Tài</strong> (Attribute)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Active Now Playing Banner */}
          <div
            className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            style={{
              backgroundColor: '#0c0f1a',
              borderColor: activeTrackMeta ? activeTrackMeta.color : '#334155',
              boxShadow: activeTrackMeta ? `0 0 20px ${activeTrackMeta.bgGlow}` : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border font-mono font-bold text-lg"
                style={{
                  borderColor: activeTrackMeta?.color || '#555',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: activeTrackMeta?.color || '#aaa',
                }}
              >
                {currentMode === 'equinox' ? (
                  <Shield className="w-6 h-6 animate-pulse" />
                ) : currentMode === 'attribute' ? (
                  <Zap className="w-6 h-6 animate-pulse" />
                ) : currentMode === 'blackhole' ? (
                  <Flame className="w-6 h-6 animate-pulse" />
                ) : (
                  <Sparkles className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-black/60 border border-neutral-700 text-neutral-300">
                    {activeTrackMeta?.badge || 'TRẠNG THÁI'}
                  </span>
                  {!isMuted && currentMode !== 'off' && (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      Đang phát Live
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {activeTrackMeta?.title || 'Chưa phát nhạc (Bấm chọn bài bên dưới)'}
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  Nghệ sĩ: <span className="text-white font-medium">{activeTrackMeta?.artist || '—'}</span> ({activeTrackMeta?.role || 'Hệ thống'})
                </div>
              </div>
            </div>

            {/* Quick Play/Pause & Equalizer visual */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              {/* Equalizer animation */}
              {!isMuted && currentMode !== 'off' && (
                <div className="flex items-end gap-1 h-6 px-2 py-1 bg-black/40 rounded-lg border border-neutral-800">
                  <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-4" />
                  <span className="w-1 bg-purple-400 rounded-full animate-bounce h-6" />
                  <span className="w-1 bg-fuchsia-400 rounded-full animate-pulse h-3" />
                  <span className="w-1 bg-cyan-300 rounded-full animate-bounce h-5" />
                </div>
              )}

              <button
                onClick={handleToggleMute}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition active:scale-95 ${
                  isMuted
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                    : 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,255,204,0.4)]'
                }`}
                title={isMuted ? 'Mở âm thanh' : 'Tắt tiếng'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Volume Slider Control */}
          <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 min-w-[70px]">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Âm lượng:
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="text-xs font-mono text-cyan-300 font-bold min-w-[40px] text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Track Selection Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Danh sách Theme Âm Nhạc Cá Nhân & Vũ Trụ
            </h3>

            {/* 1. THIÊN LONG THEME: EQUINOX */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                currentMode === 'equinox'
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_18px_rgba(0,255,204,0.25)]'
                  : 'bg-neutral-900/70 border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-900/80 text-cyan-200 border border-cyan-400/60 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-cyan-400" />
                      THEME THIÊN LONG (Người làm ra)
                    </span>
                    {thienlongFileName && (
                      <span className="text-[10px] font-mono text-cyan-300 bg-black/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        File gốc: {thienlongFileName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Equinox Armor Theme (Gacha RPG)
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Bản hùng ca điện tử sôi động, đại diện cho kỹ sư đồ họa & lập trình <strong className="text-cyan-300">Thiên Long</strong>. Nhịp bass 16th-beat dồn dập, arpeggio hào hùng như trận chiến giáp ảo tưởng.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSelectTrack('equinox')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition active:scale-95 ${
                      currentMode === 'equinox' && !isMuted
                        ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(0,255,204,0.6)]'
                        : 'bg-neutral-800 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-950 hover:border-cyan-400'
                    }`}
                  >
                    {currentMode === 'equinox' && !isMuted ? (
                      <>
                        <Pause className="w-4 h-4" /> ĐANG PHÁT
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> PHÁT THEME
                      </>
                    )}
                  </button>

                  {/* Upload custom MP3 for Thien Long */}
                  <input
                    type="file"
                    ref={fileInputThienLong}
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleUploadFile(e, 'thienlong')}
                  />
                  <button
                    onClick={() => fileInputThienLong.current?.click()}
                    title="Tải lên file MP3 'equinox armor theme mp3-gacha rpg.mp3' trực tiếp từ máy bạn để nghe trọn vẹn bản gốc"
                    className="p-2 rounded-xl text-neutral-400 hover:text-cyan-300 hover:bg-neutral-800 border border-neutral-700 transition"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. THÀNH TÀI THEME: ATTRIBUTE MUTILATION FRACTURED */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                currentMode === 'attribute'
                  ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.25)]'
                  : 'bg-neutral-900/70 border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-900/80 text-purple-200 border border-purple-400/60 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-400" />
                      THEME THÀNH TÀI (Ý tưởng)
                    </span>
                    {thanhtaiFileName && (
                      <span className="text-[10px] font-mono text-purple-300 bg-black/60 px-2 py-0.5 rounded border border-purple-500/30">
                        File gốc: {thanhtaiFileName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Attribute Mutilation Fractured
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Cyberpunk industrial glitch tăm tối, gắn liền với ý tưởng phá cách chiều không gian của <strong className="text-purple-300">Thành Tài</strong>. Sub-drop rung chuyển, nhịp đập rạn nứt không thời gian.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSelectTrack('attribute')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition active:scale-95 ${
                      currentMode === 'attribute' && !isMuted
                        ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                        : 'bg-neutral-800 text-purple-300 border border-purple-500/50 hover:bg-purple-950 hover:border-purple-400'
                    }`}
                  >
                    {currentMode === 'attribute' && !isMuted ? (
                      <>
                        <Pause className="w-4 h-4" /> ĐANG PHÁT
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> PHÁT THEME
                      </>
                    )}
                  </button>

                  {/* Upload custom MP3 for Thanh Tai */}
                  <input
                    type="file"
                    ref={fileInputThanhTai}
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleUploadFile(e, 'thanhtai')}
                  />
                  <button
                    onClick={() => fileInputThanhTai.current?.click()}
                    title="Tải lên file MP3 'Attribute_Mutilation_Fractured.mp3' trực tiếp từ máy bạn để nghe bản gốc"
                    className="p-2 rounded-xl text-neutral-400 hover:text-purple-300 hover:bg-neutral-800 border border-neutral-700 transition"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. 4D HYPERSPACE THEME */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                currentMode === 'hyperspace4d'
                  ? 'bg-fuchsia-950/30 border-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.2)]'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                    4D Hyperspace Celestial Chimes (Âm Nhạc Vu Vơ 4D)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Chuông pha lê ngân nga, hợp âm đa chiều xoay theo trục W
                  </div>
                </div>
                <button
                  onClick={() => handleSelectTrack('hyperspace4d')}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-neutral-700 text-neutral-300 hover:text-white hover:border-fuchsia-400"
                >
                  {currentMode === 'hyperspace4d' ? 'Đang phát' : 'Chọn'}
                </button>
              </div>
            </div>

            {/* 4. BLACK HOLE THEME */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                currentMode === 'blackhole'
                  ? 'bg-red-950/30 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    Supermassive Black Hole (Âm Hút Chân Không 10.000 Điểm)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Sóng hạ âm trầm 48Hz và tiếng gió đĩa bồi tụ xoáy vòng
                  </div>
                </div>
                <button
                  onClick={() => handleSelectTrack('blackhole')}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-neutral-700 text-neutral-300 hover:text-white hover:border-red-500"
                >
                  {currentMode === 'blackhole' ? 'Đang phát' : 'Chọn'}
                </button>
              </div>
            </div>
          </div>

          {/* User Guide Tips */}
          <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 text-[11px] text-neutral-400 font-mono space-y-1">
            <div className="text-cyan-300 font-bold flex items-center gap-1.5">
              💡 Mẹo & Phím Tắt Trực Tiếp:
            </div>
            <div>
              • Bấm trực tiếp vào tên <strong className="text-cyan-300">Thiên Long</strong> trên thanh Menu hoặc thanh credit 3D/4D để đổi ngay sang bài <strong>Equinox Armor Theme</strong>.
            </div>
            <div>
              • Bấm vào tên <strong className="text-purple-300">Thành Tài</strong> để đổi sang bài <strong>Attribute Mutilation Fractured</strong>.
            </div>
            <div>
              • Bấm icon <Upload className="w-3 h-3 inline text-neutral-300" /> để nạp trực tiếp file MP3 gốc tải từ máy bạn (như file <em>equinox armor theme mp3-gacha rpg.mp3</em> hoặc <em>Attribute_Mutilation_Fractured.mp3</em>) nếu muốn thưởng thức trọn vẹn master audio gốc!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
