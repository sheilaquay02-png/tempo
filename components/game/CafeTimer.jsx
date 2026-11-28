"use client";

// Café focus timer (pomodoro). Lives in the café scene: you work at your laptop while the dogs roam.
// Timing uses the clock (an end time), so it stays right even if the tab is in the background.
// Finishing a focus session earns blossoms through onReward; nothing else is saved.
import { play } from "../../lib/game/sounds";
import { useEffect, useRef, useState } from "react";

// focus / break pairs to pick from (minutes); "Custom" lets you set your own
export const CAFE_PRESETS = [[15, 3], [25, 5], [50, 10]];
const DEFAULT = { focus: 25, break: 5 };
const clampMins = (v, max) => Math.max(1, Math.min(max, Math.round(Number(v) || 1)));
// what you do at the laptop (café short-legs pack: typing, thinking, sip_drink, dozing, happy); rotates every ~12 s
const FOCUS_ANIMS = ["typing", "typing", "thinking", "typing", "typing", "sip_drink"];
const BREAK_ANIMS = ["sip_drink", "dozing"];

const fmt = ms => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

// a soft two-note chime (lib/game/sounds.js; follows the game's 🔊 switch)
const chime = () => play("timer");

// saved: { focus, brk } in minutes (kept with your game so every device uses the same)
export function CafeTimer({ compact = false, rewardAmount = 0, onAnim, onCelebrate, onReward, saved = null, onSaveLengths }) {
  const start0 = saved ? { focus: saved.focus, break: saved.brk } : DEFAULT;
  const [mode, setMode] = useState("focus");
  const [lengths, setLengths] = useState(start0);
  const [custom, setCustom] = useState(false); // custom steppers open
  const [endAt, setEndAt] = useState(null);       // running: when it ends
  const [left, setLeft] = useState(start0.focus * 60000); // paused / not started: time left
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
    if (!running) { anim(mode === "break" ? "sip_drink" : "thinking"); return; }
    const list = mode === "break" ? BREAK_ANIMS : FOCUS_ANIMS;
    let i = 0; anim(list[0]);
    const id = setInterval(() => { i = (i + 1) % list.length; anim(list[i]); }, 12000);
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
      cb.current.onReward?.(`focus@${startedRef.current || new Date().toISOString()}~${lengths.focus}`); // ~minutes, for the Flow State badge
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
  // choose a focus/break pair (or custom minutes); resets the clock if it isn't running
  const setPair = (focus, brk) => {
    if (running) return;
    const next = { focus: clampMins(focus, 180), break: clampMins(brk, 60) };
    setLengths(next); setLeft(next[mode] * 60000); setNote("");
    onSaveLengths?.({ focus: next.focus, brk: next.break });
  };
  const isPreset = CAFE_PRESETS.some(([f, b]) => f === lengths.focus && b === lengths.break);

  return (
    <section className={`cafe-timer ${compact ? "compact" : ""}`} aria-label="Focus timer">
      <div className="cafe-modes" role="tablist" aria-label="Timer mode">
        {["focus", "break"].map(m => (
          <button key={m} role="tab" aria-selected={mode === m} disabled={running && mode !== m} onClick={() => switchMode(m)}>{m === "focus" ? "🍵 Focus" : "☕ Break"}</button>
        ))}
      </div>
      <div className="cafe-time" aria-live="off">{fmt(remaining)}</div>
      {!running && <div className="cafe-lengths" role="group" aria-label="Focus and break lengths">
        {CAFE_PRESETS.map(([f, b]) => <button key={f} aria-pressed={!custom && lengths.focus === f && lengths.break === b} onClick={() => { setCustom(false); setPair(f, b); }} aria-label={`${f} minutes focus, ${b} minutes break`}>{f} / {b}</button>)}
        <button aria-pressed={custom || !isPreset} onClick={() => setCustom(c => !c)}>Custom</button>
      </div>}
      {!running && (custom || !isPreset) && <div className="cafe-custom">
        {[["focus", "Focus", 180, 5], ["break", "Break", 60, 1]].map(([k, label, max, step]) => (
          <span key={k} className="cafe-stepper">
            <span>{label}</span>
            <button onClick={() => setPair(k === "focus" ? lengths.focus - step : lengths.focus, k === "break" ? lengths.break - step : lengths.break)} disabled={lengths[k] <= 1} aria-label={`${label} ${step} minute${step > 1 ? "s" : ""} shorter`}>−</button>
            <strong>{lengths[k]} min</strong>
            <button onClick={() => setPair(k === "focus" ? lengths.focus + step : lengths.focus, k === "break" ? lengths.break + step : lengths.break)} disabled={lengths[k] >= max} aria-label={`${label} ${step} minute${step > 1 ? "s" : ""} longer`}>+</button>
          </span>
        ))}
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
.cafe-custom{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}
.cafe-stepper{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:#7A6A80;font-weight:700;}
.cafe-stepper strong{min-width:56px;text-align:center;color:#3B2A40;}
.cafe-stepper button{width:34px;height:34px;border-radius:50%;border:2px solid #F4D3DF;background:#fff;color:#B0436E;font:inherit;font-weight:900;cursor:pointer;}
.cafe-stepper button:disabled{opacity:.4;cursor:default;}
.cafe-hint{margin:0;font-size:13px;color:#7A6A80;}
`;
