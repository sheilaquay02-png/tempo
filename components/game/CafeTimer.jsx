"use client";

// Café focus timer (pomodoro). Lives in the café scene: you work at your laptop while the dogs roam.
// Timing uses the clock (an end time), so it stays right even if the tab is in the background.
// Finishing a focus session earns blossoms through onReward; nothing else is saved.
import { useEffect, useRef, useState } from "react";

const LENGTHS = { focus: [15, 25, 45], break: [5, 10] };
const DEFAULT = { focus: 25, break: 5 };
// what you do at the laptop while focusing (rotates every ~12 s)
const FOCUS_ANIMS = ["typing", "typing", "work_drink_work", "thinking", "typing", "glance_around"];

const fmt = ms => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

// a soft two-note chime (no sound files needed); silently skipped if the browser blocks audio
function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    const ctx = new Ctx(), now = ctx.currentTime;
    [[880, 0], [1320, 0.18]].forEach(([freq, at]) => {
      const o = ctx.createOscillator(), gain = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.18, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.9);
      o.connect(gain).connect(ctx.destination); o.start(now + at); o.stop(now + at + 1);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch { /* no sound */ }
}

export function CafeTimer({ compact = false, rewardAmount = 0, onAnim, onCelebrate, onReward }) {
  const [mode, setMode] = useState("focus");
  const [lengths, setLengths] = useState(DEFAULT);
  const [endAt, setEndAt] = useState(null);       // running: when it ends
  const [left, setLeft] = useState(DEFAULT.focus * 60000); // paused / not started: time left
  const [now, setNow] = useState(() => Date.now());
  const [note, setNote] = useState("");
  const startedRef = useRef(null);
  // latest callbacks, kept in a ref so the timer's effects don't restart on every redraw
  const cb = useRef({});
  cb.current = { onAnim, onCelebrate, onReward };
  const running = endAt !== null;
  const remaining = running ? Math.max(0, endAt - now) : left;

  // tick while running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  // what you're doing at the laptop
  useEffect(() => {
    const anim = name => cb.current.onAnim?.(name);
    if (!running) { anim(mode === "break" ? "sip_drink" : "glance_around"); return; }
    if (mode === "break") { anim("sip_drink"); return; }
    let i = 0; anim(FOCUS_ANIMS[0]);
    const id = setInterval(() => { i = (i + 1) % FOCUS_ANIMS.length; anim(FOCUS_ANIMS[i]); }, 12000);
    return () => clearInterval(id);
  }, [running, mode]);

  // time shows in the browser tab while running
  useEffect(() => {
    if (!running || typeof document === "undefined") return;
    const prev = document.title;
    document.title = `${mode === "focus" ? "🍵 Focus" : "☕ Break"} ${fmt(remaining)} · Tempo`;
    return () => { document.title = prev; };
  }, [running, mode, remaining]);

  // finished
  useEffect(() => {
    if (!running || remaining > 0) return;
    setEndAt(null);
    chime();
    if (mode === "focus") {
      cb.current.onReward?.(`focus@${startedRef.current || new Date().toISOString()}`);
      cb.current.onCelebrate?.();
      cb.current.onAnim?.("happy");
      setNote(`Focus session done! +${rewardAmount} 🌸 Time for a little break.`);
      setMode("break"); setLeft(lengths.break * 60000);
    } else {
      setNote("Break's over. Ready for another round?");
      setMode("focus"); setLeft(lengths.focus * 60000);
    }
  }, [running, remaining, mode, lengths, rewardAmount]);

  const start = () => { setNote(""); if (mode === "focus" && left === lengths.focus * 60000) startedRef.current = new Date().toISOString(); setNow(Date.now()); setEndAt(Date.now() + left); };
  const pause = () => { setLeft(Math.max(0, endAt - Date.now())); setEndAt(null); };
  const reset = () => { setEndAt(null); setLeft(lengths[mode] * 60000); setNote(""); };
  const switchMode = m => { if (running) return; setMode(m); setLeft(lengths[m] * 60000); setNote(""); };
  const pickLength = mins => { if (running) return; setLengths(l => ({ ...l, [mode]: mins })); setLeft(mins * 60000); };

  return (
    <section className={`cafe-timer ${compact ? "compact" : ""}`} aria-label="Focus timer">
      <div className="cafe-modes" role="tablist" aria-label="Timer mode">
        {["focus", "break"].map(m => (
          <button key={m} role="tab" aria-selected={mode === m} disabled={running && mode !== m} onClick={() => switchMode(m)}>{m === "focus" ? "🍵 Focus" : "☕ Break"}</button>
        ))}
      </div>
      <div className="cafe-time" aria-live="off">{fmt(remaining)}</div>
      {!running && <div className="cafe-lengths">
        {LENGTHS[mode].map(mins => <button key={mins} aria-pressed={lengths[mode] === mins} onClick={() => pickLength(mins)}>{mins} min</button>)}
      </div>}
      <div className="cafe-actions">
        {running ? <button className="cafe-main" onClick={pause}>⏸ Pause</button> : <button className="cafe-main" onClick={start}>▶ {left < lengths[mode] * 60000 ? "Resume" : "Start"}</button>}
        <button onClick={reset} disabled={!running && left === lengths[mode] * 60000}>↺ Reset</button>
      </div>
      {note && <p className="cafe-note" role="status">{note}</p>}
      {!note && mode === "focus" && rewardAmount > 0 && !compact && <p className="cafe-hint">Finish a focus session to earn {rewardAmount} 🌸</p>}
    </section>
  );
}

export const CAFE_CSS = `
.cafe-timer{width:min(100%,420px);display:grid;justify-items:center;gap:8px;padding:14px 16px;border-radius:20px;background:var(--surface,#FFF8FB);
  border:3px solid #E9A9C1;box-shadow:0 6px 0 #D9467F22;color:var(--text,#3B2A40);}
.cafe-timer.compact{width:100%;padding:10px 12px;gap:6px;border-width:2px;}
.cafe-modes{display:flex;gap:6px;}
.cafe-modes button,.cafe-lengths button,.cafe-actions button{border:2px solid #F4D3DF;background:#fff;color:#B0436E;border-radius:999px;padding:6px 12px;min-height:36px;font:inherit;font-weight:800;cursor:pointer;}
.cafe-modes button[aria-selected="true"],.cafe-lengths button[aria-pressed="true"]{background:#FBE3EC;border-color:#E9A9C1;}
.cafe-modes button:disabled,.cafe-actions button:disabled{opacity:.45;cursor:default;}
.cafe-time{font-size:56px;font-weight:900;letter-spacing:.04em;line-height:1;color:#CB416B;font-variant-numeric:tabular-nums;}
.cafe-timer.compact .cafe-time{font-size:40px;}
.cafe-lengths,.cafe-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;}
.cafe-actions .cafe-main{background:#CB416B;border-color:#CB416B;color:#fff;min-width:120px;}
.cafe-note{margin:0;font-weight:800;text-align:center;color:#B0436E;}
.cafe-hint{margin:0;font-size:13px;color:#7A6A80;}
`;
