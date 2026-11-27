// Synthesized audio (Web Audio API): sound effects plus a looping ambient bed retuned per region. No samples.
export class Sound {
  constructor() { this.vol = .6; this.ctx = null; this.amb = null; this.region = null; const go = () => this.init(); addEventListener('pointerdown', go, { once: true }); addEventListener('keydown', go, { once: true }); }
  init() {
    if (this.ctx) return;
    try { const c = this.ctx = new AudioContext(); this.master = c.createGain(); this.master.gain.value = this.vol; this.master.connect(c.destination);
      const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; this.noise = b; if (this.region) this.ambient(this.region); } catch { this.ctx = null; }
  }
  setVol(v) { this.vol = v; if (this.master) this.master.gain.value = v; }
  tone(f, dur, type = 'sine', g = .3, slide = 0) { const c = this.ctx; if (!c) return; const o = c.createOscillator(), a = c.createGain(); o.type = type; o.frequency.value = f; if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), c.currentTime + dur); a.gain.setValueAtTime(g, c.currentTime); a.gain.exponentialRampToValueAtTime(.001, c.currentTime + dur); o.connect(a); a.connect(this.master); o.start(); o.stop(c.currentTime + dur); }
  hiss(dur, g = .3, f = 2000) { const c = this.ctx; if (!c) return; const s = c.createBufferSource(), fl = c.createBiquadFilter(), a = c.createGain(); s.buffer = this.noise; fl.type = 'bandpass'; fl.frequency.value = f; a.gain.setValueAtTime(g, c.currentTime); a.gain.exponentialRampToValueAtTime(.001, c.currentTime + dur); s.connect(fl); fl.connect(a); a.connect(this.master); s.start(); s.stop(c.currentTime + dur); }
  sfx(k) {
    switch (k) {
      case 'hit': this.hiss(.12, .35, 1800); this.tone(120, .12, 'square', .12, -60); break; case 'parry': this.tone(1400, .25, 'triangle', .3, 400); this.hiss(.08, .3, 5000); break;
      case 'swing': this.hiss(.1, .12, 900); break; case 'roll': this.hiss(.2, .1, 400); break; case 'cast': this.tone(300, .3, 'sine', .2, 500); break;
      case 'heal': this.tone(500, .4, 'sine', .2, 300); break; case 'boom': this.tone(70, .8, 'sawtooth', .35, -40); this.hiss(.6, .3, 300); break; case 'bell': this.tone(660, 1.5, 'sine', .3); this.tone(990, 1.2, 'sine', .15); break;
    }
  }
  ambient(region) { // filtered noise (wind/surf) + low drone, retuned per region
    this.region = region; const c = this.ctx; if (!c) return;
    if (!this.amb) {
      const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true; this.f = c.createBiquadFilter(); this.f.type = 'lowpass'; const g = c.createGain(); g.gain.value = .07; s.connect(this.f); this.f.connect(g); g.connect(this.master); s.start();
      const o = c.createOscillator(), dg = c.createGain(); dg.gain.value = .04; o.connect(dg); dg.connect(this.master); o.start(); this.amb = { o };
    }
    const P = { hollow: [500, 55], marsh: [900, 48], clock: [1500, 80], glass: [2500, 62], monastery: [700, 70], forest: [350, 44] }[region] || [600, 55]; this.f.frequency.value = P[0]; this.amb.o.frequency.value = P[1];
  }
}
