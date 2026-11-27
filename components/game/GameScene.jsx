"use client";

// Cozy Room and Tempo Town: optional pixel-art views of your day. They only READ your tasks and events and
// call the same actions the rest of the app uses (toggle a task, open a page). They never save anything of
// their own: where you and the dogs walk lives only in memory and is forgotten when you leave.
import { useEffect, useRef, useState } from "react";
import * as Core from "../../lib/tempo/core";
import { ROOM_LAYOUT } from "../../lib/game/roomLayout";
import { TOWN_LAYOUT } from "../../lib/game/townLayout";

const SCENES = {
  room: { layout: ROOM_LAYOUT, label: "Your cozy room: you and your four dogs", hint: "Tap the floor to walk (or use the arrow keys / WASD). Tap the desk, window, bed or food bowls. Walk out the bottom middle to go to town." },
  town: { layout: TOWN_LAYOUT, label: "Tempo Town: you and your four dogs in the town square", hint: "Tap the paving to walk (or use the arrow keys / WASD). Tap a building: Town Hall, Library, Bank, Café… Tap My House to go home." },
};

const { TODAY, taskBelongsToPeriod, getEventsOnDay, fmt } = Core;

export default function GameScene({ scene = "room", tasks = [], events = [], onToggleTask, onOpenPage }) {
  const S = SCENES[scene] || SCENES.room;
  const canvasRef = useRef(null);
  const apiRef = useRef(null);
  const tapRef = useRef(() => {});
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [attempt, setAttempt] = useState(0);
  const [night, setNight] = useState(false);
  const [hint, setHint] = useState(S.hint);

  const todayTasks = tasks.filter(t => taskBelongsToPeriod(t, "day", TODAY));
  const openTasks = todayTasks.filter(t => !t.done);
  const doneCount = todayTasks.length - openTasks.length;
  const nextEvents = getEventsOnDay(events, TODAY)
    .filter(e => e.allDay || e.end > new Date())
    .sort((a, b) => a.start - b.start)
    .slice(0, 3);

  // Build the scene once per visit (and again on "Try again").
  useEffect(() => {
    let cancelled = false;
    const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setStatus("loading");
    import("../../lib/game/scene.js")
      .then(({ createScene }) => createScene(canvasRef.current, S.layout, { reduceMotion, onTap: tap => tapRef.current(tap), onExit: action => tapRef.current({ action }) }))
      .then(api => {
        if (cancelled) { api.destroy(); return; }
        apiRef.current = api;
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    const typing = () => {
      const el = document.activeElement;
      return el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
    };
    const onKeyDown = e => { if (!typing() && apiRef.current?.key(e, true)) e.preventDefault(); };
    const onKeyUp = e => { apiRef.current?.key(e, false); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, [attempt, S.layout]);

  // A task ticked off today (here or anywhere else while the room is open) → the dogs celebrate.
  const lastDone = useRef(doneCount);
  useEffect(() => {
    if (doneCount > lastDone.current) apiRef.current?.celebrate();
    lastDone.current = doneCount;
  }, [doneCount]);

  useEffect(() => { apiRef.current?.setNight(night); }, [night, status]);

  // Tapping furniture opens the matching part of the app.
  tapRef.current = tap => {
    if (!tap) return;
    if (tap.action === "night") { setNight(n => (tap.name === "Bed" ? true : !n)); setHint(tap.name === "Bed" ? "Goodnight! Walk or press Day to get up." : "Lamp switched."); return; }
    if (tap.action === "dogs") { apiRef.current?.celebrate(); setHint("The dogs came running!"); return; }
    if (tap.action === "note") { setHint(tap.note || tap.name); return; }
    if (tap.action === "budget") { onOpenPage?.("budget", tap.budgetPage || "home"); return; }
    if (["today", "tasks", "calendar", "room", "town"].includes(tap.action)) onOpenPage?.(tap.action);
  };

  return (
    <div className="phase-page cozy-room-page">
      <style>{ROOM_CSS}</style>
      <div className="cozy-room-stage">
        <canvas ref={canvasRef} className="cozy-room-canvas" style={{ aspectRatio: `${S.layout.size[0]} / ${S.layout.size[1]}` }} aria-label={S.label} />
        {status !== "ready" && (
          <div className="cozy-room-overlay" role="status">
            {status === "loading" ? (scene === "town" ? "Walking into town…" : "Setting up your room…") : (
              <>
                <span>The pictures couldn’t load. Check your connection.</span>
                <button className="tf-save" onClick={() => setAttempt(a => a + 1)}>Try again</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="cozy-room-bar">
        <p className="cozy-room-hint" aria-live="polite">{hint}</p>
        <button className="cozy-room-btn" onClick={() => setNight(n => !n)} aria-pressed={night}>{night ? "🌙 Night" : "☀️ Day"}</button>
      </div>

      <div className="cozy-room-cards">
        <section className="phase-card">
          <div className="phase-card-head"><span>Today’s tasks</span><button onClick={() => onOpenPage?.("tasks")}>Open tasks</button></div>
          {openTasks.length ? (
            <div className="today-task-list">
              {openTasks.slice(0, 6).map(t => (
                <div key={t.id} className="today-task-row">
                  <button className="today-task-check" onClick={() => onToggleTask?.(t.id)} aria-label={`Mark ${t.title} done`}>□</button>
                  <div><strong>{t.title}</strong></div>
                </div>
              ))}
              {openTasks.length > 6 && <small className="cozy-room-more">+{openTasks.length - 6} more in Tasks</small>}
            </div>
          ) : (
            <p className="cozy-room-empty">{doneCount ? `All ${doneCount} done today 🎉` : "Nothing due today 🌸"}</p>
          )}
        </section>
        <section className="phase-card">
          <div className="phase-card-head"><span>Coming up</span><button onClick={() => onOpenPage?.("calendar")}>Open calendar</button></div>
          {nextEvents.length ? (
            <div className="today-event-list">
              {nextEvents.map(e => <div key={e.id} className="today-event-row"><time>{e.allDay ? "All day" : fmt(e.start)}</time><div><strong>{e.title}</strong></div></div>)}
            </div>
          ) : <p className="cozy-room-empty">No more events today.</p>}
        </section>
      </div>
    </div>
  );
}

// Styles live here so they load only with the room. Colours come from the app's theme variables.
const ROOM_CSS = `
.cozy-room-page{display:grid;gap:14px;max-width:1100px;margin:0 auto;width:100%;}
.cozy-room-stage{position:relative;border-radius:18px;overflow:hidden;background:#2B2336;border:1px solid var(--border,rgba(0,0,0,.08));}
.cozy-room-canvas{display:block;width:100%;height:auto;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:manipulation;cursor:pointer;}
.cozy-room-overlay{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:12px;color:#F3EAF6;font-weight:700;text-align:center;padding:16px;background:rgba(43,35,54,.86);}
.cozy-room-bar{display:flex;align-items:center;gap:12px;}
.cozy-room-hint{flex:1;margin:0;color:var(--text2,var(--text));font-size:14px;opacity:.85;min-width:0;}
.cozy-room-btn{border:1px solid rgba(var(--accent-rgb),.25);background:var(--surface,#fff);color:var(--accent);border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer;flex-shrink:0;}
.cozy-room-btn[aria-pressed="true"]{background:var(--accent);color:#fff;}
.cozy-room-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;}
.cozy-room-cards>*{min-width:0;}
.cozy-room-empty{margin:6px 0 0;color:var(--text2,var(--text));opacity:.8;}
.cozy-room-more{display:block;margin-top:6px;opacity:.7;}
.cozy-room-loading{padding:40px;text-align:center;opacity:.7;}
`;
