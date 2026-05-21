import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as Core from "../../lib/tempo/core";
const { makeRecurringTaskOccurrence, taskOccurrenceFallsInPeriod, ensureRecurringTasksForPeriod, stepRecurringDate, weeksBetween, shouldEmitOccurrence, applyOccurrenceExceptions, deleteSingleOccurrence, modifySingleOccurrence, createFollowingSeries, createNextRecurringTask, expandRecurring, parseTimeStr, parseTimeRange, parseDur, parseDateRef, parseDateMention, parseDayWindow, fitFreeSlot, eventFromWindow, cleanTitle, inferCategory, buildGreeting, processMessage, usePomodoro, deriveMemoryCryptoKey, encryptMemoryJournalForStorage, decryptMemoryJournalFromStorage, saveJournalLocal, loadJournalLocal, readFileAsDataUrl, prepareJournalPhotosFromFiles, DAY_START, POMODORO_WORK_SECS, POMODORO_BREAK_SECS, RECURRENCE_WINDOW_DAYS, RECURRENCE_SAFETY_LIMIT, UNDO_STACK_MAX, CLOUD_FALLBACK_MS, CHAT_REPLY_DELAY_MS, EVENT_DRAG_HOLD_MS, EVENT_DRAG_MOVE_CANCEL_PX, CALENDARS, CATEGORIES, PRIORITIES, normalizeCategories, FONT_SIZES, THEMES, DAY_TEMPLATES, TODAY, DEFAULT_TIMEZONE, setDisplayTimezoneCtx, formatWithDisplayTimezone, fmt, fmtDate, sameDay, fmtDay, minsToTime, dateKey, cloneDate, addDaysSafe, addMonthsSafe, dayStart, getEventsOnDay, weekStart, weekDays, monthDays, getFreeBlocks, totalMins, hasConflict, endOfDay, eventOccursOnDay, isAllDayEvent, isMultiDayEvent, isAllDayOrMulti, eventSegmentForDay, toDateInput, toTimeInputValue, applyDateAndTime, taskDurationToMinutes, splitTaskDuration, formatTaskDuration, localDateFromKey, localDateFromMonthKey, monthKey, taskScopeOf, taskAnchorDate, taskDayKey, taskWeekKey, taskMonthKey, taskPeriodPatchForScope, withTaskPeriod, normalizeTasks, taskBelongsToPeriod, shiftTaskPeriodDate, formatTaskPeriodLabel, taskCompletionTargetKey, taskHasCompletionStamp, taskCompletedDateKey, taskSeriesId, taskPeriodIdentity, taskSkippedPeriods, taskSamePeriod, taskExistsForPeriod, completedTasksForDateKey, LEVEL_TITLES, XP_PER_LEVEL, taskXPValue, dateRangeKeys, hasJournalEntryForKey, focusMinsForKey, allDayTasksForKey, dailyGameSummary, productiveKeysFromData, focusKeysFromData, plannedTomorrowKeysFromData, countBackwardStreak, buildDailyQuests, buildWeeklyRecap, buildWeeklyMissions, buildCombos, buildBossBattles, buildPersonalLeaderboard, buildProductivityPersonality, buildBadges, skillRank, buildSkillStats, MASCOT_STAGES, buildMascotProgression, THEME_UNLOCK_RULES, buildThemeUnlocksForStats, buildMonthlyLifeGarden, calculateGameStats, createCategoryId, isRecurringEvent, uid, setWorkHoursCtx, freeBlocks, SER, DES, save, load, reviveEvents, normalizeRecurrence, recurrenceDateKey, recurrenceEndDate, recurrenceSkippedDates, occurrenceId, getBaseEventId, isOccurrence, stripOccurrenceMeta, _t, INIT_EVENTS, _deadline, INIT_TASKS, hasStoredUserData, loadStoredEventsOrSeed, loadStoredTasksOrSeed, JOURNAL_MOODS, JOURNAL_ACTIVITIES, JOURNAL_PROMPTS, MEMORY_TAGS, SCRAPBOOK_STICKERS, MEMORY_ASSET_BASE, MEMORY_BACKGROUNDS, COZY_STICKER_PACK, memoryBackgroundById, memoryBackgroundStyle, normalizeMemoryEntry, sanitizeMemoryPhotoForStorage, sanitizeMemoryEntryForStorage, sanitizeMemoryJournalForStorage, normalizeMemoryJournalForState, isEncryptedMemoryJournal, memoryPhotoSrc, memoryEntryCover, memoryTagLabel, _displayTimezone, _workStart } = Core;


function TaskReminderFields({ value, onChange, compact = false }) {
  const reminder = Core.normalizeTaskReminder(value);
  const presetId = Core.taskReminderPresetId(reminder);
  const setPreset = id => {
    const preset = Core.TASK_REMINDER_PRESETS.find(p => p.id === id);
    onChange(Core.normalizeTaskReminder(id === "custom" ? { type: "custom", time: reminder.time || preset?.time || "09:00" } : { type: id, time: preset?.time || "" }));
  };
  return (
    <>
      <select className={compact ? "tf-select" : "modal-select"} value={presetId} onChange={e => setPreset(e.target.value)}>
        {Core.TASK_REMINDER_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      {presetId === "custom" && <input type="time" className={compact ? "tf-select" : "modal-select modal-time"} value={reminder.time || "09:00"} onChange={e => onChange({ type: "custom", time: e.target.value })} />}
    </>
  );
}

function TaskRecurrenceSelect({ value, onChange, anchorDate = TODAY, compact = false }) {
  const preset = Core.recurrencePresetId(value);
  return (
    <select className={compact ? "tf-select" : "modal-select"} value={preset} onChange={e => onChange(Core.buildTaskRecurrencePreset(e.target.value, anchorDate))}>
      <option value="">No repeat</option>
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="weekdays">Every weekday</option>
      <option value="weekly-mwf">Every Mon/Wed/Fri</option>
      <option value="weekly-2">Every 2 weeks</option>
      <option value="monthly">Every month</option>
      <option value="monthly-15">Every month on the 15th</option>
    </select>
  );
}

// ─── Task Item ────────────────────────────────────────────────────────────────
export function TaskItem({ task, onToggle, onStartPomodoro, categories, onEdit, onScheduleTask }) {
  const [expanded, setExpanded] = useState(false);
  const cat = categories.find(c => c.id === task.category);
  const pri = PRIORITIES.find(p => p.id === task.priority);
  const color = cat?.color || "var(--accent)";
  const pointerDragRef = useRef(null);

  function startPointerDrag(e) {
    if (task.done || e.pointerType === "mouse" || e.target.closest?.("button,input,textarea,select")) return;
    const startX = e.clientX, startY = e.clientY;
    let started = false;
    let ghost = null;
    const timer = setTimeout(() => {
      started = true;
      try { e.target.setPointerCapture?.(e.pointerId); } catch {}
      ghost = document.createElement("div");
      ghost.className = "task-mobile-drag-ghost";
      ghost.textContent = task.title;
      ghost.style.left = `${startX}px`;
      ghost.style.top = `${startY}px`;
      document.body.appendChild(ghost);
    }, EVENT_DRAG_HOLD_MS);
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cleanup);
      if (ghost?.parentNode) ghost.remove();
      pointerDragRef.current = null;
    }
    function move(me) {
      if (!started) {
        if (Math.hypot(me.clientX - startX, me.clientY - startY) > EVENT_DRAG_MOVE_CANCEL_PX) cleanup();
        return;
      }
      me.preventDefault();
      if (ghost) { ghost.style.left = `${me.clientX}px`; ghost.style.top = `${me.clientY}px`; }
      document.querySelectorAll(".task-period-card.drag-touch-over").forEach(el => el.classList.remove("drag-touch-over"));
      document.elementFromPoint(me.clientX, me.clientY)?.closest?.(".task-period-card")?.classList.add("drag-touch-over");
    }
    function up(ue) {
      const wasStarted = started;
      const target = document.elementFromPoint(ue.clientX, ue.clientY)?.closest?.(".task-period-card");
      const scope = target?.getAttribute("data-task-scope");
      const anchor = target?.getAttribute("data-period-anchor");
      cleanup();
      document.querySelectorAll(".task-period-card.drag-touch-over").forEach(el => el.classList.remove("drag-touch-over"));
      if (wasStarted && scope && anchor) {
        window.dispatchEvent(new CustomEvent("tempo-mobile-task-drop", { detail: { id: task.id, scope, anchor } }));
      }
    }
    pointerDragRef.current = { cleanup };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cleanup);
  }

  function onDragStart(e) {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/tempo-task", JSON.stringify({
      id: task.id, title: task.title, duration: task.duration,
      category: task.category, color: cat?.color || null,
    }));
    const ghost = document.createElement("div");
    ghost.style.cssText = `position:fixed;top:-200px;left:0;padding:7px 12px;border-radius:10px;background:${cat?.color || "#FF7BAC"}20;border-left:3px solid ${cat?.color || "#FF7BAC"};font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;color:${cat?.color || "#FF7BAC"};white-space:nowrap;`;
    ghost.textContent = `${task.title} (${formatTaskDuration(task.duration)})`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 14);
    setTimeout(() => ghost.remove(), 0);
  }

  return (
    <div className={`task-item ${task.done ? "done" : ""}`} data-priority={task.priority}
      draggable={!task.done} onDragStart={!task.done ? onDragStart : undefined} onPointerDown={!task.done ? startPointerDrag : undefined}>
      {!task.done && <span className="task-drag-handle" title="Drag to schedule">⠿</span>}
      <button className="task-check" onClick={() => onToggle(task.id)} aria-label={task.done ? "Mark incomplete" : "Mark complete"} aria-pressed={task.done}>{task.done ? "✓" : ""}</button>
      <div className="task-body" onClick={() => setExpanded(v => !v)}>
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span style={{ color: cat?.color }}>{cat?.icon} {cat?.label}</span>
          <span>{formatTaskDuration(task.duration)}</span>
          {task.recurrence && <span>↻ {Core.formatRecurrence(task.recurrence)}</span>}
          {Core.taskReminderPresetId(task.reminder) !== "none" && <span>🔔 {Core.formatTaskReminder(task.reminder)}</span>}
          {task.scheduledStart && <span>📅 {fmt(new Date(task.scheduledStart))}</span>}
          {pri && <span style={{ color: pri.color }}>{pri.icon} {pri.label}</span>}
          {task.deadline && <span className="deadline">due {task.deadline.slice(5)}</span>}
          {task.notes && <span title={task.notes}>📝</span>}
        </div>
        {expanded && task.notes && <div className="task-notes">{task.notes}</div>}
      </div>
      <button className="pomo-btn" onClick={() => onEdit(task)} title="Edit task">✎</button>
      {!task.done && <button className="pomo-btn" onClick={() => onScheduleTask?.(task)} title="Schedule this task">📅</button>}
      {!task.done && <button className="pomo-btn" onClick={() => onStartPomodoro(task.id)} title="Start Pomodoro">⏱</button>}
    </div>
  );
}

// ─── Task Panel ───────────────────────────────────────────────────────────────
export function TaskPanel({ tasks, categories, onToggle, onAdd, onEdit, onStartPomodoro, onScheduleTask, scope, setScope, periodDate = TODAY, setPeriodDate = () => {}, standalone = false, mobileOpen = false, onMobileClose }) {
  const TASK_PANEL_DEFAULT_WIDTH = 295;
  const TASK_PANEL_MIN_WIDTH = 240;
  const TASK_PANEL_MAX_WIDTH = 560;
  const TASK_PANEL_STORAGE_KEY = "tempo_task_panel_width";
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding]       = useState(false);
  const [panelWidth, setPanelWidth] = useState(TASK_PANEL_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [durationDraft, setDurationDraft] = useState({ amount: 30, unit: "minutes" });
  const [form, setForm]           = useState({ title: "", duration: 30, category: "deep", scope, deadline: "", priority: "medium", notes: "", recurrence: null, reminder: { type: "none", time: "" } });
  useEffect(() => {
    if (adding) setForm(f => ({ ...f, scope }));
  }, [adding, scope]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedWidth = Number(window.localStorage.getItem(TASK_PANEL_STORAGE_KEY));
    if (Number.isFinite(savedWidth)) {
      setPanelWidth(Math.max(TASK_PANEL_MIN_WIDTH, Math.min(TASK_PANEL_MAX_WIDTH, savedWidth)));
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("tempo-resizing-task-panel", isResizing);
    return () => document.body.classList.remove("tempo-resizing-task-panel");
  }, [isResizing]);

  function startPanelResize(e) {
    if (standalone || collapsed) return;
    if (typeof window !== "undefined" && window.innerWidth <= 768) return;
    if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = panelWidth;
    const maxWidth = typeof window !== "undefined"
      ? Math.min(TASK_PANEL_MAX_WIDTH, Math.max(TASK_PANEL_MIN_WIDTH, window.innerWidth - 420))
      : TASK_PANEL_MAX_WIDTH;

    setIsResizing(true);

    function applyWidth(clientX) {
      const nextWidth = Math.round(Math.max(TASK_PANEL_MIN_WIDTH, Math.min(maxWidth, startWidth + (startX - clientX))));
      setPanelWidth(nextWidth);
      try { window.localStorage.setItem(TASK_PANEL_STORAGE_KEY, String(nextWidth)); } catch {}
    }

    function onMove(moveEvent) {
      moveEvent.preventDefault();
      applyWidth(moveEvent.clientX);
    }

    function stopResize() {
      setIsResizing(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  }

  const taskPanelStyle = !standalone && !collapsed ? { width: `${panelWidth}px` } : undefined;
  const filtered = tasks.filter(t => taskBelongsToPeriod(t, scope, periodDate));
  const openTasks = filtered.filter(t => !t.done);
  const urgent   = tasks.filter(t => !t.done && t.deadline && (localDateFromKey(t.deadline) || new Date(t.deadline)) <= new Date(TODAY.getTime() + 3 * 86400000));
  function handleAdd() {
    if (!form.title.trim()) return;
    const duration = taskDurationToMinutes(durationDraft.amount, durationDraft.unit);
    onAdd(withTaskPeriod({ ...form, title: form.title.trim(), duration, id: "t" + uid(), done: false, completedAt: null, completedDate: null }, periodDate));
    setForm({ title: "", duration: 30, category: "deep", scope, deadline: "", priority: "medium", notes: "", recurrence: null, reminder: { type: "none", time: "" } });
    setDurationDraft({ amount: 30, unit: "minutes" });
    setAdding(false);
  }
  return (
    <div className={`task-panel ${collapsed ? "collapsed" : ""} ${standalone ? "standalone" : ""} ${mobileOpen ? "mobile-open" : ""} ${isResizing ? "resizing" : ""}`} style={taskPanelStyle}>
      {!standalone && !collapsed && <div className="task-panel-resize-handle" onPointerDown={startPanelResize} role="separator" aria-orientation="vertical" aria-label="Resize task panel" title="Drag to resize task panel" />}
      {!standalone && <button className="task-panel-toggle" onClick={() => setCollapsed(v => !v)} title={collapsed ? "Expand tasks" : "Collapse tasks"}>{collapsed ? "‹" : "›"}</button>}
      <div className="task-panel-inner">
        <div className="panel-header">
          <span className="panel-title">Tasks</span>
          {urgent.length > 0 && <span className="urgent-badge">⚠️ {urgent.length}</span>}
          {!standalone && <div className="scope-tabs">{["day","week","month"].map(s => <button key={s} className={`scope-tab ${scope === s ? "active" : ""}`} onClick={() => setScope(s)}>{s}</button>)}</div>}
          {standalone && <div className="scope-tabs">{["day","week","month"].map(s => <button key={s} className={`scope-tab ${scope === s ? "active" : ""}`} onClick={() => setScope(s)}>{s}</button>)}</div>}
          <button className="add-btn" onClick={() => setAdding(v => !v)}>+</button>
          {onMobileClose && <button className="add-btn" onClick={onMobileClose}>✕</button>}
        </div>
        <div className="task-period-nav">
          <button className="period-btn" onClick={() => setPeriodDate(d => shiftTaskPeriodDate(d, scope, -1))}>‹</button>
          <button className="period-label" onClick={() => setPeriodDate(new Date(TODAY))}>{formatTaskPeriodLabel(scope, periodDate)}</button>
          <button className="period-btn" onClick={() => setPeriodDate(d => shiftTaskPeriodDate(d, scope, 1))}>›</button>
        </div>
      {adding && (
        <div className="task-form">
          <input className="tf-input" placeholder="Task name..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <div className="tf-row">
            <select className="tf-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select>
            <select className="tf-select" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select>
          </div>
          <div className="task-period-hint">Saving to {form.scope === "week" ? "week" : form.scope === "month" ? "month" : "day"}: {formatTaskPeriodLabel(form.scope, periodDate)}</div>
          <div className="tf-row">
            <select className="tf-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}</select>
            <input type="date" className="tf-input tf-date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <div className="tf-row">
            <div className="tf-duration"><span>⏱</span><input type="number" className="tf-num" value={durationDraft.amount} min={1} step={durationDraft.unit === "minutes" ? 5 : 1} onChange={e => setDurationDraft(d => ({ ...d, amount: Number(e.target.value) || 1 }))}/><select className="tf-select" value={durationDraft.unit} onChange={e => setDurationDraft(d => ({ ...d, unit: e.target.value }))}><option value="minutes">min</option><option value="hours">hours</option><option value="days">days</option></select></div>
          </div>
          <div className="tf-row">
            <TaskRecurrenceSelect compact value={form.recurrence} anchorDate={periodDate} onChange={recurrence => setForm(f => ({ ...f, recurrence }))} />
          </div>
          <div className="tf-row">
            <TaskReminderFields compact value={form.reminder} onChange={reminder => setForm(f => ({ ...f, reminder }))} />
          </div>
          <textarea className="tf-input tf-notes" placeholder="Notes (optional)..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="tf-actions"><button className="tf-cancel" onClick={() => setAdding(false)}>Cancel</button><button className="tf-save" onClick={handleAdd}>Add task</button></div>
        </div>
      )}
      <div className="task-list">
        {openTasks.length === 0 ? (
          <div className="task-empty-state">
            <img src="/empty-tasks.png" alt="" draggable="false" />
            <div className="empty-state-title">All clear! No tasks for now. Enjoy the free time 🌸</div>
          </div>
        ) : (
          [...filtered].sort((a, b) => ({high:0,medium:1,low:2}[a.priority]??1) - ({high:0,medium:1,low:2}[b.priority]??1)).map(t => <TaskItem key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} onStartPomodoro={onStartPomodoro} onScheduleTask={onScheduleTask} categories={categories} />)
        )}
      </div>
      <div className="task-footer"><span>{filtered.filter(t => !t.done).length} remaining</span><span>{filtered.filter(t => t.done).length} done ✅</span></div>
      </div>
    </div>
  );
}

export function TaskModal({ task, categories, onClose, onSave, onDelete }) {
  const initial = splitTaskDuration(task.duration);
  const [form, setForm] = useState({ ...task, deadline: task.deadline || "", recurrence: task.recurrence || null, reminder: Core.normalizeTaskReminder(task.reminder) });
  const [durationDraft, setDurationDraft] = useState(initial);
  const [periodDate, setPeriodDate] = useState(taskAnchorDate(task, TODAY));
  function saveTask() {
    if (!form.title.trim()) return;
    const becameDone = Boolean(form.done) && !Boolean(task.done);
    const stayedDone = Boolean(form.done) && Boolean(task.done);
    const perioded = withTaskPeriod({
      ...form,
      title: form.title.trim(),
      duration: taskDurationToMinutes(durationDraft.amount, durationDraft.unit),
    }, periodDate);
    const completionKey = taskCompletionTargetKey(perioded);
    onSave({
      ...perioded,
      completedAt: Boolean(form.done) ? (becameDone ? new Date().toISOString() : (stayedDone ? (task.completedAt || new Date().toISOString()) : new Date().toISOString())) : null,
      completedDate: Boolean(form.done) ? (taskScopeOf(perioded) === "day" ? completionKey : (becameDone ? completionKey : (task.completedDate || taskCompletedDateKey(task) || completionKey))) : null,
    });
    onClose();
  }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit task">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <input className="modal-title-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" autoFocus />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div className="modal-row"><label>Scope</label><select className="modal-select" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></div>
          <div className="modal-row"><label>{form.scope === "week" ? "Week" : form.scope === "month" ? "Month" : "Day"}</label>{form.scope === "month" ? <input type="month" className="modal-select" value={monthKey(periodDate)} onChange={e => setPeriodDate(localDateFromMonthKey(e.target.value) || new Date(TODAY))}/> : <input type="date" className="modal-select" value={dateKey(periodDate)} onChange={e => setPeriodDate(localDateFromKey(e.target.value) || new Date(TODAY))}/>}</div>
          <div className="modal-row"><label>Priority</label><select className="modal-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}</select></div>
          <div className="modal-row"><label>Duration</label><input type="number" className="modal-select modal-time" min={1} value={durationDraft.amount} onChange={e => setDurationDraft(d => ({ ...d, amount: Number(e.target.value) || 1 }))}/><select className="modal-select" value={durationDraft.unit} onChange={e => setDurationDraft(d => ({ ...d, unit: e.target.value }))}><option value="minutes">minutes</option><option value="hours">hours</option><option value="days">days</option></select></div>
          <div className="modal-row"><label>Deadline</label><input type="date" className="modal-select" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}/></div>
          <div className="modal-row"><label>Recurrence</label><TaskRecurrenceSelect value={form.recurrence} anchorDate={periodDate} onChange={recurrence => setForm(f => ({ ...f, recurrence }))} /></div>
          <div className="modal-row"><label>Reminder</label><TaskReminderFields value={form.reminder} onChange={reminder => setForm(f => ({ ...f, reminder }))} /></div>
          <div className="modal-row"><label>Done</label><input type="checkbox" checked={Boolean(form.done)} onChange={e => setForm(f => ({ ...f, done: e.target.checked }))}/></div>
          <div className="modal-row modal-col"><label>Notes</label><textarea className="modal-textarea" rows={3} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/></div>
        </div>
        <div className="modal-footer">{onDelete && <button className="modal-delete" onClick={() => { onDelete(task.id); onClose(); }}>🗑️ Delete</button>}<div style={{ display: "flex", gap: 8 }}><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" onClick={saveTask}>Save changes</button></div></div>
      </div>
    </div>
  );
}

export function TaskPeriodCard({ cardScope, tasks, categories, periodDate, setPeriodDate, onToggle, onEdit, onStartPomodoro, onScheduleTask, onAdd, onMoveTaskPeriod, onSelectScope }) {
  const [isOver, setIsOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [durationDraft, setDurationDraft] = useState({ amount: 30, unit: "minutes" });
  const [form, setForm] = useState({ title: "", category: "deep", priority: "medium", deadline: "", notes: "", recurrence: null, reminder: { type: "none", time: "" } });
  const filtered = tasks.filter(t => taskBelongsToPeriod(t, cardScope, periodDate));
  const sorted = [...filtered].sort((a, b) => Number(a.done) - Number(b.done) || (({high:0,medium:1,low:2}[a.priority]??1) - ({high:0,medium:1,low:2}[b.priority]??1)));
  const openCount = filtered.filter(t => !t.done).length;

  function addCardTask() {
    if (!form.title.trim()) return;
    const duration = taskDurationToMinutes(durationDraft.amount, durationDraft.unit);
    onAdd(withTaskPeriod({ ...form, id: "t" + uid(), title: form.title.trim(), duration, scope: cardScope, done: false, completedAt: null, completedDate: null }, periodDate));
    setForm({ title: "", category: "deep", priority: "medium", deadline: "", notes: "", recurrence: null, reminder: { type: "none", time: "" } });
    setDurationDraft({ amount: 30, unit: "minutes" });
    setAdding(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsOver(false);
    const raw = e.dataTransfer.getData("application/tempo-task");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      if (payload?.id) onMoveTaskPeriod(payload.id, cardScope, periodDate);
    } catch {}
  }

  return (
    <div className={`task-period-card ${isOver ? "drag-over" : ""}`} data-task-scope={cardScope} data-period-anchor={dateKey(periodDate)} onDragOver={e => { e.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)} onDrop={handleDrop}>
      <div className="task-period-card-head">
        <button className="task-period-card-title" onClick={() => onSelectScope(cardScope)}>{cardScope === "day" ? "☀️ Day" : cardScope === "week" ? "🗓️ Week" : "🌙 Month"}</button>
        <span className="task-period-count">{openCount} open</span>
      </div>
      <div className="task-period-card-sub card-nav-inline">
        <button type="button" onClick={() => setPeriodDate(d => shiftTaskPeriodDate(d, cardScope, -1))}>‹</button>
        <span>{formatTaskPeriodLabel(cardScope, periodDate)}</span>
        <button type="button" onClick={() => setPeriodDate(d => shiftTaskPeriodDate(d, cardScope, 1))}>›</button>
      </div>
      <button className="task-card-add" onClick={() => setAdding(v => !v)}>+ Add {cardScope} task</button>
      {adding && (
        <div className="task-form task-card-form">
          <input className="tf-input" placeholder="Task name..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <div className="tf-row">
            <select className="tf-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select>
            <select className="tf-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}</select>
          </div>
          <div className="tf-row">
            <div className="tf-duration"><span>⏱</span><input type="number" className="tf-num" value={durationDraft.amount} min={1} step={durationDraft.unit === "minutes" ? 5 : 1} onChange={e => setDurationDraft(d => ({ ...d, amount: Number(e.target.value) || 1 }))}/><select className="tf-select" value={durationDraft.unit} onChange={e => setDurationDraft(d => ({ ...d, unit: e.target.value }))}><option value="minutes">min</option><option value="hours">hours</option><option value="days">days</option></select></div>
          </div>
          <div className="tf-row">
            <TaskRecurrenceSelect compact value={form.recurrence} anchorDate={periodDate} onChange={recurrence => setForm(f => ({ ...f, recurrence }))} />
          </div>
          <div className="tf-row">
            <TaskReminderFields compact value={form.reminder} onChange={reminder => setForm(f => ({ ...f, reminder }))} />
          </div>
          <textarea className="tf-input tf-notes" placeholder="Notes (optional)..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="tf-actions"><button className="tf-cancel" onClick={() => setAdding(false)}>Cancel</button><button className="tf-save" onClick={addCardTask}>Add task</button></div>
        </div>
      )}
      <div className="task-period-list">
        {sorted.length ? sorted.map(t => <div key={t.id} className="task-card-with-move"><TaskItem task={t} onToggle={onToggle} onEdit={onEdit} onStartPomodoro={onStartPomodoro} onScheduleTask={onScheduleTask} categories={categories} />{cardScope !== "day" && <button className="mini-move-btn" onClick={() => onMoveTaskPeriod(t.id, "day", new Date(TODAY))}>Move to Day</button>}{cardScope !== "week" && <button className="mini-move-btn" onClick={() => onMoveTaskPeriod(t.id, "week", new Date(TODAY))}>Move to Week</button>}{cardScope !== "month" && <button className="mini-move-btn" onClick={() => onMoveTaskPeriod(t.id, "month", new Date(TODAY))}>Move to Month</button>}</div>) : <div className="task-card-empty">No tasks here yet 🌸<br/><small>Drop a task here or add one small task.</small></div>}
      </div>
    </div>
  );
}

export function TasksPage({ tasks, categories, onToggle, onAdd, onEdit, onStartPomodoro, onScheduleTask, scope, setScope, periodDate, setPeriodDate, onMoveTaskPeriod, gameStats }) {
  useEffect(() => {
    const handler = e => {
      const { id, scope: targetScope, anchor } = e.detail || {};
      const anchorDate = localDateFromKey(anchor) || periodDate;
      if (id && targetScope) onMoveTaskPeriod(id, targetScope, anchorDate);
    };
    window.addEventListener("tempo-mobile-task-drop", handler);
    return () => window.removeEventListener("tempo-mobile-task-drop", handler);
  }, [onMoveTaskPeriod, periodDate]);
  return (
    <div className="tasks-page">
      <div className="journal-header">
        <div>
          <div className="journal-title">✅ Tasks</div>
          <div className="memory-book-subtitle">Drag a task into Day, Week, or Month to move it there.</div>
        </div>
        <div className="journal-streak">{tasks.filter(t => !t.done).length} open</div>
      </div>
      <div className="task-period-board">
        {["day", "week", "month"].map(s => (
          <TaskPeriodCard key={s} cardScope={s} tasks={tasks} categories={categories} periodDate={periodDate} setPeriodDate={setPeriodDate} onToggle={onToggle} onEdit={onEdit} onStartPomodoro={onStartPomodoro} onScheduleTask={onScheduleTask} onAdd={onAdd} onMoveTaskPeriod={onMoveTaskPeriod} onSelectScope={next => setScope(next)} />
        ))}
      </div>
    </div>
  );
}


// ─── Event Modal ──────────────────────────────────────────────────────────────
