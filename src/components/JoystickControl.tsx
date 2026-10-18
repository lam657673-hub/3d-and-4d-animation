import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ControlState, RenderTheme } from '../types';
import { RotateCw, Compass, Play, Square, Crosshair } from 'lucide-react';

interface JoystickControlProps {
  control: ControlState;
  onChange: (control: ControlState) => void;
  theme: RenderTheme;
}

export const JoystickControl: React.FC<JoystickControlProps> = ({
  control,
  onChange,
  theme,
}) => {
  const circleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const circleSize = 210;
  const radius = circleSize / 2;
  const maxRadius = radius - 14;
  const maxSpeed = 450;

  // Calculate handle position from angle & speed
  const currentDist = (control.speed / maxSpeed) * maxRadius;
  const handleX = radius + currentDist * Math.cos(control.angle);
  const handleY = radius + currentDist * Math.sin(control.angle);

  const updateFromPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!circleRef.current) return;
      const rect = circleRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = clientX - cx;
      const dy = clientY - cy;

      const angle = Math.atan2(dy, dx);
      const rawDist = Math.sqrt(dx * dx + dy * dy);
      const distance = Math.min(rawDist, maxRadius);
      const speed = Math.round((distance / maxRadius) * maxSpeed);

      onChange({ angle, speed });
    },
    [maxRadius, maxSpeed, onChange]
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        updateFromPosition(e.clientX, e.clientY);
      }
    };
    const handleUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        updateFromPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, updateFromPosition]);

  const handleStop = () => {
    onChange({ angle: control.angle, speed: 0 });
  };

  const handlePresetDirection = (rad: number, speedPct = 0.5) => {
    onChange({ angle: rad, speed: Math.round(maxSpeed * speedPct) });
  };

  // Degrees for human display: 0° is right (3 o'clock), 90° down, etc.
  const angleDegrees = Math.round(((control.angle * 180) / Math.PI + 360) % 360);

  return (
    <div
      id="joystick-panel"
      className="flex flex-col items-center bg-[#0b0e15] border border-neutral-800 rounded-2xl p-4 shadow-2xl select-none relative overflow-hidden"
      style={{
        boxShadow: `0 0 25px rgba(0,0,0,0.9), 0 0 15px ${theme.glowColor}20`,
        borderColor: `${theme.lineColor}40`,
      }}
    >
      {/* Top subtle neon highlight line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.lineColor}, transparent)`,
        }}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3 text-xs font-mono">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <div
            className="w-5 h-5 rounded-lg flex items-center justify-center border shadow-sm"
            style={{
              backgroundColor: '#000000',
              borderColor: `${theme.lineColor}60`,
              boxShadow: `0 0 8px ${theme.glowColor}`,
              color: theme.lineColor,
            }}
          >
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className="text-white font-bold text-xs tracking-wider">
            JOYSTICK 3D
          </span>
        </div>
        <button
          id="btn-stop-rotation"
          onClick={handleStop}
          title="Dừng xoay ngay lập tức"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 transition text-[11px] font-mono border border-rose-500/60 hover:border-rose-400 active:scale-95 shadow-[0_0_10px_rgba(244,63,94,0.25)] font-semibold"
        >
          <Square className="w-2.5 h-2.5 text-rose-400 fill-rose-400 animate-pulse" />
          <span>Dừng</span>
        </button>
      </div>

      {/* Joystick Circle area */}
      <div
        ref={circleRef}
        id="joystick-pad"
        onMouseDown={(e) => {
          setIsDragging(true);
          updateFromPosition(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches[0]) {
            updateFromPosition(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        style={{
          width: `${circleSize}px`,
          height: `${circleSize}px`,
          borderColor: `${theme.lineColor}40`,
          boxShadow: `inset 0 0 25px rgba(0,0,0,0.9), 0 0 15px ${theme.glowColor}15`,
        }}
        className="relative rounded-full cursor-pointer bg-black border-2 transition-all hover:border-cyan-400/80 flex items-center justify-center overflow-hidden touch-none"
      >
        {/* Concentric neon rings */}
        <div
          className="absolute w-3/4 h-3/4 rounded-full border border-dashed pointer-events-none"
          style={{ borderColor: `${theme.lineColor}25` }}
        />
        <div
          className="absolute w-1/2 h-1/2 rounded-full border pointer-events-none"
          style={{ borderColor: `${theme.lineColor}35` }}
        />
        <div
          className="absolute w-1/4 h-1/4 rounded-full border pointer-events-none"
          style={{ borderColor: `${theme.lineColor}45` }}
        />

        {/* Crosshair guidelines */}
        <div
          className="absolute w-full h-[1px] pointer-events-none"
          style={{ backgroundColor: `${theme.lineColor}20` }}
        />
        <div
          className="absolute h-full w-[1px] pointer-events-none"
          style={{ backgroundColor: `${theme.lineColor}20` }}
        />

        {/* Direction Indicator Line */}
        {control.speed > 0 && (
          <div
            className="absolute origin-top pointer-events-none"
            style={{
              left: `${radius - 1}px`,
              top: `${radius}px`,
              width: '2px',
              height: `${currentDist}px`,
              transform: `rotate(${control.angle + Math.PI / 2}rad)`,
              backgroundColor: theme.lineColor,
              boxShadow: `0 0 10px ${theme.lineColor}, 0 0 20px ${theme.glowColor}`,
            }}
          />
        )}

        {/* Center neon dot */}
        <div
          className="absolute w-2 h-2 rounded-full pointer-events-none shadow-sm"
          style={{
            backgroundColor: theme.lineColor,
            boxShadow: `0 0 8px ${theme.lineColor}`,
          }}
        />

        {/* Movable Handle */}
        <div
          id="joystick-handle"
          style={{
            left: `${handleX - 12}px`,
            top: `${handleY - 12}px`,
            backgroundColor: '#000000',
            borderColor: theme.lineColor,
            boxShadow: `0 0 14px ${theme.lineColor}, 0 0 25px ${theme.glowColor}, inset 0 0 8px ${theme.lineColor}`,
          }}
          className={`absolute w-6 h-6 rounded-full cursor-grab active:cursor-grabbing border-2 transition-transform flex items-center justify-center ${
            isDragging ? 'scale-125' : 'hover:scale-110'
          }`}
        >
          <div
            className="w-2 h-2 rounded-full pointer-events-none"
            style={{ backgroundColor: theme.lineColor }}
          />
        </div>
      </div>

      {/* Speed & Angle readout */}
      <div className="w-full mt-3 pt-2.5 border-t border-neutral-800 flex items-center justify-between text-xs font-mono">
        <div className="flex flex-col">
          <span className="text-[11px] text-neutral-300 font-semibold uppercase tracking-wider">Tốc độ</span>
          <span
            className="font-bold text-base"
            style={{
              color: theme.lineColor,
              textShadow: `0 0 10px ${theme.glowColor}`,
            }}
          >
            {control.speed}{' '}
            <span className="text-xs text-neutral-300 font-normal">px/s</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-neutral-300 font-semibold uppercase tracking-wider">Góc quay</span>
          <span className="font-bold text-white text-base font-mono">
            {angleDegrees}°
          </span>
        </div>
      </div>

      <div className="text-xs text-neutral-200 text-center mt-2 px-1 font-medium">
        Kéo cần: <span className="text-cyan-300 font-semibold">xa tâm = nhanh</span>,{' '}
        <span className="text-cyan-300 font-semibold">gần tâm = chậm</span>
      </div>

      {/* Preset quick directional buttons */}
      <div className="w-full grid grid-cols-4 gap-1.5 mt-2.5">
        <button
          onClick={() => handlePresetDirection(-Math.PI / 2, 0.45)}
          className="py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-xs font-mono text-white border border-neutral-700 hover:border-cyan-400 hover:text-cyan-300 transition text-center font-bold"
          title="Quay lên trên"
        >
          ▲ Lên
        </button>
        <button
          onClick={() => handlePresetDirection(Math.PI / 2, 0.45)}
          className="py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-xs font-mono text-white border border-neutral-700 hover:border-cyan-400 hover:text-cyan-300 transition text-center font-bold"
          title="Quay xuống dưới"
        >
          ▼ Xuống
        </button>
        <button
          onClick={() => handlePresetDirection(Math.PI, 0.45)}
          className="py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-xs font-mono text-white border border-neutral-700 hover:border-cyan-400 hover:text-cyan-300 transition text-center font-bold"
          title="Quay sang trái"
        >
          ◄ Trái
        </button>
        <button
          onClick={() => handlePresetDirection(0, 0.45)}
          className="py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-xs font-mono text-white border border-neutral-700 hover:border-cyan-400 hover:text-cyan-300 transition text-center font-bold"
          title="Quay sang phải"
        >
          ► Phải
        </button>
      </div>
    </div>
  );
};
