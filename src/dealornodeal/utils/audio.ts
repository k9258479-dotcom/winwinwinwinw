/**
 * Web Audio API synthesizer for casino sounds.
 * Generates rich, authentic casino chimes, bell rings, and dramatic reveals
 * without relying on external MP3 files that could fail to load.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Check saved audio preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('golden_vault_sound_enabled');
      this.enabled = saved !== null ? saved === 'true' : true;
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('golden_vault_sound_enabled', String(this.enabled));
    }
    if (this.enabled) {
      this.playClick();
    }
    return this.enabled;
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /** Subtle tactile button click */
  public playClick() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext policy suppression safe catch
    }
  }

  /** Briefcase open reveal */
  public playCaseOpen(isHighValue: boolean) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Metallic click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1200, now);
      clickOsc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      clickGain.gain.setValueAtTime(0.2, now);
      clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.08);

      if (isHighValue) {
        // Tension dramatic brass sound for high value lost
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.4);
        gain.gain.setValueAtTime(0.18, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + 0.05);
        osc.stop(now + 0.45);
      } else {
        // Cheerful light chime for low value eliminated (great for player!)
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + 0.06 + idx * 0.06);
          gain.gain.setValueAtTime(0.12, now + 0.06 + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + idx * 0.06);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now + 0.06 + idx * 0.06);
          osc.stop(now + 0.28 + idx * 0.06);
        });
      }
    } catch {}
  }

  /** Dramatic suspense build-up before simultaneous opening */
  public playSuspense() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Rising low rumble / heartbeat
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.8);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    } catch {}
  }

  /** Simultaneous briefcases pop and burst open reveal */
  public playSimultaneousReveal(anyHighValue: boolean) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Heavy metallic unison latch open
      const burstOsc = this.ctx.createOscillator();
      const burstGain = this.ctx.createGain();
      burstOsc.type = 'sawtooth';
      burstOsc.frequency.setValueAtTime(320, now);
      burstOsc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
      burstGain.gain.setValueAtTime(0.3, now);
      burstGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      burstOsc.connect(burstGain);
      burstGain.connect(this.ctx.destination);
      burstOsc.start(now);
      burstOsc.stop(now + 0.35);

      // Shimmer chord
      const freqs = anyHighValue ? [261.63, 311.13, 392.0] : [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.05 + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + 0.05 + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + idx * 0.04);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + 0.05 + idx * 0.04);
        osc.stop(now + 0.55 + idx * 0.04);
      });
    } catch {}
  }


  /** Banker's Telephone Ringing (vintage dual bell) */
  public playPhoneRing() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // US standard telephone frequency: 440Hz + 480Hz modulated
      [0, 0.4].forEach((delay) => {
        const osc1 = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now + delay);
        osc2.frequency.setValueAtTime(480, now + delay);

        gain.gain.setValueAtTime(0.15, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx!.destination);

        osc1.start(now + delay);
        osc2.start(now + delay);
        osc1.stop(now + delay + 0.28);
        osc2.stop(now + delay + 0.28);
      });
    } catch {}
  }

  /** Banker live offer presented chime */
  public playOfferReveal() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [392, 523.25, 659.25, 1046.5]; // G4, C5, E5, C6
      chord.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.16, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.65);
      });
    } catch {}
  }

  /** Player accepts DEAL! (Cash register & cheer sound) */
  public playDeal() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Cash register bell ding
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now); // A6
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);

      // Warm winning brass arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, idx) => {
        const o = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + 0.15 + idx * 0.1);
        g.gain.setValueAtTime(0.18, now + 0.15 + idx * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + idx * 0.1 + 0.5);
        o.connect(g);
        g.connect(this.ctx!.destination);
        o.start(now + 0.15 + idx * 0.1);
        o.stop(now + 0.15 + idx * 0.1 + 0.55);
      });
    } catch {}
  }

  /** Player says NO DEAL! (Dramatic brass thud) */
  public playNoDeal() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch {}
  }

  /** Big Jackpot Fanfare */
  public playJackpot() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const scale = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1567.98];
      scale.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.22, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.65);
      });
    } catch {}
  }
}

export const soundManager = new SoundManager();
