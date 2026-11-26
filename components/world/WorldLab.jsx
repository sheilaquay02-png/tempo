"use client";
// Phase 2 prototype: Tempo Town + My Little Space, with PRETEND data only.
// Nothing here reads or writes real Tempo tasks, events, budget or settings.
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "./world-lab.css";
import TownMap from "./TownMap";
import Room25D, { DEFAULT_LAYOUT, MOVABLE, canPlace } from "./Room25D";
import { ROOM_THEMES, PANELS, SAMPLE_TASKS, SAMPLE_EVENTS, SAMPLE_BUDGET, SAMPLE_AFFIRMATION, SAMPLE_WEATHER } from "./worldData";

// three.js downloads only on this page, after the page itself has shown.
const World3D = dynamic(() => import("./World3D"), { ssr: false, loading: () => <div className="wl-fallback">Building Tempo Town…</div> });

const LAYOUT_KEY = "tempo-world-lab-layout";

function loadLayout() {
  try {
    const raw = window.localStorage.getItem(LAYOUT_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (!saved || typeof saved !== "object") return DEFAULT_LAYOUT;
    const out = { ...DEFAULT_LAYOUT };
    for (const id of Object.keys(MOVABLE)) {
      const p = saved[id];
      if (p && Number.isInteger(p.x) && Number.isInteger(p.y)) out[id] = { x: p.x, y: p.y };
    }
    return out;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function PanelBody({ kind, tasks, onToggle }) {
  if (kind === "tasks") {
    return (
      <ul className="wl-list">
        {tasks.map(t => (
          <li key={t.id}>
            <label><input type="checkbox" checked={t.done} onChange={() => onToggle(t.id)} /> <span className={t.done ? "done" : ""}>{t.title}</span></label>
            <span className={`wl-pri ${t.priority}`}>{t.priority}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (kind === "calendar") {
    return <ul className="wl-list">{SAMPLE_EVENTS.map(e => <li key={e.id}><b>{e.time}</b> {e.title} <span className="wl-muted">{e.length}</span></li>)}</ul>;
  }
  if (kind === "budget") {
    return (
      <div className="wl-budget">
        <div><span className="wl-muted">Spent today</span><b>{SAMPLE_BUDGET.currency}{SAMPLE_BUDGET.spentToday.toFixed(2)}</b></div>
        <div><span className="wl-muted">Left this month</span><b>{SAMPLE_BUDGET.currency}{SAMPLE_BUDGET.monthLeft}</b></div>
      </div>
    );
  }
  if (kind === "affirmation") return <p className="wl-affirm">“{SAMPLE_AFFIRMATION}”</p>;
  if (kind === "weather") return <p className="wl-weather"><span aria-hidden="true">{SAMPLE_WEATHER.icon}</span> {SAMPLE_WEATHER.label}, {SAMPLE_WEATHER.temp}°C</p>;
  return null;
}

export default function WorldLab() {
  const [view, setView] = useState("town"); // town | room
  const [lite, setLite] = useState(false); // light 2.5D version instead of 3D
  const [theme, setTheme] = useState("kawaii");
  const [night, setNight] = useState(false);
  const [panel, setPanel] = useState(null);
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [decorate, setDecorate] = useState(false);
  const [picked, setPicked] = useState(null);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [quickAdd, setQuickAdd] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setNight(h >= 19 || h < 7);
    setLayout(loadLayout());
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") { setPanel(null); setPicked(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onAction = action => {
    if (action.go) { setView(action.go === "room" ? "room" : "town"); setPanel(null); setDecorate(false); setPicked(null); return; }
    if (action.panel) setPanel(action.panel);
  };

  const place = (id, x, y) => {
    if (!canPlace(id, x, y, layout)) return;
    const next = { ...layout, [id]: { x, y } };
    setLayout(next);
    setPicked(null);
    try { window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    setPicked(null);
    try { window.localStorage.removeItem(LAYOUT_KEY); } catch { /* ignore */ }
  };

  const addTask = e => {
    e.preventDefault();
    const title = quickAdd.trim();
    if (!title) return;
    setTasks(ts => [...ts, { id: `q${Date.now()}`, title, done: false, priority: "medium" }]);
    setQuickAdd("");
    setPanel("tasks");
  };

  const toggleTask = id => setTasks(ts => ts.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  const left = tasks.filter(t => !t.done).length;
  const inRoom = view === "room";

  return (
    <div className={`wl-root${night ? " night" : ""}`}>
      <header className="wl-top">
        <div className="wl-brand">Tempo Town <span className="wl-badge">Test lab · pretend data</span></div>
        <nav className="wl-tabs" aria-label="World view">
          {[["town", "Town"], ["room", "My room"], ["cast", "Meet the cast"]].map(([id, label]) => (
            <button key={id} type="button" className={view === id ? "on" : ""} aria-pressed={view === id} onClick={() => { setView(id); setPanel(null); if (id !== "room") { setDecorate(false); setPicked(null); } }}>{label}</button>
          ))}
        </nav>
        <div className="wl-controls">
          {inRoom && (
            <select aria-label="Room theme" value={theme} onChange={e => setTheme(e.target.value)}>
              {Object.entries(ROOM_THEMES).map(([id, t]) => <option key={id} value={id}>{t.name}</option>)}
            </select>
          )}
          <button type="button" className="wl-btn" onClick={() => setNight(n => !n)} aria-pressed={night}>{night ? "🌙 Evening" : "☀️ Day"}</button>
          <button type="button" className="wl-btn" aria-pressed={lite} onClick={() => setLite(l => !l)}>{lite ? "Show 3D" : "Light version"}</button>
          {view === "room" && (
            <button type="button" className={`wl-btn${decorate ? " on" : ""}`} aria-pressed={decorate} onClick={() => { setDecorate(d => !d); setPicked(null); setPanel(null); }}>
              {decorate ? "Done decorating" : "Decorate"}
            </button>
          )}
        </div>
      </header>

      <main className="wl-stage">
        {!lite && (
          <World3D scene={view} theme={theme} night={night} layout={layout} onAction={onAction} onFallback={() => setLite(true)}
            decorate={decorate} selected={picked} onSelect={setPicked} onPlace={place} />
        )}
        {lite && view === "cast" && <div className="wl-fallback">The cast close-up is only in 3D.</div>}
        {lite && view === "town" && <TownMap night={night} onAction={onAction} />}
        {lite && view === "room" && (
          <Room25D theme={theme} night={night} layout={layout} onAction={onAction}
            decorate={decorate} selected={picked} onSelect={setPicked} onPlace={place} />
        )}

        {decorate && view === "room" && (
          <div className="wl-hint" role="status">
            {picked ? `Now tap a glowing floor tile to move the ${MOVABLE[picked].label.toLowerCase()}.` : "Tap a piece (rug, chair, bedside table or a plant) to pick it up."}
            <button type="button" className="wl-link" onClick={resetLayout}>Reset room</button>
          </div>
        )}

        {panel && (
          <section className="wl-panel" role="dialog" aria-label={PANELS[panel].title}>
            <header><h2>{PANELS[panel].title}</h2><button type="button" className="wl-x" aria-label="Close" onClick={() => setPanel(null)}>×</button></header>
            <PanelBody kind={panel} tasks={tasks} onToggle={toggleTask} />
            <p className="wl-muted wl-small">Pretend data for testing. Your real Tempo isn&apos;t touched.</p>
          </section>
        )}
      </main>

      <footer className="wl-dock" aria-label="Quick actions">
        <button type="button" onClick={() => setPanel("tasks")}><b>Today</b><span>{left} to do · {SAMPLE_EVENTS.length} events</span></button>
        <button type="button" onClick={() => setPanel("tasks")}>Tasks</button>
        <button type="button" onClick={() => setPanel("calendar")}>Calendar</button>
        <button type="button" onClick={() => setPanel("budget")}>Budget</button>
        <form onSubmit={addTask} className="wl-quick">
          <input aria-label="Quick add a pretend task" placeholder="Quick add…" value={quickAdd} onChange={e => setQuickAdd(e.target.value)} />
          <button type="submit">Add</button>
        </form>
        <Link href="/" className="wl-switch">Switch to Classic</Link>
      </footer>
    </div>
  );
}
