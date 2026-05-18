"use client";

import { useEffect, useMemo, useState } from "react";
import DayView from "../components/Calendar/DayView";
import WeekView from "../components/Calendar/WeekView";
import MonthView from "../components/Calendar/MonthView";
import EventModal from "../components/Calendar/EventModal";
import TaskPanel from "../components/Tasks/TaskPanel";
import TasksPage from "../components/Tasks/TasksPage";
import JournalPage from "../components/Journal/JournalPage";
import {
  addDays,
  applySeriesChangeFromOccurrence,
  applySingleOccurrenceDelete,
  applySingleOccurrenceModification,
  asDate,
  createNextRecurringTask,
  dateKey,
  defaultExceptions,
  durationToMinutes,
  ensureEventModel,
  ensureTaskModel,
  expandRecurringEvents,
  getBaseEvent,
  monthRange,
  sameDay,
  sortEvents,
  startOfDay,
  stripOccurrenceMeta,
  uid,
  weekRange,
  splitSeriesFromOccurrence,
} from "../lib/recurrence";
import {
  chooseLatestState,
  defaultAppState,
  hydrateStateSafely,
  loadCloudState,
  loadLocalState,
  saveCloudState,
  saveLocalState,
  signInSupabase,
  signOutSupabase,
  signUpSupabase,
} from "../lib/storage";

function viewRange(view, date) {
  if (view === "day") return { start: startOfDay(date), end: addDays(startOfDay(date), 1) };
  if (view === "week") return weekRange(date);
  return monthRange(date);
}

function LoginModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const result = mode === "login" ? await signInSupabase(email, password) : await signUpSupabase(email, password, name);
      if (result.error) setError(result.error.message);
      else onSuccess(result.data?.user || result.data?.session?.user || null);
    } catch (err) { setError(err.message || "Unable to sign in"); }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card login-mini" onSubmit={submit} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{mode === "login" ? "Sign in" : "Create account"}</h2><button type="button" className="icon-btn" onClick={onClose}>✕</button></div>
        <div className="login-tabs"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div>
        {mode === "signup" && <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />}
        <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="error-text">{error}</p>}
        <button className="primary-btn" disabled={loading}>{loading ? "Loading..." : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
    </div>
  );
}

function ScopeModal({ action, onChoose, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card scope-card" onClick={e => e.stopPropagation()}>
        <h3>Recurring event {action}</h3>
        <p className="muted">Choose how this should apply.</p>
        <button className="scope-btn" onClick={() => onChoose("single")}>This event only</button>
        <button className="scope-btn" onClick={() => onChoose("following")}>This and following events</button>
        <button className="scope-btn danger" onClick={() => onChoose("series")}>Entire series</button>
        <button className="ghost-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function SettingsPanel({ state, updateState, onClose }) {
  const [draft, setDraft] = useState({ label: "", icon: "✨", color: "#FF7BAC" });
  const [templateName, setTemplateName] = useState("");

  function patchSettings(patch) { updateState(s => ({ ...s, settings: { ...s.settings, ...patch } })); }
  function addCategory() {
    if (!draft.label.trim()) return;
    const id = draft.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uid("cat");
    updateState(s => ({ ...s, categories: [...s.categories, { id, ...draft, label: draft.label.trim() }] }));
    setDraft({ label: "", icon: "✨", color: "#FF7BAC" });
  }
  function saveTodayAsTemplate() {
    if (!templateName.trim()) return;
    const today = startOfDay(new Date());
    const events = state.events.filter(e => sameDay(e.start, today)).map(e => ({ title: e.title, start: [asDate(e.start).getHours(), asDate(e.start).getMinutes()], end: [asDate(e.end).getHours(), asDate(e.end).getMinutes()], category: e.category, fixed: e.fixed, allDay: e.allDay }));
    updateState(s => ({ ...s, templates: [...s.templates, { id: uid("tpl"), label: templateName.trim(), events }] }));
    setTemplateName("");
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>Settings</h2><button className="icon-btn" onClick={onClose}>✕</button></div>
        <h3>Work hours</h3>
        <div className="form-grid two"><input className="input" type="number" min="0" max="23" value={state.settings.workStart} onChange={e => patchSettings({ workStart: Number(e.target.value) })} /><input className="input" type="number" min="1" max="24" value={state.settings.workEnd} onChange={e => patchSettings({ workEnd: Number(e.target.value) })} /></div>
        <label className="toggle-row"><input type="checkbox" checked={state.settings.notifs} onChange={e => patchSettings({ notifs: e.target.checked })} /> Notifications</label>
        <h3>Categories</h3>
        <div className="settings-list">{state.categories.map(cat => <div className="settings-row" key={cat.id}><input className="icon-input" value={cat.icon} onChange={e => updateState(s => ({ ...s, categories: s.categories.map(c => c.id === cat.id ? { ...c, icon: e.target.value } : c) }))} /><input className="input" value={cat.label} onChange={e => updateState(s => ({ ...s, categories: s.categories.map(c => c.id === cat.id ? { ...c, label: e.target.value } : c) }))} /><input type="color" value={cat.color} onChange={e => updateState(s => ({ ...s, categories: s.categories.map(c => c.id === cat.id ? { ...c, color: e.target.value } : c) }))} /><button className="mini-btn danger-text" onClick={() => updateState(s => ({ ...s, categories: s.categories.filter(c => c.id !== cat.id) }))}>Remove</button></div>)}</div>
        <div className="settings-row"><input className="icon-input" value={draft.icon} onChange={e => setDraft(d => ({ ...d, icon: e.target.value }))} /><input className="input" placeholder="New category" value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} /><input type="color" value={draft.color} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))} /><button className="primary-btn small" onClick={addCategory}>Add</button></div>
        <h3>Templates</h3>
        <div className="settings-list">{state.templates.map(t => <div className="settings-row" key={t.id}><input className="input" value={t.label} onChange={e => updateState(s => ({ ...s, templates: s.templates.map(x => x.id === t.id ? { ...x, label: e.target.value } : x) }))} /><button className="mini-btn danger-text" onClick={() => updateState(s => ({ ...s, templates: s.templates.filter(x => x.id !== t.id) }))}>Delete</button></div>)}</div>
        <div className="settings-row"><input className="input" placeholder="Save today as template" value={templateName} onChange={e => setTemplateName(e.target.value)} /><button className="primary-btn small" onClick={saveTodayAsTemplate}>Save</button></div>
      </div>
    </div>
  );
}

export default function Page() {
  const [state, setState] = useState(() => defaultAppState({ seeded: true }));
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("week");
  const [page, setPage] = useState("calendar");
  const [viewDate, setViewDate] = useState(new Date());
  const [eventModal, setEventModal] = useState(null);
  const [pendingScope, setPendingScope] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hydrateStateSafely().then(({ user: u, state: s }) => {
      if (cancelled) return;
      setUser(u);
      setState(s);
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveLocalState(state, user?.id || null);
    if (user?.id) saveCloudState(user.id, state);
  }, [state, hydrated, user?.id]);

  function updateState(updater) {
    setState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...next, seeded: false, version: 5, updatedAt: new Date().toISOString() };
    });
  }

  const range = viewRange(view, viewDate);
  const expandedEvents = useMemo(() => expandRecurringEvents(state.events, addDays(range.start, -30), addDays(range.end, 30)), [state.events, range.start, range.end]);
  const visibleEvents = expandedEvents.filter(e => !state.settings.hiddenCalendars?.includes(e.calendar) && asDate(e.start) < range.end && asDate(e.end) > range.start);

  async function saveEvent(event, scope = "series") {
    const ev = ensureEventModel(event);
    if (ev._isOccurrence) {
      const base = getBaseEvent(state.events, ev);
      if (!base) return;
      if (scope === "single") {
        updateState(s => ({ ...s, events: s.events.map(e => e.id === base.id ? applySingleOccurrenceModification(e, ev) : e) }));
      } else if (scope === "following") {
        const { oldBase, newBase } = splitSeriesFromOccurrence(base, ev);
        updateState(s => ({ ...s, events: [...s.events.filter(e => e.id !== base.id), oldBase, newBase] }));
      } else {
        updateState(s => ({ ...s, events: s.events.map(e => e.id === base.id ? applySeriesChangeFromOccurrence(e, ev) : e) }));
      }
      setEventModal(null);
      return;
    }
    updateState(s => {
      const exists = s.events.some(e => e.id === ev.id);
      return { ...s, events: sortEvents(exists ? s.events.map(e => e.id === ev.id ? ev : e) : [...s.events, ev]) };
    });
    setEventModal(null);
  }

  async function deleteEvent(event, scope = "series") {
    const ev = ensureEventModel(event);
    if (ev._isOccurrence) {
      const base = getBaseEvent(state.events, ev);
      if (!base) return;
      if (scope === "single") updateState(s => ({ ...s, events: s.events.map(e => e.id === base.id ? applySingleOccurrenceDelete(e, ev) : e) }));
      else if (scope === "following") {
        const { oldBase } = splitSeriesFromOccurrence(base, ev);
        updateState(s => ({ ...s, events: s.events.map(e => e.id === base.id ? oldBase : e) }));
      } else updateState(s => ({ ...s, events: s.events.filter(e => e.id !== base.id) }));
      setEventModal(null);
      return;
    }
    updateState(s => ({ ...s, events: s.events.filter(e => e.id !== ev.id) }));
    setEventModal(null);
  }

  function requestReschedule(event, newStart, newEnd) {
    const ev = ensureEventModel({ ...event, start: newStart, end: newEnd });
    if (event._isOccurrence || event.recurrence) setPendingScope({ action: "drag", event: ev });
    else saveEvent(ev, "series");
  }

  function addEventAt(date) {
    setEventModal({ event: null, defaultDate: date });
  }

  function addTask(task) {
    updateState(s => ({ ...s, tasks: [...s.tasks, ensureTaskModel(task)] }));
  }

  function updateTask(task) {
    updateState(s => ({ ...s, tasks: s.tasks.map(t => t.id === task.id ? ensureTaskModel(task) : t) }));
  }

  function deleteTask(id) {
    updateState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }));
  }

  function toggleTask(task) {
    const t = ensureTaskModel(task);
    updateState(s => {
      const nextDone = !t.done;
      const updated = { ...t, done: nextDone, completedAt: nextDone ? new Date().toISOString() : null };
      const existing = s.tasks.map(x => x.id === t.id ? updated : x);
      const nextRecurring = nextDone ? createNextRecurringTask(t) : null;
      return { ...s, tasks: nextRecurring ? [...existing, nextRecurring] : existing };
    });
  }

  function addJournalActivity(name) {
    updateState(s => s.journalActivities.includes(name) ? s : { ...s, journalActivities: [...s.journalActivities, name] });
  }

  function removeJournalActivity(name) {
    updateState(s => ({ ...s, journalActivities: s.journalActivities.filter(a => a !== name) }));
  }

  function saveJournalEntry(day, entry) {
    updateState(s => ({ ...s, journal: { ...s.journal, [day]: entry } }));
  }

  async function afterLogin(u) {
    const cloud = u?.id ? await loadCloudState(u.id) : null;
    const local = loadLocalState(u?.id || null);
    setUser(u);
    updateState(chooseLatestState(local, cloud));
    setLoginOpen(false);
  }

  async function signOut() {
    await signOutSupabase().catch(() => {});
    setUser(null);
    setState(defaultAppState({ seeded: true }));
  }

  const navItems = [
    ["calendar", "📅", "Calendar"],
    ["tasks", "✅", "Tasks"],
    ["journal", "📔", "Journal"],
  ];

  const main = page === "tasks" ? <TasksPage tasks={state.tasks} categories={state.categories} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} onToggle={toggleTask} /> : page === "journal" ? <JournalPage journal={state.journal} journalActivities={state.journalActivities} onSaveEntry={saveJournalEntry} onAddActivity={addJournalActivity} onRemoveActivity={removeJournalActivity} /> : (
    <>
      <div className="calendar-toolbar">
        <button className="ghost-btn" onClick={() => setViewDate(addDays(viewDate, view === "month" ? -30 : view === "week" ? -7 : -1))}>‹</button>
        <button className="ghost-btn" onClick={() => setViewDate(new Date())}>Today</button>
        <button className="ghost-btn" onClick={() => setViewDate(addDays(viewDate, view === "month" ? 30 : view === "week" ? 7 : 1))}>›</button>
        <h2>{viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
        <div className="view-tabs"><button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>Day</button><button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Week</button><button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button></div>
        <button className="primary-btn" onClick={() => addEventAt(new Date())}>+ Event</button>
      </div>
      {view === "day" && <DayView date={viewDate} events={visibleEvents} categories={state.categories} onEventClick={event => setEventModal({ event })} onGridClick={addEventAt} onReschedule={requestReschedule} />}
      {view === "week" && <WeekView date={viewDate} events={visibleEvents} categories={state.categories} onEventClick={event => setEventModal({ event })} onGridClick={addEventAt} onReschedule={requestReschedule} onDayClick={d => { setView("day"); setViewDate(d); }} />}
      {view === "month" && <MonthView date={viewDate} events={visibleEvents} categories={state.categories} onEventClick={event => setEventModal({ event })} onDayClick={d => { setView("day"); setViewDate(d); }} onReschedule={requestReschedule} />}
    </>
  );

  return (
    <div className="tempo-app">
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand"><div className="brand-mark">🌸</div><div><strong>Tempo</strong><span>{hydrated ? "Ready" : "Loading..."}</span></div></div>
        <nav>{navItems.map(([id, icon, label]) => <button key={id} className={page === id ? "active" : ""} onClick={() => { setPage(id); setMobileOpen(false); }}>{icon}<span>{label}</span></button>)}</nav>
        <button className="side-action" onClick={() => setSettingsOpen(true)}>⚙️ Settings</button>
        {user ? <button className="side-action" onClick={signOut}>Sign out</button> : <button className="side-action" onClick={() => setLoginOpen(true)}>Sign in</button>}
      </aside>
      {mobileOpen && <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      <main className="main">
        <header className="topbar"><button className="icon-btn hamburger" onClick={() => setMobileOpen(v => !v)}>☰</button><h1>{page === "calendar" ? "Calendar" : page === "tasks" ? "Tasks" : "Journal"}</h1><div className="topbar-actions"><button className="ghost-btn" onClick={() => setSettingsOpen(true)}>Settings</button></div></header>
        <section className="content-layout"><div className="content-main">{main}</div>{page === "calendar" && <TaskPanel tasks={state.tasks} categories={state.categories} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} onToggle={toggleTask} />}</section>
      </main>
      <nav className="mobile-nav"><button onClick={() => setMobileOpen(true)}>☰<span>Menu</span></button><button onClick={() => { setPage("calendar"); setView("day"); }}>☀️<span>Day</span></button><button onClick={() => { setPage("calendar"); setView("week"); }}>🗓️<span>Week</span></button><button onClick={() => setPage("tasks")}>✅<span>Tasks</span></button><button onClick={() => setSettingsOpen(true)}>⚙️<span>More</span></button></nav>

      {eventModal && <EventModal event={eventModal.event} defaultDate={eventModal.defaultDate} calendars={state.calendars} categories={state.categories} onClose={() => setEventModal(null)} onSave={saveEvent} onDelete={deleteEvent} />}
      {pendingScope && <ScopeModal action={pendingScope.action} onCancel={() => setPendingScope(null)} onChoose={scope => { saveEvent(pendingScope.event, scope); setPendingScope(null); }} />}
      {settingsOpen && <SettingsPanel state={state} updateState={updateState} onClose={() => setSettingsOpen(false)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onSuccess={afterLogin} />}
      <style jsx global>{css}</style>
    </div>
  );
}

const css = `
*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;overflow-x:hidden;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff5f8;color:#3d1a2c}.tempo-app{height:100dvh;width:100vw;display:flex;overflow:hidden}.sidebar{width:250px;flex:0 0 250px;background:#fff;border-right:1px solid #ffd6e4;padding:18px;display:flex;flex-direction:column;gap:14px;z-index:50}.brand{display:flex;gap:10px;align-items:center}.brand-mark{width:42px;height:42px;border-radius:16px;background:#ffe4ec;display:grid;place-items:center}.brand span{display:block;color:#a07090;font-size:12px}nav{display:grid;gap:8px}nav button,.side-action{border:0;background:transparent;text-align:left;padding:11px 12px;border-radius:14px;cursor:pointer;color:#7a4060;font-weight:700;display:flex;gap:10px;align-items:center}nav button.active,nav button:hover,.side-action:hover{background:#fff0f4;color:#ff4f94}.main{flex:1;min-width:0;display:flex;flex-direction:column;height:100dvh}.topbar{height:58px;display:flex;align-items:center;gap:12px;padding:10px 16px;background:#fff;border-bottom:1px solid #ffd6e4;flex:0 0 auto}.topbar h1{font-size:18px;margin:0;flex:1}.hamburger{display:none}.topbar-actions{display:flex;gap:8px}.content-layout{display:flex;min-height:0;flex:1;overflow:hidden}.content-main{flex:1;min-width:0;overflow:auto;padding:16px}.task-panel{width:340px;flex:0 0 340px;background:#fff;border-left:1px solid #ffd6e4;padding:16px;overflow:auto}.panel-header,.modal-header,.calendar-toolbar{display:flex;align-items:center;gap:10px}.panel-header h2,.calendar-toolbar h2{margin:0;flex:1}.calendar-toolbar{margin-bottom:12px;flex-wrap:wrap}.view-tabs{display:flex;background:#fff;border:1px solid #ffd6e4;border-radius:14px;padding:4px}.view-tabs button,.filter-pills button,.login-tabs button{border:0;background:transparent;padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:800;color:#7a4060}.view-tabs button.active,.filter-pills button.active,.login-tabs button.active{background:#ff7bac;color:white}.primary-btn,.ghost-btn,.danger-btn,.mini-btn,.icon-btn{border:0;border-radius:12px;padding:9px 12px;font-weight:800;cursor:pointer}.primary-btn{background:#ff7bac;color:white}.primary-btn.small{padding:7px 10px}.ghost-btn,.mini-btn,.icon-btn{background:#fff0f4;color:#7a4060}.danger-btn{background:#ff6b8a;color:white}.danger-text{color:#e64066!important}.input{width:100%;border:1px solid #ffd6e4;border-radius:12px;padding:10px 12px;background:white;color:#3d1a2c}.textarea{min-height:80px;resize:vertical}.tall{min-height:150px}.field-label{display:block;font-size:12px;font-weight:900;color:#7a4060;margin:10px 0 5px}.form-grid{display:grid;gap:10px}.form-grid.two{grid-template-columns:1fr 1fr}.toggle-row,.radio-row{display:flex;align-items:center;gap:8px;margin:10px 0}.modal-overlay{position:fixed;inset:0;background:rgba(42,12,35,.28);backdrop-filter:blur(4px);z-index:200;display:grid;place-items:center;padding:16px}.modal-card{width:min(680px,calc(100vw - 32px));max-height:88dvh;overflow:auto;background:white;border:1px solid #ffd6e4;border-radius:24px;padding:18px;box-shadow:0 20px 70px rgba(74,40,64,.24)}.event-modal,.settings-modal{width:min(780px,calc(100vw - 32px))}.modal-header h2{margin:0;flex:1}.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}.muted{color:#a07090}.status-line{background:#fff0f4;padding:10px;border-radius:12px}.scope-card{max-width:420px}.scope-btn{width:100%;border:1px solid #ffd6e4;background:#fff5f8;border-radius:14px;margin:6px 0;padding:12px;font-weight:900;text-align:left}.scope-btn.danger{border-color:#ff6b8a;color:#e64066}.repeat-row{display:flex;gap:10px;align-items:center}.small-number{max-width:90px}.inline-date{max-width:170px}.repeat-section{margin:16px 0}.weekday-pills,.activity-grid,.filter-pills{display:flex;gap:8px;flex-wrap:wrap}.weekday-pill,.activity-grid button,.filter-pills button{border:1px solid #ffd6e4;background:#fff;border-radius:999px;padding:8px 11px;cursor:pointer}.weekday-pill.active,.activity-grid button.active{background:#ff7bac;color:white;border-color:#ff7bac}.summary-box,.repeat-card{border:1px solid #ffd6e4;background:#fff5f8;border-radius:16px;padding:12px}.repeat-card{display:flex;justify-content:space-between;align-items:center;text-align:left;width:100%;margin:10px 0}.repeat-card p{margin:4px 0 0;color:#7a4060}.repeat-card.compact span{color:#7a4060}.calendar-view{background:#fff;border:1px solid #ffd6e4;border-radius:22px;overflow:auto}.all-day-row{display:flex;gap:10px;align-items:flex-start;border-bottom:1px solid #ffd6e4;padding:8px}.all-day-label{width:58px;color:#a07090;font-size:12px}.all-day-items{display:flex;gap:6px;flex-wrap:wrap}.all-day-pill,.week-all-day-pill{border:0;border-radius:999px;background:#fff0f4;color:#7a4060;padding:5px 9px}.time-grid{position:relative;margin-left:58px}.hour-row{position:absolute;left:-58px;right:0;height:1px;border-top:1px solid #f5d8e4}.hour-row span{position:absolute;left:0;top:-9px;font-size:11px;color:#a07090}.event-block,.week-event{position:absolute;border-left:4px solid;border-radius:12px;padding:6px 8px;overflow:hidden;cursor:pointer;font-size:12px;display:flex;flex-direction:column}.event-block strong,.week-event strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.event-block span,.week-event span{color:#7a4060}.event-block em,.week-event em{position:absolute;right:5px;bottom:2px;font-style:normal}.week-header{display:grid;grid-template-columns:46px repeat(7,1fr);background:#fff;border:1px solid #ffd6e4;border-radius:18px 18px 0 0;overflow:hidden}.week-day-head{border:0;background:#fff;padding:8px;display:grid;gap:2px;color:#7a4060}.week-grid{position:relative;background:#fff;border:1px solid #ffd6e4;border-top:0;border-radius:0 0 18px 18px;overflow:hidden}.week-time-col span{position:absolute;left:4px;font-size:10px;color:#a07090;transform:translateY(-8px)}.week-day-col{position:absolute;top:0;bottom:0;border-left:1px solid #fff0f4}.week-hour-line{position:absolute;left:46px;right:0;border-top:1px solid #f5d8e4;height:1px}.week-all-day-stack{position:absolute;left:2px;right:2px;top:2px;z-index:2;display:grid;gap:2px}.week-event{z-index:3}.month-weekdays,.month-grid{display:grid;grid-template-columns:repeat(7,1fr)}.month-weekdays span{text-align:center;padding:8px;color:#7a4060;font-weight:900}.month-day{min-height:132px;border:1px solid #ffd6e4;background:#fff;padding:6px;overflow:hidden}.month-day.muted-day{background:#fffafd;color:#b07090}.month-day-number{font-weight:900;margin-bottom:4px}.month-events{display:grid;gap:3px}.month-event-row{border:0;border-left:3px solid;border-radius:8px;text-align:left;padding:4px 6px;font-size:11px;color:#3d1a2c;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.more-events{border:0;background:transparent;color:#7a4060;font-size:11px;text-align:left}.task-list{display:grid;gap:8px}.task-row{display:flex;gap:9px;align-items:flex-start;background:#fff5f8;border:1px solid #ffd6e4;border-radius:16px;padding:10px}.task-row.done{opacity:.58}.task-main{flex:1;min-width:0}.task-main strong{display:block}.task-main span,.task-main small{display:block;color:#7a4060;font-size:12px}.task-form{display:grid;gap:8px;background:#fffafd;border:1px solid #ffd6e4;border-radius:18px;padding:10px;margin-bottom:12px}.tasks-page,.journal-page{background:#fff;border:1px solid #ffd6e4;border-radius:22px;padding:18px;max-width:980px}.page-title h1{margin:0}.page-title p{color:#7a4060}.journal-date{max-width:220px}.settings-list{display:grid;gap:6px;margin:8px 0}.settings-row{display:flex;gap:8px;align-items:center}.settings-row span{flex:1}.icon-input{width:48px;border:1px solid #ffd6e4;border-radius:12px;padding:10px;text-align:center}.small-list{max-height:180px;overflow:auto}.mobile-nav{display:none}.mobile-backdrop{display:none}.error-text{color:#e64066;font-weight:800}.login-mini{max-width:420px}.login-tabs{display:flex;gap:6px;background:#fff5f8;border-radius:14px;padding:4px;margin-bottom:10px}.login-tabs button{flex:1}
@media(max-width:900px){.tempo-app{height:100dvh;overflow:hidden}.sidebar{position:fixed;top:0;bottom:0;left:0;width:84vw;max-width:320px;transform:translateX(-105%);transition:transform .22s ease;box-shadow:10px 0 40px rgba(74,40,64,.18)}.sidebar.mobile-open{transform:translateX(0)}.mobile-backdrop{display:block;position:fixed;inset:0;background:rgba(42,12,35,.25);z-index:40}.hamburger{display:inline-flex}.topbar-actions{display:none}.main{width:100vw;max-width:100vw}.content-layout{display:block;overflow:auto;padding-bottom:72px}.content-main{width:100%;padding:10px}.task-panel{display:none}.calendar-toolbar{gap:6px}.calendar-toolbar h2{font-size:16px;min-width:100%}.view-tabs{order:2;width:100%}.view-tabs button{flex:1}.calendar-view,.week-grid,.month-view{width:100%;max-width:100%;overflow:auto}.month-day{min-height:96px;padding:4px}.week-header{min-width:0}.week-day-head{font-size:12px;padding:6px 2px}.modal-card{width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important;max-height:88dvh;border-radius:20px;padding:14px}.form-grid.two{grid-template-columns:1fr}.mobile-nav{position:fixed;left:0;right:0;bottom:0;height:62px;background:#fff;border-top:1px solid #ffd6e4;display:grid;grid-template-columns:repeat(5,1fr);z-index:120}.mobile-nav button{border:0;background:#fff;color:#7a4060;font-size:18px;display:grid;place-items:center;padding:5px 0}.mobile-nav span{font-size:10px;font-weight:800}.settings-row{flex-wrap:wrap}.settings-row .input{min-width:160px;flex:1}.task-panel{width:100%;flex:unset}.topbar{padding:8px 10px}.topbar h1{font-size:16px}.repeat-row{flex-wrap:wrap}.all-day-label{width:46px}.time-grid{margin-left:46px}.hour-row{left:-46px}.week-grid{font-size:11px}.week-time-col span{font-size:9px}.week-day-col{min-width:0}.week-event{font-size:10px;padding:4px}.activity-grid button,.filter-pills button,.weekday-pill{padding:7px 9px}}
`;
