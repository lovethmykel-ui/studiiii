'use client';

import { SoundEffectCueType } from '@/lib/video-engine';

/**
 * Procedural Web Audio Documentary Sound Engine (Zero external sample licensing needed).
 * Implements glebis/sound-effects minimal cohesive palette + Moh4696/cinematic-skill
 * procedural SFX synthesis, voiceover playback, automatic music ducking (-10dB during speech),
 * and live MediaStreamAudioDestination export for .WebM renders.
 */
export class RookSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private mediaDest: MediaStreamAudioDestinationNode | null = null;

  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientActive = false;

  private audioBufferCache = new Map<string, AudioBuffer>();
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private activeVoiceSceneId: string | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.75;

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = 1.0;

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;

      this.sfxGain.connect(this.masterGain);
      this.voiceGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);
      if (typeof this.ctx.createMediaStreamDestination === 'function') {
        this.mediaDest = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.mediaDest);
      }
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  public getExportAudioTrack(): MediaStreamTrack | null {
    this.ensureContext();
    return this.mediaDest?.stream.getAudioTracks()[0] || null;
  }

  public setMuted(muted: boolean) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.03);
  }

  public setAmbientEnabled(enabled: boolean) {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;

    if (enabled && !this.ambientActive) {
      // Subtle low noir investigative drone (D1 + A1 harmonic fifth, warm lowpass)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 165;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 36.71; // D1

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = 55.0; // A1

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.musicGain);

      osc1.start();
      osc2.start();

      this.ambientOsc1 = osc1;
      this.ambientOsc2 = osc2;
      this.ambientActive = true;
      this.musicGain.gain.setTargetAtTime(0.14, ctx.currentTime, 0.25);
    } else if (!enabled && this.ambientActive) {
      this.stopAmbient();
    }
  }

  public stopAmbient() {
    if (this.ambientOsc1) {
      try {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.ambientOsc1 = null;
    }
    if (this.ambientOsc2) {
      try {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.ambientOsc2 = null;
    }
    this.ambientActive = false;
  }

  private setMusicDucked(ducked: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const target = ducked ? 0.045 : 0.14;
    this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
  }

  /**
   * Plays a scene's synthesized narrator track (data:audio/wav;...) synchronized cleanly
   * and automatically ducks any background ambient noir score during narration.
   */
  public async playSceneVoiceover(
    sceneId: string,
    audioDataUrl?: string,
    offsetSec = 0
  ) {
    if (!audioDataUrl) return;
    if (this.activeVoiceSceneId === sceneId && this.activeVoiceSource) {
      return;
    }

    this.stopVoiceover();
    const ctx = this.ensureContext();
    if (!ctx || !this.voiceGain) return;

    try {
      let audioBuffer = this.audioBufferCache.get(audioDataUrl);
      if (!audioBuffer) {
        const res = await fetch(audioDataUrl);
        const arrBuf = await res.arrayBuffer();
        audioBuffer = await ctx.decodeAudioData(arrBuf);
        this.audioBufferCache.set(audioDataUrl, audioBuffer);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.voiceGain);

      const safeOffset = Math.max(
        0,
        Math.min(Math.max(0, audioBuffer.duration - 0.1), offsetSec)
      );
      this.activeVoiceSource = source;
      this.activeVoiceSceneId = sceneId;
      this.setMusicDucked(true);

      source.onended = () => {
        if (this.activeVoiceSource === source) {
          this.activeVoiceSource = null;
          this.activeVoiceSceneId = null;
          this.setMusicDucked(false);
        }
      };

      source.start(0, safeOffset);
    } catch {
      this.setMusicDucked(false);
    }
  }

  public stopVoiceover() {
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.activeVoiceSource = null;
    }
    this.activeVoiceSceneId = null;
    this.setMusicDucked(false);
  }

  /**
   * Synthesizes a procedural documentary sound effect directly via Web Audio oscillators/noise.
   */
  public triggerSfx(type: SoundEffectCueType, intensity = 0.85) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const gainScale = Math.max(0.15, Math.min(1.0, intensity));

    if (type === 'stamp-slam' || type === 'sub-boom') {
      // Punchy documentary sub-impact + tactile paper transient
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'stamp-slam' ? 140 : 88, now);
      osc.frequency.exponentialRampToValueAtTime(
        type === 'stamp-slam' ? 38 : 32,
        now + (type === 'stamp-slam' ? 0.16 : 0.42)
      );

      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.68 * gainScale, now + 0.008);
      env.gain.exponentialRampToValueAtTime(
        0.001,
        now + (type === 'stamp-slam' ? 0.22 : 0.55)
      );

      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.6);

      if (type === 'stamp-slam') {
        this.triggerNoiseBurst(0.05, 950, 'lowpass', 0.35 * gainScale);
      }
    } else if (type === 'highlighter-swipe') {
      // Marker felt brush sweep
      this.triggerNoiseBurst(0.14, 1900, 'bandpass', 0.24 * gainScale, 3200);
    } else if (type === 'whoosh-pan') {
      // Stereo air whip sweep
      this.triggerNoiseBurst(0.24, 380, 'bandpass', 0.32 * gainScale, 1450);
    } else if (type === 'redaction-glitch') {
      // Crisp encrypted terminal relay click
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1180, now);
      osc.frequency.setValueAtTime(520, now + 0.03);
      osc.frequency.setValueAtTime(1640, now + 0.055);
      env.gain.setValueAtTime(0.18 * gainScale, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'evidence-flash') {
      // Microfiche shutter transient
      this.triggerNoiseBurst(0.06, 2600, 'highpass', 0.28 * gainScale);
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      env.gain.setValueAtTime(0.22 * gainScale, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'counter-tick') {
      // Crisp minimal telemetry counter click
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1420, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.025);
      env.gain.setValueAtTime(0.18 * gainScale, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.035);
    }
  }

  private triggerNoiseBurst(
    durationSec: number,
    startFreq: number,
    filterType: BiquadFilterType,
    peakGain: number,
    endFreq?: number
  ) {
    if (!this.ctx || !this.sfxGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const sampleCount = Math.max(256, Math.floor(ctx.sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(startFreq, now);
    if (endFreq) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(80, endFreq),
        now + durationSec
      );
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(peakGain, now + durationSec * 0.2);
    env.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    src.start(now);
    src.stop(now + durationSec + 0.02);
  }
}

export const rookSoundEngine = new RookSoundEngine();
