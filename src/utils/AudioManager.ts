class AudioManager {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public async playSiren() {
    if (this.isPlaying) return;
    this.init();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.isPlaying = true;
    
    // Create oscillator
    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();

    this.oscillator.type = 'sawtooth';
    this.oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    
    // Frequency modulation for siren effect
    this.oscillator.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.5);
    this.oscillator.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 1.0);
    
    // Loop the frequency modulation
    this.lfo = this.audioCtx.createOscillator();
    this.lfo.type = 'triangle';
    this.lfo.frequency.value = 1; // 1Hz modulation
    
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.value = 440; // Frequency range
    
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.oscillator.frequency);
    this.lfo.start();

    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.1);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    this.oscillator.start();
  }

  public stopSiren() {
    if (!this.isPlaying) return;
    
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.5);
      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        if (this.lfo) {
          this.lfo.stop();
          this.lfo.disconnect();
          this.lfo = null;
        }
        if (this.gainNode) {
          this.gainNode.disconnect();
          this.gainNode = null;
        }
        this.isPlaying = false;
      }, 500);
    }
  }
}

export const audioManager = new AudioManager();
