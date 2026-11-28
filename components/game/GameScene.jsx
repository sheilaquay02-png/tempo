"use client";

// Cozy Room and Tempo Town: optional pixel-art views of your day. They only READ your tasks and events and
// call the same actions the rest of the app uses (toggle a task, open a page). The only things they save are
// game things (blossoms, furniture, your room layout), through onGameChange into Tempo's normal save.
// Where you and the dogs walk lives only in memory and is forgotten when you leave.
import { useEffect, useRef, useState } from "react";
import { roomLayoutFor, storageCounts, newPiece, sceneObject, STORE_ITEMS, FURNITURE_BY_ID } from "../../lib/game/furniture";
import { buyItem, rewardForFocus, TASK_REWARD, FOCUS_REWARD } from "../../lib/game/economy";
import * as Core from "../../lib/tempo/core";
import { ROOM_LAYOUT } from "../../lib/game/roomLayout";
import { TOWN_LAYOUT } from "../../lib/game/townLayout";
import { CAFE_LAYOUT } from "../../lib/game/cafeLayout";
import { CafeTimer, CAFE_CSS } from "./CafeTimer";
import { GamePanel, PANEL_CSS } from "./GamePanels";

const SCENES = {
  room: { layout: ROOM_LAYOUT, label: "Your cozy room: you and your four dogs", hint: "Tap the floor to walk (or use the arrow keys / WASD). Tap the desk, window, bed or food bowls. Walk out the bottom middle to go to town." },
  cafe: { layout: CAFE_LAYOUT, label: "Tempo Café: you working at your laptop while the dogs wander around", hint: "Start a focus session and get comfy. The dogs will keep you company. ← Back to town takes you outside." },
  town: { layout: TOWN_LAYOUT, label: "Tempo Town: you and your four dogs in the town square", hint: "Tap the paving to walk (or use the arrow keys / WASD). Tap a building: Town Hall, Library, Bank, Café… Tap My House to go home." },
};

const { TODAY, taskBelongsToPeriod, getEventsOnDay, fmt } = Core;

export default function GameScene({ scene = "room", variant = "full", tasks = [], events = [], calendarEvents = [], game, onGameChange, onToggleTask, onAddTask, onOpenPage, onBack }) {
  const S = SCENES[scene] || SCENES.room;
  const canvasRef = useRef(null);
  const apiRef = useRef(null);
  const tapRef = useRef(() => {});
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [attempt, setAttempt] = useState(0);
  const [night, setNight] = useState(false);
  const [hint, setHint] = useState(S.hint);
  const [panel, setPanel] = useState(null); // "today" | "tasks" | "calendar" | "store" | "storage"
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [placedNow, setPlacedNow] = useState(null); // pieces in the room while editing (for storage counts)
  // the room as it was when the scene was built; Save updates it without rebuilding, Cancel rebuilds from it
  const roomRef = useRef(game?.room ?? null);

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
      .then(({ createScene }) => createScene(canvasRef.current, scene === "room" ? roomLayoutFor({ room: roomRef.current }) : S.layout, {
        reduceMotion, onTap: tap => tapRef.current(tap), onExit: action => tapRef.current({ action }),
        onSelect: o => setSelected(o ? o.id : null), onChange: () => setPlacedNow(apiRef.current?.exportPlaced?.() || null),
      }))
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
  }, [attempt, scene, S.layout]);

  // A task ticked off today (here or anywhere else while the room is open) → the dogs celebrate.
  const lastDone = useRef(doneCount);
  useEffect(() => {
    if (doneCount > lastDone.current) apiRef.current?.celebrate();
    lastDone.current = doneCount;
  }, [doneCount]);

  useEffect(() => { apiRef.current?.setNight(night); }, [night, status]);

  // Full screen: stop the page underneath from scrolling while the game is open.
  useEffect(() => {
    if (variant !== "full") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [variant]);

  // Tapping furniture opens the matching part of the app.
  tapRef.current = tap => {
    if (!tap) return;
    if (tap.action === "night") { setNight(n => (tap.name === "Bed" ? true : !n)); setHint(tap.name === "Bed" ? "Goodnight! Walk or press Day to get up." : "Lamp switched."); return; }
    if (tap.action === "dogs") { apiRef.current?.celebrate(); setHint("The dogs came running!"); return; }
    if (tap.action === "note") { setHint(tap.note || tap.name); return; }
    if (tap.action === "budget") { onOpenPage?.("budget", tap.budgetPage || "home"); return; }
    if (["today", "tasks", "calendar", "store"].includes(tap.action)) { setPanel(tap.action); return; } // stay in the game
    if (["room", "town", "cafe"].includes(tap.action)) onOpenPage?.(tap.action);
  };

  // ── Edit room ───────────────────────────────────────────────────────────
  const canEdit = scene === "room" && typeof onGameChange === "function";
  const startEdit = () => { setPanel(null); apiRef.current?.setEdit(true); setEditing(true); setPlacedNow(apiRef.current?.exportPlaced() || null); setHint("Drag a piece to move it · drag its pink corner to resize · 📦 puts it away"); };
  const saveEdit = () => {
    const placed = apiRef.current?.exportPlaced() || [];
    roomRef.current = placed;
    onGameChange(g => ({ ...g, room: placed }));
    apiRef.current?.setEdit(false); setEditing(false); setSelected(null); setPanel(null); setHint("Room saved 🌸");
  };
  const cancelEdit = () => { setEditing(false); setSelected(null); setPanel(null); setHint(S.hint); setAttempt(a => a + 1); };
  const putAway = () => { apiRef.current?.removeSelected(); setSelected(null); };
  const storage = storageCounts(game, placedNow || apiRef.current?.exportPlaced?.() || undefined);
  const storageTotal = Object.values(storage).reduce((a, b) => a + b, 0);
  const placeFromStorage = itemId => {
    const uids = (apiRef.current?.exportPlaced() || []).map(p => p.uid);
    const piece = newPiece(itemId, uids); if (!piece) return;
    apiRef.current?.addObject(sceneObject(piece));
    setPanel(null);
  };
  const buy = item => {
    const next = buyItem(game || {}, item);
    if (!next) { setHint(`You need ${item.price - (game?.blossoms || 0)} more 🌸 for the ${item.name}.`); return; }
    onGameChange(() => next);
    setHint(`The ${item.name} is in your storage. Use ✏️ Edit room at home to place it.`);
  };

  // ── Café focus timer ────────────────────────────────────────────────────
  const timer = compact => (
    <CafeTimer compact={compact} rewardAmount={onGameChange ? FOCUS_REWARD : 0}
      onAnim={name => apiRef.current?.setCafeAnim?.(name)}
      onCelebrate={() => apiRef.current?.celebrate()}
      onReward={key => onGameChange?.(g => rewardForFocus(g, key))} />
  );

  const ratio = S.layout.size[0] / S.layout.size[1];
  const full = variant === "full";
  const stage = (
    <div className="cozy-room-stage" style={{ "--cozy-ar": ratio }}>
      <canvas ref={canvasRef} className="cozy-room-canvas" style={{ aspectRatio: `${S.layout.size[0]} / ${S.layout.size[1]}` }} aria-label={S.label} />
      {status !== "ready" && (
        <div className="cozy-room-overlay" role="status">
          {status === "loading" ? (scene === "town" ? "Walking into town…" : scene === "cafe" ? "Finding you a table…" : "Setting up your room…") : (
            <>
              <span>The pictures couldn’t load. Check your connection.</span>
              <button className="tf-save" onClick={() => setAttempt(a => a + 1)}>Try again</button>
            </>
          )}
        </div>
      )}
      {panel && <GamePanel kind={panel} tasks={tasks} calendarEvents={calendarEvents} onToggleTask={onToggleTask} onAddTask={onAddTask}
        blossoms={game?.blossoms || 0} storeItems={STORE_ITEMS} owned={game?.owned || {}} onBuy={buy} storage={storage} furniture={FURNITURE_BY_ID} onPlace={placeFromStorage}
        onOpenPage={p => { setPanel(null); onOpenPage?.(p); }} onClose={() => setPanel(null)} />}
    </div>
  );

  // Compact: just the scene (Mini Tempo's room view).
  // Compact (Mini Tempo): just the scene. In the café there's no door to walk out of, so it gets its own way back to town.
  if (!full) return (
    <div className="cozy-scene cozy-compact"><style>{ROOM_CSS + PANEL_CSS + CAFE_CSS}</style>
      {scene === "cafe" && <button className="cozy-back cozy-compact-back" onClick={() => onOpenPage?.("town")} aria-label="Leave the café">← Back to town</button>}
      {stage}{scene === "cafe" && timer(true)}
    </div>
  );

  // Full screen: covers the whole app; Back (top left) or Escape returns to Today.
  return (
    <div className="cozy-scene cozy-full" role="dialog" aria-modal="true" aria-label={scene === "town" ? "Tempo Town" : scene === "cafe" ? "Tempo Café" : "My Room"}>
      <style>{ROOM_CSS + PANEL_CSS + CAFE_CSS}</style>
      <div className="cozy-full-inner" style={{ "--cozy-ar": ratio }}>
        <div className="cozy-topbar">
          <button className="cozy-back" onClick={editing ? cancelEdit : scene === "cafe" ? () => onOpenPage?.("town") : onBack} aria-label={editing ? "Cancel editing" : scene === "cafe" ? "Leave the café" : "Back to Tempo"}>{editing ? "✕ Cancel" : scene === "cafe" ? "← Back to town" : "← Back"}</button>
          <strong className="cozy-title">{scene === "town" ? "Tempo Town" : scene === "cafe" ? "Tempo Café" : "My Room"}</strong>
          {game && <span className="cozy-blossoms" title={`Blossoms: earn ${TASK_REWARD} for every task you finish`}>🌸 {game.blossoms || 0}</span>}
          {canEdit && !editing && <button className="cozy-room-btn" onClick={startEdit} disabled={status !== "ready"}>✏️ Edit room</button>}
          {!editing && <button className="cozy-room-btn" onClick={() => setNight(n => !n)} aria-pressed={night}>{night ? "🌙" : "☀️"}</button>}
        </div>
        {stage}
        {editing ? (
          <div className="cozy-edit-bar">
            <p className="cozy-room-hint" aria-live="polite">{hint}</p>
            <button className="cozy-room-btn" onClick={putAway} disabled={!selected}>📦 Put away</button>
            <button className="cozy-room-btn" onClick={() => setPanel("storage")}>🧺 Storage ({storageTotal})</button>
            <button className="cozy-room-btn cozy-save" onClick={saveEdit}>✓ Save</button>
          </div>
        ) : <p className="cozy-room-hint" aria-live="polite">{hint}</p>}
        {scene === "cafe" && timer(false)}
        <div className="cozy-room-cards">
          <section className="phase-card">
            <div className="phase-card-head"><span>Today’s tasks</span><button onClick={() => setPanel("tasks")}>Open tasks</button></div>
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
            <div className="phase-card-head"><span>Coming up</span><button onClick={() => setPanel("calendar")}>Open calendar</button></div>
            {nextEvents.length ? (
              <div className="today-event-list">
                {nextEvents.map(e => <div key={e.id} className="today-event-row"><time>{e.allDay ? "All day" : fmt(e.start)}</time><div><strong>{e.title}</strong></div></div>)}
              </div>
            ) : <p className="cozy-room-empty">No more events today.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}

// Styles live here so they load only with the game. Colours come from the app's theme variables.
const ROOM_CSS = `
/* same font as the rest of Tempo (Nunito via the app's --font setting), for every game screen, panel, button and input */
.cozy-scene,.cozy-scene button,.cozy-scene input,.cozy-scene h3,.cozy-scene p,.cozy-scene small,.cozy-scene strong,.cozy-scene time{font-family:var(--font,"Nunito",system-ui,-apple-system,sans-serif);}
.cozy-room-stage{position:relative;border-radius:18px;overflow:hidden;background:transparent;}
.cozy-room-canvas{display:block;width:100%;height:auto;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:manipulation;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.cozy-room-overlay{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:12px;color:var(--accent,#CB416B);font-weight:800;text-align:center;padding:16px;background:rgba(255,245,248,.55);}
.cozy-room-btn{border:1px solid rgba(var(--accent-rgb,203,65,107),.25);background:var(--surface,#fff);color:var(--accent,#CB416B);box-shadow:0 2px 10px rgba(var(--accent-rgb,203,65,107),.12);border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer;flex-shrink:0;min-height:40px;}
.cozy-room-btn[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff;}
/* full screen */
/* same soft pink background as the Today page (follows the theme, incl. dark mode) */
.cozy-full{position:fixed;inset:0;z-index:2000;overflow-y:auto;overscroll-behavior:contain;
  background:radial-gradient(circle at 14% 0%,rgba(var(--accent-rgb,203,65,107),.10),transparent 30%),linear-gradient(180deg,var(--bg,#FFF0F6),var(--bg3,#FFE5E8));color:var(--text,#3B2A40);
  padding:max(10px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));}
.cozy-full-inner{width:100%;max-width:1500px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:10px;justify-items:center;}
/* the scene fills the first screen: as wide as fits under the top bar, never taller than the window */
.cozy-full .cozy-room-stage{width:min(100%, calc((100dvh - 86px) * var(--cozy-ar)));}
.cozy-topbar{width:min(100%, calc((100dvh - 86px) * var(--cozy-ar)));display:flex;align-items:center;gap:10px;min-height:44px;}
.cozy-back{border:1px solid rgba(var(--accent-rgb,203,65,107),.25);background:var(--surface,#fff);color:var(--accent,#CB416B);border-radius:999px;padding:9px 16px;font:inherit;font-weight:800;cursor:pointer;min-height:42px;box-shadow:0 2px 10px rgba(var(--accent-rgb,203,65,107),.15);}
.cozy-title{flex:1;text-align:center;font-size:15px;letter-spacing:.02em;color:var(--text,#3B2A40);}
.cozy-blossoms{display:inline-flex;align-items:center;gap:4px;min-height:40px;padding:0 12px;border-radius:999px;background:var(--surface,#fff);border:1px solid rgba(var(--accent-rgb,203,65,107),.25);color:var(--accent,#CB416B);font-weight:900;white-space:nowrap;}
.cozy-edit-bar{width:min(100%, calc((100dvh - 86px) * var(--cozy-ar)));display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
.cozy-edit-bar .cozy-room-hint{flex:1 1 220px;}
.cozy-room-btn:disabled{opacity:.45;cursor:default;}
.cozy-save{background:var(--accent,#CB416B)!important;color:#fff!important;border-color:var(--accent,#CB416B)!important;}
@media (max-width:600px){.cozy-topbar{flex-wrap:wrap;}.cozy-title{order:-1;flex-basis:100%;}}
.cozy-full .cozy-room-hint{width:min(100%, calc((100dvh - 86px) * var(--cozy-ar)));margin:0;font-size:14px;color:var(--text2,#7A4654);}
.dark .cozy-full{background:var(--dark-page,var(--bg));}
.cozy-full .cozy-room-cards{width:100%;max-width:1100px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;color:var(--text,#3B2A40);}
.cozy-room-cards>*{min-width:0;}
.cozy-full .cozy-room-cards .phase-card{background:var(--surface,#FFFFFF);color:var(--text,#3B2A40);border-radius:18px;padding:14px 16px;}
.cozy-room-empty{margin:6px 0 0;opacity:.8;}
.cozy-room-more{display:block;margin-top:6px;opacity:.7;}
.cozy-room-loading{padding:40px;text-align:center;opacity:.7;}
@media (max-width:600px){.cozy-room-stage{border-radius:12px;}.cozy-title{font-size:14px;}.cozy-back{padding:8px 13px;}}
/* compact (Mini Tempo) */
.cozy-compact .cozy-room-stage{border-radius:14px;}
.cozy-compact-back{display:block;margin:0 0 8px;min-height:38px;padding:7px 14px;font-size:14px;}
`;
