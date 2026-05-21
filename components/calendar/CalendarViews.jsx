import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as Core from "../../lib/tempo/core";
const { makeRecurringTaskOccurrence, taskOccurrenceFallsInPeriod, ensureRecurringTasksForPeriod, stepRecurringDate, weeksBetween, shouldEmitOccurrence, applyOccurrenceExceptions, deleteSingleOccurrence, modifySingleOccurrence, createFollowingSeries, createNextRecurringTask, expandRecurring, parseTimeStr, parseTimeRange, parseDur, parseDateRef, parseDateMention, parseDayWindow, fitFreeSlot, eventFromWindow, cleanTitle, inferCategory, buildGreeting, processMessage, deriveMemoryCryptoKey, encryptMemoryJournalForStorage, decryptMemoryJournalFromStorage, saveJournalLocal, loadJournalLocal, readFileAsDataUrl, prepareJournalPhotosFromFiles, DAY_START, DAY_END, HOUR_H, RECURRENCE_WINDOW_DAYS, RECURRENCE_SAFETY_LIMIT, UNDO_STACK_MAX, CLOUD_FALLBACK_MS, CHAT_REPLY_DELAY_MS, EVENT_DRAG_HOLD_MS, EVENT_DRAG_MOVE_CANCEL_PX, CALENDARS, CATEGORIES, PRIORITIES, normalizeCategories, FONT_SIZES, THEMES, DAY_TEMPLATES, TODAY, DEFAULT_TIMEZONE, setDisplayTimezoneCtx, formatWithDisplayTimezone, fmt, fmtDate, sameDay, fmtDay, minsToTime, dateKey, cloneDate, addDaysSafe, addMonthsSafe, dayStart, getEventsOnDay, weekStart, weekDays, monthDays, getFreeBlocks, totalMins, hasConflict, endOfDay, eventOccursOnDay, isAllDayEvent, isMultiDayEvent, isAllDayOrMulti, eventSegmentForDay, toDateInput, toTimeInputValue, applyDateAndTime, taskDurationToMinutes, splitTaskDuration, formatTaskDuration, localDateFromKey, localDateFromMonthKey, monthKey, taskScopeOf, taskAnchorDate, taskDayKey, taskWeekKey, taskMonthKey, taskPeriodPatchForScope, withTaskPeriod, normalizeTasks, taskBelongsToPeriod, shiftTaskPeriodDate, formatTaskPeriodLabel, taskCompletionTargetKey, taskHasCompletionStamp, taskCompletedDateKey, taskSeriesId, taskPeriodIdentity, taskSkippedPeriods, taskSamePeriod, taskExistsForPeriod, completedTasksForDateKey, LEVEL_TITLES, XP_PER_LEVEL, taskXPValue, dateRangeKeys, hasJournalEntryForKey, allDayTasksForKey, dailyGameSummary, productiveKeysFromData, plannedTomorrowKeysFromData, countBackwardStreak, buildDailyQuests, buildWeeklyRecap, buildWeeklyMissions, buildCombos, buildPersonalLeaderboard, buildRhythmPersonality, buildBadges, skillRank, buildSkillStats, MASCOT_STAGES, buildMascotProgression, THEME_UNLOCK_RULES, buildThemeUnlocksForStats, buildMonthlyLifeGarden, calculateGameStats, createCategoryId, isRecurringEvent, uid, setWorkHoursCtx, freeBlocks, SER, DES, save, load, reviveEvents, normalizeRecurrence, recurrenceDateKey, recurrenceEndDate, recurrenceSkippedDates, occurrenceId, getBaseEventId, isOccurrence, stripOccurrenceMeta, _t, INIT_EVENTS, _deadline, INIT_TASKS, hasStoredUserData, loadStoredEventsOrSeed, loadStoredTasksOrSeed, JOURNAL_MOODS, JOURNAL_ACTIVITIES, JOURNAL_PROMPTS, MEMORY_TAGS, SCRAPBOOK_STICKERS, MEMORY_ASSET_BASE, MEMORY_BACKGROUNDS, COZY_STICKER_PACK, memoryBackgroundById, memoryBackgroundStyle, normalizeMemoryEntry, sanitizeMemoryPhotoForStorage, sanitizeMemoryEntryForStorage, sanitizeMemoryJournalForStorage, normalizeMemoryJournalForState, isEncryptedMemoryJournal, memoryPhotoSrc, memoryEntryCover, memoryTagLabel, _displayTimezone, _workStart } = Core;

// ─── Overlap layout algorithm ─────────────────────────────────────────────────
// Returns a map of eventId -> { col, totalCols } for side-by-side rendering
export function computeColumns(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const cols = {}; // id -> col index
  const colEnds = []; // tracks end time of last event in each column

  for (const ev of sorted) {
    const startMs = ev.start.getTime(), endMs = ev.end.getTime();
    // Find first free column
    let col = colEnds.findIndex(end => end <= startMs);
    if (col === -1) { col = colEnds.length; colEnds.push(endMs); }
    else colEnds[col] = endMs;
    cols[ev.id] = col;
  }

  // Compute totalCols for each overlapping group
  const totalCols = {};
  for (const ev of sorted) {
    const col = cols[ev.id];
    // Find all events that overlap with this one
    const overlapping = sorted.filter(other =>
      other.id !== ev.id && other.start < ev.end && other.end > ev.start
    );
    const maxCol = Math.max(col, ...overlapping.map(o => cols[o.id]));
    totalCols[ev.id] = maxCol + 1;
  }
  return events.map(ev => ({ ...ev, _col: cols[ev.id] ?? 0, _totalCols: totalCols[ev.id] ?? 1 }));
}

// ─── Event Block (drag-to-reschedule) ────────────────────────────────────────
export function EventBlock({ event, calendars, categories, onReschedule, onClick }) {
  const cal  = calendars.find(c => c.id === event.calendar);
  const cat  = categories.find(c => c.id === event.category);
  const sh   = event.start.getHours() + event.start.getMinutes() / 60;
  const eh   = event.end.getHours()   + event.end.getMinutes()   / 60;
  const top  = (sh - DAY_START) * HOUR_H;
  const height = Math.max((eh - sh) * HOUR_H - 2, 22);
  const color  = event.color || cal?.color || "#FF7BAC";
  const draggable = !event.fixed;
  const ref = useRef(null);
  const suppressClick = useRef(false);
  const [holdState, setHoldState] = useState("idle");

  const col = event._col ?? 0;
  const totalCols = event._totalCols ?? 1;
  const widthPct = 100 / totalCols;
  const leftPct  = col * widthPct;
  const colStyle = totalCols > 1
    ? { left: `${leftPct}%`, width: `calc(${widthPct}% - 3px)`, right: "auto" }
    : {};

  function startPressHoldDrag(e) {
    if (!draggable || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, ot = top, dur = (event.end - event.start) / 60000;
    const pointerId = e.pointerId;
    let started = false;
    let latestEvent = e;
    let ghost = null;
    let tip = null;
    const el = ref.current;
    el?.setPointerCapture?.(pointerId);
    setHoldState("holding");
    const timer = setTimeout(() => {
      if (!ref.current) return;
      started = true;
      document.body.classList.add("tempo-dragging");
      suppressClick.current = true;
      setHoldState("dragging");
      const r = ref.current.getBoundingClientRect();
      ghost = document.createElement("div");
      ghost.style.cssText = `position:fixed;width:${r.width}px;height:${height}px;background:${color}40;border:2px dashed ${color};border-radius:12px;pointer-events:none;z-index:9999;left:${r.left}px;top:${r.top}px;display:flex;align-items:center;padding:8px 12px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;color:${color};`;
      ghost.textContent = event.title;
      document.body.appendChild(ghost);
      tip = document.createElement("div");
      tip.style.cssText = `position:fixed;background:#4A2840;color:white;padding:4px 10px;border-radius:8px;font-family:'Inconsolata',monospace;font-size:12px;font-weight:600;z-index:10000;pointer-events:none;`;
      document.body.appendChild(tip);
      move(latestEvent);
    }, EVENT_DRAG_HOLD_MS);
    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      el?.releasePointerCapture?.(pointerId);
      if (ghost?.parentNode) ghost.remove();
      if (tip?.parentNode) tip.remove();
      document.body.classList.remove("tempo-dragging");
      setHoldState("idle");
    }
    function cancel() { cleanup(); }
    function move(pe) {
      latestEvent = pe;
      if (!started && Math.hypot(pe.clientX - sx, pe.clientY - sy) > EVENT_DRAG_MOVE_CANCEL_PX) { cleanup(); return; }
      if (!started || !ghost || !tip || !ref.current) return;
      pe.preventDefault?.();
      const dy = pe.clientY - sy, nt = ot + dy;
      ghost.style.top = `${ref.current.getBoundingClientRect().top - (top - nt)}px`;
      const rm = nt / HOUR_H * 60 + DAY_START * 60, sm = Math.round(rm / 5) * 5, em = sm + dur;
      const f12 = (h, m) => { const ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h; return m === 0 ? `${hd}${ap}` : `${hd}:${m.toString().padStart(2,"0")}${ap}`; };
      tip.textContent = `Move event · ${f12(Math.floor(sm/60), sm%60)} – ${f12(Math.floor(em/60), em%60)}`;
      tip.style.left = `${pe.clientX + 12}px`; tip.style.top = `${pe.clientY - 10}px`;
    }
    function up(pe) {
      const wasStarted = started;
      cleanup();
      if (!wasStarted) return;
      const dy = pe.clientY - sy, nt = ot + dy, rm = nt / HOUR_H * 60 + DAY_START * 60, sm = Math.round(rm / 5) * 5, cm = Math.max(DAY_START * 60, Math.min(sm, (DAY_END - 1) * 60));
      const ns = new Date(event.start); ns.setHours(Math.floor(cm / 60), cm % 60, 0, 0);
      const ne = new Date(ns.getTime() + dur * 60000);
      if (ns.getTime() !== event.start.getTime()) onReschedule(event.id, ns, ne);
      setTimeout(() => { suppressClick.current = false; }, 80);
    }
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
  }

  function startResizeDrag(e) {
    if (!draggable || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.stopPropagation();
    const sy = e.clientY;
    const originalEnd = event.end instanceof Date ? event.end : new Date(event.end);
    const pointerId = e.pointerId;
    let ghost = null;
    let tip = null;
    const el = ref.current;
    el?.setPointerCapture?.(pointerId);
    document.body.classList.add("tempo-dragging");
    suppressClick.current = true;
    setHoldState("dragging");

    const f12 = (h, m) => { const ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h; return m === 0 ? `${hd}${ap}` : `${hd}:${m.toString().padStart(2,"0")}${ap}`; };
    function makeGhost() {
      if (ghost) return ghost;
      const r = ref.current?.getBoundingClientRect();
      if (!r) return null;
      ghost = document.createElement("div");
      ghost.style.cssText = `position:fixed;width:${r.width}px;height:${r.height}px;background:${color}35;border:2px dashed ${color};border-radius:12px;pointer-events:none;z-index:9999;left:${r.left}px;top:${r.top}px;`;
      document.body.appendChild(ghost);
      return ghost;
    }
    function makeTip() {
      if (tip) return tip;
      tip = document.createElement("div");
      tip.style.cssText = `position:fixed;background:#4A2840;color:white;padding:4px 10px;border-radius:8px;font-family:'Inconsolata',monospace;font-size:12px;font-weight:600;z-index:10000;pointer-events:none;`;
      document.body.appendChild(tip);
      return tip;
    }
    function nextEndFromPointer(pe) {
      const dy = pe.clientY - sy;
      const deltaMinutes = Math.round((dy / HOUR_H) * 60 / 5) * 5;
      const minEnd = new Date(event.start.getTime() + 15 * 60000);
      const dayLimit = cloneDate(event.start); dayLimit.setHours(DAY_END, 0, 0, 0);
      const candidate = new Date(originalEnd.getTime() + deltaMinutes * 60000);
      return new Date(Math.max(minEnd.getTime(), Math.min(dayLimit.getTime(), candidate.getTime())));
    }
    function move(pe) {
      pe.preventDefault?.();
      const ne = nextEndFromPointer(pe);
      const newHeight = Math.max((ne - event.start) / 60000 / 60 * HOUR_H - 2, 22);
      const g = makeGhost();
      if (g) g.style.height = `${newHeight}px`;
      const t = makeTip();
      t.textContent = `Extend event · ${fmt(event.start)} – ${f12(ne.getHours(), ne.getMinutes())}`;
      t.style.left = `${pe.clientX + 12}px`;
      t.style.top = `${pe.clientY - 10}px`;
    }
    function cleanup() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      el?.releasePointerCapture?.(pointerId);
      if (ghost?.parentNode) ghost.remove();
      if (tip?.parentNode) tip.remove();
      document.body.classList.remove("tempo-dragging");
      setHoldState("idle");
    }
    function cancel() { cleanup(); setTimeout(() => { suppressClick.current = false; }, 80); }
    function up(pe) {
      const ne = nextEndFromPointer(pe);
      cleanup();
      if (ne.getTime() !== event.end.getTime()) onReschedule(event.id, event.start, ne);
      setTimeout(() => { suppressClick.current = false; }, 80);
    }
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
  }

  return (
    <div ref={ref} className={`event-block ${event.fixed ? "fixed" : ""} hold-${holdState}`}
      onPointerDown={startPressHoldDrag}
      onClick={(e) => { e.stopPropagation(); if (suppressClick.current) { suppressClick.current = false; return; } onClick(event); }}
      style={{ top, height, color, borderLeft: `3px solid ${color}`, background: `${color}18`, ...colStyle, touchAction: draggable ? "none" : "auto" }}
      title={draggable ? "Tap to edit · Hold to move" : "Fixed event · Tap to edit"}>
      <div className="event-title">{event.title}</div>
      {height > 38 && <div className="event-time">{fmt(event.start)} - {fmt(event.end)}</div>}
      {cat && height > 55 && <div className="event-cat"><span>{cat.icon}</span> {cat.label}</div>}
      {event.fixed && <span className="fixed-badge">🔒</span>}
      {!event.fixed && <span className="hold-cue">{holdState === "holding" ? "Keep holding…" : holdState === "dragging" ? "Move event" : "Tap to edit · Hold to move"}</span>}
      {!event.fixed && <span className="event-resize-handle" onPointerDown={startResizeDrag} title="Drag to extend event" aria-label="Drag to extend event" />}
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
export function DayView({ events, calendars, categories, onReschedule, onEventClick, onDropTask, viewDate, onGridClick }) {
  const hours = []; for (let h = DAY_START; h < DAY_END; h++) hours.push(h);
  const now = new Date(); const nowTop = (now.getHours() + now.getMinutes() / 60 - DAY_START) * HOUR_H;
  const gridH = (DAY_END - DAY_START) * HOUR_H;
  const allDayEvents = events.filter(isAllDayOrMulti);
  const timedEvents = events.filter(e => !isAllDayOrMulti(e)).map(e => eventSegmentForDay(e, viewDate));
  const conflicts = timedEvents.filter(e => hasConflict(timedEvents, e));
  const hasEvents = events.length > 0;
  const scrollRef = useRef(null);
  const gridRef   = useRef(null);
  const [dropIndicator, setDropIndicator] = useState(null); // { top, label } while dragging over grid

  useEffect(() => {
    let el = scrollRef.current?.parentElement;
    while (el && !el.classList?.contains("calendar-pane")) el = el.parentElement;
    const scrollTo = Math.max(nowTop - 120, 8 * HOUR_H - 120);
    (el || document.querySelector(".calendar-pane"))?.scrollTo({ top: scrollTo, behavior: "smooth" });
  }, []);

  function snapToGrid(clientY) {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const rawMins = ((clientY - rect.top) / HOUR_H) * 60 + DAY_START * 60;
    const snapped = Math.round(rawMins / 15) * 15;
    const clamped = Math.max(DAY_START * 60, Math.min(snapped, (DAY_END - 1) * 60));
    const top = ((clamped / 60) - DAY_START) * HOUR_H;
    const h = Math.floor(clamped / 60), m = clamped % 60;
    const ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const label = m === 0 ? `${hd}${ap}` : `${hd}:${m.toString().padStart(2,"0")}${ap}`;
    return { top, mins: clamped, label };
  }

  function onDragOver(e) {
    if (!e.dataTransfer.types.includes("application/tempo-task")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const snap = snapToGrid(e.clientY);
    if (snap) setDropIndicator(snap);
  }

  function onDragLeave(e) {
    // Only clear if leaving the grid itself, not a child element
    if (!gridRef.current?.contains(e.relatedTarget)) setDropIndicator(null);
  }

  function onDrop(e) {
    e.preventDefault();
    setDropIndicator(null);
    const raw = e.dataTransfer.getData("application/tempo-task");
    if (!raw) return;
    const task = JSON.parse(raw);
    const snap = snapToGrid(e.clientY);
    if (!snap) return;
    const start = new Date(viewDate);
    start.setHours(Math.floor(snap.mins / 60), snap.mins % 60, 0, 0);
    const end = new Date(start.getTime() + task.duration * 60000);
    const cal = Core.isPersonalCategory(task.category) ? "personal" : "work";
    onDropTask({
      id: "e" + uid(),
      title: task.title,
      start, end,
      calendar: cal,
      category: task.category,
      fixed: false,
      color: task.color,
      notes: `From task: ${task.title}`,
      recurrence: null,
      fromTaskId: task.id,
    });
  }

  function handleGridClick(e) {
    // Ignore clicks on event blocks
    if (e.target.closest(".event-block")) return;
    const snap = snapToGrid(e.clientY);
    if (!snap) return;
    const clickDate = new Date(viewDate);
    clickDate.setHours(Math.floor(snap.mins / 60), snap.mins % 60, 0, 0);
    onGridClick(clickDate);
  }

  return (
    <div className="day-view" ref={scrollRef}>
      <div className="drag-hint">⠿ Drag events to reschedule · Click empty slot to add/paste event · Drag tasks from panel</div>
      {allDayEvents.length > 0 && (
        <div className="all-day-strip">
          <span className="all-day-label">All-day</span>
          <div className="all-day-list">
            {allDayEvents.map(e => {
              const cal = calendars.find(c => c.id === e.calendar);
              const color = e.color || cal?.color || "#FF7BAC";
              return <button key={e.id} className="all-day-chip" style={{ borderLeft: `3px solid ${color}`, background: `${color}18`, color }} onClick={() => onEventClick(e)}>{e._continuesBefore ? "‹ " : ""}{e.title}{e._continuesAfter ? " ›" : ""}</button>;
            })}
          </div>
        </div>
      )}
      {conflicts.length > 0 && <div className="conflict-banner">⚠️ {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""} — overlapping events</div>}
      <div className="day-grid" ref={gridRef} style={{ height: gridH }}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={handleGridClick}>
        {hours.map(h => {
          const label = h === 0 ? "12am" : h === 12 ? "12pm" : h === 24 ? "12am" : h > 12 ? `${h - 12}pm` : `${h}am`;
          return <div key={h} className="hour-row" style={{ top: (h - DAY_START) * HOUR_H }}><span className="hour-label">{label}</span><div className="hour-line" /></div>;
        })}
        {nowTop > 0 && nowTop < gridH && <div className="now-line" style={{ top: nowTop }}><div className="now-dot" /><div className="now-track" /></div>}
        {!hasEvents && (
          <div className="day-empty-state">
            <img src="/empty-calendar.png" alt="" draggable="false" />
            <div className="empty-state-title">Nothing scheduled — Tap anywhere to add an event 🌸</div>
          </div>
        )}
        {/* Drop indicator line */}
        {dropIndicator && (
          <div className="drop-indicator" style={{ top: dropIndicator.top }}>
            <div className="drop-indicator-dot" />
            <div className="drop-indicator-line" />
            <span className="drop-indicator-label">{dropIndicator.label}</span>
          </div>
        )}
        <div className="events-layer">{computeColumns(timedEvents).map(e => <EventBlock key={e.id} event={e} calendars={calendars} categories={categories} onReschedule={onReschedule} onClick={onEventClick} />)}</div>
      </div>
    </div>
  );
}

// ─── Week View (full timetable, like TimeTree) ────────────────────────────────
export function WeekEventBlock({ ev, dayIndex, rect, calendars, categories, onEventClick, onReschedule, gridRef, days }) {
  const cal = calendars.find(c => c.id === ev.calendar);
  const cat = categories.find(c => c.id === ev.category);
  const color = ev.color || cal?.color || "#FF7BAC";
  const sh = ev.start.getHours() + ev.start.getMinutes() / 60;
  const eh = ev.end.getHours() + ev.end.getMinutes() / 60;
  const top = (sh - DAY_START) * HOUR_H;
  const height = Math.max((eh - sh) * HOUR_H - 2, 20);
  const dayColumnWidth = `calc((100% - 48px) / 7)`;
  const col = ev._col ?? 0, total = ev._totalCols ?? 1;
  const subWidth = 100 / total, subLeft = col * subWidth;
  const left = `calc(48px + ${dayIndex} * ${dayColumnWidth} + (${dayColumnWidth} * ${subLeft / 100}))`;
  const width = `calc(${dayColumnWidth} * ${subWidth / 100} - 3px)`;
  const suppressClick = useRef(false);
  const ref = useRef(null);
  const [holdState, setHoldState] = useState("idle");

  function onPointerDown(e) {
    if (ev.fixed || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, dur = (ev.end - ev.start) / 60000;
    let started = false;
    let latestEvent = e;
    let ghost = null;
    let tip = null;
    const pointerId = e.pointerId;
    ref.current?.setPointerCapture?.(pointerId);
    setHoldState("holding");
    const timer = setTimeout(() => {
      if (!ref.current) return;
      started = true;
      document.body.classList.add("tempo-dragging");
      suppressClick.current = true;
      setHoldState("dragging");
      const r = ref.current.getBoundingClientRect();
      ghost = document.createElement("div");
      ghost.style.cssText = `position:fixed;width:${r.width}px;height:${height}px;background:${color}40;border:2px dashed ${color};border-radius:10px;pointer-events:none;z-index:9999;left:${r.left}px;top:${r.top}px;display:flex;align-items:center;padding:6px 8px;font-family:'Nunito',sans-serif;font-size:11px;font-weight:800;color:${color};`;
      ghost.textContent = ev.title;
      document.body.appendChild(ghost);
      tip = document.createElement("div");
      tip.style.cssText = `position:fixed;background:#4A2840;color:white;padding:4px 10px;border-radius:8px;font-family:'Inconsolata',monospace;font-size:12px;font-weight:600;z-index:10000;pointer-events:none;`;
      document.body.appendChild(tip);
      move(latestEvent);
    }, EVENT_DRAG_HOLD_MS);
    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", cancel);
      ref.current?.releasePointerCapture?.(pointerId);
      if (ghost?.parentNode) ghost.remove();
      if (tip?.parentNode) tip.remove();
      document.body.classList.remove("tempo-dragging");
      setHoldState("idle");
    }
    function cancel() { cleanup(); }
    function snap(pe) {
      if (!gridRef.current) return null;
      const g = gridRef.current.getBoundingClientRect();
      const dayW = (g.width - 48) / 7;
      const di = Math.max(0, Math.min(6, Math.floor((pe.clientX - g.left - 48) / dayW)));
      const rawMins = ((pe.clientY - g.top) / HOUR_H) * 60 + DAY_START * 60;
      const snapped = Math.round(rawMins / 15) * 15;
      const cm = Math.max(DAY_START * 60, Math.min(snapped, (DAY_END - 1) * 60));
      const ns = new Date(days[di]); ns.setHours(Math.floor(cm / 60), cm % 60, 0, 0);
      return { di, ns, ne: new Date(ns.getTime() + dur * 60000) };
    }
    function move(pe) {
      latestEvent = pe;
      if (!started && Math.hypot(pe.clientX - sx, pe.clientY - sy) > EVENT_DRAG_MOVE_CANCEL_PX) { cleanup(); return; }
      if (!started || !ghost || !tip) return;
      pe.preventDefault?.();
      const s = snap(pe);
      if (!s) return;
      ghost.style.left = `${pe.clientX - 40}px`; ghost.style.top = `${pe.clientY - 20}px`;
      tip.textContent = `Move event · ${fmt(s.ns)} – ${fmt(s.ne)}`;
      tip.style.left = `${pe.clientX + 12}px`; tip.style.top = `${pe.clientY - 10}px`;
    }
    function up(pe) {
      const wasStarted = started;
      cleanup();
      if (!wasStarted) return;
      const s = snap(pe);
      if (!s) return;
      if (s.ns.getTime() !== ev.start.getTime() || s.di !== dayIndex) onReschedule(ev.id, s.ns, s.ne);
      setTimeout(() => { suppressClick.current = false; }, 80);
    }
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
  }

  return (
    <div ref={ref} className={`wt-event hold-${holdState}`} onPointerDown={onPointerDown} onClick={e => { e.stopPropagation(); if (suppressClick.current) { suppressClick.current = false; return; } onEventClick(ev); }}
      style={{ top, height, color, background: `${color}18`, borderLeft: `3px solid ${color}`, left, width, cursor: ev.fixed ? "pointer" : "grab", touchAction: ev.fixed ? "auto" : "none" }}
      title={ev.fixed ? "Fixed · Click to edit" : "Tap to edit · Hold to move"}>
      <div className="wt-event-title">{ev.title}</div>
      {height > 30 && <div className="wt-event-time">{fmt(ev.start)} - {fmt(ev.end)}</div>}
      {height > 52 && cat && <div className="wt-event-cat">{cat.icon}</div>}
      {ev.fixed && <span className="fixed-badge">🔒</span>}
    </div>
  );
}

export function WeekView({ events, calendars, categories, onEventClick, viewDate, onDayClick, onGridClick, onReschedule }) {
  const days = weekDays(viewDate);
  const hours = []; for (let h = DAY_START; h < DAY_END; h++) hours.push(h);
  const now = new Date();
  const nowTop = (now.getHours() + now.getMinutes() / 60 - DAY_START) * HOUR_H;
  const gridH = (DAY_END - DAY_START) * HOUR_H;

  const scrollRef = useRef(null);
  const gridRef = useRef(null);
  useEffect(() => {
    let el = scrollRef.current?.parentElement;
    while (el && !el.classList?.contains("calendar-pane")) el = el.parentElement;
    const scrollTo = Math.max(nowTop - 120, 8 * HOUR_H - 120);
    (el || document.querySelector(".calendar-pane"))?.scrollTo({ top: scrollTo, behavior: "smooth" });
  }, []);

  function snapFromPoint(clientX, clientY) {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const dayW = (rect.width - 48) / 7;
    const di = Math.max(0, Math.min(6, Math.floor((clientX - rect.left - 48) / dayW)));
    const rawMins = ((clientY - rect.top) / HOUR_H) * 60 + DAY_START * 60;
    const snapped = Math.round(rawMins / 15) * 15;
    const cm = Math.max(DAY_START * 60, Math.min(snapped, (DAY_END - 1) * 60));
    const d = new Date(days[di]); d.setHours(Math.floor(cm / 60), cm % 60, 0, 0);
    return d;
  }
  function handleGridClick(e) {
    if (e.target.closest(".wt-event")) return;
    const d = snapFromPoint(e.clientX, e.clientY);
    if (d) onGridClick(d);
  }

  return (
    <div className="week-timetable" ref={scrollRef}>
      <div className="wt-header">
        <div className="wt-time-gutter" />
        {days.map((day, i) => {
          const isT = day.toDateString() === TODAY.toDateString();
          return (
            <div key={i} className={`wt-day-header ${isT ? "wt-today" : ""}`} onClick={() => onDayClick(day)}>
              <span className="wt-day-name">{formatWithDisplayTimezone(day, { weekday: "short" })}</span>
              <span className={`wt-day-num ${isT ? "wt-today-num" : ""}`}>{day.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div className="week-all-day-row">
        <div className="wt-time-gutter"><span className="all-day-mini-label">All-day</span></div>
        {days.map(day => {
          const dayEvents = events.filter(e => eventOccursOnDay(e, day) && isAllDayOrMulti(e));
          return <div key={dateKey(day)} className="week-all-day-cell">{dayEvents.slice(0,3).map(e => {
            const cal = calendars.find(c => c.id === e.calendar); const color = e.color || cal?.color || "#FF7BAC";
            return <button key={e.id} className="week-all-day-chip" style={{ background: `${color}18`, borderLeft: `3px solid ${color}`, color }} onClick={() => onEventClick(e)}>{e.title}</button>;
          })}</div>;
        })}
      </div>

      <div className="wt-grid" ref={gridRef} style={{ height: gridH + 32 }} onClick={handleGridClick}>
        {hours.map(h => {
          const label = h === 0 ? "12am" : h === 12 ? "12pm" : h > 12 ? `${h-12}pm` : `${h}am`;
          return (
            <div key={h} className="wt-hour-row" style={{ top: (h - DAY_START) * HOUR_H }}>
              <div className="wt-time-gutter"><span className="wt-hour-label">{label}</span></div>
              {days.map((_, i) => <div key={i} className="wt-hour-cell" />)}
            </div>
          );
        })}

        {nowTop > 0 && nowTop < gridH && (
          <div className="wt-now-line" style={{ top: nowTop }}>
            <div className="wt-time-gutter"><div className="now-dot" /></div>
            {days.map((_, i) => <div key={i} className="wt-now-track-cell" />)}
          </div>
        )}

        {days.map((day, di) => {
          const de = events
            .filter(e => eventOccursOnDay(e, day) && !isAllDayOrMulti(e))
            .map(e => eventSegmentForDay(e, day))
            .sort((a, b) => a.start - b.start);
          return computeColumns(de).map(ev => <WeekEventBlock key={`${ev.id}-${dateKey(day)}`} ev={ev} dayIndex={di} days={days} gridRef={gridRef} calendars={calendars} categories={categories} onEventClick={onEventClick} onReschedule={onReschedule} />);
        })}
      </div>
    </div>
  );
}


export function MonthEventRow({ event, color, onOpen, onReschedule }) {
  const suppressClick = useRef(false);
  const ref = useRef(null);
  const timerRef = useRef(null);
  const dragRef = useRef(null);

  function clearMonthDrag() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const state = dragRef.current;
    if (state?.ghost?.parentNode) state.ghost.remove();
    if (state) {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", cancelMonthDrag);
      window.removeEventListener("blur", cancelMonthDrag);
    }
    dragRef.current = null;
  }

  function cancelMonthDrag() {
    clearMonthDrag();
    setTimeout(() => { suppressClick.current = false; }, 80);
  }

  function startPressDrag(e) {
    if (event.fixed) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    suppressClick.current = false;
    dragRef.current = { startX, startY, started: false, ghost: null, pointerId: e.pointerId };

    timerRef.current = setTimeout(() => {
      const state = dragRef.current;
      if (!state || !ref.current) return;
      state.started = true;
      suppressClick.current = true;
      document.body.classList.add("dragging-event");
      const rect = ref.current.getBoundingClientRect();
      const ghost = ref.current.cloneNode(true);
      ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;pointer-events:none;z-index:10000;opacity:.84;box-shadow:var(--shadow-md);transform:translate(0,0);`;
      document.body.appendChild(ghost);
      state.ghost = ghost;
    }, EVENT_DRAG_HOLD_MS);

    document.addEventListener("pointermove", handlePointerMove, { passive: false });
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", cancelMonthDrag);
    window.addEventListener("blur", cancelMonthDrag);
  }

  function handlePointerMove(e) {
    const state = dragRef.current;
    if (!state) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.started && Math.hypot(dx, dy) > EVENT_DRAG_MOVE_CANCEL_PX) {
      clearMonthDrag();
      return;
    }
    if (!state.started || !state.ghost) return;
    e.preventDefault();
    state.ghost.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function handlePointerUp(e) {
    const state = dragRef.current;
    const wasStarted = Boolean(state?.started);
    const clientX = e.clientX;
    const clientY = e.clientY;
    clearMonthDrag();
    document.body.classList.remove("dragging-event");
    if (!wasStarted) return;
    const target = document.elementFromPoint(clientX, clientY)?.closest?.("[data-month-date]");
    const targetKey = target?.getAttribute("data-month-date");
    const targetDate = targetKey ? localDateFromKey(targetKey) : null;
    if (targetDate) {
      const dur = event.end - event.start;
      const ns = new Date(targetDate);
      ns.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0);
      onReschedule(event.id, ns, new Date(ns.getTime() + dur));
    }
    setTimeout(() => { suppressClick.current = false; }, 120);
  }

  return (
    <div ref={ref} className="month-event-row" onPointerDown={startPressDrag}
      style={{ background: `${color}20`, borderLeft: `2px solid ${color}`, color: "var(--text)", cursor: event.fixed ? "pointer" : "grab", touchAction: "none", userSelect: "none" }}
      onClick={ev => { ev.stopPropagation(); if (suppressClick.current) { suppressClick.current = false; return; } onOpen(event); }}
      title={event.fixed ? "Fixed · Click to edit" : "Tap to edit · Hold to move"}>
      <span className="month-event-time">{isAllDayEvent(event) ? "All day" : `${event.start.getHours()}:${String(event.start.getMinutes()).padStart(2,"0")}`}</span>
      <span className="month-event-name" style={{ color }}>{event.title}</span>
    </div>
  );
}


