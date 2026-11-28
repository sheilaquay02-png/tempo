// Soft game sounds, made on the fly with the browser's Web Audio (no sound files to download).
// Everything is quiet on purpose. Sound can be switched off with the 🔊 button; that choice is
// remembered on this device only. Browsers only allow sound after you've tapped or pressed a key,
// and anything that can't play is silently skipped.

const KEY = "tempo-game-sound-v1";
let ctx = null;
let muted = null;

export function soundOn() {
  if (muted === null) { try { muted = localStorage.getItem(KEY) === "off"; } catch { muted = false; } }
  return !muted;
}
export function setSoundOn(on) {
  muted = !on;
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode: just this visit */ }
}

function audio() {
  if (typeof window === "undefined" || !soundOn()) return null;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return null;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx.state === "closed" ? null : ctx;
  } catch { return null; }
}

// one soft note: frequency, start offset, length, loudness, wave shape, optional slide to another pitch
function note(c, freq, at, len, vol, type = "sine", slideTo) {
  const t = c.currentTime + at, o = c.createOscillator(), gain = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + len);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, len / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(gain).connect(c.destination); o.start(t); o.stop(t + len + 0.05);
}

// a puff of filtered noise (footsteps, whoosh)
function puff(c, at, len, vol, freq, q = 1) {
  const t = c.currentTime + at, n = Math.ceil(c.sampleRate * len);
  const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(), f = c.createBiquadFilter(), gain = c.createGain();
  src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
  gain.gain.setValueAtTime(vol, t);
  src.connect(f).connect(gain).connect(c.destination); src.start(t);
}

const SOUNDS = {
  // task done / celebration: a little rising chime
  chime: c => { note(c, 880, 0, 0.7, 0.10); note(c, 1175, 0.12, 0.7, 0.08); note(c, 1568, 0.24, 0.9, 0.07); },
  // the café timer finishing (the chime it always had)
  timer: c => { note(c, 880, 0, 0.9, 0.16); note(c, 1320, 0.18, 0.9, 0.14); },
  // the dogs' happy little "boof"
  woof: c => { note(c, 420, 0, 0.11, 0.07, "triangle", 260); note(c, 460, 0.16, 0.12, 0.06, "triangle", 280); },
  // a soft footstep
  step: c => puff(c, 0, 0.05, 0.05, 900, 1.2),
  // buying something: a sparkle
  buy: c => { [1319, 1568, 2093, 2637].forEach((f, i) => note(c, f, i * 0.06, 0.35, 0.05, "triangle")); },
  // opening a menu: a tiny pop
  pop: c => note(c, 620, 0, 0.09, 0.06, "sine", 900),
  // going through a door / to another place: a soft whoosh
  door: c => puff(c, 0, 0.35, 0.08, 700, 0.6),
  // a streak day: a happy three-note run
  streak: c => { [659, 784, 988, 1319].forEach((f, i) => note(c, f, i * 0.09, 0.45, 0.07)); },
};

export function play(name) {
  const c = audio(), s = SOUNDS[name];
  if (!c || !s) return;
  try { s(c); } catch { /* skip */ }
}
export const SOUND_NAMES = Object.keys(SOUNDS);
