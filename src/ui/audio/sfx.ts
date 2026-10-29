// WebAudio synth cho âm thanh văn phòng cơ học 2.0.
// Không dùng file mp3, không tải mạng. Mặc định TẮT, âm lượng tối đa 40%.

export type SoundName =
  | 'stamp'
  | 'stamp_heavy'
  | 'paper'
  | 'paper_slide'
  | 'paperclip_snap'
  | 'type'
  | 'bell'
  | 'chime'
  | 'buzz'
  | 'crt'
  | 'pen'
  | 'fountain_pen'
  | 'pencil_circle'
  | 'token'
  | 'dongle_insert'
  | 'calendar_tear'
  | 'clock_tick'
  | 'key_clack'
  | 'glass_clink'
  | 'sip'
  | 'pull_chain'
  | 'uv_switch'
  | 'phone_ring'
  | 'tape_reel';

const MAX_VOLUME = 0.4;

/** Chặn tiếng chồng khi typewriter/CRT/phím bắn liên tục. */
const THROTTLE_MS: Record<SoundName, number> = {
  stamp: 60,
  stamp_heavy: 60,
  paper: 90,
  paper_slide: 120,
  paperclip_snap: 80,
  type: 60,
  bell: 250,
  chime: 250,
  buzz: 200,
  crt: 120,
  pen: 200,
  fountain_pen: 160,
  pencil_circle: 150,
  token: 100,
  dongle_insert: 300,
  calendar_tear: 180,
  clock_tick: 50,
  key_clack: 50,
  glass_clink: 150,
  sip: 400,
  pull_chain: 200,
  uv_switch: 150,
  phone_ring: 800,
  tape_reel: 180,
};

interface ToneOptions {
  freq: number;
  endFreq?: number;
  type: OscillatorType;
  dur: number;
  gain: number;
  delay?: number;
}

export class SoundManager {
  private static instance: SoundManager | null = null;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private volume = MAX_VOLUME;
  private enabled = false;
  private lastPlayed: Partial<Record<SoundName, number>> = {};

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) SoundManager.instance = new SoundManager();
    return SoundManager.instance;
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  /** Tạo AudioContext muộn — chỉ sau một thao tác người dùng. */
  public init(): void {
    if (this.ctx || typeof window === 'undefined') return;

    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return;

    try {
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = this.enabled ? this.volume : 0;
      master.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
    } catch {
      this.ctx = null;
      this.master = null;
    }
  }

  public setEnabled(on: boolean): void {
    this.enabled = on;
    if (on) {
      this.init();
      this.resume();
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(on ? this.volume : 0, this.ctx.currentTime, 0.015);
    }
  }

  /** Âm lượng 0…0.4 (40%). */
  public setVolume(value: number): void {
    const clamped = Math.max(0, Math.min(MAX_VOLUME, Number.isFinite(value) ? value : 0));
    this.volume = clamped;
    if (this.master && this.ctx && this.enabled) {
      this.master.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.015);
    }
  }

  public resume(): void {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
  }

  public play(name: SoundName): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.master) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const last = this.lastPlayed[name] ?? -Infinity;
    if (now - last < THROTTLE_MS[name]) return;
    this.lastPlayed[name] = now;

    this.resume();

    switch (name) {
      case 'stamp':
      case 'stamp_heavy':
        this.synthStamp();
        break;
      case 'paper':
        this.synthPaper();
        break;
      case 'paper_slide':
        this.synthPaperSlide();
        break;
      case 'paperclip_snap':
        this.synthPaperclipSnap();
        break;
      case 'type':
      case 'key_clack':
        this.synthType();
        break;
      case 'bell':
        this.synthBell();
        break;
      case 'chime':
        this.synthChime();
        break;
      case 'buzz':
        this.synthBuzz();
        break;
      case 'crt':
        this.synthCrt();
        break;
      case 'pen':
      case 'fountain_pen':
        this.synthFountainPen();
        break;
      case 'pencil_circle':
        this.synthPencilCircle();
        break;
      case 'token':
        this.synthToken();
        break;
      case 'dongle_insert':
        this.synthDongleInsert();
        break;
      case 'calendar_tear':
        this.synthCalendarTear();
        break;
      case 'clock_tick':
        this.synthClockTick();
        break;
      case 'glass_clink':
        this.synthGlassClink();
        break;
      case 'sip':
        this.synthSip();
        break;
      case 'pull_chain':
        this.synthPullChain();
        break;
      case 'uv_switch':
        this.synthUvSwitch();
        break;
      case 'phone_ring':
        this.synthPhoneRing();
        break;
      case 'tape_reel':
        this.synthTapeReel();
        break;
    }
  }

  // --- Convenience API ---
  public playStamp(): void {
    this.play('stamp_heavy');
  }

  public playPaper(): void {
    this.play('paper');
  }

  public playPaperSlide(): void {
    this.play('paper_slide');
  }

  public playPaperclip(): void {
    this.play('paperclip_snap');
  }

  public playTypewriter(): void {
    this.play('type');
  }

  public playKeyClack(): void {
    this.play('key_clack');
  }

  public playBell(): void {
    this.play('bell');
  }

  public playChime(): void {
    this.play('chime');
  }

  public playBuzz(): void {
    this.play('buzz');
  }

  public playCrt(): void {
    this.play('crt');
  }

  public playPen(): void {
    this.play('fountain_pen');
  }

  public playFountainPen(): void {
    this.play('fountain_pen');
  }

  public playPencilCircle(): void {
    this.play('pencil_circle');
  }

  public playToken(): void {
    this.play('token');
  }

  public playDongleInsert(): void {
    this.play('dongle_insert');
  }

  public playCalendarTear(): void {
    this.play('calendar_tear');
  }

  public playClockTick(): void {
    this.play('clock_tick');
  }

  public playGlassClink(): void {
    this.play('glass_clink');
  }

  public playSip(): void {
    this.play('sip');
  }

  public playPullChain(): void {
    this.play('pull_chain');
  }

  public playUvSwitch(): void {
    this.play('uv_switch');
  }

  public playPhoneRing(): void {
    this.play('phone_ring');
  }

  public playTapeReel(): void {
    this.play('tape_reel');
  }

  // --- Synthesis Building Blocks ---
  private tone(opts: ToneOptions): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = opts.type;
    osc.frequency.setValueAtTime(Math.max(1, opts.freq), t0);
    if (opts.endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.endFreq), t0 + opts.dur);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.gain), t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.03);
  }

  private noise(dur: number, gainValue: number, filter: BiquadFilterType, freq: number, delay = 0): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const buffer = this.getNoiseBuffer(ctx);
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    const filterNode = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    src.buffer = buffer;
    filterNode.type = filter;
    filterNode.frequency.value = freq;
    filterNode.Q.value = 0.8;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filterNode);
    filterNode.connect(gain);
    gain.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = Math.floor(ctx.sampleRate * 0.4);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }

  // --- Synthesized Sound Profiles ---

  /** Cú dập con dấu 3 tầng: Sub-bass 60Hz + Tiếng gỗ/kim loại đanh + Lò xo bật lại. */
  private synthStamp(): void {
    // Tầng 1: Sub-bass va đập mặt bàn
    this.tone({ freq: 125, endFreq: 40, type: 'sine', dur: 0.16, gain: 0.36 });
    this.tone({ freq: 72, endFreq: 36, type: 'sine', dur: 0.14, gain: 0.22, delay: 0.006 });
    // Tầng 2: Cú clack cơ khí dập mộc
    this.noise(0.05, 0.22, 'bandpass', 850);
    // Tầng 3: Lẫy lò xo nảy lại
    this.tone({ freq: 1700, endFreq: 850, type: 'triangle', dur: 0.016, gain: 0.07, delay: 0.085 });
  }

  /** Tiếng lướt giấy mộc trên mặt bàn. */
  private synthPaper(): void {
    this.noise(0.18, 0.1, 'bandpass', 2200);
    this.noise(0.12, 0.06, 'highpass', 1400, 0.04);
  }

  /** Tiếng miết trượt giấy dài. */
  private synthPaperSlide(): void {
    this.noise(0.22, 0.09, 'bandpass', 1850);
    this.noise(0.15, 0.05, 'lowpass', 950, 0.04);
  }

  /** Kẹp ghim kim loại kẹp tách vào mép giấy. */
  private synthPaperclipSnap(): void {
    this.tone({ freq: 2400, type: 'square', dur: 0.012, gain: 0.06 });
    this.tone({ freq: 3200, type: 'square', dur: 0.01, gain: 0.04, delay: 0.004 });
    this.noise(0.018, 0.06, 'highpass', 3600);
  }

  /** Tiếng gõ phím cơ học / máy đánh chữ. */
  private synthType(): void {
    const jitter = 1450 + Math.floor(Math.random() * 420);
    this.tone({ freq: jitter, type: 'square', dur: 0.016, gain: 0.045 });
    this.noise(0.012, 0.035, 'highpass', 3000);
  }

  /** Tiếng chuông reo nhắc việc SLA (T6). */
  private synthBell(): void {
    this.tone({ freq: 880, type: 'sine', dur: 0.55, gain: 0.12 });
    this.tone({ freq: 1320, type: 'sine', dur: 0.45, gain: 0.06, delay: 0.02 });
    this.tone({ freq: 1760, type: 'sine', dur: 0.32, gain: 0.03, delay: 0.04 });
  }

  /** Hợp âm thành công khi ca được phê duyệt (E_END_OK). */
  private synthChime(): void {
    this.tone({ freq: 523.25, type: 'sine', dur: 0.35, gain: 0.1 });
    this.tone({ freq: 659.25, type: 'sine', dur: 0.35, gain: 0.09, delay: 0.09 });
    this.tone({ freq: 783.99, type: 'sine', dur: 0.42, gain: 0.08, delay: 0.18 });
  }

  /** Cảnh báo lỗi / từ chối hồ sơ. */
  private synthBuzz(): void {
    this.tone({ freq: 120, type: 'sawtooth', dur: 0.22, gain: 0.1 });
    this.tone({ freq: 116, type: 'square', dur: 0.22, gain: 0.05 });
  }

  /** Tiếng bíp xung điện hệ thống CRT khi máy thực thi task. */
  private synthCrt(): void {
    this.tone({ freq: 70, endFreq: 55, type: 'square', dur: 0.05, gain: 0.05 });
    this.noise(0.03, 0.035, 'highpass', 1600);
  }

  /** Bút máy kim loại ký tên uốn lượn trên giấy nhám. */
  private synthFountainPen(): void {
    this.noise(0.24, 0.065, 'bandpass', 2200);
    this.tone({ freq: 360, endFreq: 270, type: 'triangle', dur: 0.16, gain: 0.025 });
  }

  /** Nét chì mỡ khoanh tròn điểm nghi vấn khi soi tài liệu. */
  private synthPencilCircle(): void {
    this.noise(0.06, 0.07, 'bandpass', 1450);
    this.noise(0.07, 0.06, 'bandpass', 1350, 0.05);
  }

  /** Chớp token phát quang. */
  private synthToken(): void {
    this.tone({ freq: 660, type: 'sine', dur: 0.06, gain: 0.06 });
    this.tone({ freq: 990, type: 'sine', dur: 0.05, gain: 0.04, delay: 0.05 });
  }

  /** Cắm USB Token bảo mật vào máy tính. */
  private synthDongleInsert(): void {
    this.noise(0.06, 0.07, 'bandpass', 2400);
    this.tone({ freq: 480, type: 'triangle', dur: 0.035, gain: 0.05, delay: 0.04 });
    this.tone({ freq: 880, type: 'sine', dur: 0.05, gain: 0.06, delay: 0.08 });
    this.tone({ freq: 1320, type: 'sine', dur: 0.09, gain: 0.05, delay: 0.13 });
  }

  /** Tiếng bóc xé tờ lịch bàn khi tua ngày. */
  private synthCalendarTear(): void {
    this.noise(0.18, 0.13, 'bandpass', 1600);
    this.noise(0.1, 0.06, 'highpass', 2400, 0.02);
  }

  /** Tíc tắc đồng hồ cơ giật nấc. */
  private synthClockTick(): void {
    this.tone({ freq: 1200, type: 'triangle', dur: 0.008, gain: 0.06 });
    this.noise(0.008, 0.03, 'highpass', 2800);
  }

  /** Muỗng gõ lách cách vào thành ly cà phê gốm/thủy tinh. */
  private synthGlassClink(): void {
    this.tone({ freq: 2850, type: 'sine', dur: 0.18, gain: 0.08 });
    this.tone({ freq: 4300, type: 'sine', dur: 0.12, gain: 0.035, delay: 0.003 });
  }

  /** Tiếng hớp ngụm cà phê / trà đá sảng khoái. */
  private synthSip(): void {
    this.noise(0.22, 0.065, 'bandpass', 1250);
    this.noise(0.12, 0.035, 'lowpass', 600, 0.1);
  }

  /** Dây giật cườm đồng của đèn bàn Banker nảy nảy và click công tắc. */
  private synthPullChain(): void {
    this.noise(0.035, 0.05, 'highpass', 3400);
    this.tone({ freq: 210, endFreq: 90, type: 'triangle', dur: 0.035, gain: 0.1, delay: 0.025 });
  }

  /** Công tắc gạt cơ học bật/tắt đèn tím UV soi mộc. */
  private synthUvSwitch(): void {
    this.tone({ freq: 120, endFreq: 60, type: 'square', dur: 0.03, gain: 0.08 });
    this.noise(0.018, 0.06, 'highpass', 2600);
  }

  /** Chuông điện thoại bàn cổ reng reng 2 nhịp dồn dập. */
  private synthPhoneRing(): void {
    // Nhịp 1
    this.tone({ freq: 440, type: 'sine', dur: 0.28, gain: 0.1 });
    this.tone({ freq: 480, type: 'sine', dur: 0.28, gain: 0.1 });
    // Nhịp 2
    this.tone({ freq: 440, type: 'sine', dur: 0.32, gain: 0.1, delay: 0.38 });
    this.tone({ freq: 480, type: 'sine', dur: 0.32, gain: 0.1, delay: 0.38 });
  }

  /** Băng từ máy chủ quay rè rè khi truy vấn CSDL. */
  private synthTapeReel(): void {
    this.tone({ freq: 110, type: 'sawtooth', dur: 0.1, gain: 0.03 });
    this.noise(0.07, 0.035, 'bandpass', 950);
  }
}

export const sfx = SoundManager.getInstance();
