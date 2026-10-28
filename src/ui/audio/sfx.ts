// WebAudio sound synthesis for mechanical office sounds
// Muted by default, enabled when user toggles 'M'

export class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  public enabled = false;

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled && !this.ctx) {
      this.init();
    }
    return this.enabled;
  }

  // TODO: M8 - Implement stamp, paper rustle, typewriter click, bell, chime, crt buzz
  public playStamp() {}
  public playPaper() {}
  public playTypewriter() {}
  public playChime() {}
}

export const sfx = SoundManager.getInstance();
