"use client";

import { useEffect, useState } from "react";
import { miniTaskRows } from "../../utils/miniTempoDaily";

export function MiniTempoPanel({
  tasks = [], upcomingEvent,
  onToggleTask, onAddTask, onOpenTask, onOpenEvent, onFull,
}) {
  const [draft, setDraft] = useState("");
  const [online, setOnline] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [lastCompletedId, setLastCompletedId] = useState("");
  useEffect(() => {
    if(typeof navigator==="undefined")return;
    const update=()=>setOnline(navigator.onLine!==false);
    update();
    window.addEventListener("online",update);
    window.addEventListener("offline",update);
    return ()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};
  },[]);
  useEffect(() => {
    if(typeof window==="undefined" || !window.tempoDesktop?.getMiniState)return;
    window.tempoDesktop.getMiniState().then(state=>setPinned(Boolean(state?.alwaysOnTop))).catch(()=>{});
  },[]);
  const openFull = route => {
    if (typeof window !== "undefined" && window.tempoDesktop?.openFull) window.tempoDesktop.openFull(route || "/");
    else onFull?.(route);
  };
  const addTask = event => {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    onAddTask?.(name);
    setDraft("");
  };
  const togglePinned = async () => {
    if (!window.tempoDesktop?.setAlwaysOnTop) return;
    const value = await window.tempoDesktop.setAlwaysOnTop(!pinned);
    setPinned(Boolean(value));
  };
  const next = upcomingEvent;
  const visibleTasks = miniTaskRows(tasks,lastCompletedId);
  const markTask = task => {
    setLastCompletedId(task.done ? "" : task.id);
    onToggleTask?.(task.id);
  };
  return (
    <main className="mini-tempo" aria-label="Mini Tempo daily companion">
      <header className="mini-tempo-header">
        <div className="mini-tempo-drag">
          <strong>✿ mini tempo</strong>
          <small>Your daily companion</small>
        </div>
        <div className="mini-tempo-title-actions">
          {typeof window !== "undefined" && window.tempoDesktop && <>
            <button type="button" onClick={togglePinned} title={pinned ? "Unpin Mini" : "Always on top"} aria-label="Pin Mini">{pinned ? "📌" : "♧"}</button>
            <button type="button" onClick={() => window.tempoDesktop.minimizeMini?.()} aria-label="Minimise Mini">−</button>
            <button type="button" onClick={() => window.tempoDesktop.hideMini?.()} aria-label="Hide Mini">×</button>
          </>}
        </div>
      </header>
      <div className="mini-tempo-body">
        <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} ☀️</h1>
        <p className="mini-tempo-subtitle">A little progress every day.</p>
        {!online && <p className="mini-offline-banner" role="status">You are offline. Your tasks and calendar may be out of date until you reconnect.</p>}
        <section className="mini-section" aria-label="Today's tasks">
          <div className="mini-section-head"><strong>Today&apos;s tasks</strong><button onClick={() => openFull("/?page=tasks")}>View all</button></div>
          {visibleTasks.length ? visibleTasks.map(t => <div className="mini-task" key={t.id}>
            <input type="checkbox" checked={Boolean(t.done)} onChange={() => markTask(t)} aria-label={t.done ? `Undo ${t.title}` : `Complete ${t.title}`} />
            <button className={t.done ? "mini-task-done" : ""} onClick={() => onOpenTask?.(t)}>{t.title}</button>
            {t.done && <button type="button" className="mini-task-undo" onClick={() => markTask(t)} aria-label={`Undo completion of ${t.title}`}>Undo</button>}
          </div>) : <p className="mini-empty">All clear for now 🌸</p>}
          <form className="mini-task-add" onSubmit={addTask}><input aria-label="New task title" placeholder="+ Add a task" value={draft} onChange={e => setDraft(e.target.value)} /><button type="submit" disabled={!draft.trim()}>Add</button></form>
        </section>
        <section className="mini-section" aria-label="Next event">
          <div className="mini-section-head"><strong>🗓 Next event</strong></div>
          {next ? <button className="mini-event" onClick={() => onOpenEvent?.(next)}>
            <small>{new Date(next.start).toLocaleDateString([], {weekday:"short",month:"short",day:"numeric"})} · {new Date(next.start).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</small>
            <strong>{next.title}</strong>
            <span>Open event details</span>
          </button> : <p className="mini-empty">Nothing else scheduled soon.</p>}
        </section>
        <button className="mini-quick-toggle" onClick={() => setQuickOpen(x=>!x)} aria-expanded={quickOpen}>＋ Quick Add {quickOpen?"⌃":"⌄"}</button>
        {quickOpen && <div className="mini-quick-menu">
          <button onClick={() => {setQuickOpen(false);document.querySelector(".mini-task-add input")?.focus()}}>✓ Task</button>
          <button onClick={() => {setQuickOpen(false);openFull("/?create=event")}}>🗓 Event</button>
        </div>}
        <footer className="mini-footer">
          <button onClick={() => openFull("/")}>Open Full Tempo ↗</button>
        </footer>
      </div>
    </main>
  );
}
