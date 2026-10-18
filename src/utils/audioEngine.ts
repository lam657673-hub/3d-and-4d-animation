// Web Audio API Generative Sound Engine & Custom Audio Manager
// 1. Equinox Armor Theme (Gacha RPG) -> Theme đặc trưng của THIÊN LONG (Người làm ra)
// 2. Attribute Mutilation Fractured -> Theme đặc trưng của THÀNH TÀI (Ý tưởng)
// 3. Black Hole Soundscape -> Tiếng hút chân không, đĩa bồi tụ Lỗ Đen
// 4. 4D Hyperspace Soundscape -> Tiếng chuông pha lê đa chiều bay bổng vu vơ
// 5. Hỗ trợ tải trực tiếp file MP3 gốc từ máy tính vào để nghe với chất lượng âm thanh phòng thu!

export type SoundMode = 'equinox' | 'attribute' | 'blackhole' | 'hyperspace4d' | 'ambient3d' | 'custom' | 'off';

export interface TrackMetadata {
  id: SoundMode;
  title: string;
  artist: string;
  role: string;
  badge: string;
  color: string;
  bgGlow: string;
  description: string;
}

export const TRACK_CATALOG: TrackMetadata[] = [
  {
    id: 'equinox',
    title: 'Equinox Armor Theme (Gacha RPG)',
    artist: 'Thiên Long',
    role: 'Người làm ra • Kỹ sư Render 3D & 4D',
    badge: '⚔️ THEME THIÊN LONG',
    color: '#00ffcc',
    bgGlow: 'rgba(0, 255, 204, 0.4)',
    description: 'Bản hùng ca điện tử Gacha RPG với nhịp bass 16-beat dồn dập, arpeggio giáp chiến binh và giai điệu hào hùng.',
  },
  {
    id: 'attribute',
    title: 'Attribute Mutilation Fractured',
    artist: 'Thành Tài',
    role: 'Ý tưởng • Kiến trúc sư Siêu Không Gian',
    badge: '⚡ THEME THÀNH TÀI',
    color: '#d946ef',
    bgGlow: 'rgba(217, 70, 239, 0.4)',
    description: 'Cyber-glitch công nghiệp đa chiều tăm tối với sub-drop chấn động, bassline méo mó và nhịp đập rạn nứt bí ẩn.',
  },
  {
    id: 'hyperspace4d',
    title: '4D Hyperspace Celestial Chimes',
    artist: 'Thiên Long & Thành Tài',
    role: 'Không Gian 4D',
    badge: '🌌 4D HYPERSPACE',
    color: '#a855f7',
    bgGlow: 'rgba(168, 85, 247, 0.4)',
    description: 'Hợp âm đa chiều lơ lửng, chuông pha lê vũ trụ ngân nga vu vơ theo góc quay trục W.',
  },
  {
    id: 'blackhole',
    title: 'Supermassive Black Hole Vacuum',
    artist: 'Thiên Long & Thành Tài',
    role: 'Lỗ Đen 10.000 Điểm',
    badge: '🕳️ LỖ ĐEN VŨ TRỤ',
    color: '#ef4444',
    bgGlow: 'rgba(239, 68, 68, 0.4)',
    description: 'Âm trầm hạ âm cực sâu 48Hz, tiếng gió xoáy của đĩa bồi tụ và lực hút hấp dẫn khổng lồ.',
  },
];

class CosmicAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.4;
  private currentMode: SoundMode = 'off';
  private listeners: (() => void)[] = [];

  // Audio Nodes
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;

  // Active procedural nodes & timers
  private activeNodes: { stop: () => void }[] = [];
  private sequenceTimer: number | null = null;
  private intervalTimer: number | null = null;

  // Custom uploaded MP3 Audio element & cache
  private customAudioEl: HTMLAudioElement | null = null;
  private customAudioUrls: {
    thienlong?: { url: string; name: string };
    thanhtai?: { url: string; name: string };
  } = {};

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      // Stereo delay for ambient depth
      this.delayNode = this.ctx.createDelay(2.0);
      this.delayNode.delayTime.setValueAtTime(0.38, this.ctx.currentTime);

      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable
    }
  }

  public async resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Pending user gesture
      }
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch {
        // ignore
      }
    });
  }

  private clearActiveVoices() {
    if (this.sequenceTimer) {
      window.clearInterval(this.sequenceTimer);
      this.sequenceTimer = null;
    }
    if (this.intervalTimer) {
      window.clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.customAudioEl) {
      try {
        this.customAudioEl.pause();
        this.customAudioEl.currentTime = 0;
      } catch {
        // ignore
      }
    }
    this.activeNodes.forEach(node => {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    });
    this.activeNodes = [];
  }

  // Play a specific Theme directly (Equinox / Attribute / Black Hole / Hyperspace)
  public playTheme(mode: SoundMode) {
    this.resume();
    this.isMuted = false;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }

    // Check if custom audio file exists for Thiên Long (Equinox) or Thành Tài (Attribute)
    if (mode === 'equinox' && this.customAudioUrls.thienlong) {
      this.playCustomAudio(this.customAudioUrls.thienlong.url, 'equinox');
      return;
    }
    if (mode === 'attribute' && this.customAudioUrls.thanhtai) {
      this.playCustomAudio(this.customAudioUrls.thanhtai.url, 'attribute');
      return;
    }

    this.currentMode = mode;
    this.startModeVoice(mode);
    this.notify();
  }

  // Switch between shape presets
  public setShapeTarget(isBlackHole: boolean, is4D: boolean) {
    // If the user explicitly chose a signature theme like Equinox or Attribute, don't interrupt unless muted
    if (this.currentMode === 'equinox' || this.currentMode === 'attribute') {
      return;
    }

    let targetMode: SoundMode = 'off';
    if (isBlackHole) {
      targetMode = 'blackhole';
    } else if (is4D) {
      targetMode = 'hyperspace4d';
    } else {
      targetMode = 'ambient3d';
    }

    if (this.currentMode !== targetMode) {
      this.currentMode = targetMode;
      this.startModeVoice(targetMode);
      this.notify();
    }
  }

  private startModeVoice(mode: SoundMode) {
    if (!this.ctx || !this.masterGain) return;
    this.clearActiveVoices();

    if (mode === 'equinox') {
      this.playEquinoxArmorTheme();
    } else if (mode === 'attribute') {
      this.playAttributeMutilationTheme();
    } else if (mode === 'blackhole') {
      this.playBlackHoleSound();
    } else if (mode === 'hyperspace4d') {
      this.playHyperspace4DSound();
    } else if (mode === 'ambient3d') {
      this.playSoftAmbientSound();
    }
  }

  // =================================================================================
  // 1. EQUINOX ARMOR THEME (Gacha RPG) - Theme của THIÊN LONG
  // Driving 128 BPM electronic gacha RPG anthem with cyber armor bassline & heroic lead
  // =================================================================================
  private playEquinoxArmorTheme() {
    if (!this.ctx || !this.masterGain) return;

    const tempoBpm = 128;
    const stepDuration = 60 / tempoBpm / 4; // 16th note (~117ms)
    let stepIndex = 0;

    // Bassline in D minor / F / G / Bb progression
    const basslineD = [
      73.42, 73.42, 146.83, 73.42, 73.42, 73.42, 110.0, 73.42, // D2 driving
      87.31, 87.31, 174.61, 87.31, 98.0, 98.0, 196.0, 98.0,    // F2 & G2
      116.54, 116.54, 233.08, 116.54, 110.0, 110.0, 220.0, 110.0, // Bb2 & A2
      73.42, 146.83, 220.0, 293.66, 261.63, 220.0, 174.61, 146.83, // Arpeggio roll
    ];

    // Heroic Lead Melody (Gacha RPG Boss/Armor battle sequence)
    // Notes: D4, F4, G4, A4, C5, D5, C5, A4, F4, G4, A4, D4...
    const melodyNotes: { note: number; length: number; bar: number; beat: number }[] = [
      { note: 293.66, length: 2, bar: 0, beat: 0 },  // D4
      { note: 349.23, length: 2, bar: 0, beat: 2 },  // F4
      { note: 392.00, length: 2, bar: 0, beat: 4 },  // G4
      { note: 440.00, length: 4, bar: 0, beat: 6 },  // A4
      { note: 523.25, length: 2, bar: 0, beat: 10 }, // C5
      { note: 587.33, length: 4, bar: 0, beat: 12 }, // D5 (Climax)
      { note: 523.25, length: 2, bar: 1, beat: 0 },  // C5
      { note: 440.00, length: 2, bar: 1, beat: 2 },  // A4
      { note: 392.00, length: 2, bar: 1, beat: 4 },  // G4
      { note: 349.23, length: 2, bar: 1, beat: 6 },  // F4
      { note: 329.63, length: 2, bar: 1, beat: 8 },  // E4
      { note: 293.66, length: 6, bar: 1, beat: 10 }, // D4 long sustain
    ];

    // Helper: Trigger synthesized Kick drum
    const playKick = (time: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.2);
    };

    // Helper: Trigger synthesized Snare
    const playSnare = (time: number) => {
      if (!this.ctx || !this.masterGain) return;
      // Tone body
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(70, time + 0.08);

      const toneGain = this.ctx.createGain();
      toneGain.gain.setValueAtTime(0.2, time);
      toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(toneGain);
      toneGain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.14);

      // Noise sizzle
      const bufferSize = this.ctx.sampleRate * 0.12;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.8;

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(900, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(time);
    };

    // Helper: Trigger Hi-hat
    const playHihat = (time: number, accent: boolean) => {
      if (!this.ctx || !this.masterGain) return;
      const bufferSize = this.ctx.sampleRate * 0.04;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(accent ? 0.08 : 0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(time);
    };

    // Helper: Trigger Bass synth note
    const playBassNote = (time: number, freq: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(350, time + 0.1);
      filter.Q.setValueAtTime(3.5, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.12);
    };

    // Helper: Trigger Lead melody synth note
    const playLeadNote = (time: number, freq: number, duration: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 1.004, time); // Detuned for chorus glow

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, time);
      filter.Q.setValueAtTime(2.0, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.setTargetAtTime(0.08, time + 0.03, 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.02);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration);
      osc2.stop(time + duration);
    };

    // Pad chords in background (Dm -> Bb -> C -> Am)
    const padOscs: OscillatorNode[] = [];
    const padChordFreqs = [146.83, 220.0, 261.63, 349.23]; // Dm7
    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    padGain.connect(this.masterGain);

    padChordFreqs.forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.connect(padGain);
      osc.start();
      padOscs.push(osc);
    });

    // 16th note loop sequencer
    this.sequenceTimer = window.setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const currentStep = stepIndex % 32;

      // 1. Kick on 1, 5, 9, 13, 17, 21, 25, 29 (4-on-the-floor)
      if (currentStep % 4 === 0) {
        playKick(t);
      }

      // 2. Snare on beats 2 & 4 (steps 4, 12, 20, 28)
      if (currentStep % 8 === 4) {
        playSnare(t);
      }

      // 3. Hi-hats on all 16ths
      playHihat(t, currentStep % 2 === 0);

      // 4. Bassline
      const bassFreq = basslineD[currentStep];
      if (bassFreq) {
        playBassNote(t, bassFreq);
      }

      // 5. Melody notes
      const melodyMatch = melodyNotes.find(m => m.bar * 16 + m.beat === currentStep);
      if (melodyMatch) {
        playLeadNote(t, melodyMatch.note, melodyMatch.length * stepDuration);
      }

      stepIndex++;
    }, stepDuration * 1000);

    this.activeNodes.push({
      stop: () => {
        padOscs.forEach(o => {
          try {
            o.stop();
            o.disconnect();
          } catch {
            // ignore
          }
        });
        padGain.disconnect();
      },
    });
  }

  // =================================================================================
  // 2. ATTRIBUTE MUTILATION FRACTURED - Theme của THÀNH TÀI
  // Dark Cyber-Glitch, Distorted Bass, Syncopated Sub Drops, Fractured Industrial Arpeggio
  // =================================================================================
  private playAttributeMutilationTheme() {
    if (!this.ctx || !this.masterGain) return;

    const tempoBpm = 140;
    const stepDuration = 60 / tempoBpm / 2; // 8th note (~214ms)
    let stepIndex = 0;

    // Heavy distorted sub drop
    const playSubDrop = (time: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.38, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.45);
    };

    // Glitch noise burst / industrial metallic cut
    const playGlitchHit = (time: number, isFractured: boolean) => {
      if (!this.ctx || !this.masterGain) return;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() > 0.5 ? 1 : -1) * 0.6;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = isFractured ? 'bandpass' : 'highpass';
      filter.frequency.setValueAtTime(isFractured ? 1800 : 3500, time);
      filter.Q.setValueAtTime(5.0, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      if (this.delayNode) {
        gain.connect(this.delayNode);
      }
      noise.start(time);
    };

    // Distorted Saw Bass stab (Cyberpunk Attribute Riff)
    const playDistortedBass = (time: number, freq: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      // Waveshaper / saturation distortion
      const shaper = this.ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = ((Math.PI + 4) * x) / (Math.PI + 4 * Math.abs(x));
      }
      shaper.curve = curve;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, time);
      filter.frequency.exponentialRampToValueAtTime(180, time + 0.18);
      filter.Q.setValueAtTime(6.0, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.24, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      osc.connect(shaper);
      shaper.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.24);
    };

    // Dark Drone in background (C# / F# dissonant interval)
    const droneOsc = this.ctx.createOscillator();
    droneOsc.type = 'sawtooth';
    droneOsc.frequency.setValueAtTime(69.3, this.ctx.currentTime); // C#2
    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.masterGain);
    droneOsc.start();

    // Fractured Riff Notes (D minor chromatic / industrial dissonance)
    const riffNotes = [
      73.42, 0, 77.78, 73.42, 0, 92.50, 73.42, 0,  // D2, Eb2, D2, F#2, D2
      73.42, 73.42, 0, 82.41, 0, 77.78, 69.30, 0, // D2, E2, Eb2, C#2
    ];

    this.sequenceTimer = window.setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const step = stepIndex % 16;

      // Heavy Sub drop on step 0 and 8
      if (step === 0 || step === 8) {
        playSubDrop(t);
      }

      // Glitch hits on syncopated fractured beats
      if (step === 2 || step === 6 || step === 11 || step === 14) {
        playGlitchHit(t, step % 4 === 2);
      }

      // Distorted Bass riff
      const note = riffNotes[step];
      if (note && note > 0) {
        playDistortedBass(t, note);
      }

      stepIndex++;
    }, stepDuration * 1000);

    this.activeNodes.push({
      stop: () => {
        try {
          droneOsc.stop();
          droneOsc.disconnect();
        } catch {
          // ignore
        }
      },
    });
  }

  // =================================================================================
  // 3. BLACK HOLE SOUND (Lỗ Đen 10.000 Điểm)
  // =================================================================================
  private playBlackHoleSound() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(48, now);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(120, now);
    subFilter.Q.setValueAtTime(4, now);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.exponentialRampToValueAtTime(0.28, now + 2.0);

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(320, now);
    noiseFilter.Q.setValueAtTime(3.5, now);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, now);
    lfo.connect(lfoGain);
    lfoGain.connect(noiseFilter.frequency);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.12, now + 2.5);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.masterGain);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    if (this.delayNode) {
      noiseGain.connect(this.delayNode);
    }

    subOsc.start(now);
    whiteNoise.start(now);
    lfo.start(now);

    this.activeNodes.push({
      stop: () => {
        try {
          const t = this.ctx?.currentTime || 0;
          subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
          setTimeout(() => {
            subOsc.stop();
            whiteNoise.stop();
            lfo.stop();
            subOsc.disconnect();
            whiteNoise.disconnect();
            lfo.disconnect();
          }, 600);
        } catch {
          // ignore
        }
      },
    });
  }

  // =================================================================================
  // 4. HYPERSPACE 4D SOUND (Chiều 4D Tesseract / 24-Cell)
  // =================================================================================
  private playHyperspace4DSound() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const chordFreqs = [174.61, 220.0, 261.63, 329.63, 392.0, 523.25];
    chordFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.5, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + idx * 120, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.045 / (idx * 0.3 + 1), now + 1.5 + idx * 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc.start(now);
      this.activeNodes.push({
        stop: () => {
          try {
            const t = this.ctx?.currentTime || 0;
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
            setTimeout(() => {
              osc.stop();
              osc.disconnect();
            }, 700);
          } catch {
            // ignore
          }
        },
      });
    });

    const bellNotes = [523.25, 659.25, 783.99, 880.0, 1046.5, 1318.51];
    const playChime = () => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const chimeNow = this.ctx.currentTime;
      const note = bellNotes[Math.floor(Math.random() * bellNotes.length)];

      const bell = this.ctx.createOscillator();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(note, chimeNow);

      const bellGain = this.ctx.createGain();
      bellGain.gain.setValueAtTime(0.03, chimeNow);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, chimeNow + 3.0);

      bell.connect(bellGain);
      bellGain.connect(this.masterGain);
      if (this.delayNode) {
        bellGain.connect(this.delayNode);
      }

      bell.start(chimeNow);
      bell.stop(chimeNow + 3.1);
    };

    this.intervalTimer = window.setInterval(() => {
      if (Math.random() > 0.3) {
        playChime();
      }
    }, 3500);

    setTimeout(playChime, 800);
  }

  // =================================================================================
  // 5. AMBIENT 3D SOUND
  // =================================================================================
  private playSoftAmbientSound() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 1.8);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);

    this.activeNodes.push({
      stop: () => {
        try {
          const t = this.ctx?.currentTime || 0;
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
          setTimeout(() => {
            osc.stop();
            osc.disconnect();
          }, 500);
        } catch {
          // ignore
        }
      },
    });
  }

  // =================================================================================
  // 6. CUSTOM MP3 AUDIO PLAYBACK (File người dùng tải lên)
  // =================================================================================
  public loadCustomFile(file: File, forWho: 'thienlong' | 'thanhtai') {
    const objectUrl = URL.createObjectURL(file);
    if (forWho === 'thienlong') {
      this.customAudioUrls.thienlong = { url: objectUrl, name: file.name };
      this.playTheme('equinox');
    } else {
      this.customAudioUrls.thanhtai = { url: objectUrl, name: file.name };
      this.playTheme('attribute');
    }
    this.notify();
  }

  private playCustomAudio(url: string, theme: 'equinox' | 'attribute') {
    this.clearActiveVoices();
    this.currentMode = theme;

    if (!this.customAudioEl) {
      this.customAudioEl = new Audio();
      this.customAudioEl.loop = true;
    }
    this.customAudioEl.src = url;
    this.customAudioEl.volume = this.isMuted ? 0 : this.volume;
    this.customAudioEl.play().catch(() => {
      // browser autoplay restriction
    });
    this.notify();
  }

  public getCustomFileName(forWho: 'thienlong' | 'thanhtai'): string | undefined {
    return forWho === 'thienlong'
      ? this.customAudioUrls.thienlong?.name
      : this.customAudioUrls.thanhtai?.name;
  }

  // Dynamic modulation
  public updateModulation(intensity: number, angleW?: number) {
    if (!this.ctx || !this.masterGain) return;
    if (this.delayNode && angleW !== undefined) {
      const dynamicDelay = 0.35 + (Math.sin(angleW) * 0.5 + 0.5) * 0.15;
      this.delayNode.delayTime.setTargetAtTime(dynamicDelay, this.ctx.currentTime, 0.2);
    }
  }

  // Controls
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }
    if (this.customAudioEl) {
      this.customAudioEl.volume = this.isMuted ? 0 : this.volume;
    }
    if (!this.isMuted && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.notify();
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.customAudioEl && !this.isMuted) {
      this.customAudioEl.volume = this.volume;
    }
    this.notify();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentMode(): SoundMode {
    return this.currentMode;
  }
}

export const cosmicAudio = new CosmicAudioEngine();
