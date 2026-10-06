import { app } from './store.svelte';

const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// ── Haptics ─────────────────────────────────────────────────────────
type HapticKind = 'tap' | 'success' | 'error' | 'heavy';
let hapticsMod: typeof import('@tauri-apps/plugin-haptics') | null = null;
if (inTauri) import('@tauri-apps/plugin-haptics').then((m) => (hapticsMod = m)).catch(() => {});

export function haptic(kind: HapticKind) {
  if (!app.settings.haptics) return;
  try {
    if (hapticsMod) {
      if (kind === 'tap') hapticsMod.selectionFeedback();
      else if (kind === 'heavy') hapticsMod.impactFeedback('heavy');
      else hapticsMod.notificationFeedback(kind);
      return;
    }
    navigator.vibrate?.(kind === 'tap' ? 8 : kind === 'error' ? [30, 40, 30] : 18);
  } catch {
    /* haptics are best-effort */
  }
}

// ── Sound: tiny WebAudio synth, no asset files ──────────────────────
let ctx: AudioContext | null = null;
function audio() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const c = audio();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export function sound(kind: 'correct' | 'wrong' | 'tap' | 'complete' | 'combo') {
  if (!app.settings.sound) return;
  try {
    switch (kind) {
      case 'tap':
        tone(660, 0, 0.06, 'triangle', 0.06);
        break;
      case 'correct':
        tone(784, 0, 0.12, 'triangle');
        tone(1175, 0.09, 0.22, 'triangle');
        break;
      case 'wrong':
        tone(220, 0, 0.18, 'sawtooth', 0.08);
        tone(185, 0.12, 0.25, 'sawtooth', 0.08);
        break;
      case 'combo':
        [880, 1109, 1319].forEach((f, i) => tone(f, i * 0.06, 0.14, 'triangle', 0.12));
        break;
      case 'complete':
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.35, 'triangle', 0.14));
        break;
    }
  } catch {
    /* audio is best-effort */
  }
}

// ── Confetti on a full-screen canvas ────────────────────────────────
const COLORS = ['#58cc02', '#1cb0f6', '#ff9600', '#ce82ff', '#ffc800', '#ff4b4b'];

export function confetti(amount = 140) {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  document.body.appendChild(canvas);
  const c = canvas.getContext('2d')!;
  c.scale(dpr, dpr);
  const parts = Array.from({ length: amount }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 16 - 6,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  const start = performance.now();
  const frame = (now: number) => {
    const t = now - start;
    c.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.45;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      c.save();
      c.globalAlpha = Math.max(0, 1 - t / 3200);
      c.translate(p.x, p.y);
      c.rotate(p.r);
      c.fillStyle = p.color;
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      c.restore();
    }
    if (t < 3200) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
